// src/pages/OpenTopoPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  Globe,
  Layers,
  Search,
  X,
  Menu,
  RefreshCw,
  Check,
  Smartphone,
  BarChart2,
  Database,
  ChevronRight,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* shadcn components you probably have in your project - adjust paths if necessary */
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

/* Recharts for elevation chart */
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";

/* Fix marker icon URLs for leaflet (CDN) */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ---------- API config / default ---------- */
const DEFAULT_DATA = {
  id: "opentopodata",
  name: "Elevation & Ocean Depth",
  category: "Geography",
  endpoint: "/opentopo/v1/test-dataset?locations=27.9881,86.925", // Mount Everest default
  description:
    "Fetch elevation or ocean depth for a given latitude and longitude coordinates. No API key required.",
  image: "/api_previews/opentopodata.png",
  code: `fetch("https://api.opentopodata.org/v1/test-dataset?locations=27.9881,86.925")
  .then(res => res.json())
  .then(console.log);`,
};

/* ---------- presets ---------- */
const SUGGESTIONS = [
  { id: "everest", label: "Mount Everest", coords: "27.9881,86.925" },
  { id: "london", label: "London, UK", coords: "51.509865,-0.118092" },
  { id: "mariana", label: "Mariana Trench (near)", coords: "11.35,142.2" },
  { id: "nyc", label: "New York City, USA", coords: "40.7128,-74.0060" },
  { id: "sydney", label: "Sydney, Australia", coords: "-33.8688,151.2093" },
];

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/* util: meters to feet */
function mToFeet(m) {
  return (m * 3.28084).toFixed(2);
}

