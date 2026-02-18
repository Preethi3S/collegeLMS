import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormGroup,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { getCourse, updateCourse } from '../services/course.service';

const AdminCourseEditModal = ({ open, courseId, onClose, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(null);

  const years = ['1st', '2nd', '3rd', '4th'];
  const departments = ['CSE', 'ECE', 'ME', 'CE', 'EE'];

  useEffect(() => {
    if (open && courseId) {
      fetchCourse();
    }
  }, [open, courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const data = await getCourse(courseId);
      // Extract course from response
      const courseData = data.course || data;
      setFormData(courseData);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch course');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleYearToggle = (year) => {
    setFormData(prev => {
      if (!prev) return null;
      const allowedYears = prev.allowedYears.includes(year)
        ? prev.allowedYears.filter(y => y !== year)
        : [...prev.allowedYears, year];
      return { ...prev, allowedYears };
    });
  };

  const handleAddLevel = () => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        levels: [...prev.levels, { title: 'New Level', modules: [] }],
      };
    });
  };

  const handleRemoveLevel = (index) => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        levels: prev.levels.filter((_, i) => i !== index),
      };
    });
  };

  const handleLevelChange = (index, field, value) => {
    setFormData(prev => {
      if (!prev) return null;
      const levels = [...prev.levels];
      levels[index] = { ...levels[index], [field]: value };
      return { ...prev, levels };
    });
  };

  const handleAddModule = (levelIndex) => {
    setFormData(prev => {
      if (!prev) return null;
      const levels = [...prev.levels];
      levels[levelIndex].modules.push({ 
        title: 'New Module', 
        content: '',
        codingQuestions: [],
        description: '',
        type: 'video',
        videoLength: 0,
        order: levels[levelIndex].modules.length + 1,
        resources: []
      });
      return { ...prev, levels };
    });
  };

  const handleRemoveModule = (levelIndex, moduleIndex) => {
    setFormData(prev => {
      if (!prev) return null;
      const levels = [...prev.levels];
      levels[levelIndex].modules = levels[levelIndex].modules.filter((_, i) => i !== moduleIndex);
      return { ...prev, levels };
    });
  };

  const handleModuleChange = (
    levelIndex,
    moduleIndex,
    field,
    value
  ) => {
    setFormData(prev => {
      if (!prev) return null;
      const levels = [...prev.levels];
      levels[levelIndex].modules[moduleIndex] = {
        ...levels[levelIndex].modules[moduleIndex],
        [field]: value,
      };
      return { ...prev, levels };
    });
  };

  const handleAddCodingQuestion = (levelIndex, moduleIndex) => {
    setFormData(prev => {
      if (!prev) return null;
      const levels = [...prev.levels];
      if (!levels[levelIndex].modules[moduleIndex].codingQuestions) {
        levels[levelIndex].modules[moduleIndex].codingQuestions = [];
      }
      levels[levelIndex].modules[moduleIndex].codingQuestions.push({
        title: 'Coding Question',
        url: ''
      });
      return { ...prev, levels };
    });
  };

  const handleRemoveCodingQuestion = (levelIndex, moduleIndex, qIndex) => {
    setFormData(prev => {
      if (!prev) return null;
      const levels = [...prev.levels];
      if (levels[levelIndex].modules[moduleIndex].codingQuestions) {
        levels[levelIndex].modules[moduleIndex].codingQuestions = 
          levels[levelIndex].modules[moduleIndex].codingQuestions.filter((_, i) => i !== qIndex);
      }
      return { ...prev, levels };
    });
  };

  const handleCodingQuestionChange = (
    levelIndex,
    moduleIndex,
    qIndex,
    field,
    value
  ) => {
    setFormData(prev => {
      if (!prev) return null;
      const levels = [...prev.levels];
      if (levels[levelIndex].modules[moduleIndex].codingQuestions) {
        levels[levelIndex].modules[moduleIndex].codingQuestions[qIndex] = {
          ...levels[levelIndex].modules[moduleIndex].codingQuestions[qIndex],
          [field]: value
        };
      }
      return { ...prev, levels };
    });
  };

  const handleSubmit = async () => {
    if (!formData) return;
    try {
      setLoading(true);
      setError('');
      
      // Use the data directly - modules already have 'content' field from backend
      const courseDataForBackend = {
        ...formData,
        levels: formData.levels.map(level => ({
          ...level,
          modules: level.modules.map(module => ({
            title: module.title,
            description: module.description || '',
            type: module.type || 'video',
            content: module.content || '', // Main content (YouTube URL)
            codingQuestions: module.codingQuestions || [], // Array of coding questions
            videoLength: module.videoLength || 0,
            order: module.order || 1,
            resources: module.resources || [],
          })),
        })),
      };
      
      await updateCourse(formData._id, courseDataForBackend);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update course');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.3rem' }}>Edit Course</DialogTitle>
      <DialogContent sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
        {loading && !formData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {formData && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Course Title"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleInputChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Instructor"
                    name="instructor"
                    value={formData.instructor || ''}
                    onChange={handleInputChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Department</InputLabel>
                    <Select
                      name="department"
                      value={formData.department || ''}
                      label="Department"
                      onChange={handleInputChange}
                    >
                      {departments.map(dept => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Allowed Years</Typography>
                  <FormGroup row>
                    {years.map(year => (
                      <FormControlLabel
                        key={year}
                        control={
                          <Checkbox
                            checked={formData.allowedYears.includes(year)}
                            onChange={() => handleYearToggle(year)}
                          />
                        }
                        label={year}
                      />
                    ))}
                  </FormGroup>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
                    <Typography variant="h6">Course Content</Typography>
                    <Button 
                      startIcon={<AddIcon />} 
                      variant="outlined" 
                      onClick={handleAddLevel}
                      size="small"
                    >
                      Add Level
                    </Button>
                  </Box>
                  
                  {formData.levels.map((level, lIndex) => (
                    <Card key={lIndex} variant="outlined" sx={{ mb: 2, bgcolor: '#f8f9fa' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <TextField
                            fullWidth
                            label={`Level ${lIndex + 1} Title`}
                            value={level.title}
                            onChange={(e) => handleLevelChange(lIndex, 'title', e.target.value)}
                            size="small"
                            sx={{ bgcolor: 'white' }}
                          />
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoveLevel(lIndex)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>

                        <Box sx={{ pl: 2, borderLeft: '2px solid #e0e0e0' }}>
                          {level.modules.map((module, mIndex) => (
                            <Box key={mIndex} sx={{ mb: 2, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #eee' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle2" color="primary">Module {mIndex + 1}</Typography>
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleRemoveModule(lIndex, mIndex)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    fullWidth
                                    label="Module Title"
                                    value={module.title}
                                    onChange={(e) => handleModuleChange(lIndex, mIndex, 'title', e.target.value)}
                                    size="small"
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                      value={module.type || 'video'}
                                      label="Type"
                                      onChange={(e) => handleModuleChange(lIndex, mIndex, 'type', e.target.value)}
                                    >
                                      <MenuItem value="video">Video</MenuItem>
                                      <MenuItem value="coding">Coding</MenuItem>
                                      <MenuItem value="quiz">Quiz</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    label="Description"
                                    value={module.description}
                                    onChange={(e) => handleModuleChange(lIndex, mIndex, 'description', e.target.value)}
                                    size="small"
                                    multiline
                                    rows={2}
                                  />
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    label={module.type === 'coding' ? "Problem Statement (Markdown)" : "Content URL (YouTube)"}
                                    value={module.content}
                                    onChange={(e) => handleModuleChange(lIndex, mIndex, 'content', e.target.value)}
                                    size="small"
                                  />
                                </Grid>

                                {/* Coding Questions Section */}
                                {module.type === 'coding' && (
                                  <Grid item xs={12}>
                                    <Box sx={{ mt: 1, mb: 1 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Coding Questions</Typography>
                                        <Button 
                                          size="small" 
                                          startIcon={<AddIcon fontSize="small" />}
                                          onClick={() => handleAddCodingQuestion(lIndex, mIndex)}
                                        >
                                          Add Question
                                        </Button>
                                      </Box>
                                      
                                      {module.codingQuestions && module.codingQuestions.map((q, qIndex) => (
                                        <Box key={qIndex} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                          <TextField
                                            fullWidth
                                            label="Question Title"
                                            value={q.title}
                                            onChange={(e) => handleCodingQuestionChange(lIndex, mIndex, qIndex, 'title', e.target.value)}
                                            size="small"
                                          />
                                          <TextField
                                            fullWidth
                                            label="LeetCode/Hackerrank URL"
                                            value={q.url}
                                            onChange={(e) => handleCodingQuestionChange(lIndex, mIndex, qIndex, 'url', e.target.value)}
                                            size="small"
                                          />
                                          <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={() => handleRemoveCodingQuestion(lIndex, mIndex, qIndex)}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Box>
                                      ))}
                                    </Box>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          ))}
                          
                          <Button 
                            startIcon={<AddIcon />} 
                            size="small" 
                            onClick={() => handleAddModule(lIndex)}
                            sx={{ mt: 1 }}
                          >
                            Add Module
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Grid>
              </Grid>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          sx={{ px: 4 }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminCourseEditModal
