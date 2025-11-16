// src/pages/WeatherPage.jsx
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Map as MapIcon,
  Search,
  RefreshCw,
  Copy,
  Download,
  Sun,
  CloudRain,
  Thermometer,
  Wind,
  Eye,
  Star,
  X,
  Menu,
  ExternalLink,
  Droplet,
  Cloud,
  Sunrise,
  Sunset,
  ArrowUp,
  ArrowDown,
  Loader2,
  Calendar,
  DropletIcon,
  Gauge,
 MapPin
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  AreaChart,
  Area
} from "recharts";

import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoints (OpenWeather) ---------- */
const GEO_ENDPOINT = "https://api.openweathermap.org/geo/1.0/direct"; // ?q=&limit=&appid=
const CURRENT_ENDPOINT = "https://api.openweathermap.org/data/2.5/weather"; // ?lat=&lon=&units=metric&appid=
const FORECAST_ENDPOINT = "https://api.openweathermap.org/data/2.5/forecast"; // ?lat=&lon=&units=metric&appid=

/* ---------- Defaults ---------- */
const DEFAULT_CITY = { name: "London", lat: 51.5074, lon: -0.1278 };

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

/* returns OSM embed URL for simple map preview */
function getOSMEmbedUrl(lat, lon, zoom = 8) {
  // use the lightweight map embed route with marker
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.6},${lat - 0.3},${lon + 0.6},${lat + 0.3}&layer=mapnik&marker=${lat},${lon}`;
}

/* small util: convert forecast list (3h step) to hourly chart (next 24h) and daily summary */
function processForecastList(list, timezoneOffset = 0) {
  // hourly: next 24 hours (or up to available)
  const now = Date.now();
  const hourly = list
    .filter((it) => {
      const t = new Date(it.dt * 1000).getTime();
      return t > now && t <= now + 24 * 60 * 60 * 1000;
    })
    .slice(0, 8) // 8 * 3h = 24h
    .map((it) => {
      return {
        dt: it.dt,
        label: new Date((it.dt + timezoneOffset) * 1000).toLocaleTimeString([], { hour: "numeric", hour12: true }),
        temp: Math.round(it.main.temp),
        pop: Math.round((it.pop || 0) * 100),
      };
    });

  // daily: pick forecast entry at 12:00 or average per day
  const daysMap = {};
  list.forEach((it) => {
    const date = new Date(it.dt * 1000).toISOString().slice(0, 10);
    if (!daysMap[date]) daysMap[date] = [];
    daysMap[date].push(it);
  });
  const daily = Object.keys(daysMap)
    .slice(0, 7)
    .map((date) => {
      const arr = daysMap[date];
      // prefer entry at 12:00
      const noon = arr.find((a) => a.dt_txt && a.dt_txt.includes("12:00:00"));
      const pick = noon || arr[Math.floor(arr.length / 2)];
      const temps = arr.map((a) => a.main.temp);
      const min = Math.round(Math.min(...temps));
      const max = Math.round(Math.max(...temps));
      const dayLabel = new Date(date).toLocaleDateString(undefined, { weekday: "short" });
      return { date, name: dayLabel, min, max, day: Math.round(pick.main.temp) };
    });

  return { hourly, daily };
}

/* ---------- Component ---------- */
export default function WeatherPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || "";

  // UI state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentCity, setCurrentCity] = useState(DEFAULT_CITY);
  const [currentWeather, setCurrentWeather] = useState(null); // current weather object
  const [forecastList, setForecastList] = useState([]); // raw forecast.list
  const [rawCurrentResp, setRawCurrentResp] = useState(null);
  const [rawForecastResp, setRawForecastResp] = useState(null);

  const [loadingWeather, setLoadingWeather] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const suggestTimer = useRef(null);
  const suggestAbortRef = useRef(null);

  /* load favorites from localStorage */
const favLoadedRef = useRef(false);
useEffect(() => {
  // block saving until after initial load
  if (!favLoadedRef.current) {
    console.log("⏳ Skipping save — not loaded yet");
    return;
  }

  console.log("💾 Persisting to localStorage:", favorites);
  localStorage.setItem("revolyx-weather-favs", JSON.stringify(favorites));
}, [favorites]);

useEffect(() => {
  try {
    const saved = JSON.parse(localStorage.getItem("revolyx-weather-favs") || "[]");
    console.log("Loaded from localStorage:", saved);
    setFavorites(Array.isArray(saved) ? saved : []);
  } catch {
    setFavorites([]);
  } finally {
    favLoadedRef.current = true; // allow saving now
  }
}, []);






  /* ---------- geolocation on mount (exact location) ---------- */
  useEffect(() => {
    const getPreciseLocation = () => {
      if (!navigator.geolocation) {
        showToast("info", "Geolocation not available — showing default city");
        loadCityByCoords(DEFAULT_CITY.lat, DEFAULT_CITY.lon, DEFAULT_CITY.name);
        setCurrentCity(DEFAULT_CITY);
        return;
      }

      // try quick high-accuracy getCurrentPosition (with fallback)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const label = "Your location";
          setCurrentCity({ name: label, lat, lon });
          loadCityByCoords(lat, lon, label);
        },
        (err) => {
          console.warn("geo error", err);
          showToast("info", "Location permission denied or timed out — showing default city");
          loadCityByCoords(DEFAULT_CITY.lat, DEFAULT_CITY.lon, DEFAULT_CITY.name);
          setCurrentCity(DEFAULT_CITY);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 }
      );
    };

    getPreciseLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- suggestions (debounced) ---------- */
  async function fetchSuggestions(q) {
    if (!API_KEY) {
      setSuggestions([]);
      return;
    }
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (suggestAbortRef.current) {
      suggestAbortRef.current.abort();
    }
    const controller = new AbortController();
    suggestAbortRef.current = controller;

    try {
      setLoadingSuggest(true);
      const url = `${GEO_ENDPOINT}?q=${encodeURIComponent(q)}&limit=6&appid=${API_KEY}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(json || []);
      setLoadingSuggest(false);
    } catch (err) {
      if (err.name !== "AbortError") console.error("suggest err", err);
      setLoadingSuggest(false);
      setSuggestions([]);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      fetchSuggestions(v);
    }, 400);
  }

  /* ---------- Weather fetching ---------- */
  async function loadCityByCoords(lat, lon, label = `${lat},${lon}`) {
    if (!API_KEY) {
      showToast("error", "Missing OpenWeather API key (VITE_OPENWEATHER_API_KEY)");
      return;
    }

    setLoadingWeather(true);
    try {
      // Current
      const curUrl = `${CURRENT_ENDPOINT}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
      const curRes = await fetch(curUrl);
      if (!curRes.ok) {
        if (curRes.status === 401) showToast("error", "OpenWeather API Unauthorized (check API key)");
        else showToast("error", `Current weather fetch failed (${curRes.status})`);
        setLoadingWeather(false);
        return;
      }
      const curJson = await curRes.json();

      // Forecast (5 day / 3h)
      const fcUrl = `${FORECAST_ENDPOINT}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
      const fcRes = await fetch(fcUrl);
      if (!fcRes.ok) {
        showToast("error", `Forecast fetch failed (${fcRes.status})`);
        setLoadingWeather(false);
        return;
      }
      const fcJson = await fcRes.json();

      setCurrentWeather({ label, lat, lon, data: curJson });
      setForecastList(fcJson.list || []);
      setRawCurrentResp(curJson);
      setRawForecastResp(fcJson);
      showToast("success", `Loaded weather for ${label}`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch weather data");
      setCurrentWeather(null);
      setForecastList([]);
    } finally {
      setLoadingWeather(false);
    }
  }

  /* When user selects a suggestion */
  async function chooseSuggestion(it) {
    const label = `${it.name}${it.state ? `, ${it.state}` : ""}${it.country ? `, ${it.country}` : ""}`;
    setQuery(label);
    setShowSuggest(false);
    setCurrentCity({ name: label, lat: it.lat, lon: it.lon });
    await loadCityByCoords(it.lat, it.lon, label);
  }

  /* On search submit */
  async function handleSearchSubmit(e) {
    e.preventDefault();
    if (!query || query.trim().length === 0) return;
    // Try direct geocode first
    try {
      setLoadingSuggest(true);
      const url = `${GEO_ENDPOINT}?q=${encodeURIComponent(query)}&limit=1&appid=${API_KEY}`;
      const res = await fetch(url);
      const arr = await res.json();
      setLoadingSuggest(false);
      if (arr && arr.length > 0) {
        chooseSuggestion(arr[0]);
      } else {
        showToast("info", "No results found for query");
      }
    } catch (err) {
      setLoadingSuggest(false);
      showToast("error", "Failed to search city");
    }
  }

  /* ---------- favorites ---------- */
function saveFavorite() {
  if (!currentCity?.lat || !currentCity?.lon) {
    showToast("info", "No city selected to save");
    return;
  }

  const lat = Number(currentCity.lat).toFixed(4);
  const lon = Number(currentCity.lon).toFixed(4);
  const id = `${currentCity.name}|${lat}|${lon}`;

  setFavorites((prev) => {
    if (prev.some((f) => f.id === id)) {
      showToast("info", "City already in favorites");
      return prev;
    }
    const next = [{ id, name: currentCity.name, lat, lon }, ...prev].slice(0, 30);
    showToast("success", `Saved ${currentCity.name}`);
    return next;
  });
}


function removeFavorite(id) {
  setFavorites(prev => prev.filter(f => f.id !== id));
  showToast("info", "Removed favorite");
}



function chooseFavorite(f) {
  setCurrentCity({
    name: f.name,
    lat: Number(f.lat),
    lon: Number(f.lon),
  });

  loadCityByCoords(Number(f.lat), Number(f.lon), f.name);
}


  /* ---------- derived data for charts ---------- */
  const { hourly: hourlyChart, daily: dailyChart } = useMemo(() => {
    if (!forecastList || forecastList.length === 0) return { hourly: [], daily: [] };
    // forecast API doesn't include timezone offset consistently here; we use currentWeather timezone if available
    const tzOffset = rawForecastResp?.city?.timezone || 0;
    return processForecastList(forecastList, tzOffset);
  }, [forecastList, rawForecastResp]);

  /* ---------- chart small helpers ---------- */
  const hourlyData = hourlyChart; // {label, temp, pop}
  const dailyData = dailyChart; // {name, min, max, day}

  /* ---------- quick actions ---------- */
  function copyEndpointToClipboard() {
    const ep = `${FORECAST_ENDPOINT}?lat=${currentCity.lat}&lon=${currentCity.lon}&units=metric&appid=YOUR_API_KEY`;
    navigator.clipboard.writeText(ep);
    showToast("success", "Endpoint copied");
  }

  function downloadJSON() {
    if (!rawCurrentResp && !rawForecastResp) {
      showToast("info", "No data to download");
      return;
    }
    const blob = new Blob([prettyJSON({ current: rawCurrentResp, forecast: rawForecastResp })], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `weather_${(currentCity.name || "city").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded weather JSON");
  }

  /* ---------- small icon mapping ---------- */
  function iconForWeather(main) {
    if (!main) return <Sun size={18} />;
    const m = main.toLowerCase();
    if (m.includes("rain") || m.includes("drizzle")) return <CloudRain size={20} />;
    if (m.includes("snow")) return <Cloud size={20} />;
    if (m.includes("cloud")) return <Cloud size={20} />;
    return <Sun size={20} />;
  }

  /* ---------- UI ---------- */
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl overflow-hidden mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Revolyx — Weather</h1>
          <p className={clsx("mt-1 text-sm opacity-70")}>Accurate current weather and forecast. Default uses your device location if allowed.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[420px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search city, e.g. Mumbai, New York..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><RefreshCw size={16} /></Button>
          </form>
        </div>
      </header>

      {/* suggestions list */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_210px)] md:right-auto max-w-3xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={`${s.lat}-${s.lon}-${idx}`} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseSuggestion(s)}>
                <div className="flex justify-between">
                  <div className="font-medium">{s.name}{s.state ? `, ${s.state}` : ""}</div>
                  <div className="text-xs opacity-60">{s.country}</div>
                </div>
                <div className="text-xs opacity-60 mt-1">{Number(s.lat).toFixed(3)}, {Number(s.lon).toFixed(3)}</div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout: left sidebar (mini map + favs), center preview/chart, right details */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left sidebar (mini map + favorites + quick actions) */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit  overflow-auto", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Location Preview</div>
              <div className="text-xs opacity-60">{currentCity?.name}</div>
            </div>

            {/* Mini map */}
            <div className="rounded-xl overflow-hidden border">
              {currentCity?.lat ? (
                <iframe title="mini-map" src={getOSMEmbedUrl(currentCity.lat, currentCity.lon, 8)} style={{ width: "100%", height: 200, border: 0 }} />
              ) : (
                <div className="p-6 text-sm opacity-60">No coordinates</div>
              )}
            </div>
          </div>



          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-semibold">Quick Actions</div>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="cursor-pointer" onClick={() => { if (currentCity?.lat) loadCityByCoords(currentCity.lat, currentCity.lon, currentCity.name); }}>
                <RefreshCw /> Refresh
              </Button>
              <Button variant="outline" className="cursor-pointer" onClick={() => { copyEndpointToClipboard(); }}>
                <Copy /> Copy Endpoint
              </Button>
              <Button variant="outline" className="cursor-pointer" onClick={() => { downloadJSON(); }}>
                <Download /> Download JSON
              </Button>
              <Button variant="outline" className="cursor-pointer" onClick={() => setMapOpen(true)}>
                <MapIcon /> Open Big Map
              </Button>
            </div>
          </div>
        </aside>

        {/* Center: main preview and charts */}
        <section className="lg:col-span-6 space-y-4">
          {/* Current weather card */}
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Current Weather</CardTitle>
                <div className="text-xs opacity-60">{currentCity?.name} — {currentWeather ? new Date(currentWeather.data.dt * 1000).toLocaleString() : "—"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" className="cursor-pointer" onClick={() => setShowRaw((s) => !s)}><Eye /> {showRaw ? "Hide" : "Raw"}</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingWeather ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentWeather ? (
                <div className="py-12 text-center text-sm opacity-60">No data — try searching a city or allow location access</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Primary */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center">
                        {iconForWeather(currentWeather.data.weather?.[0]?.main)}
                      </div>
                      <div>
                        <div className="text-4xl font-extrabold">{Math.round(currentWeather.data.main.temp)}°C</div>
                        <div className="text-sm opacity-70">{currentWeather.data.weather?.[0]?.description}</div>
                        <div className="mt-2 text-xs opacity-60">Feels like {Math.round(currentWeather.data.main.feels_like)}°C • {currentWeather.data.name}</div>
                      </div>
                    </div>

                   <div className="mt-4 grid grid-cols-1 gap-2 text-sm">

                    {/* Humidity */}
                    <div className="p-3 rounded-md border flex items-center gap-3">
                        <DropletIcon className="h-4 w-4 opacity-70" />
                        <div>
                        <div className="text-xs opacity-60">Humidity</div>
                        <div className="font-medium">{currentWeather.data.main.humidity}%</div>
                        </div>
                    </div>

                    {/* Wind */}
                    <div className="p-3 rounded-md border flex items-center gap-3">
                        <Wind className="h-4 w-4 opacity-70" />
                        <div>
                        <div className="text-xs opacity-60">Wind</div>
                        <div className="font-medium">
                            {Math.round(currentWeather.data.wind.speed)} m/s
                        </div>
                        </div>
                    </div>

                    {/* Pressure */}
                    <div className="p-3 rounded-md border flex items-center gap-3">
                        <Gauge className="h-4 w-4 opacity-70" />
                        <div>
                        <div className="text-xs opacity-60">Pressure</div>
                        <div className="font-medium">
                            {currentWeather.data.main.pressure} hPa
                        </div>
                        </div>
                    </div>

                    {/* Visibility */}
                    <div className="p-3 rounded-md border flex items-center gap-3">
                        <Eye className="h-4 w-4 opacity-70" />
                        <div>
                        <div className="text-xs opacity-60">Visibility</div>
                        <div className="font-medium">
                            {(currentWeather.data.visibility / 1000).toFixed(1)} km
                        </div>
                        </div>
                    </div>

                    </div>


                    <div className="mt-4 flex flex-col gap-2">
                      <Button className="cursor-pointer" variant="outline" onClick={() => navigator.clipboard.writeText(prettyJSON(currentWeather.data))}><Copy /> Copy</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download</Button>
                    </div>
                  </div>

                  {/* Hourly chart */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold">Hourly (next 24h)</div>
                      <div className="text-xs opacity-60">Temp & Precip %</div>
                    </div>

                    {hourlyData.length > 0 ? (
                      <div style={{ width: "100%", height: 180 }}>
                        <ResponsiveContainer>
                          <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1f2937" : "#e6e6e6"} />
                            <XAxis dataKey="label" stroke={isDark ? "#ddd" : "#666"} />
                            <YAxis stroke={isDark ? "#ddd" : "#666"} />
                              <Tooltip
                                    contentStyle={{
                                        background: isDark ? "#000" : "#fff",
                                        border: "1px solid",
                                        borderColor: isDark ? "#6b7280" : "#ddd",
                                        borderRadius: "8px",
                                    }}
                                    labelStyle={{ color: isDark ? "#93c5fd" : "#2563eb" }}
                                    />
                            <Line type="monotone" dataKey="temp" stroke={isDark ? "#60a5fa" : "#2563eb"} strokeWidth={2} dot />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-sm opacity-60 p-6">Hourly forecast not available</div>
                    )}

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs opacity-70">
                      {hourlyData.slice(0, 3).map((h) => (
                        <div key={h.dt} className="p-2 rounded-md border">
                          <div className="font-medium">{h.label}</div>
                          <div>{h.temp}°C</div>
                          <div className="text-xs">POP {h.pop}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Raw JSON toggle */}
            <AnimatePresence>
              {showRaw && (rawCurrentResp || rawForecastResp) && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 260 }}>
                    {prettyJSON({ current: rawCurrentResp, forecast: rawForecastResp })}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Daily forecast chart */}
          <Card className={clsx("rounded-2xl p-4 border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">5-day Forecast</div>
              <div className="text-xs opacity-60">Daily min / max</div>
            </div>

            {dailyData.length > 0 ? (
              <div style={{ width: "100%", height: 240 }}>
<ResponsiveContainer>
  <LineChart
    data={dailyData}
    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
  >
    <defs>
      <linearGradient id="tempLineGradient" x1="0" y1="0" x2="0" y2="1">
        <stop
          offset="0%"
          stopColor={isDark ? "#60a5fa" : "#2563eb"}
          stopOpacity={0.35}
        />
        <stop
          offset="100%"
          stopColor={isDark ? "#60a5fa" : "#2563eb"}
          stopOpacity={0}
        />
      </linearGradient>
    </defs>

    <CartesianGrid
      strokeDasharray="3 3"
      stroke={isDark ? "#1f2937" : "#e5e7eb"}
    />

    <XAxis
      dataKey="name"
      stroke={isDark ? "#e5e7eb" : "#333"}
      tick={{ fontSize: 12 }}
    />

    <YAxis
      stroke={isDark ? "#e5e7eb" : "#333"}
      tick={{ fontSize: 12 }}
    />

    <Tooltip
      contentStyle={{
        background: isDark ? "#0f0f0f" : "#fff",
        border: "1px solid",
        borderColor: isDark ? "#4b5563" : "#d1d5db",
        borderRadius: "8px",
      }}
      labelStyle={{
        color: isDark ? "#93c5fd" : "#2563eb",
        fontWeight: 600,
      }}
      itemStyle={{
        color: isDark ? "#e5e7eb" : "#111",
        fontSize: 12,
      }}
    />

    {/* Smooth temperature line */}
    <Line
      type="monotone"
      dataKey="day"
      stroke={isDark ? "#93c5fd" : "#2563eb"}
      strokeWidth={2.4}
      dot={{ r: 4 }}
      activeDot={{ r: 6 }}
      fillOpacity={1}
      fill="url(#tempLineGradient)"
    />
  </LineChart>
</ResponsiveContainer>


              </div>
            ) : (
              <div className="text-sm opacity-60 p-6">Daily forecast not available</div>
            )}
          </Card>
        </section>

        {/* Right: additional details and quick forecast blocks */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit overflow-auto", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Details</div>
              <div className="text-xs opacity-60">More data</div>
            </div>

{currentWeather ? (
  <div className="space-y-3">

    {/* Sunrise + Sunset */}
    <div className="grid grid-cols-2 gap-2">
      <div className="p-3 rounded-md border flex items-center gap-3">
        <Sunrise className="w-4 h-4 text-yellow-500" />
        <div>
          <div className="text-xs opacity-60">Sunrise</div>
          <div className="font-medium">
            {new Date(currentWeather.data.sys.sunrise * 1000).toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="p-3 rounded-md border flex items-center gap-3">
        <Sunset className="w-4 h-4 text-orange-500" />
        <div>
          <div className="text-xs opacity-60">Sunset</div>
          <div className="font-medium">
            {new Date(currentWeather.data.sys.sunset * 1000).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>

    {/* Visibility + Clouds */}
    <div className="grid grid-cols-2 gap-2 mt-1">
      <div className="p-3 rounded-md border flex items-center gap-3">
        <Eye className="w-4 h-4 text-blue-500" />
        <div>
          <div className="text-xs opacity-60">Visibility</div>
          <div className="font-medium">
            {(currentWeather.data.visibility / 1000).toFixed(1)} km
          </div>
        </div>
      </div>

      <div className="p-3 rounded-md border flex items-center gap-3">
        <Cloud className="w-4 h-4 text-gray-400" />
        <div>
          <div className="text-xs opacity-60">Clouds</div>
          <div className="font-medium">
            {currentWeather.data.clouds?.all}%
          </div>
        </div>
      </div>
    </div>

    {/* Coordinates */}
    <div className="p-3 rounded-md border flex items-center gap-3 mt-1">
      <MapPin className="w-4 h-4 text-red-500" />
      <div>
        <div className="text-xs opacity-60">Coordinates</div>
        <div className="font-medium text-sm">
          {Number(currentCity.lat).toFixed(4)}, {Number(currentCity.lon).toFixed(4)}
        </div>
      </div>
    </div>
  </div>
) : (
  <div className="text-sm opacity-60">No details</div>
)}

          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick forecast</div>

            <div className="grid grid-cols-2 gap-2">
              {dailyData.slice(0, 4).map((d) => (
                <div key={d.name} className="p-2 rounded-md border text-center">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-sm">{d.day}°</div>
                  <div className="text-xs opacity-60">min {d.min} / max {d.max}</div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint examples and raw JSON for debugging.</div>
            <div className="mt-2 space-y-2">
              <Button className="cursor-pointer" variant="outline" onClick={() => copyEndpointToClipboard()}><Copy /> Copy Endpoint</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => setShowRaw((s) => !s)}><Eye /> Toggle Raw</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Map Dialog (larger view) */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className={clsx("max-w-5xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Map — {currentCity?.name}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh" }}>
            {currentCity?.lat ? (
              <iframe title="big-map" src={getOSMEmbedUrl(currentCity.lat, currentCity.lon, 6)} style={{ width: "100%", height: "100%", border: 0 }} />
            ) : (
              <div className="h-full flex items-center justify-center">No coordinates</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Map powered by OpenStreetMap</div>
            <div className="flex gap-2">
              <Button className="cursor-pointer" variant="ghost" onClick={() => setMapOpen(false)}><X /></Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => { if (currentCity.lat) window.open(`https://www.openstreetmap.org/?mlat=${currentCity.lat}&mlon=${currentCity.lon}#map=10/${currentCity.lat}/${currentCity.lon}`, "_blank"); }}>
                Open in OSM <ExternalLink className="ml-2" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
