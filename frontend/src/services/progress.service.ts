import api from './api';

export const markVideoProgress = async (
  courseId: string,
  moduleId: string,
  data: { watchTime: number; percentWatched: number; totalLength: number; resumeAt: number }
) => {
  if (!courseId || !moduleId) throw new Error('Missing courseId or moduleId');
  const res = await api.post(`/progress/${courseId}/${moduleId}/watch`, data);
  return res.data;
};

export const getVideoProgress = async (courseId: string, moduleId: string) => {
  if (!courseId || !moduleId) throw new Error('Missing courseId or moduleId');
  const res = await api.get(`/progress/${courseId}/${moduleId}`);
  return res.data;
};

export const getProgress = async (courseId: string) => {
  if (!courseId) throw new Error('Missing courseId');
  const res = await api.get(`/progress/${courseId}`);
  return res.data;
};
