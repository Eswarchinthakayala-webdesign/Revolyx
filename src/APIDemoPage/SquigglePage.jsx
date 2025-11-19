// src/pages/SquigglePage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  Download,
  Copy,
  List,
  ChevronRight,
  Calendar,
  MapPin,
  Clock,
  Star,
  ArrowDownUp,
  Users,
  FileText
} from "lucide-react";

/* Replace these imports with your project's shadcn/ui components or equivalent */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";

/* Tiny toast helper fallback — replace with your toast lib if you have one */
const toast = (msg) => {
  try {
    // If sonner/toast exists in project, prefer that.
    // eslint-disable-next-line no-console
    console.log("TOAST:", msg);
  } catch {}
};

const API_BASE = "https://api.squiggle.com.au/?q=games;year=";

const prettyJSON = (o) => JSON.stringify(o, null, 2);

function formatLocalTime(localtime) {
  if (!localtime) return "—";
  // API returns "YYYY-MM-DD HH:mm:ss"
  try {
    const iso = localtime.replace(" ", "T");
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return localtime;
    return d.toLocaleString();
  } catch {
    return localtime;
  }
}

function scoreBadgeClass(isWinner, isHome, isAway, winnerName, teamName) {
  if (!winnerName) return "text-zinc-700 bg-zinc-100 dark:bg-zinc-800";
  if (winnerName === teamName) return "text-green-800 bg-green-100 dark:bg-green-900/40";
  return "text-red-800 bg-red-100 dark:bg-red-900/30";
}

/* Large scoreboard component styled like a professional broadcast card */
function ScoreCard({ game }) {
  if (!game) return null;
  const {
    hteam,
    ateam,
    hgoals,
    hbehinds,
    hscore,
    agoals,
    abehinds,
    ascore,
    winner,
    roundname,
    venue,
    localtime,
  } = game;

  // compute display strings
  const leftScore = `${hscore ?? ""}`;
  const rightScore = `${ascore ?? ""}`;
  const leftBreak = `${hgoals ?? 0}.${hbehinds ?? 0}`;
  const rightBreak = `${agoals ?? 0}.${abehinds ?? 0}`;

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-xl border dark:border-zinc-800">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-b from-white/60 to-white/30 dark:from-black/40 dark:to-black/30">
        <div>
          <div className="text-sm opacity-70">{roundname} • {venue}</div>
          <div className="mt-1 text-xs opacity-60">{formatLocalTime(localtime)}</div>
        </div>

        <div className="flex items-center gap-4">
          {/* Teams column */}
          <div className="flex items-center gap-4 border rounded-xl px-3 py-2 bg-white/80 dark:bg-black/40">
            <div className="text-left">
              <div className="text-sm opacity-70">Home</div>
              <div className={clsx("font-semibold text-lg", winner === hteam ? "text-green-600" : "")}>{hteam}</div>
              <div className="text-xs opacity-60">({leftBreak})</div>
            </div>

            <div className="px-4 text-center">
              <div className="text-xs opacity-60">SCORE</div>
              <div className={clsx("text-3xl font-extrabold", winner === hteam ? "text-green-700" : winner === ateam ? "text-red-600" : "text-zinc-900 dark:text-zinc-100")}>
                {leftScore}
              </div>
            </div>

            <div className="border-l h-10" />

            <div className="text-left">
              <div className="text-sm opacity-70">Away</div>
              <div className={clsx("font-semibold text-lg", winner === ateam ? "text-green-600" : "")}>{ateam}</div>
              <div className="text-xs opacity-60">({rightBreak})</div>
            </div>

            <div className="px-4 text-center">
              <div className="text-xs opacity-60">SCORE</div>
              <div className={clsx("text-3xl font-extrabold", winner === ateam ? "text-green-700" : winner === hteam ? "text-red-600" : "text-zinc-900 dark:text-zinc-100")}>
                {rightScore}
              </div>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs opacity-60">Winner</div>
          <div className="font-semibold">{winner ?? (game.complete === 100 ? "Complete" : "—")}</div>
        </div>
      </div>

      <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-between gap-3">
        <div className="text-sm opacity-70">Goals breakdown</div>
        <div className="text-xs opacity-60">Home {hgoals ?? 0} • Away {agoals ?? 0}</div>
      </div>
    </div>
  );
}

