// Import dependencies
const express = require("express");
const morgan = require("morgan");
const axios = require("axios");

const app = express();
const PORT = 3000;

app.use(morgan("dev"));

const API_KEY = "ea35497dd66bac05de13e9c4515c16d1";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

app.get("/", (req, res) => {
  res.send("🌤️ Welcome to Tiny Weather API Server");
});

// 🌤️ Current weather
app.get("/weather/:city", async (req, res) => {
  const city = req.params.city;
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: { q: city, appid: API_KEY, units: "metric" },
    });
    const data = response.data;
    res.json({
      city: data.name,
      temperature: `${data.main.temp} °C`,
      condition: data.weather[0].description,
    });
  } catch {
    res.status(404).json({ error: "City not found or API error" });
  }
});

// 📅 Shortened 5-day forecast (one per day)
app.get("/forecast/:city", async (req, res) => {
  const city = req.params.city;
  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: { q: city, appid: API_KEY, units: "metric" },
    });

    const data = response.data;
    const seenDays = new Set();
    const dailyForecast = [];

    for (const item of data.list) {
      const day = item.dt_txt.split(" ")[0]; // e.g., "2025-10-05"
      if (!seenDays.has(day)) {
        seenDays.add(day);
        dailyForecast.push({
          date: day,
          temperature: `${item.main.temp} °C`,
          condition: item.weather[0].description,
        });
      }
    }

    res.json({
      city: data.city.name,
      forecast: dailyForecast,
    });
  } catch {
    res.status(404).json({ error: "Forecast not available or API error" });
  }
});

// 📍 Coordinates
app.get("/coords/:city", async (req, res) => {
  const city = req.params.city;
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: { q: city, appid: API_KEY },
    });
    const data = response.data;
    res.json({
      city: data.name,
      coordinates: {
        latitude: data.coord.lat,
        longitude: data.coord.lon,
      },
    });
  } catch {
    res.status(404).json({ error: "Coordinates not found or API error" });
  }
});

// 🌎 Combined all (short 5-day)
app.get("/all/:city", async (req, res) => {
  const city = req.params.city;

  try {
    const [weatherRes, forecastRes] = await Promise.all([
      axios.get(`${BASE_URL}/weather`, {
        params: { q: city, appid: API_KEY, units: "metric" },
      }),
      axios.get(`${BASE_URL}/forecast`, {
        params: { q: city, appid: API_KEY, units: "metric" },
      }),
    ]);

    const weather = weatherRes.data;
    const forecastData = forecastRes.data;

    const seenDays = new Set();
    const dailyForecast = [];

    for (const item of forecastData.list) {
      const day = item.dt_txt.split(" ")[0];
      if (!seenDays.has(day)) {
        seenDays.add(day);
        dailyForecast.push({
          date: day,
          temperature: `${item.main.temp} °C`,
          condition: item.weather[0].description,
        });
      }
    }

    res.json({
      city: weather.name,
      coordinates: {
        latitude: weather.coord.lat,
        longitude: weather.coord.lon,
      },
      current_weather: {
        temperature: `${weather.main.temp} °C`,
        condition: weather.weather[0].description,
      },
      forecast: dailyForecast,
    });
  } catch {
    res.status(404).json({ error: "Unable to fetch weather data" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
