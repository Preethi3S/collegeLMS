import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import AdminNestedDashboard from './NestedDashboard';

const AdminDashboard: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <AdminNestedDashboard />
    </Container>
  );
};

export default AdminDashboard;
