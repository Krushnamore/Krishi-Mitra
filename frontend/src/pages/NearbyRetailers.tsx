import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useGeolocation } from '@/hooks/use-geolocation';
import {
  Store, MapPin, Mail, Phone, Loader2, Search,
  ChevronDown, ChevronUp, Package, X
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface RetailerProduct {
  _id: string;
  productName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  category: string;
}

interface Retailer {
  id: string;
  name: string;
  shopName: string;
  shopAddress: string;
  email: string;
  phone?: string;
  city: string;
  lat?: number;
  lng?: number;
}

const NearbyRetailers = () => {
  const { token } = useAuth();
  const geo = useGeolocation();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [productsMap, setProductsMap] = useState<Record<string, RetailerProduct[]>>({});
  const [productsLoading, setProductsLoading] = useState<Record<string, boolean>>({});
  const [productSearch, setProductSearch] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchRetailers = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (geo.lat) params.append('lat', String(geo.lat));
        if (geo.lng) params.append('lng', String(geo.lng));
        if (geo.city) params.append('city', geo.city);

        const res = await fetch(`${API_BASE}/ai/nearby-retailers?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRetailers(data.retailers);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchRetailers();
  }, [token, geo.lat, geo.lng]);

  const toggleExpand = async (retailerId: string) => {
    if (expandedId === retailerId) { setExpandedId(null); return; }
    setExpandedId(retailerId);
    if (productsMap[retailerId]) return;

    setProductsLoading(prev => ({ ...prev, [retailerId]: true }));
    try {
      const res = await fetch(`${API_BASE}/ai/retailer-products/${retailerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : { products: [] };
      setProductsMap(prev => ({ ...prev, [retailerId]: data.products || [] }));
    } catch {
      setProductsMap(prev => ({ ...prev, [retailerId]: [] }));
    }
    setProductsLoading(prev => ({ ...prev, [retailerId]: false }));
  };

  const filtered = retailers.filter(r =>
    !search ||
    r.shopName?.toLowerCase().includes(search.toLowerCase()) ||
    r.city?.toLowerCase().includes(search.toLowerCase()) ||
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getFilteredProducts = (retailerId: string) => {
    const products = productsMap[retailerId] || [];
    const q = (productSearch[retailerId] || '').toLowerCase();
    if (!q) return products.filter(p => p.quantity > 0);
    return products.filter(p =>
      p.quantity > 0 && (
        p.productName.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
    );
  };

  return (
    <Layout>
      <div className="bg-secondary min-h-screen">
        {/* Header */}
        <div className="bg-gradient-hero text-primary-foreground py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Store className="h-7 w-7" /> Nearby Agri Retailers
            </h1>
            <p className="text-primary-foreground/80 text-sm mt-1">
              Find agricultural input stores near you
              {geo.city && <span className="ml-2"><MapPin className="inline h-3.5 w-3.5 mr-1" />{geo.city}</span>}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Retailer Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by shop name, city, or owner..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 justify-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" /> Loading retailers...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {retailers.length === 0 ? 'No retailers have registered yet.' : 'No retailers match your search.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(r => (
                <div key={r.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                  {/* Retailer Header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary flex-shrink-0">
                          <Store className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Shop name prominent */}
                          <h3 className="font-bold text-foreground text-lg leading-tight">{r.shopName}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">Owner: {r.name}</p>

                          {/* Contact row */}
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                            <a href={`mailto:${r.email}`}
                              className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" /> {r.email}
                            </a>
                            {r.phone && (
                              <a href={`tel:+91${r.phone}`}
                                className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                                <Phone className="h-3.5 w-3.5 flex-shrink-0" /> +91 {r.phone}
                              </a>
                            )}
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                              {r.shopAddress || r.city}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expand Button */}
                      <button
                        onClick={() => toggleExpand(r.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all flex-shrink-0"
                      >
                        <Package className="h-4 w-4" />
                        <span className="hidden sm:inline">Products</span>
                        {expandedId === r.id
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Products Panel */}
                  {expandedId === r.id && (
                    <div className="border-t border-border bg-secondary/30">
                      {/* Product search bar */}
                      <div className="px-5 pt-4 pb-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={productSearch[r.id] || ''}
                            onChange={e => setProductSearch(prev => ({ ...prev, [r.id]: e.target.value }))}
                            placeholder="Search products or category..."
                            className="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          {productSearch[r.id] && (
                            <button
                              onClick={() => setProductSearch(prev => ({ ...prev, [r.id]: '' }))}
                              className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="px-5 pb-5">
                        {productsLoading[r.id] ? (
                          <div className="flex items-center gap-2 text-muted-foreground py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading products...</span>
                          </div>
                        ) : getFilteredProducts(r.id).length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            {productSearch[r.id]
                              ? `No products match "${productSearch[r.id]}"`
                              : 'No products in stock.'}
                          </p>
                        ) : (
                          <div className="rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-secondary border-b border-border">
                                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock</th>
                                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price / Unit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getFilteredProducts(r.id).map((p, i) => (
                                  <tr
                                    key={p._id}
                                    className={`border-b border-border last:border-0 hover:bg-secondary/60 transition-colors ${i % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}`}
                                  >
                                    <td className="px-4 py-3 font-medium text-foreground">{p.productName}</td>
                                    <td className="px-4 py-3">
                                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium capitalize">
                                        {p.category || 'General'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-foreground">
                                      {p.quantity} <span className="text-muted-foreground text-xs">{p.unit || 'units'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-primary">
                                      {p.costPerUnit > 0 ? `₹${p.costPerUnit.toFixed(2)}` : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {/* Summary row */}
                            <div className="bg-secondary px-4 py-2 flex justify-between items-center text-xs text-muted-foreground border-t border-border">
                              <span>
                                {getFilteredProducts(r.id).length} product{getFilteredProducts(r.id).length > 1 ? 's' : ''} in stock
                                {productSearch[r.id] && ` matching "${productSearch[r.id]}"`}
                              </span>
                              {(productsMap[r.id] || []).filter(p => p.quantity === 0).length > 0 && (
                                <span>{(productsMap[r.id] || []).filter(p => p.quantity === 0).length} out of stock (hidden)</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NearbyRetailers;