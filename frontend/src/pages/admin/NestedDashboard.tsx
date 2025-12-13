// ==========================
// AdminNestedDashboard (Refactored UI Only)
// Watch Time Removed — NA2 — Clean Filters
// ==========================

import { StudentProfileModal } from '@/components/StudentProfileModal';
import api from '@/services/api';
import { getCourses } from '@/services/course.service';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Divider,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

type ViewLevel = 'year' | 'course' | 'department' | 'students';
const years = [1, 2, 3, 4];
const COLORS = ['#4B6CB7', '#67C8FF', '#10B981', '#F59E0B'];

const cardShadow = "0 8px 24px rgba(0,0,0,0.08)";
const gradientBg = "linear-gradient(135deg, rgba(75,108,183,0.08), rgba(103,200,255,0.05))";

const AdminNestedDashboard: React.FC = () => {
  const [level, setLevel] = useState<ViewLevel>('year');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [analyticsAll, setAnalyticsAll] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [minProgress, setMinProgress] = useState(0);
  const [maxProgress, setMaxProgress] = useState(100);
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'lastAccessed'>('progress');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [onlyCompleted, setOnlyCompleted] = useState(false);
  const [onlyNotStarted, setOnlyNotStarted] = useState(false);

  // Fetch Courses
  useEffect(() => {
    if (level !== 'course' || selectedYear === null) return;

    setLoading(true);
    getCourses()
      .then((all) => {
        const filtered = (all || []).filter((c: any) => {
          const allowedYears = Array.isArray(c.allowedYears) ? c.allowedYears : [];
          const allowedStudents = Array.isArray(c.allowedStudents) ? c.allowedStudents : [];

          const isYearRestricted = allowedYears.length > 0;
          const isStudentRestricted = allowedStudents.length > 0;

          if (isYearRestricted) return allowedYears.includes(selectedYear);
          if (isStudentRestricted && !isYearRestricted) return true;
          return !isYearRestricted && !isStudentRestricted;
        });

        setCourses(filtered);
      })
      .catch(() => setError('Failed to load courses'))
      .finally(() => setLoading(false));
  }, [level, selectedYear]);

  // Fetch Analytics
  useEffect(() => {
    if (!selectedCourse) return;

    setAnalyticsAll([]);
    setDepartments([]);
    setSelectedDepartment(null);
    setError(null);

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/progress/${selectedCourse._id}/analytics`);
        const all = Array.isArray(res.data.analytics) ? res.data.analytics : [];

        const normalized = all.map((a: any) => ({
          ...a,
          student: a.student || {
            firstName: 'Unknown',
            rollNumber: 'N/A',
            _id: `unknown-${Math.random()}`,
          }
        }));

        setAnalyticsAll(normalized);

        const deps = Array.from(new Set(normalized.map((a: any) => a.student?.department || 'Unknown')));
        setDepartments(deps.map(String));
      } catch {
        setError('Failed to load analytics for selected course');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedCourse]);

  // Filter by Dept + Year
  const analytics = useMemo(() => {
    if (!selectedDepartment || !selectedYear) return [];

    return analyticsAll.filter((a: any) => {
      const dept = a.student?.department || 'Unknown';
      const year = a.student?.year;
      return dept === selectedDepartment && Number(year) === Number(selectedYear);
    });
  }, [analyticsAll, selectedDepartment, selectedYear]);

  // Advanced Student Filters
  const filteredAnalytics = useMemo(() => {
    let list = [...analytics];

    // ============= SEARCH (Universal) =============
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((a) => {
        const s = a.student;
        return (
          (s.firstName || "").toLowerCase().includes(q) ||
          (s.lastName || "").toLowerCase().includes(q) ||
          (s.rollNumber || "").toLowerCase().includes(q) ||
          (s.email || "").toLowerCase().includes(q) ||
          (s.department || "").toLowerCase().includes(q) ||
          String(s.year || "").includes(q)
        );
      });
    }

    // ============= Progress Range Filter =============
    list = list.filter((a) => {
      const p = a.overallProgress || 0;
      return p >= minProgress && p <= maxProgress;
    });

    // ============= Completed Filter =============
    if (onlyCompleted) list = list.filter((a) => (a.overallProgress || 0) >= 90);

    // ============= Not Started Filter =============
    if (onlyNotStarted) list = list.filter((a) => (a.overallProgress || 0) === 0);

    // ============= Sorting =============
    list.sort((a, b) => {
      if (sortBy === 'name') {
        const an = `${a.student.firstName} ${a.student.lastName}`;
        const bn = `${b.student.firstName} ${b.student.lastName}`;
        return sortDir === 'asc' ? an.localeCompare(bn) : bn.localeCompare(an);
      }

      if (sortBy === 'progress') {
        return sortDir === 'asc'
          ? (a.overallProgress || 0) - (b.overallProgress || 0)
          : (b.overallProgress || 0) - (a.overallProgress || 0);
      }

      if (sortBy === 'lastAccessed') {
        const A = new Date(a.lastAccessedAt || 0).getTime();
        const B = new Date(b.lastAccessedAt || 0).getTime();
        return sortDir === 'asc' ? A - B : B - A;
      }

      return 0;
    });

    return list;
  }, [
    analytics,
    searchTerm,
    minProgress,
    maxProgress,
    sortBy,
    sortDir,
    onlyCompleted,
    onlyNotStarted,
  ]);

  // Chart data
  const progressData = filteredAnalytics.map((a) => ({
    name: a.student.firstName,
    progress: a.overallProgress || 0,
  }));

  const avgProgress =
    progressData.length > 0
      ? Math.round(progressData.reduce((s, x) => s + x.progress, 0) / progressData.length)
      : 0;

  const totalStudents = analytics.length;
  const completedCount = analytics.filter((a) => (a.overallProgress || 0) >= 90).length;
  const strugglingCount = analytics.filter((a) => {
    const p = a.overallProgress || 0;
    return p > 0 && p < 40;
  }).length;

  const completionRate =
    totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;

  // CSV Export
  const handleExportCSV = () => {
    if (!filteredAnalytics.length) return;

    const header = [
      'Name',
      'Email',
      'Roll Number',
      'Department',
      'Year',
      'Overall Progress',
      'Last Accessed',
    ];

    const rows = filteredAnalytics.map((a) => {
      const s = a.student;
      const last = a.lastAccessedAt ? new Date(a.lastAccessedAt).toLocaleString() : '';
      return [
        `${s.firstName} ${s.lastName}`,
        s.email,
        s.rollNumber,
        s.department,
        s.year?.toString(),
        (a.overallProgress || 0).toString(),
        last,
      ];
    });

    const csvContent =
      [header, ...rows].map((r) => r.map((x) => `"${x}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics_${selectedCourse?.title}_${selectedDepartment}.csv`;
    link.click();
  };

  /* ============================
       UI — Summary Card
  ============================ */

  const SummaryCard = ({
    label,
    value
  }: {
    label: string;
    value: string | number;
  }) => (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 3,
        boxShadow: cardShadow,
        background: gradientBg,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700} mt={0.5}>
        {value}
      </Typography>
    </Paper>
  );

  /* ============================
         RENDER START
  ============================ */

  return (
    <Container sx={{ py: 2 }}>

      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Admin Analytics Dashboard
        </Typography>

        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={() => {
              if (level === 'year') return;
              if (level === 'course') {
                setLevel('year');
                setSelectedYear(null);
                setCourses([]);
              } else if (level === 'department') {
                setLevel('course');
                setSelectedCourse(null);
              } else if (level === 'students') {
                setLevel('department');
                setSelectedDepartment(null);
              }
            }}
            disabled={level === 'year'}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            ← Back
          </Button>
        </Box>
      </Box>

      {/* ERROR */}
      {error && <Typography color="error">{error}</Typography>}

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
                  p: 2.5,
                  textAlign: 'center',
                  borderRadius: 3,
                  cursor: 'pointer',
                  background: gradientBg,
                  boxShadow: cardShadow,
                  transition: "0.25s",
                  '&:hover': { transform: "translateY(-4px)" },
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
              <Grid item xs={12} md={6} key={c._id}>
                <Paper
                  onClick={() => {
                    setSelectedCourse(c);
                    setLevel('department');
                  }}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    cursor: "pointer",
                    boxShadow: cardShadow,
                    transition: "0.25s",
                    '&:hover': { transform: "translateY(-4px)" },
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {c.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {c.instructor?.firstName} {c.instructor?.lastName}
                      </Typography>
                    </Box>

                    <Button
                      size="small"
                      variant="contained"
                      sx={{ bgcolor: '#4B6CB7', borderRadius: 2 }}
                    >
                      Open
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* DEPARTMENT VIEW */}
      {!loading && level === 'department' && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Departments — {selectedCourse?.title}
          </Typography>

          <Grid container spacing={3}>
            {departments.map((dep) => {
              const avg = Math.round(
                (analyticsAll
                  .filter(a => a.student?.department === dep)
                  .reduce((s, a) => s + (a.overallProgress || 0), 0) /
                  Math.max(1, analyticsAll.filter(a => a.student?.department === dep).length))
              );

              return (
                <Grid item xs={12} sm={6} md={3} key={dep}>
                  <Paper
                    onClick={() => {
                      setSelectedDepartment(dep);
                      setLevel('students');
                    }}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      cursor: 'pointer',
                      boxShadow: cardShadow,
                      background: gradientBg,
                      textAlign: 'center',
                      transition: "0.25s",
                      '&:hover': { transform: "translateY(-4px)" },
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {dep}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg. Progress: {avg}%
                    </Typography>

                    <LinearProgress
                      variant="determinate"
                      value={avg}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        mt: 1,
                        background: '#EEF2FF',
                        '& .MuiLinearProgress-bar': { bgcolor: '#4B6CB7' },
                      }}
                    />
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* STUDENTS VIEW */}
      {!loading && level === 'students' && (
        <Box>

          {/* HEADER */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              {selectedCourse?.title} — {selectedDepartment} Students
            </Typography>

            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={!filteredAnalytics.length}
              sx={{
                textTransform: "none",
                bgcolor: "#4B6CB7",
                borderRadius: 2,
              }}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </Box>

          {/* SUMMARY CARDS */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={4}>
              <SummaryCard label="Total Students" value={totalStudents} />
            </Grid>
            <Grid item xs={12} md={4}>
              <SummaryCard label="Completion Rate (≥90%)" value={`${completionRate}%`} />
            </Grid>
            <Grid item xs={12} md={4}>
              <SummaryCard label="Struggling (<40%)" value={strugglingCount} />
            </Grid>
          </Grid>

          {/* FILTER PANEL */}
          <Paper
            sx={{
              p: 2.5,
              borderRadius: 3,
              boxShadow: cardShadow,
              background: "#FFFFFF",
              mb: 3,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Filters & Sorting
            </Typography>

            <Grid container spacing={2}>
              {/* Search */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search..."
                  size="small"
                  placeholder="Name, Roll, Email, Dept, Year"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Grid>

              {/* Progress Range */}
              <Grid item xs={12} md={4}>
                <Typography variant="caption">Progress Range (%)</Typography>
                <Slider
                  value={[minProgress, maxProgress]}
                  onChange={(_, v) => {
                    const [min, max] = v as number[];
                    setMinProgress(min);
                    setMaxProgress(max);
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                />
              </Grid>

              {/* Sort By */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <MenuItem value="progress">Progress</MenuItem>
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="lastAccessed">Last Accessed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Sort Direction */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Order</InputLabel>
                  <Select
                    value={sortDir}
                    label="Order"
                    onChange={(e) => setSortDir(e.target.value as any)}
                  >
                    <MenuItem value="asc">Ascending</MenuItem>
                    <MenuItem value="desc">Descending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Completed + Not Started */}
              <Grid item xs={12} md={8}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={onlyCompleted}
                        onChange={(e) => setOnlyCompleted(e.target.checked)}
                      />
                    }
                    label="Only Completed (≥90%)"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={onlyNotStarted}
                        onChange={(e) => setOnlyNotStarted(e.target.checked)}
                      />
                    }
                    label="Only Not Started (0%)"
                  />
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* TABLE */}
          {filteredAnalytics.length > 0 ? (
            <>
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: 3,
                  boxShadow: cardShadow,
                  mb: 3,
                  overflow: "hidden",
                }}
              >
                <Table size="small">
                  <TableHead
                    sx={{
                      background: "#F7F9FC",
                    }}
                  >
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Roll No.</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Year</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Overall Progress</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Level Progress (Avg)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Modules Completed</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredAnalytics.map((a: any) => {
                      const avgLevelProgress = a.levelsProgress?.length
                        ? Math.round(
                            a.levelsProgress.reduce((s: number, l: any) => s + l.progress, 0) /
                            a.levelsProgress.length
                          )
                        : 0;

                      const modules = a.levelsProgress?.flatMap((l: any) => l.moduleProgress) || [];
                      const completed = modules.filter((m: any) => m.completed).length;

                      return (
                        <TableRow
                          key={a.student._id}
                          hover
                          sx={{
                            cursor: "pointer",
                            "&:hover": { background: "rgba(75,108,183,0.05)" },
                          }}
                          onClick={() => {
                            setSelectedStudentId(a.student._id);
                            setProfileModalOpen(true);
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight={600}>
                              {a.student.firstName} {a.student.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {a.student.email}
                            </Typography>
                          </TableCell>

                          <TableCell>{a.student.rollNumber}</TableCell>
                          <TableCell>{a.student.department}</TableCell>
                          <TableCell>{a.student.year}</TableCell>

                          <TableCell align="right">
                            <Box sx={{ minWidth: 90 }}>
                              <Typography variant="caption" fontWeight={700}>
                                {a.overallProgress || 0}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={a.overallProgress || 0}
                                sx={{
                                  height: 6,
                                  borderRadius: 4,
                                  mt: 1,
                                  "& .MuiLinearProgress-bar": {
                                    bgcolor: "#10B981",
                                  },
                                }}
                              />
                            </Box>
                          </TableCell>

                          <TableCell align="right">
                            <Typography fontWeight={700}>{avgLevelProgress}%</Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography fontWeight={700}>
                              {completed}/{modules.length}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* CHARTS */}
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      boxShadow: cardShadow,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600} mb={2}>
                      Progress Distribution (%)
                    </Typography>

                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="progress" fill="#4B6CB7" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              </Grid>

              <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: cardShadow, mt: 3 }}>
                <Typography variant="h6" textAlign="center">
                  📈 Average Progress: {avgProgress}%
                </Typography>
              </Paper>
            </>
          ) : (
            <Typography sx={{ m: 2 }}>No student analytics found (with current filters).</Typography>
          )}
        </Box>
      )}

      {/* Student Profile Modal */}
      <StudentProfileModal
        open={profileModalOpen}
        studentId={selectedStudentId}
        onClose={() => {
          setProfileModalOpen(false);
          setSelectedStudentId(null);
        }}
      />
    </Container>
  );
};

export default AdminNestedDashboard;
