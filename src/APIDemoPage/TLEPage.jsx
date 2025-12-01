// src/pages/TLEPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  X,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Satellite,
  List,
  Globe,
  Eye,
  Menu,
  Orbit,
  Telescope,
  Layers,
  BadgeCheck,
  MapPin,
  Check,
  RefreshCw,
  Film,
  Clock,
  Map,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

import { useTheme } from "@/components/theme-provider";

// leaflet + react-leaflet
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// satellite.js for TLE -> lat/lon/alt computation
import * as satellite from "satellite.js";

/* ---------- Endpoint (TLE) ---------- */
const BASE_TLE_ENDPOINT = "https://tle.ivanstanojevic.me/api/tle";

/* ---------- Satellite list (heroes) ---------- */
const POPULAR_SATELLITES = [
  { name: "ISS (ZARYA)", id: "25544" },
  { name: "Hubble Space Telescope", id: "20580" },
  { name: "NOAA 19", id: "33591" },
  { name: "Terra (EOS AM-1)", id: "25994" },
  { name: "Aqua (EOS PM-1)", id: "27424" },
  { name: "GPS BIIR-2 (PRN 02)", id: "24876" },
  { name: "Envisat", id: "27386" },
  { name: "Landsat 8", id: "39084" },
  { name: "Sentinel-2B", id: "42063" },
  { name: "Iridium 33", id: "24946" },
];

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function normalizeTleResponse(json) {
  if (!json) return null;
  if (json.line1 && json.line2) {
    return {
      name: json.name || json.satname || `NORAD ${json.id || "?"}`,
      line1: json.line1,
      line2: json.line2,
      raw: json,
    };
  }
  if (typeof json.tle === "string") {
    const parts = json.tle.trim().split(/\r?\n/);
    return {
      name: json.name || json.satname || `NORAD ${json.id || "?"}`,
      line1: parts[0] || "",
      line2: parts[1] || "",
      raw: json,
    };
  }
  const strings = Object.values(json || {}).filter((v) => typeof v === "string");
  for (let s of strings) {
    if (/\n/.test(s) && /(^|\n)1 /.test(s) && /(^|\n)2 /.test(s)) {
      const parts = s.trim().split(/\r?\n/);
      return { name: json.name || `NORAD`, line1: parts[0], line2: parts[1], raw: json };
    }
  }
  return { raw: json };
}

function parseTleLines(line1, line2) {
  if (!line1 || !line2) return null;
  try {
    const satno = line1.slice(2, 7).trim();
    const epoch = line1.slice(18, 32).trim();
    const inclination = line2.slice(8, 16).trim();
    const raan = line2.slice(17, 25).trim();
    const eccentricity = line2.slice(26, 33).trim();
    const argPerigee = line2.slice(34, 42).trim();
    const meanAnomaly = line2.slice(43, 51).trim();
    const meanMotion = line2.slice(52, 63).trim();
    return { satno, epoch, inclination, raan, eccentricity, argPerigee, meanAnomaly, meanMotion };
  } catch {
    return null;
  }
}

function footprintRadiusKm(altKm) {
  const Re = 6371;
  if (!Number.isFinite(altKm) || altKm < 0) return 0;
  const central = Math.acos(Re / (Re + altKm));
  return Re * central;
}

