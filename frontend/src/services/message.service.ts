import api from './api';

export const sendMessage = async (payload: { receiverId: string; subject: string; content: string }) => {
  const res = await api.post('/messages', payload);
  return res.data;
};

export const sendBulkMessage = async (payload: { subject: string; content: string; filterType: string; filterValue: string }) => {
  const res = await api.post('/messages/send-bulk', payload);
  return res.data;
};

export const getInbox = async () => {
  const res = await api.get('/messages/inbox');
  return res.data.messages;
};

export const getSent = async () => {
  const res = await api.get('/messages/sent');
  return res.data.messages;
};

export const getUnreadCount = async () => {
  const res = await api.get('/messages/unread-count');
  return res.data.unreadCount;
};

export const markAsRead = async (id: string) => {
  const res = await api.post(`/messages/${id}/read`);
  return res.data;
};
