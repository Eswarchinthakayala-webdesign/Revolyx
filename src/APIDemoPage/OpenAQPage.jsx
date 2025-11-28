// src/pages/OpenAQPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper"; // your toast helper

// shadcn UI components (assumed available)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectItem, SelectValue, SelectTrigger, SelectContent } from "@/components/ui/select";

// icons
import {
  Menu,
  Search,
  MapPin,
  BarChart2,
  RefreshCcw,
  ClipboardCopy,
  Check,
  Loader2,
  Copy,
  Info,
  Sparkles
} from "lucide-react";

// Recharts
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line
} from "recharts";

// Leaflet map
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// fix leaflet icons for vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

// -------------- CONFIG --------------
const API_BASE = "/openaq"; // change to '/openaq' if you proxy
const API_KEY = "d7b06181f421955b116b8a260ab9ea279e46f8295dcab17494f1f099e33e02bc";
const LOCATIONS_PAGE_LIMIT = 50; // dropdown count

// -------------- HELPERS --------------
const prettyJSON = (o) => {
  try { return JSON.stringify(o, null, 2); }
  catch { return String(o); }
};
const isoLabel = (iso) => {
  try { return iso ? new Date(iso).toLocaleString() : "—"; }
  catch { return iso || "—"; }
};
const safeNum = (v) => {
  const n = (typeof v === "number") ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

function defaultHeaders() {
  return { Accept: "application/json", "X-API-Key": API_KEY };
}

// Robustly extract results array from different response shapes
function getResultsArray(json) {
  if (!json) return [];
  if (Array.isArray(json.results)) return json.results;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json)) return json;
  return [];
}

// Transform many endpoint shapes into chart-friendly { x, y } series depending on keys
function normalizeChartPoints(results) {
  // results: array of objects that may contain
  // - datetime.utc / datetime.local
  // - date.utc / date.local
  // - value (number)
  // - month / year / day / hour / dayOfWeek
  // - aggregate fields like avg, mean, count, value
  if (!Array.isArray(results)) return [];

  // If result items have 'value' and 'datetime' fields -> time series
  const pts = results.map((r) => {
    // prefer utc fields for sorting
    const iso = r.datetime?.utc || r.datetime?.local || r.date?.utc || r.date?.local || r.date || r.datetime || null;
    const x = iso ? iso : (r.month ? String(r.month) : (r.year ? String(r.year) : (r.day ? String(r.day) : (r.hour ? String(r.hour) : (r.dayOfWeek ? String(r.dayOfWeek) : null)))));
    const y = (r.value != null ? safeNum(r.value) : (r.avg != null ? safeNum(r.avg) : (r.mean != null ? safeNum(r.mean) : (r.count != null ? safeNum(r.count) : null))));
    return x != null && y != null ? { x, y, raw: r } : null;
  }).filter(Boolean);

  // If x are ISO strings, convert to local labels and sort by date
  const isoLike = pts.every(p => {
    // crude test: contains 'T' or ends with 'Z'
    return typeof p.x === "string" && (p.x.includes("T") || p.x.endsWith("Z"));
  });

  if (isoLike) {
    return pts
      .map(p => ({ ...p, xLabel: isoLabel(p.x), xSort: new Date(p.x).toISOString() }))
      .sort((a, b) => new Date(a.xSort) - new Date(b.xSort))
      .map(p => ({ x: p.xLabel, y: p.y, raw: p.raw }));
  }

  // For month/year/day/hours etc, try to provide a readable x label
  return pts.map(p => ({ x: String(p.x), y: p.y, raw: p.raw }));
}

