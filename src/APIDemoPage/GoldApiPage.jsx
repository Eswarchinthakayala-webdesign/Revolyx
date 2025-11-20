// src/pages/GoldApiPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  ImageIcon,
  List,
  Star,
  X,
  DollarSign,
  Clock,
  ArrowDown,
  ArrowUp,
  BarChart2,
  Globe
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip } from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------- Endpoint & defaults ---------- */
const API_BASE = "https://www.goldapi.io/api";
const DEFAULT_PAIR = { metal: "XAU", currency: "INR" };

/* Replace this with your API key or move to env handling */
const DEFAULT_API_KEY = "goldapi-119w5smi7dmpry-io";

/* ---------- Suggestion list (curated, searchable) ---------- */
const SUGGESTED_PAIRS = [
  { metal: "XAU", currency: "USD", label: "Gold — XAU/USD" },
  { metal: "XAU", currency: "INR", label: "Gold — XAU/INR" },
  { metal: "XAG", currency: "USD", label: "Silver — XAG/USD" },
  { metal: "XAG", currency: "INR", label: "Silver — XAG/INR" },
  { metal: "XPT", currency: "USD", label: "Platinum — XPT/USD" },
  { metal: "XPD", currency: "USD", label: "Palladium — XPD/USD" }
];

/* ---------- Helpers ---------- */
function toPairString(metal, currency) {
  if (!metal) return "";
  return `${metal.toUpperCase()}/${(currency || "").toUpperCase()}`;
}

function parsePairInput(input) {
  if (!input) return null;
  const normalized = input.trim().toUpperCase();
  if (normalized.includes("/")) {
    const [metal, currency] = normalized.split("/").map(s => s.trim()).filter(Boolean);
    if (metal && currency) return { metal, currency };
  }
  // allow single-term like "XAU" -> XAU/USD default
  if (/^[A-Z]{2,4}$/.test(normalized)) {
    return { metal: normalized, currency: "USD" };
  }
  return null;
}

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function humanDate(ts) {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    return d.toLocaleString();
  } catch {
    return String(ts);
  }
}

