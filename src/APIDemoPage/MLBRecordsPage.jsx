// src/pages/MLBRecordsPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Loader2,
  Copy as CopyIcon,
  Check,
  Download,
  ExternalLink,
  List,
  RefreshCw,
  Sliders,
  ChevronRight,
  MapPin,
  Menu,
  Trophy,
  User,
  BarChart2,
  Award,
  Activity,
  Layers,
  Zap,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";

const BASE_ENDPOINT = "https://statsapi.mlb.com/api/v1/stats";

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
function safeVal(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return v;
  return v;
}
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

function buildUrl({ group = "hitting", season, limit = 200 }) {
  const params = new URLSearchParams();
  params.set("stats", "season");
  params.set("group", group);
  if (season) params.set("season", String(season));
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

  // core state
  const [group, setGroup] = useState("hitting");
  const [season, setSeason] = useState(new Date().getFullYear());
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [rawResp, setRawResp] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false); // mobile sidebar
  const [copied, setCopied] = useState(false); // copy animation state

  const timerRef = useRef(null);
  const latestFetchRef = useRef(null);

  // pick 10 random suggestions for the quick/preview list
  const randomTen = useMemo(() => {
    if (!Array.isArray(suggestions) || suggestions.length === 0) return [];
    const pool = [...suggestions];
    // Fisher-Yates-ish shuffle partial
    for (let i = pool.length - 1; i > Math.max(0, pool.length - 15); i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.min(10, pool.length));
  }, [suggestions]);

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

      const statsArr = Array.isArray(json.stats) ? json.stats : [];
      let splits = [];
      for (const sObj of statsArr) {
        if (Array.isArray(sObj.splits)) splits = splits.concat(sObj.splits);
      }

      const qLower = (q || "").trim().toLowerCase();
      const filtered = qLower
        ? splits.filter((sp) => (sp.player?.fullName || "").toLowerCase().includes(qLower))
        : splits;

      const normalized = filtered.map((sp) => {
        const pid = sp.player?.id ? String(sp.player.id) : `${sp.player?.fullName}_${sp.team?.id || "0"}`;
        return { ...sp, _id: pid, _display: sp.player?.fullName || sp.team?.name || pid };
      });

      normalized.sort((a, b) => {
        const ra = Number(a.rank ?? 9999);
        const rb = Number(b.rank ?? 9999);
        if (!isNaN(ra) && !isNaN(rb) && ra !== rb) return ra - rb;
        return (a._display || "").localeCompare(b._display || "");
      });

      setSuggestions(normalized);
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
    await fetchStats({ q: query, group, season });
    setShowSuggest(false);
  }

  useEffect(() => {
    fetchStats({ q: "", group, season });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStats({ q: query, group, season });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, season]);

  function copySelected() {
    if (!selected) return;
    const payload = prettyJSON(selected);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(payload).then(() => {
        setCopied(true);
        // reset after 1.6s
        setTimeout(() => setCopied(false), 1600);
      });
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
    const base = "https://statsapi.mlb.com";
    const href = selected.player.link.startsWith("/") ? `${base}${selected.player.link}` : selected.player.link;
    window.open(href, "_blank");
  }

  function renderStatGrid(statObj = {}) {
    const entries = Object.entries(statObj);
    if (entries.length === 0) return <div className="text-sm opacity-60">No stat fields.</div>;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entries.map(([k, v]) => (
          <div
            key={k}
            className={clsx(
              "p-2 rounded-md border cursor-default",
              isDark ? "bg-black/20 border-zinc-800" : "bg-white/80 border-zinc-200"
            )}
          >
            <div className="text-xs opacity-60">{STAT_LABELS[k] ?? k}</div>
            <div className="text-sm font-medium break-words">{v === null || v === undefined ? "—" : String(v)}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen pb-10 p-4 md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* mobile menu */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="p-2 cursor-pointer">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] sm:w-[420px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Trophy /> Players
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <div className="text-sm font-semibold mb-2">Quick list</div>
                  <ScrollArea className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
                    <ul className="space-y-2">
                      {randomTen.length === 0 ? (
                        <li className="text-sm opacity-60">No results</li>
                      ) : (
                        randomTen.map((s) => (
                          <li
                            key={s._id}
                            className="p-3 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                            onClick={() => {
                              setSelected(s);
                              setSheetOpen(false);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{s._display}</div>
                                <div className="text-xs opacity-60">{s.team?.name ?? "—"} • {s.position?.abbreviation ?? "—"}</div>
                              </div>
                              <div className="ml-3 text-xs opacity-60">#{s.rank ?? "—"}</div>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </ScrollArea>
                </div>

                <SheetFooter>
                  <div className="w-full flex justify-between items-center">
                    <div className="text-xs opacity-60">Season {season}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => fetchStats({ q: query, group, season })} className="cursor-pointer">
                        <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh
                      </Button>
                    </div>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className="text-xl md:text-3xl font-extrabold">MLB — Records &amp; Stats</h1>
            <div className="text-xs md:text-sm opacity-70 hidden md:block">Browse season stats (hitting/pitching). Search players, inspect detailed stat splits.</div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <form onSubmit={handleSubmit} className={clsx("flex flex-wrap  items-center gap-2 w-full max-w-3xl rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
          <div className="flex gap-2 items-center ">
            <Search className="opacity-60" />
            <Input
              placeholder="Search player name (e.g. 'Aaron Judge')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            </div>
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

            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => fetchStats({ q: query, group, season })}>
              <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>

       
      </header>

      {/* suggestions dropdown (desktop) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx(
              "absolute z-50 left-4 right-4 md:left-[calc(50%_-_480px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl",
              isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200"
            )}
            style={{ marginTop: 80 }}
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
                  <div className="text-xs opacity-60">Season {s.season ?? "—"}</div>
                  <ChevronRight className="opacity-40" />
                </li>
              ))}
            </ScrollArea>
          </motion.ul>
        )}
      </AnimatePresence>

      {/* main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* left sidebar (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 space-y-4", isDark ? "bg-black/40 border border-zinc-800 rounded-2xl p-4" : "bg-white/90 border border-zinc-200 rounded-2xl p-4")}>
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
              ) : randomTen.map((s) => (
                <li
                  key={s._id}
                  className={clsx(
                    "p-3 rounded-md cursor-pointer hover:shadow-sm flex items-center justify-between",
                    s._id === selected?._id ? "bg-zinc-100 dark:bg-zinc-800/50" : (isDark ? "bg-black/20" : "bg-white/80")
                  )}
                  onClick={() => setSelected(s)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") setSelected(s); }}
                >
                  <div>
                    <div className="font-medium">{s._display}</div>
                    <div className="text-xs opacity-60">{s.team?.name ?? "—"} • {s.position?.abbreviation ?? s.position?.name ?? "—"}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60">Rank</span>
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)" }}>
                      <Trophy className="w-3 h-3 opacity-80" />
                      <span>#{s.rank ?? "—"}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </aside>

        {/* center content */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}>
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>{selected?.player?.fullName ?? "Select a player from the list"}</span>
                    {selected?.rank && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100/70 dark:bg-amber-700/20 text-amber-800 dark:text-amber-200">
                        <Trophy className="w-3 h-3" /> #{selected.rank}
                      </span>
                    )}
                  </CardTitle>
                  <div className="text-xs opacity-60 flex items-center gap-2">
                    <BarChart2 className="w-3 h-3 opacity-70" /> <span>{selected?.team?.name ?? "Team N/A"}</span>
                    <span className="mx-2">•</span>
                    <span>{selected?.position?.abbreviation ?? "—"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 sm:mt-0 flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer"><List /> {showRaw ? "Hide raw" : "Raw"}</Button>

                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => copySelected()}
                    className={clsx("flex items-center gap-2 cursor-pointer")}
                  >
                    {!copied ? (<><CopyIcon /> Copy</>) : (<><Check className="text-emerald-400" /> Copied</>)}
                  </Button>

                  {/* small animated check for accessibility */}
                  <AnimatePresence>
                    {copied && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.9 }}
                        className="absolute -right-0 -top-9"
                      >
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs">
                          <Check className="w-4 h-4" /> Copied
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button variant="outline" onClick={downloadJSON} className="cursor-pointer"><Download /> Export</Button>
                <Button variant="ghost" onClick={() => openPlayerApi()} className="cursor-pointer"><ExternalLink /> API</Button>
              </div>
            </CardHeader>

            <CardContent>
              {!selected ? (
                <div className="py-12 text-center text-sm opacity-60">No player selected. Pick a player to view details.</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* left meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-lg font-semibold flex items-center gap-2">
                      <User /> <span>{selected.player?.fullName}</span>
                    </div>
                    <div className="text-xs opacity-60">{selected.team?.name ?? "Team N/A"}</div>

                    <div className="mt-4 text-sm space-y-3">
                      <div>
                        <div className="text-xs opacity-60">Position</div>
                        <div className="font-medium">{selected.position?.abbreviation ?? selected.position?.name ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Season</div>
                        <div className="font-medium">{selected.season}</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Button className="w-full cursor-pointer" variant="outline" onClick={() => openPlayerApi()}><ExternalLink /> Open player API</Button>
                      <Button className="w-full cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><Sliders /> More options</Button>
                    </div>
                  </div>

                  {/* main stats */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 lg:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <Award className="w-4 h-4" /> Summary
                      </div>

                      <div className="text-xs opacity-60">Updated: {rawResp?.lastUpdated ? new Date(rawResp.lastUpdated).toLocaleString() : "—"}</div>
                    </div>

                    {/* top key stat cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="p-3 rounded-lg shadow-sm cursor-default">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Zap className="w-4 h-4" /> AVG</div>
                        <div className="text-lg font-semibold">{selected.stat?.avg ?? "—"}</div>
                      </div>

                      <div className="p-3 rounded-lg shadow-sm cursor-default">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Activity className="w-4 h-4" /> HR</div>
                        <div className="text-lg font-semibold">{selected.stat?.homeRuns ?? "—"}</div>
                      </div>

                      <div className="p-3 rounded-lg shadow-sm cursor-default">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Layers className="w-4 h-4" /> RBI</div>
                        <div className="text-lg font-semibold">{selected.stat?.rbi ?? "—"}</div>
                      </div>

                      <div className="p-3 rounded-lg shadow-sm cursor-default">
                        <div className="text-xs opacity-60 flex items-center gap-2"><BarChart2 className="w-4 h-4" /> OPS</div>
                        <div className="text-lg font-semibold">{selected.stat?.ops ?? "—"}</div>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Detailed Stat Fields</div>
                    <div className="mb-4">
                      {renderStatGrid(selected.stat || {})}
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><List className="w-4 h-4" /> Split ID</div>
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

        {/* right quick actions / developer */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Quick actions</div>
            <div className="text-xs opacity-60">Copy / download data and other developer helpers</div>
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="outline" onClick={() => copySelected()} className="cursor-pointer"><CopyIcon /> Copy selected JSON</Button>
              <Button variant="outline" onClick={() => downloadJSON()} className="cursor-pointer"><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => { setShowRaw((s) => !s); }} className="cursor-pointer"><List /> Toggle raw</Button>
              <Button variant="ghost" onClick={() => fetchStats({ q: query, group, season })} className="cursor-pointer"><RefreshCw /> Refresh</Button>
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

      {/* Dialog — advanced options */}
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
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
