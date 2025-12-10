import { createStudent } from '@/services/user.service';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import React, { useState } from 'react';

interface CreateStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateStudentModal: React.FC<CreateStudentModalProps> = ({ open, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !email || !password) {
      setError('Username, email and password are required');
      return;
    }

    setLoading(true);
    try {
      await createStudent({
        username,
        email,
        password,
        firstName,
        lastName,
        year: year || 1,
        rollNumber,
        department,
      });
      
      // Reset form
      setUsername('');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setYear('');
      setRollNumber('');
      setDepartment('');
      
      onSuccess && onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating student');
    } finally {
      setLoading(false);
    }
  };

  const yearOptions = [1, 2, 3, 4];
  const departmentOptions = [
    'CSE',
    'IT',
    'BME',
    'CSE(AIML)',
    'CSBS',
    'CE',
    'MECHANICAL',
    'MECHATRONICS',
    'ECE',
    'EEE',
    'AIDS',
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New Student</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
              {error}
            </Box>
          )}
          
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
          />

          <FormControl fullWidth disabled={loading}>
            <InputLabel>Year</InputLabel>
            <Select
              value={year}
              label="Year"
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((yr) => (
                <MenuItem key={yr} value={yr}>
                  {yr}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Roll Number"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            disabled={loading}
          />

          <FormControl fullWidth disabled={loading}>
            <InputLabel>Department</InputLabel>
            <Select
              value={department}
              label="Department"
              onChange={(e) => setDepartment(e.target.value)}
            >
              {departmentOptions.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Student'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateStudentModal;

