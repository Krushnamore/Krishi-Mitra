import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useGeolocation } from '@/hooks/use-geolocation';
import {
  Cloud, Droplets, Wind, Eye, Gauge, ThermometerSun,
  Calendar, TrendingUp, RefreshCw, MapPin, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';

const OWM_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';

interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  visibility: number;
  pressure: number;
  description: string;
  icon: string;
  city: string;
  country: string;
}

interface ForecastDay {
  date: string;
  day: string;
  high: number;
  low: number;
  humidity: number;
  wind: number;
  description: string;
  icon: string;
  rain: number;
}

interface ForecastItem {
  dt_txt: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
  };
  pop?: number;
}

const Weather = () => {
  const geo = useGeolocation();
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<'temperature' | 'humidity' | 'wind'>('temperature');

  const fetchWeather = async (lat: number, lng: number) => {
    if (!OWM_KEY) {
      setError('OpenWeatherMap API key not set. Add VITE_OPENWEATHER_API_KEY to your .env file.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Current weather
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OWM_KEY}&units=metric`
      );
      if (!currentRes.ok) throw new Error('Failed to fetch current weather');
      const currentData = await currentRes.json();

      setCurrent({
        temp: Math.round(currentData.main.temp),
        feels_like: Math.round(currentData.main.feels_like),
        humidity: currentData.main.humidity,
        wind_speed: Math.round(currentData.wind.speed * 3.6),
        visibility: Math.round((currentData.visibility || 0) / 1000),
        pressure: currentData.main.pressure,
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        city: currentData.name,
        country: currentData.sys.country,
      });

      // 5-day forecast
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${OWM_KEY}&units=metric`
      );
      if (!forecastRes.ok) throw new Error('Failed to fetch forecast');
      const forecastData = await forecastRes.json();

      // Group by day — take noon reading or first available
      const dayMap: Record<string, ForecastItem[]> = {};
      forecastData.list.forEach((item: ForecastItem) => {
        const date = item.dt_txt.split(' ')[0];
        if (!dayMap[date]) dayMap[date] = [];
        dayMap[date].push(item);
      });

      const days: ForecastDay[] = Object.entries(dayMap)
        .slice(0, 7)
        .map(([date, items]) => {
          const noon = items.find(i => i.dt_txt.includes('12:00:00')) || items[0];
          const temps = items.map(i => i.main.temp);
          const d = new Date(date);
          return {
            date,
            day: d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
            high: Math.round(Math.max(...temps)),
            low: Math.round(Math.min(...temps)),
            humidity: Math.round(items.reduce((s, i) => s + i.main.humidity, 0) / items.length),
            wind: Math.round(noon.wind.speed * 3.6),
            description: noon.weather[0].description,
            icon: noon.weather[0].icon,
            rain: Math.round(items.reduce((s, i) => s + (i.pop || 0), 0) / items.length * 100),
          };
        });

      setForecast(days);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch weather data');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (geo.lat && geo.lng && !geo.loading) {
      fetchWeather(geo.lat, geo.lng);
    }
  }, [geo.lat, geo.lng, geo.loading]);

  const chartData = forecast.map(d => ({
    day: d.day.split(',')[0],
    High: d.high,
    Low: d.low,
    Humidity: d.humidity,
    Wind: d.wind,
  }));

  const weatherTips = (desc: string, temp: number): string => {
    const d = desc.toLowerCase();
    if (d.includes('rain')) return '🌧️ Rain expected — avoid spraying pesticides today. Good time for transplanting.';
    if (d.includes('clear') && temp > 35) return '☀️ Very hot — water crops early morning or evening. Watch for heat stress.';
    if (d.includes('clear')) return '☀️ Clear skies — ideal day for field work and pesticide application.';
    if (d.includes('cloud')) return '⛅ Cloudy conditions — good for planting seedlings, reduces transplant shock.';
    if (d.includes('storm') || d.includes('thunder')) return '⛈️ Severe weather — secure equipment and avoid field work.';
    if (d.includes('wind')) return '💨 Windy — avoid spraying chemicals as they may drift.';
    if (temp < 10) return '🥶 Cold weather — protect sensitive crops from frost damage.';
    return '🌱 Moderate conditions — good day for general farming activities.';
  };

  return (
    <Layout>
      <div className="bg-secondary min-h-screen">
        {/* Header */}
        <div className="bg-gradient-hero text-primary-foreground py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Cloud className="h-7 w-7" /> Weather Forecast
                </h1>
                <p className="text-primary-foreground/80 text-sm mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {geo.loading ? 'Getting location...' : geo.error ? 'Location unavailable' : (current?.city || geo.city || 'Your location')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => geo.lat && geo.lng && fetchWeather(geo.lat, geo.lng)}
                disabled={loading || geo.loading}
                className="border-white/30 text-white hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* No API key */}
          {!OWM_KEY && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800">
              <p className="font-semibold">Weather API key missing</p>
              <p className="text-sm mt-1">Add <code className="bg-amber-100 px-1 rounded">VITE_OPENWEATHER_API_KEY</code> to your frontend <code>.env</code> file. Get a free key at <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="underline">openweathermap.org</a>.</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Fetching weather data...</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-800">
              <p className="font-semibold">Failed to load weather</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Current Weather */}
          {current && !loading && (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-sky-400 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-5xl font-bold">{current.temp}°C</p>
                    <p className="text-lg capitalize mt-1 opacity-90">{current.description}</p>
                    <p className="text-sm opacity-75 mt-1">Feels like {current.feels_like}°C</p>
                    <p className="text-sm opacity-75 mt-0.5">{current.city}, {current.country}</p>
                  </div>
                  <img
                    src={`https://openweathermap.org/img/wn/${current.icon}@2x.png`}
                    alt={current.description}
                    className="w-20 h-20"
                  />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                  {[
                    { icon: Droplets, label: 'Humidity', value: `${current.humidity}%` },
                    { icon: Wind, label: 'Wind', value: `${current.wind_speed} km/h` },
                    { icon: Eye, label: 'Visibility', value: `${current.visibility} km` },
                    { icon: Gauge, label: 'Pressure', value: `${current.pressure} hPa` },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/20 rounded-xl p-3 flex items-center gap-2">
                      <s.icon className="h-4 w-4 opacity-80 flex-shrink-0" />
                      <div>
                        <p className="text-xs opacity-75">{s.label}</p>
                        <p className="font-semibold text-sm">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Farming tip */}
                <div className="mt-4 bg-white/15 rounded-xl p-3 text-sm">
                  {weatherTips(current.description, current.temp)}
                </div>
              </div>

              {/* 7-Day Forecast Cards */}
              {forecast.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> {forecast.length}-Day Forecast
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
                    {forecast.map((day, i) => (
                      <div key={i} className={`rounded-xl p-3 text-center border transition-colors ${i === 0 ? 'bg-primary/10 border-primary/30' : 'bg-secondary border-border'}`}>
                        <p className="text-xs font-semibold text-muted-foreground">{day.day.split(',')[0]}</p>
                        <p className="text-xs text-muted-foreground">{day.date.slice(5)}</p>
                        <img
                          src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                          alt={day.description}
                          className="w-10 h-10 mx-auto"
                        />
                        <p className="font-bold text-foreground text-sm">{day.high}°</p>
                        <p className="text-xs text-muted-foreground">{day.low}°</p>
                        <div className="mt-1.5 text-xs text-blue-500 flex items-center justify-center gap-0.5">
                          <Droplets className="h-3 w-3" /> {day.rain}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Charts */}
              {forecast.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h2 className="font-bold text-foreground flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" /> Forecast Chart
                    </h2>
                    <div className="flex gap-1">
                      {(['temperature', 'humidity', 'wind'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setActiveChart(t)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                            activeChart === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    {activeChart === 'temperature' ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit="°" />
                        <Tooltip formatter={(v) => `${v}°C`} />
                        <Legend />
                        <Line type="monotone" dataKey="High" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Low" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    ) : activeChart === 'humidity' ? (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit="%" />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Bar dataKey="Humidity" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit=" km/h" />
                        <Tooltip formatter={(v) => `${v} km/h`} />
                        <Bar dataKey="Wind" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              {/* Agricultural Advisory */}
              {forecast.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <ThermometerSun className="h-5 w-5 text-primary" /> Agricultural Advisory
                  </h2>
                  <div className="space-y-3">
                    {forecast.slice(0, 4).map((day, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-secondary rounded-xl">
                        <img
                          src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                          alt={day.description}
                          className="w-8 h-8 flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{day.day}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {weatherTips(day.description, day.high)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Geolocation error */}
          {geo.error && !loading && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800">
              <p className="font-semibold">Location access denied</p>
              <p className="text-sm mt-1">Please allow location access in your browser to see local weather.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Weather;
