import AdminStudentImport from '@/components/AdminStudentImport';
import { deleteStudent, listStudents } from '@/services/user.service';
import { Box, Button, Container, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

const AdminStudents: React.FC = () => {
  const { data: students, isLoading } = useQuery(['students'], () => listStudents());

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student?')) return;
    try {
      await deleteStudent(id);
      // simple refresh
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Manage Students</Typography>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <AdminStudentImport onImported={() => window.location.reload()} />
        </Box>
        {isLoading ? <div>Loading...</div> : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students?.map((s: any) => (
                <TableRow key={s._id}>
                  <TableCell>{s.username}</TableCell>
                  <TableCell>{s.firstName} {s.lastName}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.year}</TableCell>
                  <TableCell>
                    <Button size="small">View</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(s._id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
};

export default AdminStudents;
