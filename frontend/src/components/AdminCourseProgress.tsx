import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import { getCourse } from '@/services/course.service';
import api from '@/services/api';

interface StudentAnalytics {
  student: {
    firstName: string;
    lastName: string;
    email: string;
    rollNumber: string;
  };
  overallProgress: number;
  totalWatchTime: number;
  completionDuration: number;
  lastAccessedAt: string;
}

const AdminCourseProgress: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const [course, setCourse] = useState<any>(null);
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { course } = await getCourse(courseId!);
        setCourse(course);

        const res = await api.get(`/progress/${courseId}/analytics`);
        setAnalytics(res.data.analytics);
      } catch (err) {
        console.error('Error loading analytics', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  if (loading)
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        📊 {course?.title || 'Course'} — Progress Analytics
      </Typography>

      {!analytics.length ? (
        <Typography>No student progress data yet.</Typography>
      ) : (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Roll No</TableCell>
                <TableCell align="center">Progress</TableCell>
                <TableCell align="center">Watch Time (mins)</TableCell>
                <TableCell align="center">Last Access</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics.map((a, i) => (
                <TableRow key={i}>
                  <TableCell>
                    {a.student?.firstName} {a.student?.lastName}
                  </TableCell>
                  <TableCell>{a.student?.email}</TableCell>
                  <TableCell>{a.student?.rollNumber || '—'}</TableCell>
                  <TableCell align="center" sx={{ width: 200 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={a.overallProgress}
                        sx={{ flex: 1, height: 8, borderRadius: 1 }}
                      />
                      <Typography variant="body2">
                        {a.overallProgress}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {Math.round(a.totalWatchTime / 60)}
                  </TableCell>
                  <TableCell align="center">
                    {a.lastAccessedAt
                      ? new Date(a.lastAccessedAt).toLocaleString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

export default AdminCourseProgress;
