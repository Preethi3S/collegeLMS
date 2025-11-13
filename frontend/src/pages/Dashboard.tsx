import CourseCard from '@/components/CourseCard';
import useAuthStore from '@/context/auth.store';
import { getCourses, getEnrolledCourses } from '@/services/course.service';
import { getProgress } from '@/services/progress.service';
import {
  Container,
  Grid,
  Typography,
  Box,
  LinearProgress,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { data: availableCourses, isLoading: loadingAvailable } = useQuery(
    ['availableCourses'],
    () => getCourses(true)
  );
  const { data: enrolledCourses, isLoading: loadingEnrolled } = useQuery(
    ['enrolledCourses'],
    () => getEnrolledCourses()
  );

  const [progressMap, setProgressMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!enrolledCourses) return;
      const results = await Promise.all(
        enrolledCourses.map(async (course: any) => {
          try {
            const { progress } = await getProgress(course._id || course.id);
            return { id: course._id || course.id, progress };
          } catch {
            return { id: course._id || course.id, progress: null };
          }
        })
      );
      const map: Record<string, any> = {};
      for (const r of results) map[r.id] = r.progress;
      setProgressMap(map);
    };
    fetchProgressData();
  }, [enrolledCourses]);

  if (loadingAvailable || loadingEnrolled)
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 5 }} />;

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome{user ? `, ${user.firstName}` : ''}
      </Typography>

      {/* Enrolled Courses Section */}
      <Typography variant="h6" sx={{ mt: 3 }}>
        Your Courses
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {enrolledCourses?.length ? (
          enrolledCourses.map((course: any) => {
            const progress = progressMap[course._id || course.id];
            return (
              <Grid item xs={12} md={6} key={course._id || course.id}>
                <Paper
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    boxShadow: 1,
                    background: 'white',
                  }}
                >
                  <Typography variant="h6" fontWeight={600}>
                    {course.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Instructor: {course.instructor?.firstName} {course.instructor?.lastName}
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={progress?.overallProgress || 0}
                    sx={{
                      height: 8,
                      borderRadius: 5,
                      bgcolor: '#E5E7EB',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#10B981',
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                    Overall Progress: {Math.round(progress?.overallProgress || 0)}%
                  </Typography>

                  {progress?.totalWatchTime !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      Watch Time: {Math.round(progress.totalWatchTime / 60)} mins
                    </Typography>
                  )}
                </Paper>
              </Grid>
            );
          })
        ) : (
          <Typography sx={{ mt: 1 }}>You are not enrolled in any courses.</Typography>
        )}
      </Grid>

      {/* Available Courses Section */}
      <Typography variant="h6" sx={{ mt: 4 }}>
        Available Courses
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {availableCourses?.length ? (
          availableCourses.map((c: any) => (
            <Grid item xs={12} md={6} key={c._id || c.id}>
              <CourseCard course={{ ...c, id: c._id || c.id }} />
            </Grid>
          ))
        ) : (
          <Typography sx={{ mt: 1 }}>No courses available for your year.</Typography>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;
