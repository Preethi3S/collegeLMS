import AdminCourseForm from '@/components/AdminCourseForm';
import AdminCourseImport from '@/components/AdminCourseImport';
import AdminCourseProgress from '@/components/AdminCourseProgress';
import api from '@/services/api';
import { getCourses } from '@/services/course.service';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Typography,
  LinearProgress
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

const AdminCourses: React.FC = () => {
  // getCourses(false) for admin fetches all courses
  const { data: courses, refetch, isError, isLoading } = useQuery(['allCourses'], () => getCourses(false), {
    onError: (err: any) => {
      console.error('Error fetching courses:', err);
      alert(err.message || 'Failed to fetch courses');
    },
  });

  const [open, setOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditCourse(null);
    setOpen(true);
  };

  const handleEdit = (course: any) => {
    if (!course?._id) return alert('Invalid course data');
    setEditCourse(course);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!id || !confirm('Are you sure you want to delete this course?')) return;
    setDeleting(true);
    try {
      await api.delete(`/courses/${id}`);
      await refetch();
      alert('Course deleted successfully');
    } catch (err: any) {
      console.error('Error deleting course:', err);
      alert(err.response?.data?.message || 'Error deleting course');
    } finally {
      setDeleting(false);
    }
  };

  const handleProgress = (courseId: string) => {
    setSelectedCourseId(courseId);
    setProgressDialogOpen(true);
  };

  return (
    <Container sx={{ py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Manage Courses
        </Typography>
        <Box>
          <AdminCourseImport onImported={() => refetch()} />
          <Button
            sx={{ mr: 1 }}
            variant="outlined"
            onClick={async () => {
              try {
                const res = await api.get('/courses/export', { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                const filename = `courses_export_${new Date().toISOString().slice(0, 10)}.csv`;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
              } catch (err: any) {
                alert(err.response?.data?.message || 'Error exporting');
              }
            }}
          >
            Export CSV
          </Button>
          <Button variant="contained" onClick={handleCreate}>
            Create Course
          </Button>
        </Box>
      </Box>

      {/* Course List */}
      <Paper sx={{ p: 2 }}>
        {isError ? (
          <Typography color="error" align="center">
            Error loading courses. Please try again.
          </Typography>
        ) : isLoading ? (
          <Typography align="center">Loading...</Typography>
        ) : !courses?.length ? (
          <Typography align="center">No courses found.</Typography>
        ) : (
          <List>
            {courses.map((course: any) => (
              <ListItem
                key={course._id}
                button
                onDoubleClick={() => handleEdit(course)}
                disabled={deleting}
                sx={{
                  '&:hover': {
                    backgroundColor: '#f7f7f9',
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {course.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2">
                        Instructor: {course.instructor?.firstName || ''}{' '}
                        {course.instructor?.lastName || ''} • Years:{' '}
                        {Array.isArray(course.allowedYears)
                          ? course.allowedYears.join(', ')
                          : 'N/A'}
                      </Typography>

                      {/* Progress Bar for average completion */}
                      {course.analytics?.averageProgress !== undefined && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            Avg. Completion: {Math.round(course.analytics.averageProgress)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={course.analytics.averageProgress}
                            sx={{ height: 6, borderRadius: 1 }}
                          />
                        </Box>
                      )}
                    </>
                  }
                />

                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleProgress(course._id)}
                    sx={{ mr: 1 }}
                  >
                    Progress
                  </Button>
                  <IconButton
                    edge="end"
                    onClick={() => handleEdit(course)}
                    disabled={deleting}
                    sx={{ mr: 1 }}
                  >
                    <i className="ri-edit-line" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => course._id && handleDelete(course._id)}
                    disabled={deleting || !course._id}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      {/* This component (AdminCourseForm) needs to handle allowedYears and allowedStudents inputs */}
      <AdminCourseForm
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => refetch()}
        courseToEdit={editCourse}
      />

      {/* Progress Dialog */}
      <Dialog
        open={progressDialogOpen}
        onClose={() => setProgressDialogOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>📊 Course Progress Analytics</DialogTitle>
        <DialogContent>
          {selectedCourseId && (
            <AdminCourseProgress courseId={selectedCourseId} />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default AdminCourses;