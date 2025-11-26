// src/pages/CoinLorePage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  TrendingUp,
  Globe,
  ExternalLink,
  Copy,
  Download,
  Star,
  Loader2,
  ImageIcon,
  List,
  BarChart,
  ChevronRight,
  Menu,
  Check,
  Code,
  FileText,
  ChevronDown,
  Link as LinkIcon,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  Circle,
  Layers,
  Database,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------- API endpoints ---------- */
const API_ROOT = "https://api.coinlore.net/api";
const ENDPOINTS = {
  TOP: (start = 0, limit = 100) => `${API_ROOT}/tickers/?start=${start}&limit=${limit}`,
  GLOBAL: `${API_ROOT}/global/`,
  TICKER_BY_ID: (id) => `${API_ROOT}/ticker/?id=${id}`,
  COIN_MARKETS: (id) => `${API_ROOT}/coin/markets/?id=${id}`,
  EXCHANGES: `${API_ROOT}/exchanges/`,
};

/* --------- Config --------- */
const PAGE_LIMIT = 100;
const TOTAL_COINS = 14949; // per your note; used for pagination UI
const MAX_PAGES = Math.ceil(TOTAL_COINS / PAGE_LIMIT);

/* ---------- Helpers ---------- */
const prettyJSON = (obj) => JSON.stringify(obj, null, 2);

