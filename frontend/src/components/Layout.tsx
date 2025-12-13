import { Box, useTheme } from '@mui/material';
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>

      {/* SIDEBAR */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MAIN WRAPPER */}
      <Box
        sx={{
          flex: 1,
          ml: { xs: 0, md: '280px' }, // space for desktop sidebar
          width: '100%',
        }}
      >
        {/* FIXED HEADER */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* MAIN CONTENT BELOW HEADER */}
        <Box
          component="main"
          sx={{
            mt: '64px',   // ⬅⬅⬅ THE FIX — pushes content below header
            p: { xs: 2, sm: 3 },
            backgroundColor: theme.palette.background.default,
            minHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
