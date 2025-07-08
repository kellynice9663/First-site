const User = require('../models/UserModel');
// Assume Investment model will be created and imported when needed
// const Investment = require('../models/InvestmentModel');

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
const getUserDashboardData = async (req, res) => {
  try {
    // req.user is populated by the 'protect' middleware
    const user = await User.findById(req.user.id)
      .select('-password -twoFactorSecret') // Exclude sensitive data
      // .populate('investments'); // If you want to populate investment details

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // For now, wallet balance and ROI are directly from User model.
    // USD equivalent would ideally be calculated with a live price feed.
    // Investment history and ROI tracker would involve more complex logic
    // based on the 'investments' array and potentially an Investment model.

    // Placeholder data for features not yet fully implemented:
    const investmentHistory = [
      { id: '1', planName: 'Starter Daily', amount: 0.1, status: 'Active', startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], roiEarned: 0.01 },
      { id: '2', planName: 'Pro Weekly', amount: 0.5, status: 'Completed', startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], roiEarned: 0.15 },
    ];

    const roiTracker = {
      totalInvested: 0.6, // Sum of amounts from investmentHistory or user.investments
      totalRoiEarned: 0.16, // Sum of ROI from investmentHistory or user.investments
      activeInvestments: 1,
      // More detailed data points can be added here
    };

    // Simulate USD equivalent calculation (this should come from a crypto API in reality)
    const btcPriceUsd = 40000; // Example static price
    const usdEquivalent = user.wallet.btcBalance * btcPriceUsd;

    res.json({
      email: user.email,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      wallet: {
        btcBalance: user.wallet.btcBalance,
        // usdEquivalentBalance: user.wallet.usdEquivalentBalance, // Use calculated one for now
        usdEquivalentBalance: usdEquivalent,
      },
      // investmentStatus: user.investments.length > 0 ? 'Active Investments' : 'No Active Investments', // Simple status
      investmentHistory: investmentHistory, // Populated from user.investments when implemented
      roiTracker: roiTracker, // Calculated based on investments
      createdAt: user.createdAt,
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
};

module.exports = {
  getUserDashboardData,
};
