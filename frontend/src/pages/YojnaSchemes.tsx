import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useGeolocation } from '@/hooks/use-geolocation';
import { BookOpen, RefreshCw, Loader2, Building2, CheckCircle, MapPin, Search, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Scheme {
  name: string;
  benefit: string;
  howToApply: string;
  eligibility: string;
  ministry: string;
}

const schemeColors = [
  'bg-green-600', 'bg-blue-600', 'bg-orange-500',
  'bg-purple-600', 'bg-teal-600', 'bg-red-600', 'bg-indigo-600',
];

const YojnaSchemes = () => {
  const { user, token } = useAuth();
  const geo = useGeolocation();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filtered, setFiltered] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [search, setSearch] = useState('');

  const fetchSchemes = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/yojna`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          state: 'Maharashtra',
          cropTypes: user?.cropTypes || [],
          farmSize: user?.farmSize || '',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSchemes(data.schemes);
        setFiltered(data.schemes);
        setFetched(true);
      }
    } catch (e) {
      console.error('Yojna fetch failed', e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSchemes(); }, [token]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(schemes); return; }
    const q = search.toLowerCase();
    setFiltered(schemes.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.benefit.toLowerCase().includes(q) ||
      s.ministry.toLowerCase().includes(q) ||
      s.eligibility.toLowerCase().includes(q) ||
      s.howToApply.toLowerCase().includes(q)
    ));
  }, [search, schemes]);

  return (
    <Layout>
      <div className="bg-secondary min-h-screen">
        <div className="bg-gradient-hero text-primary-foreground py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <BookOpen className="h-7 w-7" /> Government Schemes (Yojnas)
                </h1>
                <p className="text-primary-foreground/80 text-sm mt-1">
                  AI-curated schemes for farmers
                  {user?.cropTypes?.length ? ` — ${user.cropTypes.join(', ')}` : ''}
                  {geo.city && <span className="ml-2"><MapPin className="inline h-3.5 w-3.5 mr-1" />Maharashtra</span>}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchSchemes} disabled={loading}
                className="border-white/30 text-white hover:bg-white/20">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Refresh
              </Button>
            </div>

            {/* Search Bar */}
            <div className="mt-5 relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, benefit, ministry..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/15 border border-white/25 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {fetched && search && (
              <p className="text-primary-foreground/70 text-xs mt-2 ml-1">
                {filtered.length} of {schemes.length} schemes match "{search}"
              </p>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {loading && !fetched && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Fetching personalized schemes via AI...</p>
            </div>
          )}

          {!loading && fetched && filtered.length === 0 && search && (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium">No schemes match "{search}"</p>
              <p className="text-muted-foreground text-sm mt-1">Try keywords like "insurance", "credit", or "irrigation"</p>
              <Button onClick={() => setSearch('')} variant="outline" className="mt-4">Clear Search</Button>
            </div>
          )}

          {!loading && !fetched && (
            <div className="text-center py-20">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <Button onClick={fetchSchemes}>Load Schemes</Button>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((scheme, i) => (
                <div key={`${scheme.name}-${i}`} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={`${schemeColors[i % schemeColors.length]} p-4 text-white`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{scheme.name}</h3>
                        <p className="text-sm opacity-90 flex items-center gap-1 mt-1">
                          <Building2 className="h-3.5 w-3.5" /> {scheme.ministry}
                        </p>
                      </div>
                      <CheckCircle className="h-6 w-6 opacity-80 flex-shrink-0 mt-0.5" />
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Benefit</p>
                      <p className="text-sm text-foreground">{scheme.benefit}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Eligibility</p>
                      <p className="text-sm text-foreground">{scheme.eligibility}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">How to Apply</p>
                      <p className="text-sm text-foreground">{scheme.howToApply}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {schemes.length > 0 && (
            <div className="mt-8 bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground">
              <strong className="text-foreground">Note:</strong> AI-generated — verify at{' '}
              <a href="https://pmkisan.gov.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">pmkisan.gov.in</a> or{' '}
              <a href="https://agricoop.nic.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">agricoop.nic.in</a>.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default YojnaSchemes;