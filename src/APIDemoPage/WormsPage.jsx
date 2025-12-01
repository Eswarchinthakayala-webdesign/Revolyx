import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search as SearchIcon,
  ExternalLink,
  Download,
  Copy,
  Loader2,
  Star,
  List,
  X,
  FileText,
  Globe,
  Menu,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  GitBranch,
  Layers,
  Database,
  Grid,
  ArrowUpRight,
  Code,
  Tag,
  Users,
  Calendar,
  Database as DatabaseIcon,
  MapPin,
  Box,
  Hash
} from "lucide-react";

// shadcn UI components (adjust imports if your paths differ)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

import { cn } from "@/lib/utils";

const API_BASE = "https://www.marinespecies.org/rest";
const DEFAULT_QUERY = "Crab";
const TAXONOMY_ORDER = [
  "scientificname",
  "authority",
  "status",
  "rank",
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
  "AphiaID",
  "valid_AphiaID",
  "valid_name"
];

function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function prettyKey(k = "") {
  return k.replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* Glassy badge component to use across the UI */
function GlassBadge({ children, tone = "primary", className = "" }) {
  // tone -> choose gradient combos
  const toneMap = {
    primary: "from-zinc-400 to-violet-500",
    success: "from-emerald-400 to-teal-500",
    warn: "from-amber-400 to-orange-500",
    neutral: "from-zinc-300 to-zinc-400",
    info: "from-sky-400 to-cyan-500"
  };
  const gradient = toneMap[tone] ?? toneMap.primary;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm",
        "bg-gradient-to-r",
        gradient,
        "backdrop-blur-md bg-opacity-80",
        className
      )}
    >
      {children}
    </span>
  );
}

