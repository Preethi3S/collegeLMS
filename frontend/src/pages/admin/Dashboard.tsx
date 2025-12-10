import AdminDashboardHierarchy from '@/components/AdminDashboardHierarchy';
import { Box, Container, Tab, Tabs, Typography } from '@mui/material';
import React from 'react';
import AdminNestedDashboard from './NestedDashboard';

const AdminDashboard: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);

  return (
    <Container sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
          📊 Admin Dashboard
        </Typography>
        <Tabs
          value={tabValue}
          onChange={(_, val) => setTabValue(val)}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            },
          }}
        >
          <Tab label="Overview" />
          <Tab label="Year & Department View" />
        </Tabs>
      </Box>

      {tabValue === 0 && <AdminNestedDashboard />}
      {tabValue === 1 && <AdminDashboardHierarchy />}
    </Container>
  );
};

export default AdminDashboard;
