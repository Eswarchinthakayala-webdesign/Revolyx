// src/pages/GbifSpeciesProPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Menu,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  ImageIcon,
  List,
  MapPin,
  BookOpen,
  Globe,
  Layers,
  Calendar,
  Hash,
  Database as LayersStack,
  RefreshCw,
  Check,
  ChevronRight,
  ChevronDown,
  Award,
  Info,
  Users,
  Tag,
  Layers as LayersIcon,
  FileText
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { showToast } from "../lib/ToastHelper";
import { useTheme } from "@/components/theme-provider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ---------- Constants & sample default ---------- */
const BASE = "https://api.gbif.org/v1/species";
const SAMPLE_DEFAULT = {
  key: 8,
  nubKey: 8,
  nameKey: 130323256,
  taxonID: "gbif:8",
  sourceTaxonKey: 170809368,
  kingdom: "Viruses",
  kingdomKey: 8,
  datasetKey: "d7dddbf4-2cf0-4f39-9b2a-bb099caae36c",
  constituentKey: "d7dddbf4-2cf0-4f39-9b2a-bb099caae36c",
  scientificName: "Viruses",
  canonicalName: "Viruses",
  vernacularName: "Viruses",
  authorship: "",
  nameType: "SCIENTIFIC",
  rank: "KINGDOM",
  origin: "SOURCE",
  taxonomicStatus: "ACCEPTED",
  nomenclaturalStatus: [],
  remarks: "",
  numDescendants: 19564,
  lastCrawled: "2023-08-22T23:20:59.545+00:00",
  lastInterpreted: "2023-08-22T23:18:56.817+00:00",
  issues: []
};

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function formatDateISO(iso) {
  try {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "—";
  }
}

function primaryTitle(obj) {
  if (!obj) return "No selection";
  return obj.canonicalName || obj.scientificName || obj.vernacularName || `key:${obj.key}`;
}

function classificationList(d) {
  if (!d) return [];
  if (Array.isArray(d.classification) && d.classification.length > 0) {
    return d.classification;
  }
  const order = ["kingdom", "phylum", "class", "order", "family", "genus", "species"];
  return order
    .map((rank) => {
      if (d[rank]) return { rank, name: d[rank] };
      return null;
    })
    .filter(Boolean);
}

function randomSamplesFromSeed(seed = SAMPLE_DEFAULT, n = 10) {
  return Array.from({ length: n }).map((_, i) => {
    const name = `${seed.canonicalName} ${i === 0 ? "" : `sp.${i}`}`.trim();
    const key = seed.key + (i + 1) * 11 + Math.floor(Math.random() * 1000);
    return {
      ...seed,
      key,
      canonicalName: name,
      scientificName: name,
      vernacularName: i === 0 ? seed.vernacularName : `${seed.vernacularName} ${i}`,
      rank: i % 2 === 0 ? "SPECIES" : "GENUS",
      kingdom: i % 3 === 0 ? "Viruses" : i % 3 === 1 ? "Animals" : "Plants",
      numDescendants: seed.numDescendants + i * 10,
      lastCrawled: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString()
    };
  });
}

/* ---------- Small UI pieces ---------- */
function FirstLetterAvatar({ name, size = 56, className = "" }) {
  const initial = name ? String(name).charAt(0).toUpperCase() : "?";
  return (
    <div
      className={clsx(
        "rounded-md flex items-center justify-center font-semibold select-none shadow-md border",
        "text-lg",
        "flex-shrink-0",
        className
      )}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(16,185,129,0.08))",
        borderColor: "rgba(0,0,0,0.06)"
      }}
    >
      <span style={{ fontSize: Math.round(size / 2.6) }}>{initial}</span>
    </div>
  );
}

