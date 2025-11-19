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
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* Leaflet imports */
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

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
  .then(console.log);`
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
  const searchTimer = useRef(null);
  const nominatimTimer = useRef(null);

  useEffect(() => {
    // initial: search for Mount Everest by name (resolve to coords + fetch)
    // run a geocode first, then fetch OpenTopo
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
      // format=jsonv2 gives structured fields; limit to 7 results
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=7`;
      const res = await fetch(url, { signal: ac.signal, headers: { "Accept-Language": "en" } });
      if (!res.ok) {
        setGeoSuggestions([]);
        setGeoLoading(false);
        return;
      }
      const data = await res.json();
      // map to our display format: detailed (A)
      const mapped = (Array.isArray(data) ? data : []).map(item => ({
        id: item.place_id ?? `${item.lat}_${item.lon}`,
        display: item.display_name,
        lat: Number(item.lat),
        lon: Number(item.lon),
        type: item.type,
        class: item.class,
        // optional: address breakdown available in item.address
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
    // first try to parse coords directly
    const parsed = parseCoords(text);
    if (parsed) {
      setQuery(`${parsed.lat},${parsed.lng}`);
      // trigger OpenTopo fetch directly
      handleFetch(`/opentopo/v1/test-dataset?locations=${encodeURIComponent(`${parsed.lat},${parsed.lng}`)}`);
      return;
    }

    // otherwise, call nominatim
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
          raw: first
        };
        setRecord(item);
        showToast("success", `Loaded ${item.latitude},${item.longitude}`);
      } else {
        setRecord(null);
        showToast("info", "No coordinates returned in response");
      }
    } catch (err) {
      console.error("Fetch exception:", err);
      showToast("error", "Network or proxy error. See console.");
      setRawResp({ status: "exception", message: String(err) });
    } finally {
      setLoading(false);
    }
  }

  /* ---------- input behavior (debounced geocoding suggestions) ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);

    // local suggestions from presets (filtered)
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const q = (v || "").toLowerCase().trim();
      // if input appears to be coords, skip nominatim suggestions
      if (parseCoords(q)) {
        setGeoSuggestions([]);
        return;
      }
      // debounced nominatim lookup
      if (nominatimTimer.current) clearTimeout(nominatimTimer.current);
      nominatimTimer.current = setTimeout(() => {
        fetchNominatim(v);
      }, 300);
    }, 80);
  }

  /* when user clicks a geocode suggestion */
  function onSelectGeocode(s) {
    // s: { display, lat, lon }
    setQuery(`${s.lat},${s.lon}`);
    setShowSuggest(false);
    setGeoSuggestions([]);
    // run OpenTopo lookup
    handleFetch(`/opentopo/v1/test-dataset?locations=${encodeURIComponent(`${s.lat},${s.lon}`)}`);
  }

  function onSelectPreset(s) {
    setQuery(s.coords);
    setShowSuggest(false);
    handleFetch(`/opentopo/v1/test-dataset?locations=${encodeURIComponent(s.coords)}`);
  }

  function copyEndpoint() {
    const url = buildEndpoint(query);
    navigator.clipboard.writeText(url);
    showToast("success", "Endpoint copied");
  }

  function copyJSON() {
    if (!rawResp && !record) {
      showToast("info", "Nothing to copy");
      return;
    }
    const payload = rawResp || record;
    navigator.clipboard.writeText(prettyJSON(payload));
    showToast("success", "JSON copied to clipboard");
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

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      <header className="flex flex-col flex-wrap md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>OpenTopo — Elevation & Ocean Depth</h1>
          <p className="mt-1 text-sm opacity-70">
            Type a city or place name and pick a suggestion (detailed) — coordinates are shown below each suggestion. Click to view elevation & map.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={(e) => { e.preventDefault(); performGeocodeAndFetch(query); }} className={clsx("flex items-center gap-2 w-full md:w-[720px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search city/place (e.g. 'Paris', 'Mount Everest')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => performGeocodeAndFetch(query)}><Globe /> Find</Button>
            <Button type="submit" variant="ghost" className="px-3"><Layers /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown (Nominatim + presets) */}
      <AnimatePresence>
        {showSuggest && (geoSuggestions.length > 0 || SUGGESTIONS.length > 0) && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx(
              "absolute  left-6 w-80 z-100  max-w-3xl rounded-xl overflow-hidden shadow-xl",
              isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            <li className="px-4 py-2 text-sm opacity-60 flex items-center justify-between">
              <span>Suggestions</span>
              <span className="text-xs opacity-50">{geoLoading ? "Searching..." : "Select a place or preset"}</span>
            </li>

            {/* geocode results first (detailed) */}
            {geoSuggestions.map(s => (
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

            {/* separator if we also show presets */}
            {geoSuggestions.length > 0 && SUGGESTIONS.length > 0 && <li className="px-4 py-1"><Separator /></li>}

            {/* presets */}
            {SUGGESTIONS.map(s => (
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

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT preview */}
        <section className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center gap-3", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-900">
                  <MapPin />
                </div>
                <div>
                  <CardTitle className="text-base">Preview</CardTitle>
                  <div className="text-xs opacity-60">Quick info</div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className={clsx("p-3 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                <div className="text-sm opacity-60">Query</div>
                <div className="font-medium break-words">{query || DEFAULT_DATA.endpoint}</div>

                <Separator className="my-3" />

                <div className="text-sm opacity-60">Status</div>
                <div className="mt-1">
                  <span className={clsx("inline-block px-2 py-1 rounded-md text-xs font-medium", isDark ? "bg-white/5" : "bg-zinc-100")}>
                    {loading ? "Loading…" : (record ? statusBadge.label : "No result")}
                  </span>
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
                  <Button variant="outline" className="w-full" onClick={() => { navigator.clipboard.writeText(DEFAULT_DATA.code); showToast("success", "Example code copied"); }}>
                    <Copy /> Copy example
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setDialogOpen(true)}><ExternalLink /> View API info</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CENTER: large map + result (450px) */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Map & Result</CardTitle>
                <div className="text-xs opacity-60">{record ? `${record.latitude}, ${record.longitude}` : "Map centered on result or typed coordinates"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleFetch()}><Loader2 className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" onClick={() => setRawDialogOpen((s) => !s)}><Layers /> Raw</Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Map */}
              <div className={clsx("rounded-xl overflow-hidden border mb-4", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                <div style={{ height: 450 }}>
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
                          {record.raw?.note || `Coordinate: ${record.latitude}, ${record.longitude}`}
                        </div>
                      </div>

                      <div className="w-40">
                        <div className="text-xs opacity-60">Uncertainty</div>
                        <div className="font-medium">{record.raw?.uncertainty ?? "—"}</div>

                        <div className="mt-3 text-xs opacity-60">Source</div>
                        <div className="font-medium">{record.dataset ?? "test-dataset"}</div>
                      </div>
                    </div>
                  </div>

                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-3">Detailed fields</div>
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
                      <div className="p-3 rounded-md border col-span-1 sm:col-span-2">
                        <div className="text-xs opacity-60">Full record (JSON)</div>
                        <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 220 }}>
                          {prettyJSON(record)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw response area toggle */}
              <AnimatePresence>
                {rawDialogOpen && rawResp && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <div className="text-xs opacity-60 mb-2">Raw response</div>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                      {prettyJSON(rawResp)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: quick actions & presets */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Quick actions</div>
            <div className="text-xs opacity-60 mb-3">Copy, download or open endpoint for the current query</div>
            <div className="space-y-2">
              <Button className="w-full" variant="outline" onClick={copyEndpoint}><Copy /> Copy Endpoint</Button>
              <Button className="w-full" variant="outline" onClick={copyJSON}><Copy /> Copy JSON</Button>
              <Button className="w-full" variant="outline" onClick={downloadJSON}><Download /> Download JSON</Button>
              <Button className="w-full" variant="ghost" onClick={() => { window.open(buildEndpoint(query), "_blank"); }}><ExternalLink /> Open endpoint</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Presets</div>
            <div className="text-xs opacity-60 mb-3">Tap a preset to run a quick lookup</div>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTIONS.map(s => (
                <Button key={s.id} variant="ghost" className="justify-between" onClick={() => onSelectPreset(s)}>
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
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{DEFAULT_DATA.name}</DialogTitle>
          </DialogHeader>

          <div style={{ padding: 20 }}>
            <div className="text-sm opacity-60 mb-3">{DEFAULT_DATA.category} • {DEFAULT_DATA.description}</div>
            <div className="text-xs opacity-60 mb-1">Endpoint</div>
            <div className="font-medium break-words mb-3">{DEFAULT_DATA.endpoint}</div>

            <div className="text-xs opacity-60 mb-1">Example</div>
            <pre className="text-xs bg-zinc-100 dark:bg-zinc-900 p-3 rounded">{DEFAULT_DATA.code}</pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">OpenTopoData (test dataset)</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(DEFAULT_DATA.code); showToast("success", "Example code copied"); }}><Copy /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
