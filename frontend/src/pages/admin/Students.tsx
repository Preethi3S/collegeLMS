import AdminStudentDeleteBulk from '@/components/AdminStudentDeleteBulk';
import AdminStudentImport from '@/components/AdminStudentImport';
import { deleteStudent, listStudents } from '@/services/user.service';
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import CreateStudentModal from './CreateStudent';

const AdminStudents: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: students, isLoading } = useQuery(['students'], () => listStudents());
  const [openCreate, setOpenCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteStudent(deleteId);
      queryClient.invalidateQueries(['students']);
      setDeleteId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deleting student');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries(['students']);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Manage Students</Typography>

      <Paper sx={{ p: 2, borderRadius: 3 }} elevation={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => setOpenCreate(true)}>
            ➕ Create Student
          </Button>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <AdminStudentDeleteBulk onDeleted={() => queryClient.invalidateQueries(['students'])} />
            <AdminStudentImport onImported={() => queryClient.invalidateQueries(['students'])} />
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Year</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {students?.map((s: any) => (
                  <TableRow key={s._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell>{s.username}</TableCell>
                    <TableCell>{s.firstName} {s.lastName}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.year}</TableCell>
                    <TableCell>{s.department || '—'}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">View</Button>
                      <Button 
                        size="small" 
                        color="error" 
                        sx={{ ml: 1 }}
                        onClick={() => setDeleteId(s._id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      <CreateStudentModal 
        open={openCreate} 
        onClose={() => setOpenCreate(false)}
        onSuccess={handleCreateSuccess}
      />

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this student? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminStudents;

