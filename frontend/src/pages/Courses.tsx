import CourseCard from '@/components/CourseCard';
import { enroll, getCourses } from '@/services/course.service';
import { Container, Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

const Courses: React.FC = () => {
  const { data: courses, isLoading } = useQuery(['courses'], () => getCourses(false));

  const handleEnroll = async (id: string) => {
    try {
      await enroll(id);
      alert('Enrolled successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error enrolling');
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>All Courses</Typography>
      {isLoading ? <div>Loading...</div> : (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {courses?.length ? courses.map((c: any) => (
            <Grid item xs={12} md={6} key={c._id || c.id}>
              <CourseCard course={{ ...c, id: c._id || c.id }} onEnroll={handleEnroll} />
            </Grid>
          )) : <Typography sx={{ mt: 1 }}>No courses found.</Typography>}
        </Grid>
      )}
    </Container>
  );
};

export default Courses;