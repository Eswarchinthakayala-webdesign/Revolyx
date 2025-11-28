// src/pages/OpenMeteoPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  ImageIcon,
  List,
  MapPin,
  CloudSnow,
  Wind,
  Thermometer,
  Calendar,
  Menu,
  Check,
  AlertCircle
} from "lucide-react";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ---------- constants & helpers ---------- */
const BASE = "https://api.open-meteo.com/v1/forecast";
const DEFAULT_QUERY = { latitude: 51.5074, longitude: -0.1278, name: "London, UK" };
const PRESETS = [
  { name: "London, UK", latitude: 51.5074, longitude: -0.1278 },
  { name: "New York, USA", latitude: 40.7128, longitude: -74.006 },
  { name: "Tokyo, JP", latitude: 35.6762, longitude: 139.6503 },
  { name: "Sydney, AU", latitude: -33.8688, longitude: 151.2093 },
  { name: "Bengaluru, IN", latitude: 12.9716, longitude: 77.5946 },
];

function buildEndpoint(lat, lon, hours = 48) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "temperature_2m,windspeed_10m,precipitation",
    timezone: "auto",
    forecast_days: "2",
  });
  return `${BASE}?${params.toString()}`;
}
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

/* Leaflet icon assets (Vite-friendly import) */
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

