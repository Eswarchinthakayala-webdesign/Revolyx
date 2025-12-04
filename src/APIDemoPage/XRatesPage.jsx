// src/pages/XRatesPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Globe,
  RefreshCw,
  ArrowRightCircle,
  FileText,
  Info,
  Menu,
  ChevronsLeft,
  Clock,
  Star,
  BarChart2,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* ------------- NOTES -------------
- X-Rates HTML fetching may be blocked by CORS in browser; for production use a server-side proxy endpoint.
- We use exchangerate.host for historical data (no API key) to draw charts and compute averages.
-----------------------------------*/

/* ---------- Utility data: expanded currency list ---------- */
/* A curated / common-currency list (code + name). Add or replace as needed. */
const ALL_CURRENCIES = [
  { code: "USD", name: "United States Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "INR", name: "Indian Rupee" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "KRW", name: "South Korean Won" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "ZAR", name: "South African Rand" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "DKK", name: "Danish Krone" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "ILS", name: "Israeli Shekel" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "PLN", name: "Polish Złoty" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "THB", name: "Thai Baht" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "COP", name: "Colombian Peso" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "ARS", name: "Argentine Peso" },
];

/* ---------- Helpers ---------- */
const badgeClass = (variant = "blue") =>
  clsx(
    "px-2 py-1 rounded-md text-xs font-medium shadow-sm",
    variant === "blue" && "backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300",
    variant === "neutral" && "backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
  );

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function formatNumber(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1000) return Number(n).toLocaleString();
  return (Math.round(n * 1e6) / 1e6).toString();
}

