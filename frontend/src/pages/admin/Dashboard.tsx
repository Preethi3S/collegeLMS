import { Box, Container, Typography } from '@mui/material';
import React from 'react';
import AdminNestedDashboard from './NestedDashboard';

const AdminDashboard: React.FC = () => {
  return (
    <Container sx={{ py: 1, px: 1 }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: '#0D47A1' }}>
          📊 Admin Dashboard
        </Typography>
        <AdminNestedDashboard />
      </Box>
    </Container>
  );
};

export default AdminDashboard;
