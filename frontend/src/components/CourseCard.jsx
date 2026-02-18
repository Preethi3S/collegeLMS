import { Box, Button, Card, Typography } from '@mui/material';
import React from 'react';

const CourseCard = ({ course, onEnroll }) => {
  return (
    <Card
      sx={{
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid #E0E0E0',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          borderColor: '#1B5E8E',
        },
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box
        sx={{
          height: '200px',
          background: course.thumbnail ? `url(${course.thumbnail})` : 'linear-gradient(135deg, #1B5E8E 0%, #00897B 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: course.thumbnail ? 'transparent' : '#fff',
          fontWeight: 700,
          fontSize: '2rem',
        }}
      >
        {!course.thumbnail && (course.title?.split(' ')[0] || 'Course')}
      </Box>

      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: '#1A1A1A',
            mb: 1,
            lineHeight: 1.3,
          }}
        >
          {course.title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: '#6B7280',
            mb: 2,
            flex: 1,
            display: '-webkit-box',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.5,
          }}
        >
          {course.description}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mt: 'auto',
            pt: 2,
            borderTop: '1px solid #E0E0E0',
          }}
        >
          {course.isEnrolled ? (
            <Button
              size="small"
              variant="outlined"
              fullWidth
              disabled
              sx={{
                color: '#00897B',
                borderColor: '#00897B',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Enrolled
            </Button>
          ) : (
            onEnroll && (
              <Button
                size="small"
                variant="contained"
                fullWidth
                onClick={() => onEnroll(course.id)}
                sx={{
                  backgroundColor: '#1B5E8E',
                  color: '#fff',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#0D47A1',
                  },
                }}
              >
                Enroll
              </Button>
            )
          )}

          <Button
            size="small"
            variant={onEnroll ? 'outlined' : 'contained'}
            fullWidth
            href={`/courses/${course.id}`}
            sx={{
              borderColor: '#1B5E8E',
              color: onEnroll ? '#1B5E8E' : '#fff',
              fontWeight: 600,
              textTransform: 'none',
              backgroundColor: onEnroll ? 'transparent' : '#1B5E8E',
              '&:hover': {
                borderColor: '#0D47A1',
                backgroundColor: onEnroll ? '#F0F5FA' : '#0D47A1',
              },
            }}
          >
            {onEnroll ? 'Details' : 'Open'}
          </Button>
        </Box>
      </Box>
    </Card>
  );
}; 

export default CourseCard;
