// src/pages/SquigglePage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

// Lucide Icons
import {
  Search,
  RefreshCw,
  Download,
  Copy,
  List,
  ChevronRight,
  Calendar,
  MapPin,
  Trophy,
  Clock,
  Star,
  ArrowDownUp,
  Users,
  FileText,
  Menu,
  Check,
  Info,
  ChevronLeftSquare,
  BarChart2,
  X,
  RefreshCcw,
} from "lucide-react";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

/* Utilities */
const prettyJSON = (o) => JSON.stringify(o, null, 2);
const toast = (m) => console.log("TOAST:", m);

/* Format time safely */
function formatLocalTime(localtime) {
  if (!localtime) return "—";
  try {
    return new Date(localtime.replace(" ", "T")).toLocaleString();
  } catch {
    return localtime;
  }
}

/* Glass badge */
function Glass({ children, className = "" }) {
  return (
    <div
      className={clsx(
        "px-2 py-1 rounded-full text-xs backdrop-blur-md border shadow-sm",
        "bg-white/20 dark:bg-black/30 border-white/20 dark:border-zinc-700/50",
        className
      )}
    >
      {children}
    </div>
  );
}

/* =============================== */
/*  🔥 IMPROVED SCORE CARD UI     */
/* =============================== */
function ScoreCard({ game, onOpenDialog }) {
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
    complete,
  } = game;

  const homeBreak = `${hgoals ?? 0}.${hbehinds ?? 0}`;
  const awayBreak = `${agoals ?? 0}.${abehinds ?? 0}`;

  const isHomeWinner = winner === hteam;
  const isAwayWinner = winner === ateam;

  return (
    <motion.div
      layout
      className={clsx(
        "rounded-2xl overflow-hidden shadow-lg border cursor-pointer",
        "bg-gradient-to-b from-white/70 to-white/40 dark:from-black/40 dark:to-black/10"
      )}
      onClick={() => onOpenDialog(game)}
      whileHover={{ scale: 1.01 }}
    >
      {/* Top metadata */}
      <div className="p-4 flex items-center justify-between text-xs opacity-70">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 opacity-60" />
          {roundname}
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 opacity-60" />
          {venue}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 opacity-60" />
          {formatLocalTime(localtime)}
        </div>
      </div>

      <Separator />

      {/* Score Section */}
      <div className="p-6 flex flex-row items-center justify-between gap-6 text-center">

        {/* Home */}
        <div className="flex flex-col items-center gap-1 min-w-[150px]">
          <Glass className="text-xs flex items-center gap-1">
            <Users className="h-3 w-3" /> Home
          </Glass>

          <div className={clsx("font-semibold text-lg mt-1", isHomeWinner && "text-emerald-600",!isHomeWinner && "text-red-600")}>
            {hteam}
          </div>
          <div className="text-xs opacity-60">({homeBreak})</div>

          <div
            className={clsx(
              "text-4xl font-extrabold mt-2",
              isHomeWinner ? "text-emerald-600" : "text-red-600 dark:text-red-500"
            )}
          >
            {hscore ?? "—"}
          </div>
        </div>

        {/* Middle — VS */}
        <div className="flex flex-col items-center opacity-70">
          <Trophy className="h-8 w-8 opacity-40" />
          <div className="text-xs mt-1">VS</div>
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-1 min-w-[150px]">
          <Glass className="text-xs flex items-center gap-1">
            <Users className="h-3 w-3" /> Away
          </Glass>

          <div className={clsx("font-semibold text-lg mt-1", isAwayWinner && "text-emerald-600",!isAwayWinner && "text-red-600")}>
            {ateam}
          </div>
          <div className="text-xs opacity-60">({awayBreak})</div>

          <div
            className={clsx(
              "text-4xl font-extrabold mt-2",
              isAwayWinner ? "text-emerald-600" : "text-red-600 dark:text-red-500"
            )}
          >
            {ascore ?? "—"}
          </div>
        </div>
      </div>

      <Separator />

      <div className="p-3 text-xs flex items-center justify-between opacity-70">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="h-3 w-3 opacity-60" />
          Goals — Home {hgoals ?? 0} • Away {agoals ?? 0}
        </div>
        <Glass>
          Winner: {winner ?? (complete === 100 ? "Final" : "—")}
        </Glass>
      </div>
    </motion.div>
  );
}

