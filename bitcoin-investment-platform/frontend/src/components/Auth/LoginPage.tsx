import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/api';
import * as Yup from 'yup';
import { Formik, Form, Field } from 'formik';
import { TextField as FormikTextField } from 'formik-mui';
import { Button, Container, Typography, Box, Alert, Link, CircularProgress } from '@mui/material';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required'),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState<boolean>(false);
  const [userIdFor2FA, setUserIdFor2FA] = useState<string | null>(null);
  const [twoFactorToken, setTwoFactorToken] = useState<string>('');
  const [isSubmitting2FA, setIsSubmitting2FA] = useState<boolean>(false);

  const handleLoginSubmit = async (values: any, { setSubmitting }: any) => {
    setError(null);
    try {
      const response = await apiClient.post('/auth/login', values);
      if (response.data.twoFactorRequired) {
        setRequires2FA(true);
        setUserIdFor2FA(response.data.userId);
      } else {
        login(response.data.token, response.data); // response.data should contain user details
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
    setSubmitting(false);
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting2FA(true);
    if (!userIdFor2FA || !twoFactorToken) {
      setError('User ID or 2FA token is missing.');
      setIsSubmitting2FA(false);
      return;
    }
    try {
      const response = await apiClient.post('/auth/verify-2fa', {
        userId: userIdFor2FA,
        token: twoFactorToken,
      });
      login(response.data.token, response.data); // response.data should contain user details
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '2FA verification failed.');
    }
    setIsSubmitting2FA(false);
  };

  if (requires2FA) {
    return (
      <Container maxWidth="xs">
        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h5">Enter 2FA Token</Typography>
          {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handle2FASubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="twoFactorToken"
              label="2FA Token"
              type="text"
              id="twoFactorToken"
              autoComplete="one-time-code"
              value={twoFactorToken}
              onChange={(e) => setTwoFactorToken(e.target.value)}
              autoFocus
              // Added by Material-UI to avoid React warning
              // Can be removed if not using the FormikTextField for this field
              // For a simple TextField, this is not needed.
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting2FA}
            >
              {isSubmitting2FA ? <CircularProgress size={24} /> : 'Verify Token'}
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Login</Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleLoginSubmit}
        >
          {({ isSubmitting }) => (
            <Form style={{ width: '100%', marginTop: '8px' }}>
              <Field
                component={FormikTextField}
                name="email"
                type="email"
                label="Email Address"
                margin="normal"
                fullWidth
                required
              />
              <Field
                component={FormikTextField}
                name="password"
                type="password"
                label="Password"
                margin="normal"
                fullWidth
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Login'}
              </Button>
              <Box sx={{ textAlign: 'center' }}>
                <Link component={RouterLink} to="/register" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
};

export default LoginPage;
