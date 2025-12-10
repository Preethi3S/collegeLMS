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
  modules: Array<{ title: string; videoUrl: string }>;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  department: string;
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
      setFormData(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch course');
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
      levels[levelIndex].modules.push({ title: 'New Module', videoUrl: '' });
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

  const handleSubmit = async () => {
    if (!formData) return;
    try {
      setLoading(true);
      setError('');
      await updateCourse(formData._id, formData);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update course');
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
                                <Box key={moduleIndex} sx={{ display: 'flex', gap: 1 }}>
                                  <TextField
                                    size="small"
                                    label="Module Title"
                                    value={module.title}
                                    onChange={(e) => handleModuleChange(levelIndex, moduleIndex, 'title', e.target.value)}
                                    fullWidth
                                  />
                                  <TextField
                                    size="small"
                                    label="Video URL"
                                    value={module.videoUrl}
                                    onChange={(e) => handleModuleChange(levelIndex, moduleIndex, 'videoUrl', e.target.value)}
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
