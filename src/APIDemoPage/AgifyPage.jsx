// src/pages/AgifyPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  User,
  Calendar,
  Users,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  List,
  X,
  Zap,
  Heart,
  Check,
  BarChart2,
  Clock,
  DollarSign
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

/* ---------- Config ---------- */
const API_ENDPOINT = "https://api.agify.io";
const DEFAULT_NAME = "michael"; // default loaded on mount
const POPULAR_NAMES = [
  "michael", "mary", "john", "patricia", "james", "linda", "robert", "jennifer",
  "william", "elizabeth", "david", "barbara", "richard", "susan", "joseph", "jessica",
  "thomas", "sarah", "charles", "karen"
];

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/* ---------- Small Inline Copy button (isolated state, simple animation) ---------- */
function InlineCopy({ text, label = "Copied", className = "" }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast("success", label);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      showToast("error", "Copy failed");
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={clsx("inline-flex items-center gap-2 px-3 py-1 rounded-md border transition-transform", "cursor-pointer", className)}
      aria-label="Copy"
      type="button"
    >
      <AnimatePresence mode="popLayout">
        {!copied ? (
          <motion.span key="icon-copy" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
            <Copy className="w-4 h-4" />
          </motion.span>
        ) : (
          <motion.span key="icon-check" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} >
            <Check className="w-4 h-4 text-emerald-500" />
          </motion.span>
        )}
      </AnimatePresence>

      <span className="text-sm">
        {copied ? "Copied!" : "Copy"}
      </span>
    </button>
  );
}

/* ---------- Helper: compute initials ---------- */
function initials(name = "") {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() ?? "").join("");
}

