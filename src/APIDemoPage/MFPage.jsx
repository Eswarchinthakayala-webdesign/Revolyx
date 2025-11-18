// src/pages/MFPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import {
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
  ArrowDownRight
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
import { useTheme } from "@/components/theme-provider";

/**
 * Professional Mutual Fund page with Recharts AreaChart and custom tooltip.
 * - default fund id: 119551
 * - endpoints:
 *    GET https://api.mfapi.in/mf/{id}        -> full history + meta
 *    GET https://api.mfapi.in/mf/{id}/latest -> latest (meta + single data)
 *
 * Note: Ensure the UI component imports exist in your project.
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

/* Convert API data (date:string dd-mm-yyyy, nav:string) into numeric nav and ISO date for the chart */
function normalizeNavData(arr = []) {
  return (arr || []).map((r) => {
    // Convert "17-11-2025" to "2025-11-17"
    const parts = (r.date || "").split("-");
    let iso = r.date;
    if (parts.length === 3) {
      iso = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    return {
      ...r,
      iso: iso,
      navNum: Number(typeof r.nav === "string" ? r.nav.replace(/,/g, "") : r.nav) || 0,
    };
  }).sort((a, b) => new Date(a.iso) - new Date(b.iso)); // oldest -> newest
}

/* compute percent change between two numeric values */
function pctChange(prev, cur) {
  if (prev == null || cur == null || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

/* Custom tooltip component for Recharts */
function CustomTooltip({ active, payload, label }) {
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

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentFund, setCurrentFund] = useState(null); // full /mf/{id}
  const [latest, setLatest] = useState(null); // /mf/{id}/latest response
  const [rawResp, setRawResp] = useState(null);
  const [loadingFund, setLoadingFund] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const suggestTimer = useRef(null);
  const inputRef = useRef(null);

  /* Fetch full fund history by id */
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

  /* Fetch latest endpoint */
  async function fetchLatest(id) {
    if (!id) return;
    setLoadingLatest(true);
    try {
      const url = `${API_BASE}/mf/${encodeURIComponent(id)}/latest`;
      const res = await fetch(url);
      if (!res.ok) {
        // fallback: sometimes latest returns status 404 — ignore silently
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

  /* Search suggestions (mf/search?q=...) */
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
    // s: {schemeCode, schemeName}
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

  useEffect(() => {
    // initial load default fund
    fetchFund(DEFAULT_SCHEME_ID);
    fetchLatest(DEFAULT_SCHEME_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Merge logic: create chart data array with navNum & _prev for tooltip pct change */
  const chartData = useMemo(() => {
    const hist = normalizeNavData(currentFund?.data || []);
    // If latest provided and it's newer than last entry, append or replace last
    const latestEntry = latest?.data && Array.isArray(latest.data) ? latest.data[0] : null; // based on sample you gave
    const latestNormalized = latestEntry ? normalizeNavData([latestEntry])[0] : null;

    let merged = [...hist];
    if (latestNormalized) {
      const last = merged[merged.length - 1];
      if (!last || new Date(latestNormalized.iso) > new Date(last.iso)) {
        merged = [...merged, latestNormalized];
      } else if (last && latestNormalized && last.iso === latestNormalized.iso) {
        // replace last
        merged[merged.length - 1] = latestNormalized;
      }
    }

    // attach _prev navNum for change calculation
    for (let i = 0; i < merged.length; i++) {
      merged[i]._prev = i > 0 ? merged[i - 1].navNum : null;
    }

    // produce a small window if too large for performance on chart
    return merged;
  }, [currentFund, latest]);

  /* Derived stats */
  const meta = currentFund?.meta ?? (latest?.meta ?? {});
  const latestPoint = chartData.length ? chartData[chartData.length - 1] : null;
  const prevPoint = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  const latestPct = prevPoint ? pctChange(prevPoint.navNum, latestPoint?.navNum) : null;

  /* CSV download helper */
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

  function copyJSON() {
    const payload = currentFund || latest || {};
    navigator.clipboard.writeText(prettyJSON(payload));
    toast.success("Copied JSON");
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Fund Pulse — NAV Explorer</h1>
          <p className="mt-1 text-sm opacity-70">Interactive NAV chart, latest snapshot, and full scheme metadata.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={(e) => { e?.preventDefault?.(); if (suggestions.length) selectSuggestion(suggestions[0]); }} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
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
            <Button type="button" variant="outline" className="px-3" onClick={() => { fetchFund(DEFAULT_SCHEME_ID); fetchLatest(DEFAULT_SCHEME_ID); }}>Default</Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
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

      {/* Main layout: left meta | center chart & details | right quick actions */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left meta */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/40 border border-zinc-800 rounded-2xl p-4" : "bg-white/90 border border-zinc-200 rounded-2xl p-4")}>
          <div className="flex items-start gap-3">
            <div className="rounded-md p-3" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}>
              <Bank />
            </div>
            <div>
              <div className="text-xs opacity-60">Scheme</div>
              <div className="text-lg font-semibold">{meta.scheme_name || "—"}</div>
              <div className="text-xs opacity-60">{meta.scheme_code ? `Code: ${meta.scheme_code}` : ""}</div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-2">
            <div>
              <div className="text-xs opacity-60">Fund House</div>
              <div className="font-medium">{meta.fund_house || meta.amc || "-"}</div>
            </div>

            <div>
              <div className="text-xs opacity-60">Scheme Type</div>
              <div className="font-medium">{meta.scheme_type || "-"}</div>
            </div>

            <div>
              <div className="text-xs opacity-60">Category</div>
              <div className="font-medium">{meta.scheme_category || "-"}</div>
            </div>
          </div>

          <Separator />

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
              <div className="text-xs opacity-60">Change (latest)</div>
              <div className={clsx("font-medium", latestPct == null ? "" : (latestPct >= 0 ? "text-emerald-400" : "text-rose-400"))}>
                {latestPct == null ? "—" : `${latestPct >= 0 ? "+" : ""}${latestPct.toFixed(2)}%`}
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Chart + details */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">{meta.scheme_name || "Fund Details"}</CardTitle>
                <div className="text-xs opacity-60">{meta.scheme_type ? `${meta.scheme_type} • ${meta.scheme_category || ""}` : "Scheme metadata"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" className="cursor-pointer" onClick={() => { if (meta.scheme_code) { fetchFund(meta.scheme_code); fetchLatest(meta.scheme_code); } }}><Loader2 className={loadingFund || loadingLatest ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)}><BarChart2 /> Chart</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingFund ? (
                <div className="py-16 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !chartData || chartData.length === 0 ? (
                <div className="py-12 text-center text-sm opacity-60">No NAV data available for chart.</div>
              ) : (
                <div className="space-y-4">
                  {/* Highlight box */}
                  <div className="rounded-xl p-4 border" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs opacity-60">Scheme</div>
                        <div className="text-2xl font-semibold leading-tight">{meta.scheme_name}</div>
                        <div className="text-xs opacity-60 mt-1">{meta.scheme_code ? `Code: ${meta.scheme_code}` : ""}</div>
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
                  </div>

                  {/* Area Chart */}
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
                      <div className="font-semibold">Recent NAVs</div>
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
                              <tr key={r.date + i} className="border-t">
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

        {/* Right quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Quick Actions</div>
              <div className="text-xs opacity-60">Common operations</div>
            </div>
            <div className="text-xs opacity-60">v1</div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" onClick={() => downloadCSV()}><Download /> Download CSV</Button>
            <Button variant="outline" onClick={() => copyJSON()}><Copy /> Copy JSON</Button>
            <Button variant="outline" onClick={() => { if (meta.scheme_code) window.open(`${API_BASE}/mf/${meta.scheme_code}`, "_blank"); else toast("No external link"); }}><ExternalLink /> Open API Source</Button>
            <Button variant="outline" onClick={() => setDialogOpen(true)}><BarChart2 /> Large Chart</Button>
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
        <DialogContent className={clsx("max-w-5xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
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
