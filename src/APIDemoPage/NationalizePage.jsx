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
  Info,
  Menu,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  const pct = Math.max(0, Math.min(1, value || 0));
  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
      <div
        style={{ width: `${pct * 100}%` }}
        className="h-full bg-gradient-to-r from-emerald-400 to-green-600 transition-all duration-500"
      />
    </div>
  );
}

export default function NationalizePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // State
  const [query, setQuery] = useState(DEFAULT_NAME);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [result, setResult] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const suggestTimer = useRef(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sample suggestion pool
  const SUGGEST_POOL = [
    "michael",
    "sophia",
    "liam",
    "olivia",
    "noah",
    "emma",
    "raj",
    "arjun",
    "maria",
    "jose",
    "yuki",
    "sara",
    "mohammed",
    "amina",
    "david",
    "laura",
    "chen",
    "diego",
    "anna",
    "fatima",
  ];

  const RANDOM_POOL = [...SUGGEST_POOL].sort(() => 0.5 - Math.random()).slice(0, 10);

  useEffect(() => {
    fetchNationality(DEFAULT_NAME);
  }, []);

  /* ---------- Fetch ---------- */
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
      setResult(json);
      setRawResp(json);
      setShowSuggest(false);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch nationality.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Suggestion ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      setLoadingSuggest(true);
      const q = v.trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const matches = SUGGEST_POOL.filter((n) =>
        n.toLowerCase().includes(q)
      ).slice(0, 8);
      setSuggestions(matches);
      setLoadingSuggest(false);
    }, 200);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    await fetchNationality(query);
  }

  /* ---------- Copy / Download ---------- */
  function copyEndpoint() {
    const url = `${BASE_ENDPOINT}?name=${encodeURIComponent(query || "")}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1500);
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

  /* Sort countries */
  const sortedCountries = (result?.country || []).slice().sort(
    (a, b) => b.probability - a.probability
  );

  return (
    <div className="min-h-screen pb-10 p-4 lg:p-6 max-w-8xl mx-auto">
      {/* Mobile Header */}
      <div className="flex items-center gap-2 sm:justify-between lg:hidden mb-4">
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="cursor-pointer">
              <Menu /> 
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <ScrollArea className="h-full p-4 space-y-2">
              <h2 className="text-lg font-semibold mb-2">Random Names</h2>
              {RANDOM_POOL.map((name) => (
                <Button
                  key={name}
                  variant="ghost"
                  className="w-full justify-start cursor-pointer"
                  onClick={() => {
                    setQuery(name);
                    fetchNationality(name);
                    setMobileSidebarOpen(false);
                  }}
                >
                  <User className="mr-2" /> {name}
                </Button>
              ))}
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <h1 className="text-2xl font-bold">Nationality Predictor</h1>
      </div>

      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold">Nationality — Name Predictor</h1>
        <p className="text-sm opacity-70 mt-1">Predict nationality probabilities for a name</p>
      </header>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar for desktop */}
        <aside className="hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4 border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-black/40 h-fit">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <User /> Random Names
          </h2>
          <ScrollArea className="space-y-2">
            {RANDOM_POOL.map((name) => (
              <Button
                key={name}
                variant="ghost"
                className="w-full justify-start cursor-pointer"
                onClick={() => fetchNationality(name)}
              >
                <User className="mr-2" /> {name}
              </Button>
            ))}
          </ScrollArea>
          <Button
            variant="outline"
            className="w-full mt-2 cursor-pointer"
            onClick={() => RANDOM_POOL.sort(() => 0.5 - Math.random())}
          >
            <Loader2 className="mr-2 animate-spin" /> Refresh
          </Button>
        </aside>

        {/* Middle Content */}
        <main className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex-1 space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe /> Prediction
                </CardTitle>
                <div className="text-xs opacity-60">
                  {result?.name ? `Name: ${result.name}` : "No prediction yet — search a name."}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  onClick={() => fetchNationality(query)}
                >
                  <Loader2 className={loading ? "animate-spin mr-1" : "mr-1"} /> Refresh
                </Button>

                <Button
                  className="cursor-pointer"
                  variant="ghost"
                  onClick={() => setShowRaw(s => !s)}
                >
                  <List /> {showRaw ? "Hide Raw" : "Show Raw"}
                </Button>

                <Button
                  className="cursor-pointer relative"
                  variant="outline"
                  onClick={copyEndpoint}
                >
                  {copySuccess ? <Check className="animate-bounce mr-1" /> : <Copy className="mr-1" />}
                  {copySuccess ? "Copied" : "Copy Endpoint"}
                </Button>

                <Button
                  className="cursor-pointer"
                  variant="outline"
                  onClick={downloadJSON}
                >
                  <Download className="mr-1" /> Download JSON
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !result ? (
                <div className="py-12 text-center text-sm opacity-60">No result — try search or default.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Summary */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-lg font-semibold">{result.name}</div>
                    <div className="text-xs opacity-60 mt-1">Top Nationalities</div>
                    <div className="mt-4 space-y-3">
                      {sortedCountries.length === 0 && <div className="text-sm opacity-60">No country predictions available.</div>}
                      {sortedCountries.slice(0, 5).map((c, idx) => (
                        <div key={c.country_id + idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium flex items-center gap-1"><MapPin /> {c.country_id}</div>
                            <div className="text-xs opacity-60">{formatPercent(c.probability)}</div>
                          </div>
                          <ProbabilityBar value={c.probability} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-xs opacity-60">ISO 3166-1 alpha-2 codes</div>
                  </div>

                  {/* Full Table */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Globe /> Full Results</div>
                    <div className="text-sm leading-relaxed mb-4 opacity-70">
                      Probabilities are estimates — treat them as indicators, not certainties.
                    </div>
                    <ScrollArea className="overflow-auto max-h-[300px]">
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
                                <td className="py-3 font-medium flex items-center gap-1"><MapPin /> {c.country_id}</td>
                                <td className="py-3">{formatPercent(c.probability)}</td>
                                <td className="py-3 w-40"><ProbabilityBar value={c.probability} /></td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </ScrollArea>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><BarChart2 /> Insights</div>
                    <div className="text-xs opacity-70 space-y-1">
                      <div>• Model uses historical name-country statistics and may have dataset biases.</div>
                      <div>• Rare names may produce low-confidence predictions.</div>
                      <div>• Additional context (surname, location) improves inference.</div>
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
        </main>
      </div>
    </div>
  );
}