/* ---------- Main component ---------- */
export default function GbifSpeciesProPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [query, setQuery] = useState("Viruses");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [selected, setSelected] = useState(SAMPLE_DEFAULT);
  const [detail, setDetail] = useState(SAMPLE_DEFAULT);
  const [rawResp, setRawResp] = useState(SAMPLE_DEFAULT);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // sidebar / mobile sheet
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSamples, setSidebarSamples] = useState(() => randomSamplesFromSeed(SAMPLE_DEFAULT, 10));

  // copy animation state
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef(null);

  const debounceRef = useRef(null);

  useEffect(() => {
    setSelected(SAMPLE_DEFAULT);
    setDetail(SAMPLE_DEFAULT);
    setRawResp(SAMPLE_DEFAULT);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  /* ---------- API calls ---------- */
  async function searchSpecies(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const url = `${BASE}?q=${encodeURIComponent(q)}&limit=12`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Search failed (${res.status})`);
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      const items = json.results || [];
      setSuggestions(items);
      setRawResp(json);
      if (items && items.length > 0) {
        setSelected(items[0]);
        if (items[0].key) fetchSpeciesDetail(items[0].key);
      } else {
        // no results: clear detail
        setSelected(null);
        setDetail(null);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Search failed");
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  async function fetchSpeciesDetail(key) {
    if (!key) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const url = `${BASE}/${key}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Detail fetch failed (${res.status})`);
        setDetail(null);
        setRawResp(null);
        return;
      }
      const json = await res.json();
      setDetail(json);
      setRawResp(json);
    } catch (err) {
      console.error(err);
      showToast("error", "Detail fetch failed");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  /* ---------- Handlers ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchSpecies(v);
    }, 350);
  }

  function onSubmitSearch(e) {
    e?.preventDefault?.();
    searchSpecies(query);
    setShowSuggest(true);
  }

  function selectSuggestion(item) {
    setSelected(item);
    setShowSuggest(false);
    if (item?.key) {
      fetchSpeciesDetail(item.key);
    } else {
      setDetail(item);
      setRawResp(item);
    }
  }

  function openGbif(key) {
    if (!key) return showToast("info", "No GBIF key available");
    window.open(`https://www.gbif.org/species/${key}`, "_blank");
  }

  function openOccurrences(key) {
    if (!key) return showToast("info", "No GBIF key available");
    window.open(`https://www.gbif.org/occurrence/search?taxon_key=${key}`, "_blank");
  }

  function copyJSON() {
    const payload = detail || selected || rawResp;
    if (!payload) return showToast("info", "Nothing to copy");
    try {
      navigator.clipboard.writeText(prettyJSON(payload));
      setCopied(true);
      showToast("success", "Copied JSON to clipboard");
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to copy");
    }
  }

  function downloadJSON() {
    const payload = detail || selected || rawResp;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    const name = (payload.canonicalName || payload.scientificName || "gbif").replace(/\s+/g, "_");
    a.href = URL.createObjectURL(blob);
    a.download = `gbif_${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Download started");
  }

  function refreshSidebar() {
    setSidebarSamples(randomSamplesFromSeed(SAMPLE_DEFAULT, 10));
    showToast("success", "Sidebar refreshed");
  }

  function refreshSearchOrDetail() {
    if (selected?.key) fetchSpeciesDetail(selected.key);
    else searchSpecies(query);
  }

  function resetToSample() {
    setSelected(SAMPLE_DEFAULT);
    setDetail(SAMPLE_DEFAULT);
    setRawResp(SAMPLE_DEFAULT);
    showToast("info", "Reset to sample");
  }

  /* ---------- UI helpers ---------- */
  const surface = isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200";
  const inner = isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200";

  /* ---------- Render ---------- */
  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-9xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Mobile sidebar trigger */}
          <div className="md:hidden">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2 cursor-pointer" title="Open samples"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <LayersStack />
                    <div className="text-sm font-semibold">Samples</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={refreshSidebar} className="cursor-pointer"><RefreshCw /></Button>
                  </div>
                </div>
                <Separator />
                <ScrollArea style={{ height: "70vh" }} className="mt-3">
                  <div className="space-y-2 p-2">
                    {sidebarSamples.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => {
                          selectSuggestion(s);
                          setSidebarOpen(false);
                        }}
                        className="w-full text-left p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 flex items-center gap-3 cursor-pointer"
                      >
                        <FirstLetterAvatar name={s.canonicalName} size={44} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{s.canonicalName}</div>
                          <div className="text-xs opacity-60 truncate">{s.rank} • {s.kingdom}</div>
                        </div>
                        <ChevronRight className="opacity-60" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">GBIF Pro</h1>
            <div className="text-xs opacity-60 hidden md:block">Species explorer — search taxa, inspect metadata, export JSON</div>
            <div className="text-xs opacity-60 md:hidden">Search taxa • inspect metadata • export JSON</div>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={onSubmitSearch} className={clsx("flex items-center gap-2 w-full md:w-[720px] rounded-lg px-3 py-2 mt-3 md:mt-0", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
          <Search className="opacity-60" />
          <Input
            placeholder="Search species, genus, or scientific name (e.g. 'Viruses', 'Panthera', 'Homo sapiens')"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setShowSuggest(true)}
            className="border-0 shadow-none bg-transparent outline-none"
            aria-label="Search species"
          />
          <div className="flex items-center gap-2">
            <Button type="submit" variant="outline" className="px-3 cursor-pointer">Search</Button>
            <Button variant="ghost" onClick={() => { setShowSuggest(false); setQuery(""); }} className="px-2 cursor-pointer" title="Clear"><ChevronDown className="rotate-180" /></Button>
          </div>
        </form>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_360px)] md:right-auto max-w-7xl rounded-xl overflow-hidden shadow-2xl", surface)}
            style={{ maxHeight: 420, overflow: "auto" }}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, i) => (
              <li key={s.key ?? s.scientificName ?? i} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => selectSuggestion(s)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && selectSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md flex items-center justify-center border shrink-0 bg-white/5">
                    <LayersStack className="opacity-70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.canonicalName || s.scientificName || "Unnamed taxon"}</div>
                    <div className="text-xs opacity-60 truncate">{s.rank ? `${s.rank} • ${s.kingdom ?? "—"}` : (s.kingdom ?? "—")}</div>
                  </div>
                  <div className="text-xs opacity-60 whitespace-nowrap">key: {s.key ?? "—"}</div>
                </div>
              </li>
            ))}
            {(!suggestions || suggestions.length === 0) && !loadingSuggest && <li className="p-3 text-sm opacity-60">No results</li>}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT: Desktop sidebar (samples) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 h-fit", surface)}>
          <div className={clsx("rounded-xl border p-4", inner)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <LayersStack />
                <div className="text-sm font-semibold">Samples</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={refreshSidebar} className="cursor-pointer"><RefreshCw /></Button>
              </div>
            </div>

            <ScrollArea style={{ height: 420 }}>
              <div className="space-y-2 p-1">
                {sidebarSamples.map((s) => (
                  <div
                    key={s.key}
                    onClick={() => selectSuggestion(s)}
                    className="w-full text-left p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 flex items-center gap-3 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && selectSuggestion(s)}
                  >
                    <FirstLetterAvatar name={s.canonicalName} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{s.canonicalName}</div>
                      <div className="text-xs opacity-60 truncate">{s.rank} • {s.kingdom}</div>
                    </div>
                    <div className="text-xs opacity-60">key: {s.key}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => openGbif(detail?.key ?? selected?.key)} className="w-full cursor-pointer"><Globe /> Open on GBIF</Button>
              <Button variant="outline" onClick={() => openOccurrences(detail?.key ?? selected?.key)} className="w-full cursor-pointer"><MapPin /> View occurrences</Button>
            </div>
          </div>
        </aside>

        {/* CENTER: Expanded details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", surface)}>
            <CardHeader className={clsx("p-5 flex items-start justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Layers className="opacity-80" />
                    <span>Taxon Overview</span>
                  </div>
                </CardTitle>
                <div className="text-xs opacity-60">{primaryTitle(detail || selected)}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={refreshSearchOrDetail} className="cursor-pointer">
                  <span className="flex items-center gap-2"><Loader2 className={loadingDetail ? "animate-spin" : ""} /> Refresh</span>
                </Button>

                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer"><List /> {showRaw ? "Hide" : "Raw"}</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingDetail ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : (
                <>
                  {/* Title + meta */}
                  <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full p-2 border">
                        <FirstLetterAvatar name={detail?.canonicalName || detail?.scientificName} size={56} />
                      </div>
                      <div className="leading-tight">
                        <div className="text-2xl font-bold">{detail?.canonicalName || detail?.scientificName || "—"}</div>
                        <div className="text-sm opacity-60 flex items-center gap-2">
                          <Info className="w-4 h-4" /> {detail?.authorship || detail?.scientificNameAuthorship || "—"}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* big metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 rounded-md border cursor-default">
                      <div className="text-xs opacity-60 flex items-center gap-2"><Award className="opacity-70" /> Descendants</div>
                      <div className="text-lg font-semibold">{detail?.numDescendants ?? "—"}</div>
                    </div>
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60 flex items-center gap-2"><LayersStack className="opacity-70" /> Kingdom</div>
                      <div className="text-lg font-semibold">{detail?.kingdom ?? "—"}</div>
                    </div>
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60 flex items-center gap-2"><Calendar className="opacity-70" /> Last crawled</div>
                      <div className="text-lg font-semibold">{detail?.lastCrawled ? formatDateISO(detail.lastCrawled) : "—"}</div>
                    </div>
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60 flex items-center gap-2"><Hash className="opacity-70" /> Status</div>
                      <div className="text-lg font-semibold">{detail?.taxonomicStatus ?? "—"}</div>
                    </div>
                  </div>

                  {/* Overview */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><BookOpen /> Overview</div>
                    <div className="text-sm leading-relaxed text-justify">
                      {detail?.remarks || detail?.vernacularName || "No descriptive remarks provided by GBIF for this taxon."}
                    </div>
                  </div>

                  <Separator className="my-3" />

                  {/* Classification */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><LayersIcon /> Classification</div>
                    <div className="flex flex-wrap gap-2">
                      {classificationList(detail || selected).length > 0 ? (
                        classificationList(detail || selected).map((c, i) => (
                          <div key={i} className="px-3 py-1 rounded-full border text-sm cursor-default">
                            <div className="text-xs opacity-70">{(c.rank || c.rankParsed || c.rankLevel) ?? "rank"}</div>
                            <div className="font-medium">{c.name || c.canonicalName || c.scientificName}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm opacity-60">No classification data available</div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Additional details */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2 rounded-md border">
                      <div className="text-xs opacity-60">Name type</div>
                      <div className="text-sm font-medium">{detail?.nameType ?? "—"}</div>
                    </div>
                    <div className="p-2 rounded-md border">
                      <div className="text-xs opacity-60">Origin</div>
                      <div className="text-sm font-medium">{detail?.origin ?? "—"}</div>
                    </div>
                    <div className="p-2 rounded-md border">
                      <div className="text-xs opacity-60">Dataset key</div>
                      <div className="text-sm font-medium break-words">{detail?.datasetKey ?? "—"}</div>
                    </div>
                    <div className="p-2 rounded-md border">
                      <div className="text-xs opacity-60">Issues</div>
                      <div className="text-sm font-medium">{Array.isArray(detail?.issues) && detail.issues.length > 0 ? detail.issues.join(", ") : "—"}</div>
                    </div>
                  </div>

                  {/* inline raw JSON toggle */}
                  <AnimatePresence>
                    {showRaw && rawResp && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 mt-4 rounded-md border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                        <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 320 }}>
                          {prettyJSON(rawResp)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 h-fit", surface)}>
          <div className={clsx("p-4 rounded-xl border space-y-3", inner)}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold">Quick actions</div>
                <div className="text-xs opacity-60 mt-1">Fast exports & links</div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => openGbif(detail?.key ?? selected?.key)}><Globe /> Open on GBIF</Button>
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => openOccurrences(detail?.key ?? selected?.key)}><MapPin /> View occurrences</Button>
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => copyJSON()}>{copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy JSON"}</Button>
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button variant="ghost" className="w-full cursor-pointer" onClick={() => setShowRaw(s => !s)}><List /> Toggle raw</Button>
            </div>

            <Separator className="my-3" />

            <div className="text-xs opacity-60">Developer</div>
            <div className="text-xs break-words">Search endpoint: <code className="text-xs">{BASE}?q=QUERY</code></div>
            <div className="text-xs opacity-60 mt-2">Try: <code>fetch("{BASE}?q=Viruses").then(r=>r.json()).then(console.log)</code></div>

            <div className="mt-3 flex gap-2">
              <Button variant="ghost" className="flex-1 cursor-pointer" onClick={() => { setSuggestions([]); searchSpecies(query); }}><RefreshCw /> Refresh search</Button>
              <Button variant="ghost" className="cursor-pointer" onClick={resetToSample}>Reset</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* RAW JSON DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{primaryTitle(detail || selected)} — Raw JSON</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "70vh", overflow: "auto" }} className="p-4">
            <pre className={clsx("text-sm", isDark ? "text-zinc-200" : "text-zinc-900")}>
              {prettyJSON(detail || selected || rawResp)}
            </pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">GBIF response</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer">Close</Button>
              <Button variant="outline" onClick={() => downloadJSON()} className="cursor-pointer"><Download /> Download</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
