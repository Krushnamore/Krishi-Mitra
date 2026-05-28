import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useGeolocation } from '@/hooks/use-geolocation';
import {
  Store, MapPin, Mail, Phone, Loader2, Search,
  ChevronDown, ChevronUp, Package, Tag
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
  products?: RetailerProduct[];
  productsLoading?: boolean;
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
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchRetailers();
  }, [token, geo.lat, geo.lng]);

  // Fetch products for a retailer when expanded
  const toggleExpand = async (retailerId: string) => {
    if (expandedId === retailerId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(retailerId);

    // Already loaded
    if (productsMap[retailerId]) return;

    setProductsLoading(prev => ({ ...prev, [retailerId]: true }));
    try {
      const res = await fetch(`${API_BASE}/ai/retailer-products/${retailerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProductsMap(prev => ({ ...prev, [retailerId]: data.products }));
      } else {
        setProductsMap(prev => ({ ...prev, [retailerId]: [] }));
      }
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

  return (
    <Layout>
      <div className="bg-secondary min-h-screen">
        <div className="bg-gradient-hero text-primary-foreground py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Store className="h-7 w-7" /> Nearby Agri Retailers
            </h1>
            <p className="text-primary-foreground/80 text-sm mt-1">
              Find agricultural input stores near you
              {geo.city && (
                <span className="ml-2">
                  <MapPin className="inline h-3.5 w-3.5 mr-1" />{geo.city}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by shop name, city, or owner..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {loading ? (
            <div className="flex items-center gap-2 justify-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" /> Loading retailers...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {retailers.length === 0
                  ? 'No retailers have registered yet.'
                  : 'No retailers match your search.'}
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
                        {/* Icon */}
                        <div className="p-3 bg-primary/10 rounded-xl text-primary flex-shrink-0">
                          <Store className="h-6 w-6" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-base">{r.shopName}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">Owner: {r.name}</p>

                          {/* Contact Details */}
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                            <a
                              href={`mailto:${r.email}`}
                              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                            >
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                              {r.email}
                            </a>
                            {r.phone && (
                              <a
                                href={`tel:${r.phone}`}
                                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                              >
                                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                {r.phone}
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
                          : <ChevronDown className="h-4 w-4" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Products Dropdown */}
                  {expandedId === r.id && (
                    <div className="border-t border-border bg-secondary/40 px-5 py-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" /> Available Products
                      </p>

                      {productsLoading[r.id] ? (
                        <div className="flex items-center gap-2 text-muted-foreground py-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Loading products...</span>
                        </div>
                      ) : !productsMap[r.id] || productsMap[r.id].length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          No products listed yet.
                        </p>
                      ) : (
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {productsMap[r.id]
                            .filter(p => p.quantity > 0)
                            .map(p => (
                              <div
                                key={p._id}
                                className="bg-card rounded-xl border border-border p-3 flex items-start gap-2.5"
                              >
                                <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                                  <Tag className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {p.productName}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {p.quantity} {p.unit || 'units'} available
                                  </p>
                                  {p.costPerUnit > 0 && (
                                    <p className="text-xs font-medium text-primary mt-0.5">
                                      ₹{p.costPerUnit.toFixed(2)} / {p.unit || 'unit'}
                                    </p>
                                  )}
                                  {p.category && (
                                    <span className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">
                                      {p.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          {productsMap[r.id].filter(p => p.quantity === 0).length > 0 && (
                            <p className="text-xs text-muted-foreground col-span-full mt-1">
                              + {productsMap[r.id].filter(p => p.quantity === 0).length} out-of-stock products not shown
                            </p>
                          )}
                        </div>
                      )}
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
