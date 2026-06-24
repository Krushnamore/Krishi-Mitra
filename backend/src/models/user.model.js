import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['farmer', 'retailer'], required: true },
  phone: { type: String, default: '', trim: true },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    city: { type: String, default: '' },
  },
  // Farmer-specific
  farmSize: { type: String, default: '' },
  cropTypes: [{ type: String }],
  // Retailer-specific
  shopName: { type: String, default: '' },
  shopAddress: { type: String, default: '' },
  // Password reset
  resetPasswordToken: { type: String, default: undefined },
  resetPasswordExpiry: { type: Date, default: undefined },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // 'this' refers to the current document. DO NOT use an arrow function here.
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  return obj;
};

// Prevent OverwriteModelError during hot-reloads
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;