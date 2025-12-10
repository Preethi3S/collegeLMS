import useAuthStore from '@/context/auth.store';
import { getInbox, getSent, getUnreadCount, markAsRead, sendBulkMessage, sendMessage } from '@/services/message.service';
import { Mail as MailIcon, MailOutline } from '@mui/icons-material';
import {
    Avatar,
    Badge,
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
    List,
    ListItem,
    ListItemText,
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
  const { data: inbox = [] } = useQuery(['inbox'], getInbox, { refetchInterval: 5000 });
  const { data: sent = [] } = useQuery(['sent'], getSent);
  const { data: unreadCount = 0 } = useQuery(['unreadCount'], getUnreadCount, { refetchInterval: 5000 });
  
  const sendMutation = useMutation((payload: any) => sendMessage(payload), {
    onSuccess: () => {
      queryClient.invalidateQueries(['sent']);
      queryClient.invalidateQueries(['inbox']);
      setReceiverId('');
      setSubject('');
      setContent('');
    }
  });

  const bulkSendMutation = useMutation((payload: any) => sendBulkMessage(payload), {
    onSuccess: () => {
      queryClient.invalidateQueries(['sent']);
      setFilterType('year');
      setFilterValue('');
      setBulkSubject('');
      setBulkContent('');
    }
  });

  const markMutation = useMutation((id: string) => markAsRead(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['inbox']);
      queryClient.invalidateQueries(['unreadCount']);
    }
  });

  const [receiverId, setReceiverId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [filterType, setFilterType] = useState('year');
  const [filterValue, setFilterValue] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkContent, setBulkContent] = useState('');

  const handleSend = () => {
    if (!receiverId || !subject || !content) return alert('All fields required');
    sendMutation.mutate({ receiverId, subject, content });
  };

  const handleBulkSend = () => {
    if (!filterValue || !bulkSubject || !bulkContent) return alert('All fields required');
    bulkSendMutation.mutate({ subject: bulkSubject, content: bulkContent, filterType, filterValue });
  };

  const unreadMessages = inbox.filter((m: any) => !m.read).length;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>📧 Messages</Typography>

      <Grid container spacing={3}>
        {/* Inbox */}
        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Badge badgeContent={unreadCount} color="error">
                  <MailIcon sx={{ fontSize: 28 }} />
                </Badge>
                <Typography variant="h6" fontWeight={600}>Inbox</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {inbox.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>No messages yet</Typography>
              ) : (
                <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                  {inbox.map((m: any) => (
                    <ListItem
                      key={m._id}
                      button
                      onClick={() => !m.read && markMutation.mutate(m._id)}
                      sx={{
                        bgcolor: m.read ? 'transparent' : 'primary.light',
                        borderRadius: 1,
                        mb: 1,
                        p: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: m.read ? 'action.hover' : 'primary.light' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                          {m.sender?.firstName?.charAt(0) || 'S'}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2" fontWeight={600}>{m.subject}</Typography>
                                {!m.read && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />}
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" color="text.secondary">From: {m.sender?.firstName} {m.sender?.lastName}</Typography>
                                <Typography variant="caption" color="text.secondary">{new Date(m.createdAt).toLocaleString()}</Typography>
                              </>
                            }
                          />
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Compose */}
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            {/* Direct Message */}
            <Card elevation={1} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>✉️ Send Message</Typography>
                <Divider sx={{ mb: 2 }} />
                <TextField
                  fullWidth
                  label="Receiver ID"
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                  placeholder="Paste student ID here"
                />
                <TextField
                  fullWidth
                  label="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Message"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSend}
                  disabled={sendMutation.isLoading}
                >
                  {sendMutation.isLoading ? <CircularProgress size={20} /> : 'Send'}
                </Button>
              </CardContent>
            </Card>

            {/* Bulk Message (Admin Only) */}
            {user?.role === 'admin' && (
              <Card elevation={1} sx={{ borderRadius: 3, bgcolor: 'success.light' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>📢 Broadcast Message</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Send To</InputLabel>
                    <Select
                      value={filterType}
                      label="Send To"
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
                    label={filterType === 'email' ? 'Email' : filterType === 'rollno' ? 'Roll Number' : filterType === 'year' ? 'Year (1-4)' : 'Department'}
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Subject"
                    value={bulkSubject}
                    onChange={(e) => setBulkSubject(e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Message"
                    value={bulkContent}
                    onChange={(e) => setBulkContent(e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    onClick={handleBulkSend}
                    disabled={bulkSendMutation.isLoading}
                  >
                    {bulkSendMutation.isLoading ? <CircularProgress size={20} /> : 'Broadcast'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>

        {/* Sent */}
        <Grid item xs={12}>
          <Card elevation={1} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MailOutline />
                <Typography variant="h6" fontWeight={600}>Sent</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {sent.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>No sent messages</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <List>
                    {sent.map((m: any) => (
                      <ListItem key={m._id} sx={{ borderRadius: 1, mb: 1, bgcolor: 'action.hover' }}>
                        <ListItemText
                          primary={m.subject}
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">To: {m.receiver?.firstName} {m.receiver?.lastName}</Typography>
                              <Typography variant="caption" color="text.secondary">{new Date(m.createdAt).toLocaleString()}</Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Messages;
