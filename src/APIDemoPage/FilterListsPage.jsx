// src/pages/FilterListsExplorer.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  List,
  ExternalLink,
  Copy,
  Download,
  FileText,
  Info,
  RefreshCw,
  Users,
  Check,
  ChevronRight,
  Tag,
  Calendar,
  Github,
  Globe,
  Bookmark,
  Mail,
  Twitter,
  Database,
  MapPin,
  Menu,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper"; // assumed present

// Leaflet map (optional; keeps same behavior as other pages)
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const API_BASE = "/api/filterlists"; // proxied

/* ---------- utilities ---------- */
function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}
function pickRandom(arr = [], n = 10) {
  if (!Array.isArray(arr)) return [];
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}
function glassyBadge(variant = "blue") {
  return clsx(
    "px-2 py-0.5 rounded-full text-[11px] font-medium shadow-sm",
    variant === "blue" && "backdrop-blur-md bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300",
    variant === "green" && "backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    variant === "neutral" && "backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300"
  );
}
/* defensive normalizer */
function normalizeList(item, idx) {
  return {
    id: item.id ?? item._id ?? `${idx}`,
    name: item.name ?? item.title ?? `List ${idx + 1}`,
    description: item.description ?? item.summary ?? "",
    licenseId: item.licenseId ?? item.license ?? null,
    syntaxIds: Array.isArray(item.syntaxIds) ? item.syntaxIds : (item.syntaxIds ? [item.syntaxIds] : []),
    languageIds: Array.isArray(item.languageIds) ? item.languageIds : (item.languageIds ? [item.languageIds] : []),
    tagIds: Array.isArray(item.tagIds) ? item.tagIds : (item.tagIds ? [item.tagIds] : []),
    maintainerIds: Array.isArray(item.maintainerIds) ? item.maintainerIds : (item.maintainerIds ? [item.maintainerIds] : []),
    raw: item,
  };
}

