import { getInbox, getSent, markAsRead, sendMessage } from '@/services/message.service';
import { Button, Container, Grid, List, ListItem, ListItemText, Paper, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

const Messages: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: inbox } = useQuery(['inbox'], getInbox);
  const { data: sent } = useQuery(['sent'], getSent);
  const sendMutation = useMutation((payload: any) => sendMessage(payload), {
    onSuccess: () => queryClient.invalidateQueries(['sent'])
  });
  const markMutation = useMutation((id: string) => markAsRead(id), {
    onSuccess: () => queryClient.invalidateQueries(['inbox'])
  });

  const [receiverId, setReceiverId] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [content, setContent] = React.useState('');

  const handleSend = () => {
    if (!receiverId || !subject || !content) return alert('All fields required');
    sendMutation.mutate({ receiverId, subject, content });
    setReceiverId(''); setSubject(''); setContent('');
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Messages</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Inbox</Typography>
            <List>
              {inbox?.map((m: any) => (
                <ListItem key={m._id} button onClick={() => markMutation.mutate(m._id)}>
                  <ListItemText primary={m.subject} secondary={`${m.sender.firstName} ${m.sender.lastName} — ${new Date(m.createdAt).toLocaleString()}`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Compose</Typography>
            <TextField fullWidth label="Receiver ID" value={receiverId} onChange={(e) => setReceiverId(e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth multiline rows={4} label="Message" value={content} onChange={(e) => setContent(e.target.value)} sx={{ mb: 2 }} />
            <Button variant="contained" onClick={handleSend}>Send</Button>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Sent</Typography>
            <List>
              {sent?.map((m: any) => (
                <ListItem key={m._id}>
                  <ListItemText primary={m.subject} secondary={`${m.receiver.firstName} ${m.receiver.lastName} — ${new Date(m.createdAt).toLocaleString()}`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Messages;
