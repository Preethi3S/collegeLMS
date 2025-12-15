import { getMyProfile, updateProfile } from '@/services/user.service';
import { Avatar, Box, Button, Card, CardContent, Divider, Grid, TextField, Typography } from '@mui/material';
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
  const [phone, setPhone] = useState('');
  const [cgpa, setCgpa] = useState<number | ''>('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [leetcodeLink, setLeetcodeLink] = useState('');
  const [skills, setSkills] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setRollNumber(user.rollNumber || '');
      setYear(user.year || '');
      setDepartment(user.department || '');
      setCgpa(user.cgpa || '');
      setLinkedinLink(user.linkedinLink || '');
      setGithubLink(user.githubLink || '');
      setLeetcodeLink(user.leetcodeLink || '');
      setSkills(
        user.skills && Array.isArray(user.skills)
          ? user.skills.join(', ')
          : user.skills || ''
      );
    }
  }, [user]);

  const mutation = useMutation((fd: FormData) => updateProfile(fd), {
    onSuccess: () => {
      queryClient.invalidateQueries(['me']);
      alert('Profile updated successfully');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();

    fd.append('firstName', firstName);
    fd.append('lastName', lastName);
    fd.append('email', email);
    if (file) fd.append('file', file);
    fd.append('rollNumber', rollNumber);
    if (year) fd.append('year', String(year));
    fd.append('department', department);
    if (cgpa) fd.append('cgpa', String(cgpa));
    fd.append('linkedinLink', linkedinLink);
    fd.append('githubLink', githubLink);
    fd.append('leetcodeLink', leetcodeLink);
    fd.append(
      'skills',
      JSON.stringify(
        skills.split(',').map((s) => s.trim()).filter(Boolean)
      )
    );

    mutation.mutate(fd);
  };

  if (isLoading)
    return (
      <Typography sx={{ color: '#6B7280' }}>Loading profile...</Typography>
    );

  return (
    <Box>
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2" sx={{ fontWeight: 600, color: '#1A1A1A' }}>
          Profile
        </Typography>
        <Typography variant="body1" sx={{ color: '#6B7280' }}>
          Manage your personal information and credentials
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* PROFILE PICTURE */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #E0E0E0'
            }}
          >
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Avatar
                src={file ? URL.createObjectURL(file) : user?.profileImage}
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: '#1B5E8E',
                  fontSize: '3rem'
                }}
              >
                {!file && !user?.profileImage && (
                  <>
                    {firstName.charAt(0)}
                    {lastName.charAt(0)}
                  </>
                )}
              </Avatar>

              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {firstName} {lastName}
              </Typography>

              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                {rollNumber || 'Roll Number'}
              </Typography>

              <Button
                variant="outlined"
                size="small"
                component="label"
                fullWidth
                sx={{
                  borderColor: '#1B5E8E',
                  color: '#1B5E8E',
                  '&:hover': {
                    borderColor: '#0D47A1',
                    backgroundColor: '#F0F5FA'
                  }
                }}
              >
                Change Photo
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* FORM SECTION */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #E0E0E0'
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <form onSubmit={handleSubmit}>
                {/* BASIC INFO */}
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Basic Information
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      disabled
                      label="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      disabled
                      label="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      disabled
                      label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      disabled
                      label="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      disabled
                      label="Roll Number"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      disabled
                      label="Department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* ACADEMIC */}
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Academic Details
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      disabled
                      label="Year"
                      type="number"
                      value={year}
                      onChange={(e) =>
                        setYear(e.target.value ? parseInt(e.target.value) : '')
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      disabled
                      label="CGPA"
                      type="number"
                      value={cgpa}
                      onChange={(e) =>
                        setCgpa(e.target.value ? parseFloat(e.target.value) : '')
                      }
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* LINKS */}
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Professional Links
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="LinkedIn"
                      value={linkedinLink}
                      onChange={(e) => setLinkedinLink(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="GitHub"
                      value={githubLink}
                      onChange={(e) => setGithubLink(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="LeetCode"
                      value={leetcodeLink}
                      onChange={(e) => setLeetcodeLink(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Skills (comma separated)"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                    />
                  </Grid>
                </Grid>

                {/* SAVE BUTTON */}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={mutation.isLoading}
                  sx={{
                    backgroundColor: '#1B5E8E',
                    color: '#fff',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#0D47A1' }
                  }}
                >
                  {mutation.isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                {file && (
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Selected: {file.name}
                  </Typography>
                )}
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
