import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useGeolocation } from '@/hooks/use-geolocation';
import { Link } from 'react-router-dom';
import {
  Tractor, Cloud, MessageSquare, BookOpen, Store, MapPin,
  Thermometer, Droplets, Wind, Loader2, Leaf, Microscope
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const OWM_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';

const FarmerDashboard = () => {
  const { user, token, updateLocation } = useAuth();
  const geo = useGeolocation();
  const [weather, setWeather] = useState<unknown>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [retailers, setRetailers] = useState<unknown[]>([]);
  const [retailersLoading, setRetailersLoading] = useState(false);

  useEffect(() => {
    if (geo.lat && geo.lng && geo.city && !geo.loading) {
      updateLocation(geo.lat, geo.lng, geo.city);
    }
  }, [geo.lat, geo.lng, geo.city, geo.loading]);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!geo.lat || !geo.lng || !OWM_KEY) return;
      setWeatherLoading(true);
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${geo.lat}&lon=${geo.lng}&appid=${OWM_KEY}&units=metric`
        );
        if (res.ok) setWeather(await res.json());
      } catch (e) { console.error('Weather fetch failed', e); }
      setWeatherLoading(false);
    };
    fetchWeather();
  }, [geo.lat, geo.lng]);

  useEffect(() => {
    const fetchRetailers = async () => {
      if (!token) return;
      setRetailersLoading(true);
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
          setRetailers(data.retailers.slice(0, 3));
        }
      } catch (e) { console.error('Retailers fetch failed', e); }
      setRetailersLoading(false);
    };
    fetchRetailers();
  }, [token, geo.lat, geo.lng]);

  const quickLinks = [
    { label: 'AI Chatbot', desc: 'Ask farming questions', icon: MessageSquare, path: '/farmer/chatbot', color: 'bg-blue-500' },
    { label: 'Crop Diagnosis', desc: 'Detect disease from photo', icon: Microscope, path: '/farmer/crop-diagnosis', color: 'bg-rose-500' },
    { label: 'Govt Schemes', desc: 'Yojna & subsidies', icon: BookOpen, path: '/farmer/yojna', color: 'bg-green-600' },
    { label: 'Nearby Retailers', desc: 'Find agri stores', icon: Store, path: '/farmer/retailers', color: 'bg-orange-500' },
    { label: 'Weather', desc: '5-day forecast', icon: Cloud, path: '/weather', color: 'bg-sky-500' },
  ];

  return (
    <Layout>
      <div className="bg-secondary min-h-screen">
        <div className="bg-gradient-hero text-primary-foreground py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Tractor className="h-8 w-8" /> Farmer Dashboard
                </h1>
                <p className="text-primary-foreground/80 mt-1">
                  Welcome, {user?.name?.split(' ')[0] || 'Farmer'}!
                  {geo.city && (
                    <span className="ml-2 text-sm">
                      <MapPin className="inline h-3.5 w-3.5 mr-1" />{geo.city}
                    </span>
                  )}
                </p>
              </div>
              {user?.cropTypes && user.cropTypes.length > 0 && (
                <div className="hidden md:flex gap-2 flex-wrap justify-end max-w-xs">
                  {user.cropTypes.slice(0, 3).map(c => (
                    <span key={c} className="px-3 py-1 bg-white/20 rounded-full text-sm capitalize">{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Weather Widget */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-sky-400 p-6 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Cloud className="h-6 w-6" /> Current Weather
                {geo.city && <span className="text-sm font-normal opacity-80">— {geo.city}</span>}
              </h2>
              {geo.loading && (
                <p className="text-sm opacity-80 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Getting your location...
                </p>
              )}
              {geo.error && <p className="text-sm opacity-80">Location unavailable: {geo.error}</p>}
              {!OWM_KEY && (
                <p className="text-sm bg-white/20 rounded-lg p-3">
                  Set <code className="bg-white/20 px-1 rounded">VITE_OPENWEATHER_API_KEY</code> in frontend .env to enable live weather.
                </p>
              )}
              {weatherLoading && (
                <div className="flex items-center gap-2 opacity-80">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading weather...
                </div>
              )}
              {weather && !weatherLoading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Thermometer, value: `${Math.round(weather.main.temp)}°C`, label: weather.weather[0].description },
                    { icon: Droplets, value: `${weather.main.humidity}%`, label: 'Humidity' },
                    { icon: Wind, value: `${Math.round(weather.wind.speed * 3.6)} km/h`, label: 'Wind Speed' },
                    { icon: Cloud, value: `${Math.round(weather.main.feels_like)}°C`, label: 'Feels Like' },
                  ].map((w, i) => (
                    <div key={i} className="bg-white/20 rounded-xl p-4 text-center">
                      <w.icon className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-xl font-bold">{w.value}</p>
                      <p className="text-xs opacity-80 capitalize">{w.label}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Link to="/weather">
                  <Button variant="outline" size="sm" className="border-white/40 text-white hover:bg-white/20">
                    View 5-Day Forecast →
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" /> Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {quickLinks.map(q => {
                const Icon = q.icon;
                return (
                  <Link key={q.label} to={q.path}>
                    <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer h-full">
                      <div className={`p-3 rounded-xl ${q.color} text-white w-fit mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-foreground text-sm">{q.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{q.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Nearby Retailers */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" /> Nearby Retailers
            </h2>
            {retailersLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading retailers...
              </div>
            ) : retailers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No retailers found yet. Retailers who register will appear here.
              </p>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {retailers.map(r => (
                  <div key={r.id} className="bg-secondary rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{r.shopName}</p>
                        <p className="text-xs text-muted-foreground">{r.shopAddress || r.city}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link to="/farmer/retailers">
                <Button variant="outline" size="sm">View All Retailers →</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FarmerDashboard;