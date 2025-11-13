import { createStudent } from '@/services/user.service';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import React, { useState } from 'react';

const CreateStudent: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password)
      return alert('Username, email and password are required');

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
      alert('Student created successfully!');
      setUsername('');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setYear('');
      setRollNumber('');
      setDepartment('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating student');
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
    <Container maxWidth="sm">
      <Box sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create Student
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Year Dropdown */}
          <FormControl fullWidth sx={{ mb: 2 }}>
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
            label="Roll number"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Department Dropdown */}
          <FormControl fullWidth sx={{ mb: 2 }}>
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

          <Button
            variant="contained"
            type="submit"
            disabled={loading}
            fullWidth
          >
            {loading ? 'Creating...' : 'Create Student'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default CreateStudent;
