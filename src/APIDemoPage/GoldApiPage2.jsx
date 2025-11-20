"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  RefreshCw,
  AlertCircle,
  DollarSign,
  Copy,
  Download,
  List,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Image,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

// Recharts
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BASE = "https://api.gold-api.com";

// ----------- Helpers -----------
function fmt(num) {
  if (num === null || num === undefined || Number.isNaN(num)) return "—";
  if (num >= 1) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return num.toPrecision(4);
}

function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

function nowTs() {
  return new Date().toLocaleTimeString();
}

// ------------- MAIN PAGE -------------
export default function GoldApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // ----------- STATE -----------
  const [symbols, setSymbols] = useState([]);
  const [prices, setPrices] = useState({});
  const [selected, setSelected] = useState("XAU");

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);

  const suggestTimer = useRef(null);

  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rawResponse, setRawResponse] = useState(null);

  // Price History (for the chart)
  const [history, setHistory] = useState([]); // { t, price }

  // ----------- FETCH SYMBOLS -----------
  async function fetchSymbols() {
    setLoadingSymbols(true);
    try {
      const res = await fetch(`${BASE}/symbols`);
      if (!res.ok) throw new Error(`Failed symbols (${res.status})`);
      const json = await res.json();

      let list = [];
      if (Array.isArray(json)) list = json;
      else if (Array.isArray(json.symbols)) list = json.symbols;
      else if (Array.isArray(json.data)) list = json.data;
      else {
        list = Object.keys(json).map((k) => ({
          symbol: k,
          name: json[k]?.name ?? k,
        }));
      }

      list = list.map((it) =>
        typeof it === "string"
          ? { symbol: it, name: it }
          : { symbol: it.symbol || it.code, name: it.name || it.symbol }
      );

      list.sort((a, b) => a.symbol.localeCompare(b.symbol));

      setSymbols(list);
    } catch (err) {
      console.error(err);
      setSymbols([
        { symbol: "XAU", name: "Gold" },
        { symbol: "XAG", name: "Silver" },
        { symbol: "XPT", name: "Platinum" },
        { symbol: "XPD", name: "Palladium" },
      ]);
    } finally {
      setLoadingSymbols(false);
    }
  }

  // ----------- PARSE PRICE -----------
  function parsePricePayload(payload) {
    if (!payload) return { price: null, currency: "USD" };
    if (payload.price !== undefined)
      return { price: payload.price, currency: payload.currency || "USD" };
    if (payload.data?.price !== undefined)
      return { price: payload.data.price, currency: payload.data.currency || "USD" };
    return { price: null, currency: "USD" };
  }

  // ----------- FETCH PRICE FOR ONE SYMBOL -----------
  async function fetchPrice(symbol) {
    if (!symbol) return;
    setLoadingPrice(true);
    try {
      const res = await fetch(`${BASE}/price/${symbol}`);
      if (!res.ok) throw new Error(`Failed price (${res.status})`);
      const json = await res.json();
      setRawResponse(json);

      setPrices((prev) => ({
        ...prev,
        [symbol]: json,
      }));

      // update history
      const parsed = parsePricePayload(json);
      setHistory((h) => [
        ...h,
        {
          t: nowTs(),
          price: parsed.price ?? null,
        },
      ].slice(-60)); // keep last 60 points
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrice(false);
    }
  }

  // ----------- AUTO REFRESH (10 seconds) -----------
  useEffect(() => {
    if (!selected) return;
    fetchPrice(selected);
    const timer = setInterval(() => fetchPrice(selected), 10000);
    return () => clearInterval(timer);
  }, [selected]);

  // ----------- INITIAL LOAD -----------
  useEffect(() => {
    fetchSymbols();
  }, []);

  // ----------- SUGGESTIONS -----------  
  function onQueryChange(val) {
    setQuery(val);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);

    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    suggestTimer.current = setTimeout(() => {
      const q = val.toLowerCase();
      const filtered = symbols.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
      setSuggestions(filtered.slice(0, 8));
    }, 200);
  }

  // ----------- METAL ROW COMPONENT -----------
  function MetalRow({ symbol, name }) {
    const payload = prices[symbol];
    const info = parsePricePayload(payload);
    return (
      <button
        onClick={() => {
          setSelected(symbol);
          setShowSuggest(false);
        }}
        className={clsx(
          "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors",
          selected === symbol && "border border-primary-500 bg-primary-50/20 dark:bg-primary-900/20"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 border">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{symbol}</div>
            <div className="text-xs opacity-60">{name}</div>
          </div>
        </div>

        <div className="text-right text-sm font-semibold">
          {info.price ? `$${fmt(info.price)}` : "—"}
        </div>
      </button>
    );
  }

  // ----------- SELECTED PARSED PRICE -----------  
  const selectedMeta = symbols.find((s) => s.symbol === selected) || { symbol: selected, name: selected };
  const selectedPayload = prices[selected];
  const selectedPriceInfo = parsePricePayload(selectedPayload);

  const priceUp = useMemo(() => {
    if (history.length < 2) return false;
    const prev = history[history.length - 2]?.price;
    const curr = history[history.length - 1]?.price;
    return curr > prev;
  }, [history]);

  // ------------------ UI ------------------
  return (
    <div className="min-h-screen p-6 max-w-9xl mx-auto">
      
      {/* ~~~~~~~~~ HEADER ~~~~~~~~~ */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Metals — Live Prices</h1>
          <p className="mt-1 text-sm opacity-70">Realtime auto-updating metal prices with live trend chart.</p>
        </div>

        <div className="w-full md:w-[560px] relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!query.trim()) return;
              const match = symbols.find((s) => s.symbol.toLowerCase() === query.trim().toLowerCase());
              if (match) {
                setSelected(match.symbol);
                setQuery("");
                setShowSuggest(false);
              } else if (suggestions.length) {
                setSelected(suggestions[0].symbol);
                setQuery("");
                setShowSuggest(false);
              }
            }}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-lg border",
              isDark ? "bg-black/60 border-zinc-800" : "bg-white border-zinc-200"
            )}
          >
            <Search className="opacity-60" />
            <Input
              placeholder="Search metal, e.g. XAU, Gold..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              className="border-0 bg-transparent shadow-none outline-none"
            />

            <Button type="submit" variant="outline"><Search /></Button>
            <Button variant="ghost" onClick={() => setQuery("")}><RefreshCw /></Button>
          </form>

          {/* ~~~~~ SUGGESTIONS ~~~~~ */}
          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={clsx(
                  "absolute left-0 right-0 mt-2 rounded-xl shadow-xl border z-50",
                  isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"
                )}
              >
                <ScrollArea style={{ maxHeight: 240 }}>
                  <div className="p-2">
                    {suggestions.map((s) => (
                      <div
                        key={s.symbol}
                        className="px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-md cursor-pointer"
                        onClick={() => {
                          setSelected(s.symbol);
                          setQuery("");
                          setShowSuggest(false);
                        }}
                      >
                        <div className="font-medium">{s.symbol}</div>
                        <div className="text-xs opacity-60">{s.name}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* -------------------------------------------------- */}
      {/*           MAIN LAYOUT: LEFT + CENTER + RIGHT       */}
      {/* -------------------------------------------------- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ~~~~~~~~~ LEFT SIDEBAR ~~~~~~~~~ */}
        <aside className={clsx(
          "lg:col-span-3 p-4 rounded-2xl space-y-4 border",
          isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Supported Metals</div>
              <div className="text-xs opacity-60">Click to view live chart</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => fetchSymbols()}>
              <RefreshCw />
            </Button>
          </div>

          <Separator />

          <div className="max-h-[58vh] overflow-auto space-y-2">
            {symbols.map((s) => (
              <MetalRow key={s.symbol} symbol={s.symbol} name={s.name} />
            ))}
          </div>
        </aside>

        {/* ~~~~~~~~~ CENTER (DETAIL + CHART) ~~~~~~~~~ */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx(
            "rounded-2xl border overflow-hidden",
            isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200"
          )}>
            <CardHeader className={clsx(
              "p-5 flex items-center justify-between border-b",
              isDark ? "bg-black/60 border-zinc-800" : "bg-white/90 border-zinc-200"
            )}>
              <div>
                <CardTitle className="text-lg">
                  {selectedMeta.name} — {selectedMeta.symbol}
                </CardTitle>
                <div className="text-xs opacity-60">Auto-updating every 10 sec</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fetchPrice(selected)}>
                  <RefreshCw className={loadingPrice ? "animate-spin" : ""} /> Refresh
                </Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)}>
                  <Image />
                </Button>
              </div>
            </CardHeader>

            {/* ~~~~~~~~~ PRICE DISPLAY + TREND ~~~~~~~~~ */}
            <CardContent>
              <div className={clsx(
                "p-4 rounded-xl border mb-5",
                isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs opacity-60">Current Price</div>
                    <div className="text-3xl font-extrabold flex items-center gap-2">
                      {selectedPriceInfo.price !== null ? (
                        <>
                          ${fmt(selectedPriceInfo.price)}
                          {priceUp ? (
                            <TrendingUp className="w-6 h-6 text-emerald-500" />
                          ) : (
                            <TrendingDown className="w-6 h-6 text-rose-500" />
                          )}
                        </>
                      ) : "—"}
                    </div>
                    <div className="text-xs opacity-60 mt-1">{history.length} data points this session</div>
                  </div>
                </div>
              </div>

              {/* ~~~~~~~~~ LIVE AREA CHART ~~~~~~~~~ */}
              <div
                className={clsx(
                  "h-64 rounded-xl border p-3",
                  isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200"
                )}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={priceUp ? "#22c55e" : "#ef4444"} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={priceUp ? "#22c55e" : "#ef4444"} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>

                    <XAxis
                      dataKey="t"
                      tick={{ fontSize: 10 }}
                      stroke={isDark ? "#aaa" : "#666"}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke={isDark ? "#aaa" : "#666"}
                      domain={["auto", "auto"]}
                    />

                    <Tooltip
                      contentStyle={{ background: isDark ? "#000" : "#fff", borderRadius: 8 }}
                    />

                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={priceUp ? "#22c55e" : "#ef4444"}
                      fill="url(#priceArea)"
                      strokeWidth={2}
                      isAnimationActive={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <Separator className="my-5" />

              {/* ~~~~~~~~~ DETAILS + RAW JSON ~~~~~~~~~ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Metadata */}
                <div className={clsx(
                  "p-3 rounded-lg border",
                  isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200"
                )}>
                  <div className="text-xs opacity-60 mb-2">Metal Details</div>
                  <div className="space-y-2 text-sm">
                    <div><span className="opacity-60 text-xs">Symbol</span><div className="font-medium">{selectedMeta.symbol}</div></div>
                    <div><span className="opacity-60 text-xs">Name</span><div className="font-medium">{selectedMeta.name}</div></div>
                    <div><span className="opacity-60 text-xs">Currency</span><div className="font-medium">{selectedPriceInfo.currency}</div></div>
                    <div><span className="opacity-60 text-xs">Last Price</span><div className="font-medium">{fmt(selectedPriceInfo.price)}</div></div>
                  </div>
                </div>

                {/* Raw JSON */}
                <div className={clsx(
                  "p-3 rounded-lg border overflow-auto",
                  isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200"
                )}>
                  <div className="text-xs opacity-60 mb-2">Raw API Payload</div>
                  <div className="text-xs font-mono" style={{ maxHeight: 200 }}>
                    <pre>{rawResponse ? prettyJSON(rawResponse) : "Loading..."}</pre>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* QUICK ACTIONS */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(prettyJSON(rawResponse))}><Copy /> Copy JSON</Button>
                <Button variant="outline" onClick={() => {
                  const blob = new Blob([prettyJSON(rawResponse)], { type: "application/json" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `${selected}_price.json`;
                  a.click();
                }}>
                  <Download /> Download JSON
                </Button>
                <Button variant="ghost" onClick={() => window.open(`${BASE}/price/${selected}`, "_blank")}><DollarSign /> Open API</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ~~~~~~~~~ RIGHT SIDEBAR ~~~~~~~~~ */}
        <aside className={clsx(
          "lg:col-span-3 space-y-4 p-4 rounded-2xl border",
          isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200"
        )}>
          <div>
            <div className="text-sm font-semibold">Quick Actions</div>
            <div className="text-xs opacity-60">Useful shortcuts</div>

            <div className="mt-3 flex flex-col gap-2">
              <Button variant="outline" onClick={() => setSelected("XAU")}><DollarSign /> Default: XAU</Button>
              <Button variant="outline" onClick={() => fetchSymbols()}><List /> Reload Symbols</Button>
              <Button variant="ghost" onClick={() => navigator.clipboard.writeText(selected)}><Copy /> Copy Symbol</Button>
            </div>
          </div>

          <Separator />

          <div className="text-xs opacity-60">
            Notes:  
            <br />• Auto refresh every 10 seconds  
            <br />• Chart reflects live session-only trend  
            <br />• No API key used  
          </div>
        </aside>
      </main>

      {/* ~~~~~~~~~ RAW JSON DIALOG ~~~~~~~~~ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx(
          "max-w-3xl w-full p-0 rounded-2xl overflow-hidden",
          isDark ? "bg-black/90" : "bg-white"
        )}>
          <DialogHeader>
            <DialogTitle>{selectedMeta?.name || selected}</DialogTitle>
          </DialogHeader>

          <div className="p-5 text-xs font-mono max-h-[60vh] overflow-auto">
            <pre>{rawResponse ? prettyJSON(rawResponse) : "No data"}</pre>
          </div>

          <DialogFooter className="p-4 border-t">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
