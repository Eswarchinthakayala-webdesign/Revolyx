// src/pages/SunriseSunsetPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  MapPin,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  Clock,
  Globe,
  X,
  Sun,
  Sunset,
  SunDim,
  Sunrise,
  CloudSun,
  CloudMoon,
  Star,
  StarHalf
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper"; // reuse if available

// Leaflet imports (map)
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // ensure this is loaded in your app (or import in layout)

// Helper: pretty JSON
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/**
 * DEFAULT DATA (from your example)
 * id: "sunrise_sunset"
 * lat: 36.7201600, lng: -4.4203400
 */
const DEFAULT = {
  id: "sunrise_sunset",
  name: "Sunrise & Sunset Times",
  category: "Geolocation",
  lat: 36.72016,
  lng: -4.42034,
  description: "Get daily sunrise and sunset times for any latitude and longitude. No API key required.",
  previewImage: "/api_previews/sunrise_sunset.png",
  endpoint: "https://api.sunrise-sunset.org/json"
};

export default function SunriseSunsetPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Search state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // Selected place and API responses
  const [place, setPlace] = useState({
    display_name: "Málaga, Spain",
    lat: String(DEFAULT.lat),
    lon: String(DEFAULT.lng),
  });
  const [sunResp, setSunResp] = useState(null);
  const [rawSunResp, setRawSunResp] = useState(null);

  const [loadingSun, setLoadingSun] = useState(false);
  const [rawVisible, setRawVisible] = useState(false);
  const [rawDialogOpen, setRawDialogOpen] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);

  // debounce
  const timerRef = useRef(null);

  // On mount: load default sunrise info
  useEffect(() => {
    fetchSunriseForCoords(DEFAULT.lat, DEFAULT.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------
     Functions: Search (Nominatim)
     -------------------------- */
  async function searchPlaces(q) {
    if (!q || !q.trim()) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const encoded = encodeURIComponent(q.trim());
      // Nominatim public geocoding
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=6&addressdetails=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": "sunrise-sunset-app/1.0 (+your-email-or-domain)" }
      });
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("geocode error", err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      searchPlaces(v);
    }, 300);
  }

  function chooseSuggestion(s) {
    if (!s) return;
    setPlace(s);
    setShowSuggest(false);
    setQuery(s.display_name);
    fetchSunriseForCoords(Number(s.lat), Number(s.lon), s);
  }

  /* --------------------------
     Fetch sunrise-sunset.org
     -------------------------- */
  async function fetchSunriseForCoords(lat, lng, placeObj = null) {
    setLoadingSun(true);
    setSunResp(null);
    setRawSunResp(null);
    try {
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng), formatted: "0" });
      const url = `${DEFAULT.endpoint}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast?.("error", `Sun API fetch failed (${res.status})`);
        setLoadingSun(false);
        return;
      }
      const json = await res.json();
      setRawSunResp(json);
      // api returns {results: {...}, status: "OK"}
      const results = json?.results || {};
      // convert ISO UTC times to Date objects to present both UTC and local times
      const converted = {};
      Object.entries(results).forEach(([k, v]) => {
        try {
          converted[k] = {
            original: v,
            utc: new Date(v),
            local: new Date(v).toLocaleString(),
            localTimeOnly: new Date(v).toLocaleTimeString(),
          };
        } catch {
          converted[k] = { original: v };
        }
      });
      setSunResp({ raw: results, converted });
      // optional toast
      showToast?.("success", `Sun times loaded for ${placeObj?.display_name ?? (place?.display_name ?? "location")}`);
    } catch (err) {
      console.error("sun API error", err);
      showToast?.("error", "Failed to fetch sunrise/sunset");
    } finally {
      setLoadingSun(false);
    }
  }

  /* --------------------------
     Quick actions
     -------------------------- */
  function copyCoords() {
    const lat = place.lat ?? place?.lat ?? DEFAULT.lat;
    const lon = place.lon ?? place?.lon ?? DEFAULT.lng;
    const txt = `${lat}, ${lon}`;
    navigator.clipboard.writeText(txt);
    showToast?.("success", "Coordinates copied");
  }

  function openInOSM() {
    const lat = place.lat ?? place?.lat ?? DEFAULT.lat;
    const lon = place.lon ?? place?.lon ?? DEFAULT.lng;
    const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=13/${lat}/${lon}`;
    window.open(url, "_blank");
  }

  function openInGoogleMaps() {
    const lat = place.lat ?? place?.lat ?? DEFAULT.lat;
    const lon = place.lon ?? place?.lon ?? DEFAULT.lng;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    window.open(url, "_blank");
  }

  function downloadJSON() {
    const payload = { place, sunrise: rawSunResp };
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sunrise_${(place?.display_name || "location").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast?.("success", "Downloaded JSON");
  }

  /* --------------------------
     Icons mapping + display order (Option 1)
     -------------------------- */
  const timeFields = useMemo(() => ([
    { key: "astronomical_twilight_begin", label: "Astronomical Dawn", Icon: Star, color: "text-violet-400" },
    { key: "nautical_twilight_begin", label: "Nautical Dawn", Icon: CloudSun, color: "text-sky-400" },
    { key: "civil_twilight_begin", label: "Civil Dawn", Icon: Sunrise, color: "text-amber-300" },
    { key: "sunrise", label: "Sunrise", Icon: Sun, color: "text-amber-400" },
    { key: "solar_noon", label: "Solar Noon", Icon: SunDim, color: "text-yellow-400" },
    { key: "sunset", label: "Sunset", Icon: Sunset, color: "text-orange-400" },
    { key: "civil_twilight_end", label: "Civil Dusk", Icon: Sunset, color: "text-orange-300" },
    { key: "nautical_twilight_end", label: "Nautical Dusk", Icon: CloudMoon, color: "text-indigo-400" },
    { key: "astronomical_twilight_end", label: "Astronomical Dusk", Icon: StarHalf, color: "text-purple-400" },
    { key: "day_length", label: "Day Length", Icon: Clock, color: "text-blue-400" },
  ]), []);

  /* --------------------------
     Small render helpers
     -------------------------- */
  function renderTimeRow(item) {
    const { key, label, Icon, color } = item;
    const conv = sunResp?.converted?.[key];
    if (!conv) return null;

    // day_length is numeric seconds in API; convert to hh:mm:ss if present
    if (key === "day_length") {
      const seconds = Number(sunResp?.raw?.day_length ?? conv?.original ?? 0);
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const formatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      return (
        <div key={key} className="flex items-center justify-between px-3 py-2 rounded-md border">
          <div className="flex items-center gap-3">
            <div className={clsx("p-2 rounded-md", isDark ? "bg-white/5" : "bg-black/5")}>
              <Icon className={clsx("w-5 h-5", color)} />
            </div>
            <div className="text-sm opacity-70">{label}</div>
          </div>
          <div className="text-right">
            <div className="font-medium">{formatted}</div>
            <div className="text-xs opacity-60">({seconds} seconds)</div>
          </div>
        </div>
      );
    }

    return (
      <div key={key} className="flex items-center justify-between px-3 py-2 rounded-md border">
        <div className="flex items-center gap-3">
          <div className={clsx("p-2 rounded-md", isDark ? "bg-white/5" : "bg-black/5")}>
            <Icon className={clsx("w-5 h-5", color)} />
          </div>
          <div className="text-sm opacity-70">{label}</div>
        </div>
        <div className="text-right">
          <div className="font-medium">{conv.localTimeOnly ?? conv.local ?? conv.original}</div>
          <div className="text-xs opacity-60">({new Date(conv.utc).toUTCString()})</div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Sunrise & Sunset — Location Explorer</h1>
          <p className="mt-1 text-sm opacity-70">Find places, view coordinates and get sunrise / sunset times. No API keys required.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={(e) => { e.preventDefault(); if (suggestions.length > 0) chooseSuggestion(suggestions[0]); }} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search a place (city, address, landmark)…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute z-5 -6  right-6 max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li
                key={s.place_id ?? s.osm_id ?? idx}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                onClick={() => chooseSuggestion(s)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{s.display_name}</div>
                    <div className="text-xs opacity-60 mt-1">Lat: {s.lat} • Lon: {s.lon}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.type ?? ""}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout: left=map, center=details, right=quick actions */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Map */}
        <section className="lg:col-span-4 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border h-fit", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Map</CardTitle>
                <div className="text-xs opacity-60">Street map (OpenStreetMap tiles)</div>
              </div>
              <div className="text-sm opacity-60">Marker: {place?.display_name ? place.display_name.split(",")[0] : "—"}</div>
            </CardHeader>

            <CardContent className="p-0">
              <div style={{ height: "420px" }} className="w-full">
                <MapContainer center={[Number(place.lat), Number(place.lon)]} zoom={12} style={{ height: "100%", width: "100%" }} key={`${place.lat}-${place.lon}`}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[Number(place.lat), Number(place.lon)]}>
                    <Popup>
                      <div className="max-w-xs">
                        <div className="font-medium">{place.display_name}</div>
                        <div className="text-xs opacity-70">Lat: {place.lat} • Lon: {place.lon}</div>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              <div className="p-4 flex gap-2">
                <Button onClick={() => setMapDialogOpen(true)} variant="outline"><Globe /> View Large</Button>
                <Button onClick={() => { openInOSM(); }} variant="ghost"><MapPin /> Open OSM</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Center: Details (large content) */}
        <section className="lg:col-span-5 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Place & Sun Times</CardTitle>
                <div className="text-xs opacity-60">{place?.display_name ?? "Select a place to view details"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setRawVisible((s) => !s)}><Globe /> Raw</Button>
                <Button variant="outline" onClick={() => fetchSunriseForCoords(Number(place.lat), Number(place.lon))}><Loader2 className={loadingSun ? "animate-spin" : ""} /> Refresh</Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* left small column: basic place meta */}
                <div className={clsx("p-3 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  <div className="text-xs opacity-60">Name</div>
                  <div className="font-semibold">{place.display_name}</div>

                  <div className="mt-3">
                    <div className="text-xs opacity-60">Coordinates</div>
                    <div className="font-medium">Lat: {place.lat} • Lon: {place.lon}</div>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs opacity-60">Type</div>
                    <div className="font-medium">{place.type ?? "—"}</div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <Button onClick={copyCoords} variant="outline"><Copy /> Copy coordinates</Button>
                    <div className="flex flex-col  gap-2">
                      <Button onClick={openInOSM} variant="outline"><MapPin /> Open OSM</Button>
                      <Button onClick={openInGoogleMaps} variant="outline"><ExternalLink /> Google Maps</Button>
                    </div>
                  </div>
                </div>

                {/* right: sunrise/sunset times and extra */}
                <div className={clsx("p-3 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  <div className="text-xs opacity-60 mb-2">Sunrise & Sunset (local time)</div>

                  {loadingSun ? (
                    <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                  ) : !sunResp ? (
                    <div className="py-6 text-sm opacity-60">No sun data — try selecting a place or refresh.</div>
                  ) : (
                    <div className="space-y-2">
                      {timeFields.map((t) => renderTimeRow(t))}
                    </div>
                  )}

                  <Separator className="my-3" />

                  <div className="text-xs opacity-60">Notes</div>
                  <div className="text-sm mt-1 opacity-70">
                    Times are from <span className="font-medium">sunrise-sunset.org</span>. API returns UTC ISO timestamps; displayed here as local time for clarity.
                  </div>
                </div>
              </div>



              {/* Inline raw toggle area */}
              <AnimatePresence>
                {rawVisible && rawSunResp && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("mt-3 p-3 rounded-md border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-medium mb-2">Raw API</div>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 240 }}>
                      {prettyJSON(rawSunResp)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* Right: Quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="text-sm font-semibold">Quick Actions</div>
          <div className="text-xs opacity-60">Common utilities for this place</div>

          <div className="mt-3 space-y-2">
            <Button onClick={copyCoords} className="w-full"><Copy /> Copy coordinates</Button>
            <Button onClick={downloadJSON} className="w-full" variant="outline"><Download /> Download JSON</Button>
            <Button onClick={() => setRawDialogOpen(true)} className="w-full" variant="ghost"><Globe /> View raw API</Button>
            <Button onClick={() => fetchSunriseForCoords(Number(place.lat), Number(place.lon))} className="w-full"><Loader2 className={loadingSun ? "animate-spin" : ""} /> Refresh times</Button>
            <Button onClick={openInOSM} variant="ghost" className="w-full"><MapPin /> Open on OSM</Button>
            <Button onClick={openInGoogleMaps} variant="ghost" className="w-full"><ExternalLink /> Google Maps</Button>
          </div>

          <Separator />

          <div>
            <div className="text-xs opacity-60">About</div>
            <div className="text-sm mt-1 opacity-70">
              This UI uses OpenStreetMap for tiles & Nominatim for geocoding (place search). Sunrise data is from sunrise-sunset.org (no API key).
            </div>
          </div>
        </aside>
      </main>

      {/* Dialog: raw response */}
      <Dialog open={rawDialogOpen} onOpenChange={setRawDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Raw API response</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", flexDirection: "column" }}>
            <div className="p-4 flex-1 overflow-auto">
              <pre className={clsx("text-xs", isDark ? "text-zinc-200" : "text-zinc-900")}>{prettyJSON(rawSunResp || { note: "no data yet" })}</pre>
            </div>

            <DialogFooter className="flex justify-between items-center p-4 border-t">
              <div className="text-xs opacity-60">Sun API raw response</div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setRawDialogOpen(false)}><X /></Button>
                <Button variant="outline" onClick={downloadJSON}><Download /></Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: large map view */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className={clsx("max-w-6xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Map — {place.display_name}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "75vh", width: "100%" }}>
            <MapContainer center={[Number(place.lat), Number(place.lon)]} zoom={12} style={{ height: "100%", width: "100%" }} key={`map-dialog-${place.lat}-${place.lon}`}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[Number(place.lat), Number(place.lon)]}>
                <Popup>
                  <div className="max-w-xs">
                    <div className="font-medium">{place.display_name}</div>
                    <div className="text-xs opacity-70">Lat: {place.lat} • Lon: {place.lon}</div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">OpenStreetMap tiles</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMapDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { openInOSM(); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
