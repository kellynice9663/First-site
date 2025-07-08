import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/api';
import { UserDashboardData, WalletData, InvestmentHistoryItem, RoiTrackerData } from '../../types/dashboard';
import { Container, Typography, Box, Grid, Paper, CircularProgress, Alert, Button, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';

const StatCard: React.FC<{ title: string; value: string | number; icon?: React.ReactElement; unit?: string }> = ({ title, value, icon, unit }) => (
  <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
    {icon && <Box sx={{ fontSize: 40, color: 'primary.main', mb: 1 }}>{icon}</Box>}
    <Typography variant="h6" color="text.secondary" gutterBottom>{title}</Typography>
    <Typography variant="h4">{value}{unit && <Typography variant="caption" sx={{ml:0.5}}>{unit}</Typography>}</Typography>
  </Paper>
);

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<UserDashboardData>('/users/dashboard');
        setDashboardData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
        if (err.response?.status === 401) { // Unauthorized
            logout(); // Log out user if token is invalid or expired
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false); // Should not happen if ProtectedRoute works, but good fallback
    }
  }, [user, logout]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{m: 2}}>{error}</Alert>;
  }

  if (!dashboardData) {
    return <Alert severity="info" sx={{m: 2}}>No dashboard data available. Please try again later.</Alert>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Welcome, {dashboardData.email}!
      </Typography>

      {!dashboardData.twoFactorEnabled && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Two-Factor Authentication (2FA) is not enabled for your account. For enhanced security, please
          <MuiLink component={RouterLink} to="/setup-2fa" sx={{fontWeight: 'bold'}}> set up 2FA</MuiLink>.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Wallet Balance Card */}
        <Grid item xs={12} md={6} lg={4}>
          <StatCard
            title="BTC Balance"
            value={dashboardData.wallet.btcBalance.toFixed(6)} // Display BTC with more precision
            icon={<AccountBalanceWalletIcon />}
            unit="BTC"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <StatCard
            title="USD Equivalent"
            value={`$${dashboardData.wallet.usdEquivalentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<ShowChartIcon />}
          />
        </Grid>

        {/* ROI Tracker Cards */}
        <Grid item xs={12} md={6} lg={4}>
          <StatCard
            title="Total Invested (BTC)"
            value={dashboardData.roiTracker.totalInvested.toFixed(6)}
            icon={<ShowChartIcon />}
            unit="BTC"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <StatCard
            title="Total ROI Earned (BTC)"
            value={dashboardData.roiTracker.totalRoiEarned.toFixed(6)}
            icon={<HistoryIcon />}
            unit="BTC"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <StatCard
            title="Active Investments"
            value={dashboardData.roiTracker.activeInvestments}
            icon={<ShowChartIcon />}
          />
        </Grid>

        {/* Placeholder for 2FA status or link */}
         <Grid item xs={12} md={6} lg={4}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
            <Box sx={{ fontSize: 40, color: dashboardData.twoFactorEnabled ? 'success.main' : 'warning.main', mb: 1 }}><SecurityIcon /></Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>Account Security</Typography>
            <Typography variant="h5">{dashboardData.twoFactorEnabled ? "2FA Enabled" : "2FA Disabled"}</Typography>
            {!dashboardData.twoFactorEnabled && (
                 <Button component={RouterLink} to="/setup-2fa" variant="outlined" size="small" sx={{mt:1}}>Enable 2FA</Button>
            )}
          </Paper>
        </Grid>


        {/* Investment History Section */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h5" gutterBottom>Investment History</Typography>
            {dashboardData.investmentHistory.length > 0 ? (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}> {/* Scrollable if many items */}
                {dashboardData.investmentHistory.map((item) => (
                  <Paper key={item.id} variant="outlined" sx={{ p: 2, mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{item.planName}</Typography>
                      <Typography variant="body2" color="text.secondary">Start Date: {new Date(item.startDate).toLocaleDateString()}</Typography>
                    </Box>
                    <Box sx={{textAlign: {xs: 'left', sm: 'right'}, mt: {xs: 1, sm: 0}}}>
                      <Typography variant="body1">Amount: {item.amount.toFixed(6)} BTC</Typography>
                      <Typography variant="body1" sx={{ color: item.status === 'Active' ? 'success.main' : 'text.secondary' }}>
                        Status: {item.status}
                      </Typography>
                      <Typography variant="body1">ROI Earned: {item.roiEarned.toFixed(6)} BTC</Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography>No investment history found.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-start' }}>
        <Button onClick={logout} variant="outlined" color="primary">
          Logout
        </Button>
      </Box>
    </Container>
  );
};

export default DashboardPage;
