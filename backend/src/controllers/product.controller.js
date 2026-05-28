import Product from '../models/product.model.js';

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    const { productName, quantity, category, unit, costPerUnit, expiryDate, minStockLevel, maxStockLevel } = req.body;

    if (!productName || quantity === undefined) {
      return res.status(400).json({ message: 'productName and quantity are required' });
    }

    const newProduct = new Product({
      userId: req.user._id,
      productName,
      quantity,
      category: category || 'General',
      unit: unit || 'units',
      costPerUnit: costPerUnit || 0,
      expiryDate: expiryDate || null,
      minStockLevel: minStockLevel || 10,
      maxStockLevel: maxStockLevel || 1000,
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error adding product', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

export const getProductStats = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id });
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const stats = {
      totalProducts: products.length,
      lowStock: products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel).length,
      outOfStock: products.filter(p => p.quantity === 0).length,
      overStock: products.filter(p => p.quantity >= p.maxStockLevel).length,
      optimal: products.filter(p => p.quantity > p.minStockLevel && p.quantity < p.maxStockLevel).length,
      totalQuantity: products.reduce((s, p) => s + p.quantity, 0),
      totalStockValue: Math.round(products.reduce((s, p) => s + p.quantity * (p.costPerUnit || 0), 0) * 100) / 100,
      expiringSoon: products.filter(p => {
        if (!p.expiryDate) return false;
        const d = new Date(p.expiryDate);
        return d >= now && d <= fiveDaysFromNow;
      }).length,
      averageCostPerUnit: products.length > 0
        ? Math.round((products.reduce((s, p) => s + (p.costPerUnit || 0), 0) / products.length) * 100) / 100
        : 0,
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

export const getMonthlyTrend = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).sort({ createdAt: 1 });
    const monthlyData = {};

    products.forEach(p => {
      if (!p.createdAt) return;
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { month: d.toLocaleDateString('en-US', { month: 'short' }), products: 0, quantity: 0, value: 0 };
      }
      monthlyData[key].products++;
      monthlyData[key].quantity += p.quantity;
      monthlyData[key].value += p.quantity * (p.costPerUnit || 0);
    });

    const trendData = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([_, d]) => ({ ...d, value: Math.round(d.value * 100) / 100 }));

    res.status(200).json(trendData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching monthly trend', error: error.message });
  }
};
