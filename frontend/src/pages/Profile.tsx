import { getMyProfile, updateProfile } from '@/services/user.service';
import { Avatar, Box, Button, Container, TextField, Typography } from '@mui/material';
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
    <Container maxWidth="sm">
      <Box sx={{ mt: 3 }}>
        <Typography variant="h5">Profile</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <Avatar src={user?.profileImage} sx={{ width: 80, height: 80 }} />
          <div>
            <Typography>{user?.firstName} {user?.lastName}</Typography>
            <Typography variant="caption">{user?.email}</Typography>
          </div>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField fullWidth label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />

          <TextField fullWidth label="Roll number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Year" type="number" inputProps={{ min: 1, max: 4 }} value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')} sx={{ mb: 2 }} />
          <TextField fullWidth label="Date of birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />

          <Box sx={{ mt: 1 }}>Profile image: <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} /></Box>
          <Box sx={{ mt: 1 }}>Resume (PDF/DOC): <input type="file" onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)} /></Box>

          <TextField fullWidth label="CGPA" type="number" value={cgpa} onChange={(e) => setCgpa(e.target.value ? Number(e.target.value) : '')} sx={{ mb: 2 }} />
          <TextField fullWidth label="12th %" type="number" value={percentage12} onChange={(e) => setPercentage12(e.target.value ? Number(e.target.value) : '')} sx={{ mb: 2 }} />
          <TextField fullWidth label="10th %" type="number" value={percentage10} onChange={(e) => setPercentage10(e.target.value ? Number(e.target.value) : '')} sx={{ mb: 2 }} />

          <Box sx={{ mb: 2 }}>
            <label><input type="checkbox" checked={hasArrears} onChange={(e) => setHasArrears(e.target.checked)} /> Has arrears</label>
          </Box>

          <TextField fullWidth label="Skills (comma separated)" value={skills} onChange={(e) => setSkills(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Coding platform link" value={codingPlatformLink} onChange={(e) => setCodingPlatformLink(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Github link" value={githubLink} onChange={(e) => setGithubLink(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="LinkedIn link" value={linkedinLink} onChange={(e) => setLinkedinLink(e.target.value)} sx={{ mb: 2 }} />

          <Button type="submit" variant="contained" sx={{ mt: 2 }}>Save</Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Profile;
