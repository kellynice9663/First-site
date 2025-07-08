import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/api';
import * as Yup from 'yup';
import { Formik, Form, Field } from 'formik';
import { TextField as FormikTextField } from 'formik-mui';
import { Button, Container, Typography, Box, Alert, Link, CircularProgress } from '@mui/material';

const RegisterSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Required'),
});

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // login after successful registration
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setError(null);
    const { email, password } = values;
    try {
      const response = await apiClient.post('/auth/register', { email, password });
      login(response.data.token, response.data); // response.data should contain user details
      navigate('/dashboard'); // Or to a "please verify email page" if email verification is implemented
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Sign Up</Typography>
        {error && <Alert severity="error" sx={{width: '100%', mt: 2}}>{error}</Alert>}
        <Formik
          initialValues={{ email: '', password: '', confirmPassword: '' }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
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
              <Field
                component={FormikTextField}
                name="confirmPassword"
                type="password"
                label="Confirm Password"
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
                {isSubmitting ? <CircularProgress size={24} /> : 'Sign Up'}
              </Button>
              <Box sx={{ textAlign: 'center' }}>
                <Link component={RouterLink} to="/login" variant="body2">
                  {"Already have an account? Sign In"}
                </Link>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
};

export default RegisterPage;