export default function SquigglePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const now = new Date();
  const currentYear = now.getFullYear();

  const [year, setYear] = useState(currentYear);
  const [games, setGames] = useState([]);
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rawOpen, setRawOpen] = useState(false);

  const suggestTimer = useRef(null);

  /* Fetch games for a specific year */
  async function fetchYear(y = year) {
    setLoading(true);
    try {
      const url = `${API_BASE}${encodeURIComponent(y)}`;
      const res = await fetch(url);
      if (!res.ok) {
        toast(`Failed to fetch: ${res.status}`);
        setGames([]);
        setRaw(null);
        setSelected(null);
        return;
      }
      const data = await res.json();
      const items = data.games || [];
      setGames(items);
      setRaw(data);
      // pick a default: first finished game or first game
      const defaultGame = items.find(g => g.complete === 100) || items[0] || null;
      setSelected(defaultGame);
      toast(`Loaded ${items.length} games for ${y}`);
    } catch (err) {
      console.error(err);
      toast("Fetch error");
      setGames([]);
      setRaw(null);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial load
    fetchYear(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Search suggestions (client-side over fetched games) */
  function handleQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => generateSuggestions(v), 220);
  }

  function generateSuggestions(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    const qq = q.toLowerCase();
    const matches = games.filter(g => {
      const fields = [
        (g.hteam || "").toLowerCase(),
        (g.ateam || "").toLowerCase(),
        (g.venue || "").toLowerCase(),
        (g.roundname || "").toLowerCase(),
        (String(g.id) || "").toLowerCase()
      ];
      return fields.some(f => f.includes(qq));
    }).slice(0, 30);
    setSuggestions(matches);
  }

  function selectGame(g) {
    setSelected(g);
    setQuery("");
    setShowSuggest(false);
  }

  function downloadJson() {
    const payload = raw || { games };
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `squiggle_${year}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Downloaded JSON");
  }

  function copyJson() {
    const payload = raw || (selected || games);
    navigator.clipboard?.writeText(prettyJSON(payload)).then(() => toast("Copied JSON"));
  }

  const recent = useMemo(() => games.slice(0, 8), [games]);

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Squiggle · AFL Fixtures & Results</h1>
          <p className="text-sm opacity-70 mt-1">Fixtures, scores, team info & match metadata from the Squiggle API — no key required.</p>
        </div>

        <div className="flex gap-3 items-center">
          <div className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg border", isDark ? "bg-black/50 border-zinc-800" : "bg-white border-zinc-200")}>
            <Calendar className="opacity-60" />
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value || currentYear))}
              className="bg-transparent outline-none w-28 text-sm"
              min="1900"
              max="2100"
            />
            <Button onClick={() => fetchYear(year)} variant="outline" className="ml-2"><RefreshCw /></Button>
          </div>
          <Button onClick={() => { setRawOpen(v => !v); }} variant="ghost"><List /></Button>
          <Button onClick={() => downloadJson()} variant="secondary"><Download /> Download</Button>
        </div>
      </header>

      {/* Main layout: left search, center main, right quick */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Search & recent */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-4">
              <CardTitle>Search games</CardTitle>
              <div className="text-xs opacity-60 mt-1">Search by team, venue, round or ID</div>
            </CardHeader>

            <CardContent>
              <div className="relative">
                <div className="flex items-center gap-2 rounded-lg p-2 border">
                  <Search className="opacity-60" />
                  <Input
                    placeholder="Type to search (eg. Collingwood)"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onFocus={() => { if (query) generateSuggestions(query); setShowSuggest(true); }}
                    className="border-0 bg-transparent shadow-none"
                  />
                  <Button variant="ghost" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); }}>
                    <ChevronRight />
                  </Button>
                </div>

                <AnimatePresence>
                  {showSuggest && (suggestions.length > 0 || query) && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={clsx("absolute left-0 right-0 mt-2 rounded-xl shadow-lg cursor-pointer overflow-auto z-40", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
                      style={{ maxHeight: 320 }}
                    >
                      {suggestions.length === 0 && query && <div className="p-3 text-sm opacity-60">No matches</div>}
                      {suggestions.map(g => (
                        <button key={g.id} onClick={() => selectGame(g)} className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{g.hteam} vs {g.ateam}</div>
                            <div className="text-xs opacity-60">{g.roundname} • {g.venue}</div>
                          </div>
                          <div className="text-xs opacity-60">{formatLocalTime(g.localtime)}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Separator className="my-4" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">Recent games</div>
                  <div className="text-xs opacity-60">{games.length} total</div>
                </div>

                <div className="space-y-2">
                  {recent.map(g => (
                    <button key={g.id} onClick={() => setSelected(g)} className="w-full text-left p-3 rounded-lg border hover:shadow-sm flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{g.hteam} • {g.ateam}</div>
                        <div className="text-xs opacity-60">{g.roundname}</div>
                      </div>
                      <div className="text-xs opacity-70">{g.winner ?? (g.complete === 100 ? "Final" : "—")}</div>
                    </button>
                  ))}
                  {recent.length === 0 && <div className="text-sm opacity-60 p-3">No games loaded for {year}</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* CENTER: Main detail & large scoreboard */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-5 flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Match details</CardTitle>
                <div className="text-xs opacity-60">{selected ? `${selected.hteam} vs ${selected.ateam}` : `Select a match or search`}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fetchYear(year)}><RefreshCw /></Button>
                <Button variant="ghost" onClick={() => setRawOpen(r => !r)}><FileText /></Button>
                <Button onClick={() => downloadJson()}><Download /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center opacity-60">Loading games…</div>
              ) : !selected ? (
                <div className="py-12 text-center opacity-60">No match selected — choose from the left or search above.</div>
              ) : (
                <div className="space-y-6">
                  <ScoreCard game={selected} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-white/70 dark:bg-black/40">
                      <div className="text-sm font-semibold mb-2">Summary</div>
                      <div className="text-sm opacity-70">
                        {selected.timestr ? <><strong>Status:</strong> {selected.timestr}<br /></> : null}
                        <strong>Venue:</strong> {selected.venue}<br />
                        <strong>Round:</strong> {selected.roundname}<br />
                        <strong>Updated:</strong> {selected.updated ?? "—"}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-white/70 dark:bg-black/40">
                      <div className="text-sm font-semibold mb-2">Stats</div>
                      <div className="text-sm opacity-70">
                        <div><strong>Home goals:</strong> {selected.hgoals ?? "—"} • <strong>behinds:</strong> {selected.hbehinds ?? "—"}</div>
                        <div><strong>Away goals:</strong> {selected.agoals ?? "—"} • <strong>behinds:</strong> {selected.abehinds ?? "—"}</div>
                        <div className="mt-2"><strong>Complete:</strong> {selected.complete === 100 ? "Yes" : "No"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-white/70 dark:bg-black/40">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold">Full payload (selected game)</div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => copyJson()}><Copy /></Button>
                        <Button variant="outline" onClick={() => downloadJson()}><Download /></Button>
                      </div>
                    </div>
                    <pre className="text-xs max-h-64 overflow-auto bg-transparent p-3 rounded-md border">{prettyJSON(selected)}</pre>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {rawOpen && raw && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-4 border-t bg-zinc-50 dark:bg-zinc-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">Raw API response</div>
                    <div className="text-xs opacity-60">{raw.games?.length ?? 0} games</div>
                  </div>
                  <pre className="text-xs overflow-auto max-h-80">{prettyJSON(raw)}</pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* RIGHT: Quick actions / utilities */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Quick actions</div>
                <div className="text-xs opacity-60">Utilities & debugging</div>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2">
              <Button className="w-full" onClick={() => fetchYear(year)}><RefreshCw /> Refresh</Button>
              <Button className="w-full" onClick={() => downloadJson()}><Download /> Download JSON</Button>
              <Button className="w-full" onClick={() => copyJson()}><Copy /> Copy JSON</Button>
              <Button className="w-full" variant="ghost" onClick={() => { setSelected(null); toast("Cleared selection"); }}><ChevronRight /> Clear Selection</Button>
            </div>

            <Separator className="my-3" />

            <div className="text-xs opacity-70">
              <div><strong>Endpoint</strong></div>
              <div className="break-words text-[11px]">https://api.squiggle.com.au/?q=games;year=&lt;YEAR&gt;</div>
            </div>
          </Card>
        </aside>
      </main>

      {/* Dialog placeholder kept for future extension */}
      <Dialog open={false} onOpenChange={() => { }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Details</DialogTitle>
          </DialogHeader>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}