/* debounce helper (non-react) */
function debounceFn(fn, delay = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/* format date */
function fmtDateShort(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { hour: "numeric", minute: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

/* Memoized ChartPanel to avoid repeated renders */
const ChartPanel = React.memo(function ChartPanel({ data, units }) {
  if (!data || !data.length) return null;
   const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);


  const tooltipFormatter = useCallback((value, name) => {
    // Basic name mapping
    const label = name === "temp" ? `${value} ${units?.temperature_2m ?? "°C"}` : value;
    return [label, name];
  }, [units]);

  return (
    <div style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={7} />
          <YAxis tick={{ fontSize: 11 }} />
           <Tooltip 
                                                 contentStyle={{
                                                  backgroundColor: isDark?"rgba(24,24,27,0.9)":"rgba(255,255,255,0.6)", // dark zinc overlay
                                                  border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                                                  borderRadius: "0.75rem",
                                                  backdropFilter: "blur(8px)",
                                                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                                  
                                                  fontSize: "0.875rem",
                                                  padding: "0.5rem 0.75rem",
                                              }} 
                                              itemStyle={{
                                                 // text color
                                                 
                                                  textTransform: "capitalize",
                                              }}
                                              labelStyle={{
                                                  color:isDark?"#fff":"#000",
                                                  fontWeight: "500",
                                                  marginBottom: "0.25rem",
                                              }}
                                              cursor={{ fill: "rgba(113,113,122,0.2)" }}
                                               />
          <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

/* Main component */
export default function OpenMeteoPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [queryText, setQueryText] = useState(DEFAULT_QUERY.name);
  const [suggestions, setSuggestions] = useState(PRESETS);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [location, setLocation] = useState(DEFAULT_QUERY);
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  const [randomList] = useState(() => [
    "Reykjavík, IS", "Cape Town, ZA", "Vancouver, CA", "Santiago, CL",
    "Moscow, RU", "São Paulo, BR", "Cairo, EG", "Jakarta, ID",
    "Honolulu, US", "Zurich, CH"
  ].map((n, i) => ({ id: i, name: n })));

  const [mapCenter, setMapCenter] = useState([DEFAULT_QUERY.latitude, DEFAULT_QUERY.longitude]);

  // isMounted guard to avoid state update after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  /* Nominatim search - stable callback */
  const nominatimSearch = useCallback(async (q) => {
    if (!q || q.trim().length === 0) {
      if (isMountedRef.current) setSuggestions(PRESETS);
      return;
    }
    if (isMountedRef.current) setLoadingSuggest(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const arr = await res.json();
      const items = arr.map(a => ({
        name: a.display_name,
        latitude: Number(a.lat),
        longitude: Number(a.lon),
        bbox: a.boundingbox
      }));
      if (isMountedRef.current) setSuggestions(items.length ? items : PRESETS);
    } catch (e) {
      console.error("Nominatim search failed", e);
      if (isMountedRef.current) setSuggestions(PRESETS);
    } finally {
      if (isMountedRef.current) setLoadingSuggest(false);
    }
  }, []);

  // create a debounced version only once
  const debouncedRef = useRef(null);
  useEffect(() => {
    debouncedRef.current = debounceFn((q) => nominatimSearch(q), 300);
    return () => {
      debouncedRef.current = null;
    };
  }, [nominatimSearch]);

  /* onQueryChange uses debounced ref */
  const onQueryChange = useCallback((val) => {
    setQueryText(val);
    setShowSuggest(true);
    if (debouncedRef.current) {
      setLoadingSuggest(true);
      debouncedRef.current(val);
    }
  }, []);

  /* parse lat,lon */
  const tryParseLatLon = useCallback((text) => {
    const m = text.split(",").map(s => s.trim());
    if (m.length === 2 && !isNaN(Number(m[0])) && !isNaN(Number(m[1]))) {
      return { latitude: Number(m[0]), longitude: Number(m[1]), name: `${m[0]}, ${m[1]}` };
    }
    return null;
  }, []);

  /* fetch weather - stable with useCallback */
  const fetchWeather = useCallback(async (lat = location.latitude, lon = location.longitude, name = location.name) => {
    if (lat == null || lon == null) return;
    if (isMountedRef.current) {
      setLoading(true);
      setShowRaw(false);
    }
    try {
      const endpoint = buildEndpoint(lat, lon);
      const res = await fetch(endpoint);
      if (!res.ok) {
        showToast("error", `Weather fetch failed (${res.status})`);
        if (isMountedRef.current) setLoading(false);
        return;
      }
      const json = await res.json();
      if (isMountedRef.current) {
        setRawResp(json);
        setLocation({ latitude: lat, longitude: lon, name: name || `${lat},${lon}` });
        setMapCenter([lat, lon]);
        showToast("success", `Loaded forecast for ${name || `${lat},${lon}`}`);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch weather");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [location.latitude, location.longitude, location.name]);

  /* choose preset */
  const choosePreset = useCallback((p) => {
    if (!p) return;
    setLocation(p);
    setQueryText(p.name);
    setShowSuggest(false);
    setMapCenter([p.latitude, p.longitude]);
    // call fetchWeather using stable callback
    fetchWeather(p.latitude, p.longitude, p.name);
  }, [fetchWeather]);

  /* handle submit */
  const handleSearchSubmit = useCallback((e) => {
    e?.preventDefault?.();
    if (!queryText || queryText.trim().length === 0) {
      showToast("info", "Type a location or lat,lon (e.g. 51.5,-0.12)");
      return;
    }
    const exact = PRESETS.find(p => p.name.toLowerCase() === queryText.trim().toLowerCase());
    if (exact) {
      choosePreset(exact);
      return;
    }
    const parsed = tryParseLatLon(queryText);
    if (parsed) {
      setShowSuggest(false);
      fetchWeather(parsed.latitude, parsed.longitude, parsed.name);
      return;
    }
    // if suggestions exist, pick first
    if (suggestions && suggestions.length > 0) {
      choosePreset(suggestions[0]);
      return;
    }
    showToast("info", "No matching location — try a city name or coordinates (lat,lon).");
  }, [queryText, choosePreset, tryParseLatLon, fetchWeather, suggestions]);

  /* analysis memo (same as before) */
  const analysis = useMemo(() => {
    if (!rawResp || !rawResp.hourly) return null;
    const hourly = rawResp.hourly;
    const time = hourly.time || [];
    const temps = hourly.temperature_2m || [];
    const winds = hourly.windspeed_10m || [];
    const precip = hourly.precipitation || [];
    const data = time.map((t, i) => ({
      time: fmtDateShort(t),
      iso: t,
      temp: temps[i],
      wind: winds[i],
      precip: precip[i],
    })).slice(0, 48);
    const nowTemp = temps.length ? temps[0] : null;
    const next24 = temps.slice(0, 24);
    const avg24 = next24.length ? (next24.reduce((a, b) => a + b, 0) / next24.length) : null;
    const max24 = next24.length ? Math.max(...next24) : null;
    const min24 = next24.length ? Math.min(...next24) : null;
    return {
      data,
      time,
      temps,
      winds,
      precip,
      nowTemp,
      avg24,
      max24,
      min24,
      units: (rawResp.hourly_units || {}),
    };
  }, [rawResp]);

  /* initial load */
  useEffect(() => {
    fetchWeather(DEFAULT_QUERY.latitude, DEFAULT_QUERY.longitude, DEFAULT_QUERY.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* copy + download */
  const copyJSON = useCallback(() => {
    if (!rawResp) return showToast("info", "No data to copy");
    navigator.clipboard.writeText(prettyJSON(rawResp));
    setCopied(true);
    showToast("success", "Copied JSON to clipboard");
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2500);
  }, [rawResp]);

  const downloadJSON = useCallback(() => {
    if (!rawResp) return showToast("info", "No data to download");
    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");
    const filename = `openmeteo_${(location.name || "location").replace(/\s+/g, "_")}.json`;
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }, [rawResp, location.name]);

  /* when switching location programmatically ensure map recenter and marker move */
  useEffect(() => {
    // mapCenter state already updates on fetchWeather/choosePreset
    // no setState here — prevents loops
  }, [mapCenter]);

  /* helper to load suggestion from a quick pick */
  const pickQuick = useCallback(async (name) => {
    setMobileSheetOpen(false);
    setShowSuggest(true);
    setQueryText(name);
    // trigger a nominatim search and pick first result
    await nominatimSearch(name);
    if (suggestions && suggestions.length) choosePreset(suggestions[0]);
  }, [nominatimSearch, choosePreset, suggestions]);

  /* UI render */
  return (
    <div className={clsx("min-h-screen z-999 p-4 md:p-6 pb-10 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="p-2 md:hidden" onClick={() => setMobileSheetOpen(true)}><Menu /></Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Weather · Open-Meteo</h1>
            <div className="text-xs opacity-60">Scientific hourly forecast • worldwide</div>
          </div>
        </div>

        {/* search */}
        <form onSubmit={handleSearchSubmit} className={clsx("relative flex items-center gap-2 w-full max-w-2xl md:max-w-xl rounded-md px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
          <Search className="opacity-70" />
          <Input
            placeholder="Search location (city) or coordinates (lat,lon)"
            value={queryText}
            onChange={(e) => onQueryChange(e.target.value)}
            className="border-0 shadow-none bg-transparent outline-none"
            onFocus={() => setShowSuggest(true)}
          />
          <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>

          <AnimatePresence>
            {showSuggest && suggestions?.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 6 }}
                exit={{ opacity: 0, y: -6 }}
                className={clsx("absolute z-999 left-0 right-0 top-full mt-2 rounded-xl overflow-hidden shadow-xl ", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
              >
                {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
                <ScrollArea className="overflow-y-auto" style={{ maxHeight: 260 }}>
                  {suggestions.map((s, idx) => (
                    <li key={(s.name ?? "") + idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer" onClick={() => choosePreset(s)}>
                      <div className="flex items-center gap-3">
                        <MapPin className="opacity-70" color="#6b7280" />
                        <div className="flex-1">
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs opacity-60">{s.latitude?.toFixed?.(3) ?? "—"}, {s.longitude?.toFixed?.(3) ?? "—"}</div>
                        </div>
                        <div className="text-xs opacity-60">Select</div>
                      </div>
                    </li>
                  ))}
                </ScrollArea>
              </motion.ul>
            )}
          </AnimatePresence>
        </form>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Quick locations</div>
            <div className="text-xs opacity-60">10 picks</div>
          </div>

          <ScrollArea className="overflow-y-auto" style={{ maxHeight: 420 }}>
            <div className="grid gap-2">
              {randomList.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-md border flex items-center justify-between cursor-pointer hover:shadow-sm" onClick={() => {
                  // nominatimSearch then pick first suggestion if available
                  nominatimSearch(r.name).then(() => {
                    if (suggestions && suggestions.length) choosePreset(suggestions[0]);
                  });
                }}>
                  <div className="flex items-center gap-3">
                    <MapPin color="#0ea5a4" />
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs opacity-60">Tap to load</div>
                    </div>
                  </div>
                  <div className="text-xs opacity-60">{i + 1}</div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          <Separator className="my-3" />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => fetchWeather(location.latitude, location.longitude, location.name)}>
              <Loader2 className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
            <Button variant="ghost" className="px-2 cursor-pointer" onClick={() => setShowRaw(s => !s)}><List /></Button>
          </div>
        </aside>

        {/* Center */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-3">
                  <Thermometer color="#ef4444" /> Forecast Overview
                </CardTitle>
                <div className="text-xs opacity-60">{location?.name} • {rawResp?.timezone ?? "—"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => fetchWeather(location.latitude, location.longitude, location.name)}>
                  <Loader2 className={loading ? "animate-spin" : ""} /> Refresh
                </Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> Chart</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setMapDialogOpen(true)}><MapPin /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !rawResp ? (
                <div className="py-12 text-center text-sm opacity-60">No forecast loaded — try search or choose a location.</div>
              ) : (
                <div className="space-y-4">
                  {/* Top summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs opacity-60">Now</div>
                        <div className="text-xs opacity-60">{rawResp?.hourly?.time?.[0] ? fmtDateShort(rawResp.hourly.time[0]) : "—"}</div>
                      </div>
                      <div className="text-3xl font-bold">{analysis?.nowTemp != null ? `${analysis.nowTemp} ${analysis.units.temperature_2m ?? "°C"}` : "—"}</div>
                      <div className="text-sm opacity-60">Feels like: <span className="font-medium">{analysis?.nowTemp != null ? `${Math.round(analysis.nowTemp)}°` : "—"}</span></div>
                    </div>

                    <div className="p-4 rounded-xl border md:col-span-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs opacity-60">24-hour summary</div>
                          <div className="text-lg font-semibold">
                            {analysis?.avg24 != null ? `${analysis.avg24.toFixed(1)} ${analysis.units.temperature_2m ?? "°C"} avg` : "—"}
                            {" "} • High {analysis?.max24 != null ? `${analysis.max24.toFixed(1)}` : "—"} • Low {analysis?.min24 != null ? `${analysis.min24.toFixed(1)}` : "—"}
                          </div>
                        </div>
                        <div className="w-48">
                          <div className="text-xs opacity-60 mb-1">Next 48 hours</div>
                          <div className="h-16">
                            {analysis?.data && analysis.data.length > 0 && (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analysis.data}>
                                  <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} />
                                 <Tooltip 
                                                 contentStyle={{
                                                  backgroundColor: isDark?"rgba(24,24,27,0.9)":"rgba(255,255,255,0.6)", // dark zinc overlay
                                                  border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                                                  borderRadius: "0.75rem",
                                                  backdropFilter: "blur(8px)",
                                                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                                  
                                                  fontSize: "0.875rem",
                                                  padding: "0.5rem 0.75rem",
                                              }} 
                                              itemStyle={{
                                                 // text color
                                                 
                                                  textTransform: "capitalize",
                                              }}
                                              labelStyle={{
                                                  color:isDark?"#fff":"#000",
                                                  fontWeight: "500",
                                                  marginBottom: "0.25rem",
                                              }}
                                              cursor={{ fill: "rgba(113,113,122,0.2)" }}
                                               />
                                </LineChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Full chart (memoized) */}
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold flex items-center gap-2"><Thermometer color="#ef4444" /> Temperature (48h)</div>
                      <div className="text-xs opacity-60">Units: {analysis?.units?.temperature_2m ?? "°C"}</div>
                    </div>

                    {/* ChartPanel ensures ResponsiveContainer always has non-zero height */}
                    <ChartPanel data={analysis?.data} units={analysis?.units} />
                  </div>

                  <Separator />

                  {/* hourly table */}
                  <div>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Calendar /> Hourly (first 48)</div>
                    <div className={clsx("rounded-lg border overflow-auto", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")} style={{ maxHeight: 300 }}>
                      <table className="min-w-full text-sm">
                        <thead className="sticky top-0">
                          <tr className="text-left bg-white dark:bg-black">
                            <th className="px-3 py-2 text-xs opacity-60">Time</th>
                            <th className="px-3 py-2 text-xs opacity-60">Temp ({analysis?.units?.temperature_2m ?? "°C"})</th>
                            <th className="px-3 py-2 text-xs opacity-60">Wind ({analysis?.units?.windspeed_10m ?? "km/h"})</th>
                            <th className="px-3 py-2 text-xs opacity-60">Precip ({analysis?.units?.precipitation ?? "mm"})</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis?.data?.map((row) => (
                            <tr key={row.iso} className="border-t last:border-b hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                              <td className="px-3 py-2 align-top">{row.time}</td>
                              <td className="px-3 py-2 align-top font-medium">{row.temp ?? "—"}</td>
                              <td className="px-3 py-2 align-top">{row.wind ?? "—"}</td>
                              <td className="px-3 py-2 align-top">{row.precip ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: map & actions */}
        <aside className={clsx("lg:col-span-3 space-y-4 rounded-2xl p-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Map & Actions</div>
            <div className="text-xs opacity-60">{location?.latitude?.toFixed?.(3)}, {location?.longitude?.toFixed?.(3)}</div>
          </div>

          <div className=" rounded-lg overflow-hidden border" style={{ height: 260 }}>
            <MapContainer  center={mapCenter} key={mapCenter.join(",")} zoom={10} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='© OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={mapCenter}>
                <Popup>
                  {location?.name} <br /> {location?.latitude?.toFixed?.(4)}, {location?.longitude?.toFixed?.(4)}
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(buildEndpoint(location.latitude, location.longitude)); showToast("success", "Endpoint copied"); }}>
              <Copy /> Copy Endpoint
            </Button>

            <Button variant="outline" onClick={() => downloadJSON()}>
              <Download /> Download JSON
            </Button>

            <Button variant="ghost" onClick={() => setShowRaw(s => !s)}>
              <List /> Toggle Raw
            </Button>

            <Button variant="primary" onClick={() => copyJSON()} className="flex items-center justify-center gap-2 cursor-pointer">
              {copied ? <Check className="animate-bounce" /> : <Copy />} {copied ? "Copied" : "Copy JSON"}
            </Button>
          </div>

          <Separator />

          <div>
            <div className="text-xs opacity-60 mb-2">Units detected</div>
            <div className="grid grid-cols-1 gap-2">
              <div className="p-3 rounded-md border flex items-center gap-3">
                <Thermometer color="#ef4444" />
                <div>
                  <div className="text-xs opacity-60">Temperature</div>
                  <div className="font-medium">{analysis?.units?.temperature_2m ?? "°C"}</div>
                </div>
              </div>
              <div className="p-3 rounded-md border flex items-center gap-3">
                <Wind color="#0ea5a4" />
                <div>
                  <div className="text-xs opacity-60">Wind</div>
                  <div className="font-medium">{analysis?.units?.windspeed_10m ?? "km/h"}</div>
                </div>
              </div>
              <div className="p-3 rounded-md border flex items-center gap-3">
                <CloudSnow color="#60a5fa" />
                <div>
                  <div className="text-xs opacity-60">Precip</div>
                  <div className="font-medium">{analysis?.units?.precipitation ?? "mm"}</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile sheet */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="left" className="w-[80%]">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Quick locations</div>
              <Button variant="ghost" onClick={() => setMobileSheetOpen(false)}>Close</Button>
            </div>
            <ScrollArea className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
              <div className="grid gap-2">
                {randomList.map((r) => (
                  <div key={r.id} className="p-3 rounded-md border flex items-center justify-between cursor-pointer hover:shadow-sm" onClick={() => pickQuick(r.name)}>
                    <div className="flex items-center gap-3">
                      <MapPin color="#0ea5a4" />
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs opacity-60">Tap to load</div>
                      </div>
                    </div>
                    <div className="text-xs opacity-60">Pick</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Map dialog (large view) */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{location?.name} — Map</DialogTitle>
          </DialogHeader>

          <div style={{ minHeight: "60vh", padding: 0 }}>
            <div style={{ height: "60vh" }}>
              <MapContainer center={mapCenter} key={`map-dialog-${mapCenter.join(",")}`} zoom={10} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution='© OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={mapCenter}>
                  <Popup>{location?.name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Street map (OpenStreetMap)</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMapDialogOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=12/${location.latitude}/${location.longitude}`, "_blank")}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chart dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{location?.name} — Temperature Chart</DialogTitle>
          </DialogHeader>

          <div style={{ minHeight: "50vh", padding: 24 }}>
            {analysis?.data?.length ? (
              <div>
                <div className="mb-4 text-sm opacity-70">Temperature (next 48 hours)</div>
                <div style={{ height: 420 }}>
                  <ChartPanel data={analysis.data} units={analysis.units} />
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm opacity-60">No chart data</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Sourced from Open-Meteo</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => window.open(buildEndpoint(location.latitude, location.longitude), "_blank")}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
