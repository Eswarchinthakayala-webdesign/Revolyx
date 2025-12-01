// src/pages/TVMazePage.jsx
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  List,
  Copy,
  Download,
  Star,
  X,
  Calendar,
  Menu,
  RefreshCw,
  Check,
  Users,
  Film,
  MapPin,
  Badge as LucideBadge,
  FileText,
  Globe,
  Play,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

/* ---------- Constants ---------- */
const BASE_API = "https://api.tvmaze.com";
const DEBOUNCE_MS = 350;
const RANDOM_COUNT = 10;

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function sanitizeHtml(html) {
  if (!html) return "";
  if (typeof document === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const allowed = new Set(["P", "BR", "STRONG", "B", "EM", "I", "UL", "OL", "LI", "A", "SPAN"]);
  doc.querySelectorAll("script,style").forEach((n) => n.remove());
  function walk(node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!allowed.has(child.tagName)) {
          const frag = document.createDocumentFragment();
          while (child.firstChild) frag.appendChild(child.firstChild);
          child.parentNode.replaceChild(frag, child);
        } else {
          if (child.tagName === "A") {
            const href = child.getAttribute("href") || "";
            if (href.trim().toLowerCase().startsWith("javascript:")) {
              child.removeAttribute("href");
            } else {
              child.setAttribute("rel", "noopener noreferrer");
              child.setAttribute("target", "_blank");
            }
          }
          walk(child);
        }
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
      }
    }
  }
  walk(doc.body);
  return doc.body.innerHTML;
}

