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
  type: 'low_stock' | 'overstock' | 'optimal' | 'out_of_stock' | 'expiring' | 'expired';
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

export const addProduct = async (
  product: Omit<Product, '_id' | 'userId'>,
  token: string
): Promise<Product> => {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error('Failed to add product');
  return res.json();
};

export const updateProduct = async (
  id: string,
  updates: Partial<Product>,
  token: string
): Promise<Product> => {
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
  // Strip time — compare dates only
  now.setHours(0, 0, 0, 0);
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  products.forEach(product => {
    const minStock = product.minStockLevel ?? 10;
    const maxStock = product.maxStockLevel ?? 1000;

    // ── 1. Out of stock (highest priority, skip other checks) ──
    if (product.quantity === 0) {
      alerts.push({
        type: 'out_of_stock',
        productName: product.productName,
        currentStock: 0,
        message: 'Out of stock! Immediate reorder required.',
        minStockLevel: minStock,
      });
      return; // skip further checks for this product
    }

    // ── 2. Expiry checks (run regardless of stock level) ──
    if (product.expiryDate) {
      const exp = new Date(product.expiryDate);
      exp.setHours(0, 0, 0, 0); // normalize to date only

      if (exp < now) {
        // Already expired
        alerts.push({
          type: 'expired',
          productName: product.productName,
          currentStock: product.quantity,
          message: `Expired on ${exp.toLocaleDateString('en-IN')}! Remove from shelf immediately.`,
          expiryDate: product.expiryDate,
        });
        return; // expired products skip stock level checks
      }

      if (exp <= fiveDaysFromNow) {
        // Expiring within 5 days
        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: 'expiring',
          productName: product.productName,
          currentStock: product.quantity,
          message: daysLeft === 0
            ? 'Expires TODAY! Sell or remove immediately.'
            : `Expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''} — sell quickly!`,
          expiryDate: product.expiryDate,
        });
        // Don't return — also check stock level below
      }
    }

    // ── 3. Stock level checks ──
    if (product.quantity <= minStock) {
      alerts.push({
        type: 'low_stock',
        productName: product.productName,
        currentStock: product.quantity,
        message: `Stock critically low (${product.quantity} left). Reorder ${minStock * 2 - product.quantity}+ units.`,
        minStockLevel: minStock,
      });
    } else if (product.quantity >= maxStock) {
      alerts.push({
        type: 'overstock',
        productName: product.productName,
        currentStock: product.quantity,
        message: 'Excess inventory. Consider reducing next order.',
        maxStockLevel: maxStock,
      });
    } else {
      alerts.push({
        type: 'optimal',
        productName: product.productName,
        currentStock: product.quantity,
        message: 'Stock level is optimal.',
        minStockLevel: minStock,
        maxStockLevel: maxStock,
      });
    }
  });

  // Sort: expired → expiring → out_of_stock → low_stock → overstock → optimal
  const priority: Record<string, number> = {
    expired: 0, expiring: 1, out_of_stock: 2, low_stock: 3, overstock: 4, optimal: 5,
  };
  alerts.sort((a, b) => (priority[a.type] ?? 9) - (priority[b.type] ?? 9));

  return alerts;
};