/* =================================================================== */
/*            FULL PAGE — REWRITTEN & POLISHED                         */
/* =================================================================== */

export default function SquigglePage() {
  /* Theme */
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  /* State */
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

  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPayload, setDialogPayload] = useState(null);

  const [copying, setCopying] = useState(false);

  const suggestTimer = useRef(null);

  const API_BASE = "https://api.squiggle.com.au/?q=games;year=";

  /* Fetching */
  async function fetchYearData(y = year) {
    setLoading(true);
    try {
      const url = `${API_BASE}${y}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);

      const data = await res.json();
      const list = data.games || [];

      setGames(list);
      setRaw(data);
      setSelected(list.find((g) => g.complete === 100) || list[0] || null);

      toast(`Loaded ${list.length} games`);
    } catch (e) {
      toast("Fetch failed");
      setGames([]);
      setRaw(null);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchYearData();
  }, []);

  /* Suggestions */
  function handleQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);

    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const q = v.toLowerCase();
      const hits = games
        .filter((g) =>
          [g.hteam, g.ateam, g.roundname, g.venue].some((f) =>
            (f || "").toLowerCase().includes(q)
          )
        )
        .slice(0, 32);

      setSuggestions(hits);
    }, 200);
  }

  /* Download & Copy */
  function downloadJson() {
    const pl = raw || games;
    const blob = new Blob([prettyJSON(pl)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `squiggle_${year}.json`;
    a.click();
  }

  async function copyJson(payload = null) {
    const pl = payload ?? raw ?? selected;
    try {
      setCopying(true);
      await navigator.clipboard.writeText(prettyJSON(pl));
      toast("Copied");
      setTimeout(() => setCopying(false), 1200);
    } catch {
      toast("Copy failed");
    }
  }

  /* Recent 6 */
  const recent = useMemo(() => games.slice(0, 100), [games]);

  /* Dialog open helper */
  function openGameDialog(g) {
    setDialogPayload(g);
    setDialogOpen(true);
  }

  /* =================================================================== */
  /*                           RENDER                                     */
  /* =================================================================== */
  return (
    <div className="min-h-screen p-4 md:p-6 max-w-8xl mx-auto space-y-6">

      {/* ======================== HEADER ======================== */}
      <header className="flex items-center justify-between flex-wrap gap-4">

        {/* Left side */}
        <div className="flex items-center gap-3">

          {/* Mobile Menu */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="cursor-pointer p-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[300px]">
              <div className="p-4 space-y-4">

                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">Matches</div>
                 
                </div>

                <ScrollArea className="h-[75vh]">
                  <div className="space-y-3">
                   <div className="space-y-3">
  {games.map((g) => {
    const isSelected = selected?.id === g.id;

    return (
      <button
        key={g.id}
        onClick={() => {
          setSelected(g);
          setSheetOpen(false);
        }}
        className={`
          w-full text-left rounded-lg p-3 cursor-pointer transition-all

          ${isSelected
            ? "border-gray-500/40 bg-gray-500/10 dark:bg-gray-500/50"
            : "border border-zinc-200 dark:border-zinc-800 hover:shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
          }
        `}
      >
        <div className="font-medium text-sm">
          {g.hteam} vs {g.ateam}
        </div>
        <div className="text-xs opacity-60">
          {g.roundname} • {g.venue}
        </div>
      </button>
    );
  })}
</div>

                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          {/* Header Title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <BarChart2 className="h-6 w-6 opacity-70" />
              Squiggle — AFL Score Hub
            </h1>
            <div className="text-xs opacity-60 mt-1">
              Live matches, scores, rounds & metadata — from Squiggle API
            </div>
          </div>
        </div>

        {/* Year Controls */}
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-lg border",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white"
            )}
          >
            <Calendar className="opacity-60" />
            <input
              type="number"
              value={year}
              min="2000"
              max="2100"
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-20 bg-transparent outline-none text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => fetchYearData(year)}
            >
              <RefreshCw />
            </Button>
          </div>

          {/* Desktop Quick Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() => setRawOpen((v) => !v)}
            >
              <FileText />
            </Button>
            <Button
              variant="secondary"
              className="cursor-pointer"
              onClick={downloadJson}
            >
              <Download />
            </Button>
          </div>
        </div>
      </header>

      {/* ======================== MAIN GRID ======================== */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ---------- LEFT SIDEBAR (desktop) ---------- */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">

          {/* Search Panel */}
          <Card
            className={clsx(
              "rounded-2xl overflow-hidden border",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white"
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search /> Search
              </CardTitle>
              <div className="text-xs opacity-60">Teams, venue, round…</div>
            </CardHeader>

            <CardContent>
              {/* Search Input */}
              <div className="relative">
                <div className="flex items-center gap-2 p-2 border rounded-lg">
                  <Search className="opacity-60" />
                  <Input
                    value={query}
                    placeholder="Search match"
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onFocus={() => setShowSuggest(true)}
                    className="border-0 shadow-none bg-transparent"
                  />
                  {query && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer"
                      onClick={() => {
                        setQuery("");
                        setShowSuggest(false);
                      }}
                    >
                      <X />
                    </Button>
                  )}
                </div>

                {/* Suggestions */}
                <AnimatePresence>
                  {showSuggest && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={clsx(
                        "absolute left-0 right-0 mt-2  border rounded-xl shadow-lg z-40 overflow-y-auto",
                        isDark ? "bg-black border-zinc-800" : "bg-white"
                      )}
                      style={{ maxHeight: 320 }}
                    >
                      <ScrollArea className="p-2 max-h-[300px]">
                        {suggestions.length === 0 ? (
                          <div className="p-3 text-xs opacity-60">No matches</div>
                        ) : (
                          suggestions.map((g) => (
                            <button
                              key={g.id}
                              onClick={() => {
                                setSelected(g);
                                setShowSuggest(false);
                              }}
                              className="w-full text-left p-3 rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 cursor-pointer flex flex-col items-start justify-between"
                            >
                              <div>
                                <div className="font-medium text-sm">
                                  {g.hteam} vs {g.ateam}
                                </div>
                                <div className="text-xs opacity-60">
                                  {g.roundname} • {g.venue}
                                </div>
                              </div>
                              <div className="text-xs opacity-60">
                                {formatLocalTime(g.localtime)}
                              </div>
                            </button>
                          ))
                        )}
                      </ScrollArea>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Separator className="my-4" />

              {/* Recent Games */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm">Recent Games</div>
                  <div className="text-xs opacity-60">{games.length} total</div>
                </div>

              <div className="space-y-2 h-100 pb-5 overflow-y-auto">
  {recent.map((g) => {
    const isSelected = selected?.id === g.id;

    return (
      <div
        key={g.id}
        onClick={() => setSelected(g)}
        className={`
          p-3 rounded-lg border cursor-pointer flex justify-between transition-all
          hover:shadow-sm

          ${isSelected 
            ? "border-gray-500/40 bg-gray-500/10 dark:bg-gray-500/50" 
            : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
          }
        `}
      >
        <div>
          <div className="font-medium text-sm">
            {g.hteam} vs {g.ateam}
          </div>
          <div className="text-xs opacity-60">{g.roundname}</div>
        </div>

        <p className="
          text-xs backdrop-blur-md h-6 truncate rounded-2xl flex items-center px-2
          bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300
        ">
          {g.winner ?? (g.complete === 100 ? "Final" : "—")}
        </p>
      </div>
    );
  })}
</div>

              </div>
            </CardContent>
          </Card>
        </aside>

        {/* ---------- CENTER: MAIN PREVIEW ---------- */}
        <section className="lg:col-span-6">
          <Card
            className={clsx(
              "rounded-2xl overflow-hidden border",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white"
            )}
          >
            <CardHeader className="p-5 flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Match Details
                </CardTitle>
                <div className="text-xs opacity-60">
                  {selected ? `${selected.hteam} vs ${selected.ateam}` : "No match selected"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="cursor-pointer" onClick={() => fetchYearData(year)}>
                  <RefreshCcw />
                </Button>
                <Button variant="ghost" className="cursor-pointer" onClick={() => setRawOpen((v) => !v)}>
                  <FileText />
                </Button>
                <Button variant="secondary" className="cursor-pointer" onClick={downloadJson}>
                  <Download />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* LOADING */}
              {loading && <div className="text-center py-12 opacity-60">Loading…</div>}

              {/* NO SELECTION */}
              {!loading && !selected && (
                <div className="py-12 text-center opacity-60">Select a game using search or sidebar.</div>
              )}

              {/* MATCH SELECTED */}
              {!loading && selected && (
                <div className="space-y-6">

                  {/* ScoreCard */}
                  <ScoreCard game={selected} onOpenDialog={openGameDialog} />

                  {/* Summary Row */}
                  <div className="grid md:grid-cols-2 gap-4">

                    {/* Summary */}
                    <Card className="rounded-xl border p-4 bg-white/70 dark:bg-black/30">
                      <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Summary
                        </div>
                        <Glass>{formatLocalTime(selected.localtime)}</Glass>
                      </div>

                      <div className="text-sm opacity-70 mt-2 space-y-1">
                        <div><strong>Venue:</strong> {selected.venue}</div>
                        <div><strong>Round:</strong> {selected.roundname}</div>
                        <div><strong>Status:</strong> {selected.timestr ?? "—"}</div>
                        <div><strong>Updated:</strong> {selected.updated ?? "—"}</div>
                      </div>
                    </Card>

                    {/* Stats */}
                    <Card className="rounded-xl border p-4 bg-white/70 dark:bg-black/30">
                      <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2">
                          <ArrowDownUp className="h-4 w-4" />
                          Statistics
                        </div>
                        <Glass>{selected.winner ?? "—"}</Glass>
                      </div>

                      <div className="text-sm opacity-70 mt-2 space-y-1">
                        <div>
                          <strong>Home goals:</strong> {selected.hgoals ?? "—"} •{" "}
                          <strong>Behinds:</strong> {selected.hbehinds ?? "—"}
                        </div>
                        <div>
                          <strong>Away goals:</strong> {selected.agoals ?? "—"} •{" "}
                          <strong>Behinds:</strong> {selected.abehinds ?? "—"}
                        </div>
                        <div className="mt-2">
                          <strong>Completed:</strong> {selected.complete === 100 ? "Yes" : "No"}
                        </div>
                      </div>
                    </Card>
                  </div>

          
                </div>
              )}
            </CardContent>

            {/* RAW PANEL */}
            <AnimatePresence>
              {rawOpen && raw && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 border-t bg-zinc-50 dark:bg-zinc-900/40"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium flex items-center gap-2">
                      <List className="h-4 w-4" /> Raw API Response
                    </div>
                    <div className="text-xs opacity-60">
                      {raw.games?.length ?? 0} games
                    </div>
                  </div>
                  <pre className="text-xs overflow-auto max-h-80">{prettyJSON(raw)}</pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* ---------- RIGHT: QUICK ACTIONS ---------- */}
        <aside className="lg:col-span-3 space-y-4">
          <Card
            className={clsx(
              "rounded-2xl overflow-hidden border p-4",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white"
            )}
          >
            <div>
              <div className="font-semibold">Quick Actions</div>
              <div className="text-xs opacity-60">Utility tools</div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2">
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => fetchYearData(year)}>
                <RefreshCcw /> Refresh
              </Button>
              <Button variant="outline"  className="w-full cursor-pointer" onClick={downloadJson}>
                <Download /> Download JSON
              </Button>
              <Button variant="outline"  className="w-full cursor-pointer" onClick={() => copyJson()}>
                <Copy /> Copy JSON
              </Button>
              <Button
                className="w-full cursor-pointer"
                variant="outline" 
                onClick={() => setSelected(null)}
              >
                <ChevronRight /> Clear Selection
              </Button>
            </div>

            <Separator className="my-3" />

            <div className="text-xs opacity-70">
              <strong>Endpoint</strong>
              <div className="break-all text-[11px] mt-1">
                https://api.squiggle.com.au/?q=games;year=&lt;YEAR&gt;
              </div>
            </div>
          </Card>
        </aside>
      </main>

      {/* ======================== MATCH DIALOG ======================== */}
<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogContent
    className={clsx(
      "max-w-md w-full p-0 rounded-2xl overflow-hidden",
      isDark ? "bg-black/90 border border-zinc-800" : "bg-white border border-zinc-200"
    )}
  >
    <DialogHeader className="p-4 border-b">
      <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
        <Info className="h-5 w-5 opacity-70" /> Match Snapshot
      </DialogTitle>
    </DialogHeader>

    <div className="p-6">
      {!dialogPayload ? (
        <div className="py-6 text-center text-sm opacity-60">No data</div>
      ) : (
        <div className="space-y-6">

          {/* Identify winner & loser */}
          {(() => {
            const winner = dialogPayload.winner;
            const home = dialogPayload.hteam;
            const away = dialogPayload.ateam;

            const homeWinner = winner === home;
            const awayWinner = winner === away;

            return (
              <>

                {/* Teams row */}
                <div className="flex items-center justify-between gap-6">

                  {/* HOME */}
                  <div className="flex-1 text-center">
                    <div
                      className={clsx(
                        "mx-auto w-fit px-3 py-1",
                        homeWinner ? "text-emerald-600 border-emerald-300/30" : "opacity-80"
                      )}
                    >
                      Home
                    </div>

                    <div
                      className={clsx(
                        "mt-1 font-semibold text-lg",
                        homeWinner ? "text-emerald-500" : awayWinner ? "text-rose-500" : ""
                      )}
                    >
                      {dialogPayload.hteam}
                    </div>

                    <div className="text-xs opacity-60">
                      ({dialogPayload.hgoals}.{dialogPayload.hbehinds})
                    </div>

                    <div
                      className={clsx(
                        "text-3xl font-extrabold mt-1",
                        homeWinner ? "text-emerald-500" : awayWinner ? "text-rose-500" : ""
                      )}
                    >
                      {dialogPayload.hscore}
                    </div>
                  </div>

                  {/* AWAY */}
                  <div className="flex-1 text-center">
                    <div
                      className={clsx(
                        "mx-auto w-fit px-3 py-1",
                        awayWinner ? "text-emerald-600 border-emerald-300/30" : "opacity-80"
                      )}
                    >
                      Away
                    </div>

                    <div
                      className={clsx(
                        "mt-1 font-semibold text-lg",
                        awayWinner ? "text-emerald-500" : homeWinner ? "text-rose-500" : ""
                      )}
                    >
                      {dialogPayload.ateam}
                    </div>

                    <div className="text-xs opacity-60">
                      ({dialogPayload.agoals}.{dialogPayload.abehinds})
                    </div>

                    <div
                      className={clsx(
                        "text-3xl font-extrabold mt-1",
                        awayWinner ? "text-emerald-500" : homeWinner ? "text-rose-500" : ""
                      )}
                    >
                      {dialogPayload.ascore}
                    </div>
                  </div>
                </div>

                {/* Winner badge */}
                <div className="text-center mt-3">
                  <div
                    className={clsx(
                      "mx-auto w-fit px-4 py-1 text-sm",
                      winner
                        ? "text-emerald-600 border-emerald-300/30"
                        : "text-zinc-600 dark:text-zinc-300"
                    )}
                  >
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      Winner:
                      <span
                        className={clsx(
                          "font-semibold",
                          winner ? "text-emerald-600" : "opacity-70"
                        )}
                      >
                        {winner ?? "—"}
                      </span>
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>

    <DialogFooter className="flex justify-between p-4 border-t">
      <Button
        variant="ghost"
        className="cursor-pointer"
        onClick={() => setDialogOpen(false)}
      >
        Close
      </Button>
      <Button
        variant="outline"
        className="cursor-pointer"
        onClick={() => copyJson(dialogPayload)}
      >
        <Copy /> Copy
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </div>
  );
}
