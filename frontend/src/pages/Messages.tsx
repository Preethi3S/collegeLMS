import useAuthStore from '@/context/auth.store';
import {
  getAdminId,
  getInbox,
  getSent,
  getUnreadCount,
  markAsRead,
  sendMessage,
  sendBulkMessage
} from '@/services/message.service';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';

const Messages: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Queries
  const { data: inbox = [] } = useQuery(['inbox'], getInbox, { refetchInterval: 5000 });
  const { data: sent = [] } = useQuery(['sent'], getSent);
  const { data: unreadCount = 0 } = useQuery(['unreadCount'], getUnreadCount, { refetchInterval: 5000 });
  const { data: adminId = '' } = useQuery(['adminId'], getAdminId, { enabled: user?.role === 'student' });

  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');

  // States
  const [receiverId, setReceiverId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [filterType, setFilterType] = useState('year');
  const [filterValue, setFilterValue] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkContent, setBulkContent] = useState('');

  // Send single message
  const sendMutation = useMutation((payload: any) => sendMessage(payload), {
    onSuccess: () => {
      queryClient.invalidateQueries(['sent']);
      queryClient.invalidateQueries(['inbox']);
      setReceiverId('');
      setSubject('');
      setContent('');
      setActiveTab('inbox');
    }
  });

  // Send bulk message (admin only)
  const bulkSendMutation = useMutation((payload: any) => sendBulkMessage(payload), {
    onSuccess: () => {
      queryClient.invalidateQueries(['sent']);
      setFilterType('year');
      setFilterValue('');
      setBulkSubject('');
      setBulkContent('');
      setActiveTab('inbox');
    }
  });

  // Mark as read
  const markMutation = useMutation((id: string) => markAsRead(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['inbox']);
      queryClient.invalidateQueries(['unreadCount']);
    }
  });

  // Handlers
  const handleSend = () => {
    if (!subject || !content) return alert('All fields required');

    let receiver = receiverId;

    if (user?.role === 'student') {
      if (!adminId) return alert('Unable to fetch admin ID.');
      receiver = adminId;
    } else if (!receiverId) {
      return alert('Receiver ID required');
    }

    sendMutation.mutate({ receiverId: receiver, subject, content });
  };

  const handleBulkSend = () => {
    if (!filterValue || !bulkSubject || !bulkContent)
      return alert('All fields required');

    bulkSendMutation.mutate({
      subject: bulkSubject,
      content: bulkContent,
      filterType,
      filterValue
    });
  };

  const unreadMessages = unreadCount;

  return (
    <Container maxWidth="lg" sx={{ py: 1, px: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0D47A1' }}>
          📧 Messages
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
          {unreadMessages} unread message{unreadMessages !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Tabs Navigation */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1, borderBottom: '2px solid #E8EEF5' }}>
            <Button
              onClick={() => setActiveTab('inbox')}
              sx={{
                textTransform: 'none',
                fontWeight: activeTab === 'inbox' ? 700 : 500,
                color: activeTab === 'inbox' ? '#0D47A1' : '#666',
                borderBottom: activeTab === 'inbox' ? '3px solid #0D47A1' : 'none',
                borderRadius: 0,
                pb: 1.5
              }}
            >
             Inbox ({inbox.length})
            </Button>

            <Button
              onClick={() => setActiveTab('compose')}
              sx={{
                textTransform: 'none',
                fontWeight: activeTab === 'compose' ? 700 : 500,
                color: activeTab === 'compose' ? '#0D47A1' : '#666',
                borderBottom: activeTab === 'compose' ? '3px solid #0D47A1' : 'none',
                borderRadius: 0,
                pb: 1.5
              }}
            >
             Compose
            </Button>

            <Button
              onClick={() => setActiveTab('sent')}
              sx={{
                textTransform: 'none',
                fontWeight: activeTab === 'sent' ? 700 : 500,
                color: activeTab === 'sent' ? '#0D47A1' : '#666',
                borderBottom: activeTab === 'sent' ? '3px solid #0D47A1' : 'none',
                borderRadius: 0,
                pb: 1.5
              }}
            >
               Sent ({sent.length})
            </Button>
          </Box>
        </Grid>

        {/* Inbox */}
        {activeTab === 'inbox' && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                {inbox.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" sx={{ color: '#999' }}>
                      No messages yet
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {inbox.map((m: any) => (
                      <Box
                        key={m._id}
                        onClick={() => !m.read && markMutation.mutate(m._id)}
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          bgcolor: m.read ? '#fff' : '#F0F4FF',
                          border: '1px solid #E8EEF5',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: m.read ? '#F5F7FA' : '#E8F0FF',
                            borderColor: '#0D47A1'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#0D47A1', fontWeight: 700 }}>
                            {m.sender?.firstName?.charAt(0)}
                          </Avatar>

                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {m.sender?.firstName} {m.sender?.lastName}
                            </Typography>

                            <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                              {m.subject}
                            </Typography>

                            <Typography variant="caption" sx={{ color: '#888' }}>
                              {new Date(m.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Sent */}
        {activeTab === 'sent' && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                {sent.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" sx={{ color: '#999' }}>
                      No sent messages
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {sent.map((m: any) => (
                      <Box
                        key={m._id}
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          bgcolor: '#FAFBFC',
                          border: '1px solid #E8EEF5'
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#00897B', fontWeight: 700 }}>
                            {m.receiver?.firstName?.charAt(0)}
                          </Avatar>

                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              To: {m.receiver?.firstName} {m.receiver?.lastName}
                            </Typography>

                            <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                              {m.subject}
                            </Typography>

                            <Typography variant="caption" sx={{ color: '#888' }}>
                              {new Date(m.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack spacing={2}>
                  
                  {/* Student → Admin */}
                  {user?.role === 'student' && (
                    <>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        ✉️ Send Message to Admin
                      </Typography>

                      <TextField label="Subject" fullWidth size="small"
                        value={subject} onChange={(e) => setSubject(e.target.value)} />

                      <TextField label="Message" fullWidth multiline rows={4}
                        value={content} onChange={(e) => setContent(e.target.value)} />

                      <Button
                        variant="contained"
                        sx={{
                          background: 'linear-gradient(135deg, #0D47A1 0%, #00897B 100%)',
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                        onClick={handleSend}
                        disabled={sendMutation.isLoading}
                      >
                        {sendMutation.isLoading ? <CircularProgress size={20} /> : 'Send Message'}
                      </Button>
                    </>
                  )}

                  {/* Admin → Student */}
                  {user?.role === 'admin' && (
                    <>
                      {/* Broadcast */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        📢 Send Message
                      </Typography>

                      <FormControl fullWidth size="small">
                        <InputLabel>Send To</InputLabel>
                        <Select
                          label="Send To"
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                        >
                          <MenuItem value="year">Year</MenuItem>
                          <MenuItem value="department">Department</MenuItem>
                          <MenuItem value="email">Email</MenuItem>
                          <MenuItem value="rollno">Roll Number</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        size="small"
                        label={
                          filterType === 'email'
                            ? 'Email'
                            : filterType === 'rollno'
                            ? 'Roll Number'
                            : filterType === 'year'
                            ? 'Year (1-4)'
                            : 'Department'
                        }
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        label="Subject"
                        value={bulkSubject}
                        onChange={(e) => setBulkSubject(e.target.value)}
                      />

                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Message"
                        value={bulkContent}
                        onChange={(e) => setBulkContent(e.target.value)}
                      />

                      <Button
                        variant="outlined"
                        sx={{
                          borderColor: '#00897B',
                          color: '#00897B',
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: '#00897B',
                            bgcolor: 'rgba(0,137,123,0.05)'
                          }
                        }}
                        fullWidth
                        onClick={handleBulkSend}
                        disabled={bulkSendMutation.isLoading}
                      >
                        {bulkSendMutation.isLoading ? <CircularProgress size={20} /> : 'Send Message'}
                      </Button>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Messages;
