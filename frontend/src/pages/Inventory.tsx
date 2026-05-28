import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import {
  Package,
  RefreshCw,
  Edit,
  Trash2,
  Save,
  X,
  Plus,
  Calendar,
  AlertTriangle,
  XCircle,
  Search,
  ShoppingCart,
  Receipt,
  Download,
  ChevronDown,
  ChevronUp,
  Printer,
  IndianRupee,
  CheckCircle,
  Minus,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  type Product,
  type ProductStats
} from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillItem {
  productId: string;
  productName: string;
  quantity: number;
  costPerUnit: number;
  unit: string;
  subtotal: number;
}

interface Bill {
  id: string;
  billNumber: string;
  date: string;
  items: BillItem[];
  total: number;
  customerName?: string;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Credit';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusInfo = (product: Product) => {
  if (product.quantity === 0)
    return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
  if (product.quantity <= (product.minStockLevel || 10))
    return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
  if (product.quantity >= (product.maxStockLevel || 1000))
    return { label: 'Over Stock', color: 'bg-blue-100 text-blue-800' };
  return { label: 'Optimal', color: 'bg-green-100 text-green-800' };
};

const isExpiringSoon = (date?: string | Date) => {
  if (!date) return false;
  const diff = new Date(date).getTime() - Date.now();
  return diff > 0 && diff <= 5 * 24 * 60 * 60 * 1000;
};

const isExpired = (date?: string | Date) => {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
};

const genBillNumber = () =>
  `BILL-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`;

// ─── Excel Export ─────────────────────────────────────────────────────────────

const downloadInventoryExcel = (products: Product[]) => {
  const headers = [
    'Product Name', 'Category', 'Unit', 'Quantity',
    'Cost Per Unit (₹)', 'Total Value (₹)', 'Min Stock', 'Max Stock',
    'Expiry Date', 'Status', 'Added On'
  ];

  const rows = products.map(p => {
    const status = getStatusInfo(p).label;
    return [
      p.productName,
      p.category || 'General',
      p.unit || 'units',
      p.quantity,
      (p.costPerUnit || 0).toFixed(2),
      (p.quantity * (p.costPerUnit || 0)).toFixed(2),
      p.minStockLevel || 10,
      p.maxStockLevel || 1000,
      p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'N/A',
      status,
      p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'
    ];
  });

  // Build CSV content
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  toast({ title: '✅ Downloaded', description: 'Inventory sheet exported successfully.' });
};

