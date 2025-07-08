export interface WalletData {
  btcBalance: number;
  usdEquivalentBalance: number;
}

export interface InvestmentHistoryItem {
  id: string;
  planName: string;
  amount: number;
  status: 'Active' | 'Completed' | 'Pending'; // Example statuses
  startDate: string;
  roiEarned: number;
  // endDate?: string; // Optional
}

export interface RoiTrackerData {
  totalInvested: number;
  totalRoiEarned: number;
  activeInvestments: number;
  // Potentially more fields like averageRoiRate, nextPayoutDate etc.
}

export interface UserDashboardData {
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  wallet: WalletData;
  investmentHistory: InvestmentHistoryItem[];
  roiTracker: RoiTrackerData;
  createdAt: string;
}
