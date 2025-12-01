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
  StarHalf,
  Menu,
  RefreshCw,
  Check,
  FileText,
  Map,
  MapPinOff,
  BrushCleaningIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

// Helper: pretty JSON
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

const DEFAULT = {
  id: "sunrise_sunset",
  name: "Sunrise & Sunset Times",
  category: "Geolocation",
  lat: 36.72016,
  lng: -4.42034,
  description: "Get daily sunrise and sunset times for any latitude and longitude. No API key required.",
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

  // Selected place + responses
  const [place, setPlace] = useState({
    display_name: "Málaga, Spain",
    lat: String(DEFAULT.lat),
    lon: String(DEFAULT.lng),
    type: "city"
  });
  const [sunResp, setSunResp] = useState(null);
  const [rawSunResp, setRawSunResp] = useState(null);

  const [loadingSun, setLoadingSun] = useState(false);
  const [rawVisibleInline, setRawVisibleInline] = useState(false);
  const [rawDialogOpen, setRawDialogOpen] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);

  // sidebar / mobile sheet
  const [randomList, setRandomList] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // copy animation
  const [copied, setCopied] = useState(false);

  const [selectedPlace, setSelectedPlace] = useState(null);


  // debounce
  const timerRef = useRef(null);

  useEffect(() => {
    fetchSunriseForCoords(DEFAULT.lat, DEFAULT.lng);
    fetchRandomPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------
     Search (Nominatim)
  -------------------------- */
  async function searchPlaces(q) {
    if (!q || !q.trim()) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const encoded = encodeURIComponent(q.trim());
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=6&addressdetails=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": "sunrise-sunset-app/1.0 (+your-email-or-domain)" }
      });
      if (!res.ok) {
        setSuggestions([]);
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
    timerRef.current = setTimeout(() => searchPlaces(v), 300);
  }

  function chooseSuggestion(s) {
    if (!s) return;
    setPlace({ display_name: s.display_name, lat: s.lat, lon: s.lon, type: s.type });
    setQuery(s.display_name);
    setShowSuggest(false);
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
      const results = json?.results || {};
      const converted = {};
      Object.entries(results).forEach(([k, v]) => {
        try {
          converted[k] = {
            original: v,
            utc: new Date(v),
            local: new Date(v).toLocaleString(),
            localTimeOnly: new Date(v).toLocaleTimeString()
          };
        } catch {
          converted[k] = { original: v };
        }
      });
      setSunResp({ raw: results, converted });
      showToast?.("success", `Sun times loaded for ${placeObj?.display_name ?? place?.display_name ?? "location"}`);
    } catch (err) {
      console.error("sun API error", err);
      showToast?.("error", "Failed to fetch sunrise/sunset");
    } finally {
      setLoadingSun(false);
    }
  }

  /* --------------------------
     Copy / download / open helpers
  -------------------------- */
  async function copyCoords() {
    const lat = place.lat ?? DEFAULT.lat;
    const lon = place.lon ?? DEFAULT.lng;
    const txt = `${lat}, ${lon}`;
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      showToast?.("success", "Coordinates copied");
    } catch {
      showToast?.("error", "Copy failed");
    }
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

  function openInGoogleMaps() {
    const lat = place.lat ?? DEFAULT.lat;
    const lon = place.lon ?? DEFAULT.lng;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    window.open(url, "_blank");
  }

  function openInOSM() {
    const lat = place.lat ?? DEFAULT.lat;
    const lon = place.lon ?? DEFAULT.lng;
    const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`;
    window.open(url, "_blank");
  }

  /* --------------------------
     Random places (reverse geocode random coords)
     Generates 10 picks for the sidebar/mobile sheet
  -------------------------- */
  async function fetchRandomPlaces() {
    try {
      const picks = [];
      const maxAttempts = 30;
      let attempts = 0;
      while (picks.length < 10 && attempts < maxAttempts) {
        attempts++;
        // random lat in [-60, 75], lon in [-180, 180]
        const lat = (Math.random() * 135 - 60).toFixed(6);
        const lon = (Math.random() * 360 - 180).toFixed(6);
        // reverse geocode
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`;
        try {
          const res = await fetch(url, {
            headers: { "User-Agent": "sunrise-sunset-app/1.0 (+your-email-or-domain)" }
          });
          if (!res.ok) continue;
          const j = await res.json();
          // ensure display_name exists and not duplicate
          if (j?.display_name && !picks.some((p) => p.display_name === j.display_name)) {
            picks.push({
              display_name: j.display_name,
              lat: String(lat),
              lon: String(lon),
              type: j?.type || "place"
            });
          }
        } catch (e) {
          // ignore failed reverse geocode
        }
      }
      setRandomList(picks);
    } catch (err) {
      console.error("random places error", err);
    }
  }

  /* --------------------------
     Time fields + render helper
  -------------------------- */
  const timeFields = useMemo(() => [
    { key: "astronomical_twilight_begin", label: "Astronomical Dawn", Icon: Star, color: "text-violet-400" },
    { key: "nautical_twilight_begin", label: "Nautical Dawn", Icon: CloudSun, color: "text-sky-400" },
    { key: "civil_twilight_begin", label: "Civil Dawn", Icon: Sunrise, color: "text-amber-300" },
    { key: "sunrise", label: "Sunrise", Icon: Sun, color: "text-amber-400" },
    { key: "solar_noon", label: "Solar Noon", Icon: SunDim, color: "text-yellow-400" },
    { key: "sunset", label: "Sunset", Icon: Sunset, color: "text-orange-400" },
    { key: "civil_twilight_end", label: "Civil Dusk", Icon: Sunset, color: "text-orange-300" },
    { key: "nautical_twilight_end", label: "Nautical Dusk", Icon: CloudMoon, color: "text-indigo-400" },
    { key: "astronomical_twilight_end", label: "Astronomical Dusk", Icon: StarHalf, color: "text-purple-400" },
    { key: "day_length", label: "Day Length", Icon: Clock, color: "text-blue-400" }
  ], [isDark]);

  function renderTimeRow(item) {
    const { key, label, Icon, color } = item;
    const conv = sunResp?.converted?.[key];
    if (!conv) return null;

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

  /* --------------------------
     Google Maps iframe helper (no API key required)
     -------------------------- */
  function googleMapsEmbedSrc(lat, lon, zoom = 12) {
    // Using maps?q= with output=embed — reliable for coordinate preview
    return `https://www.google.com/maps?q=${lat},${lon}&z=${zoom}&output=embed`;
  }

  /* --------------------------
     Render
  -------------------------- */
  return (
    <div className={clsx("min-h-screen pb-10 p-4 md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-start flex-wrap md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" className="p-2 rounded-md cursor-pointer"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs p-3">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">Locations</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => fetchRandomPlaces()} className="cursor-pointer"><RefreshCw /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setSheetOpen(false)} className="cursor-pointer"><X /></Button>
                  </div>
                </div>

                <ScrollArea style={{ height: 620 }}>
                 <div className="space-y-2">
  {randomList.map((r, idx) => {
    const isSelected = selectedPlace?.display_name === r.display_name;

    return (
      <div
        key={`${r.display_name}-${idx}`}
        className={`
          flex items-start gap-3 p-2 rounded-md cursor-pointer
          hover:bg-zinc-100 dark:hover:bg-zinc-800
          ${isSelected ? "border border-zinc-500 bg-zinc-500/10 dark:bg-zinc-500/20" : "border border-transparent"}
        `}
        onClick={() => { 
          setSelectedPlace(r); 
          setSheetOpen(false); 
          fetchSunriseForCoords(Number(r.lat), Number(r.lon), r); 
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium">{r.display_name}</div>
          <div className="text-xs opacity-60">{r.lat} • {r.lon}</div>
        </div>
        <Badge className="ml-2 glassy-badge">#{idx + 1}</Badge>
      </div>
    );
  })}

  {randomList.length === 0 && (
    <div className="text-sm opacity-60 p-2">No picks yet — try refresh.</div>
  )}
</div>

                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className={clsx("text-2xl md:text-3xl font-extrabold")}>Sunrise & Sunset — Explorer</h1>
            <p className="text-xs opacity-70">Find places, preview coordinates and view sun times.</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (suggestions.length > 0) chooseSuggestion(suggestions[0]); }} className={clsx("relative w-full md:w-[640px]")}>
          <div className={clsx("flex items-center gap-2 rounded-lg px-3 py-2 shadow-sm", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search a place (city, address, landmark)…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
            <Button variant="ghost" onClick={() => { setRawVisibleInline((s) => !s); }} className="ml-2 cursor-pointer" title="Toggle raw inline"><FileText /></Button>
          </div>

          <AnimatePresence>
            {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={clsx("absolute left-0 right-0 mt-2 max-h-80 overflow-auto rounded-xl shadow-2xl z-50", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
              >
                {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
                {suggestions.map((s, idx) => (
                  <li key={s.place_id ?? s.osm_id ?? idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseSuggestion(s)}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{s.display_name}</div>
                        <div className="text-xs opacity-60 mt-1">Lat: {s.lat} • Lon: {s.lon}</div>
                      </div>
                      <div className="text-xs opacity-60">{s.type ?? ""}</div>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </form>
      </header>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left (desktop) — random picks */}
        <aside className={clsx("hidden lg:block lg:col-span-3 space-y-4 rounded-2xl p-4", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold flex items-center gap-2"><Map /> Random Picks</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => fetchRandomPlaces()} className="cursor-pointer"><RefreshCw /></Button>
              <Button variant="ghost" size="sm" onClick={() => { setRandomList([]); }} className="cursor-pointer"><BrushCleaningIcon /></Button>
            </div>
          </div>

          <ScrollArea className="overflow-y-auto" style={{ maxHeight: 520 }}>
         <div className="space-y-2">
  {randomList.map((r, idx) => {
    const isSelected = selectedPlace?.display_name === r.display_name;

    return (
      <div
        key={`${r.display_name}-${idx}`}
        className={`
          flex items-start gap-3 p-2 rounded-md cursor-pointer
          hover:bg-zinc-100 dark:hover:bg-zinc-800
          ${isSelected ? "border border-zinc-500 bg-zinc-500/10 dark:bg-zinc-500/20" : "border border-transparent"}
        `}
        onClick={() => { 
          setSelectedPlace(r); 
          setSheetOpen(false); 
          fetchSunriseForCoords(Number(r.lat), Number(r.lon), r); 
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium">{r.display_name}</div>
          <div className="text-xs opacity-60">{r.lat} • {r.lon}</div>
        </div>
        <Badge className="ml-2 glassy-badge">#{idx + 1}</Badge>
      </div>
    );
  })}

  {randomList.length === 0 && (
    <div className="text-sm opacity-60 p-2">No picks yet — try refresh.</div>
  )}
</div>

          </ScrollArea>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About</div>
            <div className="text-xs opacity-70">
              Uses Nominatim for geocoding and sunrise-sunset.org for sun times. Map preview uses Google Maps embed for fast previews.
            </div>
          </div>
        </aside>

        {/* Center: main preview */}
        <section className={clsx("lg:col-span-6 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-3"><Sun /> Place & Sun Times</CardTitle>
                <div className="text-xs opacity-60">{place?.display_name ?? "Select a place to view details"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setRawVisibleInline((s) => !s)} className="cursor-pointer"><FileText /></Button>
                <Button variant="outline" onClick={() => fetchSunriseForCoords(Number(place.lat), Number(place.lon))} className="cursor-pointer"><Loader2 className={loadingSun ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" onClick={() => setMapDialogOpen(true)} className="cursor-pointer"><Map /></Button>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              <div className="flex flex-col-reverse  gap-4">
                {/* Left: map preview iframe */}
                <div className={clsx("rounded-xl overflow-hidden border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  <div className="relative" style={{ paddingTop: "56.25%" }}>
                    <iframe
                      title="Google Maps Preview"
                      src={googleMapsEmbedSrc(place.lat || DEFAULT.lat, place.lon || DEFAULT.lng, 12)}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                      loading="lazy"
                    />
                  </div>

                  <div className="p-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs opacity-60">Coordinates</div>
                      <div className="font-medium">{place.lat} • {place.lon}</div>
                    </div>

                    <div className="flex flex-col gap-2">
                    

                      <Button variant="outline" onClick={() => openInGoogleMaps()} className="cursor-pointer"><ExternalLink /> Open</Button>
                    </div>
                  </div>
                </div>

                {/* Right: details & times */}
                <div className={clsx("rounded-xl p-3 border flex flex-col gap-3", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  <div className="flex items-start gap-3">
                    <div>
                      <div className="text-xs opacity-60">Place</div>
                      <div className="font-semibold">{place.display_name}</div>
                      <div className="text-xs opacity-60 mt-1">{place.type}</div>
                    </div>
                    <div className="ml-auto text-right">
                      <Badge className="glassy-badge">Preview</Badge>
                      <div className="text-xs opacity-60 mt-1">Source: sunrise-sunset.org</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-xs opacity-60">Times (local)</div>

                  {loadingSun ? (
                    <div className="py-6 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                  ) : !sunResp ? (
                    <div className="py-4 text-sm opacity-60">No sun data — select a place or refresh.</div>
                  ) : (
                    <div className="space-y-2 sm:grid grid-cols-2 gap-2">
                      {timeFields.map((t) => renderTimeRow(t))}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2 items-center">
                    <Button onClick={() => setRawDialogOpen(true)} variant="outline" className="cursor-pointer"><Globe /> Raw</Button>
                    <Button onClick={downloadJSON} variant="ghost" className="cursor-pointer"><Download /> Export</Button>
                    <div className="ml-auto text-xs opacity-60">Updated: {rawSunResp?.status ?? "—"}</div>
                  </div>
                </div>
              </div>

              {/* Inline Raw JSON (collapsible) */}
              <AnimatePresence>
                {rawVisibleInline && rawSunResp && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("mt-4 p-3 rounded-md border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-medium mb-2 flex items-center gap-2"><FileText /> Raw API response</div>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 240 }}>{prettyJSON(rawSunResp)}</pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Quick Actions</div>
            <Button variant="ghost" size="sm" onClick={() => fetchRandomPlaces()} className="cursor-pointer"><RefreshCw /></Button>
          </div>

          <div className="text-xs opacity-60">Tools for this location</div>
          <div className="mt-2 space-y-2">
            <Button onClick={copyCoords} className="w-full cursor-pointer"><Copy /> Copy coordinates</Button>
            <Button onClick={downloadJSON} className="w-full cursor-pointer" variant="outline"><Download /> Download JSON</Button>
            <Button onClick={() => setRawDialogOpen(true)} className="w-full cursor-pointer" variant="ghost"><FileText /> View raw</Button>
            <Button onClick={() => fetchSunriseForCoords(Number(place.lat), Number(place.lon))} className="w-full cursor-pointer"><Loader2 className={loadingSun ? "animate-spin" : ""} /> Refresh times</Button>
            <Button onClick={() => openInGoogleMaps()} className="w-full cursor-pointer" variant="ghost"><ExternalLink /> Open in Google Maps</Button>
            <Button onClick={() => openInOSM()} className="w-full cursor-pointer" variant="ghost"><MapPin /> Open in OSM</Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-1">Notes</div>
            <div className="text-xs opacity-70">
              This UI uses Nominatim (OpenStreetMap) for geocoding and <span className="font-medium">sunrise-sunset.org</span> for times. Map preview uses Google Maps embed.
            </div>
          </div>
        </aside>
      </main>

      {/* Raw response dialog */}
      <Dialog open={rawDialogOpen} onOpenChange={setRawDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
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

      {/* Map dialog (large Google Maps preview) */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className={clsx("max-w-6xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Map — {place.display_name}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "75vh", width: "100%" }}>
            <iframe
              title="Google Maps Large"
              src={googleMapsEmbedSrc(place.lat || DEFAULT.lat, place.lon || DEFAULT.lng, 12)}
              style={{ width: "100%", height: "100%", border: 0 }}
              loading="lazy"
            />
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Google Maps preview</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMapDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => openInGoogleMaps()}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
