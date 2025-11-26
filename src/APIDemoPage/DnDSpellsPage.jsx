// src/pages/DnDSpellsPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Copy as CopyIcon,
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
  Menu,
  Check,
  GitBranch,
  Tag,
  Users,
  FileText,
  Bookmark,
  ArrowDownCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";
// If your project includes shadcn's Sheet component, import it; otherwise Dialog is used as fallback.
// Adjust import path if your project differs.
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
 * DnDSpellsPage.jsx — improved UI/UX, mobile sheet sidebar, animated copy, better preview layout
 */

// -------------- CONFIG --------------
const LIST_ENDPOINT = "https://www.dnd5eapi.co/api/spells";
const DETAIL_ENDPOINT = (idx) => `https://www.dnd5eapi.co/api/spells/${encodeURIComponent(idx)}`;

// -------------- HELPERS --------------
const prettyJSON = (o) => JSON.stringify(o, null, 2);

function groupByLevel(spells = []) {
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
      window.matchMedia &&
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
  const [sheetOpen, setSheetOpen] = useState(false); // mobile sidebar

  // copy animation state keyed by action name (e.g., 'list', 'detail', 'json')
  const [copyState, setCopyState] = useState({}); // { key: boolean }

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
        const results = Array.isArray(json.results) ? json.results : [];
        setSpellsList(results);
        setRawList(json);
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

  // developer utilities with animated copy feedback
  function animateCopy(key = "default") {
    setCopyState((s) => ({ ...s, [key]: true }));
    setTimeout(() => setCopyState((s) => ({ ...s, [key]: false })), 1600);
  }

  async function copyEndpointRef() {
    try {
      await navigator.clipboard.writeText(LIST_ENDPOINT);
      animateCopy("list");
      showToast("success", "Copied spells list endpoint");
    } catch (err) {
      showToast("error", "Clipboard not available");
    }
  }
  async function copyDetailEndpoint(index) {
    if (!index) {
      showToast("info", "No spell selected");
      return;
    }
    try {
      await navigator.clipboard.writeText(DETAIL_ENDPOINT(index));
      animateCopy("detail");
      showToast("success", "Copied spell detail endpoint");
    } catch (err) {
      showToast("error", "Clipboard not available");
    }
  }
  async function copyJSON(payload, key = "json") {
    try {
      await navigator.clipboard.writeText(prettyJSON(payload || selected || rawList || {}));
      animateCopy(key);
      showToast("success", "Copied JSON");
    } catch (err) {
      showToast("error", "Clipboard not available");
    }
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

  // chart: distribution of spells by level (uses cached levels where available)
  function spellsListWithLevelCache(list) {
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
          setSpellsList((prev) => (prev ? [...prev] : prev));
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
    if (defaultLoadedRef.current) return;
    if (!spellsList || spellsList.length === 0) return;
    const prefer = spellsList.find((s) => s.index === "acid-arrow") || spellsList[0];
    if (prefer) {
      defaultLoadedRef.current = true;
      loadSpellDetail(prefer.index);
      setQuery(prefer.name);
    }
  }, [spellsList]);

  // helpers for display
  function levelLabel(level) {
    if (typeof level === "undefined" || level === null) return "—";
    return Number(level) === 0 ? "Cantrip" : `Level ${level}`;
  }

  function renderBadge(text, IconComp) {
    return (
      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full border text-xs select-none" style={{ minWidth: 64 }}>
        {IconComp && <IconComp className="w-3.5 h-3.5 opacity-80" />}
        <span className="font-medium">{text}</span>
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 overflow-hidden max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="mb-4 md:mb-6 flex flex-wrap items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Mobile menu / sheet trigger */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button aria-label="Open menu" className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition cursor-pointer">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent className={clsx("w-[320px] p-4", isDark ? "bg-black/90" : "bg-white")}>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    <span>Menu & Tools</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-sm font-semibold mb-2">Quick Index</div>
                    <div className="text-sm opacity-70 space-y-1">
                      <div><strong>Total spells:</strong> {Array.isArray(spellsList) ? spellsList.length : "—"}</div>
                      <div><strong>Default endpoint:</strong> <code className="opacity-60">/api/spells</code></div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold">Developer</div>
                      <div className="text-xs opacity-60">Tools</div>
                    </div>
                    <div className="space-y-2">
                      <Button className="w-full cursor-pointer" variant="outline" onClick={() => { copyEndpointRef(); }}>
                        {copyState["list"] ? <Check className="w-4 h-4 mr-2 animate-pulse" /> : <CopyIcon className="w-4 h-4 mr-2" />} Copy List
                      </Button>
                      <Button className="w-full cursor-pointer" variant="outline" onClick={() => { copyDetailEndpoint(selected?.index); }}>
                        {copyState["detail"] ? <Check className="w-4 h-4 mr-2 animate-pulse" /> : <CopyIcon className="w-4 h-4 mr-2" />} Copy Detail
                      </Button>
                      <Button className="w-full cursor-pointer" variant="outline" onClick={() => copyJSON(selected, "json_mobile")}>
                        {copyState["json_mobile"] ? <Check className="w-4 h-4 mr-2 animate-pulse" /> : <CopyIcon className="w-4 h-4 mr-2" />} Copy JSON
                      </Button>
                      <Button className="w-full cursor-pointer" variant="outline" onClick={() => downloadJSON(selected, `${(selected?.index || "spell")}.json`)}>
                        <Download className="w-4 h-4 mr-2" /> Download JSON
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">Revolyx · D&D 5e Spells</h1>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground max-w-lg">
              Browse the official D&D 5th Edition spells list — search, preview spell details, inspect API responses. Mobile-first and accessible.
            </p>
          </div>
        </div>

        {/* Desktop search + actions */}
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
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={clsx("absolute left-2 right-2 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
                >
                  {loadingSuggest && <li className="px-4 py-3 text-sm opacity-60">Searching…</li>}
                  {suggestions.map((s) => (
                    <li
                      key={s.index}
                      className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                      onClick={() => { loadSpellDetail(s.index); setQuery(s.name); setShowSuggest(false); }}
                    >
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
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main center */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", cardBg)}>
            <CardHeader className={clsx("p-4 md:p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-md flex items-center justify-center bg-gradient-to-br from-primary/10 to-slate-100 dark:from-primary/20 dark:to-zinc-800">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900", "text-base md:text-lg")}>
                    Spell Details
                  </CardTitle>
                  <div className="text-xs opacity-60 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> {selected ? selected.name : "No spell selected"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* small action icons (desktop) */}
                <div className="hidden md:flex items-center gap-2">
                  {/* <button className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition cursor-pointer" title="Copy list endpoint" onClick={() => copyEndpointRef()}>
                    {copyState["list"] ? <Check className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                  </button>

                  <button className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition cursor-pointer" title="Copy detail endpoint" onClick={() => copyDetailEndpoint(selected?.index)}>
                    {copyState["detail"] ? <Check className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                  </button>

                  <button className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition cursor-pointer" title="Copy JSON" onClick={() => copyJSON(selected, "json")}>
                    <AnimatePresence mode="wait">
                      {copyState["json"] ? (
                        <motion.span key="ok" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                          <Check className="w-4 h-4 text-green-400" />
                        </motion.span>
                      ) : (
                        <motion.span key="copy" initial={{ scale: 0.98 }} animate={{ scale: 1 }} exit={{ opacity: 0 }}>
                          <CopyIcon className="w-4 h-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button> */}

                  <button className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition cursor-pointer" title="Download JSON" onClick={() => downloadJSON(selected || rawList, `${(selected?.index || "spells")}.json`)}>
                    <Download className="w-4 h-4" />
                  </button>

                  <button className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition cursor-pointer flex items-center gap-2" onClick={() => setShowRaw((s) => !s)}>
                    <Info className="w-4 h-4" /> <span className="text-xs opacity-70">{showRaw ? "Hide Raw" : "Show Raw"}</span>
                  </button>
                </div>

                {/* mobile quick actions */}
                <div className="md:hidden flex items-center gap-2">
                  <button className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition cursor-pointer" onClick={() => copyJSON(selected, "json_mobile")}>
                    {copyState["json_mobile"] ? <Check className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                  </button>
                  <button className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition cursor-pointer" onClick={() => downloadJSON(selected || rawList, `${(selected?.index || "spells")}.json`)}>
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition cursor-pointer" onClick={() => setDocOpen(true)}>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 md:p-6">
              {/* loading */}
              {spellsList === null ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selected ? (
                <div className="py-12 text-center text-sm opacity-60">No spell loaded — use the search or suggestions to pick one.</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* LEFT: summary card */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md flex items-center justify-center bg-gradient-to-br from-primary/10 to-slate-100 dark:from-primary/20 dark:to-zinc-800">
                        <Bookmark className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{selected.name}</div>
                        <div className="text-xs opacity-60">Index: {selected.index}</div>
                        <div className="text-xs opacity-60 mt-1">{selected.school?.name || "—"} • {levelLabel(selected.level)}</div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-md border flex items-center gap-2 cursor-default">
                        <Clock className="w-4 h-4" /> <div className="text-xs"><div className="opacity-60">Casting</div><div className="font-medium">{selected.casting_time || "—"}</div></div>
                      </div>

                      <div className="p-2 rounded-md border flex items-center gap-2 cursor-default">
                        <MapPin className="w-4 h-4" /> <div className="text-xs"><div className="opacity-60">Range</div><div className="font-medium">{selected.range || "—"}</div></div>
                      </div>

                      <div className="p-2 rounded-md border flex items-center gap-2 cursor-default">
                        <Zap className="w-4 h-4" /> <div className="text-xs"><div className="opacity-60">Components</div><div className="font-medium">{Array.isArray(selected.components) ? selected.components.join(", ") : (selected.components || "—")}</div></div>
                      </div>

                      <div className="p-2 rounded-md border flex items-center gap-2 cursor-default">
                        <Layers className="w-4 h-4" /> <div className="text-xs"><div className="opacity-60">Duration</div><div className="font-medium">{selected.duration || "—"}</div></div>
                      </div>

                      <div className="p-2 col-span-2 rounded-md border flex items-center gap-2 cursor-default">
                        <Users className="w-4 h-4" /> <div className="text-xs"><div className="opacity-60">Classes</div><div className="font-medium">{(selected.classes || []).map((c) => c.name).join(", ") || "—"}</div></div>
                      </div>

                      <div className="p-2 rounded-md border flex items-center gap-2 cursor-default">
                        <Tag className="w-4 h-4" /> <div className="text-xs"><div className="opacity-60">Ritual</div><div className="font-medium">{selected.ritual ? "Yes" : "No"}</div></div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm">
                      <div className="text-xs opacity-70">Material</div>
                      <div className="mt-1 text-xs">{selected.material || "—"}</div>
                    </div>
                  </div>

                  {/* MIDDLE & RIGHT: main description & actions */}
                  <div className="md:col-span-2 space-y-4">
                    <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Description & Effects</div>
                            <div className="text-xs opacity-60">Detailed info</div>
                          </div>

                          <div className="mt-3 space-y-3 prose max-w-none dark:prose-invert">
                            <ScrollArea style={{ maxHeight: 260 }}>
                              {Array.isArray(selected.desc) ? selected.desc.map((p, i) => <p key={i} className="text-sm">{p}</p>) : <p className="text-sm opacity-60">No description available</p>}
                              {selected.higher_level && selected.higher_level.length > 0 && (
                                <>
                                  <Separator className="my-3" />
                                  <div className="text-sm font-medium mb-2 flex items-center gap-2"><ArrowDownCircle className="w-4 h-4" /> At Higher Levels</div>
                                  {selected.higher_level.map((p, i) => <p key={i} className="text-sm">{p}</p>)}
                                </>
                              )}
                            </ScrollArea>
                          </div>
                        </div>

                        {/* quick action column */}
                        <div className="hidden lg:flex flex-col items-end gap-2 w-40">
                          <div className="text-xs opacity-60">Quick Actions</div>

                          <Button className="w-full cursor-pointer" variant="ghost" onClick={() => { copyJSON(selected, "json_side"); }}>
                            {copyState["json_side"] ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <CopyIcon className="w-4 h-4 mr-2" />} Copy JSON
                          </Button>

                          <Button className="w-full cursor-pointer" variant="outline" onClick={() => downloadJSON(selected, `${(selected?.index || "spell")}.json`)}>
                            <Download className="w-4 h-4 mr-2" /> Download
                          </Button>

                          <Button className="w-full cursor-pointer" variant="outline" onClick={() => { setDocOpen(true); }}>
                            <ExternalLink className="w-4 h-4 mr-2" /> API Docs
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* RAW panel */}
                    <AnimatePresence>
                      {showRaw && (rawDetail || rawList) && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={clsx("rounded-xl border overflow-hidden", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                          <div className="p-3 border-b text-xs font-medium flex items-center justify-between">
                            <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Raw JSON</div>
                            <div className="text-xs opacity-60">{rawDetail ? "Detail" : "List"}</div>
                          </div>
                          <ScrollArea style={{ maxHeight: 260 }}>
                            <pre className="text-xs whitespace-pre-wrap p-3">{prettyJSON(rawDetail || rawList)}</pre>
                          </ScrollArea>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Chart & footer area */}
            <div className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">Distribution</div>
                <div className="text-xs opacity-60">By level (partial)</div>
              </div>
              <div style={{ width: "100%", height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                    <XAxis dataKey="level" stroke={isDark ? "#ddd" : "#333"} />
                    <YAxis stroke={isDark ? "#ddd" : "#333"} allowDecimals={false} />
                    <ReTooltip contentStyle={{ background: isDark ? "#0b1220" : "#fff", borderColor: gridColor ,borderRadius:"10px"}} />
                    <Bar dataKey="count" fill={chartFill} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs opacity-60 mt-2">Chart updates progressively as details are fetched.</div>
            </div>
          </Card>
        </section>

        {/* Right sidebar: developer tools + quick index (desktop) */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit hidden lg:block", cardBg)}>
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
              <div className="text-sm font-semibold">Developer</div>
              <div className="text-xs opacity-60">Tools</div>
            </div>

            <div className="space-y-2">
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => copyEndpointRef()}>
                {copyState["list"] ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <CopyIcon className="w-4 h-4 mr-2" />} Copy List Endpoint
              </Button>
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => copyDetailEndpoint(selected?.index)}>
                {copyState["detail"] ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <CopyIcon className="w-4 h-4 mr-2" />} Copy Detail Endpoint
              </Button>
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => copyJSON(selected)}>
                {copyState["json"] ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <CopyIcon className="w-4 h-4 mr-2" />} Copy JSON
              </Button>
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => downloadJSON(selected, `${(selected?.index || "spell")}.json`)}>
                <Download className="w-4 h-4 mr-2" /> Download JSON
              </Button>
              <Button className="w-full cursor-pointer" variant="ghost" onClick={() => setDocOpen(true)}><ExternalLink /> API Docs</Button>
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