export default function WormsPageImproved() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [selected, setSelected] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestRef = useRef(null);

  const [copyState, setCopyState] = useState({ copying: false, success: false });
  const copyTimerRef = useRef(null);

  const [showRaw, setShowRaw] = useState(false);

  const [randomSpecies, setRandomSpecies] = useState([]);
  const [loadingRandom, setLoadingRandom] = useState(false);

  // Debounced suggestion fetch (now supports numeric AphiaID quick lookup)
  const fetchSuggestions = useMemo(
    () =>
      debounce(async (q) => {
        setSuggestions([]);
        if (!q || q.trim().length < 1) {
          setLoadingSuggestions(false);
          return;
        }
        setLoadingSuggestions(true);
        setError(null);

        try {
          // If the query is mostly numeric, try AphiaRecordByAphiaID (ID suggestion)
          const numeric = /^\d+$/.test(q.trim());
          const results = [];

          if (numeric) {
            try {
              const id = q.trim();
              const res = await fetch(`${API_BASE}/AphiaRecordByAphiaID/${encodeURIComponent(id)}`);
              if (res.ok) {
                const data = await res.json();
                // mark as id suggestion
                data._isIdSuggestion = true;
                results.push(data);
              }
            } catch (e) {
              // ignore id fetch failure
            }
          }

          // normal name-like suggestions
          const url = `${API_BASE}/AphiaRecordsByName/${encodeURIComponent(q)}?like=true`;
          try {
            const res2 = await fetch(url);
            if (res2.ok) {
              const arr = await res2.json();
              if (Array.isArray(arr)) {
                // ensure we don't duplicate IDs
                const existingIds = new Set(results.map((r) => r.AphiaID ?? r.scientificname));
                arr.forEach((r) => {
                  const key = r.AphiaID ?? r.scientificname;
                  if (!existingIds.has(key)) {
                    results.push(r);
                    existingIds.add(key);
                  }
                });
              }
            }
          } catch (e) {
            // ignore
          }

          setSuggestions(results.slice(0, 40));
        } catch (err) {
          setError(err.message || "Failed to fetch suggestions");
          setSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 300),
    []
  );

  useEffect(() => {
    // initial load
    fetchSuggestions(DEFAULT_QUERY);
    handleSearch(DEFAULT_QUERY);
    fetchRandomSpecies(); // load random sample
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (query === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    fetchSuggestions(query);
    setShowSuggestions(true);
  }, [query, fetchSuggestions]);

  async function fetchDetailsForRecord(rec) {
    setLoadingDetails(true);
    setError(null);
    try {
      const aphia = rec?.AphiaID ?? rec?.aphiaID ?? rec?.aphiaid;
      if (aphia) {
        const detailUrl = `${API_BASE}/AphiaRecordByAphiaID/${encodeURIComponent(aphia)}`;
        const res2 = await fetch(detailUrl);
        if (!res2.ok) throw new Error(`Detail fetch error ${res2.status}`);
        const detail = await res2.json();
        setSelected(detail);
        return;
      }
      setSelected(rec);
    } catch (err) {
      setSelected(rec);
      setError(err.message || "Failed to fetch detail; showing partial data");
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleSelectSuggestion(record) {
    setShowSuggestions(false);
    setQuery(record.scientificname ?? record.valid_name ?? record.scientificname ?? String(record.AphiaID ?? ""));
    await fetchDetailsForRecord(record);
  }

  async function handleSearch(term) {
    if (!term || term.trim().length === 0) return;
    setShowSuggestions(false);
    setLoadingDetails(true);
    setError(null);

    try {
      // If numeric, prefer AphiaRecordByAphiaID
      if (/^\d+$/.test(term.trim())) {
        try {
          const id = term.trim();
          const res = await fetch(`${API_BASE}/AphiaRecordByAphiaID/${encodeURIComponent(id)}`);
          if (res.ok) {
            const d = await res.json();
            await fetchDetailsForRecord(d);
            setLoadingDetails(false);
            return;
          }
        } catch (e) {
          // fallback to name search
        }
      }

      const url = `${API_BASE}/AphiaRecordsByName/${encodeURIComponent(term)}?like=true`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSelected({ message: "No results found" });
        setLoadingDetails(false);
        return;
      }
      let chosen = data.find(
        (r) =>
          (r.scientificname && r.scientificname.toLowerCase() === term.toLowerCase()) ||
          (r.valid_name && r.valid_name.toLowerCase() === term.toLowerCase())
      );
      if (!chosen) chosen = data[0];
      await fetchDetailsForRecord(chosen);
    } catch (err) {
      setError(err.message || "Failed to fetch data");
      setSelected(null);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function fetchRandomSpecies() {
    setLoadingRandom(true);
    setError(null);
    try {
      const letters = "abcdefghijklmnopqrstuvwxyz";
      const attempts = 6;
      const results = new Map();

      for (let i = 0; i < attempts; i++) {
        const letter = letters[Math.floor(Math.random() * letters.length)];
        const url = `${API_BASE}/AphiaRecordsByName/${encodeURIComponent(letter)}?like=true`;
        try {
          const r = await fetch(url);
          if (!r.ok) continue;
          const arr = await r.json();
          if (!Array.isArray(arr)) continue;
          arr.forEach((rec) => {
            const key = rec.AphiaID ?? rec.scientificname ?? JSON.stringify(rec);
            if (!results.has(key) && results.size < 80) {
              results.set(key, rec);
            }
          });
        } catch (e) {
          // ignore per-loop errors
        }
        if (results.size >= 20) break;
      }

      // pick random 10 from results
      const items = Array.from(results.values());
      const picked = [];
      while (picked.length < 10 && items.length) {
        const idx = Math.floor(Math.random() * items.length);
        picked.push(items.splice(idx, 1)[0]);
      }
      setRandomSpecies(picked);
    } catch (err) {
      setError("Failed to fetch random species: " + (err?.message ?? err));
      setRandomSpecies([]);
    } finally {
      setLoadingRandom(false);
    }
  }

  async function handleCopyJSON() {
    if (!selected) return;
    try {
      setCopyState({ copying: true, success: false });
      await navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
      setCopyState({ copying: false, success: true });
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopyState({ copying: false, success: false });
      }, 2000);
    } catch (err) {
      setCopyState({ copying: false, success: false });
      alert("Failed to copy: " + (err?.message ?? err));
    }
  }

  function renderTaxonomyBlock(data = {}) {
    const shown = new Set();
    const items = [];

    (TAXONOMY_ORDER || []).forEach((k) => {
      if (k in data || k.toLowerCase() in data) {
        const val = data[k] ?? data[k.toLowerCase()];
        if (val !== undefined && val !== null && !(typeof val === "object" && Object.keys(val).length === 0)) {
          items.push({ key: k, value: val });
          shown.add(k);
        }
      }
    });

    Object.keys(data)
      .filter((k) => !shown.has(k) && k !== "__proto__")
      .sort()
      .forEach((k) => {
        const v = data[k];
        if (v === undefined || v === null || (typeof v === "object" && Object.keys(v).length === 0)) return;
        items.push({ key: k, value: v });
      });

    if (items.length === 0) {
      return <div className="text-muted">No taxonomy / metadata available for this record.</div>;
    }

    return (
      <div className="grid grid-cols-1 gap-3">
        {items.map((it) => (
          <div key={it.key} className="flex flex-col md:flex-row md:items-start md:gap-4">
            <div className="w-full md:w-44 text-sm opacity-80">{prettyKey(it.key)}</div>
            <div className="break-words max-w-prose">
              {typeof it.value === "object" ? (
                <pre className="text-xs rounded-md p-3 bg-white/5 dark:bg-zinc-900/40 overflow-auto">{JSON.stringify(it.value, null, 2)}</pre>
              ) : (
                <span className="font-medium">{String(it.value)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // helper to format quick metadata chips
  function MetaChip({ icon: Icon, label, value, tone = "neutral" }) {
    return (
      <div className="inline-flex items-center gap-2 mr-2 mt-2">
        <GlassBadge tone={tone}>
          {Icon && <Icon size={12} />} <span className="text-xs">{label}: <strong className="ml-1">{value ?? "—"}</strong></span>
        </GlassBadge>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 ">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="md:hidden p-2 rounded-full hover:bg-muted/20 cursor-pointer border"
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] p-3">
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers size={18} />
                      <div>
                        <SheetTitle className="text-lg font-semibold">WoRMS — Menu</SheetTitle>
                        <div className="text-xs opacity-70">Search • Quick actions</div>
                      </div>
                    </div>
                    <SheetClose asChild>
                      <button className="p-1 rounded hover:bg-muted/20 cursor-pointer" aria-label="Close menu"><X size={16} /></button>
                    </SheetClose>
                  </div>
                </SheetHeader>

                <div className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><SearchIcon size={16} /> Search</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search scientific name, common name or AphiaID..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch(query);
                            if (e.key === "Escape") setShowSuggestions(false);
                          }}
                          aria-label="Search WoRMS"
                        />
                        <Button size="sm" onClick={() => handleSearch(query)} className="cursor-pointer">
                          {loadingDetails ? <Loader2 className="animate-spin" size={14} /> : <SearchIcon size={14} />}
                        </Button>
                      </div>

                      {showSuggestions && (suggestions?.length > 0 || loadingSuggestions) && (
                        <div ref={suggestRef} className="mt-2 max-h-64 overflow-hidden rounded-md border bg-white/30 dark:bg-zinc-900/60 p-2 shadow">
                          <ScrollArea style={{ height: 240 }}>
                            {loadingSuggestions ? (
                              <div className="flex items-center gap-2 py-2 px-3">
                                <Loader2 className="animate-spin" />
                                <span className="text-sm">Looking up suggestions…</span>
                              </div>
                            ) : (
                              suggestions.map((s, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSelectSuggestion(s)}
                                  className={cn(
                                    "w-full text-left py-2 px-2 rounded hover:bg-muted/30 flex items-start gap-3 transition-transform transform hover:-translate-y-0.5 cursor-pointer",
                                    s.AphiaID === selected?.AphiaID ? "ring-2 ring-zinc-300" : ""
                                  )}
                                >
                                  <div className="w-2.5 h-2.5 rounded-full bg-white/80 dark:bg-zinc-500 mt-2" />
                                  <div className="flex-1">
                                    <div className="font-medium flex items-center gap-2">
                                      {s.scientificname ?? s.valid_name ?? s.name}
                                      {s._isIdSuggestion && <GlassBadge tone="info"><Hash size={12} /> ID</GlassBadge>}
                                    </div>
                                    <div className="text-xs opacity-70">
                                      {s.rank ? `${s.rank}` : ""} {s.status ? ` • ${s.status}` : ""} {s.AphiaID ? ` • AphiaID ${s.AphiaID}` : ""}
                                    </div>
                                  </div>
                                </button>
                              ))
                            )}
                          </ScrollArea>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><FileText size={16} /> Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      <Button onClick={() => { setQuery(DEFAULT_QUERY); handleSearch(DEFAULT_QUERY); }} className="cursor-pointer">
                        Try “Crab”
                      </Button>
                      <Button onClick={() => fetchRandomSpecies()} className="cursor-pointer" variant="ghost">
                        <RefreshCw size={14} /> Refresh Random
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3 ml-1">
              <div className="rounded-full bg-white/70 dark:bg-zinc-800/60 p-2 shadow-sm">
                <Layers size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold leading-tight">WoRMS</h1>
                <p className="text-sm opacity-70">Taxonomic lookup — REST API</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip content="API Endpoint">
              <button
                className="p-2 rounded-md hover:bg-muted/20 cursor-pointer border"
                onClick={() => window.open(API_BASE, "_blank")}
              >
                <Globe size={16} />
              </button>
            </Tooltip>

            <Button variant="outline" size="sm" onClick={() => { setQuery(DEFAULT_QUERY); handleSearch(DEFAULT_QUERY); }} className="cursor-pointer hidden sm:flex items-center gap-2">
              <SearchIcon size={14} />
              <span>Try “Crab”</span>
            </Button>
          </div>
        </header>

        <Separator className="my-6" />

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_340px] gap-6">
          {/* LEFT: Desktop search & suggestions */}
          <aside className="hidden lg:block">
            <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SearchIcon size={18} />
                    <span>Search Species</span>
                  </div>
                  <GlassBadge tone="primary">Animals</GlassBadge>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search scientific name, common name or AphiaID..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch(query);
                        if (e.key === "Escape") { setShowSuggestions(false); }
                      }}
                      aria-label="Search WoRMS"
                    />
                    <Button size="sm" onClick={() => handleSearch(query)} className="cursor-pointer">
                      {loadingDetails ? <Loader2 className="animate-spin" size={14} /> : <SearchIcon size={14} />}
                    </Button>
                  </div>

                  {showSuggestions && (suggestions?.length > 0 || loadingSuggestions) && (
                    <div ref={suggestRef} className="mt-2 max-h-72 bg-white/30 dark:bg-zinc-900/60 overflow-hidden rounded-md border p-2 shadow">
                      <ScrollArea className="p-2" style={{ height: 260 }}>
                        <div className="space-y-2 p-2">
                        {loadingSuggestions ? (
                          <div className="flex items-center gap-2 py-2 px-3">
                            <Loader2 className="animate-spin" />
                            <span className="text-sm">Looking up suggestions…</span>
                          </div>
                        ) : (
                          suggestions.map((s, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectSuggestion(s)}
                              className={cn(
                                "w-full text-left py-2 px-2 rounded hover:bg-muted/30 flex items-start gap-3 transition-transform transform hover:-translate-y-0.5 cursor-pointer",
                                s.AphiaID === selected?.AphiaID ? "border border-zinc-200/50" : ""
                              )}
                            >
                              <div className="w-2.5 h-2.5 rounded-full bg-white/80 dark:bg-zinc-500 mt-2" />
                              <div className="flex-1">
                                <div className="font-medium">{s.scientificname ?? s.valid_name ?? s.name}</div>
                                <div className="text-xs opacity-70">
                                  {s.rank ? `${s.rank}` : ""} {s.status ? ` • ${s.status}` : ""} {s.AphiaID ? ` • AphiaID ${s.AphiaID}` : ""}
                                </div>
                              </div>
                            </button>
                          ))
                        )}</div>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-sm opacity-80">
                  <p>Tip: try a scientific name, common name, or an AphiaID (numbers) to jump straight to a record.</p>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between">
                <div className="text-xs opacity-70">Source: marinespecies.org REST</div>
                <div className="text-xs opacity-70">No API key required</div>
              </CardFooter>
            </Card>
          </aside>

          {/* CENTER: Detailed view (main) */}
          <main>
            <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4 w-full">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <Layers size={18} />
                      <h2 className="text-xl font-semibold truncate">
                        {selected?.scientificname ?? selected?.valid_name ?? selected?.name ?? (loadingDetails ? "Loading…" : "No selection")}
                      </h2>
                      {selected?.AphiaID && <GlassBadge tone="info">AphiaID {selected.AphiaID}</GlassBadge>}
                    </div>

                    <p className="text-sm opacity-70 mt-2 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2">
                        <GitBranch size={14} />
                        <span className="opacity-90">{selected?.authority ?? "—"}</span>
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <DatabaseIcon size={14} />
                        <span className="opacity-90">{selected?.status ?? "—"}</span>
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Grid size={14} />
                        <span className="opacity-90">{selected?.rank ?? "—"}</span>
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {loadingDetails && <Loader2 className="animate-spin" />}

                    <Tooltip content="Copy JSON">
                      <button
                        onClick={handleCopyJSON}
                        disabled={!selected}
                        className={cn(
                          "p-2 rounded-md border flex items-center justify-center cursor-pointer",
                          copyState.success ? "bg-emerald-600 text-white border-emerald-600 scale-105" : "hover:bg-muted/20"
                        )}
                        aria-label="Copy JSON"
                      >
                        {copyState.copying ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : copyState.success ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </Tooltip>

                    <Tooltip content="Download JSON">
                      <button
                        onClick={() => downloadJSON(`${selected?.scientificname ?? "worms-record"}.json`, selected)}
                        disabled={!selected}
                        className="p-2 rounded-md border hover:bg-muted/20 cursor-pointer"
                        aria-label="Download JSON"
                      >
                        <Download size={16} />
                      </button>
                    </Tooltip>

                    {selected?.AphiaID && (
                      <Tooltip content="Open in WoRMS">
                        <button
                          onClick={() => window.open(`https://marinespecies.org/aphia.php?p=taxdetails&id=${selected.AphiaID}`, "_blank")}
                          className="p-2 rounded-md border hover:bg-muted/20 cursor-pointer"
                          aria-label="Open in WoRMS"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </Tooltip>
                    )}

                    <button
                      onClick={() => setShowRaw((s) => !s)}
                      className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/20 cursor-pointer"
                      aria-label="Toggle raw JSON"
                    >
                      {showRaw ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span className="text-sm opacity-80">Raw</span>
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && <div className="text-red-500">Error: {error}</div>}

                {/* Overview + metadata */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 rounded-md p-5 border bg-white/60 dark:bg-zinc-900/60 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Star size={16} />
                          Overview
                        </h3>

                        <div className="mt-3 text-sm opacity-80 space-y-2">
                          {selected ? (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                <MetaChip icon={Tag} label="Scientific" value={selected.scientificname ?? selected.valid_name ?? "—"} tone="primary" />
                                <MetaChip icon={Users} label="Authorship" value={selected.authority ?? "—"} tone="neutral" />
                                <MetaChip icon={DatabaseIcon} label="Status" value={selected.status ?? "—"} tone="warn" />
                                <MetaChip icon={Grid} label="Rank" value={selected.rank ?? "—"} tone="info" />
                              </div>

                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="rounded p-3 bg-white/10 dark:bg-zinc-900/40">
                                  <div className="text-xs opacity-70">Aphia ID</div>
                                  <div className="text-sm font-semibold">{selected.AphiaID ?? "—"}</div>
                                </div>

                                <div className="rounded p-3 bg-white/10 dark:bg-zinc-900/40">
                                  <div className="text-xs opacity-70">Kingdom / Phylum</div>
                                  <div className="text-sm font-semibold">{(selected.kingdom ?? "—") + " / " + (selected.phylum ?? "—")}</div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="opacity-70">No record selected. Use the search or pick a random species from the right.</div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-right opacity-80">
                        <div className="mb-2">
                          <div className="text-xs">Kingdom</div>
                          <div className="font-medium">{selected?.kingdom ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs">Phylum</div>
                          <div className="font-medium">{selected?.phylum ?? "—"}</div>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2"><FileText size={14} /> Taxonomy & Metadata</h4>
                      <div>{selected ? renderTaxonomyBlock(selected) : <div className="opacity-70">Search and select a species to view full metadata.</div>}</div>
                    </div>
                  </div>

                  <aside className="rounded-md p-4 border bg-white/60 dark:bg-black/70 shadow-sm">
                    <h4 className="font-medium mb-3 flex items-center gap-2"><Globe size={14} /> Fast facts</h4>
                    <div className="flex flex-col gap-2 text-sm opacity-80">
                      <div className="flex items-center gap-2"><strong>Kingdom:</strong> {selected?.kingdom ?? "—"}</div>
                      <div className="flex items-center gap-2"><strong>Phylum:</strong> {selected?.phylum ?? "—"}</div>
                      <div className="flex items-center gap-2"><strong>Class:</strong> {selected?.class ?? "—"}</div>
                      <div className="flex items-center gap-2"><strong>Family:</strong> {selected?.family ?? "—"}</div>
                    </div>

                    <Separator className="my-3" />
                    <div className="flex flex-col gap-2">
                      <Button onClick={() => handleSearch(query)} className="cursor-pointer" variant="ghost">Re-run search</Button>
                      <Button onClick={() => { if (selected?.AphiaID) window.open(`https://marinespecies.org/aphia.php?p=taxdetails&id=${selected.AphiaID}`, "_blank"); }} disabled={!selected?.AphiaID} className="cursor-pointer">Open taxon page <ArrowUpRight size={14} /></Button>
                    </div>
                  </aside>
                </section>

                {/* Raw JSON preview toggle */}
                {showRaw && (
                  <section>
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><Code size={16} /> Raw API Response</h3>
                    <div className="rounded-md border p-4 overflow-auto bg-white/10 dark:bg-zinc-900/40">
                      <pre className="text-xs whitespace-pre-wrap break-words">{selected ? JSON.stringify(selected, null, 2) : "No data"}</pre>
                    </div>
                  </section>
                )}
              </CardContent>

              <CardFooter className="flex items-center justify-between">
                <div className="text-xs opacity-70">Rendered from REST: {API_BASE}</div>
                <div className="text-xs opacity-70">Designed for professional use</div>
              </CardFooter>
            </Card>

            {/* Small utilities row */}
            <div className="mt-4 flex flex-col md:flex-row gap-4">
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><RefreshCw size={16} /> Quick tools</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button onClick={() => fetchRandomSpecies()} className="cursor-pointer" variant="outline"><RefreshCw size={14} /> Refresh random</Button>
                  <Button onClick={() => { setQuery(DEFAULT_QUERY); handleSearch(DEFAULT_QUERY); }} className="cursor-pointer" variant="ghost">Try “Crab”</Button>
                </CardContent>
              </Card>

              <Card className="w-full md:w-96">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Star size={16} /> Quick stats</CardTitle>
                </CardHeader>
                <CardContent className="text-sm opacity-80">
                  <div><strong>Suggestions:</strong> {suggestions.length}</div>
                  <div><strong>Random loaded:</strong> {randomSpecies.length}</div>
                </CardContent>
              </Card>
            </div>
          </main>

          {/* RIGHT: Quick actions + random species */}
          <aside>
            <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={18} />
                  Quick Actions
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      if (!selected) return alert("Select a record first");
                      window.open(`https://marinespecies.org/aphia.php?p=taxdetails&id=${selected.AphiaID}`, "_blank");
                    }}
                    disabled={!selected?.AphiaID}
                    className="cursor-pointer"
                  >
                    Open Taxon Page
                    <ExternalLink size={14} className="ml-2" />
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (!selected) return alert("Select a record first");
                      downloadJSON(`${selected?.scientificname ?? "worms-record"}.json`, selected);
                    }}
                    disabled={!selected}
                    className="cursor-pointer"
                  >
                    Download JSON
                    <Download size={14} className="ml-2" />
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (!selected) return alert("Select a record first");
                      handleCopyJSON();
                    }}
                    disabled={!selected}
                    className="cursor-pointer"
                  >
                    Copy JSON
                    <Copy size={14} className="ml-2" />
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2"><Layers size={14} /> 10 Random species</h4>
                  <div className="space-y-2 p-2">
                    {loadingRandom ? (
                      <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Loading…</div>
                    ) : randomSpecies.length ? (
                      <ScrollArea style={{ height: 280 }}>
                        <div className="grid grid-cols-1 gap-2 p-2">
                          {randomSpecies.map((r, i) => (
                            <button
                              key={r.AphiaID ?? i}
                              onClick={() => fetchDetailsForRecord(r)}
                              className={cn(
                                "w-full text-left p-3 rounded-md border hover:shadow-sm transition-transform transform hover:-translate-y-0.5 cursor-pointer flex items-start justify-between gap-2",
                                r.AphiaID === selected?.AphiaID ? "border border-zinc-500/50 bg-white/30 dark:bg-zinc-800/40" : ""
                              )}
                            >
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {r.scientificname ?? r.valid_name ?? "Unnamed"}
                                  <span className="text-xs opacity-60">{r.rank ?? ""}</span>
                                </div>
                                <div className="text-xs opacity-70">
                                  {r.status ? `${r.status}` : ""} {r.AphiaID ? ` • AphiaID ${r.AphiaID}` : ""}
                                </div>
                              </div>
                              <div className="text-xs opacity-60">{r.kingdom ?? ""}</div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="opacity-70">No random species loaded. Try refresh.</div>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => fetchRandomSpecies()} className="cursor-pointer" size="sm"><RefreshCw size={14} /> Refresh</Button>
                    <Button onClick={() => setRandomSpecies([])} size="sm" variant="ghost" className="cursor-pointer">Clear</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* small placeholder for Code icon usage if needed - replaced by lucide Code above */
function CodeIcon() {
  return <Code size={14} />;
}