/* ---------- Component ---------- */
export default function GoldApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [query, setQuery] = useState(toPairString(DEFAULT_PAIR.metal, DEFAULT_PAIR.currency));
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState(SUGGESTED_PAIRS);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentPair, setCurrentPair] = useState(DEFAULT_PAIR);
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const suggestRef = useRef(null);
  const fetchAbortRef = useRef(null);

  useEffect(() => {
    // initial fetch for default pair
    fetchPrice(DEFAULT_PAIR.metal, DEFAULT_PAIR.currency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Suggestions: filter local list as user types ---------- */
  useEffect(() => {
    if (!query) {
      setSuggestions(SUGGESTED_PAIRS);
      return;
    }
    setLoadingSuggest(true);
    const q = query.trim().toLowerCase();
    // filter suggestions by label or pair
    const filt = SUGGESTED_PAIRS.filter(s =>
      s.label.toLowerCase().includes(q) ||
      toPairString(s.metal, s.currency).toLowerCase().includes(q)
    );
    // also include parsed input as suggestion if looks like pair
    const parsed = parsePairInput(query);
    const extra = parsed ? [{ metal: parsed.metal, currency: parsed.currency, label: `${parsed.metal}/${parsed.currency} (custom)` }] : [];
    setTimeout(() => {
      setSuggestions([...extra, ...filt]);
      setLoadingSuggest(false);
    }, 120); // small debounce feel
  }, [query]);

  /* ---------- Fetch helper ---------- */
  async function fetchPrice(metal, currency) {
    if (!metal || !currency) {
      showToast("info", "Please specify metal and currency (e.g. XAU/INR).");
      return;
    }

    if (!apiKey || apiKey === "YOUR_API_KEY") {
      showToast("warning", "Replace 'YOUR_API_KEY' with your GoldAPI key.");
      // still let it try — endpoint will return 401
    }

    // cancel previous
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setLoading(true);
    setCurrentPair({ metal, currency });
    setShowSuggest(false);

    try {
      const url = `${API_BASE}/${encodeURIComponent(metal)}/${encodeURIComponent(currency)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "x-access-token": apiKey,
          "Content-Type": "application/json"
        },
        signal: controller.signal
      });

      if (!res.ok) {
        const txt = await res.text();
        showToast("error", `API Error: ${res.status} — ${txt.substring(0, 200)}`);
        setRawResp({ error: txt, status: res.status });
        setLoading(false);
        return;
      }
      const json = await res.json();
      setRawResp(json);
      showToast("success", `Loaded ${metal}/${currency} — ${json.price ?? "no price"}`);
    } catch (err) {
      if (err?.name === "AbortError") {
        // ignore
      } else {
        console.error(err);
        showToast("error", "Network error fetching price");
        setRawResp({ error: String(err) });
      }
    } finally {
      setLoading(false);
      fetchAbortRef.current = null;
    }
  }

  function handleSelectSuggestion(s) {
    if (!s) return;
    setQuery(toPairString(s.metal, s.currency));
    fetchPrice(s.metal, s.currency);
  }

  function handleSubmit(e) {
    e?.preventDefault?.();
    const parsed = parsePairInput(query);
    if (!parsed) {
      showToast("info", "Please enter a pair like XAU/INR or choose from suggestions.");
      return;
    }
    fetchPrice(parsed.metal, parsed.currency);
  }

  function copyEndpoint() {
    const url = `${API_BASE}/${currentPair.metal}/${currentPair.currency}`;
    navigator.clipboard.writeText(url);
    showToast("success", "Endpoint copied");
  }

  function copyJSON() {
    if (!rawResp) return showToast("info", "No response to copy.");
    navigator.clipboard.writeText(prettyJSON(rawResp));
    showToast("success", "JSON copied to clipboard");
  }

  function downloadJSON() {
    if (!rawResp) return showToast("info", "No response to download.");
    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `goldapi_${currentPair.metal}_${currentPair.currency}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  const parsedFields = useMemo(() => {
    if (!rawResp || typeof rawResp !== "object") return null;
    // goldapi typical response includes fields like: price, bid, ask, timestamp, unit, metal, currency, ch (change)
    return {
      price: rawResp.price ?? rawResp.bid ?? rawResp.ask ?? null,
      unit: rawResp.unit ?? rawResp.currency ?? null,
      metal: rawResp.metal ?? currentPair.metal,
      currency: rawResp.currency ?? currentPair.currency,
      timestamp: rawResp.timestamp ?? rawResp.time ?? rawResp.updated ?? null,
      change: rawResp.ch ?? rawResp.change ?? null,
      raw: rawResp
    };
  }, [rawResp, currentPair]);

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>GoldAPI — Live Metals</h1>
          <p className="mt-1 text-sm opacity-70">Real-time precious metal prices — fetch via GoldAPI (x-access-token header).</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSubmit} className={clsx("relative flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search pair, e.g. XAU/INR or type 'gold'..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggest(true); }}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="ghost" className="px-3" onClick={() => { setQuery(toPairString(DEFAULT_PAIR.metal, DEFAULT_PAIR.currency)); fetchPrice(DEFAULT_PAIR.metal, DEFAULT_PAIR.currency); }}>
              Default
            </Button>
            <Button type="submit" variant="outline" className="px-3">
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
            </Button>
          </form>
        </div>
      </header>

      {/* Suggestions box */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
            ref={suggestRef}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Finding pairs…</li>}
            {suggestions.map((s, idx) => (
              <li
                key={`${s.metal}-${s.currency}-${idx}`}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                onClick={() => handleSelectSuggestion(s)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 flex items-center justify-center rounded-sm bg-zinc-50 dark:bg-zinc-900/40 text-sm font-semibold">{s.metal}/{s.currency}</div>
                  <div className="flex-1">
                    <div className="font-medium">{s.label}</div>
                    <div className="text-xs opacity-60">Tap to fetch live price</div>
                  </div>
                  <div className="text-xs opacity-60">{s.label.includes("custom") ? "custom" : "popular"}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: quick meta / thumbnail */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Selected Pair</div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 border" aria-hidden>
                <div className="text-sm font-bold">{currentPair.metal}/{currentPair.currency}</div>
                <div className="text-xs opacity-60">{parsedFields?.metal ?? "—"}</div>
              </div>
              <div className="flex-1">
                <div className="text-xs opacity-60">Last fetched</div>
                <div className="text-sm">{parsedFields?.timestamp ? humanDate(parsedFields.timestamp) : "—"}</div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Price Snapshot</div>
            <div className="text-3xl font-extrabold">
              {loading ? <Loader2 className="animate-spin" /> : (parsedFields?.price ?? "—")}
              <span className="text-base font-medium ml-2 opacity-70">{parsedFields?.currency ?? parsedFields?.unit ?? ""}</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded-md border">
                <div className="text-xs opacity-60">Unit</div>
                <div className="font-medium">{parsedFields?.unit ?? "—"}</div>
              </div>
              <div className="p-2 rounded-md border">
                <div className="text-xs opacity-60">Change</div>
                <div className="font-medium">{parsedFields?.change ?? "—"}</div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint & tools</div>
            <div className="mt-2 space-y-2">
              <Button variant="outline" onClick={copyEndpoint}><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={() => { window.open("https://www.goldapi.io", "_blank"); }}><Globe /> GoldAPI Docs</Button>
              <Button variant="outline" onClick={() => { setDialogOpen(true); }}><ImageIcon /> View Raw</Button>
            </div>
          </div>
        </aside>

        {/* Center: large detail */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Live Price Detail</CardTitle>
                <div className="text-xs opacity-60">{currentPair.metal}/{currentPair.currency}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fetchPrice(currentPair.metal, currentPair.currency)}><Loader2 className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide Raw" : "Show Raw"}</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !rawResp ? (
                <div className="py-12 text-center text-sm opacity-60">No data loaded — search a pair or pick a suggestion.</div>
              ) : (
                <div className="space-y-4">
                  {/* Main fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border">
                      <div className="text-xs opacity-60">Price</div>
                      <div className="text-2xl font-bold">{parsedFields?.price ?? "—"} <span className="text-sm font-medium opacity-70">{parsedFields?.currency ?? ""}</span></div>
                      <div className="mt-2 text-sm opacity-60">Fetched: {parsedFields?.timestamp ? humanDate(parsedFields.timestamp) : "—"}</div>

                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" onClick={copyJSON}><Copy /> Copy JSON</Button>
                        <Button variant="outline" onClick={downloadJSON}><Download /> Download</Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border">
                      <div className="text-xs opacity-60">Analytics</div>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">Change</div>
                          <div className="font-medium">{parsedFields?.change ?? "—"}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm">Unit</div>
                          <div className="font-medium">{parsedFields?.unit ?? "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-semibold mb-2">Full Response</div>
                    <div className={clsx("rounded-md border p-3 overflow-auto", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")} style={{ maxHeight: 420 }}>
                      <pre className={clsx("text-xs whitespace-pre-wrap")}>{prettyJSON(rawResp)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions + metadata */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Quick Actions</div>
            <div className="space-y-2">
              <Button variant="outline" onClick={copyEndpoint}><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={copyJSON}><Copy /> Copy JSON</Button>
              <Button variant="outline" onClick={downloadJSON}><Download /> Download JSON</Button>
              <Button variant="ghost" onClick={() => window.open("https://www.goldapi.io", "_blank")}><ExternalLink /> Open Docs</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Info</div>
            <div className="text-xs opacity-60">Endpoint</div>
            <div className="text-sm break-words">{API_BASE}/{currentPair.metal}/{currentPair.currency}</div>
          </div>
        </aside>
      </main>

      {/* Raw dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Raw Response — {currentPair.metal}/{currentPair.currency}</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "70vh" }} className="p-4 overflow-auto">
            {rawResp ? (
              <pre className="text-xs whitespace-pre-wrap">{prettyJSON(rawResp)}</pre>
            ) : (
              <div className="text-sm opacity-60">No raw response available.</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">From GoldAPI</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={downloadJSON}><Download /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
