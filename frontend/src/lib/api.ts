const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface Product {
  _id?: string;
  userId: string;
  productName: string;
  quantity: number;
  category?: string;
  unit?: string;
  costPerUnit?: number;
  expiryDate?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductStats {
  totalProducts: number;
  lowStock: number;
  overStock: number;
  optimal: number;
  outOfStock: number;
  totalQuantity: number;
  totalStockValue: number;
  expiringSoon: number;
  averageCostPerUnit: number;
}

export interface MonthlyTrendData {
  month: string;
  products: number;
  quantity: number;
  value: number;
}

export interface Alert {
  type: 'low_stock' | 'overstock' | 'optimal' | 'out_of_stock' | 'expiring';
  productName: string;
  currentStock: number;
  message: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  expiryDate?: string;
}

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const getProducts = async (token: string): Promise<Product[]> => {
  const res = await fetch(`${API_BASE_URL}/products`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
};

export const addProduct = async (product: Omit<Product, '_id' | 'userId'>, token: string): Promise<Product> => {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error('Failed to add product');
  return res.json();
};

export const updateProduct = async (id: string, updates: Partial<Product>, token: string): Promise<Product> => {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
};

export const deleteProduct = async (id: string, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to delete product');
};

export const getProductStats = async (token: string): Promise<ProductStats> => {
  const res = await fetch(`${API_BASE_URL}/products/stats`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
};

export const getMonthlyTrend = async (token: string): Promise<MonthlyTrendData[]> => {
  const res = await fetch(`${API_BASE_URL}/products/trend`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch monthly trend');
  return res.json();
};

export const generateAlerts = (products: Product[]): Alert[] => {
  const alerts: Alert[] = [];
  const now = new Date();
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  products.forEach(product => {
    const minStock = product.minStockLevel || 10;
    const maxStock = product.maxStockLevel || 1000;

    if (product.quantity === 0) {
      alerts.push({ type: 'out_of_stock', productName: product.productName, currentStock: 0, message: 'Out of stock! Immediate reorder required.', minStockLevel: minStock });
      return;
    }
    if (product.expiryDate) {
      const exp = new Date(product.expiryDate);
      if (exp >= now && exp <= fiveDaysFromNow) {
        alerts.push({ type: 'expiring', productName: product.productName, currentStock: product.quantity, message: 'Expiring within 5 days!', expiryDate: product.expiryDate });
      }
    }
    if (product.quantity <= minStock) {
      alerts.push({ type: 'low_stock', productName: product.productName, currentStock: product.quantity, message: `Stock critically low. Reorder ${minStock * 2 - product.quantity}+ units.`, minStockLevel: minStock });
    } else if (product.quantity >= maxStock) {
      alerts.push({ type: 'overstock', productName: product.productName, currentStock: product.quantity, message: 'Excess inventory. Consider reducing next order.', maxStockLevel: maxStock });
    } else {
      alerts.push({ type: 'optimal', productName: product.productName, currentStock: product.quantity, message: 'Stock level is optimal.', minStockLevel: minStock, maxStockLevel: maxStock });
    }
  });
  return alerts;
};
