// src/pages/DnDSpellsPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Copy,
  Download,
  Loader2,
  ExternalLink,
  BookOpen,
  Clock,
  MapPin,
  Zap,
  X,
  List,
  Layers,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
} from "recharts";

/**
 * DnDSpellsPage.jsx
 *
 * - Uses DnD 5e API:
 *   - list: https://www.dnd5eapi.co/api/spells
 *   - detail: https://www.dnd5eapi.co/api/spells/{index}
 *
 * - Layout and visual style follow the NewsApiPage / Revolyx theme:
 *   - Header with search + animated suggestions
 *   - Main content area shows selected spell details
 *   - Right sidebar shows developer tools, endpoints and quick facts
 *   - Large professional UI, dark/light theme support
 *   - No localStorage saving (per request)
 */

// -------------- CONFIG --------------
const LIST_ENDPOINT = "https://www.dnd5eapi.co/api/spells";
const DETAIL_ENDPOINT = (idx) => `https://www.dnd5eapi.co/api/spells/${encodeURIComponent(idx)}`;

// -------------- HELPERS --------------
const prettyJSON = (o) => JSON.stringify(o, null, 2);

function groupByLevel(spells = []) {
  // produce array of { level: "0", count: 10 } sorted by level numeric
  const map = {};
  for (const s of spells) {
    const lvl = String(s.level ?? "0");
    map[lvl] = (map[lvl] || 0) + 1;
  }
  return Object.keys(map)
    .map((k) => ({ level: k, count: map[k] }))
    .sort((a, b) => Number(a.level) - Number(b.level));
}

