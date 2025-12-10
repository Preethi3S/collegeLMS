import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Grid,
    Paper,
    Typography,
    LinearProgress,
    CircularProgress,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Stack,
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { getCourses } from '@/services/course.service';
import api from '@/services/api';

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

    // 🔧 FILTER / SORT STATES (for students view)
    const [searchTerm, setSearchTerm] = useState('');
    const [minProgress, setMinProgress] = useState(0);
    const [maxProgress, setMaxProgress] = useState(100);
    const [minWatchTime, setMinWatchTime] = useState(0);
    const [sortBy, setSortBy] = useState<'name' | 'progress' | 'watchTime' | 'lastAccessed'>('progress');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [onlyCompleted, setOnlyCompleted] = useState(false);
    const [onlyNotStarted, setOnlyNotStarted] = useState(false);

    // --- Fetch courses by year ---
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
                        // Student-specific restriction – keep it visible for admin
                        if (!isYearRestricted) return true;
                    }

                    // If neither restriction is set (global), show it
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
                    student: a.student || {
                        firstName: 'Unknown',
                        rollNumber: 'N/A',
                        _id: `unknown-${Math.random()}`,
                    },
                    totalWatchTimeMins: Math.round((a.totalWatchTime || 0) / 60),
                }));
                setAnalyticsAll(normalized);

                // derive departments from analytics student data
                const deps = Array.from(
                    new Set(
                        normalized.map((a: any) =>
                            a.student?.department ? String(a.student.department) : 'Unknown'
                        )
                    )
                ).filter(Boolean);

                setDepartments(deps.map(String)); // ensures string[]

            } catch (err: any) {
                console.error('Error fetching analytics:', err);
                console.error('Server Response Details:', err.response?.data);
                setError(
                    err.response?.data?.message || 'Failed to load analytics for selected course'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [selectedCourse]);

    // --- Analytics filtered by department & year (base list for student-level view) ---
    const analytics = useMemo(() => {
        if (!selectedDepartment || !selectedYear) return [];

        return analyticsAll.filter((a: any) => {
            const dept = a.student?.department || 'Unknown';
            const year = a.student?.year; // comes from backend populate

            return (
                String(dept) === String(selectedDepartment) &&
                Number(year) === Number(selectedYear)
            );
        });
    }, [analyticsAll, selectedDepartment, selectedYear]);

    // --- Advanced filtering & sorting for students view ---
    const filteredAnalytics = useMemo(() => {
        let list = [...analytics];

        // search by name / roll / email
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter((a) => {
                const s = a.student || {};
                return (
                    (s.firstName || '').toLowerCase().includes(q) ||
                    (s.lastName || '').toLowerCase().includes(q) ||
                    (s.rollNumber || '').toLowerCase().includes(q) ||
                    (s.email || '').toLowerCase().includes(q)
                );
            });
        }

        // progress range
        list = list.filter((a) => {
            const p = a.overallProgress || 0;
            return p >= minProgress && p <= maxProgress;
        });

        // min watch time (mins)
        if (minWatchTime > 0) {
            list = list.filter((a) => {
                const wt = a.totalWatchTimeMins ?? Math.round((a.totalWatchTime || 0) / 60);
                return wt >= minWatchTime;
            });
        }

        // flags
        if (onlyCompleted) {
            list = list.filter((a) => (a.overallProgress || 0) >= 90);
        }
        if (onlyNotStarted) {
            list = list.filter((a) => (a.overallProgress || 0) === 0);
        }

        // sorting
        list.sort((a, b) => {
            let av = 0;
            let bv = 0;

            if (sortBy === 'name') {
                const an = (a.student?.firstName || '') + ' ' + (a.student?.lastName || '');
                const bn = (b.student?.firstName || '') + ' ' + (b.student?.lastName || '');
                return sortDir === 'asc'
                    ? an.localeCompare(bn)
                    : bn.localeCompare(an);
            }

            if (sortBy === 'progress') {
                av = a.overallProgress || 0;
                bv = b.overallProgress || 0;
            } else if (sortBy === 'watchTime') {
                av = a.totalWatchTimeMins ?? Math.round((a.totalWatchTime || 0) / 60);
                bv = b.totalWatchTimeMins ?? Math.round((b.totalWatchTime || 0) / 60);
            } else if (sortBy === 'lastAccessed') {
                const ad = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
                const bd = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
                av = ad;
                bv = bd;
            }

            return sortDir === 'asc' ? av - bv : bv - av;
        });

        return list;
    }, [
        analytics,
        searchTerm,
        minProgress,
        maxProgress,
        minWatchTime,
        sortBy,
        sortDir,
        onlyCompleted,
        onlyNotStarted,
    ]);

    // --- Department Level Progress Data Calculation ---
    const departmentProgressData = useMemo(() => {
        const progressByDepartment: Record<string, number[]> = {};

        analyticsAll.forEach((a: any) => {
            const dept = a.student?.department || 'Unknown';
            if (!progressByDepartment[dept]) {
                progressByDepartment[dept] = [];
            }
            progressByDepartment[dept].push(a.overallProgress || 0);
        });

        return departments.map((dep) => {
            const progresses = progressByDepartment[dep] || [];
            const avg =
                progresses.length > 0
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
    const progressData = filteredAnalytics.map((a) => ({
        name: a.student.firstName || 'Student',
        progress: a.overallProgress || 0,
    }));

    const watchTimeData = filteredAnalytics.map((a) => ({
        name: a.student.firstName || 'Student',
        minutes:
            a.totalWatchTimeMins ?? Math.round((a.totalWatchTime || 0) / 60),
    }));

    const avgProgress =
        progressData.length > 0
            ? Math.round(
                  progressData.reduce((s, x) => s + x.progress, 0) /
                      progressData.length
              )
            : 0;

    const totalWatchTime = watchTimeData.reduce(
        (s, w) => s + (w.minutes || 0),
        0
    );

    // --- Extra insights for admin (for current dept+year) ---
    const totalStudents = analytics.length;
    const completedCount = analytics.filter(
        (a) => (a.overallProgress || 0) >= 90
    ).length;
    const strugglingCount = analytics.filter((a) => {
        const p = a.overallProgress || 0;
        return p > 0 && p < 40;
    }).length;
    const noActivityCount = analytics.filter((a) => {
        const p = a.overallProgress || 0;
        const wt =
            a.totalWatchTimeMins ?? Math.round((a.totalWatchTime || 0) / 60);
        return p === 0 && wt === 0;
    }).length;

    const completionRate =
        totalStudents > 0
            ? Math.round((completedCount / totalStudents) * 100)
            : 0;

    // --- Export current filtered view to CSV ---
    const handleExportCSV = () => {
        if (!filteredAnalytics.length) return;

        const header = [
            'Name',
            'Email',
            'Roll Number',
            'Department',
            'Year',
            'Overall Progress',
            'Total Watch Time (mins)',
            'Last Accessed',
        ];
        const rows = filteredAnalytics.map((a) => {
            const s = a.student || {};
            const wt =
                a.totalWatchTimeMins ?? Math.round((a.totalWatchTime || 0) / 60);
            const last =
                a.lastAccessedAt
                    ? new Date(a.lastAccessedAt).toLocaleString()
                    : '';
            return [
                `${s.firstName || ''} ${s.lastName || ''}`.trim(),
                s.email || '',
                s.rollNumber || '',
                s.department || '',
                s.year?.toString() || '',
                (a.overallProgress || 0).toString(),
                wt.toString(),
                last,
            ];
        });

        const csvContent =
            [header, ...rows].map((r) => r.map((x) => `"${x}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
            'download',
            `analytics_${selectedCourse?.title || 'course'}_${selectedDepartment || 'dept'}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Container sx={{ py: 4 }}>
            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={3}
            >
                <Typography variant="h5" fontWeight={700}>
                    Admin Analytics Dashboard
                </Typography>
                <Button
                    variant="outlined"
                    onClick={goBack}
                    disabled={level === 'year'}
                    sx={{ textTransform: 'none' }}
                >
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
                                sx={{
                                    p: 2,
                                    textAlign: 'center',
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    '&:hover': { boxShadow: 3 },
                                }}
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
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        cursor: 'pointer',
                                        '&:hover': { boxShadow: 3 },
                                    }}
                                >
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={600}
                                    >
                                        {c.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {c.instructor?.firstName}{' '}
                                        {c.instructor?.lastName}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                        {!courses.length && (
                            <Typography sx={{ m: 2 }}>
                                No courses found for this year.
                            </Typography>
                        )}
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
                            <Grid
                                item
                                xs={12}
                                sm={6}
                                md={3}
                                key={data.department}
                            >
                                <Paper
                                    onClick={() => {
                                        setSelectedDepartment(data.department);
                                        setLevel('students');
                                    }}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        '&:hover': { boxShadow: 3 },
                                    }}
                                >
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={600}
                                    >
                                        {data.department}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Avg. Progress: {data.averageProgress}%
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={data.averageProgress}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            mt: 1,
                                        }}
                                    />
                                </Paper>
                            </Grid>
                        ))}
                        {!departments.length && (
                            <Typography sx={{ m: 2 }}>
                                No departments found.
                            </Typography>
                        )}
                    </Grid>
                </Box>
            )}

            {/* STUDENT ANALYTICS TABLE AND CHARTS */}
            {!loading && level === 'students' && (
                <Box>
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={2}
                    >
                        <Typography variant="h6" gutterBottom>
                            {selectedCourse?.title} — {selectedDepartment} Students
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={handleExportCSV}
                            disabled={!filteredAnalytics.length}
                        >
                            Export CSV
                        </Button>
                    </Box>

                    {/* ADMIN INSIGHTS CARDS */}
                    <Grid container spacing={2} mb={3}>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, borderRadius: 3 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Total Students
                                </Typography>
                                <Typography variant="h6" fontWeight={700}>
                                    {totalStudents}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, borderRadius: 3 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Completion Rate (≥90%)
                                </Typography>
                                <Typography variant="h6" fontWeight={700}>
                                    {completionRate}%
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, borderRadius: 3 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Struggling (&lt;40% progress)
                                </Typography>
                                <Typography variant="h6" fontWeight={700}>
                                    {strugglingCount}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, borderRadius: 3 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No Activity
                                </Typography>
                                <Typography variant="h6" fontWeight={700}>
                                    {noActivityCount}
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* FILTER PANEL */}
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                        <Typography variant="subtitle1" fontWeight={600} mb={1}>
                            Filters & Sorting
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Search by name / roll / email"
                                    size="small"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="caption">
                                    Progress Range (%)
                                </Typography>
                                <Slider
                                    value={[minProgress, maxProgress]}
                                    onChange={(_, value) => {
                                        const [min, max] = value as number[];
                                        setMinProgress(min);
                                        setMaxProgress(max);
                                    }}
                                    valueLabelDisplay="auto"
                                    min={0}
                                    max={100}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Min Watch Time (mins)"
                                    type="number"
                                    size="small"
                                    value={minWatchTime}
                                    onChange={(e) =>
                                        setMinWatchTime(
                                            Number(e.target.value) || 0
                                        )
                                    }
                                />
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Sort By</InputLabel>
                                    <Select
                                        value={sortBy}
                                        label="Sort By"
                                        onChange={(e) =>
                                            setSortBy(
                                                e.target
                                                    .value as typeof sortBy
                                            )
                                        }
                                    >
                                        <MenuItem value="progress">
                                            Progress
                                        </MenuItem>
                                        <MenuItem value="watchTime">
                                            Watch Time
                                        </MenuItem>
                                        <MenuItem value="name">Name</MenuItem>
                                        <MenuItem value="lastAccessed">
                                            Last Accessed
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Order</InputLabel>
                                    <Select
                                        value={sortDir}
                                        label="Order"
                                        onChange={(e) =>
                                            setSortDir(
                                                e.target
                                                    .value as typeof sortDir
                                            )
                                        }
                                    >
                                        <MenuItem value="asc">
                                            Ascending
                                        </MenuItem>
                                        <MenuItem value="desc">
                                            Descending
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={onlyCompleted}
                                                onChange={(e) =>
                                                    setOnlyCompleted(
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                        }
                                        label="Only Completed (≥90%)"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={onlyNotStarted}
                                                onChange={(e) =>
                                                    setOnlyNotStarted(
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                        }
                                        label="Only Not Started (0%)"
                                    />
                                </Stack>
                            </Grid>
                        </Grid>
                    </Paper>

                    {filteredAnalytics.length > 0 ? (
                        <>
                            <TableContainer
                                component={Paper}
                                sx={{ mb: 4, borderRadius: 3 }}
                            >
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Roll No.</TableCell>
                                            <TableCell>Department</TableCell>
                                            <TableCell>Year</TableCell>
                                            <TableCell align="right">
                                                Overall Progress
                                            </TableCell>
                                            <TableCell align="right">
                                                Level Progress (Avg)
                                            </TableCell>
                                            <TableCell align="right">
                                                Module Progress (Completed)
                                            </TableCell>
                                            <TableCell align="right">
                                                Watch Time (mins)
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredAnalytics.map((a: any) => {
                                            const avgLevelProgress =
                                                a.levelsProgress?.length
                                                    ? Math.round(
                                                          a.levelsProgress.reduce(
                                                              (
                                                                  s: number,
                                                                  l: any
                                                              ) =>
                                                                  s +
                                                                  l.progress,
                                                              0
                                                          ) /
                                                              a
                                                                  .levelsProgress
                                                                  .length
                                                      )
                                                    : 0;

                                            const allModuleProgresses =
                                                a.levelsProgress?.flatMap(
                                                    (l: any) =>
                                                        l.moduleProgress
                                                ) || [];
                                            const totalModules =
                                                allModuleProgresses.length;
                                            const completedModules =
                                                allModuleProgresses.filter(
                                                    (m: any) => m.completed
                                                ).length;

                                            const wt =
                                                a.totalWatchTimeMins ??
                                                Math.round(
                                                    (a.totalWatchTime || 0) /
                                                        60
                                                );

                                            return (
                                                <TableRow
                                                    key={String(
                                                        a.student._id
                                                    )}
                                                >
                                                    <TableCell
                                                        component="th"
                                                        scope="row"
                                                    >
                                                        {a.student.firstName}{' '}
                                                        {a.student.lastName}
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{
                                                                display:
                                                                    'block',
                                                            }}
                                                        >
                                                            {a.student.email}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {a.student.rollNumber ||
                                                            'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {a.student.department ||
                                                            'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {a.student.year ||
                                                            'N/A'}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box
                                                            sx={{
                                                                minWidth: 100,
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    display:
                                                                        'block',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {a.overallProgress ||
                                                                    0}
                                                                %
                                                            </Typography>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={
                                                                    a.overallProgress ||
                                                                    0
                                                                }
                                                                sx={{
                                                                    height: 6,
                                                                    borderRadius: 3,
                                                                    '& .MuiLinearProgress-bar':
                                                                        {
                                                                            bgcolor:
                                                                                '#10B981',
                                                                        },
                                                                }}
                                                            />
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {
                                                                avgLevelProgress
                                                            }
                                                            %
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {
                                                                completedModules
                                                            }
                                                            /{totalModules}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {wt} mins
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
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={600}
                                        >
                                            Progress Distribution (%)
                                        </Typography>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <BarChart data={progressData}>
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <RechartsTooltip />
                                                <Bar
                                                    dataKey="progress"
                                                    fill="#4B6CB7"
                                                    radius={[6, 6, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2, borderRadius: 3 }}>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={600}
                                        >
                                            Watch Time (mins)
                                        </Typography>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={watchTimeData}
                                                    dataKey="minutes"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    label
                                                >
                                                    {watchTimeData.map(
                                                        (_, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={
                                                                    COLORS[
                                                                        index %
                                                                            COLORS.length
                                                                    ]
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </Pie>
                                                <Legend />
                                                <RechartsTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            borderRadius: 3,
                                        }}
                                    >
                                        <Typography variant="h6">
                                            📈 Average Progress:{' '}
                                            {avgProgress}% | ⏱ Total Watch
                                            Time: {totalWatchTime} mins
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </>
                    ) : (
                        <Typography sx={{ m: 2 }}>
                            No student analytics for this department (with
                            current filters).
                        </Typography>
                    )}
                </Box>
            )}
        </Container>
    );
};

export default AdminNestedDashboard;
