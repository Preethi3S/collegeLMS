import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import { getCourse } from '@/services/course.service';
import { getProgress } from '@/services/progress.service';
import VideoModule from '@/components/modules/VideoModule';

const CoursePage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!courseId) {
        console.warn('⚠️ CoursePage: courseId is undefined, check your route path!');
        return;
      }
      try {
        setLoading(true);
        const courseRes = await getCourse(courseId);
        setCourse(courseRes.course);
        const progressRes = await getProgress(courseId);
        setProgress(progressRes.progress);
      } catch (err: any) {
        console.error('Error loading course or progress', err);
        setError(err.response?.data?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const refreshProgress = async () => {
    if (!courseId) return;
    try {
      const updated = await getProgress(courseId);
      setProgress(updated.progress);
    } catch (err) {
      console.error('Error refreshing progress', err);
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 5 }} />;
  if (error) return <Typography color="error" textAlign="center" sx={{ mt: 5 }}>{error}</Typography>;
  if (!course) return <Typography textAlign="center" sx={{ mt: 5 }}>Course not found.</Typography>;

  const isModuleCompleted = (moduleId: string) =>
    progress?.levels?.some((lvl: any) => lvl.moduleProgress.some((m: any) => m.moduleId === moduleId && m.completed));

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>{course.title}</Typography>
      {course.levels.map((level: any) => (
        <Box key={level._id} sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>{level.title}</Typography>
          {level.modules.map((module: any) => (
            <Paper
              key={module._id}
              sx={{
                p: 2, mb: 2,
                backgroundColor: isModuleCompleted(module._id) ? 'success.light' : 'grey.100',
              }}
            >
              <Typography variant="h6" gutterBottom>{module.title}</Typography>
              <VideoModule
                courseId={course._id}
                moduleId={module._id}
                content={module.content}
                videoLength={module.videoLength}
                onComplete={refreshProgress}
              />
              {progress && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  {Math.round(
                    progress.levels.flatMap((l: any) => l.moduleProgress)
                      .find((m: any) => m.moduleId === module._id)?.percentWatched || 0
                  )}% watched
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      ))}
      {progress && (
        <Typography sx={{ mt: 3 }}>
          Overall Progress: {progress.overallProgress}% | Total Watch Time:{' '}
          {Math.round(progress.totalWatchTime / 60)} mins
        </Typography>
      )}
    </Box>
  );
};

export default CoursePage;
