import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['farmer', 'retailer'],
    required: true,
  },
  // Location data (stored after browser geolocation)
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
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
