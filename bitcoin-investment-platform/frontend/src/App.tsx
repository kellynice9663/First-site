import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import TwoFactorSetupPage from './components/Auth/TwoFactorSetupPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AppBar, Toolbar, Typography, Button, Container, Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';

import DashboardPage from './components/Dashboard/DashboardPage';

// Dummy Home component
const HomePage: React.FC = () => (
  <Container>
    <Typography variant="h3" sx={{ mt: 4, mb: 2 }}>Welcome to Bitcoin Investment Platform</Typography>
    <Typography>Please <Link href="/login">login</Link> or <Link href="/register">register</Link> to continue.</Typography>
  </Container>
);


const theme = createTheme({
  palette: {
    mode: 'light', // Default to light, can add dark mode toggle later
    primary: {
      main: '#f7931a', // Bitcoin orange
    },
    secondary: {
      main: '#4E5D6C', // A cool grey
    },
  },
});


const AppContent: React.FC = () => {
  const { user, token, isLoading, logout } = useAuth();

  if (isLoading) {
    return <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><Typography>Loading App...</Typography></Box>;
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
            Bitcoin Platform
          </Typography>
          {token && user ? (
            <>
              <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
              {!user.twoFactorEnabled && (
                 <Button color="inherit" component={Link} to="/setup-2fa">Setup 2FA</Button>
              )}
              <Button color="inherit" onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">Login</Button>
              <Button color="inherit" component={Link} to="/register">Register</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 2, mb: 2 }}>
        <Routes>
          <Route path="/" element={token ? <Navigate to="/dashboard" /> : <HomePage />} />
          <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/setup-2fa" element={<TwoFactorSetupPage />} />
            {/* Add other protected routes here */}
          </Route>

          {/* Catch-all for unknown routes or redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </>
  );
}


function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
