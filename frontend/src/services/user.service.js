import api from './api';

export const getMyProfile = async () => {
  const res = await api.get('/users/me');
  return res.data.user;
};

export const updateProfile = async (formData) => {
  const res = await api.put('/users/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data.user;
};

export const listStudents = async () => {
  const res = await api.get('/users/students');
  return res.data.students;
};

export const uploadStudents = async (formData) => {
  const res = await api.post('/users/students/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
};

export const deleteStudent = async (id) => {
  const res = await api.delete(`/users/students/${id}`);
  return res.data;
};

export const getStudent = async (id) => {
  const res = await api.get(`/users/students/${id}`);
  return res.data.student;
};

export const updateStudent = async (id, formData) => {
  const res = await api.put(`/users/students/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data.student;
};

export const createStudent = async (payload) => {
  const res = await api.post('/users/students/create', payload);
  return res.data.user;
};

export const getDashboard = async () => {
  const res = await api.get('/users/dashboard');
  return res.data;
};

export const deleteStudentsBulk = async (formData) => {
  const res = await api.post('/users/students/delete-bulk', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
};
