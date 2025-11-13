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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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

    // --- Fetch courses by year (BUG FIX: Ensure only courses relevant to the selected year are shown) ---
    useEffect(() => {
        if (level !== 'course' || selectedYear === null) return;
        setLoading(true);
        getCourses()
            .then((all) => {
                // getCourses() expected to return array (for admin, this is ALL courses)
                const filtered = (all || []).filter((c: any) => {
                    const allowedYears = Array.isArray(c.allowedYears) ? c.allowedYears : [];
                    const allowedStudents = Array.isArray(c.allowedStudents) ? c.allowedStudents : [];

                    const isYearRestricted = allowedYears.length > 0;
                    const isStudentRestricted = allowedStudents.length > 0;

                    if (isYearRestricted) {
                        // If course explicitly restricts by year, it must include the selected year
                        return allowedYears.includes(selectedYear);
                    } 
                    
                    if (isStudentRestricted) {
                         // If restricted by students, we can't fully filter by year without student details here, 
                         // so we include it for now. Student filtering will happen later based on analytics student data.
                         // Generally, student restriction overrides year restriction, so we assume if student restricted, 
                         // it should be shown for the admin to investigate. 
                         // For simplicity in the dashboard view: If it's restricted ONLY by student, show it.
                         if (!isYearRestricted) return true;
                    }
                    
                    // If neither restriction is set (truly global/unrestricted), show it.
                    return !isYearRestricted && !isStudentRestricted;
                });
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
                
                // Normalize student, roll number, and watch time fields
                const normalized = all.map((a: any) => ({
                    ...a,
                    student: a.student || { firstName: 'Unknown', rollNumber: 'N/A', _id: `unknown-${Math.random()}` },
                    // convert watch time to minutes for display (safe even if backend already returns minutes)
                    totalWatchTimeMins: Math.round((a.totalWatchTime || 0) / 60),
                }));
                setAnalyticsAll(normalized);

                // derive departments from analytics student data
                const deps = Array.from(
                    new Set(
                        normalized.map((a: any) => (a.student?.department ? String(a.student.department) : 'Unknown'))
                    )
                ).filter(Boolean);
                
                setDepartments(deps.length > 0 ? deps : ['Unknown']);

            } catch (err: any) {
                console.error('Error fetching analytics:', err);
                console.error('Server Response Details:', err.response?.data);
                setError(err.response?.data?.message || 'Failed to load analytics for selected course');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [selectedCourse]);

    // --- Analytics filtered by department (when students view is active) ---
    const analytics = useMemo(() => {
        if (!selectedDepartment) return [];
        return analyticsAll.filter((a: any) => {
            const dept = a.student?.department || 'Unknown';
            return String(dept) === String(selectedDepartment);
        });
    }, [analyticsAll, selectedDepartment]);

    // NEW: Department Level Progress Data Calculation
    const departmentProgressData = useMemo(() => {
        // Group by department and calculate average progress
        const progressByDepartment: Record<string, number[]> = {};

        analyticsAll.forEach((a: any) => {
            const dept = a.student?.department || 'Unknown';
            if (!progressByDepartment[dept]) {
                progressByDepartment[dept] = [];
            }
            progressByDepartment[dept].push(a.overallProgress || 0);
        });

        // Calculate average progress for each department
        return departments.map(dep => {
            const progresses = progressByDepartment[dep] || [];
            const avg = progresses.length > 0
                ? Math.round(progresses.reduce((sum, p) => sum + p, 0) / progresses.length)
                : 0;
            return {
                department: dep,
                averageProgress: avg,
            };
        });
    }, [analyticsAll, departments]);

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

    // chart datasets (using filtered analytics for the student view)
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
                                    sx={{ p: 2, borderRadius: 3, cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
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

            {/* DEPARTMENT SELECTION (with Progress) */}
            {!loading && level === 'department' && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Departments — {selectedCourse?.title}
                    </Typography>
                    <Grid container spacing={3}>
                        {departmentProgressData.map((data) => (
                            <Grid item xs={12} sm={6} md={3} key={data.department}>
                                <Paper
                                    onClick={() => {
                                        setSelectedDepartment(data.department);
                                        setLevel('students');
                                    }}
                                    sx={{ p: 2, borderRadius: 3, cursor: 'pointer', textAlign: 'center', '&:hover': { boxShadow: 3 } }}
                                >
                                    <Typography variant="subtitle1" fontWeight={600}>{data.department}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Avg. Progress: {data.averageProgress}%
                                    </Typography>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={data.averageProgress} 
                                        sx={{ height: 6, borderRadius: 3, mt: 1 }} 
                                    />
                                </Paper>
                            </Grid>
                        ))}
                        {!departments.length && <Typography sx={{ m: 2 }}>No departments found.</Typography>}
                    </Grid>
                </Box>
            )}

            {/* STUDENT ANALYTICS TABLE AND CHARTS */}
            {!loading && level === 'students' && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        {selectedCourse?.title} — {selectedDepartment} Students
                    </Typography>

                    {analytics.length > 0 ? (
                        <>
                            <TableContainer component={Paper} sx={{ mb: 4 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Roll No.</TableCell>
                                            <TableCell align="right">Overall Progress</TableCell>
                                            <TableCell align="right">Level Progress (Avg)</TableCell>
                                            <TableCell align="right">Module Progress (Completed)</TableCell>
                                            <TableCell align="right">Watch Time (mins)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {analytics.map((a: any) => {
                                            // Calculate Level Progress as an average of all levels
                                            const avgLevelProgress = a.levelsProgress?.length 
                                                ? Math.round(a.levelsProgress.reduce((s: number, l: any) => s + l.progress, 0) / a.levelsProgress.length)
                                                : 0;
                                            
                                            // Calculate Module Progress: total completed / total modules
                                            const allModuleProgresses = a.levelsProgress?.flatMap((l: any) => l.moduleProgress) || [];
                                            const totalModules = allModuleProgresses.length;
                                            const completedModules = allModuleProgresses.filter((m: any) => m.completed).length;

                                            return (
                                                <TableRow key={String(a.student._id)}>
                                                    <TableCell component="th" scope="row">
                                                        {a.student.firstName} {a.student.lastName}
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                            {a.student.email}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{a.student.rollNumber || 'N/A'}</TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ minWidth: 100 }}>
                                                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                                                                {a.overallProgress || 0}%
                                                            </Typography>
                                                            <LinearProgress 
                                                                variant="determinate" 
                                                                value={a.overallProgress || 0} 
                                                                sx={{ height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: '#10B981' } }} 
                                                            />
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography sx={{ fontWeight: 600 }}>{avgLevelProgress}%</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography sx={{ fontWeight: 600 }}>{completedModules}/{totalModules}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {a.totalWatchTimeMins ?? Math.round((a.totalWatchTime || 0) / 60)} mins
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

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
                    ) : (
                        <Typography sx={{ m: 2 }}>No student analytics for this department.</Typography>
                    )}
                </Box>
            )}
        </Container>
    );
};

export default AdminNestedDashboard;