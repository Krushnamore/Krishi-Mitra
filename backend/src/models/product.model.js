import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  category: { type: String, default: 'General' },
  unit: { type: String, default: 'units' },
  costPerUnit: { type: Number, default: 0, min: 0 },
  expiryDate: { type: Date, default: null },
  minStockLevel: { type: Number, default: 10 },
  maxStockLevel: { type: Number, default: 1000 },
}, { timestamps: true });

productSchema.index({ userId: 1, productName: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
