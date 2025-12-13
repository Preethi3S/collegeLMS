import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1B5E8E', // Professional Blue
      light: '#42A5F5',
      dark: '#0D47A1',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00897B', // Teal Green
      light: '#4DB6AC',
      dark: '#004D40',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6B7280',
    },
    success: {
      main: '#00897B',
    },
    warning: {
      main: '#F57C00',
    },
    error: {
      main: '#D32F2F',
    },
    divider: '#E0E0E0',
    tonalOffset: 0.2,
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
      fontSize: '2rem',
      color: '#1A1A1A',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.75rem',
      color: '#1A1A1A',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#1A1A1A',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#1A1A1A',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.1rem',
      color: '#1A1A1A',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      color: '#1A1A1A',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '0.95rem',
      color: '#6B7280',
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
      color: '#1A1A1A',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#6B7280',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '6px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(13, 71, 161, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E8EEF5',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FAFBFC',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          borderBottom: '1px solid #E8EEF5',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#42A5F5',
      light: '#64B5F6',
      dark: '#0D47A1',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4DB6AC',
      light: '#80CBC4',
      dark: '#00897B',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0F1419',
      paper: '#1A1F2E',
    },
    text: {
      primary: '#E5E7EB',
      secondary: '#9CA3AF',
    },
    success: {
      main: '#4DB6AC',
    },
    warning: {
      main: '#F57C00',
    },
    error: {
      main: '#EF5350',
    },
    divider: '#374151',
    tonalOffset: 0.2,
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      'Segoe UI',
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '6px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(66, 165, 245, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #374151',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          backgroundColor: '#1A1F2E',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#252E3F',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1F2E',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid #374151',
        },
      },
    },
  },
});

export { darkTheme };
export default lightTheme;
