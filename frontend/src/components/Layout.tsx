import useAuthStore from '@/context/auth.store';
import { Dashboard, LibraryBooks, Menu as MenuIcon, Message, Person, School } from '@mui/icons-material';
import { AppBar, Box, Button, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const drawerWidth = 260;

  const menuItems = isAdmin 
    ? [
        { text: 'Dashboard', icon: <Dashboard />, path: '/' },
        { text: 'Students', icon: <School />, path: '/students' },
        { text: 'Courses', icon: <LibraryBooks />, path: '/courses' },
      ]
    : [
        { text: 'Dashboard', icon: <Dashboard />, path: '/' },
        { text: 'Courses', icon: <LibraryBooks />, path: '/courses' },
        { text: 'Profile', icon: <Person />, path: '/profile' },
      ];

  const commonMenuItems = [
    { text: 'Messages', icon: <Message />, path: '/messages' },
    
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={isDesktop ? { width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` } : undefined}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            College LMS
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isDesktop ? 'permanent' : 'temporary'}
        anchor="left"
        open={isDesktop ? true : drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: drawerWidth,
            background: (theme) => theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ height: 64, display: 'flex', alignItems: 'center', px: 2 }}>
          <Typography variant="h6">College LMS</Typography>
        </Box>
        <List sx={{ width: '100%' }}>
          {[...menuItems, ...commonMenuItems].map((item) => (
            <ListItem button key={item.text} component="a" href={item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          backgroundColor: (theme) => theme.palette.background.default,
          ml: isDesktop ? `${drawerWidth}px` : 0,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;