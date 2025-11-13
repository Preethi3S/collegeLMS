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
        <Typography variant="h6">{course.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {course.description}
        </Typography>
        <Typography variant="caption">Instructor: {course.instructor?.firstName} {course.instructor?.lastName}</Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => onEnroll && onEnroll(course.id)}>Enroll</Button>
        <Button size="small" href={`/courses/${course.id}`}>Open</Button>
      </CardActions>
    </Card>
  );
};

export default CourseCard;
