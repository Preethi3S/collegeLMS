import useAuthStore from '@/context/auth.store';
import { Dashboard, LibraryBooks, Menu as MenuIcon, Message, Person, School } from '@mui/icons-material';
import { AppBar, Box, Button, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const menuItems = isAdmin 
    ? [
        { text: 'Dashboard', icon: <Dashboard />, path: '/' },
        { text: 'Create Student', icon: <School />, path: '/students/create' },
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
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            College LMS
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <List sx={{ width: 250 }}>
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
          backgroundColor: (theme) => theme.palette.grey[100],
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;