const DefaultMarker = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/* ---------- Component ---------- */
export default function TLEPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [query, setQuery] = useState("");
  const [rawResp, setRawResp] = useState(null);
  const [normalized, setNormalized] = useState(null);
  const [parsed, setParsed] = useState(null);

  const [selectedId, setSelectedId] = useState("25544");
  const [sidebarList, setSidebarList] = useState(() => pickRandom(POPULAR_SATELLITES, 10));

  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mapFullOpen, setMapFullOpen] = useState(false);

  // map / propagation state
  const [positionLL, setPositionLL] = useState(null); // [lat, lon]
  const [altKm, setAltKm] = useState(null);
  const [groundTrack, setGroundTrack] = useState([]); // array of [lat, lon]
  const [footprintKm, setFootprintKm] = useState(0);

  // suggestions and UI
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // timers & refs
  const intervalRef = useRef(null);
  const suggestTimer = useRef(null);

  useEffect(() => {
    // initial picks
    setSidebarList(pickRandom(POPULAR_SATELLITES, 10));
    fetchTleById(selectedId);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Fetch TLE ---------- */
  async function fetchTleById(idOrQuery) {
    if (!idOrQuery) return;
    setLoading(true);
    try {
      // prefer exact numeric if present, else match sidebar names
      const candidate = sidebarList.find(
        (s) => s.id === String(idOrQuery) || s.name.toLowerCase().includes(String(idOrQuery).toLowerCase())
      );
      const id = candidate ? candidate.id : String(idOrQuery);

      const res = await fetch(`${BASE_TLE_ENDPOINT}/${encodeURIComponent(id)}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        showToast("error", `TLE fetch failed (${res.status}) ${txt}`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setRawResp(json);
      const norm = normalizeTleResponse(json);
      const p = parseTleLines(norm?.line1 || "", norm?.line2 || "");
      setNormalized(norm);
      setParsed(p || null);
      setSelectedId(id);
      showToast("success", `Loaded TLE for ${norm?.name || id}`);

      // compute map/track
      startPropagation(norm);
    } catch (err) {
      console.error(err);
      showToast("error", "Network error while fetching TLE");
    } finally {
      setLoading(false);
    }
  }

  function pickRandom(arr, n = 10) {
    const source = Array.isArray(arr) ? [...arr] : [];
    for (let i = source.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [source[i], source[j]] = [source[j], source[i]];
    }
    return source.slice(0, Math.min(n, source.length));
  }

  /* ---------- Propagation / Map ---------- */
  function startPropagation(tleObj) {
    if (!tleObj || !tleObj.line1 || !tleObj.line2) {
      setPositionLL(null);
      setGroundTrack([]);
      setFootprintKm(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    let satrec;
    try {
      satrec = satellite.twoline2satrec(tleObj.line1, tleObj.line2);
    } catch (e) {
      console.error("satellite.twoline2satrec error", e);
      showToast("error", "Failed to parse TLE (satellite.js)");
      return;
    }

    function computeNowAndTrack() {
      try {
        const now = new Date();
        const eci = satellite.propagate(satrec, now);
        if (!eci || !eci.position) return;

        const gmst = satellite.gstime(now);
        const geo = satellite.eciToGeodetic(eci.position, gmst);
        const latDeg = satellite.radiansToDegrees(geo.latitude);
        const lonDeg = satellite.radiansToDegrees(geo.longitude);
        const heightKm = geo.height || 0;

        setPositionLL([latDeg, lonDeg]);
        setAltKm(Number(heightKm));
        setFootprintKm(footprintRadiusKm(Number(heightKm)));

        // build track +/- 90 minutes every 2 minutes
        const track = [];
        const minutes = 90;
        for (let dt = -minutes; dt <= minutes; dt += 2) {
          const t = new Date(now.getTime() + dt * 60 * 1000);
          const e = satellite.propagate(satrec, t);
          if (!(e && e.position)) continue;
          const gm = satellite.gstime(t);
          const g = satellite.eciToGeodetic(e.position, gm);
          const la = satellite.radiansToDegrees(g.latitude);
          const lo = satellite.radiansToDegrees(g.longitude);
          const lonNorm = ((lo + 180) % 360) - 180;
          track.push([la, lonNorm]);
        }
        setGroundTrack(track);
      } catch (err) {
        console.error("prop error", err);
      }
    }

    computeNowAndTrack();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => computeNowAndTrack(), 1000);
  }

  /* ---------- Search suggestions ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setLoadingSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const q = String(v || "").trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      // numeric suggestion (extract digits)
      const numericMatch = (q.match(/\d{3,6}/) || [null])[0];
      const filtered = sidebarList
        .concat(POPULAR_SATELLITES)
        .filter((s, idx, arr) => {
          // unique by id
          return arr.findIndex((a) => a.id === s.id) === idx;
        })
        .filter((s) => s.name.toLowerCase().includes(q) || s.id.includes(q) || (numericMatch && s.id === numericMatch))
        .slice(0, 8);
      setSuggestions(filtered);
      setLoadingSuggest(false);
    }, 220);
  }

  /* ---------- Actions ---------- */
  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim() === "") {
      showToast("info", "Enter a NORAD ID or satellite name (e.g. 25544)");
      return;
    }
    const numeric = (query.match(/\d{3,6}/) || [query])[0];
    await fetchTleById(numeric || query);
    setSuggestions([]);
  }

  async function copyTleToClipboard() {
    if (!normalized?.line1 || !normalized?.line2) {
      showToast("info", "No TLE to copy");
      return;
    }
    const text = `${normalized.line1}\n${normalized.line2}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      showToast("success", "TLE copied");
    } catch {
      showToast("error", "Copy failed");
    }
  }

  function downloadJson() {
    const payload = rawResp || normalized || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safeName = (normalized?.name || selectedId || "tle").replace(/\s+/g, "_");
    a.download = `tle_${safeName}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ---------- small helpers ---------- */
  function glassBadge(text, className = "") {
    return (
      <div
        className={clsx(
          "px-3 py-1 rounded-full text-xs border transition backdrop-blur-sm",
          isDark ? "bg-white/6 border-white/6" : "bg-white/30 border-zinc-100",
          className
        )}
      >
        {text}
      </div>
    );
  }

  /* leaflet dark tiles (CartoDB Dark Matter) */
  const darkTilesURL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const darkAttribution = '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors';

  return (
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-9xl mx-auto", isDark ? "text-white" : "text-zinc-900")}>
      {/* Header */}
      <header className="flex items-start md:items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden cursor-pointer">
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[320px] overflow-y-auto z-999 p-3">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Telescope />
                    <div>
                      <div className="font-semibold">Quick picks</div>
                      <div className="text-xs opacity-60">Tap to load</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="cursor-pointer" onClick={() => setSidebarList(pickRandom(POPULAR_SATELLITES, 10))}>
                      <RefreshCw />
                    </Button>
                   
                  </div>
                </div>

                <Separator />

                <ScrollArea className="mt-3 h-[70vh]">
                          <div className="space-y-2">
              {sidebarList.map((s) => {
                const isSelected = String(s.id) === String(selectedId);
                return (
                  <motion.div
                    key={s.id}
                    whileHover={{ scale: 1.01 }}
                    className={clsx(
                      "p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition",
                      isSelected ? (isDark ? "bg-white/6 border-white/20" : "bg-zinc-50 border-zinc-200") : "hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30"
                    )}
                    onClick={() => {fetchTleById(s.id) }}
                    role="button"
                  >
                    <div className="w-10 h-10 rounded-md bg-zinc-600/10 flex items-center justify-center">
                      <MapPin />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs opacity-60">#{s.id}</div>
                    </div>
                    {isSelected ? (
                      <div className="flex items-center gap-2">
                        <BadgeCheck className={isDark ? "text-zinc-300" : "text-zinc-600"} />
                      </div>
                    ) : (
                      <div className="text-xs opacity-60">→</div>
                    )}
                  </motion.div>
                );
              })}
            </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-zinc-800 flex items-center justify-center shadow">
            <Orbit />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Orbital — TLE Explorer</h1>
            <p className="text-xs opacity-70">Map visualization, ground track & footprint (live)</p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className={clsx("relative flex items-center gap-2 p-2 rounded-lg border w-full md:w-[520px]", isDark ? "border-zinc-800 bg-black/40" : "border-zinc-200 bg-white/90")}>
          <Search className="opacity-60" />
          <Input
            placeholder="Search by name or NORAD ID (e.g. 25544)"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="border-0 bg-transparent"
            aria-label="Search satellite"
          />
          <Button type="submit" variant="outline" className="cursor-pointer">
            Search
          </Button>

          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={clsx("absolute left-0 right-0 top-full mt-2 max-h-64 overflow-auto rounded-xl shadow-2xl z-50", isDark ? "bg-black/70 border border-zinc-800" : "bg-white border border-zinc-200")}
              >
                {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    onClick={() => {
                      setQuery(s.id);
                      fetchTleById(s.id);
                      setSuggestions([]);
                    }}
                    className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                    role="option"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <MapPin />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{s.name}</div>
                        <div className="text-xs opacity-60 truncate">#{s.id}</div>
                      </div>
                      <div className="text-xs opacity-60">Load</div>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </form>
      </header>

      {/* Main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Telescope /> Quick list
            </div>
            <div className="text-xs opacity-60">10 random</div>
          </div>

          <ScrollArea className="h-[70vh]">
            <div className="space-y-2">
              {sidebarList.map((s) => {
                const isSelected = String(s.id) === String(selectedId);
                return (
                  <motion.div
                    key={s.id}
                    whileHover={{ scale: 1.01 }}
                    className={clsx(
                      "p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition",
                      isSelected ? (isDark ? "bg-white/6 border-white/20" : "bg-zinc-50 border-zinc-200") : "hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30"
                    )}
                    onClick={() => fetchTleById(s.id)}
                    role="button"
                  >
                    <div className="w-10 h-10 rounded-md bg-zinc-600/10 flex items-center justify-center">
                      <MapPin />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs opacity-60">#{s.id}</div>
                    </div>
                    {isSelected ? (
                      <div className="flex items-center gap-2">
                        <BadgeCheck className={isDark ? "text-zinc-300" : "text-zinc-600"} />
                      </div>
                    ) : (
                      <div className="text-xs opacity-60">→</div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="mt-4 flex gap-2">
            <Button className="cursor-pointer" variant="outline" onClick={() => setSidebarList(pickRandom(POPULAR_SATELLITES, 10))}>
              <RefreshCw className="mr-2" /> Shuffle
            </Button>
            <Button className="cursor-pointer" variant="ghost" onClick={() => fetchTleById(selectedId)}>
              <Loader2 className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </aside>

        {/* Center preview + map */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex flex-wrap gap-2 items-start justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers /> Preview
                </CardTitle>
                <div className="text-xs opacity-60">{normalized?.name || "Select a satellite"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="cursor-pointer" onClick={() => fetchTleById(selectedId)}>
                  <Loader2 className={loading ? "animate-spin" : ""} /> Refresh
                </Button>


                <Button variant="outline" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer">
                  <List /> {showRaw ? "Hide raw" : "Raw"}
                </Button>

                <Button variant="ghost" className="cursor-pointer" onClick={() => setMapFullOpen(true)}>
                  <Map /> Full Map
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* TLE & parsed */}
              <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold">{normalized?.name || "—"}</div>
                      {normalized?.name && <div>{glassBadge(`#${parsed?.satno || selectedId}`)}</div>}
                    </div>
                    <div className="text-xs opacity-60 mb-2">{parsed?.epoch ? `Epoch: ${parsed.epoch}` : "Epoch: —"}</div>
                    <pre className="text-sm whitespace-pre-wrap">{(normalized?.line1 && normalized?.line2) ? `${normalized.line1}\n${normalized.line2}` : "No TLE lines"}</pre>
                  </div>

                  <div className="w-36 text-right space-y-2">
                    <div className="text-xs opacity-60">Altitude</div>
                    <div className="font-medium">{altKm ? `${Math.round(altKm)} km` : "—"}</div>

                    <div className="text-xs opacity-60">Footprint</div>
                    <div className="font-medium">{footprintKm ? `${Math.round(footprintKm)} km` : "—"}</div>
                  </div>
                </div>
              </div>

              {/* Map block */}
              <div className="rounded-xl overflow-hidden border" style={{ height: 420 }}>
                {positionLL ? (
                  <MapContainer center={positionLL} zoom={3} style={{ height: "100%", width: "100%" }} preferCanvas={true}>
                    <TileLayer url={darkTilesURL} attribution={darkAttribution} />
                    {groundTrack && groundTrack.length > 0 && <Polyline positions={groundTrack} pathOptions={{ color: "#00d4ff", weight: 2, opacity: 0.9 }} />}
                    <Marker position={positionLL} icon={DefaultMarker}>
                      <Popup>
                        <div className="text-sm">
                          <div className="font-medium">{normalized?.name}</div>
                          <div className="text-xs opacity-70">Alt: {altKm ? `${Math.round(altKm)} km` : "—"}</div>
                        </div>
                      </Popup>
                    </Marker>
                    {positionLL && footprintKm > 0 && (
                      <Circle center={positionLL} radius={footprintKm * 1000} pathOptions={{ color: "orange", opacity: 0.45 }} />
                    )}
                  </MapContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm opacity-60">No position computed yet</div>
                )}
              </div>

              {/* parsed badges */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">{glassBadge(`Inclination: ${parsed?.inclination || "—"}`)}</div>
                <div className="flex items-center gap-2">{glassBadge(`RAAN: ${parsed?.raan || "—"}`)}</div>
                <div className="flex items-center gap-2">{glassBadge(`Eccentricity: ${parsed?.eccentricity || "—"}`)}</div>
                <div className="flex items-center gap-2">{glassBadge(`Mean motion: ${parsed?.meanMotion || "—"}`)}</div>
              </div>

              {/* raw toggle */}
              <AnimatePresence>
                {showRaw && rawResp && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("p-3 rounded-md border overflow-auto", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")} style={{ maxHeight: 220 }}>
                    <pre className="text-xs">{prettyJSON(rawResp)}</pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* Right utilities */}
        <aside className={clsx("lg:col-span-4 rounded-2xl p-4 space-y-4", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold flex items-center gap-2">
              <BadgeCheck /> Actions
            </div>
            <div className="text-xs opacity-60">Utilities</div>
          </div>

          <div className="space-y-2">
           

            <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={() => downloadJson()}>
              <Download className="mr-2" /> Download JSON
            </Button>

            <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={() => window.open(`https://www.n2yo.com/satellite/?s=${parsed?.satno || selectedId}`, "_blank")}>
              <Globe className="mr-2" /> Open tracker
            </Button>

            <Button className="w-full justify-start cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}>
              <Eye className="mr-2" /> View TLE
            </Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-1">Quick tips</div>
            <div className="text-xs opacity-70">
              • TLE → position computed with <code>satellite.js</code>. <br />
              • Ground-track shows past & future ~90 minutes. <br />
              • Footprint is an approximate coverage radius. <br />
              • Map updates every 1s while TLE is loaded.
            </div>
          </div>
        </aside>
      </main>

      {/* TLE dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 z-999 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{normalized?.name || "TLE"}</DialogTitle>
          </DialogHeader>

          <div style={{ minHeight: "40vh", padding: 20 }}>
            {normalized?.line1 && normalized?.line2 ? (
              <pre style={{ whiteSpace: "pre-wrap" }}>{`${normalized.line1}\n${normalized.line2}`}</pre>
            ) : (
              <div className="text-sm opacity-60">No TLE lines available</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Two-Line Element set (TLE)</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                <X />
              </Button>
              <Button variant="outline" onClick={() => copyTleToClipboard()}>
                <Copy />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full map modal */}
      <Dialog open={mapFullOpen} onOpenChange={setMapFullOpen}>
        <DialogContent className={clsx("max-w-6xl w-full p-3 z-999 rounded-2xl overflow-hidden", isDark ? "bg-black/95" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Full Map — {normalized?.name || selectedId}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "75vh" }}>
            {positionLL ? (
              <MapContainer center={positionLL} zoom={3} style={{ height: "100%", width: "100%" }} preferCanvas={true}>
                <TileLayer url={darkTilesURL} attribution={darkAttribution} />
                {groundTrack && groundTrack.length > 0 && <Polyline positions={groundTrack} pathOptions={{ color: "#00d4ff", weight: 2, opacity: 0.9 }} />}
                <Marker position={positionLL} icon={DefaultMarker}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-medium">{normalized?.name}</div>
                      <div className="text-xs opacity-70">Alt: {altKm ? `${Math.round(altKm)} km` : "—"}</div>
                    </div>
                  </Popup>
                </Marker>
                {positionLL && footprintKm > 0 && <Circle center={positionLL} radius={footprintKm * 1000} pathOptions={{ color: "orange", opacity: 0.45 }} />}
              </MapContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm opacity-60">No position computed yet</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Live ground track & footprint</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMapFullOpen(false)}>
                <X />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
