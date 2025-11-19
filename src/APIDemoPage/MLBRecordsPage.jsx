// src/pages/MLBRecordsPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Loader2,
  Copy,
  Download,
  ExternalLink,
  List,
  RefreshCw,
  Sliders,
  ChevronRight,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

//
// MLB Records & Stats Page
// - Uses MLB Stats API endpoint: https://statsapi.mlb.com/api/v1/stats
// - UI: left (players list / suggestions), center (full details), right (quick actions).
// - No localStorage persistence (as requested).
//

const BASE_ENDPOINT = "https://statsapi.mlb.com/api/v1/stats";
// NOTE: No API key required for this endpoint per your sample JSON.

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/** Format numeric values and fallback */
function safeVal(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return v;
  return v;
}

/** Get a friendly label for stat keys (basic mapping) */
const STAT_LABELS = {
  gamesPlayed: "Games",
  runs: "Runs",
  hits: "Hits",
  homeRuns: "HR",
  rbi: "RBI",
  avg: "AVG",
  obp: "OBP",
  slg: "SLG",
  ops: "OPS",
  strikeOuts: "K",
  baseOnBalls: "BB",
  stolenBases: "SB",
  doubles: "2B",
  triples: "3B",
  plateAppearances: "PA",
  atBats: "AB",
  totalBases: "TB",
  numberOfPitches: "Pitches",
  caughtStealing: "CS",
};

/** Helper: build URL for MLB stats endpoint */
function buildUrl({ group = "hitting", season, limit = 200 }) {
  const params = new URLSearchParams();
  params.set("stats", "season");
  params.set("group", group);
  if (season) params.set("season", String(season));
  // Add a limit param if supported (some endpoints accept limit)
  if (limit) params.set("limit", String(limit));
  return `${BASE_ENDPOINT}?${params.toString()}`;
}

