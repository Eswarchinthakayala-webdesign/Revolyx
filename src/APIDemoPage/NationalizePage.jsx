// src/pages/NationalizePage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  Copy,
  List,
  X,
  Globe,
  BarChart2,
  Percent,
  User,
  MapPin,
  Loader2,
  ExternalLink,
  Info
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------- API endpoint ---------- */
const BASE_ENDPOINT = "https://api.nationalize.io/";
const DEFAULT_NAME = "michael";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function formatPercent(p) {
  if (typeof p !== "number") return "—";
  return `${(p * 100).toFixed(1)}%`;
}

/* small progress bar */
function ProbabilityBar({ value }) {
  // value: 0..1
  const pct = Math.max(0, Math.min(1, value || 0));
  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
      <div
        style={{ width: `${pct * 100}%` }}
        className="h-full bg-gradient-to-r from-emerald-400 to-green-600"
      />
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function NationalizePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [query, setQuery] = useState(DEFAULT_NAME);
  const [suggestions, setSuggestions] = useState([]); // simple local suggestions
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [result, setResult] = useState(null); // holds API response
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const suggestTimer = useRef(null);

  // sample suggestion pool (you can extend this)
  const SUGGEST_POOL = [
    "michael", "sophia", "liam", "olivia", "noah", "emma",
    "raj", "arjun", "maria", "jose", "yuki", "sara", "mohammed",
    "amina", "david", "laura", "chen", "diego", "anna", "fatima"
  ];

  useEffect(() => {
    // load default on mount
    fetchNationality(DEFAULT_NAME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Fetch nationalize result ---------- */
  async function fetchNationality(name) {
    if (!name || !name.trim()) {
      showToast("info", "Enter a name to predict nationality.");
      return;
    }
    setLoading(true);
    setShowRaw(false);
    try {
      const params = new URLSearchParams({ name: name.trim() });
      const url = `${BASE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Request failed (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      // API returns { name: "...", country: [{country_id: "US", probability:0.1}, ...] }
      setResult(json);
      setRawResp(json);
      // prepare light-weight suggestions from result: show top country codes
      setShowSuggest(false);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch nationality.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Suggestion behavior (simple client-side) ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      setLoadingSuggest(true);
      // filter sample pool
      const q = v.trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const matches = SUGGEST_POOL.filter((n) => n.toLowerCase().includes(q)).slice(0, 8);
      setSuggestions(matches);
      setLoadingSuggest(false);
    }, 200);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    await fetchNationality(query);
  }

  function copyEndpoint() {
    const url = `${BASE_ENDPOINT}?name=${encodeURIComponent(query || "")}`;
    navigator.clipboard.writeText(url);
    showToast("success", "Endpoint copied");
  }

  function downloadJSON() {
    const payload = rawResp || result;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nationality_${(query || "name").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* Render country list sorted by probability desc */
  const sortedCountries = (result?.country || []).slice().sort((a, b) => b.probability - a.probability);

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Nationality — Name Predictor</h1>
          <p className="mt-1 text-sm opacity-70">Predict nationality probabilities for a name (powered by nationalize.io)</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Enter a first name, e.g. 'michael'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => { setQuery(DEFAULT_NAME); fetchNationality(DEFAULT_NAME); }}>Default</Button>
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
              <li key={s + idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setQuery(s); fetchNationality(s); setShowSuggest(false); }}>
                <div className="flex items-center gap-3">
                  <User className="opacity-70" />
                  <div className="flex-1">
                    <div className="font-medium">{s}</div>
                    <div className="text-xs opacity-60">Try this name</div>
                  </div>
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
                <div className="text-xs opacity-60">{result?.name ? `Name: ${result.name}` : "No prediction yet — search a name."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => fetchNationality(query)}><Loader2 className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !result ? (
                <div className="py-12 text-center text-sm opacity-60">No result — try search or default.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: summary + basic */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-lg font-semibold">{result.name}</div>
                    <div className="text-xs opacity-60 mt-1">Predicted nationalities (top results)</div>

                    <div className="mt-4 space-y-3">
                      {sortedCountries.length === 0 && <div className="text-sm opacity-60">No country predictions available.</div>}
                      {sortedCountries.slice(0, 5).map((c, idx) => (
                        <div key={c.country_id + idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{c.country_id}</div>
                            <div className="text-xs opacity-60">{formatPercent(c.probability)}</div>
                          </div>
                          <ProbabilityBar value={c.probability} />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 text-xs opacity-60">Tip: country codes are ISO 3166-1 alpha-2.</div>
                  </div>

                  {/* Middle: full table + explanation */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Globe /> Full Results</div>

                    <div className="text-sm leading-relaxed mb-4">
                      The API predicts probable countries for a given given name. Probabilities are estimates — treat them as indicators, not certainties.
                    </div>

                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-left opacity-60 border-b">
                            <th className="py-2">Rank</th>
                            <th className="py-2">Country</th>
                            <th className="py-2">Probability</th>
                            <th className="py-2">Visual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedCountries.length === 0 ? (
                            <tr><td colSpan={4} className="py-6 text-center opacity-60">No predictions</td></tr>
                          ) : (
                            sortedCountries.map((c, i) => (
                              <tr key={c.country_id + i} className="align-top border-b last:border-b-0">
                                <td className="py-3 w-12">{i + 1}</td>
                                <td className="py-3 font-medium">{c.country_id}</td>
                                <td className="py-3">{formatPercent(c.probability)}</td>
                                <td className="py-3 w-40">
                                  <ProbabilityBar value={c.probability} />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><BarChart2 /> Insights</div>
                    <div className="text-xs opacity-70">
                      • The model uses historical name-country statistics and may be biased by dataset coverage.<br />
                      • Rare names or globalized names may produce low-confidence predictions.<br />
                      • Use additional context (surname, location) for better inference.
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

        {/* Right: dev tools */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <Separator />
          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint & utilities</div>
            <div className="mt-2 space-y-2">
              <Button variant="outline" className="w-full" onClick={() => copyEndpoint()}><Copy /> Copy Endpoint</Button>
              <Button variant="outline" className="w-full" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button variant="outline" className="w-full" onClick={() => setShowRaw(s => !s)}><List /> Toggle Raw</Button>
              <Button variant="ghost" className="w-full" onClick={() => { window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`, "_blank"); }}><ExternalLink /> Search on Wikipedia</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Dialog (optional) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Details</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="text-center text-sm opacity-70">No large media for this API — use the table above.</div>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">nationalize.io</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
