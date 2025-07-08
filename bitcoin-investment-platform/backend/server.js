const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
// const investmentRoutes = require('./src/routes/investmentRoutes'); // Will be added later
// const tradingRoutes = require('./src/routes/tradingRoutes'); // Will be added later
// const withdrawalRoutes = require('./src/routes/withdrawalRoutes'); // Will be added later
// const adminRoutes = require('./src/routes/adminRoutes'); // Will be added later

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/investments', investmentRoutes);
// app.use('/api/trading', tradingRoutes);
// app.use('/api/withdrawals', withdrawalRoutes);
// app.use('/api/admin', adminRoutes);


// Error Handling Middleware (simple example)
// More sophisticated error handling can be added later
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5001; // Fallback port

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
