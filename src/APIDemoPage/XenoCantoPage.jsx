// XenoCantoPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Menu,
  Search,
  ExternalLink,
  Play,
  Pause,
  ImageIcon,
  List,
  Loader2,
  Volume,
  MapPin,
  Download,
  Copy,
  FileText,
  X,
  Tag,
  Clock,
  Globe,
  User,
  Hash,
  ChevronRight,
  ChevronLeft,
  Star,
  Image,
  Layers
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

// shadcn-like UI elements (Badge / Sheet / ScrollArea). Replace with your project's components if name differs.
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

//
// XenoCantoPage - improved UI / layout / responsiveness
// - colorful glassy badges
// - suggestion improvements (id search)
// - random sidebar list (10 items) -> click to preview
// - mobile sheet for sidebar
// - improved center preview with lucide icons
//

// --- Config
const BASE = "https://xeno-canto.org/api/3/recordings";
const API_KEY = "874167476dd0fc04703f63fb9525baf6823db354"; // replace in prod / proxy server-side
const DEFAULT_QUERY = "en:\"robin\"";
const DEBOUNCE_MS = 300;

// --- Utilities
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function getThumbUrl(s) {
  if (!s) return null;
  const candidate = s.sono?.thumb || s.sono?.large || s.image || s.sono?.full || "";
  if (!candidate) return null;
  if (candidate.startsWith("//")) return `https:${candidate}`;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return null;
}

function normalizeQuery(raw) {
  if (!raw || !raw.trim()) return "";
  const s = raw.trim();
  if (s.includes(":")) return s;
  const twoWords = s.split(/\s+/);
  if (twoWords.length === 2) {
    const [a, b] = twoWords;
    const looksLikeLatin = /^[A-Z][a-z-]+$/.test(a) && /^[a-z-]+$/.test(b);
    if (looksLikeLatin) return `sp:"${a} ${b}"`;
  }
  return `en:"${s}"`;
}

function buildUrlFromUserInput(userInput, page = 1) {
  const q = normalizeQuery(userInput);
  const params = new URLSearchParams();
  if (q) params.set("query", q);
  if (API_KEY && API_KEY !== "YOUR_API_KEY") params.set("key", API_KEY);
  params.set("page", String(page || 1));
  return `${BASE}?${params.toString()}`;
}

function buildAudioUrl(rec) {
  if (!rec) return null;
  if (rec.file) return rec.file;
  if (rec.url) return rec.url;
  if (rec["file-name"] && rec.sono && rec.sono.full) {
    try {
      const full = rec.sono.full;
      const proto = full.startsWith("//") ? "https:" : "";
      const base = full.replace(/\/full\.(png|jpg|jpeg)$/i, "");
      return `${proto}${base}/${rec["file-name"]}`;
    } catch (e) {}
  }
  if (rec.sono && rec.sono.thumb && rec["file-name"]) {
    const proto = rec.sono.thumb.startsWith("//") ? "https:" : "";
    const base = rec.sono.thumb.replace(/\/thumb\.(png|jpg|jpeg)$/i, "");
    return `${proto}${base}/${rec["file-name"]}`;
  }
  return null;
}

function buildImageUrl(rec) {
  if (!rec) return null;
  if (rec.sono && rec.sono.large) return rec.sono.large.startsWith("//") ? `https:${rec.sono.large}` : rec.sono.large;
  if (rec.sono && rec.sono.full) return rec.sono.full.startsWith("//") ? `https:${rec.sono.full}` : rec.sono.full;
  if (rec.image) return rec.image.startsWith("//") ? `https:${rec.image}` : rec.image;
  if (rec.sono && rec.sono.thumb) return rec.sono.thumb.startsWith("//") ? `https:${rec.sono.thumb}` : rec.sono.thumb;
  return null;
}

