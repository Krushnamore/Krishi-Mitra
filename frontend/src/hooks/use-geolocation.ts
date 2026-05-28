import { useState, useEffect } from 'react';

interface GeoLocation {
  lat: number | null;
  lng: number | null;
  city: string;
  loading: boolean;
  error: string | null;
}

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      'Unknown'
    );
  } catch {
    return 'Unknown';
  }
};

export const useGeolocation = () => {
  const [geo, setGeo] = useState<GeoLocation>({
    lat: null, lng: null, city: '', loading: true, error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo(g => ({ ...g, loading: false, error: 'Geolocation not supported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const city = await reverseGeocode(lat, lng);
        setGeo({ lat, lng, city, loading: false, error: null });
      },
      (err) => {
        setGeo(g => ({ ...g, loading: false, error: err.message }));
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return geo;
};