/* ---------- Main Component ---------- */
export default function AgifyPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);

  // state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState(POPULAR_NAMES);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [result, setResult] = useState(null); // { name, age, count }
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const suggestTimer = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // load default name on mount
    fetchPrediction(DEFAULT_NAME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- fetch prediction ---------- */
  async function fetchPrediction(name) {
    if (!name || name.trim().length === 0) {
      showToast("info", "Enter a name to predict");
      return;
    }
    setLoading(true);
    try {
      const url = `${API_ENDPOINT}/?name=${encodeURIComponent(name.toLowerCase())}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `API error (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setResult({
        name: json.name ?? name,
        age: typeof json.age === "number" ? json.age : null,
        count: typeof json.count === "number" ? json.count : null
      });
      setRawResp(json);
    } catch (err) {
      console.error(err);
      showToast("error", "Network error while fetching prediction");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- search input handler (suggestions + debounce) ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      setLoadingSuggest(true);
      const q = (v || "").trim().toLowerCase();
      if (!q) {
        setSuggestions(POPULAR_NAMES);
        setLoadingSuggest(false);
        return;
      }
      const filtered = POPULAR_NAMES.filter((n) => n.includes(q)).slice(0, 10);
      setSuggestions(filtered.length > 0 ? filtered : [q]);
      setLoadingSuggest(false);
    }, 200);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    const name = (query || "").trim();
    if (!name) {
      showToast("info", "Try: michael, sarah, john...");
      return;
    }
    await fetchPrediction(name);
    setShowSuggest(false);
  }

  function copyEndpoint() {
    const url = `${API_ENDPOINT}/?name=${encodeURIComponent(query || DEFAULT_NAME)}`;
    navigator.clipboard.writeText(url);
    showToast("success", "Endpoint copied");
  }

  function downloadJSON() {
    const payload = rawResp || result;
    if (!payload) {
      showToast("info", "Nothing to download");
      return;
    }
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `agify_${(payload.name || "result")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* ---------- small helpers for UI ---------- */
  function renderAgeIndicator(age) {
    if (age === null || typeof age !== "number") return <span className="text-sm opacity-60">Unknown</span>;
    const pct = Math.min(100, Math.max(0, Math.round((age / 100) * 100))); // percent relative to 100
    return (
      <div className="w-full">
        <div className="text-xs opacity-60 mb-2">Estimated age</div>
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
          <div style={{ width: `${pct}%` }} className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all" />
        </div>
        <div className="mt-2 text-sm font-medium">{age} yrs</div>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className={clsx("min-h-screen p-4 md:p-6 overflow-hidden max-w-8xl mx-auto", isDark ? "bg-black text-zinc-50" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Agify — Age Predictor</h1>
          <p className="mt-1 text-sm opacity-70 max-w-xl">Predict a likely age for a first name using Agify.io — free, fast, no API key.</p>
        </div>

        <div className="w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              ref={inputRef}
              placeholder="Enter a first name (e.g. michael, sarah, john)..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              aria-label="Name"
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { setQuery(DEFAULT_NAME); fetchPrediction(DEFAULT_NAME); }}>
              Default
            </Button>
            <Button type="submit" variant="default" className="px-3 cursor-pointer" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
            </Button>
          </form>
        </div>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-3xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s + idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setQuery(s); fetchPrediction(s); setShowSuggest(false); }}>
                <div className="flex items-center gap-3">
                  <User className="opacity-70" />
                  <div className="flex-1">
                    <div className="font-medium capitalize">{s}</div>
                    <div className="text-xs opacity-60">Try this name</div>
                  </div>
                  <div className="text-xs opacity-60">—</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

        {/* Center: result viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Prediction</CardTitle>
                <div className="text-xs opacity-60">{result?.name ? `Name: ${result.name}` : "Waiting for a prediction..."}</div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => result?.name ? fetchPrediction(result.name) : fetchPrediction(DEFAULT_NAME)}>
                  <Loader2 className={loading ? "animate-spin" : ""} /> Refresh
                </Button>

                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>

                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><Users /> Example</Button>

                <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !result ? (
                <div className="py-12 text-center text-sm opacity-60">No prediction yet — search a name above.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: main metric */}
                  <div className={clsx("p-4 rounded-xl border flex flex-col items-center justify-center", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center flex-col gap-4">
                      <div
                        className={clsx("w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-md")}
                        style={{ background: "linear-gradient(135deg,#7dd3fc,#60a5fa)" }}
                      >
                        <span className="text-white">{initials(result.name)}</span>
                      </div>

                      <div className="text-center">
                        <motion.div
                          key={result.age ?? "unknown"}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 260, damping: 18 }}
                          className="text-4xl md:text-5xl font-extrabold"
                        >
                          {result.age ?? "—"}
                        </motion.div>
                        <div className="text-xs opacity-60">Predicted Age</div>
                      </div>
                    </div>

                    <div className="mt-4 w-full">
                      {renderAgeIndicator(result.age)}
                    </div>

                 
                  </div>

                  {/* Middle: details */}
                  <div className={clsx("p-4 rounded-xl border md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold mb-1">Overview</div>
                        <p className="text-sm opacity-80 leading-relaxed mb-3">
                          Agify estimates a likely age for a first name using large-scale public data. The <strong>count</strong> indicates how many samples matched the name in the dataset.
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs opacity-60">Last run</div>
                        <div className="text-sm font-medium"><Clock className="inline-block mr-1" /> {new Date().toLocaleString()}</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Name</div>
                        <div className="text-sm font-medium capitalize">{result.name}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Predicted Age</div>
                        <div className="text-sm font-medium">{result.age ?? "—"}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Count (samples)</div>
                        <div className="text-sm font-medium">{result.count ?? "—"}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Confidence</div>
                        <div className="text-sm font-medium">
                          {result.count ? `${Math.min(99, Math.round(Math.log10(result.count + 1) * 20))}%` : "Unknown"}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div>
                      <div className="text-sm font-semibold mb-1">Interpretation</div>
                      <div className="text-sm opacity-80 leading-relaxed">
                        Names with higher counts generally yield more reliable predictions. Treat this as a statistical estimate rather than a deterministic age.
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button className="cursor-pointer" variant="ghost" onClick={() => fetchPrediction(result.name)}><Zap /> Re-run</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(`${API_ENDPOINT}/?name=${encodeURIComponent(result.name)}`); showToast("success", "Endpoint copied"); }}><ExternalLink /> API</Button>
                    </div>
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

        {/* Right: meta / tools */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Developer</div>
              <div className="text-xs opacity-60">Endpoint & debugging</div>
            </div>
            <Heart className="opacity-60" />
          </div>

          <div className="mt-2 space-y-2">
            <Button className="cursor-pointer w-full" variant="outline" onClick={() => copyEndpoint()}><Copy /> Copy Endpoint</Button>
            <Button className="cursor-pointer w-full" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
            <Button className="cursor-pointer w-full" variant="outline" onClick={() => setShowRaw(s => !s)}><List /> Toggle Raw</Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick tips</div>
            <div className="text-xs opacity-60">
              Try names across cultures and compare <strong>count</strong> values — higher counts usually mean more confidence.
            </div>
          </div>

          <Separator />

          <div className="text-xs opacity-60">
            Source: <a href="https://agify.io" target="_blank" rel="noreferrer" className="underline">agify.io</a>
          </div>
        </aside>
      </main>

      {/* Example dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-2xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>About Agify</DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <p className="text-sm opacity-70 mb-2">Agify.io predicts ages for names using public data sources. It's free and requires no API key.</p>
            <p className="text-sm opacity-70">Source: <a href="https://agify.io" target="_blank" rel="noreferrer" className="underline">agify.io</a></p>
          </div>

          <DialogFooter className="flex justify-end items-center p-4 border-t">
             <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
