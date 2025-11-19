// IssMapPage.jsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Loader2,
  RefreshCw,
  ExternalLink,
  Download,
  Copy,
  Globe,
  Eye,
  Satellite,
  Star
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

// Map: react-leaflet
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ---------- Open Notify endpoint ---------- */
const ISS_ENDPOINT = "/api/iss/iss-now.json";

/* ---------- small city suggestions (for search) ---------- */
// Lightweight suggestions to demonstrate the suggestion UI.
// You can replace with a geocoding API for real suggestions.
const CITY_SUGGESTIONS = [
  { id: "new_york", name: "New York, USA", lat: 40.7128, lon: -74.0060 },
  { id: "london", name: "London, UK", lat: 51.5074, lon: -0.1278 },
  { id: "delhi", name: "New Delhi, India", lat: 28.6139, lon: 77.2090 },
  { id: "tokyo", name: "Tokyo, Japan", lat: 35.6895, lon: 139.6917 },
  { id: "sydney", name: "Sydney, Australia", lat: -33.8688, lon: 151.2093 },
  { id: "cape_town", name: "Cape Town, SA", lat: -33.9249, lon: 18.4241 },
];

const defaultCenter = [20, 0]; // initial map center (lat, lon)

/* ---------- Helper: custom marker icon for ISS ---------- */
const createIssIcon = () => {
  return new L.DivIcon({
    html: `<div class="rounded-full p-1 shadow-md" style="background:linear-gradient(135deg,#0ea5e9,#7c3aed);width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M20 7l-4 1M4 7l4 1M12 22v-4M7 7l10 10"/></svg>
           </div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

export default function IssMapPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // ISS state
  const [iss, setIss] = useState(null); // { latitude, longitude, timestamp, raw }
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(true); // follow ISS (auto-center)
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedCity, setSelectedCity] = useState(CITY_SUGGESTIONS[0]);
  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const mapRef = useRef(null);
  const issMarkerRef = useRef(null);
  const pollRef = useRef(null);

  // Fetch latest ISS position
  const fetchIss = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(ISS_ENDPOINT, { cache: "no-store" });
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const json = await res.json();
      // expected structure:
      // { message: "success", timestamp: 123456789, iss_position: { latitude: "12.34", longitude: "56.78" } }
      const pos = json.iss_position || {};
      const latitude = parseFloat(pos.latitude);
      const longitude = parseFloat(pos.longitude);
      const timestamp = (json.timestamp && Number(json.timestamp)) || Date.now();
      const next = { latitude, longitude, timestamp, raw: json };
      setIss(next);
      // optionally recenter map if following
      if (following && mapRef.current) {
        try {
          const map = mapRef.current;
          map.setView([latitude, longitude], map.getZoom(), { animate: true });
        } catch (e) {
          // harmless
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("ISS fetch error:", err);
      showToast("error", "Failed to fetch ISS position");
      setLoading(false);
    }
  }, [following]);

  // Poll ISS every 5 seconds (configurable)
  useEffect(() => {
    // initial fetch
    fetchIss();
    // clear previous poll
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    pollRef.current = setInterval(fetchIss, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchIss]);

  // Suggestions: lightweight fuzzy match on CITY_SUGGESTIONS
  useEffect(() => {
    if (!query || query.trim() === "") {
      setSuggestions([]);
      return;
    }
    const q = query.toLowerCase();
    const matched = CITY_SUGGESTIONS.filter((c) => c.name.toLowerCase().includes(q));
    setSuggestions(matched);
  }, [query]);

  // When selecting a city, center the map and show details
  const chooseCity = (city) => {
    setSelectedCity(city);
    setQuery(city.name);
    setShowSuggest(false);
    setFollowing(false);
    setMapCenter([city.lat, city.lon]);
    // set map view if available
    if (mapRef.current) {
      try {
        mapRef.current.setView([city.lat, city.lon], 5, { animate: true });
      } catch (e) {}
    }
  };

  const copyCoords = async () => {
    if (!iss) return showToast("info", "No ISS position yet");
    const txt = `${iss.latitude}, ${iss.longitude} (timestamp: ${new Date(iss.timestamp * 1000).toISOString()})`;
    await navigator.clipboard.writeText(txt);
    showToast("success", "Coordinates copied");
  };

  const downloadJson = () => {
    const payload = iss?.raw || { message: "no data" };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `iss_position_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  };

  const openExternal = () => {
    if (!iss) return showToast("info", "No ISS position yet");
    const lat = iss.latitude, lon = iss.longitude;
    // open in OpenStreetMap
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=5/${lat}/${lon}`, "_blank", "noopener,noreferrer");
  };

  // A small helper to compute distance in km between two lat/lon (Haversine)
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180.0;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Map center setter for MapContainer when created
  const onMapReady = (mapInstance) => {
    mapRef.current = mapInstance;
  };

  /* ---------- render ---------- */
  return (
    <div className={clsx("min-h-screen p-6 max-w-9xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Aurora — ISS Tracker</h1>
          <p className="mt-1 text-sm opacity-70">Real-time position of the International Space Station. Big map showcase + quick actions.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={(e) => { e.preventDefault(); if (suggestions.length > 0) chooseCity(suggestions[0]); }} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search cities (example: 'London')"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggest(true); }}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              aria-label="Search cities"
            />
            <Button type="button" variant="outline" onClick={() => { setQuery(""); setShowSuggest(false); }} className="px-3">Clear</Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {suggestions.map((s) => (
              <li key={s.id} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseCity(s)}>
                <div className="flex items-center gap-3">
                  <MapPin className="opacity-70" />
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-60">Lat: {s.lat} • Lon: {s.lon}</div>
                  </div>
                  <div className="text-xs opacity-60">Preset</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout: left (details), center (map), right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: details / search results */}
        <section className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Location</CardTitle>
                <div className="text-xs opacity-60">Selected city and proximity to ISS</div>
              </div>
              <div className="text-xs opacity-60">{selectedCity?.name}</div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-xs opacity-60">City</div>
                  <div className="font-medium">{selectedCity?.name}</div>
                </div>

                <div>
                  <div className="text-xs opacity-60">Coordinates</div>
                  <div className="font-medium">{selectedCity?.lat}, {selectedCity?.lon}</div>
                </div>

                <Separator />

                <div>
                  <div className="text-xs opacity-60">ISS Position</div>
                  {iss ? (
                    <div className="space-y-1">
                      <div className="font-medium">{iss.latitude.toFixed(5)}, {iss.longitude.toFixed(5)}</div>
                      <div className="text-xs opacity-60">Updated: {new Date(iss.timestamp * 1000).toLocaleString()}</div>
                      <div className="text-sm">
                        Distance to {selectedCity?.name}:{" "}
                        <span className="font-semibold">{haversineDistance(selectedCity.lat, selectedCity.lon, iss.latitude, iss.longitude).toFixed(1)} km</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm opacity-60">Waiting for ISS data…</div>
                  )}
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => { setFollowing((s) => !s); showToast("success", following ? "Disabled follow" : "Following ISS"); }}><Eye /> {following ? "Following" : "Follow"}</Button>
                  <Button variant="outline" onClick={() => fetchIss()}><RefreshCw /> Refresh</Button>
                  <Button variant="outline" onClick={() => { setDialogOpen(true); }}><Globe /> View raw</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick info card */}
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">About</CardTitle>
                <div className="text-xs opacity-60">Open Notify / ISS Current Location</div>
              </div>
              <Satellite className="opacity-60" />
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-relaxed">
                This page fetches the ISS position from the Open Notify API and shows it on the map. Use the search to center the map on a city and see the distance between that city and the ISS in real-time.
              </p>

              <Separator className="my-3" />

              <div className="flex flex-col gap-2">
                <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(ISS_ENDPOINT); showToast("success", "Endpoint copied"); }}><Copy /> Copy endpoint</Button>
                <Button variant="ghost" onClick={() => downloadJson()}><Download /> Download last JSON</Button>
                <Button variant="ghost" onClick={() => { if (iss) openExternal(); else showToast("info", "No ISS pos"); }}><ExternalLink /> Open in OSM</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Center: large map */}
        <section className="lg:col-span-6 h-[70vh] md:h-[80vh]">
          <Card className={clsx("rounded-2xl overflow-hidden h-full border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-center gap-3">
                <MapPin />
                <div>
                  <div className="text-sm font-medium">Live Map</div>
                  <div className="text-xs opacity-60">Large interactive map — drag, zoom and inspect</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm opacity-60">{iss ? `ISS: ${iss.latitude.toFixed(3)}, ${iss.longitude.toFixed(3)}` : "No data yet"}</div>
                {loading && <Loader2 className="animate-spin" />}
                <Button variant="ghost" onClick={() => { setFollowing((s) => !s); showToast("success", following ? "Disabled follow" : "Following ISS"); }}>{following ? "Unfollow" : "Follow"}</Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 h-full">
              <div className="h-full w-full">
                <MapContainer
                  center={mapCenter}
                  zoom={2}
                  whenCreated={onMapReady}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                  />

                  {/* ISS marker */}
                  {iss && (
                    <>
                      <Marker
                        position={[iss.latitude, iss.longitude]}
                        icon={createIssIcon()}
                        ref={issMarkerRef}
                      >
                        <Popup>
                          <div className="text-sm">
                            <div className="font-semibold">International Space Station</div>
                            <div className="text-xs opacity-60">Updated: {new Date(iss.timestamp * 1000).toLocaleString()}</div>
                            <div className="mt-2">
                              <Button variant="link" size="sm" onClick={() => openExternal()}><ExternalLink /> Open in OSM</Button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>

                      {/* a faint circle to show a small area around ISS */}
                      <Circle center={[iss.latitude, iss.longitude]} radius={200000} pathOptions={{ opacity: 0.12, color: "#60a5fa" }} />
                    </>
                  )}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <div className="text-xs opacity-60">Utilities and share</div>
              </div>
              <Star className="opacity-60" />
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-2">
                <Button onClick={() => copyCoords()} variant="outline"><Copy /> Copy coordinates</Button>
                <Button onClick={() => downloadJson()} variant="outline"><Download /> Download JSON</Button>
                <Button onClick={() => openExternal()} variant="outline"><ExternalLink /> Open in OSM</Button>
                <Button onClick={() => { if (iss) { window.open(`https://www.google.com/maps/@${iss.latitude},${iss.longitude},6z`, "_blank", "noopener,noreferrer"); } else { showToast("info", "No ISS position"); } }} variant="outline"><Globe /> Open in Google Maps</Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Raw JSON Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>ISS Raw Response</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "60vh", overflow: "auto", padding: 16 }}>
            <pre className={clsx("text-xs", isDark ? "text-zinc-200" : "text-zinc-900")}>
              {JSON.stringify(iss?.raw || { message: "no data" }, null, 2)}
            </pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Open Notify — iss-now.json</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => downloadJson()}><Download /> Download</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
