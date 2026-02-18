import CourseCard from '@/components/CourseCard';
import { enroll, getCourses } from '@/services/course.service';
import { Box, Grid, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const { data: courses, isLoading, refetch } = useQuery(['courses'], () => getCourses(true));

  const filteredCourses = courses?.filter((c) =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    return a.title.localeCompare(b.title);
  });

  const handleEnroll = async (id) => {
    try {
      await enroll(id);
      alert('Enrolled successfully');
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Error enrolling');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2" sx={{ fontWeight: 600, color: '#1A1A1A', mb: 0.5 }}>
          Available Courses
        </Typography>
        <Typography variant="body1" sx={{ color: '#6B7280' }}>
          Browse and enroll in courses that match your interests
        </Typography>
      </Box>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        <TextField
          fullWidth
          placeholder="Search courses by title or description"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            flexGrow: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '4px',
              '&:hover fieldset': {
                borderColor: '#1B5E8E',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1B5E8E',
              },
            },
          }}
        />
        <TextField
          select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          SelectProps={{
            native: true,
          }}
          sx={{
            minWidth: '180px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '4px',
              '&:hover fieldset': {
                borderColor: '#1B5E8E',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1B5E8E',
              },
            },
          }}
        >
          <option value="newest">Latest</option>
          <option value="name">Alphabetically</option>
        </TextField>
      </Box>

      {/* Courses Grid */}
      {isLoading ? (
        <Typography sx={{ mt: 2, color: '#6B7280' }}>Loading courses...</Typography>
      ) : sortedCourses.length > 0 ? (
        <Grid container spacing={2}>
          {sortedCourses.map((c) => (
            <Grid item xs={12} md={6} key={c._id || c.id}>
              <CourseCard 
                course={{ 
                  ...c, 
                  id: c._id || c.id,
                  instructor: "CDC",
                }} 
                onEnroll={handleEnroll} 
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box 
          sx={{
            textAlign: 'center',
            py: 6,
            backgroundColor: '#F8F9FA',
            borderRadius: '4px',
            border: '1px solid #E0E0E0',
          }}
        >
          <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
            {searchTerm ? 'No courses found matching your search' : 'No available courses at the moment'}
          </Typography>
          {searchTerm && (
            <Typography 
              variant="body2" 
              sx={{ color: '#6B7280', cursor: 'pointer' }}
              onClick={() => setSearchTerm('')}
            >
              Try clearing your search
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Courses;