const downloadBillsExcel = (bills: Bill[]) => {
  const headers = [
    'Bill Number', 'Date', 'Customer', 'Payment Mode',
    'Product', 'Qty', 'Unit Price (₹)', 'Subtotal (₹)', 'Bill Total (₹)'
  ];

  const rows: any[] = [];
  bills.forEach(bill => {
    bill.items.forEach((item, idx) => {
      rows.push([
        bill.billNumber,
        new Date(bill.date).toLocaleString(),
        bill.customerName || 'Walk-in',
        bill.paymentMode,
        item.productName,
        item.quantity,
        item.costPerUnit.toFixed(2),
        item.subtotal.toFixed(2),
        idx === 0 ? bill.total.toFixed(2) : ''
      ]);
    });
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map((cell: any) => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bills_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  toast({ title: '✅ Downloaded', description: 'Bills sheet exported successfully.' });
};

// ─── BillReceipt Modal ────────────────────────────────────────────────────────

const BillReceipt = ({ bill, onClose }: { bill: Bill; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6 rounded-t-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">🌾 Agri Insights Hub</h2>
            <p className="text-green-100 text-sm mt-1">Tax Invoice / Receipt</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 flex justify-between text-sm text-green-100">
          <span>{bill.billNumber}</span>
          <span>{new Date(bill.date).toLocaleString()}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Customer: <strong className="text-gray-800">{bill.customerName || 'Walk-in Customer'}</strong></span>
          <span>Payment: <strong className="text-gray-800">{bill.paymentMode}</strong></span>
        </div>

        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="border-b border-dashed border-gray-300">
              <th className="text-left py-2 text-gray-500">Item</th>
              <th className="text-center py-2 text-gray-500">Qty</th>
              <th className="text-right py-2 text-gray-500">Price</th>
              <th className="text-right py-2 text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-800">{item.productName}</td>
                <td className="py-2 text-center text-gray-600">{item.quantity} {item.unit}</td>
                <td className="py-2 text-right text-gray-600">₹{item.costPerUnit.toFixed(2)}</td>
                <td className="py-2 text-right font-semibold text-gray-800">₹{item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
          <span className="text-lg font-bold text-gray-700">TOTAL</span>
          <span className="text-2xl font-bold text-green-600">₹{bill.total.toFixed(2)}</span>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  </div>
);

// ─── BillingModal ─────────────────────────────────────────────────────────────

const BillingModal = ({
  products,
  onClose,
  onBillCreated
}: {
  products: Product[];
  onClose: () => void;
  onBillCreated: (bill: Bill) => void;
}) => {
  const [cart, setCart] = useState<BillItem[]>([]);
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMode, setPaymentMode] = useState<Bill['paymentMode']>('Cash');
  const [sellQty, setSellQty] = useState<{ [id: string]: number }>({});

  const filtered = useMemo(() =>
    products.filter(p =>
      p.quantity > 0 &&
      p.productName.toLowerCase().includes(search.toLowerCase())
    ), [products, search]);

  const addToCart = (product: Product) => {
    const qty = sellQty[product._id!] || 1;
    if (qty > product.quantity) {
      toast({ title: 'Insufficient stock', description: `Only ${product.quantity} available.`, variant: 'destructive' });
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.productId === product._id);
      if (existing) {
        return prev.map(c =>
          c.productId === product._id
            ? { ...c, quantity: c.quantity + qty, subtotal: (c.quantity + qty) * c.costPerUnit }
            : c
        );
      }
      return [...prev, {
        productId: product._id!,
        productName: product.productName,
        quantity: qty,
        costPerUnit: product.costPerUnit || 0,
        unit: product.unit || 'units',
        subtotal: qty * (product.costPerUnit || 0)
      }];
    });
  };

  const removeFromCart = (productId: string) =>
    setCart(prev => prev.filter(c => c.productId !== productId));

  const cartTotal = cart.reduce((s, c) => s + c.subtotal, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      return;
    }
    const bill: Bill = {
      id: Date.now().toString(),
      billNumber: genBillNumber(),
      date: new Date().toISOString(),
      items: cart,
      total: cartTotal,
      customerName,
      paymentMode
    };
    onBillCreated(bill);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-green-600 to-emerald-500 rounded-t-2xl text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> New Sale
          </h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Product List */}
          <div className="w-1/2 border-r flex flex-col p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
              {filtered.map(p => (
                <div key={p._id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-green-50">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{p.productName}</p>
                    <p className="text-xs text-gray-500">₹{p.costPerUnit} | Stock: {p.quantity} {p.unit}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max={p.quantity}
                      value={sellQty[p._id!] || 1}
                      onChange={e => setSellQty(prev => ({ ...prev, [p._id!]: parseInt(e.target.value) || 1 }))}
                      className="w-14 border rounded px-1 py-0.5 text-sm text-center"
                    />
                    <button
                      onClick={() => addToCart(p)}
                      className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-2 py-1 text-xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="w-1/2 flex flex-col p-4">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Cart ({cart.length} items)
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {cart.length === 0 ? (
                <p className="text-gray-400 text-sm text-center mt-6">Add products from the left</p>
              ) : cart.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.quantity} × ₹{item.costPerUnit} = ₹{item.subtotal.toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)}>
                    <Minus className="h-4 w-4 text-red-400 hover:text-red-600" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 mt-3 space-y-2">
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Customer Name (optional)"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value as Bill['paymentMode'])}
              >
                {['Cash', 'UPI', 'Card', 'Credit'].map(m => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span className="text-green-600">₹{cartTotal.toFixed(2)}</span>
              </div>
              <Button
                onClick={handleCheckout}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={cart.length === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Complete Sale
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Inventory = () => {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0, lowStock: 0, overStock: 0, optimal: 0,
    outOfStock: 0, totalQuantity: 0, totalStockValue: 0, expiringSoon: 0, averageCostPerUnit: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Billing
  const [showBilling, setShowBilling] = useState(false);
  const [bills, setBills] = useState<Bill[]>(() => {
    try { return JSON.parse(localStorage.getItem('agri_bills') || '[]'); } catch { return []; }
  });
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);
  const [showBillsPanel, setShowBillsPanel] = useState(false);

  const [formData, setFormData] = useState({
    productName: '', quantity: '', category: '', unit: 'units',
    costPerUnit: '', expiryDate: '', minStockLevel: '10', maxStockLevel: '1000'
  });

  

  useEffect(() => { if (token) loadData(); }, [token]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [p, s] = await Promise.all([getProducts(token!), getProductStats(token!)]);
      setProducts(p);
      setStats(s);
    } catch {
      toast({ title: 'Error', description: 'Failed to load inventory data.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  // Filtered products
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(products.map(p => p.category || 'General'))];
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'All' || (p.category || 'General') === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, categoryFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.quantity) {
      toast({ title: 'Validation Error', description: 'Product name and quantity are required.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await addProduct({
        productName: formData.productName,
        quantity: parseInt(formData.quantity),
        category: formData.category || 'General',
        unit: formData.unit || 'units',
        costPerUnit: parseFloat(formData.costPerUnit) || 0,
        expiryDate: formData.expiryDate || undefined,
        minStockLevel: parseInt(formData.minStockLevel) || 10,
        maxStockLevel: parseInt(formData.maxStockLevel) || 1000
      }, token!);
      toast({ title: 'Success', description: `Added ${formData.quantity} units of ${formData.productName}.` });
      setFormData({ productName: '', quantity: '', category: '', unit: 'units', costPerUnit: '', expiryDate: '', minStockLevel: '10', maxStockLevel: '1000' });
      loadData();
    } catch {
      toast({ title: 'Error', description: 'Failed to add product.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const startEdit = (product: Product) => {
    setEditingId(product._id || null);
    setEditForm({ ...product, expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '' });
  };

  const saveEdit = async (id: string) => {
    try {
      await updateProduct(id, editForm, token!);
      toast({ title: 'Success', description: 'Product updated successfully.' });
      setEditingId(null); setEditForm({});
      loadData();
    } catch {
      toast({ title: 'Error', description: 'Failed to update product.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string, productName: string) => {
    if (!window.confirm(`Delete "${productName}"?`)) return;
    try {
      await deleteProduct(id, token!);
      toast({ title: 'Deleted', description: `${productName} removed.` });
      loadData();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete product.', variant: 'destructive' });
    }
  };

  // Billing handlers
  const handleBillCreated = async (bill: Bill) => {
    // Deduct stock
    for (const item of bill.items) {
      const product = products.find(p => p._id === item.productId);
      if (product) {
        await updateProduct(item.productId, { quantity: product.quantity - item.quantity }, token!);
      }
    }
    const updatedBills = [bill, ...bills];
    setBills(updatedBills);
    localStorage.setItem('agri_bills', JSON.stringify(updatedBills));
    setShowBilling(false);
    setViewingBill(bill);
    await loadData();
    toast({ title: '✅ Sale Completed', description: `${bill.billNumber} — ₹${bill.total.toFixed(2)}` });
  };

  const deleteBill = (id: string) => {
    const updated = bills.filter(b => b.id !== id);
    setBills(updated);
    localStorage.setItem('agri_bills', JSON.stringify(updated));
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-emerald-500 text-white py-8 shadow">
          <div className="container mx-auto px-4 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Package className="h-8 w-8" /> Inventory Management
              </h1>
              <p className="text-green-100 text-sm mt-1">Manage stock, sell products & track bills</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowBilling(true)} className="bg-white text-green-700 hover:bg-green-50">
                <ShoppingCart className="h-4 w-4 mr-2" /> New Sale
              </Button>
              <Button onClick={() => setShowBillsPanel(!showBillsPanel)} variant="outline" className="border-white text-white hover:bg-white/20">
                <Receipt className="h-4 w-4 mr-2" /> Bills ({bills.length})
              </Button>
              <Button onClick={() => downloadInventoryExcel(products)} variant="outline" className="border-white text-white hover:bg-white/20">
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Sheet
              </Button>
              <Button onClick={loadData} disabled={isLoading} variant="outline" className="border-white text-white hover:bg-white/20">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {[
              { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'from-blue-500 to-blue-600' },
              { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'from-yellow-500 to-amber-500' },
              { label: 'Out of Stock', value: stats.outOfStock, icon: XCircle, color: 'from-red-500 to-red-600' },
              { label: 'Optimal', value: stats.optimal, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
              { label: 'Stock Value', value: `₹${(stats.totalStockValue || 0).toLocaleString()}`, icon: IndianRupee, color: 'from-purple-500 to-purple-600' }
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`bg-gradient-to-br ${color} text-white rounded-xl p-4 shadow`}>
                <Icon className="h-5 w-5 mb-1 opacity-80" />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs opacity-80">{label}</p>
              </div>
            ))}
          </div>

          {/* Bills Panel */}
          {showBillsPanel && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-green-600" /> Bill Records
                </h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => downloadBillsExcel(bills)}>
                    <Download className="h-3 w-3 mr-1" /> Export Bills
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowBillsPanel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {bills.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <Receipt className="h-10 w-10 mx-auto mb-2" />
                  <p>No bills yet. Complete a sale to create one.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Bill No', 'Date', 'Customer', 'Items', 'Payment', 'Total', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bills.map(bill => (
                        <tr key={bill.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-green-700">{bill.billNumber}</td>
                          <td className="px-4 py-3 text-gray-600">{new Date(bill.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-gray-700">{bill.customerName || 'Walk-in'}</td>
                          <td className="px-4 py-3 text-gray-500">{bill.items.length} items</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{bill.paymentMode}</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-green-700">₹{bill.total.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => setViewingBill(bill)}>
                                <Printer className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteBill(bill.id)}>
                                <Trash2 className="h-3 w-3 text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Add Product Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" /> Add New Product
            </h2>
            <form onSubmit={handleAddProduct} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label className="text-xs text-gray-500 mb-1 block">Product Name *</Label>
                <Input name="productName" value={formData.productName} onChange={handleInputChange} placeholder="e.g. Basmati Rice" required />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Category</Label>
                <Input name="category" value={formData.category} onChange={handleInputChange} placeholder="e.g. Grains" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Unit</Label>
                <select name="unit" value={formData.unit} onChange={handleInputChange}
                  className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background">
                  {['kg', 'g', 'litre', 'ml', 'units', 'bags', 'crates', 'tonnes'].map(u => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Quantity *</Label>
                <Input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} placeholder="0" min="0" required />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Cost Per Unit (₹)</Label>
                <Input type="number" name="costPerUnit" value={formData.costPerUnit} onChange={handleInputChange} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Min Stock Level</Label>
                <Input type="number" name="minStockLevel" value={formData.minStockLevel} onChange={handleInputChange} min="0" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Max Stock Level</Label>
                <Input type="number" name="maxStockLevel" value={formData.maxStockLevel} onChange={handleInputChange} min="0" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Expiry Date</Label>
                <Input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} />
              </div>
              <div className="md:col-span-2 flex items-end">
                <Button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700">
                  {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Product
                </Button>
              </div>
            </form>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" /> Current Inventory
                <span className="text-sm font-normal text-gray-400">({filteredProducts.length} of {products.length})</span>
              </h2>
              <div className="flex flex-wrap gap-2 items-center">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Search products or categories..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                {/* Category filter */}
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                >
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-600">
                  {products.length === 0 ? 'No inventory yet' : 'No products match your search'}
                </p>
                <p className="text-gray-400 text-sm">
                  {products.length === 0 ? 'Add your first product above' : 'Try a different search or filter'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Product', 'Category', 'Stock', 'Cost/Unit', 'Total Value', 'Min/Max', 'Expiry', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map(product => {
                      const statusInfo = getStatusInfo(product);
                      const totalValue = product.quantity * (product.costPerUnit || 0);
                      const expiring = isExpiringSoon(product.expiryDate);
                      const expired = isExpired(product.expiryDate);
                      return (
                        <tr key={product._id} className="hover:bg-green-50/30 transition-colors">
                          {editingId === product._id ? (
                            <td colSpan={9} className="px-4 py-3">
                              <div className="grid grid-cols-7 gap-2">
                                <Input value={editForm.productName || ''} onChange={e => setEditForm(f => ({ ...f, productName: e.target.value }))} placeholder="Name" className="h-8 text-xs" />
                                <Input value={editForm.category || ''} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} placeholder="Category" className="h-8 text-xs" />
                                <Input type="number" value={editForm.quantity || 0} onChange={e => setEditForm(f => ({ ...f, quantity: parseInt(e.target.value) }))} className="h-8 text-xs" />
                                <Input type="number" step="0.01" value={editForm.costPerUnit || 0} onChange={e => setEditForm(f => ({ ...f, costPerUnit: parseFloat(e.target.value) }))} className="h-8 text-xs" />
                                <Input type="number" value={editForm.minStockLevel || 10} onChange={e => setEditForm(f => ({ ...f, minStockLevel: parseInt(e.target.value) }))} className="h-8 text-xs" />
                                <Input type="date" value={editForm.expiryDate || ''} onChange={e => setEditForm(f => ({ ...f, expiryDate: e.target.value }))} className="h-8 text-xs" />
                                <div className="flex gap-1">
                                  <Button size="sm" onClick={() => saveEdit(product._id!)} className="bg-green-600 hover:bg-green-700 h-8 px-2"><Save className="h-3 w-3" /></Button>
                                  <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditForm({}); }} className="h-8 px-2"><X className="h-3 w-3" /></Button>
                                </div>
                              </div>
                            </td>
                          ) : (
                            <>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{product.productName}</div>
                                <div className="text-xs text-gray-400">{product.unit}</div>
                              </td>
                              <td className="px-4 py-3 text-gray-500">{product.category}</td>
                              <td className="px-4 py-3 font-bold font-mono text-gray-900">{product.quantity}</td>
                              <td className="px-4 py-3 font-mono text-gray-700">₹{(product.costPerUnit || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 font-mono font-bold text-green-700">₹{totalValue.toFixed(2)}</td>
                              <td className="px-4 py-3 text-center text-xs text-gray-500">
                                <span className="text-gray-700">{product.minStockLevel || 10}</span>
                                <span className="text-gray-300 mx-0.5">/</span>
                                <span className="text-gray-500">{product.maxStockLevel || 1000}</span>
                              </td>
                              <td className="px-4 py-3 text-xs">
                                {product.expiryDate ? (
                                  <div className={expired ? 'text-red-600 font-semibold' : expiring ? 'text-orange-500 font-semibold' : 'text-gray-500'}>
                                    {new Date(product.expiryDate).toLocaleDateString()}
                                    {expired && <div className="text-red-500">Expired</div>}
                                    {expiring && !expired && <div>⚠ Expiring soon</div>}
                                  </div>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => startEdit(product)} className="h-7 w-7 p-0"><Edit className="h-3 w-3" /></Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDelete(product._id!, product.productName)} className="h-7 w-7 p-0 text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></Button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBilling && (
        <BillingModal
          products={products}
          onClose={() => setShowBilling(false)}
          onBillCreated={handleBillCreated}
        />
      )}
      {viewingBill && (
        <BillReceipt bill={viewingBill} onClose={() => setViewingBill(null)} />
      )}
    </Layout>
  );
};

export default Inventory;