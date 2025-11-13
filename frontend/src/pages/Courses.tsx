import CourseCard from '@/components/CourseCard';
import { enroll, getCourses } from '@/services/course.service';
import { Container, Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

const Courses: React.FC = () => {
  // IMPORTANT: getCourses(true) ensures only courses the student is authorized to see
  // (based on allowedYears, allowedStudents, or global status) are returned by the API.
  const { data: courses, isLoading } = useQuery(['courses'], () => getCourses(true));

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
      <Typography variant="h4" gutterBottom>All Available Courses</Typography>
      {isLoading ? <div>Loading...</div> : (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {courses?.length ? courses.map((c: any) => (
            <Grid item xs={12} md={6} key={c._id || c.id}>
              <CourseCard 
                course={{ 
                    ...c, 
                    id: c._id || c.id,
                      instructor: "CDC", // REMOVED: Explicitly remove instructor
                }} 
                onEnroll={handleEnroll} 
            />
            </Grid>
          )) : <Typography sx={{ mt: 1 }}>No available courses found.</Typography>}
        </Grid>
      )}
    </Container>
  );
};

export default Courses;