// -------------- MAIN COMPONENT --------------
export default function OpenAQPage() {
  // theme
  const [themeIsDark, setThemeIsDark] = useState(false);
  useEffect(() => {
    const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setThemeIsDark(prefersDark);
  }, []);

  // data
  const [locationsList, setLocationsList] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  const [locationDetail, setLocationDetail] = useState(null);
  const [countryDetail, setCountryDetail] = useState(null);

  const [sensorsList, setSensorsList] = useState([]); // from location.sensors
  const [sensorsLoading, setSensorsLoading] = useState(false);

  const [selectedSensorId, setSelectedSensorId] = useState(null);
  const [sensorDetail, setSensorDetail] = useState(null);

  // measurements/raw
  const [rawResp, setRawResp] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [copying, setCopying] = useState(false);
  const copyTimer = useRef(null);

  // charts - per tab endpoints
  const [activeTab, setActiveTab] = useState("measurements"); // measurements | monthly | yearly | monthofyear | dayofweek
  const [chartDataLeft, setChartDataLeft] = useState(null); // primary chart (measurements / measurements/monthly / etc)
  const [chartDataRight, setChartDataRight] = useState(null); // auxiliary chart (hours/days)
  const [chartsLoading, setChartsLoading] = useState(false);

  // UI
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // initial: load first page of locations
    loadLocationsList();
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  // ---------- API helper ----------
  async function apiFetch(path) {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    const res = await fetch(url, { headers: defaultHeaders() });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const err = new Error(`API error ${res.status}: ${txt}`);
      err.status = res.status;
      throw err;
    }
    const json = await res.json();
    setRawResp(json);
    return json;
  }

  // ---------- Load locations dropdown ----------
  async function loadLocationsList() {
    setLocationsLoading(true);
    try {
      const q = new URLSearchParams();
      q.set("page", "1");
      q.set("limit", String(LOCATIONS_PAGE_LIMIT));
      const json = await apiFetch(`/locations?${q.toString()}`);
      const arr = getResultsArray(json);
      // normalize display label: prefer name, locality or city
      const normalized = arr.map(l => ({
        id: l.id,
        label: l.name || l.location || (l.locality || l.city) || `Location ${l.id}`,
        raw: l
      }));
      setLocationsList(normalized);
      if (normalized.length > 0 && !selectedLocationId) {
        // default select first
        const firstId = normalized[0].id;
        setSelectedLocationId(firstId);
        await loadLocationDetail(firstId);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load locations");
    } finally {
      setLocationsLoading(false);
    }
  }

  // ---------- Load location detail and sensors ----------
  async function loadLocationDetail(locationId) {
    if (!locationId) return;
    setLoading(true);
    setLocationDetail(null);
    setSensorsList([]);
    setCountryDetail(null);
    setSelectedSensorId(null);
    setSensorDetail(null);
    setChartDataLeft(null);
    setChartDataRight(null);
    try {
      const json = await apiFetch(`/locations/${locationId}`);
      const arr = getResultsArray(json);
      const loc = arr[0] || json.data || json;
      if (!loc) throw new Error("No location data");

      // country handling: may be object
      const countryObj = loc.country;
      const countryId = (countryObj && countryObj.id) ? countryObj.id : (countryObj && countryObj.code ? countryObj.code : null);

      // attach normalized strings to avoid object rendering errors
      const normalized = {
        ...loc,
        countryName: (typeof loc.country === "object" ? (loc.country.name || loc.country.code) : loc.country) || "—",
        cityName: (typeof loc.city === "object" ? (loc.city.name || loc.city) : loc.city) || (loc.locality || "—")
      };

      setLocationDetail(normalized);

      // load country details if id present and numeric
      if (countryObj && countryObj.id) {
        try {
          const cjson = await apiFetch(`/countries/${countryObj.id}`);
          const carr = getResultsArray(cjson);
          setCountryDetail(carr[0] || null);
        } catch (e) {
          // ignore country fetch failures
        }
      }

      // sensors: location often contains sensors array
      const locationSensors = Array.isArray(loc.sensors) ? loc.sensors : (loc.sensors || []);
      // normalize sensors for UI
      const normalizedSensors = locationSensors.map(s => ({
        id: s.id,
        name: s.name || `sensor-${s.id}`,
        parameter: (s.parameter && (s.parameter.name || s.parameter.displayName)) || s.parameter || "unknown",
        units: s.parameter?.units || s.unit || s.units || "",
        raw: s
      }));
      setSensorsList(normalizedSensors);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load location detail");
    } finally {
      setLoading(false);
      setChartsLoading(false);
    }
  }

  // ---------- Load sensor detail (GET /sensors/:id) ----------
  async function loadSensorDetail(sensorId) {
    if (!sensorId) return;
    setLoading(true);
    setSensorDetail(null);
    setSelectedSensorId(sensorId);
    setChartDataLeft(null);
    setChartDataRight(null);
    try {
      const json = await apiFetch(`/sensors/${sensorId}`);
      const arr = getResultsArray(json);
      const detail = arr[0] || json.data || json;
      if (!detail) throw new Error("No sensor detail");
      // normalize parameter accessible fields
      const param = detail.parameter || {};
      const normalized = {
        ...detail,
        parameterName: (typeof param === "object" ? (param.name || param.displayName) : param) || detail.parameter || "unknown",
        parameterUnits: (param && param.units) || detail.units || ""
      };
      setSensorDetail(normalized);
    } catch (err) {
      console.error(err);
      showToast("error", `Failed to load sensor ${sensorId}`);
    } finally {
      setLoading(false);
    }
  }

  // ---------- Build endpoint mapping for tabs ----------
  // left chart endpoints (primary) and right chart endpoints (auxiliary) for each tab
  function endpointsForTab(sensorId, tab) {
    // returns { left: path, right: path (optional), leftLabel, rightLabel }
    const base = `/sensors/${sensorId}`;
    switch (tab) {
      case "measurements":
        return { left: `${base}/measurements?limit=200&order_by=datetime&sort=desc`, leftLabel: "Measurements", right: null, rightLabel: null };
      case "monthly":
        return {
          left: `${base}/measurements/monthly?limit=60`,
          leftLabel: "Measurements (monthly)",
          right: `${base}/hours/monthly?limit=60`,
          rightLabel: "Hours (monthly)"
        };
      case "yearly":
        return {
          left: `${base}/measurements/yearly?limit=30`,
          leftLabel: "Measurements (yearly)",
          right: `${base}/hours/yearly?limit=30`,
          rightLabel: "Hours (yearly)"
        };
      case "monthofyear":
        return {
          left: `${base}/measurements/monthofyear?limit=36`,
          leftLabel: "Measurements (month of year)",
          right: `${base}/hours/monthofyear?limit=36`,
          rightLabel: "Hours (month of year)"
        };
      case "dayofweek":
        return {
          left: `${base}/measurements/dayofweek?limit=14`,
          leftLabel: "Measurements (day of week)",
          right: `${base}/hours/dayofweek?limit=14`,
          rightLabel: "Hours (day of week)"
        };
      default:
        return { left: `${base}/measurements?limit=200`, leftLabel: "Measurements", right: null, rightLabel: null };
    }
  }

  // ---------- Load charts for chosen tab/sensor ----------
  async function loadTabCharts(sensorId, tab) {
    if (!sensorId) return;
    setChartsLoading(true);
    setChartDataLeft(null);
    setChartDataRight(null);
    try {
      const ep = endpointsForTab(sensorId, tab);
      // left
      if (ep.left) {
        try {
          const leftJson = await apiFetch(ep.left);
          const leftArr = getResultsArray(leftJson);
          const leftPts = normalizeChartPoints(leftArr);
          setChartDataLeft({ pts: leftPts, label: ep.leftLabel, raw: leftJson });
        } catch (e) {
          console.warn("left chart failed", e);
          setChartDataLeft(null);
        }
      }
      // right
      if (ep.right) {
        try {
          const rightJson = await apiFetch(ep.right);
          const rightArr = getResultsArray(rightJson);
          const rightPts = normalizeChartPoints(rightArr);
          setChartDataRight({ pts: rightPts, label: ep.rightLabel, raw: rightJson });
        } catch (e) {
          console.warn("right chart failed", e);
          setChartDataRight(null);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load charts");
    } finally {
      setChartsLoading(false);
    }
  }

  // When sensor selection changes: fetch sensor detail & default charts
  useEffect(() => {
    if (!selectedSensorId) return;
    loadSensorDetail(selectedSensorId);
    loadTabCharts(selectedSensorId, activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSensorId]);

  // When active tab changes reload charts for currently selected sensor
  useEffect(() => {
    if (!selectedSensorId) return;
    loadTabCharts(selectedSensorId, activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ---------- UI helpers ----------
  function handleCopyRaw() {
    if (!rawResp) {
      showToast("info", "No raw response yet");
      return;
    }
    navigator.clipboard.writeText(prettyJSON(rawResp));
    setCopying(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopying(false), 1500);
  }

  // dropdown change — load location detail
  async function onLocationSelect(id) {
    setSelectedLocationId(id);
    await loadLocationDetail(id);
  }

  // ---------- Render helpers ----------
  function renderChartArea(dataObj) {
    if (!dataObj || !Array.isArray(dataObj.pts) || dataObj.pts.length === 0) {
      return <div className="h-64 flex items-center justify-center text-sm opacity-60">No data</div>;
    }
    // dataObj.pts: [{x, y}]
    // recharts needs objects; use x/y keys
    const chartSeries = dataObj.pts.map(p => ({ x: p.x, y: p.y }));
    return (
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          {/* Choose chart type based on number of points */}
          {chartSeries.length > 1 ? (
            <LineChart data={chartSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={{ fontSize: 10 }} interval={Math.ceil(chartSeries.length / 6)} />
              <YAxis />
              <ReTooltip content={<SimpleTooltip />} />
              <Line type="monotone" dataKey="y" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={chartSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <ReTooltip content={<SimpleTooltip />} />
              <Area type="monotone" dataKey="y" stroke="#2563eb" fill="#bfdbfe" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  }

  // filter sensors list by search query
  const visibleSensors = useMemo(() => {
    if (!sensorsList || sensorsList.length === 0) return [];
    if (!searchQuery || searchQuery.trim() === "") return sensorsList;
    const q = searchQuery.trim().toLowerCase();
    return sensorsList.filter(s => (s.parameter || "").toLowerCase().includes(q) || (s.name || "").toLowerCase().includes(q) || String(s.id || "").includes(q));
  }, [sensorsList, searchQuery]);

  // ---------- UI ----------
  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-9xl mx-auto", themeIsDark ? "text-white" : "text-zinc-900")}>
      {/* Header */}
      <header className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-zinc-800 shadow-sm">
            <BarChart2 />
          </div>

          <div>
            <h1 className="text-xl md:text-2xl font-bold">OpenAQ Explorer (Advanced)</h1>
            <div className="text-xs opacity-60">Locations dropdown • Sensors & multi-scale trends</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border rounded-lg px-2 py-1">
            <Input placeholder="Search sensors or parameters" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64" />
            <Button variant="outline" onClick={() => showToast("info", "Filter applied client-side")}><Search /></Button>
          </div>

          {/* Locations dropdown */}
          <div>
            <select
              value={selectedLocationId || ""}
              onChange={(e) => onLocationSelect(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {locationsLoading ? <option>Loading...</option> : null}
              {locationsList.map(loc => <option key={loc.id} value={loc.id}>{loc.label} (id:{loc.id})</option>)}
            </select>
          </div>

          <Button variant="ghost" onClick={() => { if (selectedLocationId) loadLocationDetail(selectedLocationId); else loadLocationsList(); }} title="Reload"><RefreshCcw /></Button>
        </div>
      </header>

      {/* loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="bg-black/30 dark:bg-black/50 rounded-md p-4">
              <div className="flex items-center gap-3 text-white">
                <Loader2 className="animate-spin" />
                <div className="text-sm">Loading…</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Location summary */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className="p-3 rounded-2xl">
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              {locationDetail ? (
                <div className="space-y-2">
                  <div className="font-semibold text-lg">{locationDetail.name || locationDetail.location}</div>
                  <div className="text-xs opacity-60">{locationDetail.cityName} • {locationDetail.countryName}</div>
                  <div className="text-sm mt-2">
                    <div><span className="text-xs opacity-60">Coordinates</span><div className="font-medium">{locationDetail.coordinates ? `${locationDetail.coordinates.latitude.toFixed(5)}, ${locationDetail.coordinates.longitude.toFixed(5)}` : "—"}</div></div>
                    <div className="mt-1"><span className="text-xs opacity-60">Provider</span><div className="font-medium">{locationDetail.provider?.name || locationDetail.provider || "—"}</div></div>
                    <div className="mt-1"><span className="text-xs opacity-60">Instruments</span><div className="font-medium">{Array.isArray(locationDetail.instruments) ? locationDetail.instruments.map(i => i.name).join(", ") : "—"}</div></div>
                    <div className="mt-1"><span className="text-xs opacity-60">First / Last</span><div className="font-medium">{isoLabel(locationDetail.datetimeFirst?.utc || locationDetail.datetimeFirst || locationDetail.firstUpdated)} / {isoLabel(locationDetail.datetimeLast?.utc || locationDetail.datetimeLast || locationDetail.lastUpdated)}</div></div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(true)}>API Info</Button>
                    <Button onClick={() => { navigator.clipboard.writeText(prettyJSON(locationDetail)); showToast("success", "Location copied"); }}>Copy</Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm opacity-60">Select a location to view details</div>
              )}
            </CardContent>
          </Card>

          {/* Country card */}
          <Card className="p-3 rounded-2xl">
            <div className="font-semibold mb-2 flex items-center gap-2"><Info /> Country</div>
            {countryDetail ? (
              <div className="text-xs">
                <div className="font-medium">{countryDetail.name} ({countryDetail.code})</div>
                <div className="mt-2">Parameters: {Array.isArray(countryDetail.parameters) ? countryDetail.parameters.map(p => p.name).join(", ") : "—"}</div>
                <div className="mt-2 text-xs opacity-60">Data range: {isoLabel(countryDetail.datetimeFirst)} → {isoLabel(countryDetail.datetimeLast)}</div>
              </div>
            ) : (
              <div className="text-xs opacity-60">Country info not loaded</div>
            )}
          </Card>
        </aside>

        {/* Middle: Sensors list */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold flex items-center gap-2"><BarChart2 /> Sensors</div>
            <div className="text-xs opacity-60">{visibleSensors.length} shown</div>
          </div>

          <Card className="p-3 rounded-2xl">
            <ScrollArea className="h-[60vh]">
              <div className="grid grid-cols-1 gap-2">
                {sensorsLoading && <div className="text-sm opacity-60">Loading sensors…</div>}
                {!sensorsLoading && visibleSensors.length === 0 && <div className="text-sm opacity-60">No sensors available</div>}
                {visibleSensors.map((s) => (
                  <motion.div key={s.id} whileHover={{ scale: 1.01 }} className={clsx("p-3 rounded-lg border flex items-center justify-between cursor-pointer", selectedSensorId === s.id ? "bg-sky-50 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900")} onClick={() => { setSelectedSensorId(s.id); loadSensorDetail(s.id); }}>
                    <div>
                      <div className="font-medium">{(s.parameter || "").toUpperCase()} <span className="text-xs opacity-60">({s.units || "—"})</span></div>
                      <div className="text-xs opacity-60">{s.name}</div>
                    </div>
                    <div className="text-right text-xs opacity-60">id: {s.id}</div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </section>

        {/* Right: Sensor detail + charts */}
        <aside className="lg:col-span-4 space-y-4">
          <Card className="p-3 rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{sensorDetail ? (sensorDetail.name || sensorDetail.parameterName) : "Select a sensor"}</div>
                <div className="text-xs opacity-60">{sensorDetail ? (sensorDetail.parameterName + (sensorDetail.parameterUnits ? ` • ${sensorDetail.parameterUnits}` : "")) : "—"}</div>
              </div>

              <div className="text-xs opacity-60">
                <div>id: {selectedSensorId || "—"}</div>
                <div className="mt-2">{sensorDetail?.latest ? `Latest: ${safeNum(sensorDetail.latest?.value) ?? "—"} @ ${isoLabel(sensorDetail.latest?.datetime?.utc || sensorDetail.latest?.datetime?.local || sensorDetail.latest?.datetime || sensorDetail.latest?.date)}` : "No latest"}</div>
              </div>
            </div>

            <div className="mt-3 text-xs opacity-70">
              <div>Summary: min {sensorDetail?.summary?.min ?? "—"}, max {sensorDetail?.summary?.max ?? "—"}, avg {sensorDetail?.summary?.avg ? Number(sensorDetail.summary.avg).toFixed(3) : "—"}</div>
              <div className="mt-2">First / Last: {isoLabel(sensorDetail?.datetimeFirst?.utc || sensorDetail?.datetimeFirst)} / {isoLabel(sensorDetail?.datetimeLast?.utc || sensorDetail?.datetimeLast)}</div>
            </div>

            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { if (selectedSensorId) { loadSensorDetail(selectedSensorId); loadTabCharts(selectedSensorId, activeTab); } }}>Reload</Button>
              <Button size="sm" onClick={() => { if (sensorDetail) { navigator.clipboard.writeText(prettyJSON(sensorDetail)); showToast("success", "Sensor copied"); } else showToast("info", "No sensor selected"); }}>Copy</Button>
            </div>
          </Card>

          {/* Tabs */}
          <Card className="p-3 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              {["measurements", "monthly", "yearly", "monthofyear", "dayofweek"].map(t => (
                <button key={t} onClick={() => { setActiveTab(t); if (selectedSensorId) loadTabCharts(selectedSensorId, t); }} className={clsx("px-2 py-1 rounded text-xs", activeTab === t ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800")}>
                  {t}
                </button>
              ))}
            </div>

            {/* charts side-by-side grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-2 border rounded">
                <div className="text-xs opacity-60 mb-2">{chartDataLeft?.label || "Primary"}</div>
                {chartsLoading ? <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin" /></div> : renderChartArea(chartDataLeft)}
                <div className="text-xs opacity-60 mt-2">{chartDataLeft?.pts?.length ? `${chartDataLeft.pts.length} points` : ""}</div>
              </div>

              <div className="p-2 border rounded">
                <div className="text-xs opacity-60 mb-2">{chartDataRight?.label || "Auxiliary"}</div>
                {chartsLoading ? <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin" /></div> : renderChartArea(chartDataRight)}
                <div className="text-xs opacity-60 mt-2">{chartDataRight?.pts?.length ? `${chartDataRight.pts.length} points` : ""}</div>
              </div>
            </div>

            {/* raw / export */}
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs opacity-60">Data</div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => { setShowRaw(s => !s); }}>{showRaw ? "Hide Raw" : "Show Raw"}</Button>
                <Button size="sm" onClick={handleCopyRaw}>{copying ? <Check /> : <Copy />}</Button>
              </div>
            </div>

            {showRaw && rawResp && (
              <pre className="mt-3 p-2 rounded border text-xs max-h-56 overflow-auto">
                {prettyJSON(rawResp)}
              </pre>
            )}
          </Card>

          {/* Map quick view */}
          <Card className="p-3 rounded-2xl">
            <div className="font-semibold mb-2 flex items-center gap-2"><MapPin /> Map</div>
            <div className="h-48 rounded overflow-hidden border">
              <MapContainer center={locationDetail?.coordinates ? [locationDetail.coordinates.latitude, locationDetail.coordinates.longitude] : [20, 0]} zoom={locationDetail?.coordinates ? 11 : 2} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {locationDetail?.coordinates && (
                  <>
                    <Marker position={[locationDetail.coordinates.latitude, locationDetail.coordinates.longitude]}>
                      <Popup>
                        <div className="font-medium">{locationDetail.name}</div>
                        <div className="text-xs opacity-60">{locationDetail.cityName}</div>
                      </Popup>
                    </Marker>
                    <Circle center={[locationDetail.coordinates.latitude, locationDetail.coordinates.longitude]} radius={800} pathOptions={{ color: "#2563eb", opacity: 0.2 }} />
                  </>
                )}
              </MapContainer>
            </div>
          </Card>
        </aside>
      </main>

      {/* Dialog: API endpoints */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-3 rounded-2xl">
          <DialogHeader><DialogTitle>API Endpoints used</DialogTitle></DialogHeader>
          <div className="text-xs space-y-2">
            <div><strong>Locations (dropdown)</strong><pre className="bg-zinc-100 p-2 rounded">{`${API_BASE}/locations?page=1&limit=${LOCATIONS_PAGE_LIMIT}`}</pre></div>
            <div><strong>Location detail</strong><pre className="bg-zinc-100 p-2 rounded">{`${API_BASE}/locations/{id}`}</pre></div>
            <div><strong>Sensors</strong><pre className="bg-zinc-100 p-2 rounded">{`${API_BASE}/sensors/{id}`}</pre></div>
            <div><strong>Country</strong><pre className="bg-zinc-100 p-2 rounded">{`${API_BASE}/countries/{id}`}</pre></div>
            <div><strong>Sensor trend endpoints</strong><pre className="bg-zinc-100 p-2 rounded">{`/sensors/{id}/measurements (and /monthly /yearly /monthofyear /dayofweek)\n/sensors/{id}/hours/*\n/sensors/{id}/days/*`}</pre></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple tooltip for charts
function SimpleTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="p-2 bg-white border rounded text-xs">
      <div className="font-medium">{p.x}</div>
      <div>Value: {p.y}</div>
    </div>
  );
}

// render area helper used inside component scope
function renderChartArea(dataObj) {
  if (!dataObj || !Array.isArray(dataObj.pts) || dataObj.pts.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm opacity-60">No data</div>;
  }
  const chartSeries = dataObj.pts.map(p => ({ x: p.x, y: p.y }));
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        {chartSeries.length > 1 ? (
          <LineChart data={chartSeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" tick={{ fontSize: 10 }} />
            <YAxis />
            <ReTooltip content={<SimpleTooltip />} />
            <Line type="monotone" dataKey="y" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        ) : (
          <AreaChart data={chartSeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis />
            <ReTooltip content={<SimpleTooltip />} />
            <Area type="monotone" dataKey="y" stroke="#2563eb" fill="#bfdbfe" />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
