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
  Activity,
  Calendar as CalendarIcon,
  ChevronRight,
  X,
  Menu,
  RefreshCw,
  Check,
  Users,
  FileText,
  BarChart2,
  Clock,
  Eye,
  Globe,
  AlertTriangle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { format } from "date-fns";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------------- helpers (kept logic) ---------------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
function usgsEndpoint({ starttime, endtime, minmagnitude, limit = 200 } = {}) {
  const params = new URLSearchParams();
  params.set("format", "geojson");
  if (starttime) params.set("starttime", starttime);
  if (endtime) params.set("endtime", endtime);
  if (minmagnitude) params.set("minmagnitude", String(minmagnitude));
  params.set("limit", String(limit));
  return `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`;
}
function usgsEventByIdUrl(eventId) {
  const params = new URLSearchParams();
  params.set("format", "geojson");
  params.set("eventid", eventId);
  return `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`;
}
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
function fmtDate(ms) {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "-";
  }
}
function osmStaticMapUrl(lat, lon, zoom = 5, width = 900, height = 400, marker = true) {
  if (lat == null || lon == null) return "";
  const markerParam = marker ? `&markers=${lat},${lon},red-pushpin` : "";
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}${markerParam}`;
}
function osmEmbedUrl(lat, lon, mag = 4) {
  if (lat == null || lon == null) return "";
  const degBuffer = Math.max(0.2, Math.min(3, mag * 0.25));
  const left = lon - degBuffer;
  const right = lon + degBuffer;
  const bottom = lat - degBuffer;
  const top = lat + degBuffer;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

/* ---------------- page ---------------- */
export default function UsgsEarthquakePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  /* form */
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [minMag, setMinMag] = useState("");

  /* data */
  const [rawGeo, setRawGeo] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  /* UI */
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [coordsDialogOpen, setCoordsDialogOpen] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [mapEmbedOpen, setMapEmbedOpen] = useState(false);

  /* sidebar */
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [sidebarRandom, setSidebarRandom] = useState([]);
  const [randomLoading, setRandomLoading] = useState(false);

  /* copy */
  const [copied, setCopied] = useState(false);

  /* suggestions */
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestTimer = useRef(null);

  /* ---------------- Data fetch functions (unchanged) ---------------- */
  async function fetchEarthquakes({ starttime, endtime, minmagnitude, limit } = {}) {
    setLoading(true);
    setShowSuggest(false);
    try {
      const url = usgsEndpoint({ starttime, endtime, minmagnitude, limit });
      const res = await fetch(url);
      if (!res.ok) {
        console.error("USGS fetch failed", res.status);
        setFeatures([]);
        setRawGeo(null);
        showToast?.("error", `USGS fetch failed (${res.status})`);
        return;
      }
      const json = await res.json();
      const feats = Array.isArray(json.features) ? json.features : [];
      setRawGeo(json);
      setFeatures(feats);
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
      showToast?.("error", "Failed to fetch USGS data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRandomEvents() {
    setRandomLoading(true);
    try {
      const url2 = usgsEndpoint({ starttime: startDate, endtime: endDate, minmagnitude: minMag || undefined, limit: 300 });
      const res2 = await fetch(url2);
      if (!res2.ok) {
        setSidebarRandom([]);
        setRandomLoading(false);
        return;
      }
      const json2 = await res2.json();
      const arr2 = Array.isArray(json2.features) ? json2.features : [];
      // sample up to 10
      const sample = [];
      const taken = new Set();
      const max = Math.min(10, arr2.length);
      while (sample.length < max && sample.length < arr2.length) {
        const i = Math.floor(Math.random() * arr2.length);
        if (!taken.has(i)) {
          taken.add(i);
          sample.push(arr2[i]);
        }
      }
      setSidebarRandom(sample);
    } catch (err) {
      console.error(err);
      setSidebarRandom([]);
    } finally {
      setRandomLoading(false);
    }
  }

  async function fetchEventById(id) {
    try {
      const url = usgsEventByIdUrl(id);
      const r = await fetch(url);
      if (!r.ok) return null;
      const j = await r.json();
      if (j?.features && j.features.length > 0) return j.features[0];
      if (j?.id) return j;
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  function doSuggest(q) {
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      setLoadingSuggest(true);
      try {
        const s = q.trim();
        if (!s) {
          setLoadingSuggest(false);
          return;
        }
        const idLikely = /^[a-zA-Z]{1,3}\d/.test(s) || (/\d/.test(s) && s.length > 6);
        if (idLikely) {
          const evt = await fetchEventById(s);
          if (evt) {
            setFeatures((prev) => {
              const exists = prev.find((f) => f.id === evt.id);
              if (exists) return prev;
              return [evt, ...prev];
            });
          }
        }
        if (!features || features.length === 0) {
          await fetchEarthquakes({ starttime: startDate, endtime: endDate, minmagnitude: minMag || undefined, limit: 200 });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSuggest(false);
      }
    }, 220);
  }

  function onQueryChange(v) {
    setQuery(v);
    doSuggest(v);
  }

  async function handleSearch(e) {
    e?.preventDefault?.();
    await fetchEarthquakes({ starttime: startDate, endtime: endDate, minmagnitude: minMag || undefined, limit: 200 });
    setShowSuggest(false);
    fetchRandomEvents();
  }

  function selectFeature(f) {
    setSelectedFeature(f);
    setShowSuggest(false);
    setMobileSheetOpen(false);
  }

  async function copySelectedJSON() {
    const payload = selectedFeature || rawGeo;
    if (!payload) {
      showToast?.("info", "Nothing selected to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(prettyJSON(payload));
      setCopied(true);
      showToast?.("success", "Copied JSON");
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error(err);
      showToast?.("error", "Copy failed");
    }
  }

  function downloadGeoJSON(payload, filename = "usgs_events.json") {
    if (!payload) {
      showToast?.("info", "Nothing to download");
      return;
    }
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast?.("success", "Download started");
  }

  function openEventUrl(f) {
    const url = f?.properties?.url;
    if (url) window.open(url, "_blank");
  }

  const suggestions = useMemo(() => {
    if (!query || query.trim().length === 0) return [];
    const q = query.trim().toLowerCase();
    const idMatches = (features || []).filter((f) => (f.id || "").toLowerCase().includes(q));
    const placeMatches = (features || []).filter((f) => (f.properties?.place || "").toLowerCase().includes(q));
    const ids = new Set();
    const combined = [];
    idMatches.forEach((f) => {
      if (!ids.has(f.id)) {
        ids.add(f.id);
        combined.push({ f, s: featureSummary(f) });
      }
    });
    placeMatches.forEach((f) => {
      if (!ids.has(f.id)) {
        ids.add(f.id);
        combined.push({ f, s: featureSummary(f) });
      }
    });
    return combined.slice(0, 30);
  }, [query, features]);

  useEffect(() => {
    fetchEarthquakes({ starttime: startDate, endtime: endDate, minmagnitude: minMag || undefined, limit: 200 });
    fetchRandomEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // theming helpers
  const containerBg = isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200";
  const cardBg = isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200";
  const headerBg = isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200";
function badgeClassFromTheme(selectedFeature, isDark) {
  const mag = selectedFeature?.properties?.mag ?? 0;

  const base =
    "rounded-full p-4 text-center w-28 h-28 flex items-center justify-center backdrop-blur-md shadow-lg border";

  const magColor =
    mag >= 6
      ? "bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-300"
      : mag >= 4
      ? "bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300"
      : "bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-300";

  return ` ${magColor}`;
}


  const selectedCoords = (() => {
    const coords = selectedFeature?.geometry?.coordinates;
    if (!coords || coords.length < 2) return null;
    const lon = coords[0];
    const lat = coords[1];
    const depth = coords[2];
    return { lon, lat, depth };
  })();

  return (
    <div className="min-h-screen pb-10 p-4 md:p-6 max-w-8xl mx-auto">
      {/* Header */}
      <header className="flex items-start flex-wrap md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 rounded-md md:hidden cursor-pointer"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">Events</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => fetchRandomEvents()} className="cursor-pointer"><RefreshCw /></Button>

                  </div>
                </div>

                <ScrollArea style={{ height: 600 }}>
                 <div className="space-y-2 p-2">
              {sidebarRandom.map((r) => {
                const s = featureSummary(r);
                const selected = selectedFeature?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => selectFeature(r)}
                    className={clsx(
                      "p-2 rounded-md flex gap-2 border flex-col items-start cursor-pointer transition-colors",
                      selected ? "bg-zinc-600/10 border-zinc-400 ring-1 ring-zinc-300" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                    )}
                  >
                    <div className="">
                      <div className={clsx("text-sm font-semibold", selected ? "text-zinc-500" : "")}>M{s.mag ?? "—"}</div>
                      <div className="text-xs opacity-60">{s.felt ? `${s.felt} felt` : ""}</div>
                    </div>

                    <div className=" min-w-0">
                      <div className="font-medium ">{s.place}</div>
                      <div className="text-xs opacity-60 ">{fmtDate(s.time)}</div>
                    </div>

                    <div className=" text-right">
                      <Badge className={badgeClassFromTheme(r) + " px-2 py-1 rounded-full text-xs font-medium"}>#{r.id}</Badge>
                    </div>
                  </div>
                );
              })}
              {randomLoading && <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>}
            </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">QuakePulse — USGS Earthquakes</h1>
            <div className="text-xs opacity-70">Query, inspect and export USGS earthquake GeoJSON with a polished UI.</div>
          </div>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className={clsx("relative w-full md:w-[720px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
          <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 w-full">
            <div className="flex gap-1 items-center w-full">
            <Search className="opacity-60" />
            <Input
              placeholder="Filter by place or event id (e.g. 'us7000abcd' or 'Alaska')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            </div>

        <div className="flex items-center  gap-2 ml-2">
  {/* Start Date */}
  <div className="flex items-center gap-1">
    <CalendarIcon className="opacity-70" size={16} />

    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-36 justify-start cursor-pointer text-left font-normal"
        >
          {startDate
            ? new Date(startDate).toLocaleDateString()
            : "Pick date"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0" align="start">
        <Calendar
          mode="single"
          selected={startDate ? new Date(startDate) : undefined}
          onSelect={(d) =>
            setStartDate(d ? d.toISOString().slice(0, 10) : "")
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  </div>

  {/* End Date */}
  <div className="flex  items-center gap-1">
    <CalendarIcon className="opacity-70" size={16} />

    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-36 cursor-pointer justify-start text-left font-normal"
        >
          {endDate
            ? new Date(endDate).toLocaleDateString()
            : "Pick date"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0" align="start">
        <Calendar
          mode="single"
          selected={endDate ? new Date(endDate) : undefined}
          onSelect={(d) =>
            setEndDate(d ? d.toISOString().slice(0, 10) : "")
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  </div>

  {/* Min Magnitude Input */}
  <Input
    placeholder="min mag"
    value={minMag}
    onChange={(e) => setMinMag(e.target.value)}
    className="w-20 border-0 p-0 text-sm"
  />
</div>


            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { fetchEarthquakes({ starttime: startDate, endtime: endDate, minmagnitude: minMag || undefined }); }}>
                Top
              </Button>

              <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
            </div>
          </div>

          {/* Suggestions */}
          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={clsx("absolute z-50 left-0 right-0 max-h-80 overflow-auto rounded-xl shadow-2xl mt-2", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
              >
                {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
                {suggestions.map(({ f, s }, idx) => (
                  <li key={f.id ?? idx} onClick={() => selectFeature(f)} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/30 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-16">
                        <div className="text-sm font-semibold">M{s.mag ?? "—"}</div>
                        <div className="text-xs opacity-60">{fmtDate(s.time)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{s.place}</div>
                        <div className="text-xs opacity-60 truncate">id: {s.id}</div>
                      </div>
                      <div className="text-xs opacity-60">{(s.coords || []).slice(0, 2).map((c) => (c != null ? Number(c).toFixed(2) : "-")).join(", ")}</div>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </form>
      </header>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sidebar */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", containerBg)}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Random picks</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="cursor-pointer" onClick={() => fetchRandomEvents()}><RefreshCw /></Button>
              <Button variant="ghost" className="cursor-pointer" onClick={() => fetchRandomEvents()}><ChevronRight /></Button>
            </div>
          </div>

          <ScrollArea className="overflow-y-auto" style={{ maxHeight: 520 }}>
            <div className="space-y-2 p-2">
              {sidebarRandom.map((r) => {
                const s = featureSummary(r);
                const selected = selectedFeature?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => selectFeature(r)}
                    className={clsx(
                      "p-2 rounded-md flex gap-2 border flex-col items-start cursor-pointer transition-colors",
                      selected ? "bg-zinc-600/10 border-zinc-400 ring-1 ring-zinc-300" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                    )}
                  >
                    <div className="">
                      <div className={clsx("text-sm font-semibold", selected ? "text-zinc-500" : "")}>M{s.mag ?? "—"}</div>
                      <div className="text-xs opacity-60">{s.felt ? `${s.felt} felt` : ""}</div>
                    </div>

                    <div className=" min-w-0">
                      <div className="font-medium ">{s.place}</div>
                      <div className="text-xs opacity-60 ">{fmtDate(s.time)}</div>
                    </div>

                    <div className=" text-right">
                      <Badge className={badgeClassFromTheme(r) + " px-2 py-1 rounded-full text-xs font-medium"}>#{r.id}</Badge>
                    </div>
                  </div>
                );
              })}
              {randomLoading && <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>}
            </div>
          </ScrollArea>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick filters</div>
            <div className="text-xs opacity-60 mb-2">Adjust range and min magnitude then Search.</div>
           <div className="space-y-4">
  {/* Start Date */}
  <div className="flex flex-col gap-1">
    <div className="text-xs">Start</div>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left cursor-pointer"
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
          {startDate ? format(new Date(startDate), "PPP") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Calendar
          mode="single"
          selected={startDate ? new Date(startDate) : undefined}
          onSelect={(d) => d && setStartDate(d.toISOString().slice(0, 10))}
          disabled={(date) => date > new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  </div>

  {/* End Date */}
  <div className="flex flex-col gap-1">
    <div className="text-xs">End</div>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left cursor-pointer"
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
          {endDate ? format(new Date(endDate), "PPP") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Calendar
          mode="single"
          selected={endDate ? new Date(endDate) : undefined}
          onSelect={(d) => d && setEndDate(d.toISOString().slice(0, 10))}
          disabled={(date) => date > new Date()}
          initialFocus
          
        />
      </PopoverContent>
    </Popover>
  </div>

  {/* Min Magnitude */}
  <div className="flex flex-col gap-1">
    <div className="text-xs">Min magnitude</div>
    <Input
      placeholder="e.g. 2.5"
      value={minMag}
      onChange={(e) => setMinMag(e.target.value)}
      className="cursor-pointer"
    />
  </div>

  {/* Buttons */}
  <div className="flex gap-2 pt-1">
    <Button
      variant="outline"
      onClick={() => {
        setQuery("");
        setMinMag("");
        const d = new Date();
        const y = new Date(d);
        y.setDate(y.getDate() - 1);
        setStartDate(y.toISOString().slice(0, 10));
        setEndDate(new Date().toISOString().slice(0, 10));
      }}
      className="cursor-pointer"
    >
      Reset
    </Button>

    <Button onClick={handleSearch} className="cursor-pointer">
      Search
    </Button>
  </div>
</div>

          </div>
        </aside>

        {/* Center: Preview */}
        <section className="lg:col-span-9">
          <Card className={clsx("rounded-2xl overflow-hidden border", cardBg)}>
            <CardHeader className={clsx("p-5 flex flex-wrap items-center justify-between", headerBg)}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Users /> Selected Event</CardTitle>
                <div className="text-xs opacity-60">{selectedFeature?.properties?.place ?? "No event selected"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fetchEarthquakes({ starttime: startDate, endtime: endDate, minmagnitude: minMag || undefined })} className="cursor-pointer">
                  <Loader2 className={loading ? "animate-spin" : ""} /> Refresh
                </Button>

                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer"><FileText /> {showRaw ? "Hide Raw" : "Raw"}</Button>

                <Button variant="ghost" onClick={() => setCoordsDialogOpen(true)} className="cursor-pointer"><MapPin /> Coords</Button>

                <Button variant="ghost" onClick={() => { setMapEmbedOpen(true); setMapDialogOpen(true); }} className="cursor-pointer"><Globe /> Map</Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selectedFeature ? (
                <div className="py-12 text-center text-sm opacity-60">Select an event from the list or run a search to inspect details.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: magnitude visual & actions */}
                  <div className={clsx("p-4 rounded-xl border md:col-span-1", cardBg)}>
                    <div className="flex items-center gap-3">
                     <div
  className={clsx(
    "rounded-full p-4 text-center w-28 h-28 flex items-center justify-center",
    "backdrop-blur-md shadow-lg border",
    // dynamic based on magnitude
    selectedFeature?.properties?.mag >= 6
      ? "bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-300"
      : selectedFeature?.properties?.mag >= 4
      ? "bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300"
      : "bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-300"
  )}
>
  <div className="text-3xl font-bold">
   {selectedFeature?.properties?.mag != null
  ? Number(selectedFeature.properties.mag).toFixed(2)
  : "—"}

    <div className="text-xs opacity-80">Magnitude</div>
  </div>
</div>


                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-semibold">{selectedFeature.properties?.place}</div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Clock size={14} /> {fmtDate(selectedFeature.properties?.time)}</div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <Badge className={badgeClassFromTheme(selectedFeature) + " px-2 py-1 rounded-full text-xs font-medium"}>{selectedFeature.properties?.status ?? "event"}</Badge>
                          {selectedFeature.properties?.net && <Badge className={badgeClassFromTheme(selectedFeature) + " px-2 py-1 rounded-full text-xs font-medium"}>{selectedFeature.properties?.net}</Badge>}
                          {selectedFeature.properties?.type && <Badge className={badgeClassFromTheme(selectedFeature) + " px-2 py-1 rounded-full text-xs font-medium"}>{selectedFeature.properties?.type}</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Depth</div>
                        <div className="font-medium">{(selectedFeature.geometry?.coordinates?.[2] ?? "—")} km</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Felt reports</div>
                        <div className="font-medium">{selectedFeature.properties?.felt ?? "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Tsunami</div>
                        <div className="font-medium">{selectedFeature.properties?.tsunami ? "Yes" : "No"}</div>
                      </div>

                    </div>

                     <aside className={clsx(" rounded-2xl p-4 space-y-4 h-fit", containerBg)}>
          <div>
            <div className="flex items-start justify-between">
              <div className="text-sm font-semibold">Quick actions</div>
              <div className="text-xs opacity-60">{features.length || 0} events</div>
            </div>

            <div className="mt-3 space-y-2">
              <Button variant="outline" onClick={() => { copySelectedJSON(); }} className="w-full cursor-pointer"><Copy /> Copy selection</Button>
              <Button variant="outline" onClick={() => downloadGeoJSON(selectedFeature || rawGeo, selectedFeature ? `quake_${selectedFeature.id}.json` : `usgs_events.json`)} className="w-full cursor-pointer"><Download /> Download</Button>
              <Button variant="outline" onClick={() => setShowRaw((s) => !s)} className="w-full cursor-pointer"><List /> Toggle RAW</Button>
              <Button variant="outline" onClick={() => { if (rawGeo) downloadGeoJSON(rawGeo, "usgs_geojson_export.json"); else showToast?.("info", "No data to export"); }} className="w-full cursor-pointer"><Activity /> Export all</Button>
              <Button variant="ghost" onClick={() => window.open(usgsEndpoint({ starttime: startDate, endtime: endDate, minmagnitude: minMag || undefined }), "_blank")} className="w-full cursor-pointer"><ExternalLink /> Open API URL</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About</div>
            <div className="text-xs opacity-60">This viewer queries the USGS GeoJSON feed. Inspect properties, preview map areas, and export data. Designed for responsive dark & light themes.</div>
          </div>
        </aside>
                  </div>

                  {/* Right: properties list & small map */}
                  <div className={clsx("p-4 rounded-xl border md:col-span-2", cardBg)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold flex items-center gap-2"><BarChart2 /> Properties</div>
                      <div className="text-xs opacity-60">id: <span className="font-mono ml-1">{selectedFeature.id}</span></div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {/* Properties scroll area */}
                      <div className="rounded-md border overflow-hidden">
                        <ScrollArea style={{ maxHeight: 240 }}>
                          <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(selectedFeature.properties || {}).map(([k, v]) => (
                              <div key={k} className="p-2 rounded-md border">
                                <div className="text-xs opacity-60">{k}</div>
                                <div className="text-sm font-medium break-words">{typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Geometry & small map preview */}
                      <div className="rounded-md border p-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold flex items-center gap-2"><MapPin /> Map area</div>
                          <div className="text-xs opacity-60">Preview</div>
                        </div>

                        <div className="rounded-md overflow-hidden border h-88">
                          {selectedCoords ? (
                            <iframe
                              title="OSM embed"
                              src={osmEmbedUrl(selectedCoords.lat, selectedCoords.lon, selectedFeature.properties?.mag)}
                              style={{ width: "100%", height: "100%", border: 0 }}
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-sm opacity-60">No coords</div>
                          )}
                        </div>

                        <div className="mt-2 flex gap-2">
                          <Button variant="ghost" onClick={() => { setMapEmbedOpen(true); setMapDialogOpen(true); }} className="cursor-pointer"><Eye /> Open Map</Button>
                          <Button variant="outline" onClick={() => downloadGeoJSON(selectedFeature, `quake_${selectedFeature.id}_map.json`)} className="cursor-pointer"><Download /> Save</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawGeo && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <ScrollArea style={{ maxHeight: 300 }}>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")}>
                      {prettyJSON(rawGeo)}
                    </pre>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: quick actions */}
       
      </main>

      {/* Coordinates dialog */}
      <Dialog open={coordsDialogOpen} onOpenChange={setCoordsDialogOpen}>
        <DialogContent className={clsx("max-w-2xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Coordinates</DialogTitle>
          </DialogHeader>

          <div style={{ padding: 20 }}>
            {selectedFeature ? (
              <>
                <div className="text-sm font-semibold mb-2">{selectedFeature.properties?.place}</div>
                <div className="text-xs opacity-60 mb-2">Longitude, Latitude, Depth (km)</div>
                <div className="font-medium">{(selectedFeature.geometry?.coordinates || []).join(", ")}</div>
              </>
            ) : (
              <div className="text-sm opacity-60">No event selected.</div>
            )}
          </div>

          <DialogFooter className="flex justify-end items-center p-4 border-t">
            <Button variant="ghost" onClick={() => setCoordsDialogOpen(false)} className="cursor-pointer"><X /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Map dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={(v) => { setMapDialogOpen(v); setMapEmbedOpen(false); }}>
        <DialogContent className={clsx("max-w-4xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Event Map</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {selectedCoords ? (
              mapEmbedOpen ? (
                <iframe
                  title="OSM embed"
                  src={osmEmbedUrl(selectedCoords.lat, selectedCoords.lon, selectedFeature.properties?.mag)}
                  style={{ width: "100%", height: "100%", border: 0 }}
                />
              ) : (
                <img
                  src={osmStaticMapUrl(selectedCoords.lat, selectedCoords.lon, Math.max(3, Math.round((selectedFeature.properties?.mag ?? 4) * 1.2)), 1280, 720, true)}
                  alt="Full map"
                  style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                />
              )
            ) : (
              <div className="h-full flex items-center justify-center text-sm opacity-60">No coordinates available.</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Map: OpenStreetMap (static or embedded).</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMapDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => {
                if (selectedCoords) {
                  const { lat, lon } = selectedCoords;
                  const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=6/${lat}/${lon}`;
                  window.open(url, "_blank");
                }
              }} className="cursor-pointer"><ExternalLink /> Open OSM</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