function pickRandom(arr = [], n = 10) {
  const copy = Array.isArray(arr) ? arr.slice() : [];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

/* ---------- Component ---------- */
export default function TVMazePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // tvmaze search results or byId synthetic
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  const [selectedShow, setSelectedShow] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingShow, setLoadingShow] = useState(false);
  const [episodes, setEpisodes] = useState(null);

  const [showRaw, setShowRaw] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageDialogUrl, setImageDialogUrl] = useState("");

  const [copied, setCopied] = useState(false);
  const [copyAnimKey, setCopyAnimKey] = useState(0);

  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const suggestTimer = useRef(null);

  // sidebar / random picks
  const [randomList, setRandomList] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sheet

  /* ---------- Fetch helpers ---------- */

  async function searchShows(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const url = `${BASE_API}/search/shows?q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { signal: ac.signal });
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(json || []);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Search error", err);
        setSuggestions([]);
      }
    } finally {
      setLoadingSuggest(false);
      abortRef.current = null;
    }
  }

  async function fetchShowById(id, { loadEpisodes = false } = {}) {
    if (!id) return;
    setLoadingShow(true);
    setEpisodes(null);
    try {
      const res = await fetch(`${BASE_API}/shows/${id}`);
      if (!res.ok) {
        showToast("error", `Failed to load show (${res.status})`);
        setLoadingShow(false);
        return;
      }
      const json = await res.json();
      setSelectedShow(json);
      setRawResp(json);
      if (loadEpisodes) fetchEpisodesForShow(id);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch show");
    } finally {
      setLoadingShow(false);
    }
  }

  async function fetchEpisodesForShow(id) {
    if (!id) return;
    try {
      setEpisodes(null);
      const res = await fetch(`${BASE_API}/shows/${id}/episodes`);
      if (!res.ok) {
        showToast("error", "Failed to load episodes");
        setEpisodes([]);
        return;
      }
      const json = await res.json();
      setEpisodes(json || []);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load episodes");
      setEpisodes([]);
    }
  }

  async function fetchRandomShows() {
    try {
      // We fetch first page of shows and sample from it (TVMaze returns large lists)
      const res = await fetch(`${BASE_API}/shows`);
      if (!res.ok) return;
      const all = await res.json();
      const pool = Array.isArray(all) ? all.slice(0, 600) : [];
      const chosen = pickRandom(pool, RANDOM_COUNT);
      setRandomList(chosen);
    } catch (err) {
      console.error("Random fetch error", err);
    }
  }

  /* ---------- Handlers ---------- */

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    setActiveIndex(-1);

    if (suggestTimer.current) clearTimeout(suggestTimer.current);

    const trimmed = v.trim();
    // if it's a number (small id), show "load by ID" suggestion immediately
    const numericId = trimmed.match(/^(\d{1,6})$/);
    if (numericId) {
      setSuggestions([{ byId: true, id: Number(numericId[1]) }]);
      setLoadingSuggest(false);
      return;
    }

    // otherwise debounce search
    suggestTimer.current = setTimeout(() => searchShows(trimmed), DEBOUNCE_MS);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    const trimmed = query.trim();
    if (!trimmed) {
      showToast("info", "Try searching a show name or an ID.");
      return;
    }
    const numericId = trimmed.match(/^(\d{1,6})$/);
    if (numericId) {
      await fetchShowById(Number(numericId[1]), { loadEpisodes: true });
      setShowSuggest(false);
      return;
    }
    setLoadingSuggest(true);
    try {
      const res = await fetch(`${BASE_API}/search/shows?q=${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      setLoadingSuggest(false);
      if (json && json.length > 0) {
        const first = json[0].show;
        await fetchShowById(first.id, { loadEpisodes: true });
        setShowSuggest(false);
        showToast("success", `Loaded: ${first.name}`);
      } else {
        showToast("info", "No shows found");
      }
    } catch (err) {
      setLoadingSuggest(false);
      console.error(err);
      showToast("error", "Search failed");
    }
  }

  function chooseSuggestionAt(index) {
    const item = suggestions[index];
    if (!item) return;
    if (item.byId) {
      fetchShowById(item.id, { loadEpisodes: true });
      setShowSuggest(false);
      return;
    }
    const show = item.show;
    setSelectedShow(show);
    setRawResp(show);
    setShowSuggest(false);
    fetchEpisodesForShow(show.id);
  }

  function handleKeyDown(e) {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        chooseSuggestionAt(activeIndex);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  }

  async function handleCopy() {
    const payload = rawResp || selectedShow;
    if (!payload) return showToast("info", "Nothing to copy");
    try {
      await navigator.clipboard.writeText(prettyJSON(payload));
      setCopied(true);
      setCopyAnimKey((k) => k + 1);
      showToast("success", "Copied JSON");
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error(err);
      showToast("error", "Copy failed");
    }
  }

  function handleDownload() {
    const payload = rawResp || selectedShow;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = (selectedShow?.name || "show").replace(/\s+/g, "_");
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Download started");
  }

  function onClickPoster(url) {
    if (!url) return showToast("info", "No image available");
    setImageDialogUrl(url);
    setImageDialogOpen(true);
  }

  /* ---------- Initial load ---------- */
  useEffect(() => {
    fetchShowById(1, { loadEpisodes: false }).catch(() => {});
    fetchRandomShows();
    // cleanup timers on unmount
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (abortRef.current) abortRef.current.abort?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sanitizedSummary = useMemo(() => sanitizeHtml(selectedShow?.summary || ""), [selectedShow?.summary]);

  /* ---------- UI helpers ---------- */
  function glassBadge({ icon, text }) {
    return (
      <Badge className={clsx(
        "inline-flex items-center gap-2 px-2 py-1 rounded-full shadow-sm",
        isDark ? "bg-white/70 border border-white/60 text-black/90" : "bg-white/70 border border-zinc-200 text-zinc-900"
      )}>
        {icon}
        <span className="text-xs">{text}</span>
      </Badge>
    );
  }

  /* ---------- Render ---------- */
  return (
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-start flex-wrap md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Mobile sheet trigger */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 rounded-md cursor-pointer md:hidden"><Menu /></Button>
            </SheetTrigger>

            <SheetContent side="left" className=" p-3">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">Random Picks</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => fetchRandomShows()} className="cursor-pointer"><RefreshCw /></Button>
        
                  </div>
                </div>

                <ScrollArea style={{ height: 520 }}>
                 <div className="space-y-2 py-2">
              {randomList.map((r) => {
                const selected = selectedShow?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => { setSelectedShow(r); setRawResp(r); fetchEpisodesForShow(r.id); }}
                    className={clsx(
                      "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all",
                      selected
                        ? "bg-zinc-50 dark:bg-zinc-800/60   border border-zinc-300"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <img src={r.image?.medium || ""} alt={r.name} className="w-12 h-12 rounded-md object-cover" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.name}</div>
                      <div className="text-xs opacity-60 truncate">{r.language || "—"}</div>
                    </div>
                    <Badge variant="secondary" className="ml-auto">#{r.id}</Badge>
                  </div>
                );
              })}
            </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">TVHub — TVMaze Browser</h1>
            <div className="text-xs opacity-70">Search shows, inspect metadata & episodes, export JSON.</div>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[720px] rounded-lg px-3 py-2 shadow-sm", isDark ? "bg-black/50 border border-zinc-800" : "bg-white border border-zinc-200")} onKeyDown={handleKeyDown} role="search" aria-label="Search TV shows">
          <Search className="opacity-60" />
          <Input
            ref={inputRef}
            placeholder="Search shows (name) or type an ID number..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setShowSuggest(true)}
            className="border-0 bg-transparent outline-none shadow-none"
            aria-autocomplete="list"
            aria-controls="tv-suggestions"
          />
          <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          <Button type="button" variant="ghost" className="px-2 cursor-pointer" onClick={() => { setShowRaw((s) => !s); }} title="Toggle raw"><FileText /> {showRaw ? "Hide Raw" : "Show Raw"}</Button>
        </form>
      </header>

      {/* suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            id="tv-suggestions"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_360px)] md:right-auto max-w-[720px] rounded-xl overflow-hidden shadow-2xl", isDark ? "bg-black/70 border border-zinc-800" : "bg-white border border-zinc-200")}
            role="listbox"
            aria-label="Show suggestions"
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => {
              if (s.byId) {
                const id = s.id;
                const isActive = idx === activeIndex;
                return (
                  <li key={`byid-${id}`} role="option" aria-selected={isActive} className={clsx("px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer", isActive ? "bg-zinc-100 dark:bg-zinc-800/50" : "")} onClick={() => { fetchShowById(id, { loadEpisodes: true }); setShowSuggest(false); }}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 flex items-center justify-center rounded-sm bg-zinc-100 dark:bg-zinc-800 text-xs">ID</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">Load show by ID — {id}</div>
                        <div className="text-xs opacity-60 truncate">Directly fetch show with id {id}</div>
                      </div>
                      <div className="text-xs opacity-60">#{id}</div>
                    </div>
                  </li>
                );
              }

              const show = s.show;
              const key = show.id || show.name;
              const isActive = idx === activeIndex;
              return (
                <li key={key} role="option" aria-selected={isActive} className={clsx("px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer", isActive ? "bg-zinc-100 dark:bg-zinc-800/50" : "")}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(-1)}
                  onClick={() => {
                    setSelectedShow(show);
                    setRawResp(show);
                    setShowSuggest(false);
                    fetchEpisodesForShow(show.id);
                    inputRef.current?.blur();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img src={show.image?.medium || ""} alt={show.name || "thumb"} className="w-12 h-8 object-cover rounded-sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{show.name}</div>
                      <div className="text-xs opacity-60 truncate">{(show.type ? `${show.type} • ${show.language}` : show.language) || "—"}</div>
                    </div>
                    <div className="text-xs opacity-60">{show.premiered ? new Date(show.premiered).getFullYear() : "—"}</div>
                  </div>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left sidebar (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Random Picks</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => fetchRandomShows()} className="cursor-pointer"><RefreshCw /></Button>
            </div>
          </div>

          <ScrollArea className="overflow-y-auto pb-3" style={{ maxHeight: 520 }}>
            <div className="space-y-2 py-2">
              {randomList.map((r) => {
                const selected = selectedShow?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => { setSelectedShow(r); setRawResp(r); fetchEpisodesForShow(r.id); }}
                    className={clsx(
                      "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all",
                      selected
                        ? "bg-zinc-50 dark:bg-zinc-800/60   border border-zinc-300"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <img src={r.image?.medium || ""} alt={r.name} className="w-12 h-12 rounded-md object-cover" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.name}</div>
                      <div className="text-xs opacity-60 truncate">{r.language || "—"}</div>
                    </div>
                    <Badge variant="secondary" className="ml-auto">#{r.id}</Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <Separator className="my-4" />

          <div>
            <div className="text-sm font-semibold mb-2">About</div>
            <div className="text-xs opacity-70">Data powered by TVMaze API. Use the search to find shows by name or enter an ID directly.</div>
            <div className="mt-3">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(BASE_API); showToast("success", "API base copied"); }} className="w-full cursor-pointer"><Copy /> Copy API</Button>
            </div>
          </div>
        </aside>

        {/* Center: show viewer */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex flex-wrap items-center justify-between gap-3", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="flex items-center gap-3"><Users /> <span>Show Details</span></CardTitle>
                <div className="text-xs opacity-60">{selectedShow?.name || "Select a show or search above"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => { if (selectedShow) fetchShowById(selectedShow.id, { loadEpisodes: false }); }}>
                  <Loader2 className={loadingShow ? "animate-spin" : ""} /> Refresh
                </Button>

                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide Raw" : "Raw"}</Button>

                <Button className="cursor-pointer" variant="ghost" onClick={() => setMapDialogOpen(true)}><Globe /> More</Button>


              </div>
            </CardHeader>

            <CardContent>
              {loadingShow ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selectedShow ? (
                <div className="py-12 text-center text-sm opacity-60">No show loaded — try searching above.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Poster */}
                  <div className={clsx("p-3 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="relative rounded-lg overflow-hidden shadow-md">
                      <img
                        src={selectedShow.image?.original || selectedShow.image?.medium || ""}
                        alt={selectedShow.name}
                        className="w-full h-56 object-cover cursor-pointer"
                        onClick={() => onClickPoster(selectedShow.image?.original || selectedShow.image?.medium)}
                      />
                      <div className="absolute left-3 top-3 flex gap-2">
                        {glassBadge({ icon: <Film className="w-4 h-4" />, text: selectedShow.premiered || "—" })}
                        {glassBadge({ icon: <Star className="w-4 h-4" />, text: selectedShow.rating?.average ? String(selectedShow.rating.average) : "—" })}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-lg font-semibold flex flex-col items-start gap-1">
                        {selectedShow.name}
                         <div className="text-xs opacity-70">{selectedShow.type} • {selectedShow.language}</div>
                        <span className="ml-2">{selectedShow.network?.country?.name && glassBadge({ icon: <MapPin className="w-3 h-3" />, text: selectedShow.network.country.name })}</span>
                      </div>
                     

                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <div className="p-2 rounded-md border cursor-pointer">
                          <div className="text-xs opacity-60 flex items-center gap-2"><Clock className="w-4 h-4" /> Runtime</div>
                          <div className="font-medium">{selectedShow.runtime ? `${selectedShow.runtime} min` : "—"}</div>
                        </div>
                        <div className="p-2 rounded-md border cursor-pointer">
                          <div className="text-xs opacity-60 flex items-center gap-2"><Calendar className="w-4 h-4" /> Premiered</div>
                          <div className="font-medium">{selectedShow.premiered || "—"}</div>
                        </div>

                        <div className="p-2 rounded-md border cursor-pointer">
                          <div className="text-xs opacity-60 flex items-center gap-2"><LucideBadge className="w-4 h-4" /> Network</div>
                          <div className="font-medium">{selectedShow.network?.name || selectedShow.webChannel?.name || "—"}</div>
                        </div>

                        <div className="p-2 rounded-md border cursor-pointer">
                          <div className="text-xs opacity-60 flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Official</div>
                          <div className="font-medium">
                            {selectedShow.officialSite ? (
                              <a href={selectedShow.officialSite} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1"><ExternalLink className="w-4 h-4 inline" /> Visit</a>
                            ) : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary & fields (span 2) */}
                  <div className={clsx("p-3 rounded-xl border md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-start flex-col justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Users /> Summary</div>
                        <div className="text-sm leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedSummary || "<p>No summary available.</p>" }} />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button variant="outline" onClick={() => fetchEpisodesForShow(selectedShow.id)} className="cursor-pointer"><Calendar /> Load Episodes</Button>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div>
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2"><LucideBadge /> Fields</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60 flex items-center gap-2"><MapPin className="w-4 h-4" /> Country</div>
                          <div className="text-sm font-medium">{selectedShow.network?.country?.name || selectedShow.webChannel?.country?.name || "—"}</div>
                        </div>

                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60 flex items-center gap-2"><Star className="w-4 h-4" /> Rating</div>
                          <div className="text-sm font-medium">{selectedShow.rating?.average ?? "—"}</div>
                        </div>

                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60 flex items-center gap-2"><Film className="w-4 h-4" /> Genres</div>
                          <div className="text-sm font-medium">{(selectedShow.genres || []).length ? selectedShow.genres.join(", ") : "—"}</div>
                        </div>

                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60 flex items-center gap-2"><Clock className="w-4 h-4" /> Runtime</div>
                          <div className="text-sm font-medium">{selectedShow.runtime ? `${selectedShow.runtime} min` : "—"}</div>
                        </div>

                        {Object.keys(selectedShow).slice(0, 4).map((k) => (
                          <div key={k} className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">{k}</div>
                            <div className="text-sm font-medium truncate">{typeof selectedShow[k] === "object" ? (Array.isArray(selectedShow[k]) ? (selectedShow[k].slice(0, 3).join(", ") + (selectedShow[k].length > 3 ? "…" : "")) : JSON.stringify(selectedShow[k])) : (selectedShow[k] ?? "—")}</div>
                          </div>
                        ))}
                      </div>
                    </div>
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

        {/* Right: actions + episodes */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Quick actions</div>
            <div className="text-xs opacity-60 mb-2">Open or export the selected show</div>
            <div className="mt-2 space-y-2 grid grid-cols-2 gap-1">
              <Button className="cursor-pointer" variant="outline" onClick={() => { if (selectedShow?.officialSite) window.open(selectedShow.officialSite, "_blank"); else showToast("info", "No official site"); }}><ExternalLink /> Open Official</Button>
              <Button className="cursor-pointer" variant="outline" onClick={handleCopy}><Copy /> Copy JSON</Button>
              <Button className="cursor-pointer" variant="outline" onClick={handleDownload}><Download /> Download JSON</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => { if (selectedShow) fetchEpisodesForShow(selectedShow.id); else showToast("info", "No show selected"); }}><Calendar /> Load Episodes</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Episodes</div>
            <div className="text-xs opacity-60 mb-2">Click an episode for details (opens TVMaze link)</div>
            <div className="space-y-2 max-h-72 overflow-auto no-scrollbar">
              {episodes === null ? (
                <div className="text-xs opacity-60">No episodes loaded</div>
              ) : episodes.length === 0 ? (
                <div className="text-xs opacity-60">No episodes available</div>
              ) : (
                episodes.slice(0, 50).map((ep) => (
                  <a key={ep.id} href={ep.url || `https://www.tvmaze.com/episodes/${ep.id}`} target="_blank" rel="noreferrer" className="p-2 rounded-md border flex justify-between items-center hover:shadow-sm transition-colors cursor-pointer">
                    <div className="text-sm">{ep.number ? `S${String(ep.season).padStart(2, "0")}E${String(ep.number).padStart(2, "0")} — ${ep.name}` : ep.name}</div>
                    <div className="text-xs opacity-60">{ep.airdate || "—"}</div>
                  </a>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selectedShow?.name ? `Poster — ${selectedShow.name}` : "Poster"}</DialogTitle>
          </DialogHeader>
          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            {imageDialogUrl ? (
              <img src={imageDialogUrl} alt="poster" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            ) : (
              <div className="text-xs opacity-60">No image available</div>
            )}
          </div>
          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Poster preview</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageDialogOpen(false)} className="cursor-pointer"><X /></Button>
              {imageDialogUrl && <Button variant="outline" onClick={() => window.open(imageDialogUrl, "_blank")} className="cursor-pointer"><ExternalLink /> Open</Button>}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Map/metadata dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-3  rounded-2xl ", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selectedShow?.name ? `Metadata — ${selectedShow.name}` : "Metadata Map"}</DialogTitle>
          </DialogHeader>

          <div className="p-4 overflow-y-auto h-100">
            <div className="text-sm opacity-70 mb-4">A structured view of the show's metadata. Use this to inspect the main fields without raw JSON.</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-md border">
                <div className="text-xs opacity-60 mb-2">Basic</div>
                <div className="space-y-1">
                  <div className="text-sm"><strong>Name:</strong> {selectedShow?.name || "—"}</div>
                  <div className="text-sm"><strong>Type:</strong> {selectedShow?.type || "—"}</div>
                  <div className="text-sm"><strong>Language:</strong> {selectedShow?.language || "—"}</div>
                  <div className="text-sm"><strong>Genres:</strong> {(selectedShow?.genres || []).join(", ") || "—"}</div>
                </div>
              </div>

              <div className="p-3 rounded-md border">
                <div className="text-xs opacity-60 mb-2">Broadcast</div>
                <div className="space-y-1">
                  <div className="text-sm"><strong>Network:</strong> {selectedShow?.network?.name || selectedShow?.webChannel?.name || "—"}</div>
                  <div className="text-sm"><strong>Country:</strong> {selectedShow?.network?.country?.name || selectedShow?.webChannel?.country?.name || "—"}</div>
                  <div className="text-sm"><strong>Official site:</strong> {selectedShow?.officialSite ? <a href={selectedShow.officialSite} className="underline" target="_blank" rel="noreferrer">{selectedShow.officialSite}</a> : "—"}</div>
                </div>
              </div>

              <div className="p-3 rounded-md border">
                <div className="text-xs opacity-60 mb-2">Stats</div>
                <div className="space-y-1">
                  <div className="text-sm"><strong>Premiered:</strong> {selectedShow?.premiered || "—"}</div>
                  <div className="text-sm"><strong>Runtime:</strong> {selectedShow?.runtime ? `${selectedShow.runtime} min` : "—"}</div>
                  <div className="text-sm"><strong>Rating:</strong> {selectedShow?.rating?.average ?? "—"}</div>
                </div>
              </div>

              <div className="p-3 rounded-md border">
                <div className="text-xs opacity-60 mb-2">External</div>
                <div className="space-y-1">
                  <div className="text-sm"><strong>TVMaze:</strong> <a href={selectedShow?.url} target="_blank" rel="noreferrer" className="underline">Open on TVMaze</a></div>
                  <div className="text-sm"><strong>Official:</strong> {selectedShow?.officialSite ? <a href={selectedShow.officialSite} target="_blank" rel="noreferrer" className="underline">Open</a> : "—"}</div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <div className="text-sm font-semibold mb-2">Raw preview (subset)</div>
              <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 220 }}>
                {prettyJSON(selectedShow ? {
                  id: selectedShow.id,
                  name: selectedShow.name,
                  premiered: selectedShow.premiered,
                  runtime: selectedShow.runtime,
                  rating: selectedShow.rating,
                  network: selectedShow.network,
                } : {})}
              </pre>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Structured metadata view</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMapDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { if (selectedShow?.url) window.open(selectedShow.url, "_blank"); }} className="cursor-pointer"><ExternalLink /> Open TVMaze</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
