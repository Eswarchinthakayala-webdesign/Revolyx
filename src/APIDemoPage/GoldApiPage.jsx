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
  Globe,
  Menu,
  Check,
  FileText,
  RefreshCw
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

// shadcn/ui Sheet (mobile sidebar)
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

/* ---------- Endpoint & defaults ---------- */
const API_BASE = "https://www.goldapi.io/api";
const DEFAULT_PAIR = { metal: "XAU", currency: "INR" };
const DEFAULT_API_KEY = "goldapi-119w5smi7dmpry-io";

/* ---------- Suggestion list ---------- */
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

export default function GoldApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

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

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // copy states for animated feedback
  const [copyEndpointState, setCopyEndpointState] = useState("idle"); // idle | copying | done
  const [copyJSONState, setCopyJSONState] = useState("idle");

  const suggestRef = useRef(null);
  const fetchAbortRef = useRef(null);

  useEffect(() => {
    fetchPrice(DEFAULT_PAIR.metal, DEFAULT_PAIR.currency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!query) {
      setSuggestions(SUGGESTED_PAIRS);
      return;
    }
    setLoadingSuggest(true);
    const q = query.trim().toLowerCase();
    const filt = SUGGESTED_PAIRS.filter(s =>
      s.label.toLowerCase().includes(q) || toPairString(s.metal, s.currency).toLowerCase().includes(q)
    );
    const parsed = parsePairInput(query);
    const extra = parsed ? [{ metal: parsed.metal, currency: parsed.currency, label: `${parsed.metal}/${parsed.currency} (custom)` }] : [];
    setTimeout(() => {
      setSuggestions([...extra, ...filt]);
      setLoadingSuggest(false);
    }, 120);
  }, [query]);

  async function fetchPrice(metal, currency) {
    if (!metal || !currency) {
      showToast("info", "Please specify metal and currency (e.g. XAU/INR).");
      return;
    }

    if (!apiKey || apiKey === "YOUR_API_KEY") {
      showToast("warning", "Replace 'YOUR_API_KEY' with your GoldAPI key.");
    }

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

  async function copyEndpoint() {
    const url = `${API_BASE}/${currentPair.metal}/${currentPair.currency}`;
    try {
      setCopyEndpointState("copying");
      await navigator.clipboard.writeText(url);
      setCopyEndpointState("done");
      showToast("success", "Endpoint copied");
      setTimeout(() => setCopyEndpointState("idle"), 1800);
    } catch (e) {
      setCopyEndpointState("idle");
      showToast("error", "Unable to copy");
    }
  }

  async function copyJSON() {
    if (!rawResp) return showToast("info", "No response to copy.");
    try {
      setCopyJSONState("copying");
      await navigator.clipboard.writeText(prettyJSON(rawResp));
      setCopyJSONState("done");
      showToast("success", "JSON copied to clipboard");
      setTimeout(() => setCopyJSONState("idle"), 1800);
    } catch (e) {
      setCopyJSONState("idle");
      showToast("error", "Unable to copy");
    }
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
    <div className={clsx("min-h-screen p-4 sm:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="sm:hidden">
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2 cursor-pointer">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star />
                    <div className="font-semibold">GoldAPI — Tools</div>
                  </div>
                  <Button variant="ghost" onClick={() => setMobileSheetOpen(false)}><X /></Button>
                </div>

                <ScrollArea style={{ height: 'calc(100vh - 120px)' }}>
                  <div className="space-y-4">
                    <div className="text-xs opacity-70">Selected</div>
                    <div className="p-3 rounded-md border">
                      <div className="font-medium">{currentPair.metal}/{currentPair.currency}</div>
                      <div className="text-xs opacity-60">{parsedFields?.timestamp ? humanDate(parsedFields.timestamp) : '—'}</div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Button className="w-full cursor-pointer" variant="outline" onClick={copyEndpoint}>
                        {copyEndpointState === 'done' ? <Check /> : <Copy />} Copy Endpoint
                      </Button>
                      <Button className="w-full cursor-pointer" variant="outline" onClick={copyJSON}>
                        {copyJSONState === 'done' ? <Check /> : <Copy />} Copy JSON
                      </Button>
                      <Button className="w-full cursor-pointer" variant="outline" onClick={downloadJSON}><Download /> Download</Button>
                      <Button className="w-full cursor-pointer" variant="ghost" onClick={() => window.open('https://www.goldapi.io', '_blank')}><ExternalLink /> Docs</Button>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className={clsx("text-2xl sm:text-3xl font-extrabold leading-tight")}>GoldAPI — Live Metals</h1>
            <p className="text-sm opacity-70">Real-time precious metal prices (x-access-token header). Fast, lightweight.</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 w-full sm:w-auto">
          <form onSubmit={handleSubmit} className={clsx("relative flex items-center gap-2 w-full sm:w-[520px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search pair, e.g. XAU/INR or type 'gold'..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggest(true); }}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" className="px-3 cursor-pointer" onClick={() => { setQuery(toPairString(DEFAULT_PAIR.metal, DEFAULT_PAIR.currency)); fetchPrice(DEFAULT_PAIR.metal, DEFAULT_PAIR.currency); }}>
                Default
              </Button>
              <Button type="submit" variant="outline" className="px-3 cursor-pointer">
                {loading ? <Loader2 className="animate-spin" /> : <Search />}
              </Button>
            </div>
          </form>
        </div>
      </header>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-4 right-4 sm:left-[calc(50%_-_260px)] sm:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
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
        {/* Left: quick meta / thumbnail (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Selected Pair</div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 border" aria-hidden>
                <div className="text-sm font-bold">{currentPair.metal}/{currentPair.currency}</div>
                <div className="text-xs opacity-60">{parsedFields?.metal ?? '—'}</div>
              </div>
              <div className="flex-1">
                <div className="text-xs opacity-60">Last fetched</div>
                <div className="text-sm">{parsedFields?.timestamp ? humanDate(parsedFields.timestamp) : '—'}</div>
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
              <Button variant="outline" onClick={copyEndpoint} className="cursor-pointer"><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={() => { window.open("https://www.goldapi.io", "_blank"); }} className="cursor-pointer"><Globe /> GoldAPI Docs</Button>
              <Button variant="outline" onClick={() => { setDialogOpen(true); }} className="cursor-pointer"><ImageIcon /> View Raw</Button>
            </div>
          </div>
        </aside>

        {/* Center: redesigned preview */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-900/40">
                  <DollarSign />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">Live Price Detail <span className="text-xs opacity-60">{currentPair.metal}/{currentPair.currency}</span></CardTitle>
                  <div className="text-xs opacity-60 flex items-center gap-2"><Clock className="opacity-70" /> {parsedFields?.timestamp ? humanDate(parsedFields.timestamp) : 'Not fetched'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip content="Refresh">
                  <Button variant="ghost" onClick={() => fetchPrice(currentPair.metal, currentPair.currency)} className="cursor-pointer"><RefreshCw className={loading ? "animate-spin" : ""} /></Button>
                </Tooltip>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)} className="cursor-pointer"><FileText /> {showRaw ? "Hide Raw" : "Show Raw"}</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !rawResp ? (
                <div className="py-12 text-center text-sm opacity-60">No data loaded — search a pair or pick a suggestion.</div>
              ) : (
                <div className="space-y-4">
                  {/* Main card top: price + quick actions */}
                  <div className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                    <div>
                      <div className="text-xs opacity-60 flex items-center gap-2"><BarChart2 /> Price</div>
                      <div className="text-3xl font-bold">{parsedFields?.price ?? "—"} <span className="text-base font-medium ml-2 opacity-70">{parsedFields?.currency ?? ""}</span></div>
                      <div className="mt-2 text-sm opacity-60">Fetched: {parsedFields?.timestamp ? humanDate(parsedFields.timestamp) : "—"}</div>
                    </div>

                    <div className="flex gap-2">
                      <motion.div whileTap={{ scale: 0.96 }}>
                        <Button variant="outline" onClick={copyJSON} className="cursor-pointer flex items-center gap-2">
                          {copyJSONState === 'done' ? <Check /> : <Copy />} {copyJSONState === 'done' ? 'Copied' : 'Copy JSON'}
                        </Button>
                      </motion.div>

                      <motion.div whileTap={{ scale: 0.96 }}>
                        <Button variant="ghost" onClick={downloadJSON} className="cursor-pointer flex items-center gap-2"><Download /> Download</Button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Analytics / details */}
                  <div className="p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs opacity-60 flex items-center gap-2"><ArrowUp /> Change</div>
                      <div className="font-medium mt-1">{parsedFields?.change ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-60 flex items-center gap-2"><DollarSign /> Unit</div>
                      <div className="font-medium mt-1">{parsedFields?.unit ?? "—"}</div>
                    </div>
                  </div>

                  {/* Raw toggleable */}
                  <AnimatePresence>
                    {showRaw && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-md border p-3 overflow-auto"
                        style={{ maxHeight: 420 }}
                      >
                        <div className="text-sm font-semibold mb-2 flex items-center gap-2"><FileText /> Full Response</div>
                        <ScrollArea style={{ maxHeight: 340 }}>
                          <pre className="text-xs whitespace-pre-wrap">{prettyJSON(rawResp)}</pre>
                        </ScrollArea>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions + metadata (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Quick Actions</div>
            <div className="space-y-2">
              <Button variant="outline" onClick={copyEndpoint} className="cursor-pointer"><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={copyJSON} className="cursor-pointer"><Copy /> Copy JSON</Button>
              <Button variant="outline" onClick={downloadJSON} className="cursor-pointer"><Download /> Download JSON</Button>
              <Button variant="ghost" onClick={() => window.open("https://www.goldapi.io", "_blank")} className="cursor-pointer"><ExternalLink /> Open Docs</Button>
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

      {/* Raw dialog (kept for larger view) */}
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
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={downloadJSON} className="cursor-pointer"><Download /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
