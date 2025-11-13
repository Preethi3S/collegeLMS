import { Course } from '@/types';
import { Button, Card, CardActions, CardContent, Typography } from '@mui/material';
import React from 'react';

interface Props {
  course: Course;
  onEnroll?: (id: string) => void;
}

const CourseCard: React.FC<Props> = ({ course, onEnroll }) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600}>{course.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {course.description}
        </Typography>
        {/* REMOVED: Instructor line */}
      </CardContent>
      <CardActions>
        {/* CONDITIONAL: Only show Enroll button if onEnroll function is provided */}
        {onEnroll && (
          <Button 
            size="small" 
            variant="contained" 
            onClick={() => onEnroll(course.id)}
          >
            Enroll
          </Button>
        )}
        <Button 
          size="small" 
          variant={onEnroll ? "outlined" : "contained"} 
          href={`/courses/${course.id}`}
        >
          {onEnroll ? 'View Details' : 'Open Course'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default CourseCard;