import { useState, useEffect, useMemo } from 'react';
import type { ElementType } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useGeolocation } from '@/hooks/use-geolocation';
import {
  Package, AlertTriangle, AlertCircle, RefreshCw,
  XCircle, MapPin, Store, CheckCircle2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getProducts, getProductStats, type Product, type ProductStats } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const IndianRupee = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M6 3h12" /><path d="M6 8h12" />
    <path d="M6 13l8.5 8" /><path d="M6 13h6.5a3.5 3.5 0 1 0 0-7H6" />
  </svg>
);

interface TrendData {
  month: string;
  products: number;
  quantity: number;
  value: number;
}

const RetailerDashboard = () => {
  const { user, token } = useAuth();
  const geo = useGeolocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0, lowStock: 0, overStock: 0, optimal: 0,
    outOfStock: 0, totalQuantity: 0, totalStockValue: 0, expiringSoon: 0, averageCostPerUnit: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState<'cost' | 'quantity' | 'expiry'>('cost');
  const [trendFilter, setTrendFilter] = useState<'products' | 'quantity' | 'value'>('quantity');

  const loadData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [p, s] = await Promise.all([getProducts(token), getProductStats(token)]);
      setProducts(p);
      setStats(s);
      if (s.lowStock || s.outOfStock) {
        toast({ title: '⚠ Inventory Alert', description: `${s.outOfStock} out of stock, ${s.lowStock} low stock`, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, [token]);

  const productChartData = useMemo(() => products.slice(0, 10).map(p => ({
    name: p.productName.slice(0, 12),
    value: chartFilter === 'cost' ? p.quantity * (p.costPerUnit || 0)
      : chartFilter === 'quantity' ? p.quantity
      : p.expiryDate ? Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
  })), [products, chartFilter]);

  const monthlyTrendData = useMemo(() => {
    const map = new Map<string, TrendData>();
    products.forEach(p => {
      if (!p.createdAt) return;
      const d = new Date(p.createdAt);
      const key = d.toISOString().slice(0, 7);
      if (!map.has(key)) map.set(key, { month: d.toLocaleString('en', { month: 'short' }), products: 0, quantity: 0, value: 0 });
      const m = map.get(key)!;
      m.products++; m.quantity += p.quantity; m.value += p.quantity * (p.costPerUnit || 0);
    });
    return Array.from(map.values()).slice(-6);
  }, [products]);

  const statCards = [
    { icon: Package, label: 'Total Products', value: stats.totalProducts, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: CheckCircle2, label: 'Optimal Stock', value: stats.optimal, color: 'text-green-600', bg: 'bg-green-50' },
    { icon: AlertTriangle, label: 'Low Stock', value: stats.lowStock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { icon: XCircle, label: 'Out of Stock', value: stats.outOfStock, color: 'text-red-600', bg: 'bg-red-50' },
    { icon: AlertCircle, label: 'Overstocked', value: stats.overStock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: IndianRupee as ElementType, label: 'Stock Value (₹)', value: stats.totalStockValue.toLocaleString('en-IN'), color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <Layout>
      <div className="bg-secondary min-h-screen">
        <div className="bg-gradient-hero text-primary-foreground py-8">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Store className="h-8 w-8" /> Retailer Dashboard
              </h1>
              <p className="text-primary-foreground/80">
                Welcome, {user?.name?.split(' ')[0]}
                {user?.shopName && ` — ${user.shopName}`}
                {geo.city && <span className="ml-2 text-sm"><MapPin className="inline h-3.5 w-3.5 mr-1" />{geo.city}</span>}
              </p>
            </div>
            <Button onClick={loadData} disabled={isLoading} variant="outline" className="border-white/30 text-white hover:bg-white/20">
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-card rounded-xl border border-border p-4 flex flex-col gap-2">
                  <div className={`p-2 rounded-lg ${card.bg} ${card.color} w-fit`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* Quick Links — Inventory & Alerts only */}
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
            {[
              { label: 'Manage Inventory', path: '/inventory', icon: Package, color: 'bg-blue-500' },
              { label: 'View Alerts', path: '/alerts', icon: AlertTriangle, color: 'bg-red-500' },
            ].map(q => {
              const Icon = q.icon;
              return (
                <Link key={q.label} to={q.path}>
                  <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer">
                    <div className={`p-2 rounded-lg ${q.color} text-white w-fit mb-2 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{q.label}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-foreground">Product Analysis</h2>
                <div className="flex gap-1">
                  {(['cost', 'quantity', 'expiry'] as const).map(f => (
                    <button key={f} onClick={() => setChartFilter(f)}
                      className={`px-2 py-1 rounded text-xs ${chartFilter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer height={250}>
                <BarChart data={productChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-foreground">Monthly Trend</h2>
                <div className="flex gap-1">
                  {(['products', 'quantity', 'value'] as const).map(f => (
                    <button key={f} onClick={() => setTrendFilter(f)}
                      className={`px-2 py-1 rounded text-xs ${trendFilter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer height={250}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip /><Legend />
                  <Line dataKey={trendFilter} stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RetailerDashboard;
