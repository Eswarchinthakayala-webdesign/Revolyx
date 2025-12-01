// src/pages/WorldBankPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Globe,
  ChevronRight,
  X,
  Download,
  ExternalLink,
  Loader2,
  BarChart2,
  List,
  Calendar,
  ChevronLeft,
  Menu,
  RefreshCw,
  MapPin,
  Check,
  FileText,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const WORLD_BANK_BASE = "https://api.worldbank.org/v2";
const COUNTRIES_ENDPOINT = `${WORLD_BANK_BASE}/country?format=json&per_page=300`;
const INDICATOR = "SP.POP.TOTL"; // total population
const INDICATOR_ENDPOINT = (iso) =>
  `${WORLD_BANK_BASE}/country/${encodeURIComponent(iso)}/indicator/${INDICATOR}?format=json&per_page=1000&date=1960:2024`;

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function normalizeCountryList(json) {
  if (!Array.isArray(json)) return [];
  const data = json[1] || [];
  return data
    .filter(Boolean)
    .map((c) => ({
      id: (c.id || "").toString(),
      name: c.name,
      iso2Code: c.iso2Code,
      region: c.region?.value || "N/A",
      incomeLevel: c.incomeLevel?.value || "N/A",
      capitalCity: c.capitalCity || "—",
      longitude: c.longitude || null,
      latitude: c.latitude || null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeIndicatorResponse(json) {
  if (!Array.isArray(json)) return { meta: null, data: [] };
  const meta = json[0] || null;
  const data = (json[1] || [])
    .filter(Boolean)
    .map((d) => ({
      year: d.date,
      value: d.value === null ? null : Number(d.value),
      indicator: d.indicator?.value || INDICATOR,
    }));
  data.sort((a, b) => Number(a.year) - Number(b.year));
  return { meta, data };
}

/* tiny accessible keyboard helper for suggestion nav */
function useKeyboardList(len = 10) {
  const [idx, setIdx] = useState(-1);
  function onKey(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(len - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(-1, i - 1));
    } else if (e.key === "Escape") {
      setIdx(-1);
    }
  }
  return { idx, setIdx, onKey };
}

/* Sparkline helper (kept small) */
function Sparkline({ data = [], height = 48 }) {
  if (!data || data.length === 0) {
    return <div className="h-[48px] flex items-center justify-center text-xs opacity-60">No data</div>;
  }
  const vals = data.map((d) => (d.value === null ? NaN : Number(d.value)));
  const valid = vals.filter((v) => !Number.isNaN(v));
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const w = Math.max(140, Math.min(400, valid.length * 6));
  const stepX = w / Math.max(1, vals.length - 1);
  const yFor = (v) => {
    if (Number.isNaN(v)) return height;
    if (max === min) return height / 2;
    return height - ((v - min) / (max - min)) * height;
  };
  const points = vals.map((v, i) => `${i * stepX},${yFor(v)}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full h-[48px]">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.6" points={points} strokeLinecap="round" strokeLinejoin="round" className="opacity-90" />
    </svg>
  );
}

export default function WorldBankPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [countries, setCountries] = useState([]);
  const [countriesRaw, setCountriesRaw] = useState(null);
  const [countryQuery, setCountryQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [indicatorRaw, setIndicatorRaw] = useState(null);
  const [indicatorData, setIndicatorData] = useState([]);
  const [loadingIndicator, setLoadingIndicator] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const [copied, setCopied] = useState(false);

  const [randomList, setRandomList] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const searchTimer = useRef(null);
  const suggestRef = useRef(null);

  const { idx: navIdx, setIdx: setNavIdx, onKey: onListKey } = useKeyboardList();

  /* Fetch countries on mount */
  useEffect(() => {
    let mounted = true;
    setLoadingCountries(true);
    fetch(COUNTRIES_ENDPOINT)
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        const list = normalizeCountryList(json || []);
        setCountries(list);
        setCountriesRaw(json);
        const defaultCountry =
          list.find((c) => c.id?.toLowerCase() === "ind") ||
          list.find((c) => c.id?.toLowerCase() === "usa") ||
          list[0] ||
          null;
        setSelectedCountry(defaultCountry);
        // build initial random list
        const rnd = pickRandom(list, 10);
        setRandomList(rnd);
      })
      .catch((err) => {
        console.error("Countries fetch failed", err);
      })
      .finally(() => setLoadingCountries(false));
    return () => {
      mounted = false;
    };
  }, []);

  /* When selectedCountry changes -> fetch indicator */
  useEffect(() => {
    if (!selectedCountry?.id) {
      setIndicatorData([]);
      setIndicatorRaw(null);
      return;
    }
    let mounted = true;
    async function fetchIndicator(iso) {
      setLoadingIndicator(true);
      setIndicatorData([]);
      setIndicatorRaw(null);
      try {
        const url = INDICATOR_ENDPOINT(iso);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`World Bank fetch failed (${res.status})`);
        const json = await res.json();
        if (!mounted) return;
        const { meta, data } = normalizeIndicatorResponse(json);
        setIndicatorRaw(json);
        setIndicatorData(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoadingIndicator(false);
      }
    }
    fetchIndicator(selectedCountry.id);
    return () => {
      mounted = false;
    };
  }, [selectedCountry]);

  /* helpers */
  function pickRandom(list, n) {
    if (!list || list.length === 0) return [];
    const out = [];
    const set = new Set();
    while (out.length < Math.min(n, list.length)) {
      const idx = Math.floor(Math.random() * list.length);
      if (set.has(idx)) continue;
      set.add(idx);
      out.push(list[idx]);
    }
    return out;
  }

  function onCountryInput(v) {
    setCountryQuery(v);
    if ((v || "").trim().length > 0) {
      setSuggestionsOpen(true);
    } else {
      setSuggestionsOpen(false);
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      // local filtering; kept for debounce effect
    }, 140);
  }

  function filteredSuggestions() {
    const q = (countryQuery || "").trim().toLowerCase();
    if (!q) return [];
    return countries
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.id || "").toLowerCase().includes(q) ||
        (c.iso2Code || "").toLowerCase().includes(q)
      )
      .slice(0, 12);
  }

  function selectCountry(c) {
    setSelectedCountry(c);
    setCountryQuery("");
    setSuggestionsOpen(false);
    setNavIdx(-1);
    setShowRaw(false);
    // close mobile sidebar if open
    setSidebarOpen(false);
  }

  function onSearchKeyDown(e) {
    onListKey(e);
    const list = filteredSuggestions();
    if (e.key === "Enter") {
      e.preventDefault();
      if (navIdx >= 0 && navIdx < list.length) {
        selectCountry(list[navIdx]);
      } else if (list.length > 0) {
        selectCountry(list[0]);
      }
    }
  }

  async function copyJSON() {
    const payload = indicatorRaw || {};
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(prettyJSON(payload));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (err) {
      console.error(err);
    }
  }

  function downloadJSON() {
    if (!indicatorRaw) return;
    const blob = new Blob([prettyJSON(indicatorRaw)], { type: "application/json" });
    const a = document.createElement("a");
    const safeName = (selectedCountry?.name || "country").replace(/\s+/g, "_");
    a.href = URL.createObjectURL(blob);
    a.download = `${safeName}_${INDICATOR}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function refreshRandom() {
    setRandomList(pickRandom(countries, 10));
  }

  const chartData = useMemo(() => {
    if (!indicatorData || indicatorData.length === 0) return [];
    return indicatorData.map((d) => ({
      year: d.year,
      value: d.value,
      label: `${d.year}`,
    }));
  }, [indicatorData]);

  function ChartTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0].payload;
    return (
      <div className={clsx("rounded-md shadow-lg p-3 text-sm max-w-xs", isDark ? "bg-zinc-900 text-white" : "bg-white border")}>
        <div className="font-medium">{selectedCountry?.name}</div>
        <div className="text-xs opacity-70">{label}</div>
        <div className="mt-1 text-lg font-semibold">{item.value === null ? "—" : Number(item.value).toLocaleString()}</div>
      </div>
    );
  }

  const latestNonNull = [...indicatorData].reverse().find((d) => d.value !== null) || null;
  const latestYear = latestNonNull?.year ?? (indicatorData.length ? indicatorData[indicatorData.length - 1].year : "—");
  const latestVal = latestNonNull?.value ?? null;

  /* Map iframe helper */
  function mapUrlFor(country) {
    // if lat/lon present, use q=lat,lon, else fallback to searching country name
    const lat = country?.latitude;
    const lon = country?.longitude;
    if (lat && lon && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
      return `https://www.google.com/maps?q=${encodeURIComponent(lat + "," + lon)}&output=embed&z=5`;
    }
    // fallback query by country name
    return `https://www.google.com/maps?q=${encodeURIComponent(country?.name || "")}&output=embed&z=5`;
  }

  const suggestionList = filteredSuggestions();
  const showSuggestions = suggestionsOpen && suggestionList.length > 0;

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 max-w-9xl mx-auto")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" className="p-2 rounded-md cursor-pointer"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">Countries</div>
                  <Button variant="ghost" size="sm" onClick={() => refreshRandom()} className="cursor-pointer"><RefreshCw /></Button>
                </div>
                <ScrollArea style={{ height: 560 }}>
                  <div className="space-y-2 p-2">
                    {randomList.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => selectCountry(r)}
                        className={clsx("flex items-center gap-3 p-2 rounded-md cursor-pointer transition", selectedCountry?.id === r.id ? "ring-2 ring-zinc-400/30 bg-zinc-50 dark:bg-zinc-800/40 border" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50")}
                      >
                        <div className="w-10 h-8 flex items-center justify-center rounded-sm border bg-white/30 glass">
                          <span className="text-xs font-medium">{r.iso2Code || r.id}</span>
                        </div>
                        <div className="w-40">
                          <div className="font-medium  truncate">{r.name}</div>
                          <div className="text-xs opacity-60  truncate">{r.region} • {r.incomeLevel}</div>
                        </div>
                        <div className="ml-auto text-xs opacity-60">#{r.id}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">World Bank — Population Explorer</h1>
            <div className="text-xs opacity-70">Indicator: <span className="font-medium">{INDICATOR}</span></div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const list = filteredSuggestions();
            if (list.length > 0) selectCountry(list[0]);
          }}
          className={clsx("flex items-center gap-2 w-full md:w-[680px] rounded-xl px-3 py-1.5 shadow-sm", isDark ? "bg-gradient-to-r from-zinc-900/70 to-zinc-900/50 border border-zinc-800" : "bg-white border border-zinc-200")}
          role="search"
          aria-label="Search country"
        >
          <Search className="opacity-60" />
          <Input
            aria-label="Search country by name / id / iso"
            placeholder="Type country name or ISO/ID (e.g. IND, USA, CHN)…"
            value={countryQuery}
            onChange={(e) => onCountryInput(e.target.value)}
            onFocus={() => { if ((countryQuery || "").trim().length > 0) setSuggestionsOpen(true); }}
            onKeyDown={onSearchKeyDown}
            className="border-0 shadow-none bg-transparent outline-none"
          />
          <Button type="button" variant="ghost" onClick={() => { setCountryQuery(""); setSuggestionsOpen(false); }} className="cursor-pointer"><X /></Button>
          <Button type="button" variant="outline" onClick={() => { setSelectedCountry({ ...selectedCountry }); }} className="cursor-pointer"><RefreshCw /></Button>
        </form>
      </header>

      {/* Suggestions overlay */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            ref={suggestRef}
            role="listbox"
            aria-label="country suggestions"
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_340px)] md:right-auto max-w-4xl rounded-2xl overflow-hidden shadow-2xl", isDark ? "bg-zinc-950 border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingCountries && (
              <li className="p-3 text-sm opacity-60 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading countries…</li>
            )}
            {suggestionList.map((c, i) => (
              <li
                key={c.id + i}
                role="option"
                aria-selected={selectedCountry?.id === c.id}
                onClick={() => selectCountry(c)}
                onMouseEnter={() => setNavIdx(i)}
                className={clsx("px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer flex items-center justify-between gap-4", navIdx === i ? "bg-zinc-100 dark:bg-zinc-800/60" : "")}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx("rounded-sm w-11 h-8 flex items-center justify-center text-sm font-medium border", isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200")}>
                    {c.iso2Code || c.id}
                  </div>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs opacity-60">{c.region} • {c.incomeLevel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs opacity-60">{c.capitalCity || "—"}</div>
                  <ChevronRight className="opacity-60" />
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: desktop sidebar */}
        <aside className={clsx("hidden lg:block lg:col-span-3 space-y-4 rounded-2xl p-4 h-fit shadow-sm", isDark ? "bg-zinc-950 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Random picks</div>
              <div className="text-xs opacity-60">Quick select</div>
            </div>
            <div className="text-xs opacity-60">{countries.length} total</div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => { setSelectedCountry(null); setIndicatorData([]); setShowRaw(false); }}>
                <Globe /> Clear
              </Button>
              <Button variant="ghost" className="cursor-pointer" onClick={() => refreshRandom()}><RefreshCw /></Button>
            </div>

            <ScrollArea className="overflow-y-auto" style={{ maxHeight: 420 }}>
              <div className="space-y-2 mt-2 p-2">
                {randomList.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => selectCountry(r)}
                    className={clsx("flex items-center gap-3 p-2 rounded-md cursor-pointer transition", selectedCountry?.id === r.id ? "ring-2 ring-zinc-400/30 bg-zinc-50 dark:bg-zinc-800/40 border" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50")}
                  >
                    <div className="w-10 h-8 flex items-center justify-center rounded-sm border bg-gradient-to-br from-white/30 to-white/10 glass">
                      <span className="text-xs font-medium">{r.iso2Code || r.id}</span>
                    </div>
                    <div className="w-40">
                      <div className="font-medium truncate">{r.name}</div>
                      <div className="text-xs opacity-60 truncate">{r.region} • {r.incomeLevel}</div>
                    </div>
                    <div className="ml-auto text-xs opacity-60">#{r.id}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About</div>
            <div className="text-xs opacity-60">Data from the World Bank API. Indicator is population (SP.POP.TOTL).</div>
          </div>
        </aside>

        {/* Center: details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border shadow-sm", isDark ? "bg-black border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex flex-wrap items-center justify-between", isDark ? "bg-zinc-900/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe /> <span>Country overview</span>
                </CardTitle>
                <div className="text-xs opacity-60">{selectedCountry?.name ?? "Select a country to view population data"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer"><FileText /> {showRaw ? "Hide raw" : "Raw"}</Button>
              
                <Button variant="outline" onClick={() => downloadJSON()} disabled={!indicatorRaw} className="cursor-pointer"><ExternalLink /> Download</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingIndicator ? (
                <div className="py-16 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selectedCountry ? (
                <div className="py-12 text-center text-sm opacity-60">No country selected — use search, quick picks or the sidebar.</div>
              ) : (
                <div className="space-y-4">
                  <div className={clsx("p-4 rounded-xl border shadow-sm", isDark ? "bg-zinc-900/20 border-zinc-800" : "bg-white/80 border-zinc-200")}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 p-3">

  {/* Left Section */}
  <div className="flex-1 min-w-0">
    <div className="text-xl font-semibold flex items-center flex-wrap gap-2">
      {selectedCountry.name}

      <Badge className="glass">{selectedCountry.iso2Code || selectedCountry.id}</Badge>
      <Badge variant="secondary" className="glass">{selectedCountry.incomeLevel}</Badge>
    </div>

    <div className="text-sm opacity-70 mt-2 flex flex-col sm:flex-row gap-2 sm:gap-5">
      <div className="flex items-center gap-1">
        <MapPin className="w-4 h-4 opacity-70" />
        {selectedCountry.capitalCity || "—"}
      </div>

      <div className="flex items-center gap-1">
        <Calendar className="w-4 h-4 opacity-70" />
        Region: {selectedCountry.region}
      </div>
    </div>
  </div>

  {/* Right Section */}
  <div className="text-left sm:text-right w-full sm:w-auto">
    <div className="text-xs opacity-60">Latest population</div>
    <div className="text-3xl font-bold mt-1">
      {latestVal !== null ? latestVal.toLocaleString() : "—"}
    </div>
    <div className="text-xs opacity-60">{latestYear}</div>

    {/* Buttons */}
    <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
      <Button
        variant="ghost"
        onClick={() => setMapOpen(true)}
        className="cursor-pointer flex items-center gap-1"
      >
        <MapPin className="w-4 h-4" /> View map
      </Button>

      <Button
        variant="outline"
        onClick={() => window.open(`https://data.worldbank.org/country/${selectedCountry.id}`, "_blank")}
        className="cursor-pointer flex items-center gap-1"
      >
        <ExternalLink className="w-4 h-4" /> Source
      </Button>
    </div>
  </div>

</div>


                    <div className="mt-4">
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2"><BarChart2 /> Population (trend)</div>
                      <div className="rounded-md border p-3">
                        <div style={{ height: 280 }} className="w-full">
                          {chartData.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 8, right: 20, left: 8, bottom: 8 }}>
                                <defs>
                                  <linearGradient id="populationGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
                                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.04} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                                <YAxis
                                  tickFormatter={(v) =>
                                    v === null ? "—" : v >= 1e9 ? `${Math.round(v / 1e9)}B` : v >= 1e6 ? `${Math.round(v / 1e6)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : v
                                  }
                                  width={72}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="url(#populationGradient)" connectNulls />
                              </AreaChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-[180px] flex items-center justify-center text-sm opacity-60">No population data available to plot.</div>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs opacity-60">
                          <div>Years: {indicatorData.length}</div>
                          <div>Indicator: {INDICATOR}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={clsx("p-4 rounded-xl border shadow-sm", isDark ? "bg-zinc-900/20 border-zinc-800" : "bg-white/80 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Calendar /> Data table (year → population)</div>
                    <div className="max-h-[46vh] overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 dark:bg-black bg-white">
                          <tr className="text-xs opacity-60 text-left">
                            <th className="py-2 pr-4">Year</th>
                            <th className="py-2">Population</th>
                          </tr>
                        </thead>
                        <tbody>
                          {indicatorData.length === 0 && <tr><td colSpan={2} className="py-6 text-center opacity-60">No data available</td></tr>}
                          {indicatorData.map((r) => (
                            <tr key={r.year} className="border-t">
                              <td className="py-2 pr-4">{r.year}</td>
                              <td className="py-2">{r.value === null ? "—" : Number(r.value).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showRaw && indicatorRaw && (
                      <motion.pre initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={clsx("text-xs overflow-auto p-3 rounded-md border", isDark ? "bg-zinc-900/30 border-zinc-800 text-zinc-200" : "bg-white/60 border-zinc-200 text-zinc-900")} style={{ maxHeight: 260 }}>
                        {prettyJSON(indicatorRaw)}
                      </motion.pre>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions & metadata */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit shadow-sm", isDark ? "bg-zinc-950 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-1 flex items-center gap-2">Quick actions <RefreshCw className="opacity-60" /></div>
            <div className="text-xs opacity-60 mb-3">Utilities & links</div>

            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => { if (selectedCountry) window.open(`https://data.worldbank.org/country/${selectedCountry.id}`, "_blank"); }}>
                <ExternalLink /> Open in World Bank
              </Button>
              <Button variant="ghost" className="w-full cursor-pointer" onClick={() => setShowRaw((s) => !s)}><List /> Toggle Raw</Button>
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => downloadJSON()} disabled={!indicatorRaw}><Download /> Download JSON</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-1">Country details</div>
            <div className="text-xs opacity-60">Quick metadata</div>

            <div className="mt-3 space-y-2">
              <div className="text-xs opacity-60">ISO</div>
              <div className="font-medium">{selectedCountry?.id ?? "—"}</div>

              <div className="text-xs opacity-60">Region</div>
              <div className="font-medium">{selectedCountry?.region ?? "—"}</div>

              <div className="text-xs opacity-60">Income level</div>
              <div className="font-medium">{selectedCountry?.incomeLevel ?? "—"}</div>

              <div className="text-xs opacity-60">Capital</div>
              <div className="font-medium">{selectedCountry?.capitalCity ?? "—"}</div>
            </div>
          </div>

          <Separator />

          <div className="text-xs opacity-60">Countries fetched: <span className="font-medium">{countries.length || "—"}</span></div>
        </aside>
      </main>

      {/* Map dialog */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className={clsx("max-w-5xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selectedCountry?.name || "Map"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh" }} className="w-full">
            {selectedCountry ? (
              <iframe
                title="country-map"
                src={mapUrlFor(selectedCountry)}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
              />
            ) : (
              <div className="h-full flex items-center justify-center"><Info /> No location</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Map powered by Google Maps</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMapOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { if (selectedCountry) window.open(`https://www.google.com/maps/search/${encodeURIComponent(selectedCountry.name)}`); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
