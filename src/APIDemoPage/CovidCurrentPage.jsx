// CovidCurrentPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Copy,
  Download,
  List,
  Loader2,
  ExternalLink,
  MapPin,
  BarChart2,
  Activity,
  Heart,
  Percent,
  Award,
  TrendingUp,
  Zap,
  Check,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";

/* shadcn-like UI additions (Sheet, ScrollArea) */
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const ENDPOINT = "/api/covid/v4/min/data.min.json";
const DEFAULT_SELECTION = "TT";
const DEBOUNCE_MS = 300;

/* ---------- Utilities ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function pct(part, total) {
  if (!part || !total) return 0;
  return Math.round((part / total) * 10000) / 100; // 2 decimals
}

/* ---------- UI subcomponents ---------- */
function StatCardCompact({ label, value, delta, icon, tone = "neutral" }) {
  return (
    <div className="p-3 rounded-lg border flex items-center gap-3 bg-transparent shadow-sm">
      <div
        className={clsx(
          "w-10 h-10 rounded-md flex items-center justify-center",
          tone === "warn"
            ? "bg-yellow-50 dark:bg-yellow-600"
            : tone === "good"
            ? "bg-green-50 dark:bg-green-600"
            : "bg-zinc-50 dark:bg-zinc-700"
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-xs opacity-60">{label}</div>
        <div className="text-lg font-semibold">
          {value !== null ? value.toLocaleString() : "—"}
        </div>
        <div className="text-xs opacity-60">
          {delta !== null ? `Δ ${delta >= 0 ? "+" : ""}${delta}` : ""}
        </div>
      </div>
    </div>
  );
}

function TinyProgress({ pctValue }) {
  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
      <div
        style={{ width: `${Math.min(100, Math.max(0, pctValue))}%` }}
        className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700"
      />
    </div>
  );
}

/* ---------- Main component ---------- */
export default function CovidCurrentPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // data & loading
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // search
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const searchTimer = useRef(null);

  // selection and UI
  const [selected, setSelected] = useState({ type: "state", key: DEFAULT_SELECTION });
  const [showRaw, setShowRaw] = useState(false);

  // copy button animated state
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  // mobile sheet
  const [sheetOpen, setSheetOpen] = useState(false);

  /* ---------- load dataset ---------- */
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
        const json = await res.json();
        if (mounted) setData(json);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || "Failed to fetch dataset");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------- index for search ---------- */
  const idx = useMemo(() => {
    if (!data) return { states: [], districts: [] };
    const states = Object.keys(data).map((code) => {
      const node = data[code] || {};
      const name = node?.meta?.name || node?.meta?.state || node?.meta?.state_name || code;
      return { code, name };
    });
    const districts = [];
    for (const code of Object.keys(data)) {
      const districtObj = data[code]?.districts || {};
      for (const dname of Object.keys(districtObj || {})) {
        districts.push({ state: code, district: dname });
      }
    }
    return { states, districts };
  }, [data]);

  /* ---------- search helpers ---------- */
  function buildSuggestions(q) {
    setLoadingSuggest(true);
    try {
      const qq = (q || "").trim().toLowerCase();
      if (!qq) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const out = [];
      for (const s of idx.states) {
        if (s.code.toLowerCase().includes(qq) || s.name?.toLowerCase().includes(qq)) {
          out.push({ type: "state", key: s.code, display: `${s.code} — ${s.name}` });
        }
      }
      for (const d of idx.districts) {
        if (d.district.toLowerCase().includes(qq)) {
          out.push({ type: "district", key: d.district, parent: d.state, display: `${d.district} — ${d.state}` });
        }
      }
      const seen = new Set();
      const filtered = out.filter((o) => {
        if (seen.has(o.display)) return false;
        seen.add(o.display);
        return true;
      }).slice(0, 25);
      setSuggestions(filtered);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(!!v);
    setLoadingSuggest(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => buildSuggestions(v), DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  function pickSuggestion(s) {
    if (!s) return;
    if (s.type === "state") setSelected({ type: "state", key: s.key });
    else setSelected({ type: "district", key: s.key, parent: s.parent });
    setQuery("");
    setSuggestions([]);
    setShowSuggest(false);
  }

  /* ---------- selected node derived ---------- */
  const selectedNode = useMemo(() => {
    if (!data || !selected) return null;
    if (selected.type === "state") return { metaKey: selected.key, node: data[selected.key] || null };
    const stateObj = data[selected.parent] || null;
    const distObj = stateObj?.districts?.[selected.key] || null;
    return { metaKey: `${selected.parent}/${selected.key}`, node: distObj, parentState: selected.parent };
  }, [data, selected]);

  /* ---------- computed metrics & charts ---------- */
  const topDistrictsByVacc1 = useMemo(() => {
    if (!data || !selected) return [];
    const stateCode = selected.type === "state" ? selected.key : selected.parent;
    const state = data?.[stateCode];
    if (!state) return [];
    const districts = state.districts || {};
    const arr = Object.keys(districts).map((dn) => {
      const v1 = safeNum(districts[dn]?.total?.vaccinated1 ?? districts[dn]?.vaccinated1) ?? 0;
      const confirmed = safeNum(districts[dn]?.total?.confirmed ?? districts[dn]?.confirmed) ?? 0;
      return { name: dn, vacc1: v1, confirmed };
    }).sort((a, b) => b.vacc1 - a.vacc1).slice(0, 12);
    return arr;
  }, [data, selected]);

  const delta7Chart = useMemo(() => {
    if (!selectedNode?.node) return [];
    const n = selectedNode.node;
    const delta7 = n.delta7 || {};
    const metrics = ["confirmed", "recovered", "deceased", "tested", "vaccinated1", "vaccinated2"];
    const items = metrics.map((m) => ({ name: m, value: safeNum(delta7[m] ?? n.delta?.[m] ?? 0) || 0 }));
    return items;
  }, [selectedNode]);

  /* ---------- small helpers ---------- */
  function getStat(n, name) {
    if (!n) return { v: null, d: null };
    const total = n?.total?.[name] ?? n?.[name] ?? null;
    const delta = n?.delta?.[name] ?? null;
    return { v: safeNum(total), d: safeNum(delta) };
  }

  function stateDisplayName(code) {
    if (!data) return code;
    const node = data[code] || {};
    return node?.meta?.name || node?.meta?.state || code;
  }

  /* ---------- quick actions ---------- */
  async function copyEndpoint() {
    try {
      await navigator.clipboard.writeText(ENDPOINT);
      setCopied(true);
      showToast("success", "Endpoint copied");
      // reset after 1.6s
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to copy");
    }
  }

  function downloadSelectedJSON() {
    const payload = selectedNode?.node || data || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `covid_${selectedNode?.metaKey || "data"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Download started");
  }

  /* ---------- Rendering ---------- */
  return (
    <div className={clsx("min-h-screen p-4 sm:p-6 max-w-8xl pb-10 overflow-hidden mx-auto", isDark ? "bg-black text-zinc-100" : "bg-gray-50 text-zinc-900")}>
      {/* Mobile sheet trigger */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
            <BarChart2 className="w-6 h-6 opacity-85" />
            Covid India 
          </h1>
          <div className="text-sm opacity-70 flex items-center gap-2">
           
            Minified official dataset — totals, vaccination coverage, district breakdowns.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2 rounded-md cursor-pointer">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">Quick menu</div>
                 
                </div>

                <ScrollArea className="no-scrollbar" style={{ height: "calc(100vh - 120px)" }}>
                  <div className="space-y-3">
                    <Card className="p-3">
                      <div className="text-sm font-medium">Quick actions</div>
                      <div className="mt-2 space-y-2">
                        <Button variant="outline" onClick={copyEndpoint} className="w-full justify-start cursor-pointer">
                          {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                          Copy endpoint
                        </Button>
                        <Button variant="outline" onClick={downloadSelectedJSON} className="w-full justify-start cursor-pointer">
                          <Download className="w-4 h-4 mr-2" /> Download selected JSON
                        </Button>
                        <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="w-full justify-start cursor-pointer">
                          <List className="w-4 h-4 mr-2" /> {showRaw ? "Hide raw" : "Show raw"}
                        </Button>
                        <Button variant="ghost" onClick={() => window.open(ENDPOINT, "_blank")} className="w-full justify-start cursor-pointer">
                          <ExternalLink className="w-4 h-4 mr-2" /> Open source
                        </Button>
                      </div>
                    </Card>

                    <Card className="p-3">
                      <div className="text-sm font-medium">Top states</div>
                      <div className="mt-2 space-y-1">
                        {data ? (
                          Object.keys(data)
                            .map((k) => ({ code: k, confirmed: safeNum(data[k]?.total?.confirmed ?? data[k]?.confirmed) || 0 }))
                            .sort((a, b) => b.confirmed - a.confirmed)
                            .slice(0, 10)
                            .map((s) => (
                              <div
                                key={s.code}
                                onClick={() => { setSelected({ type: "state", key: s.code }); setSheetOpen(false); }}
                                className="flex items-center justify-between p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer"
                              >
                                <div className="font-medium text-sm">{stateDisplayName(s.code)}</div>
                                <div className="text-xs opacity-60">{s.confirmed.toLocaleString()}</div>
                              </div>
                            ))
                        ) : (
                          <div className="text-sm opacity-60">Loading…</div>
                        )}
                      </div>
                    </Card>

                    <div className="text-xs opacity-60">Dataset: <a href={ENDPOINT} target="_blank" rel="noreferrer" className="underline">Open JSON</a></div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className={clsx("hidden md:flex items-center gap-2 rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search states or districts"
              placeholder="Search (MH, Maharashtra, Mumbai)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none w-[420px]"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" onClick={() => { setSelected({ type: "state", key: DEFAULT_SELECTION }); setQuery(""); }} className="cursor-pointer">
              India
            </Button>
            <Button type="button" variant="outline" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); }} className="cursor-pointer">
              Clear
            </Button>
          </form>
        </div>
      </div>

      {/* Suggestions (absolute dropdown) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            <ScrollArea style={{ maxHeight: 320 }}>
              <ul>
                {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
                {suggestions.map((s, i) => (
                  <li key={s.display + i} onClick={() => pickSuggestion(s)} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10"><MapPin className="w-5 h-5 opacity-70" /></div>
                      <div className="flex-1">
                        <div className="font-medium">{s.display}</div>
                        <div className="text-xs opacity-60">{s.type === "state" ? "State" : `District • ${s.parent}`}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left column (desktop only) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 space-y-4 p-4 rounded-2xl", isDark ? "bg-black/30 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Quick Hints</div>
              <div className="text-xs opacity-60">Search</div>
            </div>
            <div className="mt-3 text-xs opacity-70">Try: <span className="font-medium">MH</span>, <span className="font-medium">Maharashtra</span>, <span className="font-medium">Mumbai</span>, <span className="font-medium">TT</span></div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Top states (confirmed)</div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {data ? (
                Object.keys(data).map((k) => ({ code: k, confirmed: safeNum(data[k]?.total?.confirmed ?? data[k]?.confirmed) || 0 }))
                  .sort((a, b) => b.confirmed - a.confirmed).slice(0, 6).map((s) => (
                    <div key={s.code} onClick={() => setSelected({ type: "state", key: s.code })} className="p-2 rounded-md border flex items-center justify-between cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/40">
                      <div className="font-medium">{stateDisplayName(s.code)}</div>
                      <div className="text-sm opacity-60">{s.confirmed.toLocaleString()}</div>
                    </div>
                  ))
              ) : (
                <div className="text-sm opacity-60">Loading…</div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Source</div>
            <div className="text-xs opacity-60">
              Public minified dataset. <a className="underline" href={ENDPOINT} target="_blank" rel="noreferrer">Open JSON</a>
              <div className="mt-2">Note: district availability & meta fields may vary by state.</div>
            </div>
          </div>
        </aside>

        {/* Center */}
        <section className={clsx("lg:col-span-6", isDark ? "text-zinc-100" : "text-zinc-900")}>
          <Card className={clsx("rounded-2xl overflow-hidden border shadow-sm", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-3">
                  <BarChart2 className="w-5 h-5 opacity-80" />
                  {selected.type === "state" ? stateDisplayName(selected.key) : `${selected.key} • ${stateDisplayName(selected.parent)}`}
                </h3>
                <div className="text-xs opacity-60 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 opacity-70" />
                  {selected.type === "state" ? `State • ${selected.key}` : `District • ${selected.key}`}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="p-2 rounded-md cursor-pointer" aria-pressed={showRaw} title="Toggle raw JSON">
                  <List />
                </Button>

                <div className="relative">
                  <Button
                    variant={copied ? "secondary" : "outline"}
                    onClick={() => copyEndpoint()}
                    className="flex items-center gap-2 p-2 rounded-md cursor-pointer"
                    aria-label="Copy endpoint"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.span key="check" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400" />
                          <span className="text-sm">Copied</span>
                        </motion.span>
                      ) : (
                        <motion.span key="copy" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex items-center gap-2">
                          <Copy className="w-4 h-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>

                <Button variant="outline" onClick={() => downloadSelectedJSON()} className="p-2 rounded-md cursor-pointer" title="Download JSON">
                  <Download />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : error ? (
                <div className="py-12 text-center text-sm opacity-60">Error: {error}</div>
              ) : !selectedNode?.node ? (
                <div className="py-12 text-center text-sm opacity-60">No data for selection</div>
              ) : (
                <>
                  {/* Top stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <StatCardCompact label="Confirmed" value={getStat(selectedNode.node, "confirmed").v} delta={getStat(selectedNode.node, "confirmed").d} icon={<BarChart2 className="w-5 h-5" />} />
                    <StatCardCompact label="Recovered" value={getStat(selectedNode.node, "recovered").v} delta={getStat(selectedNode.node, "recovered").d} icon={<Heart className="w-5 h-5" />} tone="good" />
                    <StatCardCompact label="Tested" value={getStat(selectedNode.node, "tested").v} delta={getStat(selectedNode.node, "tested").d} icon={<Activity className="w-5 h-5" />} />
                    <StatCardCompact label="Deceased" value={getStat(selectedNode.node, "deceased").v} delta={getStat(selectedNode.node, "deceased").d} icon={<Zap className="w-5 h-5" />} tone="warn" />
                  </div>

                  <Separator className="my-4" />

                  {/* Vaccination summary */}
                  <div className="p-3 rounded-md border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs opacity-60">Vaccination</div>
                        <div className="text-sm font-medium flex items-center gap-2"><Award className="w-4 h-4" /> Coverage & recent doses</div>
                      </div>
                      <div className="text-xs opacity-60">Last updated: {selectedNode.node?.meta?.date || selectedNode.node?.meta?.last_updated || "—"}</div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* vaccinated1 */}
                      <div className="p-3 rounded-md border">
                        <div className="flex items-center justify-between">
                          <div className="text-xs opacity-60">At least 1 dose</div>
                          <div className="text-sm font-medium">{safeNum(selectedNode.node?.total?.vaccinated1)?.toLocaleString() ?? "—"}</div>
                        </div>
                        <div className="mt-3">
                          <div className="text-xs opacity-60">Δ (today)</div>
                          <div className="text-sm font-medium">{safeNum(selectedNode.node?.delta?.vaccinated1) ?? "—"}</div>
                        </div>
                        <div className="mt-3">
                          <div className="text-xs opacity-60">7-day</div>
                          <div className="text-sm font-medium">{safeNum(selectedNode.node?.delta7?.vaccinated1) ?? "—"}</div>
                        </div>
                        <div className="mt-3">
                          <div className="text-xs opacity-60">Coverage</div>
                          <div className="mt-1">
                            <TinyProgress pctValue={pct(safeNum(selectedNode.node?.total?.vaccinated1) || 0, selectedNode.node?.meta?.population || (selected.type === "state" ? data?.[selected.key]?.meta?.population : null) || 1)} />
                            <div className="mt-1 text-xs opacity-60">{pct(safeNum(selectedNode.node?.total?.vaccinated1) || 0, selectedNode.node?.meta?.population || (selected.type === "state" ? data?.[selected.key]?.meta?.population : null) || 1)}% population (1 dose)</div>
                          </div>
                        </div>
                      </div>

                      {/* vaccinated2 */}
                      <div className="p-3 rounded-md border">
                        <div className="flex items-center justify-between">
                          <div className="text-xs opacity-60">Fully vaccinated</div>
                          <div className="text-sm font-medium">{safeNum(selectedNode.node?.total?.vaccinated2)?.toLocaleString() ?? "—"}</div>
                        </div>
                        <div className="mt-3">
                          <div className="text-xs opacity-60">Δ (today)</div>
                          <div className="text-sm font-medium">{safeNum(selectedNode.node?.delta?.vaccinated2) ?? "—"}</div>
                        </div>
                        <div className="mt-3">
                          <div className="text-xs opacity-60">7-day</div>
                          <div className="text-sm font-medium">{safeNum(selectedNode.node?.delta7?.vaccinated2) ?? "—"}</div>
                        </div>
                        <div className="mt-3">
                          <div className="text-xs opacity-60">Coverage</div>
                          <div className="mt-1">
                            <TinyProgress pctValue={pct(safeNum(selectedNode.node?.total?.vaccinated2) || 0, selectedNode.node?.meta?.population || (selected.type === "state" ? data?.[selected.key]?.meta?.population : null) || 1)} />
                            <div className="mt-1 text-xs opacity-60">{pct(safeNum(selectedNode.node?.total?.vaccinated2) || 0, selectedNode.node?.meta?.population || (selected.type === "state" ? data?.[selected.key]?.meta?.population : null) || 1)}% population (2 doses)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-md border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs opacity-60">Top districts by 1st dose</div>
                        <div className="text-xs opacity-60">Totals</div>
                      </div>
                      {topDistrictsByVacc1.length === 0 ? (
                        <div className="text-sm opacity-60">No district data</div>
                      ) : (
                        <div style={{ width: "100%", height: 220 }}>
                          <ResponsiveContainer>
                            <BarChart data={topDistrictsByVacc1}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis tickFormatter={(v) => (v >= 1000 ? `${Math.round(v/1000)}k` : v)} />
                              <Tooltip
                                formatter={(v) => v?.toLocaleString?.() ?? v}
                                contentStyle={{
                                  backgroundColor: isDark ? "rgba(6,6,8,0.88)" : "rgba(255,255,255,0.98)",
                                  border: isDark ? "1px solid rgba(113,113,122,0.24)" : "1px solid rgba(220,220,225,0.6)",
                                  borderRadius: "0.75rem",
                                  backdropFilter: "blur(8px)",
                                  boxShadow: isDark ? "0 6px 20px rgba(0,0,0,0.5)" : "0 6px 24px rgba(16,24,40,0.06)",
                                  fontSize: "0.875rem",
                                  padding: "0.5rem 0.75rem",
                                }}
                                labelStyle={{
                                  fontWeight: "500",
                                  marginBottom: "0.25rem",
                                }}
                              />
                              <Bar dataKey="vacc1" fill="#2dd4bf" name="1st dose" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-md border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs opacity-60">7-day comparison</div>
                        <div className="text-xs opacity-60">Delta7</div>
                      </div>
                      {delta7Chart.length === 0 ? (
                        <div className="text-sm opacity-60">No weekly deltas</div>
                      ) : (
                        <div style={{ width: "100%", height: 220 }}>
                          <ResponsiveContainer>
                            <BarChart data={delta7Chart}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.05} />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis tickFormatter={(v) => (v >= 1000 ? `${Math.round(v/1000)}k` : v)} />
                              <Tooltip
                                formatter={(v) => v?.toLocaleString?.() ?? v}
                                contentStyle={{
                                  backgroundColor: isDark ? "rgba(6,6,8,0.88)" : "rgba(255,255,255,0.98)",
                                  border: isDark ? "1px solid rgba(113,113,122,0.24)" : "1px solid rgba(220,220,225,0.6)",
                                  borderRadius: "0.75rem",
                                  backdropFilter: "blur(8px)",
                                  boxShadow: isDark ? "0 6px 20px rgba(0,0,0,0.5)" : "0 6px 24px rgba(16,24,40,0.06)",
                                  fontSize: "0.875rem",
                                  padding: "0.5rem 0.75rem",
                                }}
                                labelStyle={{
                                  fontWeight: "500",
                                  marginBottom: "0.25rem",
                                }}
                              />
                              <Bar dataKey="value" fill="#60a5fa" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {showRaw && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4 p-3 rounded-md border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">Raw JSON</div>
                          <div className="text-xs opacity-60">Preview</div>
                        </div>
                        <pre className="text-xs overflow-auto" style={{ maxHeight: 320 }}>{prettyJSON(selectedNode.node)}</pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right */}
        <aside className={clsx("lg:col-span-3 space-y-4 p-4 rounded-2xl", isDark ? "bg-black/30 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Quick actions</div>
              <div className="text-xs opacity-60">Tools</div>
            </div>

            <div className="mt-3 space-y-2">
              <Button variant="outline" onClick={() => copyEndpoint()} className="w-full justify-start cursor-pointer">
                {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                <span>Copy endpoint</span>
              </Button>
              <Button variant="outline" onClick={() => downloadSelectedJSON()} className="w-full justify-start cursor-pointer">
                <Download className="w-4 h-4 mr-2" />
                <span>Download selected JSON</span>
              </Button>
              <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="w-full justify-start cursor-pointer">
                <List className="w-4 h-4 mr-2" />
                <span>{showRaw ? "Hide raw" : "Show raw"}</span>
              </Button>
              <Button variant="ghost" onClick={() => window.open(ENDPOINT, "_blank")} className="w-full justify-start cursor-pointer">
                <ExternalLink className="w-4 h-4 mr-2" />
                <span>Open source</span>
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Notes</div>
            <div className="text-xs opacity-60">
              Vaccination fields: <code>vaccinated1</code> = first doses, <code>vaccinated2</code> = second doses. Coverage percentages derive from <code>meta.population</code> when available.
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
