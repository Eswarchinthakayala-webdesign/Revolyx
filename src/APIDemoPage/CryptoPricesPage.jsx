// src/pages/CryptoPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  ImageIcon,
  RefreshCw,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/*
  CryptoPage.jsx
  - Default coin ids: "onecoin" (requested). CoinGecko IDs are used; if the id doesn't exist,
    suggestions will help find a valid coin id.
  - Endpoints used:
    - Search:  https://api.coingecko.com/api/v3/search?query=...
    - Simple price: https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true
    - Coin details: https://api.coingecko.com/api/v3/coins/{id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false
*/

const SIMPLE_PRICE_ENDPOINT = "https://api.coingecko.com/api/v3/simple/price";
const SEARCH_ENDPOINT = "https://api.coingecko.com/api/v3/search";
const COIN_DETAILS_ENDPOINT = "https://api.coingecko.com/api/v3/coins";

const DEFAULT_QUERY = "onecoin"; // user requested default name

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

export default function CryptoPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Search & suggestion state
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // Data state
  const [priceData, setPriceData] = useState(null); // raw simple/price response
  const [coinDetails, setCoinDetails] = useState(null); // coin details response
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // UI / tools
  const [showRaw, setShowRaw] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const suggestTimer = useRef(null);

  /* ---------- fetch helpers ---------- */

  // Search suggestions using CoinGecko search endpoint
  async function fetchSuggestions(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const url = `${SEARCH_ENDPOINT}?query=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const json = await res.json();
      // json.coins is an array of {id, name, api_symbol, symbol, market_cap_rank, thumb, large}
      setSuggestions(json.coins || []);
    } catch (err) {
      console.error("Search error", err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  // Fetch simple price for a comma-separated list of ids (we'll use a single id mostly)
  async function fetchPrice(idsCsv) {
    if (!idsCsv) return;
    setLoadingPrice(true);
    try {
      const params = new URLSearchParams();
      params.set("ids", idsCsv);
      params.set("vs_currencies", "usd");
      params.set("include_24hr_change", "true");
      params.set("include_market_cap", "true");

      const url = `${SIMPLE_PRICE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Price fetch failed (${res.status})`);
        setPriceData(null);
        setLoadingPrice(false);
        return;
      }
      const json = await res.json();
      setPriceData(json);
    } catch (err) {
      console.error("Price fetch error", err);
      setPriceData(null);
      showToast("error", "Failed to fetch prices");
    } finally {
      setLoadingPrice(false);
    }
  }

  // Fetch full coin details (image, market data, description)
  async function fetchCoinDetails(id) {
    if (!id) return;
    setLoadingDetails(true);
    try {
      const qs = "localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false";
      const url = `${COIN_DETAILS_ENDPOINT}/${encodeURIComponent(id)}?${qs}`;
      const res = await fetch(url);
      if (!res.ok) {
        setCoinDetails(null);
        setLoadingDetails(false);
        return;
      }
      const json = await res.json();
      setCoinDetails(json);
    } catch (err) {
      console.error("Coin details error", err);
      setCoinDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }

  // Combined helper: pick id -> fetch price + details
  async function loadForId(id) {
    if (!id) {
      showToast("info", "Please enter a coin id");
      return;
    }
    // fetch price and details in parallel
    await Promise.all([fetchPrice(id), fetchCoinDetails(id)]);
    setShowSuggest(false);
  }

  /* ---------- UI helpers ---------- */

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => fetchSuggestions(v), 300);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    // prefer the entered text as an id; if it looks like a multi id (comma separated), allow it
    const q = (query || "").trim();
    if (!q) {
      showToast("info", "Enter a coin id or search to pick one from suggestions.");
      return;
    }
    // If user typed a friendly name (not id), try to fetch suggestions and pick top hit
    setShowSuggest(false);
    // If query contains comma, assume it's a csv of ids
    if (q.includes(",")) {
      const idsCsv = q.split(",").map(s => s.trim()).filter(Boolean).join(",");
      await loadForId(idsCsv);
      return;
    }
    // If the query looks like a valid id (no spaces), try load directly, else try search and choose top result
    if (!q.includes(" ")) {
      await loadForId(q.toLowerCase());
      return;
    }
    // fallback: search and load top suggestion
    setLoadingSuggest(true);
    try {
      await fetchSuggestions(q);
      if (suggestions.length > 0) {
        await loadForId(suggestions[0].id);
      } else {
        showToast("info", "No suggestions found for that query.");
      }
    } finally {
      setLoadingSuggest(false);
    }
  }

  function copyJSON() {
    const payload = coinDetails || priceData || {};
    navigator.clipboard.writeText(prettyJSON(payload));
    showToast("success", "Copied JSON to clipboard");
  }

  function downloadJSON() {
    const payload = coinDetails || priceData || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    const name = (coinDetails?.id || query || "crypto").replace(/\s+/g, "_");
    a.href = URL.createObjectURL(blob);
    a.download = `crypto_${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  // load default on mount
  useEffect(() => {
    // default is DEFAULT_QUERY — try loading as id (may fail if id doesn't exist)
    // We'll also fetch suggestions for it so the user can pick a correct id.
    fetchSuggestions(DEFAULT_QUERY);
    // try load as id directly (CoinGecko likely has no "onecoin" id; this gracefully handles null)
    loadForId(DEFAULT_QUERY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Render ---------- */

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Aurora — Crypto Prices</h1>
          <p className="mt-1 text-sm opacity-70">Real-time prices (CoinGecko). Search coins, inspect market data and download results.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder='Search coin (name or id). Try "bitcoin", "ethereum", or "onecoin"'
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" onClick={() => { setQuery("bitcoin"); loadForId("bitcoin"); }}><RefreshCw /> BTC</Button>
            <Button type="submit" variant="outline"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestion dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s) => (
              <li key={s.id} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setQuery(s.id); loadForId(s.id); setShowSuggest(false); }}>
                <div className="flex items-center gap-3">
                  <img src={s.thumb} alt={s.name} className="w-10 h-10 object-cover rounded-md" />
                  <div className="flex-1">
                    <div className="font-medium">{s.name} <span className="text-xs opacity-60 ml-2">({s.symbol})</span></div>
                    <div className="text-xs opacity-60">Rank #{s.market_cap_rank ?? "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.id}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Main viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Prices & Market Data</CardTitle>
                <div className="text-xs opacity-60">{(coinDetails && coinDetails.name) || "No coin loaded"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { if (query) loadForId(query.trim()); }}><RefreshCw /></Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><Info /> {showRaw ? "Hide Raw" : "Show Raw"}</Button>
                <Button variant="outline" onClick={() => copyJSON()}><Copy /></Button>
                <Button variant="outline" onClick={() => downloadJSON()}><Download /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingPrice || loadingDetails ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : (!priceData && !coinDetails) ? (
                <div className="py-12 text-center text-sm opacity-60">No data loaded — search for a coin or pick one from suggestions.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: coin visual + quick stats */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center gap-4">
                      <img
                        src={coinDetails?.image?.large || coinDetails?.image?.thumb || (Object.values(priceData || {})[0]?.image || "")}
                        alt={coinDetails?.name || query}
                        className="w-20 h-20 object-contain rounded-md bg-white/5 p-2"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                      <div>
                        <div className="text-xl font-semibold">{coinDetails?.name || query}</div>
                        <div className="text-sm opacity-60">{coinDetails?.symbol?.toUpperCase() || ""} {coinDetails?.market_cap_rank ? `• #${coinDetails.market_cap_rank}` : ""}</div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      {/* Display price from priceData if available */}
                      {priceData && Object.keys(priceData).length > 0 && (
                        <>
                          {Object.entries(priceData).map(([id, info]) => (
                            <div key={id} className="p-2 rounded-md border">
                              <div className="text-xs opacity-60">Price (USD)</div>
                              <div className="text-lg font-semibold">${(info.usd ?? "—").toLocaleString?.() ?? (info.usd)}</div>

                              <div className="text-xs opacity-60 mt-1">24h change</div>
                              <div className={clsx("font-medium", (info.usd_24h_change > 0) ? "text-green-400" : (info.usd_24h_change < 0) ? "text-rose-400" : "")}>
                                {typeof info.usd_24h_change === "number" ? `${info.usd_24h_change.toFixed(2)}%` : "—"}
                              </div>

                              <div className="text-xs opacity-60 mt-1">Market cap</div>
                              <div className="text-sm">{info.usd_market_cap ? `$${Number(info.usd_market_cap).toLocaleString()}` : "—"}</div>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Fallback: show market data from coinDetails */}
                      {coinDetails && coinDetails.market_data && (
                        <>
                          <div className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">Current Price (USD)</div>
                            <div className="text-lg font-semibold">${(coinDetails.market_data.current_price?.usd ?? "—").toLocaleString?.() ?? (coinDetails.market_data.current_price?.usd)}</div>
                          </div>
                          <div className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">24h %</div>
                            <div className={clsx("font-medium", (coinDetails.market_data.price_change_percentage_24h > 0) ? "text-green-400" : (coinDetails.market_data.price_change_percentage_24h < 0) ? "text-rose-400" : "")}>
                              {typeof coinDetails.market_data.price_change_percentage_24h === "number" ? `${coinDetails.market_data.price_change_percentage_24h.toFixed(2)}%` : "—"}
                            </div>
                          </div>

                          <div className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">Market Cap</div>
                            <div className="text-sm">${Number(coinDetails.market_data.market_cap?.usd || 0).toLocaleString()}</div>
                          </div>

                          <div className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">24h Volume</div>
                            <div className="text-sm">${Number(coinDetails.market_data.total_volume?.usd || 0).toLocaleString()}</div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <Button variant="outline" onClick={() => setImageDialogOpen(true)}><ImageIcon /> View Image</Button>
                      <Button variant="ghost" onClick={() => { if (coinDetails?.links?.homepage?.[0]) window.open(coinDetails.links.homepage[0], "_blank"); else showToast("info", "No homepage available"); }}><ExternalLink /> Official</Button>
                    </div>
                  </div>

                  {/* Center & Right: description + raw fields */}
                  <div className="md:col-span-2 p-4 rounded-xl border" className={clsx("p-4 rounded-xl border md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Overview</div>
                    <div className="text-sm leading-relaxed mb-3">
                      {coinDetails?.description?.en ? (
                        <div dangerouslySetInnerHTML={{ __html: coinDetails.description.en.split("\n")[0] }} />
                      ) : (
                        <div className="opacity-60">No description available from CoinGecko.</div>
                      )}
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">All available fields</div>
                    <ScrollArea style={{ maxHeight: 280 }} className="rounded-md border p-2">
                      <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")}>
                        {prettyJSON(coinDetails || priceData || {})}
                      </pre>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Raw toggle (outside the animated area so the developer can quickly toggle) */}
            <AnimatePresence>
              {showRaw && (coinDetails || priceData) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className="text-xs overflow-auto" style={{ maxHeight: 240 }}>
                    {prettyJSON({ priceData, coinDetails })}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right column: developer tools */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Developer</div>
              <div className="text-xs opacity-60">Endpoints</div>
            </div>

            <div className="grid gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${SIMPLE_PRICE_ENDPOINT}?ids=${encodeURIComponent(query)}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`); showToast("success", "Endpoint copied"); }}><Copy /> Copy Price Endpoint</Button>

              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${COIN_DETAILS_ENDPOINT}/${encodeURIComponent(query)}?localization=false&tickers=false&market_data=true`); showToast("success", "Details endpoint copied"); }}><Copy /> Copy Details Endpoint</Button>

              <Button variant="ghost" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick tips</div>
            <ul className="text-sm opacity-70 space-y-2 list-disc list-inside">
              <li>Use coin <strong>IDs</strong> (e.g. <code>bitcoin</code>, <code>ethereum</code>); search helps convert names → ids.</li>
              <li>To fetch multiple coins: supply comma-separated ids (e.g. <code>bitcoin,ethereum</code>).</li>
              <li>This page uses public CoinGecko endpoints with no API key required.</li>
            </ul>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{(coinDetails && coinDetails.name) || query}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {coinDetails?.image?.large ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coinDetails.image.large} alt={coinDetails.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image available</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image provided by CoinGecko</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageDialogOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => { if (coinDetails?.links?.homepage?.[0]) window.open(coinDetails.links.homepage[0], "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
