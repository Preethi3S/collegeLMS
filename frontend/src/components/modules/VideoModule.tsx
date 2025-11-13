import React, { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube';
import { Box, LinearProgress, Typography } from '@mui/material';
import { markVideoProgress, getVideoProgress } from '@/services/progress.service';

interface Props {
  courseId: string;
  moduleId: string;
  content: string;
  videoLength: number;
  onComplete?: () => void;
}

const VideoModule: React.FC<Props> = ({ courseId, moduleId, content, videoLength, onComplete }) => {
  const [watchTime, setWatchTime] = useState(0);
  const [percentWatched, setPercentWatched] = useState(0);
  const [resumeAt, setResumeAt] = useState(0);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentTime = useRef(0);

  const videoId = content.includes('youtube.com')
    ? content.split('v=')[1]?.split('&')[0]
    : content;

  // Fetch resume progress
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await getVideoProgress(courseId, moduleId);
        if (res?.progress) {
          setResumeAt(res.progress.resumeAt || 0);
          setPercentWatched(res.progress.percentWatched || 0);
          setWatchTime(res.progress.resumeAt || 0);
          lastSentTime.current = res.progress.resumeAt || 0;
        }
      } catch (err) {
        console.error('Error fetching progress', err);
      }
    };
    fetchProgress();
  }, [courseId, moduleId]);

  const handleReady: YouTubeProps['onReady'] = (e) => {
    playerRef.current = e.target;
    if (resumeAt > 0) e.target.seekTo(resumeAt, true);
  };

  const handlePlay: YouTubeProps['onPlay'] = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);

    progressInterval.current = setInterval(async () => {
      if (!playerRef.current) return;
      const current = Math.floor(playerRef.current.getCurrentTime());
      const duration = videoLength || playerRef.current.getDuration() || 1;
      const percent = Math.min((current / duration) * 100, 100);

      setWatchTime(current);
      setPercentWatched(percent);

      const delta = current - lastSentTime.current;
      if (delta > 0) {
        await markVideoProgress(courseId, moduleId, {
          watchTime: delta,
          percentWatched: percent,
          totalLength: duration,
          resumeAt: current,
        });
        lastSentTime.current = current;
      }
    }, 10000); // every 10s
  };

  const handlePause: YouTubeProps['onPause'] = async () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (!playerRef.current) return;

    await markVideoProgress(courseId, moduleId, {
      watchTime: 0,
      percentWatched,
      totalLength: videoLength,
      resumeAt: Math.floor(playerRef.current.getCurrentTime()),
    });
  };

  const handleEnd: YouTubeProps['onEnd'] = async () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    await markVideoProgress(courseId, moduleId, {
      watchTime: videoLength,
      percentWatched: 100,
      totalLength: videoLength,
      resumeAt: 0,
    });
    onComplete?.();
  };

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {resumeAt > 0 && (
        <Typography variant="caption" color="primary">
          ▶ Continue from {Math.floor(resumeAt / 60)}m {Math.floor(resumeAt % 60)}s
        </Typography>
      )}

      <YouTube
        videoId={videoId}
        opts={{
          width: '100%',
          height: '450',
          playerVars: { controls: 1, rel: 0, modestbranding: 1 },
        }}
        onReady={handleReady}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnd={handleEnd}
      />

      <Box sx={{ mt: 2 }}>
        <LinearProgress variant="determinate" value={percentWatched} sx={{ height: 8, borderRadius: 1 }} />
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          Watched: {Math.round(percentWatched)}% ({Math.floor(watchTime / 60)}:
          {(watchTime % 60).toString().padStart(2, '0')})
        </Typography>
      </Box>
    </Box>
  );
};

export default VideoModule;