export default function MLBRecordsPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Search state
  const [group, setGroup] = useState("hitting"); // hitting / pitching
  const [season, setSeason] = useState(new Date().getFullYear()); // default current year
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // player list from last fetch
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // Data & selection
  const [rawResp, setRawResp] = useState(null); // full response
  const [selected, setSelected] = useState(null); // selected split (player stats object)
  const [loading, setLoading] = useState(false);

  // UI
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const timerRef = useRef(null);
  const latestFetchRef = useRef(null); // abort signal not used (fetch API supports AbortController if desired)

  // Fetch stats from MLB API and fill suggestions (splits -> players)
  async function fetchStats({ q = "", group: g = group, season: s = season } = {}) {
    setLoading(true);
    setLoadingSuggest(true);
    try {
      const url = buildUrl({ group: g, season: s, limit: 500 });
      latestFetchRef.current = url;
      const res = await fetch(url);
      if (!res.ok) {
        console.error("MLB stats fetch failed", res.status);
        setSuggestions([]);
        setRawResp(null);
        return;
      }
      const json = await res.json();
      setRawResp(json);

      // Parse into splits array safely
      // Response sample: { stats: [ { group: {...}, splits: [ ... ] } ] }
      const statsArr = Array.isArray(json.stats) ? json.stats : [];
      let splits = [];
      for (const sObj of statsArr) {
        if (Array.isArray(sObj.splits)) {
          splits = splits.concat(sObj.splits);
        }
      }

      // Optionally filter by player name query (client-side)
      const qLower = (q || "").trim().toLowerCase();
      const filtered = qLower
        ? splits.filter((sp) => {
            const name = (sp.player?.fullName || "").toLowerCase();
            return name.includes(qLower);
          })
        : splits;

      // Normalize each split to include id and display name
      const normalized = filtered.map((sp) => {
        const pid = sp.player?.id ? String(sp.player.id) : `${sp.player?.fullName}_${sp.team?.id || "0"}`;
        return { ...sp, _id: pid, _display: sp.player?.fullName || sp.team?.name || pid };
      });

      // Sort by rank or by stat if present; fallback to player name
      normalized.sort((a, b) => {
        // prefer rank if numeric
        const ra = Number(a.rank ?? 9999);
        const rb = Number(b.rank ?? 9999);
        if (!isNaN(ra) && !isNaN(rb) && ra !== rb) return ra - rb;
        return (a._display || "").localeCompare(b._display || "");
      });

      setSuggestions(normalized);
      // set the first as selected if no current selected
      if (!selected && normalized.length > 0) {
        setSelected(normalized[0]);
      }
    } catch (err) {
      console.error("fetchStats error", err);
      setSuggestions([]);
      setRawResp(null);
    } finally {
      setLoading(false);
      setLoadingSuggest(false);
    }
  }

  // Debounced onQueryChange to filter server-side by fetching and client filtering
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchStats({ q: v, group, season });
    }, 350);
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    // fetch with whatever query currently is
    await fetchStats({ q: query, group, season });
    setShowSuggest(false);
  }

  useEffect(() => {
    // initial load
    fetchStats({ q: "", group, season });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If group or season changes, refresh
  useEffect(() => {
    fetchStats({ q: query, group, season });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, season]);

  // Actions
  function copySelected() {
    if (!selected) return;
    const payload = prettyJSON(selected);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(payload);
    }
  }

  function downloadJSON() {
    const payload = rawResp || selected;
    if (!payload) return;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = `mlb_stats_${group}_${season}.json`;
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function openPlayerApi() {
    if (!selected?.player?.link) return;
    // MLB API links in sample were like /api/v1/people/XXXXX
    const base = "https://statsapi.mlb.com";
    const href = selected.player.link.startsWith("/") ? `${base}${selected.player.link}` : selected.player.link;
    window.open(href, "_blank");
  }

  // Render helpers
  function renderStatGrid(statObj = {}) {
    // We'll show key/value pairs with friendly labels where possible
    const entries = Object.entries(statObj);
    if (entries.length === 0) return <div className="text-sm opacity-60">No stat fields.</div>;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entries.map(([k, v]) => (
          <div key={k} className={clsx("p-2 rounded-md border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/80 border-zinc-200")}>
            <div className="text-xs opacity-60">{STAT_LABELS[k] ?? k}</div>
            <div className="text-sm font-medium break-words">{v === null || v === undefined ? "—" : String(v)}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>MLB — Records & Stats</h1>
          <p className="mt-1 text-sm opacity-70">Browse season stats (hitting/pitching). Search players, inspect detailed stat splits.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSubmit} className={clsx("flex items-center gap-2 w-full md:w-[760px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search player name (e.g. 'Aaron Judge')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />

            <div className="hidden md:flex items-center gap-2">
              <Select value={group} onValueChange={(v) => setGroup(v)}>
                <SelectTrigger className="h-9 w-36">
                  <SelectValue placeholder="Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hitting">Hitting</SelectItem>
                  <SelectItem value="pitching">Pitching</SelectItem>
                </SelectContent>
              </Select>

              <Input
                value={String(season)}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setSeason(val ? Number(val) : "");
                }}
                className="w-24"
                placeholder="Season"
              />
            </div>

            <Button type="button" variant="outline" className="px-3" onClick={() => fetchStats({ q: query, group, season })}>
              <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_380px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Loading stats…</li>}
            <ScrollArea className="max-h-72">
              {suggestions.map((s, idx) => (
                <li
                  key={s._id || idx}
                  tabIndex={0}
                  onClick={() => { setSelected(s); setShowSuggest(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { setSelected(s); setShowSuggest(false); } }}
                  className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer flex items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="font-medium">{s._display}</div>
                    <div className="text-xs opacity-60">{s.team?.name ?? "—"} • {s.position?.abbreviation ?? s.position?.name ?? "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.season ?? "—"}</div>
                  <ChevronRight className="opacity-40" />
                </li>
              ))}
            </ScrollArea>
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout: left / center / right */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: players list (collapses on mobile) */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/40 border border-zinc-800 rounded-2xl p-4" : "bg-white/90 border border-zinc-200 rounded-2xl p-4")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Players</div>
              <div className="text-xs opacity-60">Results ({suggestions.length})</div>
            </div>
            <div className="text-xs opacity-60">Season {season}</div>
          </div>

          <Separator />

          <ScrollArea className="h-[60vh]">
            <ul className="space-y-2">
              {loading ? (
                <li className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></li>
              ) : suggestions.length === 0 ? (
                <li className="text-sm opacity-60">No players — adjust season/group or search</li>
              ) : suggestions.map((s) => (
                <li key={s._id} className={clsx("p-3 rounded-md cursor-pointer hover:shadow-sm", s._id === selected?._id ? "bg-zinc-100 dark:bg-zinc-800/50" : (isDark ? "bg-black/20" : "bg-white/80"))}
                  onClick={() => setSelected(s)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") setSelected(s); }}
                >
                  <div className="font-medium">{s._display}</div>
                  <div className="text-xs opacity-60">{s.team?.name ?? "—"} • {s.position?.abbreviation ?? s.position?.name ?? "—"}</div>
                  <div className="text-xs opacity-60">Rank: {s.rank ?? "—"}</div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </aside>

        {/* Center: detailed player stat card */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Player Details</CardTitle>
                <div className="text-xs opacity-60">{selected?.player?.fullName || "Select a player from the left list"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide raw" : "Raw"}</Button>
                <Button variant="outline" onClick={() => { if (selected?.player?.link) window.open(`https://statsapi.mlb.com${selected.player.link}`, "_blank"); }}><ExternalLink /> Player API</Button>
              </div>
            </CardHeader>

            <CardContent>
              {!selected ? (
                <div className="py-12 text-center text-sm opacity-60">No player selected.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-lg font-semibold">{selected.player?.fullName}</div>
                    <div className="text-xs opacity-60">{selected.team?.name ?? "Team N/A"}</div>
                    <div className="mt-3 text-sm">
                      <div><span className="text-xs opacity-60">Position</span><div className="font-medium">{selected.position?.abbreviation ?? selected.position?.name ?? "—"}</div></div>
                      <div className="mt-2"><span className="text-xs opacity-60">Season</span><div className="font-medium">{selected.season}</div></div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Button className="w-full" variant="outline" onClick={() => openPlayerApi()}><ExternalLink /> Open player API</Button>
                      <Button className="w-full" variant="ghost" onClick={() => setDialogOpen(true)}><Sliders /> More options</Button>
                    </div>
                  </div>

                  {/* Center — summary and key stats */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Summary</div>
                    <div className="text-sm leading-relaxed mb-3">
                      {selected.stat?.avg ? (
                        <div>
                          <div className="text-lg font-semibold">{selected.player?.fullName} — {selected.team?.name}</div>
                          <div className="text-sm opacity-60">AVG {selected.stat?.avg} • HR {selected.stat?.homeRuns ?? "—"} • RBI {selected.stat?.rbi ?? "—"} • OPS {selected.stat?.ops ?? "—"}</div>
                        </div>
                      ) : (
                        <div className="text-sm opacity-60">No summary stats available for this split.</div>
                      )}
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Detailed Stat Fields</div>
                    <div className="mb-4">
                      {renderStatGrid(selected.stat || {})}
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Raw split record</div>
                    <div className="text-xs opacity-60 break-words">{selected._id}</div>
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

        {/* Right: quick actions / developer panel */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Quick actions</div>
            <div className="text-xs opacity-60">Copy / download data and other developer helpers</div>
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="outline" onClick={() => copySelected()}><Copy /> Copy selected JSON</Button>
              <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => { setShowRaw((s) => !s); }}><List /> Toggle raw</Button>
              <Button variant="ghost" onClick={() => fetchStats({ q: query, group, season })}><RefreshCw /> Refresh</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Endpoint</div>
            <div className="text-xs opacity-60">You can call the same endpoint from a server or proxy for production.</div>
            <div className="mt-2 text-xs break-all p-2 rounded-md border bg-gray-50 dark:bg-zinc-900">
              {buildUrl({ group, season })}
            </div>
            <div className="mt-2 text-xs opacity-60">Note: do not expose server keys publicly.</div>
          </div>
        </aside>
      </main>

      {/* Dialog — placeholder for further options */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-2xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Options</DialogTitle>
          </DialogHeader>

          <div style={{ padding: 16 }}>
            <div className="text-sm opacity-70 mb-3">This dialog can be extended to show advanced filters (team, position, stat ranges), or to build a CSV export.</div>
            <div className="grid grid-cols-1 gap-2">
              <div className="text-sm"><strong>Group:</strong> {group}</div>
              <div className="text-sm"><strong>Season:</strong> {season}</div>
              <div className="text-sm"><strong>Query:</strong> {query || "—"}</div>
            </div>
          </div>

          <DialogFooter className="flex justify-end items-center p-4 border-t">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
