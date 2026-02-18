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
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';

const years = [1, 2, 3, 4];

const cardShadow = "0 8px 24px rgba(0,0,0,0.08)";
const gradientBg = "linear-gradient(135deg, rgba(75,108,183,0.08), rgba(103,200,255,0.05))";

const AdminNestedDashboard = () => {
  const [level, setLevel] = useState('year');
  const [selectedYear, setSelectedYear] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [analyticsAll, setAnalyticsAll] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [minProgress, setMinProgress] = useState(0);
  const [maxProgress, setMaxProgress] = useState(100);
  const [sortBy, setSortBy] = useState('progress');
  const [sortDir, setSortDir] = useState('desc');
  const [onlyCompleted, setOnlyCompleted] = useState(false);
  const [onlyNotStarted, setOnlyNotStarted] = useState(false);

  // Fetch Courses
  useEffect(() => {
    if (level !== 'course' || selectedYear === null) return;

    setLoading(true);
    getCourses()
      .then((all) => {
        const filtered = (all || []).filter((c) => {
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

        const normalized = all.map((a) => ({
          ...a,
          student: a.student || {
            firstName: 'Unknown',
            rollNumber: 'N/A',
            _id: `unknown-${Math.random()}`,
          }
        }));

        setAnalyticsAll(normalized);

        const deps = Array.from(new Set(normalized.map((a) => a.student?.department || 'Unknown')));
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

    return analyticsAll.filter((a) => {
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 1. Header & Level Selection */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={800} gutterBottom sx={{ background: 'linear-gradient(45deg, #2563eb, #3b82f6)', backgroundClip: 'text', textFillColor: 'transparent', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Deep Dive Analytics
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Drill down by Year → Course → Department → Student Performance
        </Typography>

        <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#f8fafc' }}>
          {/* STEP 1: Select Year */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Select Year</InputLabel>
            <Select
              value={selectedYear || ''}
              label="Select Year"
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setLevel('course');
                setSelectedCourse(null);
                setSelectedDepartment(null);
              }}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}th Year</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography color="text.disabled">→</Typography>

          {/* STEP 2: Select Course */}
          <FormControl size="small" sx={{ minWidth: 250 }} disabled={!selectedYear}>
            <InputLabel>Select Course</InputLabel>
            <Select
              value={selectedCourse?._id || ''}
              label="Select Course"
              onChange={(e) => {
                const c = courses.find((x) => x._id === e.target.value);
                setSelectedCourse(c);
                setLevel('department');
                setSelectedDepartment(null);
              }}
            >
              {courses.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography color="text.disabled">→</Typography>

          {/* STEP 3: Select Department */}
          <FormControl size="small" sx={{ minWidth: 200 }} disabled={!selectedCourse}>
            <InputLabel>Select Dept</InputLabel>
            <Select
              value={selectedDepartment || ''}
              label="Select Dept"
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setLevel('students');
              }}
            >
              {departments.map((d) => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      </Box>

      {/* 2. Main Dashboard Content (Only shows when Level = 'students') */}
      {level === 'students' && selectedDepartment && (
        <>
          {/* Summary Stats */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard label="Total Students" value={totalStudents} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard label="Average Progress" value={`${avgProgress}%`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard label="Completion Rate" value={`${completionRate}%`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard label="Struggling (<40%)" value={strugglingCount} />
            </Grid>
          </Grid>

          <Grid container spacing={4}>
            {/* LEFT: Charts & Visuals */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3, borderRadius: 4, boxShadow: cardShadow, mb: 4 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Progress Distribution ({selectedDepartment})
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" hide />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip />
                      <Bar dataKey="progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 4, boxShadow: cardShadow }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={700}>
                    Student List ({filteredAnalytics.length})
                  </Typography>
                  <Button
                    startIcon={<DownloadIcon />}
                    variant="outlined"
                    size="small"
                    onClick={handleExportCSV}
                    disabled={filteredAnalytics.length === 0}
                  >
                    Export CSV
                  </Button>
                </Box>

                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name / Roll No</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell align="center">Progress</TableCell>
                        <TableCell align="right">Last Active</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAnalytics.map((item) => (
                        <TableRow key={item.student._id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {item.student.firstName} {item.student.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.student.rollNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.student.email}</TableCell>
                          <TableCell align="center">
                            <Box display="flex" alignItems="center" gap={1}>
                              <LinearProgress
                                variant="determinate"
                                value={item.overallProgress || 0}
                                sx={{ width: 60, height: 6, borderRadius: 4 }}
                                color={(item.overallProgress || 0) >= 90 ? 'success' : 'primary'}
                              />
                              <Typography variant="caption" fontWeight={600}>
                                {Math.round(item.overallProgress || 0)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption" color="text.secondary">
                              {item.lastAccessedAt ? new Date(item.lastAccessedAt).toLocaleDateString() : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                             <Button
                              size="small"
                              onClick={() => {
                                setSelectedStudentId(item.student._id);
                                setProfileModalOpen(true);
                              }}
                            >
                              Profile
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredAnalytics.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No students match the filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* RIGHT: Advanced Filters Panel */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3, borderRadius: 4, boxShadow: cardShadow, position: 'sticky', top: 20 }}>
                <Typography variant="h6" fontWeight={700} mb={3}>
                  Filters & Controls
                </Typography>

                <Stack spacing={3}>
                  {/* Search */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Search Student"
                    placeholder="Name, Roll No, Email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  {/* Progress Range Slider */}
                  <Box>
                    <Typography variant="caption" fontWeight={600} gutterBottom>
                      Progress Range: {minProgress}% - {maxProgress}%
                    </Typography>
                    <Slider
                      value={[minProgress, maxProgress]}
                      onChange={(_, newVal) => {
                        if (Array.isArray(newVal)) {
                          setMinProgress(newVal[0]);
                          setMaxProgress(newVal[1]);
                        }
                      }}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100}
                    />
                  </Box>

                  {/* Toggle Filters */}
                  <Box>
                    <Typography variant="caption" fontWeight={600} gutterBottom display="block">
                      Quick Filters
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={onlyCompleted}
                          onChange={(e) => {
                            setOnlyCompleted(e.target.checked);
                            if (e.target.checked) setOnlyNotStarted(false);
                          }}
                        />
                      }
                      label="Completed Only (>90%)"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={onlyNotStarted}
                          onChange={(e) => {
                            setOnlyNotStarted(e.target.checked);
                            if (e.target.checked) setOnlyCompleted(false);
                          }}
                        />
                      }
                      label="Not Started (0%)"
                    />
                  </Box>

                  {/* Sorting */}
                  <Box>
                    <Typography variant="caption" fontWeight={600} gutterBottom display="block">
                      Sort By
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <MenuItem value="progress">Progress</MenuItem>
                          <MenuItem value="name">Name</MenuItem>
                          <MenuItem value="lastAccessed">Last Active</MenuItem>
                        </Select>
                      </FormControl>
                      <Button
                        variant="outlined"
                        onClick={() => setSortDir((p) => (p === 'asc' ? 'desc' : 'asc'))}
                      >
                        {sortDir === 'asc' ? '⬆' : '⬇'}
                      </Button>
                    </Stack>
                  </Box>

                  {/* Reset Button */}
                  <Button
                    variant="text"
                    color="inherit"
                    onClick={() => {
                      setSearchTerm('');
                      setMinProgress(0);
                      setMaxProgress(100);
                      setSortBy('progress');
                      setSortDir('desc');
                      setOnlyCompleted(false);
                      setOnlyNotStarted(false);
                    }}
                  >
                    Reset All Filters
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* Profile Modal */}
      {selectedStudentId && (
        <StudentProfileModal
          studentId={selectedStudentId}
          open={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedStudentId(null);
          }}
        />
      )}
    </Container>
  );
};

export default AdminNestedDashboard;
