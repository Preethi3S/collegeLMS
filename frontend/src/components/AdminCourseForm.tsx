import api from '@/services/api';
import { AddCircle, Delete } from '@mui/icons-material';
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface AdminCourseFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  courseToEdit?: any;
}

const yearsList = [1, 2, 3, 4];

const AdminCourseForm: React.FC<AdminCourseFormProps> = ({
  open,
  onClose,
  onSaved,
  courseToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [allowedYears, setAllowedYears] = useState<number[]>([]);
  const [allowedStudents, setAllowedStudents] = useState<string[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [applyToAll, setApplyToAll] = useState(true);

  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔹 Load students list on open
  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open]);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await api.get('/users/students');
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // 🔹 Initialize values when editing
  useEffect(() => {
    if (courseToEdit) {
      setTitle(courseToEdit.title || '');
      setDescription(courseToEdit.description || '');
      setThumbnail(courseToEdit.thumbnail || '');
      setAllowedYears(courseToEdit.allowedYears || []);
      setAllowedStudents(courseToEdit.allowedStudents || []);
      setLevels(courseToEdit.levels || []);
      setApplyToAll(courseToEdit.allowedStudents?.length === 0);
    } else {
      setTitle('');
      setDescription('');
      setThumbnail('');
      setAllowedYears([]);
      setAllowedStudents([]);
      setLevels([]);
      setApplyToAll(true);
    }
  }, [courseToEdit]);

  const addLevel = () => {
    setLevels([...levels, { title: '', description: '', modules: [] }]);
  };

  const addModule = (levelIndex: number) => {
    const updated = [...levels];
    updated[levelIndex].modules.push({
      title: '',
      description: '',
      content: '',
      videoLength: 0,
      codingQuestions: [],
    });
    setLevels(updated);
  };

  const addCodingQuestion = (levelIndex: number, moduleIndex: number) => {
    const updated = [...levels];
    if (!updated[levelIndex].modules[moduleIndex].codingQuestions) {
      updated[levelIndex].modules[moduleIndex].codingQuestions = [];
    }
    updated[levelIndex].modules[moduleIndex].codingQuestions.push({
      title: '',
      url: '',
    });
    setLevels(updated);
  };

  const removeCodingQuestion = (levelIndex: number, moduleIndex: number, qIndex: number) => {
    const updated = [...levels];
    if (updated[levelIndex].modules[moduleIndex].codingQuestions) {
      updated[levelIndex].modules[moduleIndex].codingQuestions.splice(qIndex, 1);
    }
    setLevels(updated);
  };

  const updateCodingQuestion = (levelIndex: number, moduleIndex: number, qIndex: number, field: string, value: string) => {
    const updated = [...levels];
    if (updated[levelIndex].modules[moduleIndex].codingQuestions) {
      updated[levelIndex].modules[moduleIndex].codingQuestions[qIndex][field] = value;
    }
    setLevels(updated);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim())
      return alert('Title and description are required.');
    if (!allowedYears.length)
      return alert('Please select at least one year.');

    // Validate that all modules have required fields
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      for (let j = 0; j < level.modules.length; j++) {
        const module = level.modules[j];
        if (!module.title.trim()) {
          return alert(`Level ${i + 1}, Module ${j + 1}: Title is required.`);
        }
        if (!module.content.trim()) {
          return alert(`Level ${i + 1}, Module ${j + 1}: YouTube Video URL is required.`);
        }
      }
    }

    setSaving(true);
    try {
      const payload = {
        title,
        description,
        thumbnail,
        allowedYears,
        allowedStudents: applyToAll ? [] : allowedStudents,
        levels,
        requiresSequentialProgress: true,
      };

      if (courseToEdit?._id) {
        await api.put(`/courses/${courseToEdit._id}`, payload);
      } else {
        await api.post('/courses', payload);
      }

      alert('✅ Course saved successfully!');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving course');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{courseToEdit ? 'Edit Course' : 'Create Course'}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Course Title"
          sx={{ my: 1 }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          fullWidth
          multiline
          label="Description"
          sx={{ my: 1 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TextField
          fullWidth
          label="Thumbnail URL"
          sx={{ my: 1 }}
          value={thumbnail}
          onChange={(e) => setThumbnail(e.target.value)}
        />

        {/* Allowed Years */}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Select Allowed Years</InputLabel>
          <Select
            multiple
            value={allowedYears}
            onChange={(e) => setAllowedYears(e.target.value as number[])}
            renderValue={(selected) => (selected as number[]).join(', ')}
          >
            {yearsList.map((year) => (
              <MenuItem key={year} value={year}>
                <Checkbox checked={allowedYears.includes(year)} />
                <ListItemText primary={`Year ${year}`} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Apply to all toggle */}
        <FormControlLabel
          control={
            <Checkbox
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
            />
          }
          label="Allow all students of selected years"
          sx={{ mt: 1 }}
        />

        {/* Student selection (only if applyToAll = false) */}
        {!applyToAll && (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Specific Students</InputLabel>
            {loadingStudents ? (
              <Box display="flex" alignItems="center" justifyContent="center" p={2}>
                <CircularProgress size={20} />
              </Box>
            ) : (
              <Select
                multiple
                value={allowedStudents}
                onChange={(e) => setAllowedStudents(e.target.value as string[])}
                renderValue={(selected) =>
                  students
                    .filter((s) => selected.includes(s._id))
                    .map((s) => s.rollNumber || s.username)
                    .join(', ')
                }
              >
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    <Checkbox checked={allowedStudents.includes(student._id)} />
                    <ListItemText
                      primary={`${student.firstName} ${student.lastName}`}
                      secondary={student.rollNumber || student.email}
                    />
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 1 }}>
          Levels
        </Typography>

        {levels.map((level, li) => (
          <Paper key={li} sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Level Title"
              sx={{ mb: 1 }}
              value={level.title}
              onChange={(e) => {
                const updated = [...levels];
                updated[li].title = e.target.value;
                setLevels(updated);
              }}
            />
            <TextField
              fullWidth
              multiline
              label="Level Description"
              sx={{ mb: 1 }}
              value={level.description}
              onChange={(e) => {
                const updated = [...levels];
                updated[li].description = e.target.value;
                setLevels(updated);
              }}
            />

            <Typography variant="subtitle1">Modules</Typography>
            {level.modules.map((mod: any, mi: number) => (
              <Box key={mi} sx={{ mb: 1, border: '1px solid #ddd', borderRadius: 2, p: 2 }}>
                <TextField
                  fullWidth
                  label="Module Title"
                  sx={{ mb: 1 }}
                  value={mod.title}
                  onChange={(e) => {
                    const updated = [...levels];
                    updated[li].modules[mi].title = e.target.value;
                    setLevels(updated);
                  }}
                />
                <TextField
                  fullWidth
                  label="YouTube Video URL"
                  sx={{ mb: 1 }}
                  value={mod.content}
                  onChange={(e) => {
                    const updated = [...levels];
                    updated[li].modules[mi].content = e.target.value;
                    setLevels(updated);
                  }}
                />
                <TextField
                  fullWidth
                  label="Video Duration (in seconds)"
                  type="number"
                  value={mod.videoLength}
                  onChange={(e) => {
                    const updated = [...levels];
                    updated[li].modules[mi].videoLength = Number(e.target.value);
                    setLevels(updated);
                  }}
                />

                {/* Coding Questions */}
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Coding Questions</Typography>
                {mod.codingQuestions?.map((cq: any, qi: number) => (
                  <Box key={qi} sx={{ mb: 1, pl: 2, borderLeft: '2px solid #ddd' }}>
                    <TextField
                      fullWidth
                      label="Question Title"
                      sx={{ mb: 1 }}
                      value={cq.title}
                      onChange={(e) => updateCodingQuestion(li, mi, qi, 'title', e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Question URL"
                      sx={{ mb: 1 }}
                      value={cq.url}
                      onChange={(e) => updateCodingQuestion(li, mi, qi, 'url', e.target.value)}
                    />
                    <IconButton
                      color="error"
                      onClick={() => removeCodingQuestion(li, mi, qi)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddCircle />}
                  onClick={() => addCodingQuestion(li, mi)}
                  sx={{ mt: 1 }}
                  size="small"
                >
                  Add Coding Question
                </Button>

                <IconButton
                  color="error"
                  onClick={() => {
                    const updated = [...levels];
                    updated[li].modules.splice(mi, 1);
                    setLevels(updated);
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<AddCircle />}
              onClick={() => addModule(li)}
              sx={{ mt: 1 }}
            >
              Add Module
            </Button>
          </Paper>
        ))}
        <Button
          variant="outlined"
          startIcon={<AddCircle />}
          onClick={addLevel}
          sx={{ mt: 2 }}
        >
          Add Level
        </Button>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminCourseForm;
