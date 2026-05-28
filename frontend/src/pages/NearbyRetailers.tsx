import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useGeolocation } from '@/hooks/use-geolocation';
import { Store, MapPin, Mail, Phone, Loader2, Search } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const NearbyRetailers = () => {
  const { token } = useAuth();
  const geo = useGeolocation();
  const [retailers, setRetailers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filtered = retailers.filter(r =>
    !search ||
    r.shopName?.toLowerCase().includes(search.toLowerCase()) ||
    r.city?.toLowerCase().includes(search.toLowerCase())
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
              {geo.city && <span className="ml-2"><MapPin className="inline h-3.5 w-3.5 mr-1" />{geo.city}</span>}
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
              placeholder="Search by shop name or city..."
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
                  ? 'No retailers have registered yet. Share the platform with local agri stores!'
                  : 'No retailers match your search.'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(r => (
                <div key={r.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary flex-shrink-0">
                      <Store className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{r.shopName}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {r.shopAddress || r.city || 'Location not set'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground border-t border-border pt-3">
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <a href={`mailto:${r.email}`} className="hover:text-primary truncate">{r.email}</a>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {r.city || 'Unknown location'}
                    </p>
                  </div>
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
