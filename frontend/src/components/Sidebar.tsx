import useAuthStore from '@/context/auth.store';
import { Book } from '@mui/icons-material';
import BookIcon from '@mui/icons-material/Book';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import MessageIcon from '@mui/icons-material/Message';
import PeopleIcon from '@mui/icons-material/People';
import logo from '@/assets/logo.png';
import { getUnreadCount } from '@/services/message.service';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: unreadCount = 0 } = useQuery(['unreadCount'], getUnreadCount, {
    refetchInterval: 10000,
    enabled: !!user
  });

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const studentMenuItems = [
    { label: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
    { label: 'Courses', icon: Book, path: '/courses' },
    { label: 'Messages', icon: MessageIcon, path: '/messages' },
  ];

  const adminMenuItems = [
    { label: 'Dashboard', icon: DashboardIcon, path: '/' },
    { label: 'Students', icon: PeopleIcon, path: '/students' },
    { label: 'Courses', icon: BookIcon, path: '/courses' },
    { label: 'Messages', icon: MessageIcon, path: '/messages' },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : studentMenuItems;

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (isMobile) onClose();
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* MOBILE LOGO ONLY */}
      <Box
        sx={{
          p: 2,
          textAlign: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: { xs: 'block', md: 'none' },
        }}
      >
        <img
          src={logo}
          alt="Logo"
          style={{
            width: 60,
            height: 60,
            objectFit: 'contain',
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', mt: 0.5 }}>
          CDC KPRIET
        </Typography>
      </Box>

      {/* MENU ITEMS */}
      <List sx={{ flex: 1, p: 0 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const isMessage = item.label === 'Messages';

          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  bgcolor: active ? '#F0F5FA' : 'transparent',
                  color: active ? '#1B5E8E' : '#6B7280',
                  borderLeft: active ? '4px solid #1B5E8E' : '4px solid transparent',
                  fontWeight: active ? 600 : 500,
                  py: 1.5,
                  transition: '0.15s ease',
                  '&:hover': {
                    bgcolor: '#F8F9FA',
                    color: '#1B5E8E',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  {isMessage ? (
                    <Badge badgeContent={unreadCount} color="error" invisible={!unreadCount}>
                      <Icon sx={{ fontSize: '1.2rem' }} />
                    </Badge>
                  ) : (
                    <Icon sx={{ fontSize: '1.2rem' }} />
                  )}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* LOGOUT */}
      <Box sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              color: '#D32F2F',
              py: 1,
              '&:hover': {
                bgcolor: '#FFEBEE',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: '#D32F2F' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            top: 0,
            height: '100vh',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Box
      sx={{
        width: 280,
        position: 'fixed',
        left: 0,
        top: '64px',                         // ⬅ Sidebar begins below header
        height: 'calc(100vh - 64px)',         // ⬅ Sidebar fills remaining space
        display: { xs: 'none', md: 'block' },
        overflowY: 'auto',
        backgroundColor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        zIndex: 1200,                         // below header (1300), above content
      }}
    >
      {drawerContent}
    </Box>
  );

};

export default Sidebar;
