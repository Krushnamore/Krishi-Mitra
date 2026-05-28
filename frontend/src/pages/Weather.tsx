import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import {
  getCurrentWeather,
  get7DayForecast,
} from '@/services/weatherService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { Cloud, Droplets, Wind, Eye, Gauge, ThermometerSun, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const cities = [
  "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara",
  "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
  "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai", "Nagpur",
  "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani",
  "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg",
  "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
];

const DynamicWeatherPage = () => {
  const { user } = useAuth();
  const [city, setCity] = useState('Pune');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError('');

      // Current weather
      const weatherData = await getCurrentWeather(city);
      setWeather(weatherData);

      // 5-day forecast
      const forecastList = await get7DayForecast(city);
      
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter forecasts to only show future dates
      const futureForecasts = forecastList.filter(item => {
        const itemDate = new Date(item.dt * 1000);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate > today;
      });

      setForecast(futureForecasts.slice(0, 5));
    } catch (err) {
      console.error('Weather API Error:', err);
      if (err.message.includes('API key')) {
        setError('Invalid API key. Please add your OpenWeatherMap API key to the .env file as VITE_OPENWEATHER_API_KEY');
      } else {
        setError('Failed to load weather data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, [city]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-xl text-gray-700">Loading weather data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
            <p className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</p>
            <p className="text-red-500">{error}</p>
            <button 
              onClick={fetchWeatherData}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const chartData = forecast.map((day) => ({
    day: new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    temp: Math.round(day.main.temp),
    humidity: day.main.humidity,
    windSpeed: Math.round(day.wind.speed * 3.6),
  }));

  const getWeatherRecommendation = () => {
    if (!weather) return [];
    
    const temp = weather.main.temp;
    const humidity = weather.main.humidity;
    const recommendations = [];

    if (temp > 35) {
      recommendations.push({ type: 'warning', text: 'High temperature - Ensure adequate irrigation' });
    } else if (temp < 15) {
      recommendations.push({ type: 'info', text: 'Cool weather - Good for winter crops' });
    } else {
      recommendations.push({ type: 'success', text: 'Moderate temperature - Suitable for most crops' });
    }

    if (humidity > 80) {
      recommendations.push({ type: 'warning', text: 'High humidity - Monitor for fungal diseases' });
    } else if (humidity < 40) {
      recommendations.push({ type: 'info', text: 'Low humidity - Increase irrigation frequency' });
    }

    return recommendations;
  };

  return (
    <Layout>
      <div className="bg-secondary min-h-screen">
        {/* Header - Dashboard Style */}
        <div className="bg-gradient-hero text-primary-foreground py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
                  <Cloud className="h-8 w-8" />
                  Weather Insights
                </h1>
                <p className="text-primary-foreground/80 mt-1">
                  Welcome {user?.name?.split(' ')[0] || 'User'}! Real-time weather monitoring and 5-day forecast for agricultural planning
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={fetchWeatherData} 
                  variant="outline" 
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">

          {/* City Selector */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="appearance-none px-8 py-3 pr-12 text-lg font-semibold rounded-2xl bg-card border-2 border-primary shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary cursor-pointer"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                ▼
              </div>
            </div>
          </div>

        {/* Current Weather Card */}
        {weather && (
          <div className="bg-gradient-to-br from-blue-500 to-green-500 rounded-3xl shadow-2xl p-8 mb-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Current Weather</h2>
                <p className="text-xl opacity-90 flex items-center gap-2">
                  <Calendar size={20} />
                  {weather.name}, {weather.sys.country} • {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              <div className="text-center mt-4 md:mt-0">
                <div className="text-7xl font-bold mb-2">
                  {Math.round(weather.main.temp)}°C
                </div>
                <p className="text-xl opacity-90">
                  Feels like {Math.round(weather.main.feels_like)}°C
                </p>
                <p className="text-lg capitalize mt-2 font-medium">
                  {weather.weather[0].description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
                <Droplets className="text-white" size={32} />
                <div>
                  <p className="text-sm opacity-80">Humidity</p>
                  <p className="text-2xl font-bold">{weather.main.humidity}%</p>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
                <Wind className="text-white" size={32} />
                <div>
                  <p className="text-sm opacity-80">Wind Speed</p>
                  <p className="text-2xl font-bold">{Math.round(weather.wind.speed * 3.6)} km/h</p>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
                <Gauge className="text-white" size={32} />
                <div>
                  <p className="text-sm opacity-80">Pressure</p>
                  <p className="text-2xl font-bold">{weather.main.pressure} hPa</p>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
                <Eye className="text-white" size={32} />
                <div>
                  <p className="text-sm opacity-80">Visibility</p>
                  <p className="text-2xl font-bold">{(weather.visibility / 1000).toFixed(1)} km</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5-Day Forecast */}
        <div className="bg-card rounded-3xl shadow-xl border border-border p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-foreground">
            <TrendingUp className="text-primary" />
            5-Day Forecast 
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {forecast.map((day, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 text-center hover:shadow-lg transition-shadow duration-300 border border-green-100"
              >
                <p className="font-bold text-lg mb-2 text-gray-700">
                  {new Date(day.dt * 1000).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>

                <img
                  src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@4x.png`}
                  alt="weather icon"
                  className="mx-auto w-24 h-24"
                />

                <p className="text-3xl font-bold text-gray-800 mb-1">
                  {Math.round(day.main.temp)}°C
                </p>

                <p className="text-sm text-gray-600 capitalize mb-3">
                  {day.weather[0].description}
                </p>

                <div className="flex justify-around text-xs text-gray-600 border-t border-green-200 pt-3">
                  <div>
                    <Droplets size={14} className="inline mb-1" />
                    <p>{day.main.humidity}%</p>
                  </div>
                  <div>
                    <Wind size={14} className="inline mb-1" />
                    <p>{Math.round(day.wind.speed * 3.6)} km/h</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Temperature Trend Chart */}
        <div className="bg-card rounded-3xl shadow-xl border border-border p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Temperature Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '2px solid #10b981', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#10b981"
                strokeWidth={3}
                name="Temperature (°C)"
                dot={{ r: 6, fill: '#10b981' }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Humidity & Wind Chart */}
        <div className="bg-card rounded-3xl shadow-xl border border-border p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Humidity & Wind Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '2px solid #3b82f6', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="humidity" fill="#3b82f6" name="Humidity (%)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="windSpeed" fill="#10b981" name="Wind (km/h)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
                  </div>

          {/* Agricultural Recommendations */}
          <div className="bg-gradient-to-br from-green-500 to-blue-500 rounded-3xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <ThermometerSun size={32} />
              Agricultural Weather Insights
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {getWeatherRecommendation().map((rec, idx) => (
                <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-xl p-5">
                  <p className="font-medium text-lg">{rec.text}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
                <h3 className="font-bold text-xl mb-4">🌱 Farming Tips</h3>
                <ul className="space-y-2">
                  <li>• Monitor soil moisture levels daily</li>
                  <li>• Plan irrigation based on forecast</li>
                  <li>• Check weather before spraying pesticides</li>
                  <li>• Prepare for weather changes in advance</li>
                </ul>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
                <h3 className="font-bold text-xl mb-4">⚠️ Weather Alerts</h3>
                <ul className="space-y-2">
                  <li>• Wind conditions: {weather.wind.speed > 5 ? 'Moderate - Be cautious' : 'Safe for operations'}</li>
                  <li>• Temperature: {weather.main.temp > 35 ? 'Very hot - Ensure hydration' : 'Comfortable'}</li>
                  <li>• Humidity: {weather.main.humidity > 80 ? 'High - Disease risk' : 'Normal levels'}</li>
                  <li>• Visibility: {weather.visibility > 8000 ? 'Excellent' : 'Moderate'}</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default DynamicWeatherPage;