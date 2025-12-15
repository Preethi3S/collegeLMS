import { getCourses } from '@/services/course.service';
import { listStudents } from '@/services/user.service';
import {
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  MenuBook as MenuBookIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#02367B', '#006CA5', '#0496C7', '#04BADE', '#55E2E9'];

const StatCard = ({ title, value, icon, color }: any) => (
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

const AdminDashboard: React.FC = () => {
  const { data: students = [] } = useQuery(['students'], () => listStudents());
  const { data: courses = [] } = useQuery(['courses'], () => getCourses());
  const [selectedDept, setSelectedDept] = useState('All');

  // --- Derived Data Calculations ---

  // 1. Year Distribution
  const studentDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s: any) => {
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
    const counts: Record<string, number> = {};
    students.forEach((s: any) => {
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

  // 3. Department Progress Distribution
  const deptProgressDistribution = useMemo(() => {
    // Define exact target departments with short codes as requested for better UI
    const deptStats: Record<string, { total: number; count: number }> = {
      'CSE': { total: 0, count: 0 },
      'IT': { total: 0, count: 0 },
      'ECE': { total: 0, count: 0 },
      'EEE': { total: 0, count: 0 },
      'ME': { total: 0, count: 0 },
      'CE': { total: 0, count: 0 }
    };

    students.forEach((s: any) => {
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
    const yearStats: Record<string, { total: number; count: number }> = {
      '1st Year': { total: 0, count: 0 },
      '2nd Year': { total: 0, count: 0 },
      '3rd Year': { total: 0, count: 0 },
      '4th Year': { total: 0, count: 0 }
    };

    students.forEach((s: any) => {
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
    const total = students.reduce((acc: number, s: any) => acc + (s.avgProgress || 0), 0);
    return Math.round(total / students.length);
  }, [students]);

  // 5. Top Performers (Filtered by Dept) - Sorted by Progress
  const topPerformers = useMemo(() => {
    let filtered = students;
    if (selectedDept !== 'All') {
      filtered = students.filter((s: any) => s.department === selectedDept);
    }
    return [...filtered]
      .sort((a: any, b: any) => (b.avgProgress || 0) - (a.avgProgress || 0))
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
          <StatCard title="New this Month" value={students.filter((s: any) => new Date(s.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length} icon={<GroupIcon />} color="#006CA5" />
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
                    {studentDistribution.map((entry, index) => (
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
                    {departmentData.map((entry, index) => (
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
              {topPerformers.length > 0 ? topPerformers.map((s: any, i) => (
                <ListItem key={s._id || i} disableGutters sx={{ px: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: COLORS[i % COLORS.length], width: 32, height: 32, fontSize: '0.85rem' }}>
                      {s.firstName?.[0]}{s.lastName?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight={600}>{s.firstName} {s.lastName}</Typography>
                    }
                    secondary={`${s.department || 'N/A'} • Year ${s.year || '-'}`}
                  />
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" fontWeight={700} color="#006CA5" display="block">
                      {Math.round(s.avgProgress || 0)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                      Avg Progress
                    </Typography>
                  </Box>
                </ListItem>
              )) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No students found.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* BOTTOM SECTION */}
      <Grid container spacing={3}>
        {/* PROGRESS DISTRIBUTION BY DEPT */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>Progress by Department</Typography>
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptProgressDistribution} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} unit="%" />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="avg" fill="#006CA5" radius={[10, 10, 10, 10]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* YEAR-WISE PERFORMANCE */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Average Progress by Year</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} fontWeight={600} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="avg" fill="#02367B" radius={[0, 10, 10, 0]} barSize={30}>
                    {/* Optional: Add label values to end of bars */}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
