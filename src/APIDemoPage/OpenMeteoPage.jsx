// src/pages/OpenMeteoPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Calendar
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------- Defaults & Presets ---------- */
const BASE = "https://api.open-meteo.com/v1/forecast";
const DEFAULT_QUERY = { latitude: 51.5074, longitude: -0.1278, name: "London, UK" }; // default location
const PRESETS = [
  { name: "London, UK", latitude: 51.5074, longitude: -0.1278 },
  { name: "New York, USA", latitude: 40.7128, longitude: -74.006 },
  { name: "Tokyo, JP", latitude: 35.6762, longitude: 139.6503 },
  { name: "Sydney, AU", latitude: -33.8688, longitude: 151.2093 },
  { name: "Bengaluru, IN", latitude: 12.9716, longitude: 77.5946 },
];

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

/* small util: build endpoint with fields we want */
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

/* Sparkline SVG generator */
function Sparkline({ data = [], height = 48, strokeWidth = 2 }) {
  if (!data || data.length === 0) return <div style={{ height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = Math.max(120, data.length * 4);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = ((max - v) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  const last = data[data.length - 1];
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
      <polyline fill="none" stroke="currentColor" strokeWidth={strokeWidth} points={points} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.95 }} />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={((max - last) / range) * height} r={3} fill="currentColor" />
    </svg>
  );
}