// -------------- COMPONENT --------------
export default function DnDSpellsPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // dataset
  const [spellsList, setSpellsList] = useState(null); // null = loading, [] = loaded
  const [rawList, setRawList] = useState(null);

  // search / suggestions
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestRef = useRef(null);

  // selected spell
  const [selected, setSelected] = useState(null); // spell detail object
  const [rawDetail, setRawDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // UI
  const [showRaw, setShowRaw] = useState(false);
  const [docOpen, setDocOpen] = useState(false);

  // chart colors
  const chartFill = isDark ? "#60a5fa" : "#2563eb";
  const gridColor = isDark ? "#17202a" : "#e6e6e6";
  
  const levelCacheRef = useRef({}); // { index: level }

  // fetch spells list once
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setSpellsList(null);
        const res = await fetch(LIST_ENDPOINT);
        if (!res.ok) {
          showToast("error", `Failed to fetch spells list (${res.status})`);
          setSpellsList([]);
          return;
        }
        const json = await res.json();
        if (!mounted) return;
        // json.results is array of { index, name, url }
        const results = Array.isArray(json.results) ? json.results : [];
        setSpellsList(results);
        setRawList(json);
        // preload first spell detail to show default content (first result)
        if (results.length > 0) {
          loadSpellDetail(results[0].index);
        }
      } catch (err) {
        console.error("load spells list err", err);
        showToast("error", "Failed to load spells list");
        setSpellsList([]);
      }
    }
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // local search in the loaded list
  function doLocalSearch(q) {
    if (!spellsList || !q.trim()) return [];
    const low = q.trim().toLowerCase();
    // prefix prioritized
    const prefix = [];
    const contains = [];
    for (const s of spellsList) {
      const n = (s.name || "").toLowerCase();
      if (n.startsWith(low)) prefix.push(s);
      else if (n.includes(low)) contains.push(s);
    }
    return [...prefix.slice(0, 8), ...contains.slice(0, 12)];
  }

  // debounce suggestions
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    setLoadingSuggest(true);
    if (suggestRef.current) clearTimeout(suggestRef.current);
    suggestRef.current = setTimeout(() => {
      setSuggestions(doLocalSearch(v));
      setLoadingSuggest(false);
    }, 160);
  }

  // load a spell's detail by index
  async function loadSpellDetail(index) {
    if (!index) return;
    setLoadingDetail(true);
    try {
      const url = DETAIL_ENDPOINT(index);
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Failed to fetch detail (${res.status})`);
        setSelected(null);
        setRawDetail(null);
        setLoadingDetail(false);
        return;
      }
      const json = await res.json();
      setSelected(json);
      setRawDetail(json);
      showToast("success", `Loaded: ${json.name}`);
    } catch (err) {
      console.error("load detail err", err);
      showToast("error", "Failed to fetch spell detail");
      setSelected(null);
      setRawDetail(null);
    } finally {
      setLoadingDetail(false);
      setShowSuggest(false);
    }
  }

  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query.trim()) return;
    // prefer exact match
    const q = query.trim().toLowerCase();
    const exact = (spellsList || []).find((s) => (s.name || "").toLowerCase() === q || s.index === q);
    if (exact) {
      loadSpellDetail(exact.index);
      setQuery(exact.name);
      setShowSuggest(false);
      return;
    }
    const picks = doLocalSearch(query);
    if (picks && picks.length > 0) {
      loadSpellDetail(picks[0].index);
      setQuery(picks[0].name);
      setShowSuggest(false);
      return;
    }
    showToast("info", "No matching spell found");
  }

  // developer utilities
  function copyEndpointRef() {
    navigator.clipboard.writeText(LIST_ENDPOINT);
    showToast("success", "Copied spells list endpoint");
  }
  function copyDetailEndpoint(index) {
    if (!index) {
      showToast("info", "No spell selected");
      return;
    }
    navigator.clipboard.writeText(DETAIL_ENDPOINT(index));
    showToast("success", "Copied spell detail endpoint");
  }
  function copyJSON(payload) {
    navigator.clipboard.writeText(prettyJSON(payload || selected || rawList || {}));
    showToast("success", "Copied JSON");
  }
  function downloadJSON(payload, filename = "spells.json") {
    const p = payload || selected || rawList || {};
    const blob = new Blob([prettyJSON(p)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  // chart: distribution of spells by level
  const levelDistribution = useMemo(() => {
    if (!spellsList) return [];
    // need levels. spellsList doesn't include level; we can approximate by fetching details for first N? that's heavy.
    // Instead produce distribution from currently loaded selected (single) + summary fallback: show counts by word "cantrip" vs leveled using detail cache.
    // To keep professional, we compute distribution by fetching details for first 200 spells in background (non-blocking).
    // We'll compute a simple in-memory cache for levels as they are fetched.
    return groupByLevel(spellsListWithLevelCache(spellsList));
    // Note: spellsListWithLevelCache will be a helper below.
  }, [spellsList]);

  // We'll maintain a small cache of fetched levels to produce a meaningful chart progressively.
 // { index: level }
  function spellsListWithLevelCache(list) {
    // if no cache entries, return original list with level undefined (level = 0)
    // Map to objects with level property
    return list.map((s) => {
      const lvl = levelCacheRef.current[s.index];
      return { ...s, level: typeof lvl !== "undefined" ? lvl : 0 };
    });
  }

  // progressive background fetch of levels for first 200 spells to improve chart accuracy
  useEffect(() => {
    if (!spellsList || spellsList.length === 0) return;
    let cancelled = false;
    const toFetch = spellsList.slice(0, 200).map((s) => s.index);
    async function fetchLevels() {
      for (const idx of toFetch) {
        if (cancelled) return;
        if (typeof levelCacheRef.current[idx] !== "undefined") continue;
        try {
          const res = await fetch(DETAIL_ENDPOINT(idx));
          if (!res.ok) continue;
          const json = await res.json();
          levelCacheRef.current[idx] = json.level ?? 0;
          // trigger small state update by setting a shallow copy to force re-render for chart
          setSpellsList((prev) => (prev ? [...prev] : prev));
          // small delay to avoid hammering CDN
          await new Promise((r) => setTimeout(r, 60));
        } catch (err) {
          // ignore individual failures
        }
      }
    }
    fetchLevels();
    return () => {
      cancelled = true;
    };
  }, [spellsList]);

  // derived chart data updated from cache
  const chartData = useMemo(() => {
    if (!spellsList) return [];
    const arr = spellsListWithLevelCache(spellsList);
    return groupByLevel(arr).map((d) => ({ level: d.level, count: d.count }));
  }, [spellsList]);

  // small UI helpers
  const cardBg = isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200";
  const subtle = isDark ? "text-zinc-300" : "text-zinc-600";

  // On mount, set default selected spell to "acid-arrow" or first item
const defaultLoadedRef = useRef(false);

useEffect(() => {
  if (defaultLoadedRef.current) return; // STOP repeated calls
  if (!spellsList || spellsList.length === 0) return;

  const prefer = spellsList.find((s) => s.index === "acid-arrow") || spellsList[0];

  if (prefer) {
    defaultLoadedRef.current = true;     // mark as loaded
    loadSpellDetail(prefer.index);
    setQuery(prefer.name);
  }
}, [spellsList]);


  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Revolyx · D&D 5e Spells</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 max-w-xl">
            Browse the official D&D 5th Edition spells list. Search, preview full spell details, and inspect API responses. Default spell loaded on first visit.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(e); }} className={clsx("relative flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="w-4 h-4 text-gray-500 dark:text-gray-300" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search spells (e.g. Fireball, Cure Wounds, Acid Arrow)"
              className="border-none outline-none py-1 bg-transparent px-0 w-full"
              onFocus={() => { setShowSuggest(true); setSuggestions(doLocalSearch(query)); }}
            />
            <Button type="submit" className="cursor-pointer" variant="outline">Search</Button>

            {/* suggestion dropdown */}
            <AnimatePresence>
              {showSuggest && suggestions && suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={clsx("absolute left-2 right-2 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
                >
                  {loadingSuggest && <li className="px-4 py-3 text-sm opacity-60">Searching…</li>}
                  {suggestions.map((s) => (
                    <li key={s.index} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { loadSpellDetail(s.index); setQuery(s.name); setShowSuggest(false); }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md flex items-center justify-center bg-gradient-to-br from-primary/10 to-slate-100 dark:from-primary/20 dark:to-zinc-800">
                          <List className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs opacity-60">Index: {s.index}</div>
                        </div>
                        <div className="text-xs opacity-60">Spell</div>
                      </div>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </form>
        </div>
      </header>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Main center like News page */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", cardBg)}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>Spell Details</CardTitle>
                <div className="text-xs opacity-70">{selected ? selected.name : "No spell selected"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => copyEndpointRef()}><Copy /></Button>
                <Button variant="outline" onClick={() => copyDetailEndpoint(selected?.index)}><Copy /></Button>
                <Button variant="outline" onClick={() => copyJSON(selected || rawList)}><Copy /></Button>
                <Button variant="outline" onClick={() => downloadJSON(selected || rawList, `${(selected?.index || "spells")}.json`)}><Download /></Button>
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><Info /> {showRaw ? "Hide Raw" : "Show Raw"}</Button>
              </div>
            </CardHeader>

            <CardContent>
              {spellsList === null || spellsList === undefined ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selected ? (
                <div className="py-12 text-center text-sm opacity-60">No spell loaded — use the search or suggestions to pick one.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* left: basics */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="mb-3 flex items-start gap-3">
                      <div className="w-14 h-14 rounded-md flex items-center justify-center bg-gradient-to-br from-primary/10 to-slate-100 dark:from-primary/20 dark:to-zinc-800">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{selected.name}</div>
                        <div className="text-xs opacity-60">Index: {selected.index}</div>
                        <div className="text-xs opacity-60">School: {selected.school?.name || "—"}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Level</div>
                        <div className="font-medium">{selected.level === 0 ? "Cantrip" : selected.level}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Casting Time</div>
                        <div className="font-medium flex items-center gap-2"><Clock className="w-4 h-4" />{selected.casting_time || "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Range</div>
                        <div className="font-medium flex items-center gap-2"><MapPin className="w-4 h-4" />{selected.range || "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Components</div>
                        <div className="font-medium flex items-center gap-2"><Zap className="w-4 h-4" />{Array.isArray(selected.components) ? selected.components.join(", ") : (selected.components || "—")}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Duration</div>
                        <div className="font-medium">{selected.duration || "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Ritual</div>
                        <div className="font-medium">{selected.ritual ? "Yes" : "No"}</div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm">
                      <div className="font-medium mb-1">Classes</div>
                      <div className="text-xs opacity-70">{(selected.classes || []).map((c) => c.name).join(", ") || "—"}</div>
                    </div>
                  </div>

                  {/* middle: long description, higher visibility */}
                  <div className={clsx("p-4 rounded-xl border md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold">Description & Effects</div>
                      <div className="text-xs opacity-60">Detailed info</div>
                    </div>

                    <div className="prose max-w-none dark:prose-invert">
                      {/* The API returns description as 'desc' array and 'higher_level' array */}
                      {Array.isArray(selected.desc) ? (
                        selected.desc.map((p, i) => <p key={i} className="text-sm">{p}</p>)
                      ) : (
                        <p className="text-sm opacity-60">No description available</p>
                      )}

                      {selected.higher_level && selected.higher_level.length > 0 && (
                        <>
                          <Separator className="my-4" />
                          <div className="text-sm font-medium mb-2">At Higher Levels</div>
                          {selected.higher_level.map((p, i) => <p key={i} className="text-sm">{p}</p>)}
                        </>
                      )}

                      <Separator className="my-4" />

                      <div className="text-sm">
                        <div className="font-medium">Material (if any)</div>
                        <div className="text-xs opacity-70">{selected.material || "—"}</div>
                      </div>

                      <div className="mt-3 text-sm">
                        <div className="font-medium">School & Details</div>
                        <div className="text-xs opacity-70">
                          {selected.school?.name || "—"} • {selected.level === 0 ? "Cantrip" : `Level ${selected.level}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* raw JSON */}
            <AnimatePresence>
              {showRaw && (rawDetail || rawList) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <ScrollArea style={{ maxHeight: 360 }}>
                    <pre className="text-xs whitespace-pre-wrap">{prettyJSON(rawDetail || rawList)}</pre>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right sidebar: developer tools + quick index list */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", cardBg)}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Quick Index</div>
              <div className="text-xs opacity-60">API & stats</div>
            </div>

            <div className="text-sm opacity-70 space-y-2">
              <div><strong>Total spells:</strong> {Array.isArray(spellsList) ? spellsList.length : "—"}</div>
              <div><strong>Default endpoint:</strong> <span className="opacity-60">/api/spells</span></div>
              <div><strong>Detail endpoint:</strong> <span className="opacity-60">/api/spells/{`{index}`}</span></div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Distribution</div>
              <div className="text-xs opacity-60">By level (partial)</div>
            </div>

            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis dataKey="level" stroke={isDark ? "#ddd" : "#333"} />
                  <YAxis stroke={isDark ? "#ddd" : "#333"} allowDecimals={false} />
                  <ReTooltip contentStyle={{ background: isDark ? "#0b1220" : "#fff", borderColor: gridColor }} />
                  <Bar dataKey="count" fill={chartFill} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs opacity-60 mt-2">Chart updates progressively as details are fetched in background to compute accurate levels.</div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Developer</div>
              <div className="text-xs opacity-60">Tools</div>
            </div>

            <div className="space-y-2">
              <Button variant="outline" onClick={() => copyEndpointRef()}><Copy /> Copy List Endpoint</Button>
              <Button variant="outline" onClick={() => copyDetailEndpoint(selected?.index)}><Copy /> Copy Detail Endpoint</Button>
              <Button variant="outline" onClick={() => copyJSON(selected)}><Copy /> Copy JSON</Button>
              <Button variant="outline" onClick={() => downloadJSON(selected, `${(selected?.index || "spell")}.json`)}><Download /> Download JSON</Button>
              <Button variant="ghost" onClick={() => setDocOpen(true)}><ExternalLink /> API Docs</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick Tips</div>
            <ul className="text-sm opacity-70 list-disc list-inside space-y-2">
              <li>Search by spell name or index (use exact name for precise match).</li>
              <li>Click suggestions to load full details.</li>
              <li>Chart populates progressively; detail endpoint provides 'level'.</li>
            </ul>
          </div>
        </aside>
      </main>

      {/* API Docs modal */}
      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>D&D 5e API — Spells</DialogTitle>
          </DialogHeader>

          <div style={{ padding: 20 }}>
            <div className="text-sm mb-3">
              <strong>List endpoint:</strong> <code className="opacity-70">{LIST_ENDPOINT}</code>
            </div>
            <div className="text-sm mb-3">
              <strong>Detail endpoint:</strong> <code className="opacity-70">https://www.dnd5eapi.co/api/spells/{`{index}`}</code>
            </div>

            <div className="text-sm">
              The list endpoint returns an array of spells with fields: <code>index</code>, <code>name</code>, <code>url</code>.
              Use the <code>index</code> to fetch the full spell object which includes:
              <ul className="list-disc list-inside mt-2">
                <li><code>name</code>, <code>index</code>, <code>desc</code> (array), <code>higher_level</code> (array)</li>
                <li><code>range</code>, <code>components</code>, <code>material</code>, <code>ritual</code>, <code>duration</code></li>
                <li><code>concentration</code>, <code>casting_time</code>, <code>level</code>, <code>school</code>, <code>classes</code></li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Data: DnD 5e API (dnd5eapi.co)</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDocOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => { window.open("https://www.dnd5eapi.co/docs/", "_blank"); }}>Open Docs <ExternalLink className="ml-2" /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
