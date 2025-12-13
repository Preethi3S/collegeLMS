import logoImg from '@/assets/logo.png';
import useAuthStore from '@/context/auth.store';
import { useThemeMode } from '@/context/theme.context';
import { getUnreadCount } from '@/services/message.service';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { data: unreadCount = 0 } = useQuery(['unreadCount'], getUnreadCount, {
    refetchInterval: 5000,
  });

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const handleNotification = () => {
    navigate('/messages');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: 1300,
      }}
    >
      <Toolbar
        sx={{
          py: 1,
          minHeight: '64px',
          px: { xs: 1.5, sm: 2.5 },
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {/* LEFT — LOGO + MENU */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          {isMobile && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onMenuClick?.();
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box
            component="img"
            src={logoImg}
            alt="Logo"
            sx={{ width: 40, height: 40, objectFit: 'contain' }}
          />

          <Typography
            variant="h6"
            sx={{
              display: { xs: 'none', sm: 'block' },
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            CDC KPRIET
          </Typography>
        </Box>

        {/* RIGHT — ACTIONS */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={handleNotification}>
            <Badge variant={unreadCount > 0 ? 'dot' : undefined} color="error">
              <NotificationsIcon sx={{ fontSize: '1.3rem' }} />
            </Badge>
          </IconButton>

          <IconButton size="small" onClick={toggleTheme}>
            {isDarkMode ? (
              <Brightness7Icon sx={{ fontSize: '1.3rem' }} />
            ) : (
              <Brightness4Icon sx={{ fontSize: '1.3rem' }} />
            )}
          </IconButton>

          <Avatar
            onClick={handleMenuOpen}
            src={user?.profileImage}
            sx={{
              width: 36,
              height: 36,
              cursor: 'pointer',
              bgcolor: theme.palette.primary.main,
              fontWeight: 600,
            }}
          >
            {user?.firstName?.charAt(0)?.toUpperCase()}
          </Avatar>
        </Box>

        {/* MENU DROPDOWN */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem disabled>
            <Typography fontWeight={600}>
              {user?.firstName} {user?.lastName}
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleProfile}>
            <PersonIcon sx={{ mr: 1 }} /> Profile
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ color: '#D32F2F' }}>
            <LogoutIcon sx={{ mr: 1 }} /> Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