/* ---------- component ---------- */
export default function FilterListsExplorer() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // data stores
  const [lists, setLists] = useState([]);
  const [languagesMap, setLanguagesMap] = useState({});
  const [licensesMap, setLicensesMap] = useState({});
  const [maintainersMap, setMaintainersMap] = useState({});
  const [softwareList, setSoftwareList] = useState([]);
  const [syntaxesMap, setSyntaxesMap] = useState({});
  const [tagsMap, setTagsMap] = useState({});

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // software dialog & fetch
  const [softwareDialogOpen, setSoftwareDialogOpen] = useState(false);
  const [softwareDetail, setSoftwareDetail] = useState(null);
  const [softwareLoading, setSoftwareLoading] = useState(false);

  // sidebar sheet for mobile
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sidebarPicks, setSidebarPicks] = useState([]);
  const [selectedSoftwareId, setSelectedSoftwareId] = useState(null);

  const searchTimer = useRef(null);
  const copyTimer = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      setLoading(true);
      setError("");
      try {
        const endpoints = [
          fetch(`/api/filterlists/lists`).then((r) => r.json()),
          fetch(`/api/filterlists/languages`).then((r) => r.json()),
          fetch(`/api/filterlists/licenses`).then((r) => r.json()),
          fetch(`/api/filterlists/maintainers`).then((r) => r.json()),
          fetch(`/api/filterlists/software`).then((r) => r.json()),
          fetch(`/api/filterlists/syntaxes`).then((r) => r.json()),
          fetch(`/api/filterlists/tags`).then((r) => r.json()),
        ];
        const [listsRaw, languagesRaw, licensesRaw, maintainersRaw, softwareRaw, syntaxesRaw, tagsRaw] = await Promise.all(endpoints);

        if (!mounted) return;

        let listsArr = Array.isArray(listsRaw) ? listsRaw : (listsRaw?.data ?? []);
        const normalized = listsArr.map((l, i) => normalizeList(l, i)).sort((a,b) => (a.name||"").localeCompare(b.name||""));

        const toMap = (arr = []) => (Array.isArray(arr) ? arr.reduce((acc, it) => { const id = it.id ?? it._id; if (id !== undefined) acc[id] = it; return acc; }, {}) : {});

        setLists(normalized);
        setLanguagesMap(toMap(Array.isArray(languagesRaw) ? languagesRaw : (languagesRaw?.data ?? [])));
        setLicensesMap(toMap(Array.isArray(licensesRaw) ? licensesRaw : (licensesRaw?.data ?? [])));
        setMaintainersMap(toMap(Array.isArray(maintainersRaw) ? maintainersRaw : (maintainersRaw?.data ?? [])));
        setSyntaxesMap(toMap(Array.isArray(syntaxesRaw) ? syntaxesRaw : (syntaxesRaw?.data ?? [])));
        setTagsMap(toMap(Array.isArray(tagsRaw) ? tagsRaw : (tagsRaw?.data ?? [])));
        setSoftwareList(Array.isArray(softwareRaw) ? softwareRaw : (softwareRaw?.data ?? []));

        setSidebarPicks(pickRandom(normalized, 10));
        if (normalized.length) setSelected(normalized[0]);
      } catch (err) {
        console.error(err);
        setError(String(err?.message || err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => { mounted = false; };
  }, []);

  // suggestions (debounced); supports matches by id as well
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const q = (query || "").trim().toLowerCase();
      if (!q) { setSuggestions([]); setShowSuggestions(false); return; }
      const matches = lists.filter(l => {
        const nameMatch = (l.name || "").toLowerCase().includes(q);
        const descMatch = (l.description || "").toLowerCase().includes(q);
        const idMatch = (String(l.id || "")).toLowerCase().includes(q);
        const tagMatch = (l.tagIds || []).map(id => (tagsMap[id]?.name || "")).join(" ").toLowerCase().includes(q);
        return nameMatch || descMatch || idMatch || tagMatch;
      }).slice(0, 20);
      setSuggestions(matches);
      setShowSuggestions(true);
    }, 180);
    return () => clearTimeout(searchTimer.current);
  }, [query, lists, tagsMap]);

  // derived
  const selectedLanguages = useMemo(() => (selected?.languageIds || []).map(id => languagesMap[id]).filter(Boolean), [selected, languagesMap]);
  const selectedLicense = useMemo(() => (selected?.licenseId ? licensesMap[selected.licenseId] : null), [selected, licensesMap]);
  const selectedMaintainers = useMemo(() => (selected?.maintainerIds || []).map(id => maintainersMap[id]).filter(Boolean), [selected, maintainersMap]);
  const selectedSyntaxes = useMemo(() => (selected?.syntaxIds || []).map(id => syntaxesMap[id]).filter(Boolean), [selected, syntaxesMap]);
  const selectedTags = useMemo(() => (selected?.tagIds || []).map(id => tagsMap[id]).filter(Boolean), [selected, tagsMap]);
  const relevantSoftware = useMemo(() => {
    if (!selected) return [];
    const needed = new Set(selected.syntaxIds || []);
    return softwareList.filter(s => (s.syntaxIds || []).some(id => needed.has(id)));
  }, [selected, softwareList]);

  // copy JSON animation
  async function copyJSON() {
    try {
      const pay = selected?.raw || selected || {};
      await navigator.clipboard.writeText(prettyJSON(pay));
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1400);
      showToast("success", "Copied JSON");
    } catch {
      showToast("error", "Copy failed");
    }
  }
  function downloadJSON() {
    const payload = selected?.raw || selected || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(selected?.name || "filterlist").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // open software dialog and fetch detail
  async function openSoftwareDialog(sw) {
    if (!sw?.id) { setSoftwareDetail(null); setSoftwareDialogOpen(true); return; }
    setSoftwareLoading(true);
    setSoftwareDialogOpen(true);
    try {
      const res = await fetch(`/api/filterlists/software/${encodeURIComponent(sw.id)}`);
      if (!res.ok) throw new Error(`Failed to load software ${res.status}`);
      const json = await res.json();
      // defensive: some APIs return data in .data or .results
      const detail = Array.isArray(json) ? (json[0] || json) : (json?.data ?? json?.results ?? json);
      setSoftwareDetail(detail);
    } catch (err) {
      console.error(err);
      setSoftwareDetail(sw); // fallback to whatever we had
      showToast("error", "Failed to fetch software details");
    } finally {
      setSoftwareLoading(false);
    }
  }

  // small UI helpers
  function clearSelection() {
    setSelected(null);
    setShowRaw(false);
  }

  // keyboard-friendly suggestion nav
  const suggestionIndex = useRef(-1);
  function onSuggestionKey(e) {
    const list = suggestions || [];
    if (e.key === "ArrowDown") { suggestionIndex.current = Math.min(list.length - 1, suggestionIndex.current + 1); e.preventDefault(); }
    else if (e.key === "ArrowUp") { suggestionIndex.current = Math.max(-1, suggestionIndex.current - 1); e.preventDefault(); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestionIndex.current >= 0 && suggestionIndex.current < list.length) {
        setSelected(list[suggestionIndex.current]); setQuery(""); setShowSuggestions(false); suggestionIndex.current = -1;
      } else if (list.length > 0) {
        setSelected(list[0]); setQuery(""); setShowSuggestions(false);
      }
    } else if (e.key === "Escape") { setShowSuggestions(false); suggestionIndex.current = -1; }
  }

  return (
    <div className={clsx("min-h-screen py-6 pb-10 px-4 lg:px-8")}>
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <header className="flex items-start md:items-center justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-start gap-4">
            <div className={clsx("rounded-xl w-10 h-10 flex items-center justify-center shadow-sm", isDark ? "bg-zinc-900" : "bg-white")}>
              <Bookmark className="w-5 h-5 text-zinc-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">FilterLists Explorer</h1>
              <p className="text-xs opacity-70 mt-1 max-w-xl">Browse curated filter lists </p>
            </div>
          </div>

          {/* Mobile sheet trigger + search */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-xl p-2  border shadow-sm">
              <Search className="opacity-60" />
              <Input
                placeholder="Search by name, id or tag..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSuggestionKey}
                onFocus={() => { if (query.trim().length > 0) setShowSuggestions(true); }}
                className="border-0 bg-transparent"
                aria-label="Search lists"
              />
              <Button variant="outline" onClick={() => { if (suggestions.length) setSelected(suggestions[0]); }} className="cursor-pointer"><Search /></Button>
            </div>

            {/* mobile sheet trigger */}
            <div className="md:hidden">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="cursor-pointer"><Menu /></Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px]">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <List />
                      <div>
                        <div className="font-semibold">Quick picks</div>
                        <div className="text-xs opacity-60">Tap to open</div>
                      </div>
                    </div>
                    <div>
                      <Button variant="ghost" size="sm" onClick={() => { setSidebarPicks(pickRandom(lists, 10)); showToast("success", "Refreshed"); }} className="cursor-pointer mr-3"><RefreshCw /></Button>

                    </div>
                  </div>
                  <Separator />
                  <ScrollArea className="p-3 h-[70vh]">
                    <div className="space-y-3">
                      {sidebarPicks.map(p => (
                        <div key={p.id} onClick={() => { setSelected(p); setSheetOpen(false); }} className={clsx("p-3 rounded-lg border cursor-pointer", selected?.id === p.id ? "bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-zinc-900")}>
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="font-medium ">{p.name}</div>
                              <div className="text-xs opacity-60 ">{p.description?.slice(0, 80)}</div>
                            </div>
                            <Badge className={glassyBadge("blue")}>{p.syntaxIds?.length ?? 0} syntax</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>

            {/* refresh */}
            <Button variant="ghost" className="cursor-pointer hidden md:inline-flex" onClick={() => { setSidebarPicks(pickRandom(lists, 10)); showToast("success", "Sidebar refreshed"); }}><RefreshCw /></Button>
          </div>
        </header>

        {/* Suggestions overlay */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute left-4 right-4 md:left-[calc(50%_-_420px)] md:right-auto z-50 mt-2 max-w-[840px]">
              <div className={clsx("rounded-xl hover:rounded-2xl overflow-hidden shadow-2xl border", isDark ? "bg-black border-zinc-800" : "bg-white border border-zinc-200")}>
                <ScrollArea className="overflow-y-auto p-2" style={{ maxHeight: 320 }}>
                  {suggestions.map((s, i) => (
                    <div key={s.id} onClick={() => { setSelected(s); setShowSuggestions(false); setQuery(""); }} className={clsx("px-4 py-3 flex rounded-2xl mb-1 items-center gap-3 cursor-pointer", selected?.id === s.id ? "bg-zinc-50 dark:bg-zinc-800" : "hover:bg-slate-50 dark:hover:bg-zinc-900")}>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium ">{s.name}</div>
                        <div className="text-xs opacity-60 ">{s.description}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={glassyBadge("blue")}>{s.syntaxIds?.length ?? 0}</Badge>
                        <ChevronRight className="opacity-60" />
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layout */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left picks (desktop) */}
          <aside className="hidden lg:block lg:col-span-3">
            <Card className={clsx(isDark ? "bg-black border-zinc-800" : "bg-white")}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Users /> Quick picks</span>
                  <span className="text-xs opacity-60">10 random</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs opacity-60 mb-2">Click a list to view details</div>
                <ScrollArea style={{ height: "62vh" }}>
                  <div className="space-y-3 p-2">
                    {sidebarPicks.map((p) => (
                      <motion.div  key={p.id}
                        onClick={() => setSelected(p)}
                        className={clsx("p-3 rounded-lg flex items-center justify-between cursor-pointer border transition-shadow",
                          selected?.id === p.id ? "bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-zinc-900")}>
                        <div className="min-w-0">
                          <div className="font-medium ">{p.name}</div>
                          <div className="text-xs opacity-60 ">{p.description?.slice(0, 80) || "—"}</div>
                        </div>
                        <Badge className={glassyBadge("blue")}>{p.syntaxIds?.length ?? "—"}syntax</Badge>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <div className="flex items-center justify-between w-full text-xs opacity-60">
                  <div>FilterLists API</div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setSidebarPicks(pickRandom(lists, 10))} className="cursor-pointer"><RefreshCw /></Button>
                    <Button variant="ghost" onClick={() => setSidebarPicks(lists.slice(0, 10))} className="cursor-pointer">First</Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </aside>

          {/* Center detail */}
          <section className="lg:col-span-6">
<Card className="rounded-2xl overflow-hidden backdrop-blur-xl bg-white/60 dark:bg-black/50 shadow-lg border border-zinc-200/40 dark:border-zinc-800/40">
  {/* HEADER */}
  <CardHeader className="px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="min-w-0">
      <CardTitle className="text-xl font-semibold truncate flex items-center gap-2">
        <List className="w-5 h-5 opacity-70" />
        {selected?.name || "Select a list to view details"}
      </CardTitle>

      <div className="text-xs opacity-60 mt-1 truncate">
        {selected
          ? `${selected.syntaxIds?.length || 0} syntaxes • ${selected.languageIds?.length || 0} languages`
          : "No list selected"}
      </div>
    </div>

    <div className="flex items-center gap-3 shrink-0">
      <Button variant="ghost" onClick={() => setShowRaw(s => !s)} className="cursor-pointer">
        <FileText className="w-4 h-4" /> {showRaw ? "Hide raw" : "Raw"}
      </Button>
    </div>
  </CardHeader>

  {/* CONTENT */}
  <CardContent className="px-6">
    {loading ? (
      <div className="py-12 text-center opacity-70">
        <RefreshCw className="animate-spin mx-auto w-6 h-6" />
      </div>
    ) : error ? (
      <div className="py-12 text-center text-sm text-red-500">{error}</div>
    ) : !selected ? (
      <div className="py-12 text-center text-sm opacity-60">No list selected — pick from the left.</div>
    ) : (
      <div className="space-y-8">
        {/* TOP CARD */}
        <div className="p-4 sm:p-5 rounded-xl border shadow-sm bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-semibold">{selected.name}</h2>
                <Badge className={glassyBadge("neutral")}>
                  {selected.syntaxIds?.length ?? "—"} syntaxes
                </Badge>
              </div>

              <div className="text-sm opacity-70 mt-1">
                {selected.description || "No description available."}
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="text-right min-w-[140px]">
              <div className="text-xs opacity-60 flex items-center justify-end gap-1">
                <Users className="w-3 h-3" /> Maintainers
              </div>

              <div className="text-sm font-medium truncate">
                {selectedMaintainers.length ? selectedMaintainers.map(m => m.name).join(", ") : "—"}
              </div>

              <div className="text-xs opacity-60 mt-2 flex items-center justify-end gap-1">
                <Tag className="w-3 h-3" /> Tags
              </div>

              <div className="flex flex-wrap gap-2 mt-1 justify-end">
                {selectedTags.slice(0, 4).map(t => (
                  <Badge key={t.id} className={glassyBadge("green")}>{t.name}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* INNER GRID */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SYNTAXES */}
            <div className="p-4 rounded-lg border bg-white/50 dark:bg-zinc-900/60 backdrop-blur-md">
              <div className="text-xs opacity-60 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Syntaxes
              </div>

              <div className="mt-3 space-y-2 max-h-48 overflow-auto pr-1">
                {selectedSyntaxes.length ? selectedSyntaxes.map(sx => (
                  <div key={sx.id} className="text-sm">
                    <div className="font-medium">{sx.name}</div>
                    {sx.url && (
                      <a href={sx.url} target="_blank" className="text-xs underline opacity-60">
                        {sx.url}
                      </a>
                    )}
                  </div>
                )) : <div className="text-xs opacity-60">No syntaxes</div>}
              </div>
            </div>

            {/* LANGUAGES */}
            <div className="p-4 rounded-lg border bg-white/50 dark:bg-zinc-900/60 backdrop-blur-md">
              <div className="text-xs opacity-60 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Languages
              </div>

              <div className="mt-3 space-y-1 max-h-48 overflow-auto pr-1">
                {selectedLanguages.length
                  ? selectedLanguages.map(l => <div key={l.id} className="text-sm font-medium">{l.name}</div>)
                  : <div className="text-xs opacity-60">No languages</div>}
              </div>
            </div>
          </div>
        </div>

        {/* SOFTWARE SECTION */}
        <div className="p-4 sm:p-5 rounded-xl border bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Database className="w-4 h-4" /> Software (supports syntaxes)
            </div>
            <div className="text-xs opacity-60">{relevantSoftware.length} found</div>
          </div>
         <ScrollArea className="h-70">
          <div className="space-y-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {relevantSoftware.length ? relevantSoftware.map(sw => (
              <div
                key={sw.id}
                className="p-4 rounded-lg border hover:shadow-md transition-all bg-white/60 dark:bg-zinc-900/40 backdrop-blur-lg flex flex-col sm:flex-row items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{sw.name}</div>
                  <div className="text-xs opacity-60 truncate">{sw.description || sw.homeUrl || "—"}</div>
                  <div className="text-xs mt-2 opacity-60">
                    {(sw.syntaxIds || []).length} supported syntaxes
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {sw.homeUrl && (
                    <a href={sw.homeUrl} target="_blank" className="underline text-sm flex items-center gap-1">
                      <ExternalLink className="w-4 h-4" /> Visit
                    </a>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openSoftwareDialog(sw)} className="cursor-pointer">
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-xs opacity-60">No software found.</div>
            )}
          </div>
          </ScrollArea>
        </div>

        {/* MAINTAINERS + LICENSE GRID */}


        {/* RAW JSON */}
        <AnimatePresence>
          {showRaw && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Separator className="my-4" />
              <pre className="text-xs p-3 rounded-md border bg-white/60 dark:bg-zinc-900/70 backdrop-blur-md overflow-auto max-h-64">
                {prettyJSON(selected.raw || selected)}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )}
  </CardContent>

  {/* FOOTER */}
  <CardFooter className="p-5 text-xs opacity-60 flex items-center justify-between">
    <div>Data via FilterLists API</div>

    <div className="flex items-center gap-2">
      <Button variant="ghost" onClick={() => setDialogOpen(true)} className="cursor-pointer">
        <ExternalLink className="w-3 h-3" /> Endpoint
      </Button>

      <Button variant="outline" onClick={downloadJSON} className="cursor-pointer">
        <Download className="w-3 h-3" /> Download
      </Button>
    </div>
  </CardFooter>
</Card>

          </section>

          {/* Right panel */}
          <aside className="lg:col-span-3">
            <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* MAINTAINERS */}
          <div className="p-4 rounded-xl border bg-white/70 dark:bg-black/90 backdrop-blur-xl">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Maintainers
            </div>

            <div className="space-y-3 max-h-48 overflow-auto pr-1">
              {selectedMaintainers.length ? selectedMaintainers.map(m => (
                <div key={m.id} className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs opacity-60 flex flex-col gap-1">
                      {m.emailAddress && (
                        <a href={`mailto:${m.emailAddress}`} className="flex items-center gap-1 underline">
                          <Mail className="w-3 h-3" /> {m.emailAddress}
                        </a>
                      )}
                      {m.twitterHandle && (
                        <a href={`https://twitter.com/${m.twitterHandle}`} target="_blank" className="flex items-center gap-1 underline">
                          <Twitter className="w-3 h-3" /> @{m.twitterHandle}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="text-xs opacity-60">{m.organization || ""}</div>
                </div>
              )) : <div className="text-xs opacity-60">No maintainer data</div>}
            </div>
          </div>

          {/* LICENSE */}
          <div className="p-4 rounded-xl border bg-white/70 dark:bg-black/80 backdrop-blur-xl">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> License
            </div>

            {selectedLicense ? (
              <div>
                <div className="font-medium">{selectedLicense.name}</div>
                <div className="text-xs opacity-60">
                  {selectedLicense.permitsModification ? "Modification allowed" : "No modification allowed"}
                </div>

                <a
                  href={selectedLicense.url}
                  target="_blank"
                  className="mt-2 inline-block text-xs underline"
                >
                  License details
                </a>
              </div>
            ) : (
              <div className="text-xs opacity-60">No license info</div>
            )}
          </div>
        </div>
              <Card className="bg-white dark:bg-black/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Info /> Schema quick lookup</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm opacity-70 space-y-2">
                    <div><strong>/lists</strong> — list metadata.</div>
                    <div><strong>/software</strong> — software info (click for details).</div>
                    <div><strong>/syntaxes</strong> — syntax objects with url.</div>
                    <div><strong>/languages, /licenses, /maintainers, /tags</strong> — maps referenced by id.</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </main>

        {/* Endpoint dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl w-full p-3 rounded-2xl overflow-hidden">
            <DialogHeader>
              <DialogTitle>FilterLists API endpoints</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <div className="space-y-2 text-sm">
                <div><strong>Base (proxied):</strong> <code className="break-all">{API_BASE}</code></div>
                <div className="pt-3">Available endpoints used:</div>
                <ul className="list-disc list-inside mt-2">
                  <li>/languages</li>
                  <li>/licenses</li>
                  <li>/lists</li>
                  <li>/lists/{'{id}'}</li>
                  <li>/maintainers</li>
                  <li>/software</li>
                  <li>/software/{'{id}'}</li>
                  <li>/syntaxes</li>
                  <li>/tags</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end p-4 border-t">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Software detail dialog */}
        <Dialog open={softwareDialogOpen} onOpenChange={(v) => { setSoftwareDialogOpen(v); if (!v) setSoftwareDetail(null); }}>
          <DialogContent className="max-w-3xl w-full p-3 rounded-2xl overflow-hidden">
            <DialogHeader>
              <DialogTitle>{softwareDetail?.name || "Software details"}</DialogTitle>
            </DialogHeader>

            <div className="p-4">
              {softwareLoading ? (
                <div className="py-8 text-center"><RefreshCw className="animate-spin mx-auto" /></div>
              ) : !softwareDetail ? (
                <div className="py-6 text-center text-sm opacity-60">No details available</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">{softwareDetail.name}</div>
                      <div className="text-xs opacity-60 mt-1">{softwareDetail.description}</div>
                      <div className="mt-2 flex gap-2">
                        {softwareDetail.homeUrl && <a href={softwareDetail.homeUrl} target="_blank" rel="noreferrer" className="underline flex items-center gap-2"><ExternalLink /> Visit</a>}
                        {softwareDetail.repo && <a href={softwareDetail.repo} target="_blank" rel="noreferrer" className="underline flex items-center gap-2"><Github /> Repo</a>}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs opacity-60">Supported syntaxes</div>
                      <div className="font-medium">{(softwareDetail.syntaxIds || []).length}</div>
                      <div className="mt-2 text-xs opacity-60">Website</div>
                      <div className="font-medium text-sm">{softwareDetail.homeUrl ? <a href={softwareDetail.homeUrl} className="underline">{softwareDetail.homeUrl}</a> : "—"}</div>
                    </div>
                  </div>

                  <Separator />

            
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-end p-4 border-t">
              <Button variant="outline" onClick={() => { if (softwareDetail?.homeUrl) window.open(softwareDetail.homeUrl, "_blank"); }} className="cursor-pointer">Open website</Button>
              <Button variant="ghost" onClick={() => setSoftwareDialogOpen(false)} className="cursor-pointer">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