export default function OpenMeteoPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  /* State */
  const [queryText, setQueryText] = useState(DEFAULT_QUERY.name);
  const [suggestions, setSuggestions] = useState(PRESETS);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [location, setLocation] = useState(DEFAULT_QUERY);
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const suggestTimer = useRef(null);

  /* Suggestion matching (local presets fuzzy match) */
  function onQueryChange(val) {
    setQueryText(val);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      setLoadingSuggest(true);
      // simple fuzzy: filter presets by name match or lat/lon pattern
      const q = val.trim().toLowerCase();
      if (!q) {
        setSuggestions(PRESETS);
      } else {
        const matched = PRESETS.filter(p => p.name.toLowerCase().includes(q) || `${p.latitude},${p.longitude}`.includes(q));
        setSuggestions(matched.length ? matched : PRESETS);
      }
      setLoadingSuggest(false);
    }, 180);
  }

  /* Accept a suggestion */
  function choosePreset(p) {
    setLocation(p);
    setQueryText(p.name);
    setShowSuggest(false);
    fetchWeather(p.latitude, p.longitude, p.name);
  }

  /* Parse freeform lat,lon input: "lat,lon" */
  function tryParseLatLon(text) {
    const m = text.split(",").map(s => s.trim());
    if (m.length === 2 && !isNaN(Number(m[0])) && !isNaN(Number(m[1]))) {
      return { latitude: Number(m[0]), longitude: Number(m[1]), name: `${m[0]}, ${m[1]}` };
    }
    return null;
  }

  /* Main fetch */
  async function fetchWeather(lat = location.latitude, lon = location.longitude, name = location.name) {
    setLoading(true);
    setShowRaw(false);
    try {
      const endpoint = buildEndpoint(lat, lon);
      const res = await fetch(endpoint);
      if (!res.ok) {
        showToast("error", `Weather fetch failed (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setRawResp(json);
      // ensure we set a user-friendly location object
      setLocation({ latitude: lat, longitude: lon, name: name || `${lat},${lon}` });
      showToast("success", `Loaded forecast for ${name || `${lat},${lon}`}`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  }

  /* When pressing enter or clicking search */
  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!queryText || queryText.trim().length === 0) {
      showToast("info", "Type a location or lat,lon (e.g. 51.5,-0.12)");
      return;
    }
    // If matches a preset name exactly, choose it
    const exact = PRESETS.find(p => p.name.toLowerCase() === queryText.trim().toLowerCase());
    if (exact) {
      choosePreset(exact);
      return;
    }
    // Try parse lat,lon
    const parsed = tryParseLatLon(queryText);
    if (parsed) {
      setShowSuggest(false);
      fetchWeather(parsed.latitude, parsed.longitude, parsed.name);
      return;
    }
    // Otherwise fall back to closest preset via fuzzy match (first suggestion)
    const fuzzy = PRESETS.find(p => p.name.toLowerCase().includes(queryText.trim().toLowerCase()));
    if (fuzzy) {
      choosePreset(fuzzy);
      return;
    }
    // As a last resort, prompt user to enter coordinates
    showToast("info", "Enter a preset name (e.g. London) or 'lat,lon' coordinates");
  }

  /* Helpers to analyze response */
  const analysis = useMemo(() => {
    if (!rawResp || !rawResp.hourly) return null;
    const hourly = rawResp.hourly;
    const time = hourly.time || [];
    const temps = hourly.temperature_2m || [];
    const winds = hourly.windspeed_10m || [];
    const precip = hourly.precipitation || [];
    // compute current (first element) and next 24h summary if available
    const nowTemp = temps.length ? temps[0] : null;
    const next24 = temps.slice(0, 24);
    const avg24 = next24.length ? (next24.reduce((a, b) => a + b, 0) / next24.length) : null;
    const max24 = next24.length ? Math.max(...next24) : null;
    const min24 = next24.length ? Math.min(...next24) : null;
    return {
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

  /* mount: load default */
  useEffect(() => {
    fetchWeather(DEFAULT_QUERY.latitude, DEFAULT_QUERY.longitude, DEFAULT_QUERY.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Quick actions */
  function copyJSON() {
    if (!rawResp) return showToast("info", "No data to copy");
    navigator.clipboard.writeText(prettyJSON(rawResp));
    showToast("success", "Copied JSON to clipboard");
  }
  function downloadJSON() {
    if (!rawResp) return showToast("info", "No data to download");
    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");
    const filename = `openmeteo_${location.name.replace(/\s+/g, "_")}.json`;
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* Small formatting helpers */
  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl overflow-hidden mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row  items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Weather — Open-Meteo</h1>
          <p className="mt-1 text-sm opacity-70">Scientific hourly forecast. Enter a preset (e.g. "London") or coordinates (lat,lon).</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("relative flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Type preset (e.g. London) or coordinates (e.g. 51.5,-0.12)"
              value={queryText}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { const p = PRESETS[0]; choosePreset(p); }}>Default</Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>

            <AnimatePresence>
              {showSuggest && suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 4 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={clsx("absolute z-1000 left-0 right-0 mt-80 rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
                >
                  {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
                  {suggestions.map((s, idx) => (
                    <li key={s.name + idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => choosePreset(s)}>
                      <div className="flex items-center gap-3">
                        <MapPin className="opacity-70" />
                        <div className="flex-1">
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs opacity-60">{s.latitude.toFixed(3)}, {s.longitude.toFixed(3)}</div>
                        </div>
                        <div className="text-xs opacity-60">Preset</div>
                      </div>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </form>
        </div>
      </header>

      {/* Layout: Left | Center | Right */}
      <main className="grid grid-cols-1 overflow-hidden lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Location & quick map/meta (col-span 3) */}
        <aside className={clsx("lg:col-span-3 space-y-4 rounded-2xl p-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="text-xs opacity-60">Location</div>
              <div className="text-lg font-semibold leading-tight">{location?.name}</div>
              <div className="text-xs opacity-60 mt-1">{location?.latitude?.toFixed?.(4)}, {location?.longitude?.toFixed?.(4)}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(`${location?.latitude},${location?.longitude}`); showToast("success", "Coordinates copied"); }}><Copy /></Button>
              <Button variant="ghost" onClick={() => window.open(buildEndpoint(location.latitude, location.longitude), "_blank")}><ExternalLink /></Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick Facts</div>
            <div className="grid grid-cols-1 gap-2">
              <div className="p-3 rounded-md border flex items-center gap-3">
                <Thermometer />
                <div>
                  <div className="text-xs opacity-60">Now</div>
                  <div className="font-medium">{analysis?.nowTemp != null ? `${analysis.nowTemp} ${analysis.units.temperature_2m ?? "°C"}` : "—"}</div>
                </div>
              </div>

              <div className="p-3 rounded-md border flex items-center gap-3">
                <Wind />
                <div>
                  <div className="text-xs opacity-60">Wind (next 24h avg)</div>
                  <div className="font-medium">{analysis?.winds?.length ? `${(analysis.winds.slice(0,24).reduce((a,b)=>a+b,0)/Math.max(1, Math.min(24, analysis.winds.length))).toFixed(1)} ${analysis.units.windspeed_10m ?? "km/h"}` : "—"}</div>
                </div>
              </div>

              <div className="p-3 rounded-md border flex items-center gap-3">
                <CloudSnow />
                <div>
                  <div className="text-xs opacity-60">Precip (next 24h total)</div>
                  <div className="font-medium">{analysis?.precip?.length ? `${analysis.precip.slice(0,24).reduce((a,b)=>a+b,0).toFixed(2)} ${analysis.units.precipitation ?? "mm"}` : "—"}</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer / Endpoint</div>
            <div className="text-xs opacity-60 mb-2">Open-Meteo API — no API key required</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(buildEndpoint(location.latitude, location.longitude)); showToast("success", "Endpoint copied"); }}><Copy /> Copy</Button>
              <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download</Button>
              <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> Raw</Button>
            </div>
          </div>
        </aside>

        {/* Center: big article-like details (col-span 6) */}
        <section className={clsx("lg:col-span-6 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Forecast Overview</CardTitle>
                <div className="text-xs opacity-60">{location?.name} • {rawResp?.timezone ?? "—"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => fetchWeather(location.latitude, location.longitude, location.name)}>
                  <Loader2 className={loading ? "animate-spin" : ""} /> Refresh
                </Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> Chart</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !rawResp ? (
                <div className="py-12 text-center text-sm opacity-60">No forecast loaded — try search or default.</div>
              ) : (
                <div className="space-y-4">
                  {/* Headline summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border col-span-1">
                      <div className="text-xs opacity-60">Now</div>
                      <div className="text-3xl font-bold">{analysis?.nowTemp != null ? `${analysis.nowTemp} ${analysis.units.temperature_2m ?? "°C"}` : "—"}</div>
                      <div className="text-sm opacity-60 mt-2">As of {rawResp?.hourly?.time?.[0] ? fmtDate(rawResp.hourly.time[0]) : "—"}</div>
                    </div>

                    <div className="p-4 rounded-xl border col-span-1 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs opacity-60">24-hour summary</div>
                          <div className="text-lg font-semibold">
                            {analysis?.avg24 != null ? `${analysis.avg24.toFixed(1)} ${analysis.units.temperature_2m ?? "°C"} avg` : "—"}
                            {" "} • High {analysis?.max24 != null ? `${analysis.max24.toFixed(1)}` : "—"} • Low {analysis?.min24 != null ? `${analysis.min24.toFixed(1)}` : "—"}
                          </div>
                        </div>
                        <div className="w-48">
                          {/* sparkline */}
                          <div className="text-xs opacity-60 mb-1">Next 48 hours</div>
                          <div className="text-sm">
                            <Sparkline data={analysis?.temps || []} height={48} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Hourly table (large) */}
                  <div>
                    <div className="text-sm font-semibold mb-2">Hourly (first 48 entries)</div>
                    <div className={clsx("rounded-lg border overflow-auto", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")} style={{ maxHeight: 360 }}>
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
                          {analysis?.time?.map((t, i) => (
                            <tr key={t} className="border-t last:border-b">
                              <td className="px-3 py-2 align-top">{fmtDate(t)}</td>
                              <td className="px-3 py-2 align-top font-medium">{analysis.temps?.[i] ?? "—"}</td>
                              <td className="px-3 py-2 align-top">{analysis.winds?.[i] ?? "—"}</td>
                              <td className="px-3 py-2 align-top">{analysis.precip?.[i] ?? "—"}</td>
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

        {/* Right: quick actions & detail cards (col-span 3) */}
        <aside className={clsx("lg:col-span-3 space-y-4 rounded-2xl p-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="text-sm font-semibold">Quick Actions</div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => copyJSON()}><Copy /> Copy JSON</Button>
            <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
            <Button variant="outline" onClick={() => window.open(buildEndpoint(location.latitude, location.longitude), "_blank")}><ExternalLink /> Open Endpoint</Button>
            <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> Toggle Raw</Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Units & Response</div>
            <div className="text-xs opacity-60">Detected units from response</div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <div className="p-3 rounded-md border">
                <div className="text-xs opacity-60">Temperature</div>
                <div className="font-medium">{analysis?.units?.temperature_2m ?? "°C"}</div>
              </div>
              <div className="p-3 rounded-md border">
                <div className="text-xs opacity-60">Wind speed</div>
                <div className="font-medium">{analysis?.units?.windspeed_10m ?? "km/h"}</div>
              </div>
              <div className="p-3 rounded-md border">
                <div className="text-xs opacity-60">Precipitation</div>
                <div className="font-medium">{analysis?.units?.precipitation ?? "mm"}</div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Dialog: Chart (simple reuse of sparkline; placeholder for larger visuals) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{location?.name} — Temperature Chart</DialogTitle>
          </DialogHeader>

          <div style={{ minHeight: "50vh", padding: 24 }}>
            {analysis?.temps?.length ? (
              <div>
                <div className="mb-4 text-sm opacity-70">Temperature (next 48 hours)</div>
                <div className="w-full overflow-auto h-64">
                  <Sparkline data={analysis.temps} height={220} />
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
