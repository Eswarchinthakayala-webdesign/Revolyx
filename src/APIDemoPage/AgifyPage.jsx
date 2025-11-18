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
  Heart
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
      // Agify returns { name, age, count }
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
      // filter popular names for snappy suggestions
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
        <div className="text-xs opacity-60 mb-1">Estimated age</div>
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
          <div style={{ width: `${pct}%` }} className="h-3 rounded-full transition-all" />
        </div>
        <div className="mt-2 text-sm font-medium">{age} yrs</div>
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Agify — Age Predictor</h1>
          <p className="mt-1 text-sm opacity-70">Predict age from a first name using Agify.io (free, no key required).</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Enter a first name (e.g. michael, sarah, john)..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => { setQuery(DEFAULT_NAME); fetchPrediction(DEFAULT_NAME); }}>
              Default
            </Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s + idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setQuery(s); fetchPrediction(s); setShowSuggest(false); }}>
                <div className="flex items-center gap-3">
                  <User className="opacity-70" />
                  <div className="flex-1">
                    <div className="font-medium">{s}</div>
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

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => result?.name ? fetchPrediction(result.name) : fetchPrediction(DEFAULT_NAME)}><Loader2 className={loading ? "animate-spin" : ""} /> Refresh</Button>
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
                    <User className="mb-3" size={52} />
                    <div className="text-2xl font-bold">{(result.name || "").toUpperCase()}</div>
                    <div className="text-xs opacity-60">Predicted Age</div>
                    <div className="mt-4 w-full">
                      {renderAgeIndicator(result.age)}
                    </div>
                  </div>

                  {/* Middle: details */}
                  <div className={clsx("p-4 rounded-xl border col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Overview</div>
                    <div className="text-sm leading-relaxed mb-3">
                      <p className="mb-2">
                        Agify estimates the likely age for a first name using aggregated public data.
                      </p>
                      <p className="mb-2">
                        <strong>Note:</strong> Age is a statistical estimate — accuracy depends on the name's frequency and dataset coverage.
                      </p>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Key Results</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Name</div>
                        <div className="text-sm font-medium">{result.name || "—"}</div>
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

                    <div className="text-sm font-semibold mb-2">Interpretation</div>
                    <div className="text-sm leading-relaxed mb-3">
                      <p>
                        A higher <em>count</em> typically indicates more data behind the estimate and a more reliable age prediction. Low counts mean the estimate is less reliable.
                      </p>
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
          <Separator />
          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint & debugging</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => copyEndpoint()}><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => setShowRaw((s) => !s)}><List /> Toggle Raw</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick tips</div>
            <div className="text-xs opacity-60">
              Try names from different countries and check the <strong>count</strong> — higher counts give better estimates.
            </div>
          </div>
        </aside>
      </main>

      {/* Example dialog (simple info) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-2xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>About Agify</DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <p className="text-sm opacity-70 mb-2">Agify.io predicts ages for names using public data sources. It's free and requires no API key.</p>
            <p className="text-sm opacity-70">Source: <a href="https://agify.io" target="_blank" rel="noreferrer" className="underline">agify.io</a></p>
          </div>

          <DialogFooter className="flex justify-end items-center p-4 border-t">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
