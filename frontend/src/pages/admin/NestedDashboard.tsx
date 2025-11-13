import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  LinearProgress,
  Avatar,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { getCourses } from '@/services/course.service';
import api from '@/services/api';
import { listStudents } from '@/services/user.service';

type ViewLevel = 'year' | 'course' | 'department' | 'students';
const years = [1, 2, 3, 4];
const COLORS = ['#4B6CB7', '#67C8FF', '#10B981', '#F59E0B'];

const AdminNestedDashboard: React.FC = () => {
  const [level, setLevel] = useState<ViewLevel>('year');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // analyticsAll contains progress objects returned from GET /progress/:courseId/analytics
  const [analyticsAll, setAnalyticsAll] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch courses by year ---
  useEffect(() => {
    if (level !== 'course' || selectedYear === null) return;
    setLoading(true);
    getCourses()
      .then((all) => {
        // getCourses() expected to return array
        const filtered = (all || []).filter((c: any) =>
          Array.isArray(c.allowedYears)
            ? c.allowedYears.includes(selectedYear)
            : c.targetYear === selectedYear
        );
        setCourses(filtered);
      })
      .catch((err) => {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses');
      })
      .finally(() => setLoading(false));
  }, [level, selectedYear]);

  // --- When course selected: fetch full analytics for that course (single call) ---
  useEffect(() => {
    if (!selectedCourse) return;

    // Reset dependent state
    setAnalyticsAll([]);
    setDepartments([]);
    setSelectedDepartment(null);
    setError(null);

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/progress/${selectedCourse._id}/analytics`);
        const all = Array.isArray(res.data.analytics) ? res.data.analytics : [];
        // Normalize student and totalWatchTime fields
        const normalized = all.map((a: any) => ({
          ...a,
          student: a.student || { firstName: 'Unknown', _id: `unknown-${Math.random()}` },
          // convert watch time to minutes for display (safe even if backend already returns minutes)
          totalWatchTimeMins: Math.round((a.totalWatchTime || 0) / 60),
        }));
        setAnalyticsAll(normalized);

        // derive departments from analytics student data first
        const deps = Array.from(
          new Set(
            normalized.map((a: any) => (a.student?.department ? String(a.student.department) : 'Unknown'))
          )
        ).filter(Boolean);
        if (deps.length) {
          setDepartments(deps);
        } else {
          // fallback to listing all students (if analytics doesn't contain student dept)
          try {
            const allStudents = await listStudents();
            const enrolled = (allStudents || []).filter((s: any) =>
              Array.isArray(s.enrolledCourses) &&
              s.enrolledCourses.map((c: any) => String(c)).includes(String(selectedCourse._id))
            );
            const fallbackDeps = Array.from(new Set(enrolled.map((s: any) => s.department || 'Unknown'))).filter(Boolean);
            setDepartments(fallbackDeps.length ? fallbackDeps : ['Unknown']);
          } catch (err) {
            // if listStudents fails, default to Unknown
            setDepartments(['Unknown']);
          }
        }
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        console.error('Server Response Details:', err.response?.data);
        // UPDATED: Show specific error message from backend if available
        setError(err.response?.data?.message || 'Failed to load analytics for selected course');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedCourse]);

  // --- When department selected (students view) -- analytics filtered by department ---
  const analytics = useMemo(() => {
    if (!selectedDepartment) return [];
    return analyticsAll.filter((a: any) => {
      const dept = a.student?.department || 'Unknown';
      return String(dept) === String(selectedDepartment);
    });
  }, [analyticsAll, selectedDepartment]);

  // Simple navigation/back logic
  const goBack = () => {
    if (level === 'year') return;
    if (level === 'course') {
      setLevel('year');
      setSelectedYear(null);
      setCourses([]);
    } else if (level === 'department') {
      setLevel('course');
      setSelectedCourse(null);
      setDepartments([]);
      setAnalyticsAll([]);
    } else if (level === 'students') {
      setLevel('department');
      setSelectedDepartment(null);
    }
  };

  // chart datasets
  const progressData = analytics.map((a) => ({
    name: a.student.firstName || 'Student',
    progress: a.overallProgress || 0,
  }));

  const watchTimeData = analytics.map((a) => ({
    name: a.student.firstName || 'Student',
    minutes: a.totalWatchTimeMins ?? Math.round((a.totalWatchTime || 0) / 60),
  }));

  const avgProgress =
    progressData.length > 0 ? Math.round(progressData.reduce((s, x) => s + x.progress, 0) / progressData.length) : 0;

  const totalWatchTime = watchTimeData.reduce((s, w) => s + (w.minutes || 0), 0);

  return (
    <Container sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Admin Analytics Dashboard
        </Typography>
        <Button variant="outlined" onClick={goBack} disabled={level === 'year'} sx={{ textTransform: 'none' }}>
          ← Back
        </Button>
      </Box>

      {error && (
        <Box mb={2}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      )}

      {/* YEAR SELECTION */}
      {!loading && level === 'year' && (
        <Grid container spacing={3}>
          {years.map((y) => (
            <Grid item xs={12} sm={6} md={3} key={y}>
              <Paper
                onClick={() => {
                  setSelectedYear(y);
                  setLevel('course');
                }}
                sx={{ p: 2, textAlign: 'center', borderRadius: 3, cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
              >
                <Typography variant="h6">Year {y}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* COURSE SELECTION */}
      {!loading && level === 'course' && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Courses for Year {selectedYear}
          </Typography>
          <Grid container spacing={3}>
            {courses.map((c) => (
              <Grid item xs={12} md={6} key={String(c._id)}>
                <Paper
                  onClick={() => {
                    setSelectedCourse(c);
                    setLevel('department');
                  }}
                  sx={{ p: 2, borderRadius: 3, cursor: 'pointer' }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    {c.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {c.instructor?.firstName} {c.instructor?.lastName}
                  </Typography>
                </Paper>
              </Grid>
            ))}
            {!courses.length && <Typography sx={{ m: 2 }}>No courses found for this year.</Typography>}
          </Grid>
        </Box>
      )}

      {/* DEPARTMENT SELECTION */}
      {!loading && level === 'department' && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Departments — {selectedCourse?.title}
          </Typography>
          <Grid container spacing={3}>
            {departments.map((dep) => (
              <Grid item xs={12} sm={6} md={3} key={dep}>
                <Paper
                  onClick={() => {
                    setSelectedDepartment(dep);
                    setLevel('students');
                  }}
                  sx={{ p: 2, borderRadius: 3, cursor: 'pointer', textAlign: 'center' }}
                >
                  <Typography variant="subtitle1">{dep}</Typography>
                </Paper>
              </Grid>
            ))}
            {!departments.length && <Typography sx={{ m: 2 }}>No departments found.</Typography>}
          </Grid>
        </Box>
      )}

      {/* STUDENT ANALYTICS */}
      {!loading && level === 'students' && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {selectedCourse?.title} — {selectedDepartment}
          </Typography>

          <Grid container spacing={2}>
            {analytics.map((a) => (
              <Grid item xs={12} md={6} key={String(a.student._id)}>
                <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Avatar sx={{ bgcolor: '#4B6CB7' }}>{(a.student.firstName || 'U')[0]}</Avatar>
                    </Grid>
                    <Grid item xs>
                      <Typography fontWeight={600}>
                        {a.student.firstName} {a.student.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {a.student.email}
                      </Typography>

                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Overall Progress
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={a.overallProgress || 0}
                          sx={{
                            height: 8,
                            borderRadius: 5,
                            mt: 0.5,
                            bgcolor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': { bgcolor: '#10B981' },
                          }}
                        />
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        Watch Time: {a.totalWatchTimeMins ?? Math.round((a.totalWatchTime || 0) / 60)} mins
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
            {!analytics.length && <Typography sx={{ m: 2 }}>No student analytics for this department.</Typography>}
          </Grid>

          {analytics.length > 0 && (
            <>
              <Divider sx={{ my: 4 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Progress Distribution (%)
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="progress" fill="#4B6CB7" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Watch Time (mins)
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={watchTimeData} dataKey="minutes" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                          {watchTimeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                    <Typography variant="h6">
                      📈 Average Progress: {avgProgress}% | ⏱ Total Watch Time: {totalWatchTime} mins
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      )}
    </Container>
  );
};

export default AdminNestedDashboard;