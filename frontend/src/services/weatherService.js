const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

/**
 * Current Weather (CITY BASED)
 */
export const getCurrentWeather = async (city) => {
  const res = await fetch(
    `${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
  );

  if (!res.ok) {
    throw new Error("Current weather failed");
  }

  return res.json();
};

/**
 * 7-Day Forecast (derived from 5-day / 3-hour data)
 */
export const get7DayForecast = async (city) => {
  const res = await fetch(
    `${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`
  );

  if (!res.ok) {
    throw new Error("7-day forecast failed");
  }

  const data = await res.json();

  // Pick one forecast per day (12:00 PM)
  const daily = {};
  data.list.forEach((item) => {
    const [date, time] = item.dt_txt.split(" ");
    if (time === "12:00:00" && !daily[date]) {
      daily[date] = item;
    }
  });

  return Object.values(daily).slice(0, 7);
};
