// src/pages/MFPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import {
  Menu,
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  List,
  Calendar,
  BarChart2,
  Building2 as Bank,
  Percent,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  RefreshCw,
  Link as LinkIcon,
  Check,
  FileText,
  Grid,
  Layers
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";

/**
 * Professional Mutual Fund page with:
 *  - left sidebar (desktop) / sheet (mobile) containing 10 random NAV entries
 *  - improved middle preview UI
 *  - animated copy button with tick on success
 *  - Header adjusted for mobile with menu icon opening the sheet
 *
 * Endpoints:
 *  GET https://api.mfapi.in/mf/{id}
 *  GET https://api.mfapi.in/mf/{id}/latest
 */

const API_BASE = "https://api.mfapi.in";
const DEFAULT_SCHEME_ID = "119551";
const DEBOUNCE_MS = 300;

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function normalizeNavData(arr = []) {
  return (arr || []).map((r) => {
    const parts = (r.date || "").split("-");
    let iso = r.date;
    if (parts.length === 3) {
      iso = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    return {
      ...r,
      iso,
      navNum: Number(typeof r.nav === "string" ? r.nav.replace(/,/g, "") : r.nav) || 0,
    };
  }).sort((a, b) => new Date(a.iso) - new Date(b.iso));
}

function pctChange(prev, cur) {
  if (prev == null || cur == null || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

/* Custom tooltip for chart */
function CustomTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const prevNav = payload[0].payload._prev || null;
  const change = prevNav != null ? pctChange(prevNav, point.navNum) : null;
  return (
    <div className="text-xs p-2 rounded-md shadow-lg" style={{ background: "var(--tooltip-bg, rgba(0,0,0,0.85))", color: "var(--tooltip-fg, #fff)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-4 h-4 opacity-80" />
        <div className="font-medium">{point.date}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold">{point.nav}</div>
        <div className="text-xs opacity-70">({point.navNum.toFixed(4)})</div>
      </div>
      {change != null && (
        <div className={clsx("mt-1 text-xs flex items-center gap-1", change >= 0 ? "text-emerald-400" : "text-rose-400")}>
          {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </div>
      )}
    </div>
  );
}

export default function MFPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Search + suggestions
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // Fund data
  const [currentFund, setCurrentFund] = useState(null);
  const [latest, setLatest] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingFund, setLoadingFund] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);

  // UI states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // copy animation state
  const [copied, setCopied] = useState(false);

  const suggestTimer = useRef(null);
  const inputRef = useRef(null);

  /* Fetch full fund */
  async function fetchFund(id) {
    if (!id) return;
    setLoadingFund(true);
    try {
      const url = `${API_BASE}/mf/${encodeURIComponent(id)}`;
      const res = await fetch(url);
      if (!res.ok) {
        toast.error(`Fund fetch failed (${res.status})`);
        setLoadingFund(false);
        return;
      }
      const json = await res.json();
      setCurrentFund(json);
      setRawResp(json);
      toast.success(`Loaded: ${json?.meta?.scheme_name ?? "fund"}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch fund");
    } finally {
      setLoadingFund(false);
    }
  }

  /* Fetch latest */
  async function fetchLatest(id) {
    if (!id) return;
    setLoadingLatest(true);
    try {
      const url = `${API_BASE}/mf/${encodeURIComponent(id)}/latest`;
      const res = await fetch(url);
      if (!res.ok) {
        setLoadingLatest(false);
        return;
      }
      const json = await res.json();
      setLatest(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLatest(false);
    }
  }

  /* Search endpoint */
  async function searchFunds(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const url = `${API_BASE}/mf/search?q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(Array.isArray(json) ? json.slice(0, 12) : []);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      searchFunds(v);
    }, DEBOUNCE_MS);
  }

  function selectSuggestion(s) {
    const id = s.schemeCode || s.scheme_code || s.schemeId || s.id || s.scheme_code;
    const name = s.schemeName || s.scheme_name || s.name || s.scheme;
    if (id) {
      setShowSuggest(false);
      setQuery(name || String(id));
      fetchFund(id);
      fetchLatest(id);
    } else if (typeof s === "string") {
      setQuery(s);
    }
  }

  /* initial */
  useEffect(() => {
    fetchFund(DEFAULT_SCHEME_ID);
    fetchLatest(DEFAULT_SCHEME_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* chart data merge logic */
  const chartData = useMemo(() => {
    const hist = normalizeNavData(currentFund?.data || []);
    const latestEntry = latest?.data && Array.isArray(latest.data) ? latest.data[0] : null;
    const latestNormalized = latestEntry ? normalizeNavData([latestEntry])[0] : null;

    let merged = [...hist];
    if (latestNormalized) {
      const last = merged[merged.length - 1];
      if (!last || new Date(latestNormalized.iso) > new Date(last.iso)) {
        merged = [...merged, latestNormalized];
      } else if (last && latestNormalized && last.iso === latestNormalized.iso) {
        merged[merged.length - 1] = latestNormalized;
      }
    }

    for (let i = 0; i < merged.length; i++) {
      merged[i]._prev = i > 0 ? merged[i - 1].navNum : null;
    }

    return merged;
  }, [currentFund, latest]);

  /* Derived meta + stats */
  const meta = currentFund?.meta ?? (latest?.meta ?? {});
  const latestPoint = chartData.length ? chartData[chartData.length - 1] : null;
  const prevPoint = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  const latestPct = prevPoint ? pctChange(prevPoint.navNum, latestPoint?.navNum) : null;

  /* CSV download */
  function downloadCSV() {
    const arr = chartData || [];
    if (!arr.length) {
      toast("No NAV history to download");
      return;
    }
    const rows = arr.map((r) => `${r.date},${r.nav}`).join("\n");
    const csv = `date,nav\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    const fname = `mf_${meta.scheme_code || DEFAULT_SCHEME_ID}.csv`;
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("CSV downloaded");
  }

  /* animated copy */
  async function copyJSON() {
    const payload = currentFund || latest || {};
    try {
      await navigator.clipboard.writeText(prettyJSON(payload));
      setCopied(true);
      toast.success("Copied JSON");
      // reset animation after 2s
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy");
    }
  }

  /* 10 random NAV entries for sidebar / sheet */
  const sampleNavs = useMemo(() => {
    const src = chartData.length ? chartData : (currentFund?.data ? normalizeNavData(currentFund.data) : []);
    if (!src || src.length === 0) return [];
    const copy = [...src];
    // choose up to 10 random unique samples (preferring recent)
    const pick = [];
    const attempts = Math.min(10, copy.length);
    // sample by taking some recent plus randomness
    const start = Math.max(0, copy.length - 30); // prefer last 30
    for (let i = 0; i < attempts; i++) {
      const idx = start + Math.floor(Math.random() * Math.max(1, copy.length - start));
      const item = copy[idx];
      if (item && !pick.find(p => p.iso === item.iso)) pick.push(item);
      else {
        // fallback linear pick
        const fallback = copy[copy.length - 1 - i];
        if (fallback && !pick.find(p => p.iso === fallback.iso)) pick.push(fallback);
      }
    }
    return pick.slice(0, 10);
  }, [chartData, currentFund]);

  /* UI helpers */
  function refreshAll() {
    const id = meta.scheme_code || DEFAULT_SCHEME_ID;
    fetchFund(id);
    fetchLatest(id);
  }

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Mobile menu / sheet trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <div className="md:hidden">
              <Button variant="ghost" className="p-2 cursor-pointer" onClick={() => setSheetOpen(true)}><Menu /></Button>
            </div>
            <SheetContent side="left" className={clsx("w-full max-w-sm p-0")}>
              <SheetHeader className="p-4">
                <SheetTitle className="text-lg flex items-center gap-2"><Grid className="w-5 h-5" /> Quick NAVs</SheetTitle>
              </SheetHeader>
              <div className={clsx("p-4", isDark ? "bg-black/90" : "bg-white")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold">Recent sample</div>
                  <Button size="sm" variant="ghost" onClick={refreshAll} className="cursor-pointer"><RefreshCw /></Button>
                </div>
                <Separator />
                <ScrollArea style={{ maxHeight: 420 }} className="mt-3 overflow-y-auto">
                  <ul className="space-y-2">
                    {sampleNavs.length === 0 && <li className="text-xs opacity-60">No entries</li>}
                    {sampleNavs.map((r) => (
                      <li key={r.iso} className="p-2 rounded-md border hover:shadow-sm cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{r.date}</div>
                            <div className="text-xs opacity-60 mt-1">{r.nav}</div>
                          </div>
                          <div className={clsx("text-xs font-medium mt-0.5", r._prev != null && pctChange(r._prev, r.navNum) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {r._prev != null ? `${pctChange(r._prev, r.navNum) >= 0 ? "+" : ""}${pctChange(r._prev, r.navNum).toFixed(2)}%` : "—"}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">Fund Pulse</h1>
            <div className="text-xs opacity-60 hidden md:block">Interactive NAV explorer — chart, recent NAVs, metadata</div>
          </div>
        </div>

        <div className=" ">
          <form onSubmit={(e) => { e?.preventDefault?.(); if (suggestions.length) selectSuggestion(suggestions[0]); }} className={clsx("flex items-center gap-2 w-full rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-70" />
            <Input
              ref={inputRef}
              placeholder="Search mutual funds by name or code…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none pr-2"
              onFocus={() => setShowSuggest(true)}
              aria-label="Search mutual funds"
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { fetchFund(DEFAULT_SCHEME_ID); fetchLatest(DEFAULT_SCHEME_ID); }}>Default</Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>

          {/* Suggestions - mobile friendly placement */}
          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl z-50 rounded-xl overflow-hidden shadow-xl mt-14", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
                {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
                {suggestions.map((s, idx) => (
                  <li key={s.schemeCode || s.scheme_code || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => selectSuggestion(s)}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{s.schemeName || s.name || `Scheme ${s.schemeCode || idx}`}</div>
                        <div className="text-xs opacity-60">{s.schemeCode ? `Code: ${s.schemeCode}` : ""}</div>
                      </div>
                      <div className="text-xs opacity-60">{s.schemeCategory || s.plan || ""}</div>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Right actions (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" className="cursor-pointer" onClick={refreshAll}><RefreshCw /></Button>
          <Button variant="ghost" className="cursor-pointer" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
          <Button variant="ghost" className="cursor-pointer" onClick={() => setDialogOpen(true)}><BarChart2 /> Chart</Button>
        </div>
      </header>

      {/* Layout: left sidebar (desktop) | center content | right quick actions */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Meta / sample navs (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-start gap-3">
            <div className="rounded-md p-3" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}>
              <Bank />
            </div>
            <div className="flex-1">
              <div className="text-xs opacity-60">Scheme</div>
              <div className="text-lg font-semibold">{meta.scheme_name || "—"}</div>
              <div className="text-xs opacity-60">{meta.scheme_code ? `Code: ${meta.scheme_code}` : ""}</div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Sample NAVs</div>
            <Button variant="ghost" size="sm" className="cursor-pointer" onClick={refreshAll}><RefreshCw /></Button>
          </div>

          <ScrollArea className="overflow-y-auto" style={{ maxHeight: 420 }}>
            <ul className="space-y-2">
              {sampleNavs.length === 0 && <li className="text-xs opacity-60">No sample NAVs</li>}
              {sampleNavs.map((r) => (
                <li key={r.iso} className="p-3 rounded-lg border hover:shadow-sm cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{r.date}</div>
                      <div className="text-xs opacity-60 mt-1">{r.nav}</div>
                    </div>
                    <div className={clsx("text-xs font-medium", r._prev != null && pctChange(r._prev, r.navNum) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {r._prev != null ? `${pctChange(r._prev, r.navNum) >= 0 ? "+" : ""}${pctChange(r._prev, r.navNum).toFixed(2)}%` : "—"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs opacity-60">Latest NAV</div>
              <div className="font-medium">{latestPoint ? latestPoint.nav : (currentFund?.data?.[0]?.nav ?? "—")}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs opacity-60">Date</div>
              <div className="font-medium">{latestPoint ? latestPoint.date : (currentFund?.data?.[0]?.date ?? "-")}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs opacity-60">Change</div>
              <div className={clsx("font-medium", latestPct == null ? "" : (latestPct >= 0 ? "text-emerald-400" : "text-rose-400"))}>
                {latestPct == null ? "—" : `${latestPct >= 0 ? "+" : ""}${latestPct.toFixed(2)}%`}
              </div>
            </div>
          </div>
        </aside>

        {/* Center — main preview, chart, recent list */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 opacity-80" />
                  <span>{meta.scheme_name || "Fund Details"}</span>
                </CardTitle>
                <div className="text-xs opacity-60 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><Percent className="w-3 h-3" /> {meta.scheme_type || "—"}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {meta.scheme_category || "-"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" className={clsx("cursor-pointer", (loadingFund || loadingLatest) && "opacity-80")} onClick={() => { if (meta.scheme_code) { fetchFund(meta.scheme_code); fetchLatest(meta.scheme_code); } else { fetchFund(DEFAULT_SCHEME_ID); fetchLatest(DEFAULT_SCHEME_ID); } }}>
                  <motion.span animate={{ rotate: (loadingFund || loadingLatest) ? 360 : 0 }} transition={{ duration: 1 }}><Loader2 className={clsx((loadingFund || loadingLatest) ? "animate-spin" : "")} /></motion.span>
                  <span className="ml-2">Refresh</span>
                </Button>

              </div>
            </CardHeader>

            <CardContent>
              {loadingFund ? (
                <div className="py-16 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !chartData || chartData.length === 0 ? (
                <div className="py-12 text-center text-sm opacity-60">No NAV data available for chart.</div>
              ) : (
                <div className="space-y-5">
                  {/* Highlight / summary */}
                  <div className={clsx("rounded-xl p-4 border flex  items-start justify-between gap-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/95 border-zinc-200")}>
                    <div>
                      <div className="text-xs opacity-60 flex items-center gap-2"><LinkIcon className="w-3 h-3" /> Scheme</div>
                      <div className="text-2xl font-semibold leading-tight">{meta.scheme_name}</div>
                      <div className="text-xs opacity-60 mt-1">{meta.scheme_code ? `Code: ${meta.scheme_code}` : ""}</div>
                      <div className="mt-3 text-sm text-muted-foreground opacity-70">{meta.fund_house ? `House: ${meta.fund_house}` : ""}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs opacity-60">Latest NAV</div>
                      <div className="text-xl font-semibold">{latestPoint ? latestPoint.nav : (chartData[chartData.length - 1]?.nav || "-")}</div>
                      <div className="text-xs opacity-60 mt-1">{latestPoint ? latestPoint.date : "-"}</div>
                      <div className={clsx("text-sm mt-2 font-medium", latestPct == null ? "" : latestPct >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {latestPct == null ? "—" : `${latestPct >= 0 ? "+" : ""}${latestPct.toFixed(2)}%`} since prior
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="rounded-xl border p-3" style={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                        <defs>
                          <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={isDark ? "#60a5fa" : "#3b82f6"} stopOpacity={0.85} />
                            <stop offset="100%" stopColor={isDark ? "#60a5fa" : "#3b82f6"} stopOpacity={0.10} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)"} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} minTickGap={10} />
                        <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                        <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none" }} />
                        <Area type="monotone" dataKey="navNum" stroke={isDark ? "#60a5fa" : "#3b82f6"} fill="url(#navGradient)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Recent NAV table */}
                  <div className="rounded-xl border overflow-hidden">
                    <div className={clsx("p-3 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
                      <div className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Recent NAVs</div>
                      <div className="text-xs opacity-60">Latest {Math.min(12, chartData.length)} entries</div>
                    </div>

                    <ScrollArea style={{ maxHeight: 280 }}>
                      <table className="w-full text-sm">
                        <thead className={clsx(isDark ? "bg-black/60" : "bg-white/95")}>
                          <tr>
                            <th className="text-left p-3 text-xs opacity-60">Date</th>
                            <th className="text-left p-3 text-xs opacity-60">NAV</th>
                            <th className="text-left p-3 text-xs opacity-60">Change (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.slice(-12).reverse().map((r, i) => {
                            const change = r._prev != null ? pctChange(r._prev, r.navNum) : null;
                            return (
                              <tr key={r.date + i} className="border-t hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                                <td className="p-3">{r.date}</td>
                                <td className="p-3 font-medium">{r.nav}</td>
                                <td className={clsx("p-3", change == null ? "opacity-60" : (change >= 0 ? "text-emerald-400" : "text-rose-400"))}>
                                  {change == null ? "—" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right quick actions & identifiers (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Quick Actions</div>
              <div className="text-xs opacity-60">Common operations</div>
            </div>
            <div className="text-xs opacity-60">v1</div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" onClick={() => downloadCSV()} className="cursor-pointer"><Download /> Download CSV</Button>
            <Button variant="outline" onClick={copyJSON} className="cursor-pointer"><Copy /> Copy JSON</Button>
            <Button variant="outline" onClick={() => { if (meta.scheme_code) window.open(`${API_BASE}/mf/${meta.scheme_code}`, "_blank"); else toast("No external link"); }} className="cursor-pointer"><ExternalLink /> Open API Source</Button>
            <Button variant="outline" onClick={() => setDialogOpen(true)} className="cursor-pointer"><BarChart2 /> Large Chart</Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Identifiers</div>
            <div className="text-xs opacity-60">Scheme Code</div>
            <div className="font-medium">{meta.scheme_code ?? "-"}</div>

            <div className="text-xs opacity-60 mt-2">ISIN (Growth)</div>
            <div className="font-medium">{meta.isin_growth || "-"}</div>

            <div className="text-xs opacity-60 mt-2">ISIN (Div Reinvest)</div>
            <div className="font-medium">{meta.isin_div_reinvestment || "-"}</div>
          </div>
        </aside>
      </main>

      {/* Large chart dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-5xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{meta.scheme_name || "NAV Chart"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            {chartData && chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 16, right: 40, left: 0, bottom: 16 }}>
                  <defs>
                    <linearGradient id="navGradientLarge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isDark ? "#60a5fa" : "#3b82f6"} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={isDark ? "#60a5fa" : "#3b82f6"} stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)"} />
                  <XAxis dataKey="date" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="navNum" stroke={isDark ? "#60a5fa" : "#3b82f6"} fill="url(#navGradientLarge)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm opacity-60 p-6">No data to render chart</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Data from api.mfapi.in</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => { if (meta.scheme_code) window.open(`${API_BASE}/mf/${meta.scheme_code}`, "_blank"); }}>Open Source</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
