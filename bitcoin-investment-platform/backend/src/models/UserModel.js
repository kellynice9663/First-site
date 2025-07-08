const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: { // For email verification
    type: Boolean,
    default: false,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  // Wallet and investment related fields will be added later
  // For now, let's add basic wallet fields
  wallet: {
    btcBalance: { type: Number, default: 0 },
    usdBalance: { type: Number, default: 10000 }, // Add USD balance, give users some starting dummy USD
    // usdEquivalentBalance is a calculated value, not stored directly here.
    // It represents the USD value of their BTC holdings.
  },
  investments: [{ // Array to store references to investment documents or embedded investment details
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment', // Assuming an Investment model will be created
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update `updatedAt` field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