function makeGlassyBadgeProps(index) {
  const palette = [
    // Existing 6
    "backdrop-blur-md bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300",
    "backdrop-blur-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300",
    "backdrop-blur-md bg-lime-500/10 border border-lime-500/20 text-lime-700 dark:text-lime-300",
    "backdrop-blur-md bg-zinc-500/10 border border-zinc-500/20 text-zinc-700 dark:text-zinc-300",
    "backdrop-blur-md bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300",
    "backdrop-blur-md bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300",

    // ⭐ NEW 10 VARIANTS ⭐
    "backdrop-blur-md bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300",
    "backdrop-blur-md bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300",
    "backdrop-blur-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300",
    "backdrop-blur-md bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300",
    "backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    "backdrop-blur-md bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300",
    "backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300",
    "backdrop-blur-md bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300",
    "backdrop-blur-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300",
    "backdrop-blur-md bg-pink-500/10 border border-pink-500/20 text-pink-700 dark:text-pink-300"
  ];

  return palette[index % palette.length];
}



// --- Component
export default function XenoCantoPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // core state
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [activeSuggestIdx, setActiveSuggestIdx] = useState(-1);

  const [recording, setRecording] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingRecording, setLoadingRecording] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [randomList, setRandomList] = useState([]);
  const [selectedSidebarId, setSelectedSidebarId] = useState(null);

  const suggestTimer = useRef(null);
  const searchController = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // attempt smart suggestion fetch (debounced)
  async function fetchSuggestions(q) {
    if (!q || !q.trim()) {
      setSuggestions([]);
      return;
    }

    // If user typed an ID (digits only) - prefer ID suggestion
    if (/^\d+$/.test(q.trim())) {
      // show a single suggestion item that will attempt to fetch that record on pick
      setSuggestions([{ id: q.trim(), en: `Search by ID ${q.trim()}`, cnt: "—", date: "—", _isIdSuggestion: true }]);
      return;
    }

    // normal suggestions via query
    const url = buildUrlFromUserInput(q);
    if (searchController.current) searchController.current.abort();
    const ctrl = new AbortController();
    searchController.current = ctrl;
    setLoadingSuggest(true);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(json.recordings || []);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("suggest fetch error", err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
      searchController.current = null;
    }
  }

  async function fetchFirstByQuery(q) {
    if (!q || !q.trim()) {
      showToast("info", 'Please enter a query using tags (e.g. cnt:India or en:"robin").');
      return;
    }
    setLoadingRecording(true);
    try {
      const url = buildUrlFromUserInput(q);
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Fetch failed (${res.status})`);
        setLoadingRecording(false);
        return;
      }
      const json = await res.json();
      setRawResp(json);
      const first = Array.isArray(json.recordings) && json.recordings.length > 0 ? json.recordings[0] : null;
      if (first) {
        setRecording(first);
        setSelectedSidebarId(first.id);
      } else {
        setRecording(null);
        showToast("info", "No recordings found for that query.");
      }
    } catch (err) {
      console.error("fetchFirstByQuery error", err);
      showToast("error", "Network error");
    } finally {
      setLoadingRecording(false);
    }
  }

  // If picking a suggestion: handle numeric id suggestion or full recording
  async function pickSuggestion(item) {
    setShowSuggest(false);
    setSuggestions([]);
    setActiveSuggestIdx(-1);

    if (!item) return;

    // numeric ID suggestion
    if (item._isIdSuggestion || (/^\d+$/.test(String(item.id || "")) && !item.en)) {
      // try to fetch the recording by id using query id:<id> — attempt heuristically
      const id = item.id || String(item);
      setLoadingRecording(true);
      try {
        // XenoCanto doesn't have a formal single-recording path in this code; try using query id:<id>
        const url = buildUrlFromUserInput(`id:${id}`);
        const res = await fetch(url);
        if (!res.ok) {
          showToast("error", `Fetch failed (${res.status})`);
          setLoadingRecording(false);
          return;
        }
        const json = await res.json();
        setRawResp(json);
        const first = Array.isArray(json.recordings) && json.recordings.length > 0 ? json.recordings[0] : null;
        if (first) {
          setRecording(first);
          setSelectedSidebarId(first.id);
          setSidebarOpen(false);
        } else {
          showToast("info", `No recording found for id:${id}`);
        }
      } catch (err) {
        console.error("id fetch error", err);
        showToast("error", "Network error");
      } finally {
        setLoadingRecording(false);
      }
      return;
    }

    // normal recording object
    setRecording(item);
    setRawResp({ recordings: [item] });
    setSelectedSidebarId(item.id);
  }

  async function fetchRandomList() {
    // Try to fetch a small page and pick some items as "random"
    try {
      const url = buildUrlFromUserInput(DEFAULT_QUERY, 1);
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      const recs = json.recordings || [];
      // shuffle and pick 10 (or fallback to available)
      const shuffled = [...recs].sort(() => Math.random() - 0.5).slice(0, 10);
      setRandomList(shuffled);
      if (shuffled.length > 0 && !recording) {
        setRecording(shuffled[0]);
        setSelectedSidebarId(shuffled[0].id);
      }
    } catch (err) {
      console.warn("random list fetch failed", err);
    }
  }

  // debounce input changes
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    setActiveSuggestIdx(-1);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => fetchSuggestions(v), DEBOUNCE_MS);
  }

  function onInputKeyDown(e) {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeSuggestIdx >= 0 && suggestions[activeSuggestIdx]) {
        pickSuggestion(suggestions[activeSuggestIdx]);
      } else {
        onSubmit(e);
      }
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  }

  async function onSubmit(e) {
    e?.preventDefault?.();
    await fetchFirstByQuery(query);
    setShowSuggest(false);
  }

  // audio play/pause state
  useEffect(() => {
    const aud = audioRef.current;
    if (!aud) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    aud.addEventListener("play", onPlay);
    aud.addEventListener("pause", onPause);
    return () => {
      aud.removeEventListener("play", onPlay);
      aud.removeEventListener("pause", onPause);
    };
  }, []);

  function togglePlay() {
    const aud = audioRef.current;
    if (!aud) return;
    if (aud.paused) aud.play().catch(() => showToast("error", "Playback blocked"));
    else aud.pause();
  }

  function downloadRecording() {
    if (!recording) return showToast("info", "No recording loaded");
    const url = buildAudioUrl(recording);
    if (!url) return showToast("info", "No downloadable audio URL available");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(recording.en || recording.species || "recording").replace(/\s+/g, "_")}.mp3`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function copyEndpoint() {
    const u = buildUrlFromUserInput(query);
    navigator.clipboard.writeText(u);
    showToast("success", "Endpoint copied");
  }

  useEffect(() => {
    fetchFirstByQuery(DEFAULT_QUERY);
    fetchRandomList();
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (searchController.current) searchController.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const audioUrl = useMemo(() => buildAudioUrl(recording), [recording]);
  const imageUrl = useMemo(() => buildImageUrl(recording), [recording]);

  const recordingMeta = useMemo(() => {
    if (!recording) return {};
    return {
      id: recording.id,
      commonName: recording.en || recording.species || recording.comName || "Unknown",
      scientific: recording.gen && recording.sp ? `${recording.gen} ${recording.sp}` : recording.scientific ?? null,
      country: recording.cnt || recording.country || "—",
      location: recording.loc || recording.location || "—",
      date: recording.date || "—",
      time: recording.time || null,
      length: recording.length || "—",
      quality: recording.q || recording.quality || "—",
      recordist: recording.rec || recording.recordist || recording.username || recording.uploaded_by || "—",
      tags: recording.tags || recording.type || recording.sound_type || "—",
      comments: recording.rmk || recording.comments || "—",
      lat: recording.lat || null,
      lng: recording.lng || null
    };
  }, [recording]);

  // UI helpers
  function SidebarItem({ r, index }) {
    const thumb = getThumbUrl(r);
    const isSelected = String(r.id) === String(selectedSidebarId);

    return (
      <div
        role="button"
        onClick={() => {
          setRecording(r);
          setRawResp({ recordings: [r] });
          setSelectedSidebarId(r.id);
          setSidebarOpen(false);
        }}
        className={clsx(
          "flex items-center gap-3 p-2 rounded-lg transition-all",
          "cursor-pointer",
          isSelected ? " bg-zinc-600/10 border border-zinc-400/20" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
        )}
      >
        <div className="w-12 h-10 rounded-sm overflow-hidden flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
          {thumb ? <img src={thumb} alt={r.en || r.species} className="w-full h-full object-cover" /> : <Image size={18} />}
        </div>
        <div className="w-40 sm:w-46">
          <div className="text-sm font-medium truncate">{r.en || r.species || "Unknown"}</div>
          <div className="text-xs opacity-60 truncate">{r.cnt || "—"} • {r.date || "—"}</div>
        </div>
        <div className="text-xs opacity-60 ml-1">#{r.id}</div>
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 max-w-8xl mx-auto", isDark ? "bg-zinc-950 text-zinc-100" : "bg-gray-50 text-zinc-900")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 md:hidden cursor-pointer" onClick={() => setSidebarOpen(true)}>
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" onOpenChange={(open) => setSidebarOpen(open)} className="w-[320px]">
              <div className="px-4 py-4">
                <h3 className="text-lg font-semibold">Explore</h3>
                <p className="text-sm opacity-60 mt-1">Pick from the sidebar list</p>
              </div>
              <Separator />
              <ScrollArea className="h-[80vh]">
                <div className="p-4 space-y-2">
                  {randomList.length === 0 ? (
                    <div className="text-sm opacity-60">Loading…</div>
                  ) : (
                    randomList.map((r, idx) => <SidebarItem key={r.id ?? idx} r={r} index={idx} />)
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">Songscape</h1>
            <div className="text-xs opacity-60">Bird recordings — search, play, inspect metadata</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-zinc-900/40 border border-zinc-800" : "bg-white border border-zinc-200")}>
          <Search className="opacity-60" />
          <Input
            aria-label="Search recordings"
            placeholder='Try: en:"European robin", cnt:India, sp:"Larus fuscus" or type an ID'
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onInputKeyDown}
            className="border-0 shadow-none bg-transparent outline-none flex-1"
            onFocus={() => setShowSuggest(true)}
          />
          <Button type="button" variant="ghost" onClick={() => { setQuery(DEFAULT_QUERY); fetchFirstByQuery(DEFAULT_QUERY); }} className="cursor-pointer"><Layers size={16} />&nbsp;<span className="hidden md:inline">Default</span></Button>
          <Button type="submit" variant="outline" className="cursor-pointer"><Search /></Button>
        </form>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx("absolute left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl z-50 rounded-xl overflow-hidden shadow-2xl", isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200")}
            role="listbox"
            aria-label="Recording suggestions"
            style={{ marginTop: 8 }}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            <ScrollArea className="max-h-64 overflow-y-auto">
              <div className="p-2 space-y-1">
                {suggestions.map((s, idx) => {
                  const isActive = idx === activeSuggestIdx;
                  const thumb = getThumbUrl(s);
                  return (
                    <div
                      role="option"
                      key={s.id ?? idx}
                      aria-selected={isActive}
                      onClick={() => pickSuggestion(s)}
                      onMouseEnter={() => setActiveSuggestIdx(idx)}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer",
                        isActive ? (isDark ? "bg-zinc-800/60" : "bg-zinc-100") : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <div className="w-10 h-8 rounded-sm overflow-hidden bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                        {thumb ? <img src={thumb} alt={s.en || s.species} className="w-full h-full object-cover" /> : <ImageIcon />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium truncate">{s.en || s.species || (s._isIdSuggestion ? `ID: ${s.id}` : "Unknown")}</div>
                          <Badge className={clsx("text-xs ml-1", "bg-gradient-to-r", makeGlassyBadgeProps(idx))}>#{s.id}</Badge>
                        </div>
                        <div className="text-xs opacity-60 truncate">{s.cnt ?? s.country ?? "—"} • {s.date ?? "—"}</div>
                      </div>

                      {s._isIdSuggestion ? <Hash className="opacity-60" /> : <ChevronRight className="opacity-60" />}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Sidebar (large screens) */}
        <aside className="hidden lg:block lg:col-span-3">
          <Card className={clsx("rounded-2xl overflow-hidden border p-0", isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Explore</CardTitle>
                <div className="text-xs opacity-60">Quick picks</div>
              </div>
              <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => { fetchRandomList(); showToast("success", "Refreshed list"); }}>
                <ChevronLeft /> Refresh
              </Button>
            </CardHeader>

            <Separator />

            <CardContent className="p-2">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-2">
                  {randomList.length === 0 ? (
                    <div className="p-4 text-sm opacity-60">Loading…</div>
                  ) : (
                    randomList.map((r, idx) => <SidebarItem key={r.id ?? idx} r={r} index={idx} />)
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* Media column */}
        <section className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "border-b border-zinc-800" : "border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Audio</CardTitle>
                <div className="text-xs opacity-60">{recordingMeta?.commonName ?? "—"}</div>
              </div>
              <div className="text-xs opacity-60">ID: <span className="font-medium">{recordingMeta?.id ?? "—"}</span></div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="rounded-md overflow-hidden border">
                  {imageUrl ? (
                    <img src={imageUrl} alt={recordingMeta?.commonName || "thumb"} className="w-full h-48 object-cover cursor-pointer" onClick={() => setImageOpen(true)} />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
                      <ImageIcon />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => togglePlay()} className="cursor-pointer">
                    {isPlaying ? <Pause /> : <Play />} <span className="hidden sm:inline">{isPlaying ? "Pause" : "Play"}</span>
                  </Button>
                  <Button variant="ghost" onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; }} className="cursor-pointer"><Volume /> Reset</Button>
                  <Button variant="outline" onClick={() => downloadRecording()} className="cursor-pointer"><Download /> <span className="hidden sm:inline">Download</span></Button>
                </div>

                <div className="mt-1 text-xs opacity-60">
                  <div><Clock className="inline-block mr-1" /> Length: <span className="font-medium ml-1">{recordingMeta.length ?? "—"}</span></div>
                  <div className="mt-1"><Globe className="inline-block mr-1" /> {recordingMeta.country ?? "—"} {recordingMeta.time ? `• ${recordingMeta.time}` : ""}</div>
                </div>

                <div>
                  <audio ref={audioRef} controls src={audioUrl ?? undefined} className="w-full" onError={(e) => console.warn("audio error", e)} />
                  {!audioUrl && <div className="text-xs mt-2 opacity-60">Audio URL not available. Try another recording or proxy the audio server-side if blocked.</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Center preview */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-6 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">{recordingMeta.commonName ?? "No recording loaded"}</h2>
                <div className="text-sm opacity-60 flex items-center flex-wrap gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <User className="opacity-60" />
                    <span className="truncate">{recordingMeta.recordist ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="opacity-60" />
                    <span className="truncate">{recordingMeta.tags ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="opacity-60" />
                    <span>{recordingMeta.date ?? "—"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => { if (recording && recording.url) window.open(recording.url, "_blank"); else showToast("info", "Open source not available"); }} className="cursor-pointer"><ExternalLink /></Button>
                  <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer"><List /></Button>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={clsx("text-xs p-1", "bg-gradient-to-r", makeGlassyBadgeProps(0))}>{recordingMeta.quality ? `Q: ${recordingMeta.quality}` : "Quality: —"}</Badge>
                  <Badge className={clsx("text-xs p-1", "bg-gradient-to-r", makeGlassyBadgeProps(1))}>{recordingMeta.country ?? "—"}</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loadingRecording ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !recording ? (
                <div className="py-12 text-center text-sm opacity-60">No recording loaded. Use search to find recordings or select from the sidebar.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-md border">
                      <div className="flex items-center gap-2 text-xs opacity-60"><MapPin /> Location</div>
                      <div className="text-sm font-medium">{recordingMeta.location ?? "—"}</div>
                      <div className="text-xs opacity-60 mt-2">{recordingMeta.country ?? "—"}</div>
                      {recordingMeta.lat && recordingMeta.lng && (
                        <div className="mt-2">
                          <a href={`https://www.google.com/maps?q=${recordingMeta.lat},${recordingMeta.lng}`} target="_blank" rel="noreferrer" className="text-xs underline flex items-center gap-1 cursor-pointer"><MapPin /> Open map</a>
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-md border">
                      <div className="flex items-center gap-2 text-xs opacity-60"><User /> Recordist</div>
                      <div className="text-sm font-medium">{recordingMeta.recordist ?? "—"}</div>
                      <div className="text-xs opacity-60 mt-2">Quality: {recordingMeta.quality ?? "—"}</div>
                    </div>

                    <div className="p-3 rounded-md border">
                      <div className="flex items-center gap-2 text-xs opacity-60"><Hash /> ID</div>
                      <div className="text-sm font-medium">#{recordingMeta.id ?? "—"}</div>
                      <div className="text-xs opacity-60 mt-2">Length: {recordingMeta.length ?? "—"}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-md border">
                    <div className="flex items-center gap-2 text-xs opacity-60"><FileText /> Comments / Notes</div>
                    <div className="mt-2 text-sm">{recordingMeta.comments ?? "—"}</div>
                  </div>

                  <div className="p-3 rounded-md border">
                    <div className="flex items-center gap-2 text-xs opacity-60"><Tag /> Tags / Types</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {String(recordingMeta.tags ?? "")
                        .split(/\s+[,;]?\s*/)
                        .filter(Boolean)
                        .slice(0, 8)
                        .map((t, i) => (
                          <Badge key={t + i} className={clsx("text-xs", makeGlassyBadgeProps(i))}>
                            {t}
                          </Badge>
                        ))}
                      {(!recordingMeta.tags || String(recordingMeta.tags).trim() === "") && <div className="text-xs opacity-60">—</div>}
                    </div>
                  </div>

                  <AnimatePresence>
                    {showRaw && rawResp && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="p-3 rounded-md border">
                        <div className="flex items-center justify-between">
                          <div className="text-xs opacity-60 flex items-center gap-2"><List /> Raw JSON</div>
                          <div className="text-xs opacity-60">Size: {prettyJSON(rawResp).length} bytes</div>
                        </div>
                        <pre className="text-xs overflow-auto mt-2" style={{ maxHeight: 300 }}>{prettyJSON(rawResp)}</pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: Quick actions */}
        <section className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-0", isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <div className="text-xs opacity-60">Utilities & developer tools</div>
              </div>
              <div className="text-xs opacity-60">{recordingMeta.date ?? "—"}</div>
            </CardHeader>

            <Separator />

            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                <Button variant="outline" onClick={() => { if (recording && recording.url) window.open(recording.url, "_blank"); else showToast("info", "No source."); }} className="cursor-pointer justify-start"><ExternalLink /> <span className="ml-2">Open source</span></Button>

                <Button variant="outline" onClick={() => downloadRecording()} className="cursor-pointer justify-start"><Download /> <span className="ml-2">Download audio</span></Button>

                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(buildUrlFromUserInput(query)); showToast("success", "Endpoint copied"); }} className="cursor-pointer justify-start"><Copy /> <span className="ml-2">Copy endpoint</span></Button>

                <Button variant="outline" onClick={() => { if (rawResp) { const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `xenocanto_${recording?.id ?? "resp"}.json`; a.click(); URL.revokeObjectURL(a.href); } else showToast("info", "No data to download"); }} className="cursor-pointer justify-start"><FileText /> <span className="ml-2">Download JSON</span></Button>
              </div>

              <Separator className="my-3" />

              <div className="text-xs opacity-60">Tip: use queries like <code>sp:"Larus fuscus"</code> or <code>cnt:India</code> for precise results.</div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Image dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-zinc-950" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{recordingMeta.commonName ?? "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {imageUrl ? (
              <img src={imageUrl} alt={recordingMeta.commonName} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from Xeno-Canto</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { if (recording && recording.url) window.open(recording.url, "_blank"); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// small placeholder if Badge/Sheet/ScrollArea not available — fallback simple components
// (If you already have Badge/Sheet/ScrollArea in your UI library, delete these fallbacks.)
