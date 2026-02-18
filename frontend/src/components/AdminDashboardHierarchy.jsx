import api from '@/services/api';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Collapse,
    Divider,
    Grid,
    IconButton,
    Paper,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';

export const AdminDashboardHierarchy = ({ selectedCourseId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedYears, setExpandedYears] = useState([]);
  const [expandedDepts, setExpandedDepts] = useState([]);

  useEffect(() => {
    fetchHierarchyData();
  }, [selectedCourseId]);

  const fetchHierarchyData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all students
      const res = await api.get('/users/students');
      const students = res.data.students || [];

      // Group by year and department
      const yearMap = new Map();
      const years = ['1st', '2nd', '3rd', '4th'];
      const departments = ['CSE', 'ECE', 'ME', 'CE', 'EE'];

      // Initialize structure
      years.forEach(year => {
        yearMap.set(year, new Map());
        departments.forEach(dept => {
          yearMap.get(year).set(dept, []);
        });
      });

      // Populate with students
      students.forEach(student => {
        // Extract year from rollNo (e.g., "2401234" -> "1st" year if first 2 digits are 24)
        // Or use a default logic
        const year = student.rollNo?.substring(0, 2) === '24' ? '1st' : '2nd'; // Simplified
        const dept = student.rollNo?.substring(2, 5) || 'CSE'; // Simplified
        
        if (yearMap.has(year) && yearMap.get(year).has(dept)) {
          yearMap.get(year).get(dept).push(student);
        }
      });

      // Convert to array structure
      const hierarchyData = years.map(year => ({
        year,
        departments: departments
          .map(dept => ({
            department: dept,
            students: yearMap.get(year).get(dept) || [],
          }))
          .filter(d => d.students.length > 0), // Only show departments with students
      }));

      setData(hierarchyData);
    } catch (err) {
      setError(err.message || 'Failed to fetch hierarchy data');
      console.error('Error fetching hierarchy:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleYearExpand = (year) => {
    setExpandedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const toggleDeptExpand = (deptKey) => {
    setExpandedDepts(prev =>
      prev.includes(deptKey) ? prev.filter(d => d !== deptKey) : [...prev, deptKey]
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Summary Stats */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Students</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {data.reduce((sum, y) => sum + y.departments.reduce((ds, d) => ds + d.students.length, 0), 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Years</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {data.filter(y => y.departments.length > 0).length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Departments</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {new Set(data.flatMap(y => y.departments.map(d => d.department))).size}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Avg per Year</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {Math.round(
                data.reduce((sum, y) => sum + y.departments.reduce((ds, d) => ds + d.students.length, 0), 0) / Math.max(data.length, 1)
              )}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Hierarchy Tree */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        📚 Academic Structure
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {data.map(yearData => (
          <Card key={yearData.year} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {/* Year Header */}
            <CardContent sx={{ pb: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  p: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => toggleYearExpand(yearData.year)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon sx={{ color: 'primary.main' }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                    {yearData.year} Year
                  </Typography>
                  <Chip
                    label={yearData.departments.reduce((sum, d) => sum + d.students.length, 0)}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <IconButton
                  size="small"
                  sx={{
                    transform: expandedYears.includes(yearData.year) ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>

              {/* Departments */}
              <Collapse in={expandedYears.includes(yearData.year)} timeout="auto">
                <Box sx={{ pl: 2, mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {yearData.departments.map((deptData) => {
                    const deptKey = `${yearData.year}-${deptData.department}`;
                    return (
                      <Card
                        key={deptKey}
                        sx={{
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.default',
                        }}
                      >
                        <CardContent sx={{ pb: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              p: 1,
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                            onClick={() => toggleDeptExpand(deptKey)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.95rem',
                                  color: 'text.secondary',
                                }}
                              >
                                {deptData.department}
                              </Typography>
                              <Chip
                                label={deptData.students.length}
                                size="small"
                                variant="filled"
                                color="primary"
                              />
                            </Box>
                            <IconButton
                              size="small"
                              sx={{
                                transform: expandedDepts.includes(deptKey) ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s',
                              }}
                            >
                              <ExpandMoreIcon />
                            </IconButton>
                          </Box>

                          {/* Students List */}
                          <Collapse in={expandedDepts.includes(deptKey)} timeout="auto">
                            <List dense>
                              {deptData.students.map(student => (
                                <ListItem key={student._id} sx={{ pl: 4 }}>
                                  <Avatar 
                                    sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }} 
                                    src={student.avatar}
                                  >
                                    {student.firstName[0]}
                                  </Avatar>
                                  <ListItemText
                                    primary={`${student.firstName} ${student.lastName}`}
                                    secondary={student.email}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Collapse>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};
