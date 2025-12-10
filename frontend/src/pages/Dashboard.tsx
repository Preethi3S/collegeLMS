import CourseCard from '@/components/CourseCard';
import useAuthStore from '@/context/auth.store';
import api from '@/services/api';
import { getDashboard } from '@/services/user.service';
import {
    Avatar,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Grid,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';

const Dashboard: React.FC = () => {
    const { user } = useAuthStore();
    
    // Fetch dynamic dashboard data from backend
    const { data: dashboardData, isLoading: loadingDashboard } = useQuery(
        ['dashboard'],
        () => getDashboard()
    );
    
    // Fetch presence calendar data
    const { data: presenceData, isLoading: loadingPresence } = useQuery(
        ['presence'],
        async () => {
            const res = await api.get('/presence?days=30');
            return res.data.records || [];
        }
    );

    // Send heartbeat every 30 seconds while on dashboard
    useEffect(() => {
        const heartbeat = setInterval(async () => {
            try {
                await api.post('/presence/heartbeat', { seconds: 30 });
            } catch (err) {
                console.error('Heartbeat failed:', err);
            }
        }, 30000);

        return () => clearInterval(heartbeat);
    }, []);

    const isLoading = loadingDashboard || loadingPresence;
    if (isLoading)
        return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 5 }} />;

    const stats = dashboardData?.stats || { lessons: 0, assignments: 0, tests: 0, hours: 0, coursesCount: 0 };
    const courses = dashboardData?.courses || [];
    const presenceMap: Record<string, number> = {};
    presenceData?.forEach((p: any) => {
        presenceMap[p.date] = p.seconds;
    });

    // Generate calendar grid for last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const calendarDays = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date(thirtyDaysAgo);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        calendarDays.push({ date: dateStr, seconds: presenceMap[dateStr] || 0 });
    }

    const getPresenceColor = (seconds: number) => {
        if (seconds === 0) return '#f0f0f0';
        if (seconds < 600) return '#b3e5fc'; // 10 min
        if (seconds < 1800) return '#81d4fa'; // 30 min
        if (seconds < 3600) return '#4fc3f7'; // 1 hour
        return '#0288d1'; // 1+ hour
    };

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                Welcome Back{user?.firstName ? `, ${user.firstName}` : ''}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Ready to continue your learning journey? Explore the courses available to you below.
            </Typography>

            {/* --- Top Status Cards (Dynamic) --- */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1} sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <div>
                                    <Typography variant="caption" color="text.secondary">Lessons</Typography>
                                    <Typography variant="h5" fontWeight={700}>{stats.lessons}</Typography>
                                </div>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>L</Avatar>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1} sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <div>
                                    <Typography variant="caption" color="text.secondary">Assignments</Typography>
                                    <Typography variant="h5" fontWeight={700}>{stats.assignments}</Typography>
                                </div>
                                <Avatar sx={{ bgcolor: 'secondary.main' }}>A</Avatar>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1} sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <div>
                                    <Typography variant="caption" color="text.secondary">Tests</Typography>
                                    <Typography variant="h5" fontWeight={700}>{stats.tests}</Typography>
                                </div>
                                <Avatar sx={{ bgcolor: '#10b981' }}>T</Avatar>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1} sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <div>
                                    <Typography variant="caption" color="text.secondary">Hours Spent</Typography>
                                    <Typography variant="h5" fontWeight={700}>{stats.hours}h</Typography>
                                </div>
                                <Avatar sx={{ bgcolor: '#f59e0b' }}>H</Avatar>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* --- Presence Calendar (Last 30 Days) --- */}
            <Card sx={{ p: 3, borderRadius: 3, mb: 4 }} elevation={1}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>📅 Activity Calendar (Last 30 Days)</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(30px, 1fr))', gap: 1 }}>
                    {calendarDays.map((day) => (
                        <Tooltip 
                            key={day.date} 
                            title={`${day.date}: ${Math.round(day.seconds / 60)} mins`}
                            arrow
                        >
                            <Box
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 1,
                                    bgcolor: getPresenceColor(day.seconds),
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'scale(1.15)' }
                                }}
                            />
                        </Tooltip>
                    ))}
                </Box>
            </Card>

            {/* --- Courses Available for Your Year --- */}
            <Typography variant="h5" fontWeight={600} sx={{ mt: 2, mb: 2, color: 'text.primary' }}>
                ✨ Courses Available for Your Year
            </Typography>
            <Grid container spacing={3}>
                {courses.length ? (
                    courses.map((c: any) => (
                        <Grid item xs={12} md={6} lg={4} key={c.id}>
                            <CourseCard 
                                course={{ ...c, instructor: undefined }} 
                            />
                        </Grid>
                    ))
                ) : (
                    <Box sx={{ p: 3, ml: 2 }}>
                        <Typography color="text.secondary">
                            No courses are currently available for your specified year or student group.
                        </Typography>
                    </Box>
                )}
            </Grid>
        </Container>
    );
};

export default Dashboard;