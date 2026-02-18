import api from '@/services/api';
import { Mail as MailIcon, Phone as PhoneIcon, School as SchoolIcon } from '@mui/icons-material';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    Stack,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

export const StudentProfileModal = ({
  open,
  studentId,
  onClose,
}) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [githubStats, setGithubStats] = useState(null);
  const [leetcodeStats, setLeetcodeStats] = useState(null);

  useEffect(() => {
    if (open && studentId) {
      fetchStudent();
    }
  }, [open, studentId]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/users/students/${studentId}`);
      setStudent(res.data.student || res.data);
      // fetch external coding stats after student data is available
      try {
        const s = res.data.student || res.data;
        if (s?.githubLink) {
          const ghUser = extractGitHubUsername(s.githubLink);
          if (ghUser) {
            fetch(`https://api.github.com/users/${ghUser}`)
              .then((r) => r.json())
              .then((data) => setGithubStats(data))
              .catch(() => { });
          }
        }

        if (s?.leetcodeLink) {
          const lcUser = extractLeetCodeUsername(s.leetcodeLink);
          if (lcUser) {
            // Server-side proxy to avoid CORS issues
            fetch(`/api/external/leetcode/${encodeURIComponent(lcUser)}`)
              .then((r) => r.json())
              .then((resGraph) => setLeetcodeStats(resGraph?.data?.matchedUser || null))
              .catch(() => setLeetcodeStats(null));
          }
        }
      } catch (err) {
        console.error('Error fetching external stats', err);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch student profile');
      console.error('Error fetching student:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractGitHubUsername = (url) => {
    try {
      const u = new URL(url);
      return u.pathname.replace(/^\//, '').split('/')[0];
    } catch {
      // fallback parsing
      return url.split('github.com/')[1]?.split('/')[0];
    }
  };

  const extractLeetCodeUsername = (url) => {
    try {
      const u = new URL(url);
      return u.pathname.replace(/^\//, '').split('/')[0];
    } catch {
      return url.split('leetcode.com/')[1]?.split('/')[0];
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: 1 }}>
        👤 Student Profile
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : student ? (
          <Stack spacing={3}>
            {/* Header with Avatar */}
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={student.profileImage}
                sx={{
                  width: 100,
                  height: 100,
                  margin: '0 auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                }}
              >
                {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>
                {student.firstName} {student.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {student.email}
              </Typography>
            </Box>

            <Divider />

            {/* Basic Info */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                📋 Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Roll Number
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {student.rollNumber || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Year
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {student.year ? `${student.year}${student.year === 1 ? 'st' : student.year === 2 ? 'nd' : student.year === 3 ? 'rd' : 'th'} Year` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Department
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {student.department || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    CGPA
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {student.cgpa || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={student.isActive ? 'Active' : 'Inactive'}
                    color={student.isActive ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Contact Info */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                📞 Contact Information
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2">{student.email || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2">{student.phone || 'N/A'}</Typography>
                </Box>
                {student.dateOfBirth && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      DOB: {new Date(student.dateOfBirth).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Skills */}
            {student.skills && Array.isArray(student.skills) && student.skills.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  🎯 Skills
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {student.skills.map((skill, idx) => (
                    <Chip key={idx} label={skill} variant="outlined" size="small" />
                  ))}
                </Box>
              </Box>
            )}

            {/* Professional & Coding Profiles */}
            {(student.linkedinLink || student.githubLink || student.leetcodeLink) && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  🔗 Professional Profiles
                </Typography>
                <Stack spacing={1}>
                  {student.linkedinLink && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>LinkedIn</Typography>
                        <Typography variant="caption" color="text.secondary">{student.linkedinLink}</Typography>
                      </Box>
                      <Button size="small" href={student.linkedinLink} target="_blank" sx={{ mt: 1 }}>View</Button>
                    </Box>
                  )}

                  {student.githubLink && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>GitHub</Typography>
                        <Typography variant="caption" color="text.secondary">{student.githubLink}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        {githubStats ? (
                          <Typography variant="body2">{githubStats.followers || 0} followers • {githubStats.public_repos || 0} repos</Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Stats unavailable</Typography>
                        )}
                        <Button size="small" href={student.githubLink} target="_blank" sx={{ mt: 1 }}>View</Button>
                      </Box>
                    </Box>
                  )}

                  {student.leetcodeLink && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>LeetCode</Typography>
                        <Typography variant="caption" color="text.secondary">{student.leetcodeLink}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        {leetcodeStats ? (
                          <Typography variant="body2">Ranking: {leetcodeStats.profile?.ranking ?? 'N/A'}</Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Stats unavailable</Typography>
                        )}
                        <Button size="small" href={student.leetcodeLink} target="_blank" sx={{ mt: 1 }}>View</Button>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}

            {/* Enrollment Date */}
            {student.createdAt && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Member Since
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {new Date(student.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </Stack>
        ) : (
          <Typography color="text.secondary">No student data available.</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};
