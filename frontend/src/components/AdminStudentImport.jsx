import api from '@/services/api';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import React, { useState } from 'react';

const AdminStudentImport = ({ onImported }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => { setResult(null); setFile(null); setOpen(true); };
  const handleClose = () => setOpen(false);

  const handleUpload = async () => {
    if (!file) return alert('Select a file');
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/users/students/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
      onImported && onImported();
    } catch (err) {
      alert(err.response?.data?.message || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen} sx={{ mr: 1 }}>Import Students</Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Bulk Import Students</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <input type="file" accept=".xls,.xlsx,.csv" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
          </Box>

          {result && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Imported: {result.createdCount}</Typography>
              <Typography variant="subtitle2">Skipped: {result.skipped?.length || 0}</Typography>
              {result.skipped && result.skipped.slice(0,10).map((s, i) => (
                <Box key={i} sx={{ mt: 1, p: 1, border: '1px solid #eee' }}>
                  <Typography variant="caption">Reason: {s.reason}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button variant="contained" onClick={handleUpload} disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminStudentImport;