/* safe parser for coordinates in text form (lat,lng) */
function parseCoords(str) {
  if (!str) return null;
  const match = str.trim().match(/^(-?\d+(\.\d+)?)[, ]\s*(-?\d+(\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/* RecenterMap: safely flyTo only when lat/lng are valid numbers */
function RecenterMap({ lat, lng, zoom = 10 }) {
  const map = useMap();
  React.useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    map.flyTo([lat, lng], zoom, { duration: 0.9 });
  }, [lat, lng, zoom, map]);
  return null;
}

/* Simulate generating 10 realistic sample elevation datapoints around a center elevation.
   We add small slopes & noise so the chart looks realistic. */
function generateElevationProfile(centerElevation = 0) {
  const base = Number.isFinite(centerElevation) ? centerElevation : 0;
  const points = [];
  // create a gentle slope plus some noise
  const slope = (Math.random() - 0.5) * 10; // -5..+5 meters across the profile
  const variation = Math.max(1, Math.abs(base) * 0.02 + 0.5); // scale noise slightly with elevation
  for (let i = 0; i < 10; i++) {
    const x = i;
    const y = Math.round((base + (i - 4.5) * slope + (Math.random() - 0.5) * variation) * 100) / 100;
    points.push({
      idx: i + 1,
      label: `P${i + 1}`,
      elevation: y,
    });
  }
  return points;
}

/* ---------- main component ---------- */
export default function OpenTopoPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [query, setQuery] = useState("Mount Everest");
  const [showSuggest, setShowSuggest] = useState(false);

  // dynamic geocode suggestions (from Nominatim)
  const [geoSuggestions, setGeoSuggestions] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const geoAbortRef = useRef(null);

  // API response state
  const [rawResp, setRawResp] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  // UI
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rawDialogOpen, setRawDialogOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [copiedState, setCopiedState] = useState({ endpoint: false, json: false });
  const [sidebarSamples, setSidebarSamples] = useState([]);
  const searchTimer = useRef(null);
  const nominatimTimer = useRef(null);

  const [locationLabel, setLocationLabel] = useState(null);

  useEffect(() => {
    // initial: search for Mount Everest by name (resolve to coords + fetch)
    performGeocodeAndFetch("Mount Everest");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Nominatim geocoding (debounced) ---------- */
  async function fetchNominatim(q) {
    if (!q || q.trim().length === 0) {
      setGeoSuggestions([]);
      return;
    }

    // cancel previous
    if (geoAbortRef.current) geoAbortRef.current.abort();
    const ac = new AbortController();
    geoAbortRef.current = ac;

    setGeoLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=7`;
      const res = await fetch(url, { signal: ac.signal, headers: { "Accept-Language": "en" } });
      if (!res.ok) {
        setGeoSuggestions([]);
        setGeoLoading(false);
        return;
      }
      const data = await res.json();
      const mapped = (Array.isArray(data) ? data : []).map((item) => ({
        id: item.place_id ?? `${item.lat}_${item.lon}`,
        display: item.display_name,
        lat: Number(item.lat),
        lon: Number(item.lon),
        type: item.type,
        class: item.class,
      }));
      setGeoSuggestions(mapped);
    } catch (err) {
      if (err.name !== "AbortError") console.error("Nominatim error:", err);
      setGeoSuggestions([]);
    } finally {
      setGeoLoading(false);
    }
  }

  /* ---------- perform geocode + automatically fetch OpenTopo ---------- */
  async function performGeocodeAndFetch(text) {
    const parsed = parseCoords(text);
    if (parsed) {
      setQuery(`${parsed.lat},${parsed.lng}`);
      handleFetch(`/opentopo/v1/test-dataset?locations=${encodeURIComponent(`${parsed.lat},${parsed.lng}`)}`);
      return;
    }

    try {
      setGeoLoading(true);
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(text)}&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      if (!res.ok) {
        showToast("error", "Geocoding failed");
        setGeoLoading(false);
        return;
      }
      const [first] = await res.json();
      if (!first) {
        showToast("info", "No geocode result");
        setGeoLoading(false);
        return;
      }
      const lat = Number(first.lat);
      const lon = Number(first.lon);
      setLocationLabel(first.display_name ?? first.name ?? `${lat},${lon}`);
      setQuery(`${lat},${lon}`);
      handleFetch(`/opentopo/v1/test-dataset?locations=${encodeURIComponent(`${lat},${lon}`)}`);
    } catch (err) {
      console.error("performGeocodeAndFetch error:", err);
      showToast("error", "Geocode error");
    } finally {
      setGeoLoading(false);
    }
  }

  /* ---------- Resolve endpoint ---------- */
  function buildEndpoint(q) {
    const trimmed = (q || "").trim();
    const latLngMatch = trimmed.match(/^(-?\d+(\.\d+)?)[, ]\s*(-?\d+(\.\d+)?)$/);
    if (latLngMatch) {
      const loc = `${latLngMatch[1]},${latLngMatch[3]}`;
      return `/opentopo/v1/test-dataset?locations=${encodeURIComponent(loc)}`;
    }

    const preset = SUGGESTIONS.find((s) => s.label.toLowerCase() === trimmed.toLowerCase() || s.id === trimmed);
    if (preset) {
      return `/opentopo/v1/test-dataset?locations=${encodeURIComponent(preset.coords)}`;
    }

    // fallback: use default
    return DEFAULT_DATA.endpoint;
  }

  /* ---------- Fetch & analyze OpenTopo ---------- */
  async function handleFetch(endpointOrNull) {
    const endpoint = endpointOrNull || buildEndpoint(query);
    setLoading(true);
    setRawResp(null);
    setRecord(null);

    try {
      const res = await fetch(endpoint, { method: "GET" });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Non-OK response body:", txt);
        showToast("error", `Request failed (${res.status})`);
        setRawResp({ status: "error", statusCode: res.status, body: txt });
        setLoading(false);
        return;
      }

      if (!contentType.includes("application/json")) {
        const text = await res.text().catch(() => "");
        console.error("Unexpected content-type:", contentType, text);
        showToast("error", "Unexpected response (not JSON). See Raw response.");
        setRawResp({ status: "non-json", contentType, body: text });
        setLoading(false);
        return;
      }

      const json = await res.json();
      setRawResp(json);

      const first = Array.isArray(json.results) && json.results.length > 0 ? json.results[0] : null;
      if (first) {
        const lat = first.location?.lat ?? null;
        const lng = first.location?.lng ?? null;
        const elev = Number(first.elevation);
        const item = {
          dataset: first.dataset ?? null,
          elevationRaw: first.elevation,
          elevationMeters: Number.isFinite(elev) ? elev : null,
          elevationFeet: Number.isFinite(elev) ? Number(mToFeet(elev)) : null,
          latitude: Number.isFinite(Number(lat)) ? Number(lat) : null,
          longitude: Number.isFinite(Number(lng)) ? Number(lng) : null,
          type: Number.isFinite(elev) ? (elev < 0 ? "ocean" : "land") : "unknown",
          raw: first,
        };
        setRecord(item);
        // generate sidebar samples based on retrieved elevation (so they feel related)
        setSidebarSamples(generateElevationProfile(item.elevationMeters));
        showToast("success", `Loaded ${item.latitude},${item.longitude}`);
      } else {
        setRecord(null);
        setSidebarSamples(generateElevationProfile(0));
        showToast("info", "No coordinates returned in response");
      }
    } catch (err) {
      console.error("Fetch exception:", err);
      showToast("error", "Network or proxy error. See console.");
      setRawResp({ status: "exception", message: String(err) });
      setSidebarSamples(generateElevationProfile(0));
    } finally {
      setLoading(false);
    }
  }

  /* ---------- input behavior (debounced geocoding suggestions) ---------- */
  function onQueryChange(v) {
    setQuery(v);
        // if user typed raw coords, remove stored human label to show the raw coords
    if (parseCoords(v)) {
      setLocationLabel(null);
    }

    setShowSuggest(true);

    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const q = (v || "").toLowerCase().trim();
      if (parseCoords(q)) {
        setGeoSuggestions([]);
        return;
      }
      if (nominatimTimer.current) clearTimeout(nominatimTimer.current);
      nominatimTimer.current = setTimeout(() => {
        fetchNominatim(v);
      }, 300);
    }, 80);
  }

  /* when user clicks a geocode suggestion */
  function onSelectGeocode(s) {
    setLocationLabel(s.display ?? `${s.lat},${s.lon}`);
    setQuery(`${s.lat},${s.lon}`);
    setShowSuggest(false);
    setGeoSuggestions([]);
    handleFetch(`/opentopo/v1/test-dataset?locations=${encodeURIComponent(`${s.lat},${s.lon}`)}`);
  }

  function onSelectPreset(s) {
    setLocationLabel(s.label);
    setQuery(s.coords);
    setShowSuggest(false);
    handleFetch(`/opentopo/v1/test-dataset?locations=${encodeURIComponent(s.coords)}`);
  }

  /* copy with animated feedback */
  async function copyEndpoint() {
    const url = buildEndpoint(query);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedState((s) => ({ ...s, endpoint: true }));
      showToast("success", "Endpoint copied");
      // reset after 1.6s
      setTimeout(() => setCopiedState((s) => ({ ...s, endpoint: false })), 1600);
    } catch {
      showToast("error", "Copy failed");
    }
  }

  async function copyJSON() {
    if (!rawResp && !record) {
      showToast("info", "Nothing to copy");
      return;
    }
    const payload = rawResp || record;
    try {
      await navigator.clipboard.writeText(prettyJSON(payload));
      setCopiedState((s) => ({ ...s, json: true }));
      showToast("success", "JSON copied to clipboard");
      setTimeout(() => setCopiedState((s) => ({ ...s, json: false })), 1600);
    } catch {
      showToast("error", "Copy failed");
    }
  }

  function downloadJSON() {
    const payload = rawResp || record;
    if (!payload) {
      showToast("info", "No result to download");
      return;
    }
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const nameCoord = record && record.latitude && record.longitude ? `${record.latitude}_${record.longitude}` : "opentopo_result";
    a.download = `opentopo_${nameCoord}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function refreshAll() {
    // regenerate sample profile (keeping center elevation if available)
    setSidebarSamples((s) => generateElevationProfile(record?.elevationMeters ?? 0));
    handleFetch();
  }

  const statusBadge = useMemo(() => {
    if (!record) return { label: "No data", tone: "muted" };
    if (record.type === "ocean") return { label: "Ocean / Below sea level", tone: "danger" };
    if (record.type === "land") return { label: "Land / Above sea level", tone: "success" };
    return { label: "Unknown", tone: "muted" };
  }, [record]);

  /* parse coordinates for map: prefer record, fallback to query parser */
  const coords = useMemo(() => {
    if (record && Number.isFinite(record.latitude) && Number.isFinite(record.longitude)) {
      return { lat: record.latitude, lng: record.longitude };
    }
    const parsed = parseCoords(query);
    if (parsed) return { lat: parsed.lat, lng: parsed.lng };
    return null;
  }, [record, query]);

  /* Prepare chart data: if we have a generated profile (sidebarSamples), use it;
     otherwise make a placeholder profile centred on record elevation */
  const chartData = useMemo(() => {
    if (sidebarSamples && sidebarSamples.length > 0) {
      return sidebarSamples.map((p) => ({ name: p.label, elevation: p.elevation }));
    }
    return generateElevationProfile(record?.elevationMeters ?? 0).map((p) => ({ name: p.label, elevation: p.elevation }));
  }, [sidebarSamples, record?.elevationMeters]);

  /* Custom tooltip for recharts */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const val = payload[0].value;
    return (
      <div className={clsx("p-2 rounded-md shadow-md text-xs", isDark ? "bg-zinc-900 text-zinc-100" : "bg-white text-zinc-900")}>
        <div className="font-medium">{label}</div>
        <div className="opacity-70">Elevation: {val} m</div>
        <div className="opacity-60 text-[11px]">{(val * 3.28084).toFixed(1)} ft</div>
      </div>
    );
  };

  return (
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-8xl mx-auto")}>
      {/* HEADER */}
      <header className="flex items-center flex-wrap justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            {/* Mobile sheet trigger */}
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2 cursor-pointer">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent className='z-999 p-3' position="left" size="full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin />
                    <div>
                      <div className="font-semibold">Presets & Samples</div>
                      <div className="text-xs opacity-60">Tap an item to run lookup</div>
                    </div>
                  </div>

                </div>
                <ScrollArea className="h-[70vh] overflow-y-auto">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Presets</div>
                    {SUGGESTIONS.map((s) => (
                      <Button key={s.id} variant="ghost" className="w-full justify-between cursor-pointer" onClick={() => { setMobileSheetOpen(false); onSelectPreset(s); }}>
                        <div className="flex items-center gap-2"><MapPin /> <span>{s.label}</span></div>
                        <div className="text-xs opacity-60">{s.coords}</div>
                      </Button>
                    ))}
                    <Separator />
                    <div className="text-sm font-semibold mt-2">Samples</div>
                    {chartData.map((p) => (
                      <div key={p.name} className="flex items-center justify-between p-3 border rounded cursor-pointer" onClick={() => { setMobileSheetOpen(false); /* set query to fake coordinate? keep placeholder behavior */ }}>
                        <div>
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs opacity-60">Elevation {p.elevation} m</div>
                        </div>
                        <ChevronRight className="opacity-60" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">OpenTopo — Elevation & Ocean Depth</h1>
            <div className="text-xs opacity-70 hidden md:block">Type a city or place name and pick a suggestion — view elevation profile and map.</div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <form onSubmit={(e) => { e.preventDefault(); performGeocodeAndFetch(query); }} className={clsx("flex items-center gap-2 w-full md:w-[720px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search city/place (e.g. 'Paris', 'Mount Everest')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => performGeocodeAndFetch(query)}><Globe /> Find</Button>
            <Button type="submit" variant="ghost" className="px-3 cursor-pointer"><Layers /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown (Nominatim + presets) */}
      <AnimatePresence>
        {showSuggest && (geoSuggestions.length > 0 || SUGGESTIONS.length > 0) && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx(
              "absolute left-4 z-999 md:left-6 top-20  w-[92vw] md:w-96 max-w-3xl rounded-xl overflow-hidden shadow-xl",
              isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            <li className="px-4 py-2 text-sm opacity-60 flex items-center justify-between">
              <span>Suggestions</span>
              <span className="text-xs opacity-50">{geoLoading ? "Searching..." : "Select a place or preset"}</span>
            </li>

            {geoSuggestions.map((s) => (
              <li key={s.id} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => onSelectGeocode(s)}>
                <div className="flex items-center gap-3">
                  <MapPin className="opacity-70" />
                  <div className="flex-1">
                    <div className="font-medium">{s.display}</div>
                    <div className="text-xs opacity-60">{s.lat.toFixed(6)}, {s.lon.toFixed(6)}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.type ?? s.class}</div>
                </div>
              </li>
            ))}

            {geoSuggestions.length > 0 && SUGGESTIONS.length > 0 && <li className="px-4 py-1"><Separator /></li>}

            {SUGGESTIONS.map((s) => (
              <li key={s.id} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => onSelectPreset(s)}>
                <div className="flex items-center gap-3">
                  <MapPin className="opacity-70" />
                  <div className="flex-1">
                    <div className="font-medium">{s.label}</div>
                    <div className="text-xs opacity-60">{s.coords}</div>
                  </div>
                  <div className="text-xs opacity-60">Preset</div>
                </div>
              </li>
            ))}

            <li className="px-4 py-2 text-xs opacity-60">Tip: type a city, landmark, or coordinates. Click a suggestion to run the elevation lookup.</li>
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main grid: left sidebar (desktop), center map + chart, right actions */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT preview & samples (desktop) */}
        <aside className="lg:col-span-3 space-y-4 hidden lg:block">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center gap-3", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-900">
                  <MapPin />
                </div>
                <div>
                  <CardTitle className="text-base">Preview</CardTitle>
                  <div className="text-xs opacity-60">Quick info & samples</div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className={clsx("p-3 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                <div className="text-sm opacity-60">Query</div>
             {/* human-friendly label (preferred) */}
<div className="flex items-center gap-2">
  <MapPin className="w-10 h-10 opacity-70" aria-hidden="true" />
  <div className="font-medium  truncate">
    {(locationLabel ?? query) || DEFAULT_DATA.endpoint}
  </div>
</div>

{/* raw query / endpoint */}
<div className="flex items-center gap-2">
  <Globe className="w-4 h-4 opacity-70" aria-hidden="true" />
  <div className="font-medium break-words">
    {query || DEFAULT_DATA.endpoint}
  </div>
</div>



                <Separator className="my-3" />

                <div className="text-sm opacity-60">Status</div>
                <div className="mt-1">
                  <Badge>{loading ? "Loading…" : (record ? statusBadge.label : "No result")}</Badge>
                </div>

                <div className="mt-4 text-sm space-y-2">
                  <div>
                    <div className="text-xs opacity-60">API</div>
                    <div className="text-sm font-medium break-words">{DEFAULT_DATA.endpoint}</div>
                  </div>

                  <div>
                    <div className="text-xs opacity-60">Description</div>
                    <div className="text-sm">{DEFAULT_DATA.description}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
               

                  <Button variant="ghost" className="w-full cursor-pointer" onClick={() => setDialogOpen(true)}><ExternalLink /> View API info</Button>
                </div>
              </div>

              <Separator className="my-3" />

              <div>
                <div className="text-sm font-semibold mb-2 flex items-center gap-2"><BarChart2 /> Samples</div>
                <ScrollArea className="overflow-y-auto" style={{ maxHeight: 260 }}>
                  <div className="space-y-2 ">
                    {chartData.map((p) => (
                      <div key={p.name} className="p-2 rounded-md border flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer" onClick={() => {
                        // clicking a sample will set the query to a fake coordinate (not ideal) — keep it simple: show toast
                        showToast("info", `Sample ${p.name}: ${p.elevation} m`);
                      }}>
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs opacity-60">Elevation {p.elevation} m</div>
                        </div>
                        <div className="text-xs opacity-60">#{p.idx ?? ""}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* CENTER: map + chart + details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2"> <MapPin /> Map & Elevation</CardTitle>
                <div className="text-xs opacity-60">
  {record ? (locationLabel ?? `${record.latitude}, ${record.longitude}`) : "Map centered on result or typed coordinates"}
</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => refreshAll()} className="cursor-pointer"><RefreshCw className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" onClick={() => setRawDialogOpen((s) => !s)} className="cursor-pointer"><Layers /> Raw</Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* MAP */}
              <div className={clsx("rounded-xl overflow-hidden border mb-4", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                <div style={{ height: 370 }}>
                  {coords ? (
                    <MapContainer center={[coords.lat, coords.lng]} zoom={8} style={{ height: "100%", width: "100%" }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[coords.lat, coords.lng]}>
                        <Popup>
                          {record?.elevationMeters ? `Elevation: ${record.elevationMeters} m` : "No elevation"} <br />
                          {coords.lat}, {coords.lng}
                        </Popup>
                      </Marker>
                      <RecenterMap lat={coords.lat} lng={coords.lng} zoom={8} />
                    </MapContainer>
                  ) : (
                    <div className="p-6 text-center text-sm opacity-60">Enter valid coordinates to preview the map.</div>
                  )}
                </div>
              </div>

              {/* ELEVATION CHART */}
              <div className={clsx("p-4 rounded-xl border mb-4", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart2 />
                    <div>
                      <div className="font-semibold">Elevation profile</div>
                      <div className="text-xs opacity-60">Simulated 10-point profile (based on result)</div>
                    </div>
                  </div>
                  <div className="text-xs opacity-60">Unit: meters</div>
                </div>

                <div style={{ height: 220 }}>
               <ResponsiveContainer width="100%" height="100%">
  <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
    <defs>
      <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isDark ? "#60a5fa" : "#2563eb"} stopOpacity={0.85}/>
        <stop offset="60%" stopColor={isDark ? "#60a5fa" : "#2563eb"} stopOpacity={0.25}/>
        <stop offset="100%" stopColor={isDark ? "#60a5fa" : "#2563eb"} stopOpacity={0.05}/>
      </linearGradient>
      {/* slightly different gradient for negative (ocean) values if you like */}
      <linearGradient id="oceanGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isDark ? "#7dd3fc" : "#60a5fa"} stopOpacity={0.75}/>
        <stop offset="100%" stopColor={isDark ? "#7dd3fc" : "#60a5fa"} stopOpacity={0.08}/>
      </linearGradient>
    </defs>

    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
    <YAxis tick={{ fontSize: 12 }} />
    <Tooltip content={<CustomTooltip />} />

    {/* main area (positive or mixed elevations) */}
    <Area
      type="monotone"
      dataKey="elevation"
      stroke={isDark ? "#60a5fa" : "#2563eb"}
      strokeWidth={2}
      fill={`url(#elevGradient)`}
      dot={{ r: 3 }}
      activeDot={{ r: 5 }}
      connectNulls={true}
    />

    {/* show a subtle reference at sea level if any point is below zero */}
    {chartData.some((d) => d.elevation < 0) && (
      <ReferenceLine y={0} stroke="rgba(255,0,0,0.28)" strokeDasharray="4 4" />
    )}
  </AreaChart>
</ResponsiveContainer>

                </div>
              </div>

              {/* Result details */}
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !record ? (
                <div className="py-8 text-center text-sm opacity-60">No numeric elevation result — try a different coordinate or pick a suggestion.</div>
              ) : (
                <div className="space-y-4">
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="text-2xl font-semibold leading-tight">
                          {record.elevationMeters !== null ? `${record.elevationMeters} m` : "No elevation"}
                          <span className="text-sm font-normal ml-3 opacity-70">({record.elevationFeet ? `${record.elevationFeet} ft` : "—"})</span>
                        </div>
                        <div className="text-sm opacity-60 mt-1">{statusBadge.label}</div>

                        <div className="mt-3 text-sm leading-relaxed">
                          <Database className="inline mr-2" /> {record.raw?.note || `Coordinate: ${record.latitude}, ${record.longitude}`}
                        </div>
                      </div>

                      <div className="w-44">
                        <div className="text-xs opacity-60">Uncertainty</div>
                        <div className="font-medium">{record.raw?.uncertainty ?? "—"}</div>

                        <div className="mt-3 text-xs opacity-60">Source</div>
                        <div className="font-medium">{record.dataset ?? "test-dataset"}</div>
                      </div>
                    </div>
                  </div>

                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Database />
                        <div className="font-semibold">Detailed fields</div>
                      </div>
                     
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Latitude</div>
                        <div className="text-sm font-medium">{record.latitude ?? "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Longitude</div>
                        <div className="text-sm font-medium">{record.longitude ?? "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border col-span-1 sm:col-span-2">
                        <div className="text-xs opacity-60">Elevation (raw)</div>
                        <div className="text-sm font-medium break-words">{record.elevationRaw ?? "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Elevation (m)</div>
                        <div className="text-sm font-medium">{record.elevationMeters ?? "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Elevation (ft)</div>
                        <div className="text-sm font-medium">{record.elevationFeet ?? "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Type</div>
                        <div className="text-sm font-medium">{record.type}</div>
                      </div>
                   
                    </div>
                  </div>
                </div>
              )}

              {/* Raw response area toggle */}
              <AnimatePresence>
                {rawDialogOpen && rawResp && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 mt-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs opacity-60">Raw response</div>
                      <div className="flex items-center gap-2">

                      </div>
                    </div>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                      {prettyJSON(rawResp)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: quick actions & presets (desktop) */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Smartphone /> Quick actions</div>
            <div className="text-xs opacity-60 mb-3">Copy, download or open endpoint for the current query</div>
            <div className="space-y-2">
              <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={copyEndpoint}><Copy /> <span className="ml-2">Copy Endpoint</span></Button>
              <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={copyJSON}><Copy /> <span className="ml-2">Copy JSON</span></Button>
              <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={downloadJSON}><Download /> <span className="ml-2">Download JSON</span></Button>
              <Button className="w-full justify-start cursor-pointer" variant="ghost" onClick={() => { window.open(buildEndpoint(query), "_blank"); }}><ExternalLink /> <span className="ml-2">Open endpoint</span></Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><MapPin /> Presets</div>
            <div className="text-xs opacity-60 mb-3">Click a preset to run a quick lookup</div>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTIONS.map((s) => (
                <Button key={s.id} variant="ghost" className="justify-between cursor-pointer" onClick={() => onSelectPreset(s)}>
                  <div className="flex items-center gap-2"><MapPin /> <span>{s.label}</span></div>
                  <div className="text-xs opacity-60">{s.coords}</div>
                </Button>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* API info dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx(" p-3 z-999 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{DEFAULT_DATA.name}</DialogTitle>
          </DialogHeader>

          <div className="overflow-auto" style={{ padding: 20 }}>
            <div className="text-sm opacity-60 mb-3">{DEFAULT_DATA.category} • {DEFAULT_DATA.description}</div>
            <div className="text-xs opacity-60 mb-1">Endpoint</div>
            <div className="font-medium  mb-3">{DEFAULT_DATA.endpoint}</div>

            <div className="text-xs opacity-60 mb-1">Example</div>
            <pre className="text-xs bg-zinc-100 dark:bg-zinc-900 p-3 rounded">{DEFAULT_DATA.code}</pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">OpenTopoData (test dataset)</div>
            <div className="flex gap-2">
              <Button className='cursor-pointer' variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(DEFAULT_DATA.code); showToast("success", "Example code copied"); }}><Copy /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
