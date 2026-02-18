import api from '@/services/api';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

const StudentEditModal = ({
    open,
    student,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        rollNumber: '',
        department: '',
        year: '',
        cgpa: '',
        dateOfBirth: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (student) {
            setFormData({
                firstName: student.firstName || '',
                lastName: student.lastName || '',
                email: student.email || '',
                phone: student.phone || '',
                rollNumber: student.rollNumber || '',
                department: student.department || '',
                year: student.year || '',
                cgpa: student.cgpa || '',
                dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
            });
        }
    }, [student]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await api.put(`/users/students/${student._id}`, formData);
            onSuccess();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating student');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Edit Student</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="First Name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Phone Number"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Roll Number"
                            name="rollNumber"
                            value={formData.rollNumber}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <InputLabel>Department</InputLabel>
                            <Select
                                label="Department"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                            >
                                <MenuItem value="Computer Science">Computer Science</MenuItem>
                                <MenuItem value="Information Technology">Information Technology</MenuItem>
                                <MenuItem value="Electronics">Electronics</MenuItem>
                                <MenuItem value="Mechanical">Mechanical</MenuItem>
                                <MenuItem value="Civil">Civil</MenuItem>
                                <MenuItem value="Electrical">Electrical</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <InputLabel>Year</InputLabel>
                            <Select
                                label="Year"
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                            >
                                <MenuItem value={1}>1st Year</MenuItem>
                                <MenuItem value={2}>2nd Year</MenuItem>
                                <MenuItem value={3}>3rd Year</MenuItem>
                                <MenuItem value={4}>4th Year</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="CGPA"
                            name="cgpa"
                            type="number"
                            value={formData.cgpa}
                            onChange={handleChange}
                            inputProps={{ step: "0.01", min: "0", max: "10" }}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Date of Birth"
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StudentEditModal;
