import { deleteStudentsBulk } from '@/services/user.service';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import React, { useState } from 'react';

const AdminStudentDeleteBulk = ({ onDeleted }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => { setResult(null); setFile(null); setOpen(true); };
  const handleClose = () => setOpen(false);

  const handleDelete = async () => {
    if (!file) return alert('Select a file');
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await deleteStudentsBulk(fd);
      setResult(res);
      onDeleted && onDeleted();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outlined" color="error" onClick={handleOpen} sx={{ mr: 1 }}>🗑️ Delete Students</Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Bulk Delete Students</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Upload CSV/Excel file with email or roll number columns to delete students.</Typography>
            <input type="file" accept=".xls,.xlsx,.csv" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
          </Box>

          {result && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" color={result.deletedCount > 0 ? 'success.main' : 'error.main'}>
                ✓ Deleted: {result.deletedCount}
              </Typography>
              {result.failed?.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Failed: {result.failed.length}</Typography>
                  {result.failed.slice(0, 5).map((f, i) => (
                    <Box key={i} sx={{ mt: 0.5, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                      <Typography variant="caption">Reason: {f.reason}</Typography>
                    </Box>
                  ))}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={loading}>{loading ? 'Deleting...' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminStudentDeleteBulk;
