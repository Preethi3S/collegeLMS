import { getVideoProgress, markModuleComplete, markVideoProgress } from '@/services/progress.service';
import CodeIcon from '@mui/icons-material/Code';
import { Box, Checkbox, FormControlLabel, LinearProgress, Link, Stack, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import YouTube from 'react-youtube';

const VideoModule = ({ courseId, moduleId, content, videoLength, codingQuestions, onComplete, onProgress }) => {
  const [watchTime, setWatchTime] = useState(0);
  const [percentWatched, setPercentWatched] = useState(0);
  const [resumeAt, setResumeAt] = useState(0);
  const [isManuallyCompleted, setIsManuallyCompleted] = useState(false);

  const playerRef = useRef(null);
  const progressInterval = useRef(null);
  const lastSentTime = useRef(0);

  // Helper to extract video ID from various YouTube URL formats
  const getYouTubeId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const videoId = getYouTubeId(content);

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

  const handleReady = (e) => {
    playerRef.current = e.target;
    if (resumeAt > 0) e.target.seekTo(resumeAt, true);
  };

  const getDuration = () => {
    if (videoLength > 0) return videoLength;
    return playerRef.current ? playerRef.current.getDuration() : 0;
  };

  const handlePlay = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);

    progressInterval.current = setInterval(async () => {
      if (!playerRef.current) return;
      const current = Math.floor(playerRef.current.getCurrentTime());
      const duration = getDuration() || 1;
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
        onProgress?.();
      }
    }, 10000); // every 10s
  };

  const handlePause = async () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (!playerRef.current) return;

    await markVideoProgress(courseId, moduleId, {
      watchTime: 0,
      percentWatched,
      totalLength: getDuration(),
      resumeAt: Math.floor(playerRef.current.getCurrentTime()),
    });
    onProgress?.();
  };

  const handleEnd = async () => {
    if (progressInterval.current) clearInterval(progressInterval.current);

    // Ensure we use the best duration available
    const finalDuration = getDuration();

    await markVideoProgress(courseId, moduleId, {
      watchTime: 0, // No watch time delta on end, just mark status
      percentWatched: 100,
      totalLength: finalDuration,
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

      {/* Manual Completion Checkbox */}
      {/* Manual Completion Checkbox - show only for coding modules */}
      {codingQuestions && codingQuestions.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#F5F7FA', borderRadius: 1, border: '1px solid #E8EEF5' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isManuallyCompleted}
                onChange={async (e) => {
                  const checked = e.target.checked;
                  setIsManuallyCompleted(checked);
                  if (checked) {
                    try {
                      await markModuleComplete(courseId, moduleId);
                    } catch (err) {
                      console.error('Failed to mark module complete', err);
                    }
                    onComplete?.();
                  }
                }}
                sx={{
                  color: '#0D47A1',
                  '&.Mui-checked': { color: '#00897B' },
                }}
              />
            }
            label={
              <Box sx={{ ml: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Mark Coding Challenges Completed
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Check when you've solved the coding challenges for this module
                </Typography>
              </Box>
            }
          />
        </Box>
      )}

      {/* Coding Questions Section */}
      {codingQuestions && codingQuestions.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0D47A1', display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon sx={{ fontSize: 24 }} />
            💻 Coding Challenges
          </Typography>
          {codingQuestions.map((cq, index) => (
            <Box key={index} sx={{ p: 2.5, bgcolor: '#E3F2FD', borderRadius: 1, border: '2px solid #0D47A1' }}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0D47A1', mb: 1 }}>
                    {index + 1}. {cq.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#333', mb: 2 }}>
                    Solve this coding challenge to practice what you've learned:
                  </Typography>
                  <Link
                    href={cq.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'inline-block',
                      px: 2,
                      py: 1,
                      bgcolor: '#0D47A1',
                      color: '#fff',
                      textDecoration: 'none',
                      borderRadius: 1,
                      fontWeight: 600,
                      transition: 'all 0.3s',
                      '&:hover': {
                        bgcolor: '#00897B',
                        boxShadow: '0 4px 8px rgba(0, 137, 123, 0.3)',
                      },
                    }}
                  >
                    Solve Challenge →
                  </Link>
                </Box>
              </Stack>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default VideoModule;
