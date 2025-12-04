// src/pages/OpenSkyPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import {
  Search,
  Globe,
  ExternalLink,
  Download,
  Copy,
  Loader2,
  MapPin,
  Calendar,
  Layers,
  Menu,
  X,
  Check,
  Feather,
  AlertTriangle,
  Clock,
  RefreshCcw as RefreshIcon,
  FileText,
  List,

} from "lucide-react";

// shadcn / UI imports (adjust paths to your project)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

// OpenSky endpoint
const OPEN_SKY_ENDPOINT = "https://opensky-network.org/api/states/all";

/* ---------- Helpers ---------- */

// Map OpenSky state vector (array) to named object. See OpenSky API docs.
function parseStateVector(vec) {
  // vec array shape per OpenSky: 
  // [0] icao24, [1] callsign, [2] origin_country, [3] time_position, [4] last_contact,
  // [5] longitude, [6] latitude, [7] baro_altitude, [8] on_ground,
  // [9] velocity, [10] true_track, [11] vertical_rate, [12] sensors,
  // [13] geo_altitude, [14] squawk, [15] spi, [16] position_source
  if (!Array.isArray(vec)) return null;
  return {
    icao24: vec[0] ?? null,
    callsign: vec[1]?.trim() || null,
    origin_country: vec[2] ?? null,
    time_position: vec[3] ?? null,
    last_contact: vec[4] ?? null,
    longitude: vec[5] ?? null,
    latitude: vec[6] ?? null,
    baro_altitude: vec[7] ?? null,
    on_ground: vec[8] ?? null,
    velocity: vec[9] ?? null,
    true_track: vec[10] ?? null,
    vertical_rate: vec[11] ?? null,
    sensors: vec[12] ?? null,
    geo_altitude: vec[13] ?? null,
    squawk: vec[14] ?? null,
    spi: vec[15] ?? null,
    position_source: vec[16] ?? null,
    // for convenience:
    last_contact_iso: vec[4] ? new Date(vec[4] * 1000).toISOString() : null,
    time_position_iso: vec[3] ? new Date(vec[3] * 1000).toISOString() : null,
  };
}

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function downloadJSON(filename, data) {
  const blob = new Blob([prettyJSON(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* Debounce helper */
function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/* ---------- Component ---------- */

export default function OpenSkyPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // data & UI state
  const [rawResp, setRawResp] = useState(null); // full response {time, states}
  const [states, setStates] = useState([]); // parsed array of objects
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  // search/suggestions
  const [query, setQuery] = useState("");
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const suggestRef = useRef(null);

  // UI extras
  const [copyState, setCopyState] = useState({ copying: false, success: false });
  const copyTimerRef = useRef(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // small initial fetch of OpenSky states
  async function fetchStates() {
    setLoading(true);
    try {
      const res = await fetch(OPEN_SKY_ENDPOINT);
      if (!res.ok) throw new Error(`OpenSky API returned ${res.status}`);
      const json = await res.json();
      setRawResp(json);
      const parsed = (json.states || []).map((vec) => parseStateVector(vec)).filter(Boolean);
      setStates(parsed);
      // select the first available by default
      if (parsed.length > 0) setSelected(parsed[0]);
    } catch (err) {
      console.error("Fetch states failed", err);
      setRawResp(null);
      setStates([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    fetchStates();
  }, []);

  // Suggestion logic: filter states by callsign or icao24
  const computeSuggestions = useMemo(
    () =>
      debounce((q) => {
        if (!q || !q.trim()) {
          setSuggestions([]);
          return;
        }
        const low = q.trim().toLowerCase();
        // prefer callsign matches then icao
        const byCall = states.filter((s) => s.callsign && s.callsign.toLowerCase().includes(low));
        const byIcao = states.filter((s) => s.icao24 && s.icao24.toLowerCase().includes(low));
        // combine unique
        const combined = [];
        const seen = new Set();
        for (const item of [...byCall, ...byIcao]) {
          const key = item.icao24 + "|" + (item.callsign ?? "");
          if (!seen.has(key)) {
            combined.push(item);
            seen.add(key);
          }
          if (combined.length >= 12) break;
        }
        setSuggestions(combined);
      }, 180),
    [states]
  );

  useEffect(() => {
    if (!query || query.trim() === "") {
      setSuggestions([]);
      setSuggestionsVisible(false);
      return;
    }
    computeSuggestions(query);
    setSuggestionsVisible(true);
  }, [query, computeSuggestions]);

  // select from suggestions / left list
  function chooseAircraft(a) {
    setSelected(a);
    setSuggestionsVisible(false);
    setMobileSheetOpen(false);
  }

  // Copy animation
  async function handleCopyJSON() {
    if (!selected) return;
    try {
      setCopyState({ copying: true, success: false });
      await navigator.clipboard.writeText(prettyJSON(selected));
      setCopyState({ copying: false, success: true });
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopyState({ copying: false, success: false }), 1800);
    } catch (err) {
      setCopyState({ copying: false, success: false });
      console.error("Copy failed", err);
    }
  }

  // Download JSON of selected or full response
  function handleDownload(selectedOnly = true) {
    if (selectedOnly) {
      if (!selected) return;
      downloadJSON(`opensky_${selected.icao24 || "unknown"}.json`, selected);
    } else {
      if (!rawResp) return;
      downloadJSON(`opensky_states_all.json`, rawResp);
    }
  }

  // Map embed URL (Google Maps), center to lat/lon or use placeholder
  function mapUrlFor(lat, lon, label = "") {
    if (!lat || !lon) return "";
    const q = encodeURIComponent(`${lat},${lon} (${label})`);
    // Use Google Maps embed (requires no API key for simple embed) — note: if your environment blocks google, adjust.
    return `https://www.google.com/maps?q=${q}&z=7&output=embed`;
  }

  // A little derived stats
  const totalStates = states.length;
  const top10 = states.slice(0, 10);

  return (
    <div className={clsx("min-h-screen pb-12 overflow-hidden transition-colors", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="flex items-center flex-wrap justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Mobile sheet trigger */}
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 rounded-md hover:bg-muted/20 cursor-pointer" aria-label="Open list">
                  <Menu size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] p-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">Live aircraft</h3>
                    <div className="text-xs opacity-70">OpenSky / states snapshot</div>
                  </div>
                 
                </div>
                <ScrollArea style={{ height: "70vh" }}>
                  <div className="space-y-2">
                    {top10.map((a) => (
                      <button
                        key={a.icao24}
                        onClick={() => chooseAircraft(a)}
                        className={clsx("w-full p-3 rounded-md text-left flex items-center gap-3 cursor-pointer hover:shadow-sm", selected?.icao24 === a.icao24 ? "border-2 border-zinc-400 bg-zinc-50/40" : "border")}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{a.callsign || "—"}</div>
                          <div className="text-xs opacity-70">{a.origin_country || "—"} • {a.icao24}</div>
                        </div>
                        <div className="text-xs backdrop-blur-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 ml-2 px-2 py-0.5 rounded-2xl">{a.latitude ? `${a.latitude.toFixed(2)}, ${a.longitude?.toFixed(2)}` : "no pos"}</div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
                <Layers size={22} />
                OpenSky — Live Aircraft
              </h1>
              <p className="text-sm opacity-70 max-w-xl mt-1">Real-time snapshot of airborne & on-ground aircraft from OpenSky Network. Search by callsign or ICAO24.</p>
            </div>
          </div>
                  {/* Search bar */}
        <div className="mb-6 w-full sm:w-[400px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // if query is an exact icao24 match, jump directly
              const q = (query || "").trim();
              if (!q) return;
              const exact = states.find((s) => (s.icao24 || "").toLowerCase() === q.toLowerCase() || (s.callsign || "").toLowerCase() === q.toLowerCase());
              if (exact) {
                chooseAircraft(exact);
                return;
              }
              // otherwise compute suggestions (already handled by suggestion hook)
              setSuggestionsVisible(true);
            }}
            className={clsx("w-full max-w-4xl")}
          >
            <div className={clsx("flex items-center gap-2 rounded-lg px-3 py-2 shadow-sm", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
              <Search size={16} className="opacity-60" />
              <Input
                placeholder="Search callsign (e.g. AAL123) or ICAO24 (e.g. a0b1c2)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query && setSuggestionsVisible(true)}
                className="border-0 bg-transparent outline-none shadow-none"
                aria-label="Search aircraft"
              />

              <div className="flex items-center gap-2">
                {suggestionsVisible && (suggestions.length > 0 || query) && (
                  <Button variant="ghost" className="px-2 cursor-pointer" onClick={() => setSuggestionsVisible((s) => !s)}>
                    <List size={14} />
                  </Button>
                )}
                <Button type="submit" className="px-3 cursor-pointer">
                  <Search size={14} />
                </Button>
              </div>
            </div>

            {/* Suggestions dropdown */}
            {suggestionsVisible && (suggestions.length > 0 || query) && (
              <div ref={suggestRef} className={clsx("mt-2 max-h-72 w-100 absolute overflow-auto rounded-xl shadow-2xl z-50", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
                {loading ? (
                  <div className="p-3 text-sm flex items-center gap-2"><Loader2 className="animate-spin" /> Loading…</div>
                ) : suggestions.length === 0 && query ? (
                  <div className="p-3 text-sm opacity-70">No suggestions — press Enter to search the snapshot</div>
                ) : (
                  suggestions.map((s) => (
                    <button key={s.icao24} onClick={() => chooseAircraft(s)} className="w-full text-left px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 flex items-center gap-3 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{s.callsign || "—"}</div>
                        <div className="text-xs opacity-60 truncate">{s.origin_country || "—"} • {s.icao24}</div>
                      </div>
                      <div className="text-xs opacity-60">{s.latitude ? `${s.latitude.toFixed(2)}, ${s.longitude?.toFixed(2)}` : "no pos"}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </form>
        </div>

   
        </header>



        {/* Main layout: left list (compact), center details, right quick actions */}
        <main className="grid grid-cols-1 sm:pt-4 lg:grid-cols-[320px_1fr_360px] gap-6">
          {/* LEFT: compact live list */}
          <aside className="hidden lg:block">
            <Card className={clsx(isDark ? "bg-zinc-950/60 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">Live snapshot <span className="text-xs opacity-60">({totalStates})</span></span>
                  <Badge className="glass px-2 py-0.5">{top10.length} shown</Badge>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <ScrollArea style={{ height: 560 }}>
                  <div className="space-y-3">
                    {top10.map((a) => (
                      <button
                        key={a.icao24}
                        onClick={() => chooseAircraft(a)}
                        className={clsx("w-full p-3 rounded-md text-left flex items-center gap-3 cursor-pointer", selected?.icao24 === a.icao24 ? "border-2 border-zinc-400 bg-zinc-50/30" : "border hover:shadow-sm")}
                        title={`${a.callsign || "—"} • ${a.icao24}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{a.callsign || "—"}</div>
                          <div className="text-xs opacity-70 truncate">{a.origin_country || "—"} • {a.icao24}</div>
                        </div>
                        <div className="text-xs backdrop-blur-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 ml-2 px-2 py-0.5 rounded-2xl">{a.on_ground ? "Ground" : a.velocity ? `${Math.round(a.velocity)} m/s` : "—"}</div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="flex items-center justify-between">
                <div className="text-xs opacity-60">Snapshot from OpenSky</div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => fetchStates()}>
                    <RefreshIcon className="animate-spin" />
                    Refresh
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </aside>

          {/* CENTER: detail preview */}
          <section>
            <Card className={clsx(isDark ? "bg-black/70 border border-zinc-800" : "bg-white/95 border border-zinc-200")}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 w-full">
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-3">
                      <Feather size={18} />
                      <span>{selected?.callsign || selected?.icao24 || (loading ? "Loading…" : "No selection")}</span>
                      {selected?.icao24 && <Badge  className=" backdrop-blur-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 ml-2 px-2 py-0.5">{selected.icao24}</Badge>}
                    </h2>
                    <p className="text-sm opacity-70 mt-1 flex flex-wrap gap-4 items-center">
                      <span className="flex items-center gap-2"><MapPin size={14} /> {selected?.origin_country ?? "—"}</span>
                      <span className="flex items-center gap-2"><Clock size={14} /> Last contact: {selected?.last_contact_iso ? new Date(selected.last_contact * 1000).toLocaleString() : "—"}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                   
                    <Tooltip content="Open in OpenSky (web)">
                      <button
                        onClick={() => selected?.icao24 && window.open(`https://opensky-network.org/aircraft/${selected.icao24}`, "_blank")}
                        disabled={!selected?.icao24}
                        className="p-2 rounded-md border hover:bg-muted/20 cursor-pointer"
                        aria-label="Open OpenSky"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </Tooltip>

                    <Tooltip content="Open full map">
                      <Button variant="outline" onClick={() => setMapDialogOpen(true)} disabled={!selected?.latitude || !selected?.longitude} className="p-2 rounded-md border hover:bg-muted/20 cursor-pointer" aria-label="Open map">
                        <MapPin size={16} /> View
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {loading ? (
                  <div className="py-10 text-center"><Loader2 className="animate-spin" /></div>
                ) : !selected ? (
                  <div className="py-10 text-center text-sm opacity-70">Select an aircraft from the left or search by callsign / ICAO24.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* left column: map snapshot */}
                    <div className="md:col-span-1 rounded-md p-3 border bg-white/60 dark:bg-zinc-900/30">
                      <div className="w-full h-48 rounded-md overflow-hidden border">
                        {selected.latitude && selected.longitude ? (
                          <iframe
                            title="mini-map"
                            src={mapUrlFor(selected.latitude, selected.longitude, selected.callsign || selected.icao24)}
                            style={{ width: "100%", height: "100%", border: 0 }}
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs opacity-60">No position available</div>
                        )}
                      </div>

                      <div className="mt-3 space-y-2 text-sm">
                        <div>
                          <div className="text-xs opacity-60">Altitude</div>
                          <div className="font-medium">{selected.baro_altitude !== null ? `${Math.round(selected.baro_altitude)} m` : "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60">Ground / Air</div>
                          <div className="font-medium">{selected.on_ground ? "On ground" : "Airborne"}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60">Speed</div>
                          <div className="font-medium">{selected.velocity ? `${Math.round(selected.velocity)} m/s` : "—"}</div>
                        </div>
                      </div>
                    </div>

                    {/* center column: key attributes */}
                    <div className="md:col-span-2 rounded-md p-4 border bg-white/60 dark:bg-zinc-950/30">
                      <h3 className="text-lg font-medium flex items-center gap-2"><Feather size={16} /> Key attributes</h3>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs opacity-60">ICAO24</div>
                          <div className="font-medium">{selected.icao24}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60">Callsign</div>
                          <div className="font-medium">{selected.callsign ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60">Origin Country</div>
                          <div className="font-medium">{selected.origin_country ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60">Position Source</div>
                          <div className="font-medium">{selected.position_source ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60">Vertical rate</div>
                          <div className="font-medium">{selected.vertical_rate !== null ? `${Math.round(selected.vertical_rate)} m/s` : "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60">Squawk</div>
                          <div className="font-medium">{selected.squawk ?? "—"}</div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2"><Clock size={14} /> Timestamps</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-xs opacity-60">Time position</div>
                            <div className="font-medium">{selected.time_position_iso ?? "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs opacity-60">Last contact</div>
                            <div className="font-medium">{selected.last_contact_iso ?? "—"}</div>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2"><ExternalLink size={14} /> Raw fields</h4>
                        <div className="rounded-md border p-3 overflow-auto text-xs bg-muted/5" style={{ maxHeight: 220 }}>
                          <pre>{prettyJSON(selected)}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* small actions row below on mobile */}
            <div className="mt-4 md:hidden flex gap-2">
              <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => handleDownload(true)} disabled={!selected}><Download /> Download</Button>
              <Button variant="ghost" className="flex-1 cursor-pointer" onClick={() => handleCopyJSON()} disabled={!selected}><Copy /> Copy</Button>
            </div>
          </section>

          {/* RIGHT: quick actions + random list */}
          <aside>
            <Card className={clsx(isDark ? "bg-zinc-950/50 border border-zinc-800" : "bg-white/95 border border-zinc-200")}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">Quick actions</span>
                  <Badge className="glass px-2 py-0.5">Live</Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Button onClick={() => handleDownload(false)} className="cursor-pointer">Download snapshot<Download size={14} className="ml-2" /></Button>
                  <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer">Toggle raw response</Button>
                  <Button variant="outline" onClick={() => fetchStates()} className="cursor-pointer">Refresh snapshot</Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2"><Layers size={14} /> Sample aircraft</h4>
                  <div className="space-y-2">
                    {loading ? (
                      <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Loading…</div>
                    ) : states.length ? (
                      <ScrollArea style={{ height: 260 }}>
                        <div className="grid grid-cols-1 gap-2">
                          {states.slice(10, 30).map((r) => {
                            const isSel = selected?.icao24 === r.icao24;
                            return (
                              <button
                                key={r.icao24}
                                onClick={() => chooseAircraft(r)}
                                className={cn("w-full text-left p-3 rounded-md border flex items-start justify-between gap-2 cursor-pointer", isSel ? "border-2 border-zinc-400 bg-zinc-50/30" : "hover:shadow-sm")}
                              >
                                <div>
                                  <div className="font-medium truncate">{r.callsign || r.icao24}</div>
                                  <div className="text-xs opacity-70 truncate">{r.origin_country || "—"}</div>
                                </div>
                                <div className="text-xs opacity-60">{r.latitude ? `${r.latitude.toFixed(1)},${r.longitude?.toFixed(1)}` : "—"}</div>
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="opacity-70">No aircraft loaded</div>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between text-xs opacity-60">
                <div>Source: OpenSky Network</div>
                <div>Updated: {rawResp?.time ? new Date(rawResp.time * 1000).toLocaleString() : "—"}</div>
              </CardFooter>
            </Card>
          </aside>
        </main>
      </div>

      {/* Map dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className={clsx("max-w-5xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selected?.callsign || selected?.icao24 ? `Map — ${selected.callsign || selected.icao24}` : "Map"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh" }}>
            {selected?.latitude && selected?.longitude ? (
              <iframe
                title="full-map"
                src={mapUrlFor(selected.latitude, selected.longitude, selected.callsign || selected.icao24)}
                style={{ width: "100%", height: "100%", border: 0 }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm opacity-70"><AlertTriangle /> No position available</div>
            )}
          </div>

          <DialogFooter className="flex justify-between p-4">
            <div className="text-xs opacity-60">Map: Google Maps embed</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMapDialogOpen(false)} className="cursor-pointer">Close</Button>
              <Button variant="outline" onClick={() => selected?.latitude && window.open(mapUrlFor(selected.latitude, selected.longitude, selected.callsign || selected.icao24), "_blank")} className="cursor-pointer">Open in maps</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Glassy badge CSS */}
      <style jsx>{`
        .glass {
          background: linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55));
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.14);
          color: #0f172a;
        }
        @media (prefers-color-scheme: dark) {
          :global(.glass) {
            background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
            border: 1px solid rgba(255,255,255,0.04);
            color: #e6eef8;
          }
        }
      `}</style>
    </div>
  );
}

/* Note: small icons used above (List, RefreshIcon etc.) — replace or import them as needed.
   The code expects your shadcn components and lucide-react installed. */
