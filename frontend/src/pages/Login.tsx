import useAuthStore from '@/context/auth.store';
import api from '@/services/api';
import { Box, Button, Container, Paper, TextField, Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

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
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            College LMS
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom align="center">
            Login
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              margin="normal"
              label="Email or Username"
              {...register('identifier', {
                required: 'Email or username is required'
              })}
              error={!!errors.identifier}
              helperText={errors.identifier?.message}
            />

            <TextField
              fullWidth
              margin="normal"
              type="password"
              label="Password"
              {...register('password', {
                required: 'Password is required'
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            {errors.root && (
              <Typography color="error" align="center" sx={{ mt: 2 }}>
                {errors.root.message}
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              sx={{ mt: 3 }}
            >
              Login
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;