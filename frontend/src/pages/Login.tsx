import useAuthStore from '@/context/auth.store';
import api from '@/services/api';
import { Box, Button, TextField, Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

interface LoginForm {
  identifier: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await api.post('/auth/login', data);
      const { token, user } = response.data;
      setAuth(user, token);
      navigate('/');
    } catch (error: any) {
      setError('root', {
        message: error.response?.data?.message || 'An error occurred during login'
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1B5E8E 0%, #00897B 100%)',
        padding: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          padding: 4,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img
    src={logo}  
    alt="Logo"
    style={{
      width: 60,
      height: 60,
      objectFit: 'contain',
    }}
  />
        </Box>

        {/* Title */}
        <Typography 
          variant="h4" 
          sx={{
            fontWeight: 700,
            color: '#1A1A1A',
            textAlign: 'center',
            mb: 0.5,
          }}
        >
          CDC KPRIET
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            margin="normal"
            label="Email or Username"
            placeholder="Enter your email or username"
            {...register('identifier', {
              required: 'Email or username is required'
            })}
            error={!!errors.identifier}
            helperText={errors.identifier?.message}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#1B5E8E',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1B5E8E',
                },
              },
              '& .MuiInputBase-input::placeholder': {
                opacity: 0.7,
              },
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            type="password"
            label="Password"
            placeholder="Enter your password"
            {...register('password', {
              required: 'Password is required'
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#1B5E8E',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1B5E8E',
                },
              },
              '& .MuiInputBase-input::placeholder': {
                opacity: 0.7,
              },
            }}
          />

          {errors.root && (
            <Typography 
              color="error" 
              align="center" 
              sx={{ mt: 2, fontSize: '0.9rem', fontWeight: 500 }}
            >
              {errors.root.message}
            </Typography>
          )}

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            sx={{
              mt: 3,
              backgroundColor: '#1B5E8E',
              color: '#fff',
              fontWeight: 600,
              padding: '12px 16px',
              borderRadius: '4px',
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                backgroundColor: '#0D47A1',
              },
            }}
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <Typography 
          variant="caption" 
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 3,
            color: '#6B7280',
          }}
        >
          © CDC KPRIET. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;