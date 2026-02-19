import { getCourses } from '@/services/course.service';
import { listStudents } from '@/services/user.service';
import {
    Assignment as AssignmentIcon,
    Group as GroupIcon,
    MenuBook as MenuBookIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    FormControl,
    Grid,
    InputLabel,
    LinearProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

const COLORS = ['#02367B', '#006CA5', '#0496C7', '#04BADE', '#55E2E9'];

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{
    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
    borderRadius: 4,
    height: '100%',
  }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
      </Box>
      <Box sx={{
        bgcolor: `${color}20`,
        p: 1.5,
        borderRadius: '50%',
        display: 'flex',
        color: color
      }}>
        {icon}
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const { data: students = [] } = useQuery(['students'], () => listStudents());
  const { data: courses = [] } = useQuery(['courses'], () => getCourses());
  const [selectedDept, setSelectedDept] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [rankMode, setRankMode] = useState('top');
  const [limit, setLimit] = useState(10);

  // --- Derived Data Calculations ---

  // 1. Year Distribution
  const studentDistribution = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      const year = s.year ? `${s.year} Year` : 'Unknown';
      counts[year] = (counts[year] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  }, [students]);

  // 2. Department Overview
  const departmentData = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      const dept = s.department || 'Unassigned';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  }, [students]);

  const departments = useMemo(() => departmentData.map(d => d.name), [departmentData]);

  // Year options (unique years from students)
  const yearOptions = useMemo(() => {
    const unique = new Set();
    students.forEach((s) => {
      if (s.year) unique.add(Number(s.year));
    });
    return Array.from(unique).sort();
  }, [students]);

  // Department options based on selected year
  const departmentOptions = useMemo(() => {
    const pool = yearFilter === 'All'
      ? students
      : students.filter((s) => Number(s.year) === Number(yearFilter));

    const unique = new Set();
    pool.forEach((s) => {
      if (s.department) unique.add(s.department);
    });
    return Array.from(unique).sort();
  }, [students, yearFilter]);

  // Students filtered by year and department for ranking
  const filteredByYearDept = useMemo(() => {
    return students.filter((s) => {
      const matchesYear = yearFilter === 'All' || Number(s.year) === Number(yearFilter);
      const matchesDept = deptFilter === 'All' || s.department === deptFilter;
      return matchesYear && matchesDept;
    });
  }, [students, yearFilter, deptFilter]);

  const rankedStudents = useMemo(() => {
    const sorted = [...filteredByYearDept].sort((a, b) => (b.avgProgress || 0) - (a.avgProgress || 0));
    const ordered = rankMode === 'least' ? [...sorted].reverse() : sorted;
    return ordered.slice(0, limit);
  }, [filteredByYearDept, rankMode, limit]);

  const selectionAverage = useMemo(() => {
    if (!filteredByYearDept.length) return 0;
    const total = filteredByYearDept.reduce((acc, s) => acc + (s.avgProgress || 0), 0);
    return Math.round(total / filteredByYearDept.length);
  }, [filteredByYearDept]);

  // 3. Department Progress Distribution
  const deptProgressDistribution = useMemo(() => {
    // Define exact target departments with short codes as requested for better UI
    const deptStats = {
      'CSE': { total: 0, count: 0 },
      'IT': { total: 0, count: 0 },
      'ECE': { total: 0, count: 0 },
      'EEE': { total: 0, count: 0 },
      'ME': { total: 0, count: 0 },
      'CE': { total: 0, count: 0 }
    };

    students.forEach((s) => {
      const rawDept = (s.department || '').toUpperCase();
      let targetDept = '';

      // Map raw department to target short codes
      if (rawDept.includes('CSE') || rawDept.includes('COMPUTER')) targetDept = 'CSE';
      else if (rawDept.includes('IT') || rawDept.includes('INFORMATION')) targetDept = 'IT';
      else if (rawDept.includes('ECE') || (rawDept.includes('ELECTRONICS') && !rawDept.includes('ELECTRICAL'))) targetDept = 'ECE';
      else if (rawDept.includes('EEE') || rawDept.includes('ELECTRICAL')) targetDept = 'EEE';
      else if (rawDept.includes('MECH') || rawDept.includes('ME')) targetDept = 'ME';
      else if (rawDept.includes('CIVIL') || rawDept.includes('CE')) targetDept = 'CE';

      if (targetDept && deptStats[targetDept]) {
        deptStats[targetDept].total += (s.avgProgress || 0);
        deptStats[targetDept].count += 1;
      }
    });

    return Object.keys(deptStats).map(name => ({
      name,
      avg: deptStats[name].count > 0 ? Math.round(deptStats[name].total / deptStats[name].count) : 0
    }));
  }, [students]);

  // 4. Year-wise Performance Analysis
  const yearPerformanceData = useMemo(() => {
    const yearStats = {
      '1st Year': { total: 0, count: 0 },
      '2nd Year': { total: 0, count: 0 },
      '3rd Year': { total: 0, count: 0 },
      '4th Year': { total: 0, count: 0 }
    };

    students.forEach((s) => {
      let y = s.year || 0;
      let label = '';
      if (y === 1) label = '1st Year';
      else if (y === 2) label = '2nd Year';
      else if (y === 3) label = '3rd Year';
      else if (y === 4) label = '4th Year';

      if (label && yearStats[label]) {
        yearStats[label].total += (s.avgProgress || 0);
        yearStats[label].count += 1;
      }
    });

    return Object.keys(yearStats).map(name => ({
      name,
      avg: yearStats[name].count > 0 ? Math.round(yearStats[name].total / yearStats[name].count) : 0
    }));
  }, [students]);

  // Global Average Progress
  const globalAvgProgress = useMemo(() => {
    if (!students.length) return 0;
    const total = students.reduce((acc, s) => acc + (s.avgProgress || 0), 0);
    return Math.round(total / students.length);
  }, [students]);

  // 5. Top Performers (Filtered by Dept) - Sorted by Progress
  const topPerformers = useMemo(() => {
    let filtered = students;
    if (selectedDept !== 'All') {
      filtered = students.filter((s) => s.department === selectedDept);
    }
    return [...filtered]
      .sort((a, b) => (b.avgProgress || 0) - (a.avgProgress || 0))
      .slice(0, 5);
  }, [students, selectedDept]);

  return (
    <Container maxWidth="xl" sx={{ py: 3, bgcolor: '#f8f9fd', minHeight: '100vh' }}>
      {/* TITLE ONLY */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#02367B' }}>Dashboard</Typography>
      </Box>

      {/* STATS ROW */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Total Students" value={students?.length || 0} icon={<GroupIcon />} color="#02367B" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Total Courses" value={courses?.length || 0} icon={<MenuBookIcon />} color="#006CA5" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Avg. Completion Rate" value={`${globalAvgProgress}%`} icon={<TrendingUpIcon />} color="#0496C7" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Departments" value={departmentData.length || 5} icon={<AssignmentIcon />} color="#04BADE" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="New this Month" value={students.filter((s) => new Date(s.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length} icon={<GroupIcon />} color="#006CA5" />
        </Grid>
      </Grid>

      {/* MIDDLE SECTION */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* YEAR DISTRIBUTION */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>Student Distribution</Typography>
              <Chip label="By Year" size="small" sx={{ bgcolor: '#04BADE', color: 'white' }} />
            </Box>
            <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={studentDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {studentDistribution.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* DEPARTMENT OVERVIEW */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>Department Overview</Typography>
            </Box>
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {departmentData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* TOP STUDENTS LIST */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 4, height: '100%', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="h6" fontWeight={700} sx={{ px: 1 }}>Top Performers</Typography>
              <Tabs
                value={selectedDept}
                onChange={(_, v) => setSelectedDept(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 36,
                  '& .MuiTab-root': { py: 0, minHeight: 36, fontSize: '0.75rem', color: '#02367B' },
                  '& .Mui-selected': { color: '#0496C7 !important' },
                  '& .MuiTabs-indicator': { bgcolor: '#0496C7' }
                }}
              >
                <Tab label="All" value="All" />
                {departments.map(dept => (
                  <Tab key={dept} label={dept} value={dept} />
                ))}
              </Tabs>
            </Box>
            <List dense sx={{ overflow: 'auto', flex: 1 }}>
              {topPerformers.length > 0 ? topPerformers.map((s, i) => (
                <ListItem key={s._id || i} disableGutters sx={{ px: 1 }}>
                  <ListItemAvatar>
                      {/* Avatar rendering code can be added here */}
                  </ListItemAvatar>
                  <ListItemText
                    primary={s.firstName + ' ' + s.lastName}
                    secondary={`Progress: ${s.avgProgress || 0}%`}
                  />
                </ListItem>
              )) : <Typography variant="caption" sx={{p: 2}}>No students found</Typography>}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* YEAR & DEPARTMENT DEEP DIVE */}
      <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Year & Department Progress</Typography>
            <Typography variant="body2" color="text.secondary">Filter by cohort and department, then toggle top vs least performers.</Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Year</InputLabel>
              <Select
                label="Year"
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  setDeptFilter('All');
                }}
              >
                <MenuItem value="All">All Years</MenuItem>
                {yearOptions.map((y) => (
                  <MenuItem key={y} value={y}>{y} Year</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }} disabled={!departmentOptions.length}>
              <InputLabel>Department</InputLabel>
              <Select
                label="Department"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <MenuItem value="All">All Departments</MenuItem>
                {departmentOptions.map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <ToggleButtonGroup
              size="small"
              value={rankMode}
              exclusive
              onChange={(_, v) => v && setRankMode(v)}
            >
              <ToggleButton value="top">Top</ToggleButton>
              <ToggleButton value="least">Least</ToggleButton>
            </ToggleButtonGroup>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Show</InputLabel>
              <Select
                label="Show"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                {[5, 10, 15, 20].map((n) => (
                  <MenuItem key={n} value={n}>{n} students</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setYearFilter('All');
                setDeptFilter('All');
                setRankMode('top');
                setLimit(10);
              }}
            >
              Reset
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <StatCard title="Students in View" value={filteredByYearDept.length} icon={<GroupIcon />} color="#02367B" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard title="Average Progress" value={`${selectionAverage}%`} icon={<TrendingUpIcon />} color="#0496C7" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard title="Mode" value={rankMode === 'top' ? 'Top performers' : 'Least performers'} icon={<AssignmentIcon />} color="#006CA5" />
          </Grid>
        </Grid>

        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.03)' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Department</TableCell>
                <TableCell align="center">Progress</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rankedStudents.map((s) => (
                <TableRow key={s._id} hover>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2">{`${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown'}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.email || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>{s.year || '-'}</TableCell>
                  <TableCell>{s.department || '-'}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                      <LinearProgress
                        variant="determinate"
                        value={s.avgProgress || 0}
                        sx={{ width: 90, height: 8, borderRadius: 6 }}
                        color={(s.avgProgress || 0) >= 75 ? 'success' : 'primary'}
                      />
                      <Typography variant="caption" fontWeight={700}>{Math.round(s.avgProgress || 0)}%</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {!rankedStudents.length && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No students match the selected filters yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
