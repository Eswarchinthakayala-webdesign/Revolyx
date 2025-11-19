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
  ChevronLeft
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

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

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function normalizeCountryList(json) {
  // World Bank returns [meta, data[]]
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
  // World Bank returns [meta, data[]]
  if (!Array.isArray(json)) return { meta: null, data: [] };
  const meta = json[0] || null;
  const data = (json[1] || [])
    .filter(Boolean)
    .map((d) => ({
      year: d.date,
      value: d.value === null ? null : Number(d.value),
      indicator: d.indicator?.value || INDICATOR,
    }));
  // sort ascending by year for chart
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

/* ---------- Sparkline (small preview) ---------- */
function Sparkline({ data = [], height = 56 }) {
  if (!data || data.length === 0) {
    return <div className="h-[56px] flex items-center justify-center text-xs opacity-60">No data</div>;
  }
  // convert ascending to ascending for sparkline (data already ascending)
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
    <svg width="100%" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full h-[56px]">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.6" points={points} strokeLinecap="round" strokeLinejoin="round" className="opacity-90" />
    </svg>
  );
}

/* ---------- Page component ---------- */
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

  const [selectedCountry, setSelectedCountry] = useState(null); // object with id & name
  const [indicatorRaw, setIndicatorRaw] = useState(null);
  const [indicatorData, setIndicatorData] = useState([]); // array {year, value}
  const [loadingIndicator, setLoadingIndicator] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const searchTimer = useRef(null);
  const suggestRef = useRef(null);

  // keyboard nav length dynamic
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
        // default country preference: India if present, else USA, else first
        const defaultCountry =
          list.find((c) => c.id?.toLowerCase() === "ind") ||
          list.find((c) => c.id?.toLowerCase() === "usa") ||
          list[0] ||
          null;
        setSelectedCountry(defaultCountry);
      })
      .catch((err) => {
        console.error("Countries fetch failed", err);
      })
      .finally(() => setLoadingCountries(false));
    return () => {
      mounted = false;
    };
  }, []);

  /* Fetch indicator when country changes */
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

  /* Suggestion search (debounced). Show suggestions only when user started typing (trim length > 0) */
  function onCountryInput(v) {
    setCountryQuery(v);
    if ((v || "").trim().length > 0) {
      setSuggestionsOpen(true);
    } else {
      setSuggestionsOpen(false);
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      // nothing else required; filtering is local
    }, 160);
  }

  function filteredSuggestions() {
    const q = (countryQuery || "").trim().toLowerCase();
    if (!q) return [];
    return countries
      .filter((c) => c.name.toLowerCase().includes(q) || (c.id || "").toLowerCase().includes(q) || (c.iso2Code || "").toLowerCase().includes(q))
      .slice(0, 12);
  }

  function selectCountry(c) {
    setSelectedCountry(c);
    setCountryQuery("");
    setSuggestionsOpen(false);
    setNavIdx(-1);
    setShowRaw(false);
  }

  function onSearchKeyDown(e) {
    // delegate to keyboard nav for suggestions
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

  function copyJSON() {
    if (!indicatorRaw) return;
    navigator.clipboard.writeText(prettyJSON(indicatorRaw));
  }

  function downloadJSON() {
    if (!indicatorRaw) return;
    const blob = new Blob([prettyJSON(indicatorRaw)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safeName = (selectedCountry?.name || "country").replace(/\s+/g, "_");
    a.download = `${safeName}_${INDICATOR}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* Prepare chart data for Recharts (ascending years) */
  const chartData = useMemo(() => {
    if (!indicatorData || indicatorData.length === 0) return [];
    return indicatorData.map((d) => ({
      year: d.year,
      value: d.value,
      label: `${d.year}`,
    }));
  }, [indicatorData]);

  /* Chart tooltip component */
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

  /* Latest summary */
  const latestNonNull = [...indicatorData].reverse().find((d) => d.value !== null) || null;
  const latestYear = latestNonNull?.year ?? (indicatorData.length ? indicatorData[indicatorData.length - 1].year : "—");
  const latestVal = latestNonNull?.value ?? null;

  /* small UI helpers */
  const suggestionList = filteredSuggestions();
  const showSuggestions = suggestionsOpen && suggestionList.length > 0;

  return (
    <div className={clsx("min-h-screen p-6 max-w-9xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold tracking-tight")}>World Bank — Population Explorer</h1>
          <p className="mt-1 text-sm opacity-70 max-w-2xl">
            Explore population history (SP.POP.TOTL) for every country. Type a country name or code to search — suggestions appear as you type.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const list = filteredSuggestions();
              if (list.length > 0) selectCountry(list[0]);
            }}
            className={clsx(
              "flex items-center gap-2 w-full md:w-[680px] rounded-xl px-3 py-1.5 shadow-sm",
              isDark ? "bg-gradient-to-r from-zinc-900/70 to-zinc-900/50 border border-zinc-800" : "bg-white border border-zinc-200"
            )}
            role="search"
            aria-label="Search country"
          >
            <Search className="opacity-60" />
            <Input
              aria-label="Search country"
              placeholder="Start typing to see suggestions… e.g. India, United States, CHN"
              value={countryQuery}
              onChange={(e) => onCountryInput(e.target.value)}
              onFocus={() => { if ((countryQuery || "").trim().length > 0) setSuggestionsOpen(true); }}
              onKeyDown={onSearchKeyDown}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="button" variant="ghost" onClick={() => { setCountryQuery(""); setSuggestionsOpen(false); }}>
              <X />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (selectedCountry) {
                  // re-fetch
                  setSelectedCountry({ ...selectedCountry });
                }
              }}
            >
              Refresh
            </Button>
          </form>
        </div>
      </header>

      {/* Suggestions overlay (only show when typing) */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            ref={suggestRef}
            role="listbox"
            aria-label="country suggestions"
            className={clsx(
              "absolute z-50 left-6 right-6 md:left-[calc(50%_-_340px)] md:right-auto max-w-4xl rounded-2xl overflow-hidden shadow-2xl",
              isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            {loadingCountries && (
              <li className="p-3 text-sm opacity-60 flex items-center gap-2">
                <Loader2 className="animate-spin" /> Loading countries…
              </li>
            )}
            {suggestionList.map((c, i) => (
              <li
                key={c.id + i}
                role="option"
                aria-selected={selectedCountry?.id === c.id}
                onClick={() => selectCountry(c)}
                onMouseEnter={() => setNavIdx(i)}
                className={clsx(
                  "px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer flex items-center justify-between gap-4",
                  navIdx === i ? "bg-zinc-100 dark:bg-zinc-800/60" : ""
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "rounded-sm w-11 h-8 flex items-center justify-center text-sm font-medium border",
                      isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"
                    )}
                  >
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

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: country list / quick filters */}
        <aside className={clsx("lg:col-span-3 space-y-4 rounded-2xl p-4 h-fit shadow-sm", isDark ? "bg-zinc-950 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Countries</div>
              <div className="text-xs opacity-60">Browse & select</div>
            </div>
            <div className="text-xs opacity-60">{countries.length} total</div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-between" onClick={() => { setSelectedCountry(null); setIndicatorData([]); setShowRaw(false); }}>
              <div className="flex items-center gap-2"><Globe /> Clear selection</div>
              <ChevronLeft />
            </Button>

            <Button variant="ghost" className="w-full" onClick={() => { setSuggestionsOpen((s) => !s); }}>
              <List /> Toggle suggestions
            </Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick picks</div>
            <div className="grid grid-cols-1 gap-2">
              {["IND", "USA", "CHN", "BRA", "NGA"].map((id) => {
                const c = countries.find((x) => (x.id || "").toUpperCase() === id.toUpperCase() || x.id === id.toLowerCase());
                return (
                  <Button key={id} variant="outline" className="justify-between" onClick={() => c && selectCountry(c)}>
                    <div className="flex items-center gap-2">
                      <div className="text-xs opacity-70">{id}</div>
                      <div>{c ? c.name : id}</div>
                    </div>
                    <ChevronRight />
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About</div>
            <div className="text-xs opacity-60">Data from the World Bank API. Indicator: <span className="font-medium">{INDICATOR}</span></div>
            <div className="text-xs opacity-60 mt-2">Tip: start typing a country to see live suggestions — suggestions won't appear if the field is empty.</div>
          </div>
        </aside>

        {/* Center: country details (large, full details) */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border shadow-sm", isDark ? "bg-black border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-zinc-900/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Country overview</CardTitle>
                <div className="text-xs opacity-60">{selectedCountry?.name ?? "Select a country to view population data"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide raw" : "Raw"}</Button>
                <Button variant="outline" onClick={() => copyJSON()} disabled={!indicatorRaw}><Download /> Copy</Button>
                <Button variant="outline" onClick={() => downloadJSON()} disabled={!indicatorRaw}><ExternalLink /> Download</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingIndicator ? (
                <div className="py-16 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selectedCountry ? (
                <div className="py-12 text-center text-sm opacity-60">No country selected — use search or quick picks.</div>
              ) : (
                <div className="space-y-4">
                  <div className={clsx("p-4 rounded-xl border shadow-sm", isDark ? "bg-zinc-900/20 border-zinc-800" : "bg-white/80 border-zinc-200")}>
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="">
                        <div className="text-lg font-semibold">{selectedCountry.name}</div>
                        <div className="text-sm opacity-60">{selectedCountry.region} • {selectedCountry.incomeLevel} • Capital: {selectedCountry.capitalCity || "—"}</div>
                      </div>
                      <div className="">
                        <div className="text-xs opacity-60">Latest population</div>
                        <div className="text-2xl font-bold">{latestVal !== null ? latestVal.toLocaleString() : "—"}</div>
                        <div className="text-xs opacity-60">{latestYear}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-semibold mb-2">Population (trend)</div>
                      <div className="rounded-md border p-3">
                        {/* Recharts Area Chart */}
                        <div style={{ height: 300 }} className="w-full">
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
                    <div className="text-sm font-semibold mb-3">Data table (year → population)</div>
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

        {/* Right: quick actions and metadata */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit shadow-sm", isDark ? "bg-zinc-950 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-1">Quick actions</div>
            <div className="text-xs opacity-60 mb-3">Utilities & links</div>

            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full" onClick={() => { if (selectedCountry) window.open(`https://data.worldbank.org/country/${selectedCountry.id}`, "_blank"); }}>
                <ExternalLink /> Open in World Bank
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => { setShowRaw((s) => !s); }}>
                <List /> Toggle Raw view
              </Button>
              <Button variant="outline" className="w-full" onClick={() => downloadJSON()} disabled={!indicatorRaw}>
                <Download /> Download JSON
              </Button>
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

          <div className="text-xs opacity-60">Last fetched: <span className="font-medium">{indicatorRaw?.[0]?.page ? `Page ${indicatorRaw[0].page}` : "—"}</span></div>
        </aside>
      </main>
    </div>
  );
}
