import { getMyProfile, updateProfile } from '@/services/user.service';
import { Avatar, Box, Button, Chip, Container, Divider, Grid, LinearProgress, Paper, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery(['me'], getMyProfile);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rollNumber, setRollNumber] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [department, setDepartment] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [cgpa, setCgpa] = useState<number | ''>('');
  const [percentage12, setPercentage12] = useState<number | ''>('');
  const [percentage10, setPercentage10] = useState<number | ''>('');
  const [hasArrears, setHasArrears] = useState(false);
  const [skills, setSkills] = useState('');
  const [codingPlatformLink, setCodingPlatformLink] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setRollNumber(user.rollNumber || '');
      setYear(user.year || '');
      setDepartment(user.department || '');
      setAge(user.age || '');
      setDateOfBirth(user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0,10) : '');
      setCgpa(user.cgpa || '');
      setPercentage12(user.percentage12 || '');
      setPercentage10(user.percentage10 || '');
      setHasArrears(user.hasArrears || false);
      setSkills((user.skills && user.skills.join ? user.skills.join(', ') : user.skills) || '');
      setCodingPlatformLink(user.codingPlatformLink || '');
      setGithubLink(user.githubLink || '');
      setLinkedinLink(user.linkedinLink || '');
    }
  }, [user]);

  const mutation = useMutation((fd: FormData) => updateProfile(fd), {
    onSuccess: (data) => {
      queryClient.invalidateQueries(['me']);
      alert('Profile updated');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('firstName', firstName);
    fd.append('lastName', lastName);
    fd.append('email', email);
    if (file) fd.append('file', file);
    if (resumeFile) fd.append('resume', resumeFile);
    fd.append('rollNumber', rollNumber);
    if (year) fd.append('year', String(year));
    fd.append('department', department);
    if (age) fd.append('age', String(age));
    if (dateOfBirth) fd.append('dateOfBirth', dateOfBirth);
    if (cgpa) fd.append('cgpa', String(cgpa));
    if (percentage12) fd.append('percentage12', String(percentage12));
    if (percentage10) fd.append('percentage10', String(percentage10));
    fd.append('hasArrears', String(hasArrears));
    fd.append('skills', JSON.stringify(skills.split(',').map(s => s.trim()).filter(Boolean)));
    fd.append('codingPlatformLink', codingPlatformLink);
    fd.append('githubLink', githubLink);
    fd.append('linkedinLink', linkedinLink);
    mutation.mutate(fd);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>Profile</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }} elevation={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar src={user?.profileImage} sx={{ width: 96, height: 96 }} />
              <Box>
                <Typography variant="h6">{user?.firstName} {user?.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip label={user?.department || 'Department'} size="small" sx={{ mr: 1 }} />
                  <Chip label={user?.year ? `Year ${user.year}` : 'Year'} size="small" />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">Academic Progress</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress variant="determinate" value={user?.cgpa ? Math.min((Number(user.cgpa) / 10) * 100, 100) : 0} />
                </Box>
                <Typography variant="body2" sx={{ minWidth: 46 }}>{user?.cgpa || 'N/A'}</Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Quick Info</Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2"><strong>Roll:</strong> {user?.rollNumber || '—'}</Typography>
                <Typography variant="body2"><strong>Age:</strong> {user?.age || '—'}</Typography>
                <Typography variant="body2"><strong>CGPA:</strong> {user?.cgpa || '—'}</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button variant="contained" size="small">Message</Button>
              <Button variant="outlined" size="small" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Edit</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }} elevation={1}>
            <Typography variant="h6" sx={{ mb: 2 }}>Edit Profile</Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Roll number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth label="Year" type="number" inputProps={{ min: 1, max: 4 }} value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="CGPA" type="number" value={cgpa} onChange={(e) => setCgpa(e.target.value ? Number(e.target.value) : '')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="12th %" type="number" value={percentage12} onChange={(e) => setPercentage12(e.target.value ? Number(e.target.value) : '')} />
                </Grid>

                <Grid item xs={12}>
                  <TextField fullWidth label="Skills (comma separated)" value={skills} onChange={(e) => setSkills(e.target.value)} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Github link" value={githubLink} onChange={(e) => setGithubLink(e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="LinkedIn link" value={linkedinLink} onChange={(e) => setLinkedinLink(e.target.value)} />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button type="submit" variant="contained">Save changes</Button>
                    <Button variant="outlined" onClick={() => window.location.reload()}>Discard</Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
