import CourseCard from '@/components/CourseCard';
import useAuthStore from '@/context/auth.store';
import { getCourses } from '@/services/course.service';
import { getProgress } from '@/services/progress.service';
import { getEnrolledCourses } from '@/services/course.service'; 
import {
    Container,
    Grid,
    Typography,
    Box,
    LinearProgress,
    Paper,
    CircularProgress,
    Divider,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

// NOTE: EnrolledCoursePaper component is now removed as it's not used.

const Dashboard: React.FC = () => {
    const { user } = useAuthStore();
    
    // Fetch courses available to the student (using the backend filtering logic)
    const { data: availableCourses, isLoading: loadingAvailable } = useQuery(
        ['availableCourses'],
        () => getCourses(true)
    );
    
    // NOTE: Removed the useQuery for enrolledCourses and the useEffect for progressMap.

    if (loadingAvailable)
        return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 5 }} />;


    return (
        <Container sx={{ py: 3 }}>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                Welcome Back{user?.firstName ? `, ${user.firstName}` : ''}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Ready to continue your learning journey? Explore the courses available to you below.
            </Typography>

            {/* --- Courses Available for Your Year (Primary Dashboard Content) --- */}
            <Typography variant="h5" fontWeight={600} sx={{ mt: 4, mb: 2, color: 'text.primary' }}>
                ✨ Courses Available for Your Year
            </Typography>
            <Grid container spacing={3}>
                {availableCourses?.length ? (
                    availableCourses.map((c: any) => (
                        <Grid item xs={12} md={6} lg={4} key={c._id || c.id}>
                            <CourseCard 
                                course={{ ...c, id: c._id || c.id, instructor: undefined }} 
                                // Enrollment button remains hidden on Dashboard as no onEnroll prop is passed
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