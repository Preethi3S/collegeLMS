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

interface Level {
  title: string;
  modules: Array<{ 
    title: string;
    description?: string;
    content: string; // YouTube URL
    codingQuestions?: Array<{ title: string; url: string }>; // Multiple coding questions
    videoLength?: number;
    type?: string;
    order?: number;
    resources?: any[];
  }>;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor?: string;
  department?: string;
  allowedYears: string[];
  levels: Level[];
  thumbnail?: string;
  allowedStudents?: string[];
}

interface Props {
  open: boolean;
  courseId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const AdminCourseEditModal: React.FC<Props> = ({ open, courseId, onClose, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Course | null>(null);

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
      const data = await getCourse(courseId!);
      // Extract course from response
      const courseData = data.course || data;
      setFormData(courseData);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch course');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleYearToggle = (year: string) => {
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

  const handleRemoveLevel = (index: number) => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        levels: prev.levels.filter((_, i) => i !== index),
      };
    });
  };

  const handleLevelChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      if (!prev) return null;
      const levels = [...prev.levels];
      levels[index] = { ...levels[index], [field]: value };
      return { ...prev, levels };
    });
  };

  const handleAddModule = (levelIndex: number) => {
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

  const handleRemoveModule = (levelIndex: number, moduleIndex: number) => {
    setFormData(prev => {
      if (!prev) return null;
      const levels = [...prev.levels];
      levels[levelIndex].modules = levels[levelIndex].modules.filter((_, i) => i !== moduleIndex);
      return { ...prev, levels };
    });
  };

  const handleModuleChange = (
    levelIndex: number,
    moduleIndex: number,
    field: string,
    value: string
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

  const handleAddCodingQuestion = (levelIndex: number, moduleIndex: number) => {
    setFormData(prev => {
      if (!prev) return null;
      const levels = [...prev.levels];
      if (!levels[levelIndex].modules[moduleIndex].codingQuestions) {
        levels[levelIndex].modules[moduleIndex].codingQuestions = [];
      }
      levels[levelIndex].modules[moduleIndex].codingQuestions?.push({
        title: 'Coding Question',
        url: ''
      });
      return { ...prev, levels };
    });
  };

  const handleRemoveCodingQuestion = (levelIndex: number, moduleIndex: number, qIndex: number) => {
    setFormData(prev => {
      if (!prev) return null;
      const levels = [...prev.levels];
      if (levels[levelIndex].modules[moduleIndex].codingQuestions) {
        levels[levelIndex].modules[moduleIndex].codingQuestions = 
          levels[levelIndex].modules[moduleIndex].codingQuestions!.filter((_, i) => i !== qIndex);
      }
      return { ...prev, levels };
    });
  };

  const handleCodingQuestionChange = (
    levelIndex: number,
    moduleIndex: number,
    qIndex: number,
    field: string,
    value: string
  ) => {
    setFormData(prev => {
      if (!prev) return null;
      const levels = [...prev.levels];
      if (levels[levelIndex].modules[moduleIndex].codingQuestions) {
        levels[levelIndex].modules[moduleIndex].codingQuestions![qIndex] = {
          ...levels[levelIndex].modules[moduleIndex].codingQuestions![qIndex],
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
    } catch (err: any) {
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
                      onChange={(e) => setFormData(prev => prev ? { ...prev, department: e.target.value } : null)}
                    >
                      {departments.map(dept => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Thumbnail URL"
                    name="thumbnail"
                    value={formData.thumbnail || ''}
                    onChange={handleInputChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                  />
                </Grid>

                {/* Allowed Years */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Allowed Years</Typography>
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

                {/* Levels */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>Levels</Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={handleAddLevel} variant="outlined">
                      Add Level
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {formData.levels.map((level, levelIndex) => (
                      <Card key={levelIndex} sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                              fullWidth
                              label="Level Title"
                              size="small"
                              value={level.title}
                              onChange={(e) => handleLevelChange(levelIndex, 'title', e.target.value)}
                            />
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemoveLevel(levelIndex)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>

                          {/* Modules */}
                          <Box sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" fontWeight={600}>Modules</Typography>
                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => handleAddModule(levelIndex)}
                              >
                                Add Module
                              </Button>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                              {level.modules.map((module, moduleIndex) => (
                                <Box key={moduleIndex} sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#FAFBFC' }}>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                      size="small"
                                      label="Module Title"
                                      value={module.title}
                                      onChange={(e) => handleModuleChange(levelIndex, moduleIndex, 'title', e.target.value)}
                                      fullWidth
                                    />
                                    <IconButton
                                      color="error"
                                      size="small"
                                      onClick={() => handleRemoveModule(levelIndex, moduleIndex)}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Box>
                                  <TextField
                                    size="small"
                                    label="Video URL (YouTube)"
                                    value={module.content}
                                    onChange={(e) => handleModuleChange(levelIndex, moduleIndex, 'content', e.target.value)}
                                    fullWidth
                                    placeholder="https://youtube.com/embed/..."
                                  />
                                  <TextField
                                    size="small"
                                    label="Description"
                                    value={module.description || ''}
                                    onChange={(e) => handleModuleChange(levelIndex, moduleIndex, 'description', e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={2}
                                  />
                                  
                                  {/* Coding Questions Section */}
                                  <Box sx={{ p: 1, bgcolor: '#E3F2FD', borderRadius: 1, border: '1px solid #90CAF9' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                      <Typography variant="body2" fontWeight={600} sx={{ color: '#0D47A1' }}>
                                        💻 Coding Questions
                                      </Typography>
                                      <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleAddCodingQuestion(levelIndex, moduleIndex)}
                                      >
                                        Add
                                      </Button>
                                    </Box>
                                    
                                    {module.codingQuestions && module.codingQuestions.length > 0 ? (
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {module.codingQuestions.map((cq, qIndex) => (
                                          <Box key={qIndex} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                            <TextField
                                              size="small"
                                              label="Title"
                                              value={cq.title}
                                              onChange={(e) => handleCodingQuestionChange(levelIndex, moduleIndex, qIndex, 'title', e.target.value)}
                                              placeholder="e.g., Two Sum"
                                              sx={{ flex: 0.3 }}
                                            />
                                            <TextField
                                              size="small"
                                              label="URL"
                                              value={cq.url}
                                              onChange={(e) => handleCodingQuestionChange(levelIndex, moduleIndex, qIndex, 'url', e.target.value)}
                                              placeholder="https://leetcode.com/problems/..."
                                              fullWidth
                                            />
                                            <IconButton
                                              color="error"
                                              size="small"
                                              onClick={() => handleRemoveCodingQuestion(levelIndex, moduleIndex, qIndex)}
                                            >
                                              <DeleteIcon />
                                            </IconButton>
                                          </Box>
                                        ))}
                                      </Box>
                                    ) : (
                                      <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                                        No coding questions yet
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData}
        >
          {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminCourseEditModal;
