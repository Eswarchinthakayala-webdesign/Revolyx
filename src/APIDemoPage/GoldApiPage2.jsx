"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Menu,
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
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Layers,
} from "lucide-react";

/* shadcn-ui style components (adjust import paths to your project) */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"; // ensure these exist in your shadcn components

// Recharts
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/* ---------------- Utilities ---------------- */
const BASE = "https://api.gold-api.com";

function fmt(num) {
  if (num === null || num === undefined || Number.isNaN(num)) return "—";
  if (num >= 1) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return num.toPrecision(4);
}
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
function nowTs() {
  return new Date().toLocaleTimeString();
}

/* small hook to reset a boolean after timeout */
function useResetTimeout(timeout = 2000) {
  const tRef = useRef(null);
  const setWithReset = (setter, value) => {
    if (tRef.current) clearTimeout(tRef.current);
    setter(value);
    tRef.current = setTimeout(() => setter(false), timeout);
  };
  useEffect(() => () => clearTimeout(tRef.current), []);
  return setWithReset;
}

/* ---------------- MAIN PAGE ---------------- */
export default function GoldApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
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

  const [history, setHistory] = useState([]); // { t, price }

  // mobile sheet open
  const [sheetOpen, setSheetOpen] = useState(false);

  // copy state + reset hook
  const [copied, setCopied] = useState(false);
  const setCopiedWithReset = useResetTimeout(2200);

  // raw toggle
  const [showRawInline, setShowRawInline] = useState(false);

  /* --------------- Fetch Symbols --------------- */
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

  /* --------------- Parse price payload --------------- */
  function parsePricePayload(payload) {
    if (!payload) return { price: null, currency: "USD" };
    if (payload.price !== undefined) return { price: payload.price, currency: payload.currency || "USD" };
    if (payload.data?.price !== undefined) return { price: payload.data.price, currency: payload.data.currency || "USD" };
    return { price: null, currency: "USD" };
  }

  /* --------------- Fetch price --------------- */
  async function fetchPrice(symbol) {
    if (!symbol) return;
    setLoadingPrice(true);
    try {
      const res = await fetch(`${BASE}/price/${symbol}`);
      if (!res.ok) throw new Error(`Failed price (${res.status})`);
      const json = await res.json();
      setRawResponse(json);
      setPrices((prev) => ({ ...prev, [symbol]: json }));

      const parsed = parsePricePayload(json);
      setHistory((h) =>
        [
          ...h,
          {
            t: nowTs(),
            price: parsed.price ?? null,
          },
        ].slice(-60)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrice(false);
    }
  }

  /* --------------- Auto refresh --------------- */
  useEffect(() => {
    if (!selected) return;
    fetchPrice(selected);
    const timer = setInterval(() => fetchPrice(selected), 10000);
    return () => clearInterval(timer);
  }, [selected]);

  /* --------------- initial load --------------- */
  useEffect(() => {
    fetchSymbols();
  }, []);

  /* --------------- suggestions --------------- */
  function onQueryChange(val) {
    setQuery(val);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);

    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    suggestTimer.current = setTimeout(() => {
      const q = val.toLowerCase();
      const filtered = symbols.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
      setSuggestions(filtered.slice(0, 8));
    }, 200);
  }

  /* --------------- helpers & derived --------------- */
  const selectedMeta = symbols.find((s) => s.symbol === selected) || { symbol: selected, name: selected };
  const selectedPayload = prices[selected];
  const selectedPriceInfo = parsePricePayload(selectedPayload);

  const priceUp = useMemo(() => {
    if (history.length < 2) return false;
    const prev = history[history.length - 2]?.price;
    const curr = history[history.length - 1]?.price;
    return curr > prev;
  }, [history]);

  /* --------------- UI subcomponents --------------- */
  function MetalRow({ symbol, name }) {
    const payload = prices[symbol];
    const info = parsePricePayload(payload);
    return (
      <button
        onClick={() => {
          setSelected(symbol);
          setSheetOpen(false);
        }}
        className={clsx(
          "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-3 transition-colors",
          "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
          selected === symbol && "border border-primary-500 bg-primary-50/20 dark:bg-primary-900/20",
          "cursor-pointer"
        )}
        aria-label={`Select ${symbol}`}
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

  /* --------------- copy JSON --------------- */
  async function handleCopyJSON() {
    try {
      await navigator.clipboard.writeText(prettyJSON(rawResponse));
      setCopiedWithReset(setCopied, true);
    } catch (err) {
      console.error("copy failed", err);
    }
  }

  /* --------------- download JSON --------------- */
  function handleDownloadJSON() {
    const blob = new Blob([prettyJSON(rawResponse)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selected}_price.json`;
    a.click();
  }

  /* --------------- small header for mobile: menu + search --------------- */
  return (
    <div className="min-h-screen p-4 md:p-6 pb-10 max-w-8xl mx-auto">
      {/* header */}
      <header className="flex flex-wrap items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* mobile menu */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2 rounded-md cursor-pointer" aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-[300px] p-2">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5" /> Markets
                  </SheetTitle>
                </SheetHeader>

                <div className="p-3">
                  <div className="text-xs opacity-70 mb-2">Supported Metals</div>
                  <ScrollArea style={{ maxHeight: "60vh" }}>
                    <div className="space-y-2">
                      {symbols.map((s) => (
                        <MetalRow key={s.symbol} symbol={s.symbol} name={s.name} />
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => fetchSymbols()} className="cursor-pointer">
                      <RefreshCw /> Reload
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelected("XAU")} className="cursor-pointer">
                      <DollarSign /> Default XAU
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">Metals — Live Prices</h1>
            <p className="text-xs opacity-70 hidden md:block">Realtime auto-updating metal prices with live trend chart.</p>
          </div>
        </div>

        {/* search area */}
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
              aria-label="Search metals"
            />

            <Button type="submit" variant="outline" className="cursor-pointer" aria-label="Search">
              <Search />
            </Button>
            <Button variant="ghost" onClick={() => setQuery("")} className="cursor-pointer" aria-label="Clear">
              <RefreshCw />
            </Button>
          </form>

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

      {/* main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* left sidebar (desktop) */}
        <aside
          className={clsx(
            "hidden lg:block lg:col-span-3 p-4 rounded-2xl space-y-4 border",
            isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Supported Metals</div>
              <div className="text-xs opacity-60">Click to view live chart</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => fetchSymbols()} className="cursor-pointer">
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

        {/* center */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl border overflow-hidden", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 md:p-5 flex items-start justify-between border-b", isDark ? "bg-black/60 border-zinc-800" : "bg-white/90 border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 opacity-80" />
                  <span>{selectedMeta.name} — {selectedMeta.symbol}</span>
                </CardTitle>
                <div className="text-xs opacity-60 mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Auto-updating every 10 sec
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fetchPrice(selected)} className="cursor-pointer" aria-label="Refresh price">
                  <RefreshCw className={loadingPrice ? "animate-spin" : ""} /> Refresh
                </Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)} className="cursor-pointer" aria-label="Open raw JSON dialog">
                  <Image />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 md:p-5">
              {/* price + trend */}
              <div className={clsx("p-4 rounded-xl border mb-4", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-xs opacity-60">Current Price</div>
                    <div className="text-3xl md:text-4xl font-extrabold flex items-center gap-3">
                      {selectedPriceInfo.price !== null ? (
                        <>
                          ${fmt(selectedPriceInfo.price)}
                          {priceUp ? (
                            <motion.span initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center">
                              <TrendingUp className="w-6 h-6 text-emerald-500" />
                            </motion.span>
                          ) : (
                            <motion.span initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center">
                              <TrendingDown className="w-6 h-6 text-rose-500" />
                            </motion.span>
                          )}
                        </>
                      ) : "—"}
                    </div>
                    <div className="text-xs opacity-60 mt-1">{history.length} data points this session</div>
                  </div>

                  {/* small stats / chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="px-3 py-1 rounded-lg border text-sm flex items-center gap-2 cursor-default">
                      <DollarSign className="w-4 h-4" />
                      <div className="text-xs">
                        {selectedPriceInfo.currency || "USD"}
                      </div>
                    </div>

                    <div className="px-3 py-1 rounded-lg border text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <div className="text-xs">{history[history.length - 1]?.t ?? "—"}</div>
                    </div>

                    <div className="px-3 py-1 rounded-lg border text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <div className="text-xs">{selectedMeta.symbol}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* chart */}
              <div className={clsx("h-64 rounded-xl border p-3 mb-4", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={priceUp ? "#22c55e" : "#ef4444"} stopOpacity={0.36} />
                        <stop offset="100%" stopColor={priceUp ? "#22c55e" : "#ef4444"} stopOpacity={0.06} />
                      </linearGradient>
                    </defs>

                    <XAxis dataKey="t" tick={{ fontSize: 10 }} stroke={isDark ? "#aaa" : "#666"} />
                    <YAxis tick={{ fontSize: 10 }} stroke={isDark ? "#aaa" : "#666"} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ background: isDark ? "#000" : "#fff", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="price" stroke={priceUp ? "#22c55e" : "#ef4444"} fill="url(#priceArea)" strokeWidth={2} isAnimationActive />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <Separator className="my-4" />

              {/* details + raw JSON (two column) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* metadata */}
                <div className={clsx("p-3 rounded-lg border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs opacity-60 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Metal Details</div>
                    <div className="text-xs opacity-60">Overview</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="opacity-60 text-xs">Symbol</span>
                      <div className="font-medium flex items-center gap-2">{selectedMeta.symbol}</div>
                    </div>

                    <div>
                      <span className="opacity-60 text-xs">Name</span>
                      <div className="font-medium">{selectedMeta.name}</div>
                    </div>

                    <div>
                      <span className="opacity-60 text-xs">Currency</span>
                      <div className="font-medium">{selectedPriceInfo.currency}</div>
                    </div>

                    <div>
                      <span className="opacity-60 text-xs">Last Price</span>
                      <div className="font-medium">{fmt(selectedPriceInfo.price)}</div>
                    </div>
                  </div>
                </div>

                {/* raw json area with toggle and copy */}
                <div className={clsx("p-3 rounded-lg border overflow-hidden", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs opacity-60 flex items-center gap-2"><FileText className="w-4 h-4" /> Raw API Payload</div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowRawInline((s) => !s)} className="cursor-pointer" aria-expanded={showRawInline}>
                        {showRawInline ? <ChevronUp /> : <ChevronDown />} {showRawInline ? "Hide" : "Show"}
                      </Button>

                      <motion.button
                        onClick={handleCopyJSON}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-md border cursor-pointer"
                        aria-label="Copy JSON"
                      >
                        <AnimatePresence mode="wait">
                          {copied ? (
                            <motion.span key="check" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                              <Check className="w-4 h-4 text-emerald-500" />
                            </motion.span>
                          ) : (
                            <motion.span key="copy" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                              <Copy className="w-4 h-4" />
                            </motion.span>
                          )}
                        </AnimatePresence>

                        <span className="text-xs opacity-80">{copied ? "Copied" : "Copy"}</span>
                      </motion.button>

                      <Button size="sm" variant="ghost" onClick={handleDownloadJSON} className="cursor-pointer">
                        <Download />
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showRawInline ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="text-xs font-mono max-h-[200px] overflow-auto mt-2">
                          <pre>{rawResponse ? prettyJSON(rawResponse) : "No data"}</pre>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              {/* quick actions */}
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleCopyJSON} className="cursor-pointer"><Copy /> Copy JSON</Button>
                <Button variant="outline" onClick={handleDownloadJSON} className="cursor-pointer"><Download /> Download JSON</Button>
                <Button variant="ghost" onClick={() => window.open(`${BASE}/price/${selected}`, "_blank")} className="cursor-pointer"><DollarSign /> Open API</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* right sidebar / quick actions */}
        <aside className={clsx("lg:col-span-3 space-y-4 p-4 rounded-2xl border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold">Quick Actions</div>
            <div className="text-xs opacity-60">Useful shortcuts</div>

            <div className="mt-3 flex flex-col gap-2">
              <Button variant="outline" onClick={() => setSelected("XAU")} className="cursor-pointer"><DollarSign /> Default: XAU</Button>
              <Button variant="outline" onClick={() => fetchSymbols()} className="cursor-pointer"><List /> Reload Symbols</Button>
              <Button variant="ghost" onClick={() => navigator.clipboard.writeText(selected)} className="cursor-pointer"><Copy /> Copy Symbol</Button>
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

      {/* Dialog for raw JSON (bigger) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> {selectedMeta?.name || selected}</DialogTitle>
          </DialogHeader>

          <div className="p-5 text-xs font-mono max-h-[60vh] overflow-auto">
            <pre>{rawResponse ? prettyJSON(rawResponse) : "No data"}</pre>
          </div>

          <DialogFooter className="p-4 border-t">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