export default function CoinLorePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  /* ---------- State ---------- */
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [coinsCache, setCoinsCache] = useState([]); // collected pages appended
  const [globalStats, setGlobalStats] = useState(null);

  const [selectedCoin, setSelectedCoin] = useState(null);
  const [rawResp, setRawResp] = useState(null);

  const [loadingMain, setLoadingMain] = useState(false);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [markets, setMarkets] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  // UI states
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [showRawToggle, setShowRawToggle] = useState(false);
  const [startOffset, setStartOffset] = useState(0); // pagination offset
  const [loadingPage, setLoadingPage] = useState(false);

  const suggestTimer = useRef(null);
  const resetTimers = useRef([]);

  useEffect(() => {
    // cleanup timers on unmount
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      resetTimers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  /* ---------- Initial fetch ---------- */
  useEffect(() => {
    fetchTickersPage(0); // load first 100
    fetchGlobal();
  }, []);

  /* ---------- Fetchers ---------- */
  async function fetchTickersPage(start = 0) {
    setLoadingPage(true);
    try {
      const res = await fetch(ENDPOINTS.TOP(start, PAGE_LIMIT));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = json?.data || json?.coins || [];
      // append unique new coins
      setCoinsCache((prev) => {
        const map = new Map(prev.map((c) => [String(c.id), c]));
        list.forEach((c) => map.set(String(c.id), c));
        return Array.from(map.values()).sort((a, b) => Number(a.rank) - Number(b.rank));
      });
      setStartOffset(start);
      showToast("success", `Loaded coins ${start + 1} — ${start + list.length}`);
      // if no selection yet, pick first
      if (!selectedCoin && list.length > 0) {
        setSelectedCoin(list[0]);
        setRawResp(list[0]);
        // auto load markets when selecting
        fetchMarketsFor(list[0].id);
      }
    } catch (err) {
      console.error("fetchTickersPage", err);
      showToast("error", "Failed to load tickers page");
    } finally {
      setLoadingPage(false);
    }
  }

  async function fetchGlobal() {
    try {
      const res = await fetch(ENDPOINTS.GLOBAL);
      if (!res.ok) return;
      const json = await res.json();
      const g = Array.isArray(json) ? json[0] : json;
      setGlobalStats(g);
    } catch (err) {
      console.error("fetchGlobal", err);
    }
  }

  async function fetchCoinById(id) {
    if (!id) return;
    setLoadingMain(true);
    try {
      const res = await fetch(ENDPOINTS.TICKER_BY_ID(id));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const coin = Array.isArray(json) ? json[0] : json;
      setSelectedCoin(coin);
      setRawResp(coin);
      setShowRawToggle(false); // hide raw by default for new selection
      showToast("success", `Loaded ${coin.name} (${coin.symbol})`);
      // auto load markets for selected coin
      fetchMarketsFor(coin.id);
    } catch (err) {
      console.error("fetchCoinById", err);
      showToast("error", "Failed to fetch coin details");
    } finally {
      setLoadingMain(false);
    }
  }

  async function fetchMarketsFor(id) {
    if (!id) return;
    setLoadingMarkets(true);
    try {
      const res = await fetch(ENDPOINTS.COIN_MARKETS(id));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setMarkets(json || []);
    } catch (err) {
      console.error("fetchMarketsFor", err);
      showToast("error", "Failed to load markets for coin");
    } finally {
      setLoadingMarkets(false);
    }
  }

  /* ---------- Search / suggestions ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      runSuggestSearch(v);
    }, 250);
  }

  async function runSuggestSearch(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      setLoadingSuggest(false);
      return;
    }
    setLoadingSuggest(true);

    // First search local cache
    const lc = coinsCache.filter((c) => {
      const s = `${c.name} ${c.symbol}`.toLowerCase();
      return s.includes(q.toLowerCase());
    });

    if (lc.length > 0) {
      setSuggestions(lc.slice(0, 12));
      setLoadingSuggest(false);
      return;
    }

    // As fallback, fetch first page and filter
    try {
      const res = await fetch(ENDPOINTS.TOP(0, PAGE_LIMIT));
      const json = await res.json();
      const list = json?.data || [];
      const matches = list
        .filter((c) => (`${c.name} ${c.symbol}`).toLowerCase().includes(q.toLowerCase()))
        .slice(0, 12);
      setSuggestions(matches);
    } catch (err) {
      console.error("runSuggestSearch", err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Try a coin name or symbol, e.g. 'bitcoin' or 'btc'");
      return;
    }

    const exact = coinsCache.find(
      (c) =>
        c.symbol?.toLowerCase() === query.trim().toLowerCase() ||
        c.name?.toLowerCase() === query.trim().toLowerCase()
    );
    if (exact) {
      fetchCoinById(exact.id);
      setShowSuggest(false);
      return;
    }

    setLoadingSuggest(true);
    try {
      const res = await fetch(ENDPOINTS.TOP(0, PAGE_LIMIT));
      const json = await res.json();
      const list = json?.data || [];
      const match = list.find(
        (c) =>
          c.symbol?.toLowerCase() === query.trim().toLowerCase() ||
          c.name?.toLowerCase() === query.trim().toLowerCase()
      );
      if (match) {
        fetchCoinById(match.id);
        setShowSuggest(false);
      } else {
        showToast("info", "No exact match in top results — try partial name or symbol");
      }
    } catch (err) {
      showToast("error", "Search failed");
    } finally {
      setLoadingSuggest(false);
    }
  }

  /* ---------- Utilities: copy + download (animated) ---------- */
  function copyEndpoint() {
    const url = ENDPOINTS.TOP(startOffset, PAGE_LIMIT);
    navigator.clipboard.writeText(url);
    setCopiedEndpoint(true);
    showToast("success", "Endpoint copied");
    const t = setTimeout(() => setCopiedEndpoint(false), 1700);
    resetTimers.current.push(t);
  }

  function copyRawJSON() {
    const payload = rawResp || selectedCoin || {};
    const text = prettyJSON(payload);
    navigator.clipboard.writeText(text);
    setCopiedJSON(true);
    showToast("success", "JSON copied");
    const t = setTimeout(() => setCopiedJSON(false), 1700);
    resetTimers.current.push(t);
  }

  function downloadRaw() {
    const payload = rawResp || selectedCoin || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `coin_${(selectedCoin?.symbol || "coin")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded coin JSON");
  }

  function openExternal() {
    if (!selectedCoin || !selectedCoin.name) return showToast("info", "No coin selected");
    const url = `https://www.coinlore.com/coin/${selectedCoin.id}`;
    window.open(url, "_blank");
  }

  /* ---------- Helpers for derived rates (example: convert to BTC/ETH if present) ---------- */
  function getConversionRates() {
    const usd = Number(selectedCoin?.price_usd || 0);
    if (!usd || coinsCache.length === 0) return null;
    const findBySymbol = (sym) => coinsCache.find((c) => String(c.symbol).toLowerCase() === String(sym).toLowerCase());
    const btc = findBySymbol("BTC") || findBySymbol("XBT");
    const eth = findBySymbol("ETH");
    const rates = {};
    if (btc && Number(btc.price_usd)) rates["BTC"] = usd / Number(btc.price_usd);
    if (eth && Number(eth.price_usd)) rates["ETH"] = usd / Number(eth.price_usd);
    return rates;
  }

  /* ---------- Small helpers for styling ---------- */
  const panelBg = isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200";
  const panelCard = clsx("rounded-2xl overflow-hidden border shadow-sm", panelBg);

  /* ---------- Render ---------- */
  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 overflow-hidden max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-3 mb-4">
        {/* Left: Mobile sheet + title */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="p-2 md:hidden rounded-lg cursor-pointer" variant="ghost" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 ">
              <div className={clsx("h-full p-4 overflow-y-auto no-scrollbar", panelBg)}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-lg font-semibold">CoinLens</div>
                    <div className="text-xs opacity-60">CoinLore Explorer</div>
                  </div>
                  <div className="text-sm opacity-60">v1</div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-4">
                  <Card className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="opacity-80" />
                        <div className="text-sm font-semibold">Top Coins</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { fetchTickersPage(0); }} className="cursor-pointer">
                          <RefreshCw className="mr-2" /> Refresh
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { const next = Math.min(startOffset + PAGE_LIMIT, (MAX_PAGES - 1) * PAGE_LIMIT); fetchTickersPage(next); }} className="cursor-pointer">
                          Load +100
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="overflow-y-auto" style={{ maxHeight: 380 }}>
                      <div className="divide-y">
                        {coinsCache.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { fetchCoinById(c.id); setShowSuggest(false); }}
                            className="w-full text-left px-2 py-3 flex items-center  justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                          >
                            <div>
                              <div className="font-medium">{c.name} <span className="text-xs opacity-60">({c.symbol})</span></div>
                              <div className="text-xs opacity-60">Rank #{c.rank}</div>
                            </div>
                            <div className={clsx("text-sm font-medium", Number(c.percent_change_24h) >= 0 ? "text-green-400" : "text-rose-400")}>{c.percent_change_24h ?? "—"}%</div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </Card>

                  <Card className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Globe className="opacity-80" />
                        <div className="text-sm font-semibold">Market Snapshot</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => fetchGlobal()} className="cursor-pointer">Refresh</Button>
                    </div>

                    {globalStats ? (
                      <div className="space-y-2 text-sm">
                        <div><div className="text-xs opacity-60">Coins tracked</div><div className="font-medium">{globalStats.coins_count?.toLocaleString() ?? "—"}</div></div>
                        <div><div className="text-xs opacity-60">Active markets</div><div className="font-medium">{globalStats.active_markets?.toLocaleString() ?? "—"}</div></div>
                        <div><div className="text-xs opacity-60">Total market cap</div><div className="font-medium">${Number(globalStats.total_mcap || 0).toLocaleString()}</div></div>
                      </div>
                    ) : (
                      <div className="text-sm opacity-60">Loading…</div>
                    )}
                  </Card>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="block">
            <h1 className="text-2xl md:text-3xl font-extrabold">CoinLens — CoinLore Explorer</h1>
            <p className="text-xs opacity-60">Live crypto market data from CoinLore · No API key required</p>
          </div>
        </div>

        {/* Search: center (desktop) */}
        <div className="flex-1 mx-3">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full rounded-lg px-3 py-2 transition-shadow", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search coins, e.g. 'bitcoin' or 'btc'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { fetchTickersPage(0); setShowSuggest(false); }}>
              <Loader2 className={loadingPage ? "animate-spin" : ""} />
              <span className="ml-2">Refresh</span>
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestion dropdown (floating) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((c, idx) => (
              <li
                key={c.id ?? idx}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                onClick={() => {
                  fetchCoinById(c.id);
                  setShowSuggest(false);
                  setQuery("");
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{c.name} <span className="text-xs opacity-60">({c.symbol})</span></div>
                    <div className="text-xs opacity-60">Rank #{c.rank ?? "—"} · ${Number(c.price_usd).toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                  </div>
                  <div className={clsx("text-sm font-medium", Number(c.percent_change_24h) >= 0 ? "text-green-400" : "text-rose-400")}>
                    {c.percent_change_24h ?? "—"}%
                  </div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout: left + center + right */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left: suggestions / quick list (desktop) */}
        <aside className="hidden lg:block lg:col-span-3">
          <Card className={panelCard + " p-4"}>
            <CardHeader className="p-0 mb-3 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp />
                  <CardTitle className="text-sm">Top coins</CardTitle>
                </div>
                <div className="text-xs opacity-60">Quick list · click to load details</div>
              </div>
              <div className="text-xs opacity-60">{coinsCache.length ? `${coinsCache.length} loaded` : ""}</div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea style={{ maxHeight: 420 }} className="rounded-md overflow-y-auto">
                <div className="divide-y">
                  {coinsCache.length === 0 ? (
                    <div className="p-4 text-sm opacity-60 text-center">Loading top coins…</div>
                  ) : (
                    coinsCache.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => fetchCoinById(c.id)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{c.name} <span className="text-xs opacity-60">({c.symbol})</span></div>
                          <div className="text-xs opacity-60">Rank #{c.rank}</div>
                        </div>
                        <div className={clsx("text-sm font-medium ml-3", Number(c.percent_change_24h) >= 0 ? "text-green-400" : "text-rose-400")}>
                          {c.percent_change_24h ?? "—"}%
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => { copyEndpoint(); }}>
                <div className="flex items-center gap-2">
                  <Copy /> <span className="text-sm">Copy TOP endpoint</span>
                </div>
                <motion.span
                  animate={{ opacity: copiedEndpoint ? 1 : 0, scale: copiedEndpoint ? 1 : 0.6, rotate: copiedEndpoint ? 10 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="ml-2"
                >
                  {copiedEndpoint ? <Check /> : null}
                </motion.span>
              </Button>

              <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => { fetchTickersPage(Math.min(startOffset + PAGE_LIMIT, (MAX_PAGES - 1) * PAGE_LIMIT)); }}>
                <ArrowDownCircle /> Load +100
              </Button>
            </div>
          </Card>

          {/* Quick stats card */}
          <Card className={panelCard + " p-4"}>
            <CardHeader className="p-0 mb-2">
              <div className="flex items-center gap-2">
                <Globe />
                <CardTitle className="text-sm">Market Snapshot</CardTitle>
              </div>
              <div className="text-xs opacity-60">CoinLore global stats</div>
            </CardHeader>
            <CardContent className="p-0">
              {globalStats ? (
                <div className="space-y-3 mt-2 text-sm">
                  <div>
                    <div className="text-xs opacity-60">Coins tracked</div>
                    <div className="font-medium">{globalStats.coins_count?.toLocaleString() ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-60">Active markets</div>
                    <div className="font-medium">{globalStats.active_markets?.toLocaleString() ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-60">Total market cap</div>
                    <div className="font-medium">${Number(globalStats.total_mcap || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-60">24h volume</div>
                    <div className="font-medium">${Number(globalStats.total_volume || 0).toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-sm opacity-60">Loading global data…</div>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Center: main coin viewer */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={panelCard}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-center gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <Layers className="opacity-80" />
                    <span>
                      {selectedCoin?.name ? `${selectedCoin.name} (${selectedCoin.symbol})` : "Select a coin"}
                    </span>
                  </CardTitle>
                  <div className="text-xs opacity-60 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <List className="opacity-70" />
                      <span>{selectedCoin ? `Rank #${selectedCoin.rank}` : "Click a coin to view details"}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <BarChart className="opacity-70" />
                      <span className="text-xs">{selectedCoin ? `${selectedCoin.price_usd ? `$${Number(selectedCoin.price_usd).toLocaleString(undefined, { maximumFractionDigits: 6 })}` : ""}` : ""}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="cursor-pointer" onClick={() => { if (selectedCoin) fetchMarketsFor(selectedCoin.id); else showToast("info", "Select a coin first"); }}>
                  <BarChart /> Markets
                </Button>
                <Button variant="ghost" className="cursor-pointer" onClick={() => setDialogOpen(true)}><ImageIcon />Name</Button>
                <Button variant="ghost" className="cursor-pointer" onClick={() => downloadRaw()}><Download /> JSON</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingMain ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selectedCoin ? (
                <div className="py-12 text-center text-sm opacity-60">No coin selected — choose one from the left or search above.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left column: main metrics */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="text-2xl font-semibold">${Number(selectedCoin.price_usd).toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                        <div className="text-sm opacity-60">Price (USD)</div>
                      </div>
                      <div className={clsx("text-lg font-semibold", Number(selectedCoin.percent_change_24h) >= 0 ? "text-green-400" : "text-rose-400")}>
                        {selectedCoin.percent_change_24h ?? "—"}%
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Market Cap</div>
                        <div className="font-medium">${Number(selectedCoin.market_cap_usd || selectedCoin.market_cap).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">24h Volume</div>
                        <div className="font-medium">${Number(selectedCoin.volume24).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Circulating Supply</div>
                        <div className="font-medium">{Number(selectedCoin.csupply || selectedCoin.available_supply || 0).toLocaleString()} {selectedCoin.symbol}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Total Supply</div>
                        <div className="font-medium">{Number(selectedCoin.tsupply || 0).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Conversion rates (BTC/ETH) */}
                    <div className="mt-4">
                      <div className="text-xs opacity-60">Conversion (approx)</div>
                      <div className="flex gap-3 mt-2">
                        {(() => {
                          const rates = getConversionRates();
                          if (!rates) return <div className="text-sm opacity-60">BTC / ETH data not loaded in cache</div>;
                          return Object.entries(rates).map(([k, v]) => (
                            <div key={k} className="p-2 rounded-md border text-sm cursor-default">
                              <div className="font-medium">{k}</div>
                              <div className="text-xs opacity-60">{Number(v).toPrecision(6)}</div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" onClick={() => openExternal()} className="cursor-pointer"><ExternalLink /> Open on CoinLore</Button>

                      <Button variant="ghost" onClick={() => { copyRawJSON(); }} className="cursor-pointer flex items-center">
                        <motion.span
                          initial={{ scale: 1 }}
                          animate={{ scale: copiedJSON ? 1.06 : 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 18 }}
                          className="flex items-center"
                        >
                          {copiedJSON ? <Check /> : <Copy />}
                        </motion.span>
                        <span className="ml-2 text-sm">Copy JSON</span>
                      </Button>
                    </div>
                  </div>

                  {/* Right column: extra fields */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Code />
                        <div className="text-sm font-semibold">Details</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowRawToggle((s) => !s)} className="cursor-pointer">
                          <FileText />
                          <span className="ml-2 text-sm">{showRawToggle ? "Hide Raw" : "Show Raw"}</span>
                          <ChevronDown className={clsx("ml-1 transition-transform", showRawToggle ? "rotate-180" : "")} />
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm leading-relaxed mb-3">
                      <div><span className="text-xs opacity-60">ID</span> <div className="font-medium">{selectedCoin.id}</div></div>
                      <div className="mt-2"><span className="text-xs opacity-60">Symbol</span> <div className="font-medium">{selectedCoin.symbol}</div></div>
                      <div className="mt-2"><span className="text-xs opacity-60">Website</span>
                        <div className="font-medium">
                          {selectedCoin.website_slug ? (
                            <a href={`https://www.coinlore.com/coin/${selectedCoin.id}`} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-2 cursor-pointer">
                              <LinkIcon /> Coin page
                            </a>
                          ) : "—"}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <FileText />
                      Raw fields
                    </div>

                    <ScrollArea style={{ maxHeight: showRawToggle ? 280 : 0 }} className={clsx("rounded-md overflow-y-auto no-scrollbar transition-all", showRawToggle ? "opacity-100" : "opacity-0")}>
                      <div className="p-2">
                        <pre className={clsx("text-xs overflow-auto p-2 rounded", isDark ? "text-zinc-200 bg-black/40" : "text-zinc-900 bg-white/70")}>
                          {showRawToggle ? prettyJSON(rawResp || selectedCoin) : ""}
                        </pre>
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Markets list (if loaded) */}
          <Card className={panelCard}>
            <CardHeader className="p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart />
                  <CardTitle className="text-lg">Markets</CardTitle>
                </div>
                <div className="text-xs opacity-60">Trading pairs / exchanges for the selected coin (auto-loaded)</div>
              </div>
              <div className="text-xs opacity-60">{selectedCoin ? `for ${selectedCoin.symbol}` : ""}</div>
            </CardHeader>

            <CardContent>
              {loadingMarkets ? (
                <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !markets ? (
                <div className="py-6 text-sm opacity-60">Markets will auto-load when a coin is selected — or click "Markets" above</div>
              ) : markets.length === 0 ? (
                <div className="py-6 text-sm opacity-60">No market data available</div>
              ) : (
                <div className="space-y-2">
                  {markets.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-md border">
                      <div>
                        <div className="font-medium">{m.name || `${m.exchange || "—"}`}</div>
                        <div className="text-xs opacity-60">{m.pair || `${selectedCoin?.symbol}/USD`}</div>
                      </div>
                      <div className="text-sm text-right">
                        <div className="font-medium text-yellow-400">${Number(m.price || m.price_usd || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                        <div className="text-xs opacity-60">{m.volume || "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions (desktop) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className={panelCard + " p-4"}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold flex items-center gap-2"><Star /> Developer Tools</div>
                <div className="text-xs opacity-60">Useful endpoints & actions</div>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="grid gap-2">
              <Button variant="outline" onClick={() => copyEndpoint()} className="cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-2"><Copy /> Copy top tickers endpoint</div>
                <motion.span animate={{ opacity: copiedEndpoint ? 1 : 0, scale: copiedEndpoint ? 1 : 0.7 }} transition={{ duration: 0.14 }}>
                  {copiedEndpoint ? <Check /> : null}
                </motion.span>
              </Button>

              <Button variant="outline" onClick={() => downloadRaw()} className="cursor-pointer"><Download /> Download selected JSON</Button>

              <Button variant="outline" onClick={() => { if (selectedCoin) fetchMarketsFor(selectedCoin.id); else showToast("info", "Select a coin first"); }} className="cursor-pointer"><BarChart /> Load Markets</Button>

              <Button variant="outline" onClick={() => { if (selectedCoin) window.open(`https://www.coinlore.com/coin/${selectedCoin.id}`, "_blank"); else showToast("info", "Select a coin first"); }} className="cursor-pointer"><ExternalLink /> Open coin page</Button>
            </div>
          </Card>

          <Card className={panelCard + " p-4"}>
            <div className="text-sm font-semibold">About</div>
            <div className="text-xs opacity-60 mt-2">Data provided by CoinLore · Public API · No API key required.</div>

            <Separator className="my-3" />

            <div className="text-xs opacity-60">Endpoints</div>
            <div className="mt-2 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="truncate">{ENDPOINTS.TOP(0, PAGE_LIMIT)}</div>
                <button className="ml-2 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => navigator.clipboard.writeText(ENDPOINTS.TOP(0, PAGE_LIMIT))}><Copy size={16} /></button>
              </div>
              <div className="flex items-center justify-between">
                <div className="truncate">{ENDPOINTS.GLOBAL}</div>
                <button className="ml-2 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => navigator.clipboard.writeText(ENDPOINTS.GLOBAL)}><Copy size={16} /></button>
              </div>
            </div>
          </Card>
        </aside>
      </main>

      {/* Image Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selectedCoin?.name || "Coin Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {selectedCoin && selectedCoin.name ? (
              <div className="text-center p-8">
                <div className="text-4xl font-bold">{selectedCoin.symbol}</div>
                <div className="mt-2 text-sm opacity-60">{selectedCoin.name}</div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Coin data from CoinLore</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><ChevronRight /></Button>
              <Button variant="outline" onClick={() => openExternal()} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
