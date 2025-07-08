import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import QRCode from 'qrcode.react';
import { Container, Typography, Box, TextField, Button, Alert, CircularProgress, Paper } from '@mui/material';

const TwoFactorSetupPage: React.FC = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const navigate = useNavigate();
  const { user, login, setUser } = useAuth(); // Assuming login updates user or have a specific setUser

  useEffect(() => {
    const fetchQrCode = async () => {
      if (user?.twoFactorEnabled) {
        setError("2FA is already enabled for your account.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.post('/auth/setup-2fa');
        setQrCodeUrl(response.data.qrCodeUrl);
        setSecret(response.data.secret); // For manual entry
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to initiate 2FA setup.');
      }
      setIsLoading(false);
    };

    fetchQrCode();
  }, [user]);

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await apiClient.post('/auth/verify-2fa', { token: verificationToken }); // verify-2fa should handle enabling context
      setSuccessMessage(response.data.message || '2FA enabled successfully! You will be redirected.');

      // Update auth context with new user state (2FA enabled) and new token
      if (response.data.token && user) {
        const updatedUser = { ...user, twoFactorEnabled: true };
        login(response.data.token, updatedUser); // Re-login with new token that might have 2FA claim
        setUser(updatedUser); // Explicitly update user in context
      } else if (user) {
        // If no new token is sent, just update the user's 2FA status locally
         setUser({ ...user, twoFactorEnabled: true });
      }

      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify 2FA token.');
    }
    setIsVerifying(false);
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (user?.twoFactorEnabled && !qrCodeUrl) { // If already enabled and no QR code was fetched (e.g. direct navigation)
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>2FA Setup</Typography>
          <Alert severity="info">Two-Factor Authentication is already enabled for your account.</Alert>
          <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{mt: 2}}>Go to Dashboard</Button>
        </Paper>
      </Container>
    );
  }


  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Set Up Two-Factor Authentication
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

        {!successMessage && qrCodeUrl && (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy).
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <QRCode value={qrCodeUrl} size={256} level="H" />
            </Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              If you cannot scan the QR code, you can manually enter this secret key:
            </Typography>
            <Typography variant="caption" component="p" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', mb: 2, p:1, border: '1px solid #ccc', borderRadius: '4px' }}>
              {secret}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              After scanning, enter the 6-digit code from your app below to verify.
            </Typography>
            <Box component="form" onSubmit={handleVerifyToken}>
              <TextField
                label="Verification Token"
                variant="outlined"
                fullWidth
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                required
                sx={{ mb: 2 }}
                disabled={isVerifying}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isVerifying || !verificationToken}
              >
                {isVerifying ? <CircularProgress size={24} /> : 'Verify & Enable 2FA'}
              </Button>
            </Box>
          </>
        )}
         <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{mt: 2, display: successMessage ? 'block' : 'none'}}>Go to Dashboard</Button>
      </Paper>
    </Container>
  );
};

export default TwoFactorSetupPage;
