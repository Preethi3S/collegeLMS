import AdminStudentDeleteBulk from '@/components/AdminStudentDeleteBulk';
import AdminStudentImport from '@/components/AdminStudentImport';
import {StudentProfileModal} from '@/components/StudentProfileModal';
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
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
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

  // Profile modal state
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [rollNumberFilter, setRollNumberFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

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

  // Filter students based on criteria
  const filteredStudents = students?.filter((student: any) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const nameMatch = !nameFilter || fullName.includes(nameFilter.toLowerCase());
    const rollMatch = !rollNumberFilter || (student.rollNumber || '').toLowerCase().includes(rollNumberFilter.toLowerCase());
    const deptMatch = !departmentFilter || student.department === departmentFilter;
    const yearMatch = !yearFilter || student.year?.toString() === yearFilter;
    return nameMatch && rollMatch && deptMatch && yearMatch;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 1, px: 1 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>Manage Students</Typography>

      <Paper sx={{ p: 1, borderRadius: 3 }} elevation={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => setOpenCreate(true)}>
            Create Student
          </Button>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <AdminStudentDeleteBulk onDeleted={() => queryClient.invalidateQueries(['students'])} />
            <AdminStudentImport onImported={() => queryClient.invalidateQueries(['students'])} />
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            label="Search by Name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          />
          <TextField
            size="small"
            label="Roll Number"
            value={rollNumberFilter}
            onChange={(e) => setRollNumberFilter(e.target.value)}
            sx={{ minWidth: 120 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentFilter}
              label="Department"
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Computer Science">Computer Science</MenuItem>
              <MenuItem value="Information Technology">Information Technology</MenuItem>
              <MenuItem value="Electronics">Electronics</MenuItem>
              <MenuItem value="Mechanical">Mechanical</MenuItem>
              <MenuItem value="Civil">Civil</MenuItem>
              <MenuItem value="Electrical">Electrical</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={yearFilter}
              label="Year"
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="1">1st Year</MenuItem>
              <MenuItem value="2">2nd Year</MenuItem>
              <MenuItem value="3">3rd Year</MenuItem>
              <MenuItem value="4">4th Year</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => {
              setNameFilter('');
              setRollNumberFilter('');
              setDepartmentFilter('');
              setYearFilter('');
            }}
          >
            Clear Filters
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ '& td, & th': { py: 0.75, px: 1 } }}>
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
                {filteredStudents?.map((s: any) => (
                  <TableRow key={s._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell>{s.username}</TableCell>
                    <TableCell>{s.firstName} {s.lastName}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.year}</TableCell>
                    <TableCell>{s.department || '—'}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => setSelectedStudent(s)}>View</Button>
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

      {selectedStudent && (
        <StudentProfileModal 
          student={selectedStudent} 
          open={!!selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </Container>
  );
};

export default AdminStudents;

