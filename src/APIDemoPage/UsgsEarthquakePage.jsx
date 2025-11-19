// src/pages/UsgsEarthquakePage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Download,
  ExternalLink,
  Copy,
  List,
  Loader2,
  MapPin,
  AlertTriangle,
  Activity,
  Calendar,
  ChevronRight,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

// ---------- Helpers ----------
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function usgsEndpoint({ starttime, endtime, minmagnitude }) {
  const params = new URLSearchParams();
  params.set("format", "geojson");
  if (starttime) params.set("starttime", starttime);
  if (endtime) params.set("endtime", endtime);
  if (minmagnitude) params.set("minmagnitude", String(minmagnitude));
  // limit large results by default to 200 (user can adjust)
  params.set("limit", "200");
  return `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`;
}

// Parse feature to a concise summary object for list display
function featureSummary(f) {
  const p = f?.properties ?? {};
  const coords = (f?.geometry?.coordinates || []).slice(0, 3);
  return {
    id: f?.id,
    mag: p.mag,
    place: p.place,
    time: p.time,
    url: p.url,
    coords,
    felt: p.felt,
    tsunami: p.tsunami,
    detail: p.detail,
  };
}

// Format epoch ms to human friendly
function fmtDate(ms) {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "-";
  }
}

// ---------- Component ----------
export default function UsgsEarthquakePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Search form state
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState(() => {
    // default: yesterday
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [minMag, setMinMag] = useState("");

  // results
  const [rawGeo, setRawGeo] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // selection
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [coordsDialogOpen, setCoordsDialogOpen] = useState(false);

  // suggestions UI
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestTimer = useRef(null);

  // Fetch helper
  async function fetchEarthquakes({ starttime, endtime, minmagnitude }) {
    setLoading(true);
    setShowSuggest(false);
    try {
      const url = usgsEndpoint({ starttime, endtime, minmagnitude });
      const res = await fetch(url);
      if (!res.ok) {
        console.error("USGS fetch failed", res.status);
        setFeatures([]);
        setRawGeo(null);
        return;
      }
      const json = await res.json();
      const feats = Array.isArray(json.features) ? json.features : [];
      setRawGeo(json);
      setFeatures(feats);
      // default selection: largest magnitude feature if any
      if (feats.length > 0) {
        const byMag = feats.slice().sort((a, b) => (b.properties?.mag ?? 0) - (a.properties?.mag ?? 0));
        setSelectedFeature(byMag[0]);
      } else {
        setSelectedFeature(null);
      }
    } catch (err) {
      console.error(err);
      setFeatures([]);
      setRawGeo(null);
    } finally {
      setLoading(false);
    }
  }

  // suggestion search (client-side filter over loaded features if present; otherwise trigger fetch)
  function doSuggest(q) {
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      setLoadingSuggest(true);
      try {
        if (features.length > 0) {
          // filter locally by place substring or id
          const s = q.trim().toLowerCase();
          const filtered = features.filter((f) => (f.properties?.place || "").toLowerCase().includes(s) || (f.id || "").toLowerCase().includes(s));
          setFeatures((prev) => prev); // keep state but suggestions displayed below
          // do not overwrite main list; suggestions are derived below
        } else {
          // if no local features, fetch the date range (small) to provide suggestion candidates
          await fetchEarthquakes({ starttime: startDate, endtime: endDate, minmagnitude: minMag || undefined });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSuggest(false);
      }
    }, 250);
  }

  // on query change
  function onQueryChange(v) {
    setQuery(v);
    doSuggest(v);
  }

  // form submit handler
  async function handleSearch(e) {
    e?.preventDefault?.();
    await fetchEarthquakes({ starttime: startDate, endtime: endDate, minmagnitude: minMag || undefined });
    setShowSuggest(false);
  }

  // select item helper
  function selectFeature(f) {
    setSelectedFeature(f);
    setShowSuggest(false);
  }

  // quick actions
  function copySelectedJSON() {
    if (!selectedFeature) return;
    navigator.clipboard.writeText(prettyJSON(selectedFeature));
    // minimal toast fallback if you have a toast helper; else console
    // showToast("success", "Copied event JSON");
    console.log("Copied selected feature JSON");
  }
  function downloadGeoJSON(payload, filename = "usgs_events.json") {
    if (!payload) return;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    console.log("Downloaded JSON");
  }
  function openEventUrl(f) {
    const url = f?.properties?.url;
    if (url) window.open(url, "_blank");
  }

  // initial fetch: default date range
  useEffect(() => {
    fetchEarthquakes({ starttime: startDate, endtime: endDate, minmagnitude: minMag || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived: suggestion list (filter features by query)
  const suggestions = useMemo(() => {
    if (!query || query.trim().length === 0) return [];
    const q = query.trim().toLowerCase();
    return (features || [])
      .filter((f) => (f.properties?.place || "").toLowerCase().includes(q) || (f.id || "").toLowerCase().includes(q))
      .slice(0, 20)
      .map((f) => ({ f, s: featureSummary(f) }));
  }, [query, features]);

  // theme classes
  const containerBg = isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200";
  const cardBg = isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200";
  const headerBg = isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200";

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">QuakePulse — USGS Earthquake Data</h1>
          <p className="mt-1 text-sm opacity-70">Query USGS GeoJSON events by date range, magnitude and place. Suggestion search and full event details.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className={clsx("flex items-center gap-2 w-full md:w-[720px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Filter by place (e.g. 'Alaska', 'San Francisco') or event id..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Calendar className="opacity-70" size={16} />
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36 border-0 p-0" />
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="opacity-70" size={16} />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36 border-0 p-0" />
              </div>
              <Input placeholder="min mag" value={minMag} onChange={(e) => setMinMag(e.target.value)} className="w-20 border-0 p-0 text-sm" />
            </div>

            <Button type="button" variant="outline" className="px-3" onClick={() => fetchEarthquakes({ starttime: startDate, endtime: endDate, minmagnitude: minMag || undefined })}>
              Top
            </Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_360px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map(({ f, s }, idx) => (
              <li key={s.id || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => selectFeature(f)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 flex flex-col items-start">
                    <div className="text-sm font-semibold">M{s.mag ?? "—"}</div>
                    <div className="text-xs opacity-60">{fmtDate(s.time)}</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{s.place ?? "Unknown location"}</div>
                    <div className="text-xs opacity-60">id: {s.id}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.coords?.slice(0, 2).map((c) => c?.toFixed?.(2)).join(", ")}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: context/mini-list */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", containerBg)}>
          <div>
            <div className="text-sm font-semibold mb-2">Event list</div>
            <div className="text-xs opacity-60 mb-2">Showing up to 200 events for the chosen range — click an event to view details.</div>
            <ScrollArea style={{ maxHeight: 420 }} className="rounded-md border p-2" >
              <div className="space-y-2">
                {loading ? (
                  <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                ) : features.length === 0 ? (
                  <div className="text-sm opacity-60">No events loaded.</div>
                ) : (
                  features.slice(0, 40).map((f) => {
                    const s = featureSummary(f);
                    return (
                      <div key={f.id} onClick={() => selectFeature(f)} className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <div className="text-sm font-semibold">M{s.mag ?? "—"}</div>
                          <div className="text-xs opacity-60">{s.felt ? `${s.felt} felt` : ""}</div>
                        </div>
                        <div className="col-span-7">
                          <div className="text-sm truncate">{s.place}</div>
                          <div className="text-xs opacity-60">{fmtDate(s.time)}</div>
                        </div>
                        <div className="col-span-2 text-right text-xs opacity-60">{s.coords?.[2] ? `${s.coords[2]} km` : "—"}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Filters</div>
            <div className="text-xs opacity-60 mb-2">Adjust date range and minimum magnitude, then press Search.</div>
            <div className="space-y-2">
              <div className="text-xs">Start</div>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <div className="text-xs">End</div>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <div className="text-xs">Min magnitude</div>
              <Input placeholder="e.g. 2.5" value={minMag} onChange={(e) => setMinMag(e.target.value)} />
              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={() => { setQuery(""); setMinMag(""); setStartDate(new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10)); setEndDate(new Date().toISOString().slice(0,10)); }}>
                  Reset
                </Button>
                <Button onClick={handleSearch}>Search</Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: full details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", cardBg)}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", headerBg)}>
              <div>
                <CardTitle className="text-lg">Selected Event</CardTitle>
                <div className="text-xs opacity-60">{selectedFeature?.properties?.place ?? "No event selected"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fetchEarthquakes({ starttime: startDate, endtime: endDate, minmagnitude: minMag || undefined })}>
                  <Loader2 className={loading ? "animate-spin" : ""} /> Refresh
                </Button>
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide Raw" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => setCoordsDialogOpen(true)}><MapPin /> Coordinates</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selectedFeature ? (
                <div className="py-12 text-center text-sm opacity-60">Select an event from the left list or run a search.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: compact visual (magnitude badge + meta) */}
                  <div className={clsx("p-4 rounded-xl border", cardBg)}>
                    <div className="flex items-baseline gap-3">
                      <div className="rounded-full p-4 text-center w-28 h-28 flex items-center justify-center" style={{ background: (selectedFeature.properties?.mag >= 6 ? "#8b0000" : selectedFeature.properties?.mag >= 4 ? "#d97706" : "#2563eb"), color: "white" }}>
                        <div>
                          <div className="text-3xl font-bold">{String(selectedFeature.properties?.mag ?? "—")}</div>
                          <div className="text-xs opacity-90">Magnitude</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xl font-semibold">{selectedFeature.properties?.place}</div>
                        <div className="text-xs opacity-60">{fmtDate(selectedFeature.properties?.time)}</div>
                        <div className="mt-2 text-sm">Depth: {(selectedFeature.geometry?.coordinates?.[2] ?? "—")} km</div>
                        <div className="text-sm">Felt reports: {selectedFeature.properties?.felt ?? "—"}</div>
                        <div className="text-sm">Tsunami: {selectedFeature.properties?.tsunami ? "Yes" : "No"}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs opacity-60">Event ID</div>
                      <div className="font-medium">{selectedFeature.id}</div>
                      <div className="mt-3">
                        <Button variant="outline" onClick={() => openEventUrl(selectedFeature)}><ExternalLink /> Open USGS page</Button>
                      </div>
                    </div>
                  </div>

                  {/* Right: full fields and properties */}
                  <div className={clsx("p-4 rounded-xl border md:col-span-2", cardBg)}>
                    <div className="text-sm font-semibold mb-2">Properties</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(selectedFeature.properties || {}).map(([k, v]) => (
                        <div key={k} className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">{k}</div>
                          <div className="text-sm font-medium break-words">{typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
                        </div>
                      ))}
                      <div className="p-2 rounded-md border col-span-full">
                        <div className="text-xs opacity-60">Geometry (coords)</div>
                        <div className="text-sm font-medium">{(selectedFeature.geometry?.coordinates || []).join(", ")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawGeo && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(rawGeo)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", containerBg)}>
          <div>
            <div className="text-sm font-semibold mb-2">Quick actions</div>
            <div className="text-xs opacity-60 mb-2">Developer & analysis utilities</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => { if (selectedFeature) copySelectedJSON(); else console.log("No selection"); }}><Copy /> Copy selected JSON</Button>
              <Button variant="outline" onClick={() => downloadGeoJSON(selectedFeature || rawGeo, selectedFeature ? `quake_${selectedFeature.id}.json` : `usgs_events.json`)}><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => setShowRaw((s) => !s)}><List /> Toggle Raw GeoJSON</Button>
              <Button variant="outline" onClick={() => { if (rawGeo) downloadGeoJSON(rawGeo, "usgs_geojson_export.json"); else console.log("No geojson"); }}><Activity /> Export all</Button>
              <Button variant="ghost" onClick={() => window.open(usgsEndpoint({ starttime: startDate, endtime: endDate, minmagnitude: minMag || undefined }), "_blank")}><ExternalLink /> Open API URL</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About</div>
            <div className="text-xs opacity-60">This viewer queries the USGS event API (GeoJSON). Results are parsed to show magnitude, place, time, coordinates and properties. Designed with the same theme as the News page for visual parity.</div>
          </div>
        </aside>
      </main>

      {/* Coordinates dialog */}
      <Dialog open={coordsDialogOpen} onOpenChange={setCoordsDialogOpen}>
        <DialogContent className={clsx("max-w-2xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Coordinates</DialogTitle>
          </DialogHeader>

          <div style={{ padding: 20 }}>
            {selectedFeature ? (
              <div>
                <div className="text-sm font-semibold mb-2">{selectedFeature.properties?.place}</div>
                <div className="text-xs opacity-60 mb-2">Longitude, Latitude, Depth (km)</div>
                <div className="font-medium">{(selectedFeature.geometry?.coordinates || []).join(", ")}</div>
              </div>
            ) : (
              <div className="text-sm opacity-60">No event selected.</div>
            )}
          </div>

          <DialogFooter className="flex justify-end items-center p-4 border-t">
            <Button variant="ghost" onClick={() => setCoordsDialogOpen(false)}><X /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