/* ---------- Component ---------- */
export default function XRatesPage() {
  const API_BASE = "/api/xrates/calculator/"; // your proxy endpoint - keep or change
  const DEFAULT_FROM = "USD";
  const DEFAULT_TO = "INR";
  const DEFAULT_AMOUNT = 1;

  // core state
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);

  // suggestions / search / ui
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // fetching/parsing
  const [loading, setLoading] = useState(false);
  const [rawHtml, setRawHtml] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [avgOpen, setAvgOpen] = useState(false);

  // historical chart
  const [historical, setHistorical] = useState([]); // { date, rate }
  const [histLoading, setHistLoading] = useState(false);
  const [histAvg, setHistAvg] = useState(null);
  const [selectedPair, setSelectedPair] = useState(null);


  // recents
  const recentRef = useRef([]);

  // suggestion compute
  useEffect(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      return;
    }
    const res = ALL_CURRENCIES.filter(c =>
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 10);
    setSuggestions(res);
  }, [query]);

  /* ---------- Parse X-Rates HTML ---------- */
  function parseXRatesHtml(html, fromC, toC, amt) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      // common class on X-Rates: ccOutputRslt
      const el = doc.querySelector(".ccOutputRslt");
      let resultStr = el ? el.textContent.trim() : null;
      if (!resultStr) {
        const alt = doc.querySelector(".converterresult .result");
        resultStr = alt ? alt.textContent.trim() : null;
      }
      let numeric = null;
      if (resultStr) {
        const m = resultStr.match(/([0-9,.]+)/);
        if (m) numeric = Number(m[1].replace(/,/g, ""));
      }
      const infoEl = doc.querySelector(".small");
      let timestamp = infoEl ? infoEl.textContent.trim() : null;
      const ratePerUnit = numeric != null && amt ? numeric / Number(amt) : null;

      return {
        resultStr,
        numeric,
        ratePerUnit,
        timestamp,
        from: fromC,
        to: toC,
        amount: amt,
      };
    } catch {
      return null;
    }
  }

  /* ---------- Fetch X-Rates via proxy (HTML) ---------- */
  async function fetchRate(fromC = from, toC = to, amt = amount) {
    setLoading(true);
    setRawHtml(null);
    setParsed(null);
    setError("");
    try {
      const url = `${API_BASE}?from=${encodeURIComponent(fromC)}&to=${encodeURIComponent(toC)}&amount=${encodeURIComponent(amt)}`;
      const res = await fetch(url, { method: "GET", mode: "cors" });
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const text = await res.text();
      setRawHtml(text);

      const p = parseXRatesHtml(text, fromC, toC, amt);
      if (!p) {
        setError("Unable to parse X-Rates HTML (page structure may have changed).");
      } else {
        setParsed(p);
        // add to recents
        const key = `${fromC}_${toC}`;
        recentRef.current = [{ from: fromC, to: toC }, ...recentRef.current.filter(r => `${r.from}_${r.to}` !== key)].slice(0, 8);
      }
      // Also fetch historical data (last 90 days) for chart
      fetchHistorical(fromC, toC);
    } catch (err) {
      console.error(err);
      setError((err && err.message && err.message.includes("Failed to fetch"))
        ? "Network/CORS error — browser blocked the request. Use a server-side proxy in production."
        : String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Historical data: exchangerate.host timeseries ---------- */
  async function fetchHistorical(base, symbol) {
    try {
      setHistLoading(true);
      setHistorical([]);
      setHistAvg(null);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 90); // last 90 days
      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);
      const url = `https://api.exchangerate.host/timeseries?start_date=${startStr}&end_date=${endStr}&base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbol)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Historical fetch failed");
      const j = await res.json();
      if (!j || !j.rates) {
        setHistorical([]);
        setHistAvg(null);
        return;
      }
      const data = Object.keys(j.rates).sort().map((d) => ({
        date: d,
        rate: j.rates[d][symbol] ?? null,
      })).filter(r => r.rate != null);
      setHistorical(data);
      if (data.length) {
        const avg = data.reduce((s, it) => s + it.rate, 0) / data.length;
        setHistAvg(avg);
      } else {
        setHistAvg(null);
      }
    } catch (err) {
      console.error("Historical fetch failed", err);
      setHistorical([]);
      setHistAvg(null);
    } finally {
      setHistLoading(false);
    }
  }

  /* ---------- Copy / Download ---------- */
  async function copyPayload() {
    const payload = { parsed, fetchedAt: new Date().toISOString(), historical };
    try {
      await navigator.clipboard.writeText(prettyJSON(payload));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function downloadPayload() {
    const payload = { parsed, rawHtml, fetchedAt: new Date().toISOString(), historical };
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `xrates_${from}_${to}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ---------- Small UX helpers ---------- */
  useEffect(() => {
    // do a quick default fetch on mount
    fetchRate(DEFAULT_FROM, DEFAULT_TO, DEFAULT_AMOUNT).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choosePreset(a, b, amt = amount) {
    setFrom(a);
    setTo(b);
    setAmount(amt);
    fetchRate(a, b, amt);
  }

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen py-8 px-4 overflow-hidden">
      <div className="max-w-8xl mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row flex-wrap items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <Globe className="w-6 h-6 text-zinc-500" />
              X-Rates — Currency Explorer
            </h1>
            <p className="mt-1 text-sm opacity-70 max-w-2xl">
              Parse X-Rates calculator results
            </p>
          </div>

          {/* Controls */}
          <div className="w-full md:w-[720px]">
            <div className={clsx("flex gap-3 flex-wrap sm:flex-nowrap items-center p-3 rounded-xl shadow-sm",
              "bg-white border border-zinc-200 dark:bg-black/40 dark:border-zinc-800")}>

              {/* From select */}
              <div className="w-40">
                <Select onValueChange={(v) => setFrom(v)} value={from}>
                  <SelectTrigger className="w-full cursor-pointer"><SelectValue placeholder="From" /></SelectTrigger>
                  <SelectContent>
                    {ALL_CURRENCIES.map(c => <SelectItem className="cursor-pointer" key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs opacity-60">→</div>

              {/* To select */}
              <div className="w-40">
                <Select onValueChange={(v) => setTo(v)} value={to}>
                  <SelectTrigger className="w-full cursor-pointer"><SelectValue placeholder="To" /></SelectTrigger>
                  <SelectContent>
                    {ALL_CURRENCIES.map(c => <SelectItem className="cursor-pointer" key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-28 border-0 bg-transparent"
                aria-label="Amount"
              />

              <Button onClick={() => fetchRate(from, to, amount)} className="cursor-pointer" variant="outline">
                <Search /> Convert
              </Button>
              <div className="ml-auto hidden md:block relative">
                <Input
                  placeholder="Quick search currency (code or name)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className=" border-0 bg-transparent cursor-text"
                  aria-label="Search currency"
                />
                {suggestions.length > 0 && (
                  <div className="absolute right-6 w-100 z-40 mt-2 rounded-xl shadow-2xl overflow-hidden border bg-white dark:bg-black">
                    <ScrollArea className="overflow-y-auto" style={{ maxHeight: 280 }}>
                      {suggestions.map(s => (
                        <div key={s.code} className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer flex items-center justify-between"
                          onClick={() => { setQuery(""); setSuggestions([]); setFrom(s.code); }}>
                          <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs opacity-60">{s.code}</div>
                          </div>
                          <Badge className={badgeClass("neutral")}>{s.code}</Badge>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Mobile sheet */}
              <div className="md:hidden ml-2">
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" className="p-2 cursor-pointer"><Menu /></Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full max-w-xs">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium">Popular Currencies</div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          const pool = ALL_CURRENCIES;
                          const ids = new Set();
                          while (ids.size < Math.min(8, pool.length)) ids.add(Math.floor(Math.random() * pool.length));
                          setSuggestions(Array.from(ids).map(i => pool[i]));
                        }} className="cursor-pointer"><RefreshCw /></Button>
                      </div>

                      <ScrollArea style={{ height: "60vh" }}>
                       <div className="space-y-2">
  {ALL_CURRENCIES.slice(0, 40).map(c => {
    const isSelected = from === c.code;

    return (
      <div
        key={c.code}
        onClick={() => { setFrom(c.code); setSheetOpen(false); }}
        className={clsx(
          "p-3 rounded-lg cursor-pointer flex items-center justify-between transition-all border",
          "hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 backdrop-blur-sm",
          isSelected
            ? "border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/10 shadow-sm"
            : "border-transparent"
        )}
      >
        <div>
          <div className="font-medium">{c.name}</div>
          <div className="text-xs opacity-60">{c.code}</div>
        </div>

        <Badge
          className={clsx(
            "px-3 py-1 rounded-md font-medium backdrop-blur-md transition",
            "bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300",
            isSelected && "ring-2 ring-amber-500/40"
          )}
        >
          {c.code}
        </Badge>
      </div>
    );
  })}
</div>

                      </ScrollArea>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>

        {/* Layout */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left quick picks */}
          <aside className="lg:col-span-3 hidden lg:block">
            <Card className="dark:bg-zinc-950 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Star className="w-4 h-4 text-zinc-500" /> Quick Picks</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-xs opacity-60 mb-2">Click to set From → To</div>

           <div className="space-y-2 h-100 overflow-y-auto">
  {[
    ["USD","EUR"], ["USD","INR"], ["EUR","GBP"], ["GBP","USD"], ["USD","JPY"],
    ["AUD","USD"], ["EUR","INR"], ["CNY","USD"], ["USD","SGD"], ["USD","CAD"],
    ["NZD","USD"], ["USD","MXN"], ["CHF","USD"], ["USD","HKD"], ["EUR","JPY"],
    ["JPY","INR"], ["SGD","INR"], ["CAD","EUR"], ["AUD","INR"], ["USD","CNY"]
  ].map(([a,b]) => {

    const isSelected = selectedPair === `${a}_${b}`;

    return (
      <div
        key={`${a}_${b}`}
        className={`
          p-2 rounded-md cursor-pointer flex items-center justify-between
          transition-all duration-200
          hover:bg-zinc-50 dark:hover:bg-zinc-900
          ${isSelected ? "bg-zinc-200 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-600" : ""}
        `}
        onClick={() => {
          setSelectedPair(`${a}_${b}`);
          choosePreset(a,b);
        }}
      >
        <div>
          <div className="font-medium">{a} → {b}</div>
          <div className="text-xs opacity-60">
            {ALL_CURRENCIES.find(c=>c.code===a)?.name || a}
            {" → "}
            {ALL_CURRENCIES.find(c=>c.code===b)?.name || b}
          </div>
        </div>

        <Badge className={badgeClass(isSelected ? "active" : "neutral")}>
          {a}/{b}
        </Badge>
      </div>
    );
  })}
</div>


                <Separator className="my-3" />

                <div className="text-xs opacity-60">Recent</div>
                <div className="mt-2 space-y-2">
                  {(recentRef.current || []).length === 0 && <div className="text-xs opacity-60">No recent conversions</div>}
                  {(recentRef.current || []).map((r,i) => (
                    <div key={`${r.from}_${r.to}_${i}`} className="p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer flex items-center justify-between"
                      onClick={() => { setFrom(r.from); setTo(r.to); fetchRate(r.from,r.to,amount); }}>
                      <div>{r.from} → {r.to}</div>
                      <Badge className={badgeClass("neutral")}>{r.from}/{r.to}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Center: main result + chart */}
          <section className="lg:col-span-6">
            <Card className="rounded-2xl dark:bg-zinc-950 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-semibold">Conversion Result</div>
                    <div className="text-xs opacity-60">Source: X-Rates (parsed) + exchangerate.host (history)</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={badgeClass("blue")}>{from} → {to}</Badge>
                    <Badge className={badgeClass("neutral")}>{amount} units</Badge>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="py-16 text-center"><RefreshCw className="animate-spin mx-auto" /></div>
                ) : error ? (
                  <div className="p-6 rounded-md bg-red-50 dark:bg-red-900/20 text-sm text-red-700">
                    <div className="font-medium">Fetch error</div>
                    <div className="text-xs opacity-80 mt-1">{error}</div>
                    <div className="mt-2 text-xs opacity-70">Tip: If this is a CORS error run the proxy server-side and point API_BASE there.</div>
                  </div>
                ) : !parsed ? (
                  <div className="py-12 text-center text-sm opacity-60">No result yet. Click Convert to fetch from X-Rates.</div>
                ) : (
                  <div className="space-y-4">
                    {/* Primary result */}
                    <div className="text-center">
                      <div className="text-xs opacity-60">Result</div>
                      <div className="text-4xl md:text-5xl font-extrabold mt-2">{parsed.resultStr || "—"}</div>
                      <div className="text-sm opacity-60 mt-1">{parsed.timestamp || "Live"}</div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-md border text-center">
                        <div className="text-xs opacity-60">Numeric</div>
                        <div className="font-medium mt-1">{formatNumber(parsed.numeric)}</div>
                      </div>
                      <div className="p-3 rounded-md border text-center">
                        <div className="text-xs opacity-60">Per unit</div>
                        <div className="font-medium mt-1">{parsed.ratePerUnit ? formatNumber(parsed.ratePerUnit) : "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border text-center">
                        <div className="text-xs opacity-60">Amount</div>
                        <div className="font-medium mt-1">{parsed.amount}</div>
                      </div>
                    </div>

                    {/* Chart & avg */}
                    <div className="p-3 rounded-md border">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold flex items-center gap-2"><BarChart2 /> Recent trend (90d)</div>
                        <div className="flex items-center gap-2">

                          <Button variant="outline" onClick={() => setGraphOpen(true)} className="cursor-pointer"><TrendingUp />Avg</Button>
                          <Button variant="outline" onClick={() => setAvgOpen(true)} className="cursor-pointer"><FileText />Monthly</Button>
                        </div>
                      </div>
                    </div>

                    {/* parsed details + actions */}
                    <div className="p-3 rounded-md border">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold flex items-center gap-2"><Info /> Parsed details</div>
                        <div className="text-xs opacity-60">Source: x-rates.com</div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between"><div>From</div><div className="font-medium">{parsed.from}</div></div>
                        <div className="flex justify-between"><div>To</div><div className="font-medium">{parsed.to}</div></div>
                        <div className="flex justify-between"><div>Fetched</div><div className="font-medium">{new Date().toLocaleString()}</div></div>
                      </div>
                    </div>

                    {/* actions */}
                    <div className="flex gap-2 items-center">
                  

                      <Button variant="outline" onClick={downloadPayload} className="cursor-pointer"><Download /> Download</Button>

                      <Button variant="outline" onClick={() => setShowRaw(s => !s)} className="cursor-pointer"><FileText /> {showRaw ? "Hide raw" : "Show raw"}</Button>

                      <Button variant="outline" onClick={() => setDialogOpen(true)} className="ml-auto cursor-pointer"><ExternalLink /> Open</Button>
                    </div>

                    {showRaw && rawHtml && (
                      <div className="mt-3 p-3 rounded-md border overflow-auto text-xs" style={{ maxHeight: 220 }}>
                        <pre>{rawHtml}</pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <div className="w-full text-xs opacity-60 flex items-center justify-between">
                  <div>Source: X-Rates (HTML) + exchangerate.host</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> <span>Live parse & chart</span></div>
                </div>
              </CardFooter>
            </Card>
          </section>

          {/* Right: quick actions & notes */}
          <aside className="lg:col-span-3">
            <Card className="dark:bg-zinc-950 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Info /> Quick Actions</CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col gap-3">
                <Button variant="outline" className="w-full cursor-pointer" onClick={copyPayload}><Copy /> Copy JSON</Button>

                <Button variant="outline" className="w-full cursor-pointer" onClick={() => downloadPayload()}><Download /> Download JSON</Button>

                <Button variant="ghost" className="w-full cursor-pointer" onClick={() => {
                  const url = `${API_BASE}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`;
                  window.open(url, "_blank");
                }}><ExternalLink /> Open X-Rates (via proxy)</Button>

                <Separator />

                <div>
                  <div className="text-sm font-semibold">Notes</div>
                  <div className="text-xs opacity-70 mt-2 space-y-2">
                    <div>- This page parses HTML from X-Rates calculator to extract the result.</div>
                    <div>- If the browser blocks the request (CORS), use a server-side proxy returning the raw HTML.</div>
                    <div>- Historical chart uses exchangerate.host timeseries (free) for the last 90 days.</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4 dark:bg-zinc-950 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ArrowRightCircle /> Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div>1 USD → INR</div>
                    <Button variant="ghost" onClick={() => choosePreset("USD","INR",1)} className="cursor-pointer"><ArrowRightCircle /></Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>100 EUR → USD</div>
                    <Button variant="ghost" onClick={() => choosePreset("EUR","USD",100)} className="cursor-pointer"><ArrowRightCircle /></Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>1 GBP → USD</div>
                    <Button variant="ghost" onClick={() => choosePreset("GBP","USD",1)} className="cursor-pointer"><ArrowRightCircle /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </main>
      </div>

      {/* Dialog: open original calculator (iframe via proxy URL) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl w-full p-3 rounded-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Open X-Rates Calculator</DialogTitle>
          </DialogHeader>
          <div style={{ height: "70vh" }}>
            <iframe
              title="xrates"
              src={`${API_BASE}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`}
              style={{ border: 0, width: "100%", height: "100%" }}
            />
          </div>
          <DialogFooter>
            <div className="flex items-center justify-between w-full text-xs opacity-70">
              <div>Embedded X-Rates (may be blocked by X-Frame-Options on upstream).</div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><ChevronsLeft /> Close</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: embedded X-Rates graph */}
      <Dialog open={graphOpen} onOpenChange={setGraphOpen}>
        <DialogContent className="max-w-4xl w-full p-3 rounded-2xl overflow-hidden">
          <DialogHeader><DialogTitle>Graph — {from} → {to}</DialogTitle></DialogHeader>
          <div style={{ height: "70vh" }}>
            <iframe
              title="xrates-graph"
              src={`https://www.x-rates.com/graph/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`}
              style={{ border: 0, width: "100%", height: "100%" }}
            />
          </div>
          <DialogFooter>
            <div className="flex items-center justify-between w-full text-xs opacity-70">
              <div>X-Rates graph (embedded)</div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setGraphOpen(false)} className="cursor-pointer"><ChevronsLeft /> Close</Button>
                <Button variant="outline" onClick={() => window.open(`https://www.x-rates.com/graph/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`, "_blank")} className="cursor-pointer"><ExternalLink /></Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: X-Rates average page */}
      <Dialog open={avgOpen} onOpenChange={setAvgOpen}>
        <DialogContent className="max-w-4xl w-full p-3 rounded-2xl overflow-hidden">
          <DialogHeader><DialogTitle>Average — {from} → {to}</DialogTitle></DialogHeader>
          <div style={{ height: "70vh" }}>
            <iframe
              title="xrates-average"
              src={`https://www.x-rates.com/average/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}&year=${new Date().getFullYear()}`}
              style={{ border: 0, width: "100%", height: "100%" }}
            />
          </div>
          <DialogFooter>
            <div className="flex items-center justify-between w-full text-xs opacity-70">
              <div>Average page (embedded)</div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setAvgOpen(false)} className="cursor-pointer"><ChevronsLeft /> Close</Button>
                <Button variant="outline" onClick={() => window.open(`https://www.x-rates.com/average/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}&year=${new Date().getFullYear()}`, "_blank")} className="cursor-pointer"><ExternalLink /></Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
