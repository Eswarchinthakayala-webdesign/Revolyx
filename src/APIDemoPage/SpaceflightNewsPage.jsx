// SpaceflightNewsPage.improved.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  ImageIcon,
  List,
  Loader2,
  Calendar,
  Globe,
  Copy,
  Download,
  User,
  Clock,
  Tag,
  FileText,
  Share2,
  ChevronsRight,
  Menu,
  RefreshCw,
  Check,
  BookOpen,
  Star,
  Sliders,
  Newspaper,
  CalendarDays
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

/**
 * Improved Spaceflight News Page
 * - Left: desktop sidebar with 10 random articles + refresh
 * - Mobile: same list inside a Sheet (Menu icon)
 * - Center: improved article preview, icons, badges
 * - Right: quick actions with animated copy & download
 * - Copy actions animate to a Check icon and reset after a short delay
 */

const API_BASE = "https://api.spaceflightnewsapi.net/v4/articles";
const DEFAULT_FETCH_LIMIT = 50;
const DEBOUNCE_MS = 300;

const DEFAULT_SAMPLE_ARTICLE = {
  id: 34037,
  title: "NASA Telescopes View Spiral Galaxy",
  authors: [{ name: "NASA", socials: null }],
  url: "https://www.nasa.gov/image-article/nasa-telescopes-view-spiral-galaxy/",
  image_url: "/mnt/data/381e618b-3bdb-461f-b3dd-6a4ce4fa8eed.png",
  news_site: "NASA",
  summary:
    "NGC 1068, a relatively nearby spiral galaxy, appears in this image released on July 23, 2025. The galaxy contains a black hole at its center that is twice as massive as the Milky Way’s...",
  published_at: "2025-11-18T17:45:46Z",
  updated_at: "2025-11-18T17:50:06.530478Z",
  featured: false,
  launches: [],
  events: []
};

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
function formatDate(iso) {
  if (!iso) return "Unknown date";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function SpaceflightNewsPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI & data state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [articlesCache, setArticlesCache] = useState([]);
  const [randomList, setRandomList] = useState([]);
  const [currentArticle, setCurrentArticle] = useState(DEFAULT_SAMPLE_ARTICLE);
  const [rawResp, setRawResp] = useState(DEFAULT_SAMPLE_ARTICLE);
  const [loadingArticle, setLoadingArticle] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);

  const debounceRef = useRef(null);
  const controllerRef = useRef(null);
  const suggestActiveIdx = useRef(-1);

  // ---------- Fetch helpers ----------
  async function fetchArticles(limit = DEFAULT_FETCH_LIMIT) {
    if (controllerRef.current) {
      try { controllerRef.current.abort(); } catch {}
    }
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    setLoadingSuggest(true);
    try {
      const res = await fetch(`${API_BASE}?limit=${limit}`, { signal: ctrl.signal });
      if (!res.ok) {
        setLoadingSuggest(false);
        showToast?.("error", `Failed to fetch articles (${res.status})`);
        return [];
      }
      const json = await res.json();
      // API returns an array; ensure array
      const arr = Array.isArray(json) ? json : json?.results || [];
      setArticlesCache(arr);
      setLoadingSuggest(false);
      return arr;
    } catch (err) {
      if (err.name === "AbortError") return [];
      console.error("fetchArticles:", err);
      setLoadingSuggest(false);
      showToast?.("error", "Network error while fetching articles");
      return [];
    }
  }

  // Build random list (desktop & mobile)
  async function buildRandomList() {
    try {
      let list = articlesCache;
      if (!list || list.length < 30) {
        list = await fetchArticles(200);
      }
      if (!list || list.length === 0) return setRandomList([]);
      const copy = [...list];
      // shuffle and pick 10
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      setRandomList(copy.slice(0, 10));
    } catch (err) {
      console.error(err);
    }
  }

  // ---------- lifecycle ----------
  useEffect(() => {
    (async () => {
      await fetchArticles(200);
      await buildRandomList();
    })();
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- search / suggestions ----------
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    suggestActiveIdx.current = -1;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const q = v.trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      let list = articlesCache;
      if (!list || list.length < 80) list = await fetchArticles(200);
      const matches = (list || [])
        .filter(a => {
          const t = (a.title || "").toLowerCase();
          const s = (a.summary || "").toLowerCase();
          const site = (a.news_site || "").toLowerCase();
          return t.includes(q) || s.includes(q) || site.includes(q);
        })
        .slice(0, 12);
      setSuggestions(matches);
      setLoadingSuggest(false);
    }, DEBOUNCE_MS);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || !query.trim()) {
      showToast?.("info", "Try searching for 'Artemis', 'James Webb', or 'Starship'.");
      return;
    }
    setLoadingArticle(true);
    const q = query.trim().toLowerCase();
    const list = articlesCache.length >= 150 ? articlesCache : await fetchArticles(300);
    const found = (list || []).find(a => (a.title || "").toLowerCase().includes(q) || (a.summary || "").toLowerCase().includes(q));
    if (found) {
      setCurrentArticle(found);
      setRawResp(found);
      setShowSuggest(false);
      setLoadingArticle(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const fresh = await fetchArticles(50);
    const picked = (fresh || []).find(a => (a.title || "").toLowerCase().includes(q) || (a.summary || "").toLowerCase().includes(q));
    if (picked) {
      setCurrentArticle(picked);
      setRawResp(picked);
    } else {
      showToast?.("info", "No match found — try a broader term.");
    }
    setShowSuggest(false);
    setLoadingArticle(false);
  }

  function pickSuggestion(item) {
    if (!item) return;
    setCurrentArticle(item);
    setRawResp(item);
    setQuery(item.title || "");
    setShowSuggest(false);
  }

  // keyboard nav
  function onKeyDownInput(e) {
    if (!showSuggest) return;
    const max = suggestions.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      suggestActiveIdx.current = Math.min(suggestActiveIdx.current + 1, max);
      scrollSuggestionIntoView();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      suggestActiveIdx.current = Math.max(suggestActiveIdx.current - 1, 0);
      scrollSuggestionIntoView();
    } else if (e.key === "Enter") {
      if (suggestActiveIdx.current >= 0 && suggestions[suggestActiveIdx.current]) {
        e.preventDefault();
        pickSuggestion(suggestions[suggestActiveIdx.current]);
      }
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  }

  function scrollSuggestionIntoView() {
    try {
      const el = document.querySelector(`[data-suggest-idx="${suggestActiveIdx.current}"]`);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    } catch {}
  }

  // ---------- quick actions ----------
  function openOriginal() {
    if (!currentArticle?.url) return showToast?.("info", "No original link available");
    window.open(currentArticle.url, "_blank", "noopener");
  }
  async function copyLink() {
    if (!currentArticle?.url) return showToast?.("info", "No link to copy");
    try {
      await navigator.clipboard.writeText(currentArticle.url);
      setCopiedLink(true);
      showToast?.("success", "Article link copied");
      setTimeout(() => setCopiedLink(false), 1700);
    } catch {
      showToast?.("error", "Copy failed");
    }
  }
  async function copyArticleJSON() {
    const payload = rawResp || currentArticle || {};
    try {
      await navigator.clipboard.writeText(prettyJSON(payload));
      setCopiedJSON(true);
      showToast?.("success", "Article JSON copied");
      setTimeout(() => setCopiedJSON(false), 1700);
    } catch {
      showToast?.("error", "Copy failed");
    }
  }
  function downloadArticleJSON() {
    const payload = rawResp || currentArticle || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `space_article_${currentArticle?.id ?? "article"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast?.("success", "Article JSON downloaded");
  }

  // image fallback
  function handleImgError(e) {
    e.currentTarget.src = "/placeholder.png";
  }

  // derived lists
  const relatedLaunches = useMemo(() => currentArticle?.launches || [], [currentArticle]);
  const relatedEvents = useMemo(() => currentArticle?.events || [], [currentArticle]);

  // ---------- render ----------
  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* top header (mobile menu) */}
      <header className="flex items-start md:items-center justify-between gap-4 mb-4 flex-col md:flex-row">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* mobile sheet trigger */}
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <div className="md:hidden">
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2 rounded-md cursor-pointer"><Menu /></Button>
              </SheetTrigger>
            </div>

            <SheetContent side="left" className="w-full max-w-xs p-3">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">Explore</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { buildRandomList(); }} className="cursor-pointer"><RefreshCw /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setMobileSheetOpen(false)} className="cursor-pointer">Close</Button>
                  </div>
                </div>

                <ScrollArea style={{ height: 520 }}>
                  <div className="space-y-3">
                    {randomList.length === 0 && <div className="text-sm opacity-60">No picks yet — refresh.</div>}
                {randomList.map((r) => {
  const isSelected = currentArticle?.id === r.id;

  return (
    <div
      key={r.id}
      className={`
        flex items-start flex-col gap-3 p-2 rounded-md cursor-pointer transition-all
        hover:bg-zinc-100 dark:hover:bg-zinc-800

        ${isSelected
          ? "border border-zinc-400 dark:border-zinc-600 bg-zinc-100/40 dark:bg-zinc-800/40"
          : "border border-transparent"
        }
      `}
      onClick={() => { 
        setCurrentArticle(r); 
        setRawResp(r); 
      }}
      role="button"
      tabIndex={0}
    >
      
      <div>
        <img
        src={r.image_url || r.imageUrl || "/placeholder.png"}
        alt={r.title}
        onError={handleImgError}
        className="w-14 h-10 object-cover rounded-sm"
      />

      <div className="min-w-0">
        <div className="font-medium">{r.title}</div>
        <div className="text-xs opacity-60">
          {r.news_site} • {formatDate(r.published_at)}
        </div>
      </div>
      </div>

      <Badge variant="secondary" className="ml-auto">
        #{r.id}
      </Badge>
    </div>
  );
})}

                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">Orbit — Spaceflight News</h1>
            <div className="text-xs opacity-70">Search launches, missions & industry updates — developer-friendly UI.</div>
          </div>
        </div>

        {/* search */}
        <form onSubmit={handleSearchSubmit} className={clsx("w-full md:w-[640px] mt-3 md:mt-0")} role="search">
          <div className={clsx("flex items-center gap-2 rounded-lg px-3 py-2 shadow-sm", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search spaceflight news"
              placeholder="Search (e.g. Artemis, Webb, Starship)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={onKeyDownInput}
              onFocus={() => setShowSuggest(true)}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="submit" variant="outline" className="px-3 cursor-pointer">Search</Button>
            <Button variant="ghost" onClick={() => { buildRandomList(); }} className="cursor-pointer" title="Refresh picks"><RefreshCw /></Button>
          </div>
        </form>
      </header>

      {/* suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx(
              "absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl",
              isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li
                key={s.id || idx}
                data-suggest-idx={idx}
                onClick={() => pickSuggestion(s)}
                className={clsx(
                  "px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer flex items-center gap-3",
                  suggestActiveIdx.current === idx ? "bg-zinc-100 dark:bg-zinc-800/50" : ""
                )}
                aria-selected={suggestActiveIdx.current === idx}
              >
                <img src={s.image_url || s.imageUrl || "/placeholder.png"} alt={s.title} className="w-14 h-10 object-cover rounded-sm" onError={handleImgError} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.title}</div>
                  <div className="text-xs opacity-60 truncate">{s.news_site || s.newsSite} • {formatDate(s.published_at || s.publishedAt)}</div>
                </div>
                <div className="text-xs opacity-60">{s.featured ? <Badge variant="destructive"><Star size={12} className="inline-block" /> Featured</Badge> : ""}</div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT: desktop sidebar */}
        <aside className={clsx("hidden lg:block lg:col-span-3")}>
          <Card className={clsx("rounded-2xl overflow-hidden border p-3 h-full", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold flex items-center gap-2"><BookOpen /> Picks</div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => buildRandomList()} className="cursor-pointer"><RefreshCw /></Button>
                <Button variant="ghost" size="sm" onClick={() => fetchArticles(200)} className="cursor-pointer"><Sliders /></Button>
              </div>
            </div>

            <ScrollArea style={{ maxHeight: 560 }}>
              <div className="space-y-3">
                {randomList.length === 0 && <div className="text-sm opacity-60">No picks yet — press refresh.</div>}
          {randomList.map((r) => {
  const isSelected = currentArticle?.id === r.id;

  return (
    <div
      key={r.id}
      className={`
        flex items-start gap-3 p-2 rounded-md cursor-pointer transition-all
        hover:bg-zinc-100 dark:hover:bg-zinc-800

        ${isSelected
          ? "border border-zinc-400 dark:border-zinc-600 bg-zinc-100/40 dark:bg-zinc-800/40"
          : "border border-transparent"
        }
      `}
      onClick={() => { 
        setCurrentArticle(r); 
        setRawResp(r); 
      }}
      role="button"
      tabIndex={0}
    >
      <img
        src={r.image_url || r.imageUrl || "/placeholder.png"}
        alt={r.title}
        onError={handleImgError}
        className="w-14 h-10 object-cover rounded-sm"
      />

      <div className="min-w-0">
        <div className="font-medium">{r.title}</div>
        <div className="text-xs opacity-60">
          {r.news_site} • {formatDate(r.published_at)}
        </div>
      </div>

      <Badge variant="secondary" className="ml-auto">
        #{r.id}
      </Badge>
    </div>
  );
})}

              </div>
            </ScrollArea>

            <Separator className="my-4" />

            <div className="text-sm">
              <div className="text-xs opacity-60">Endpoint</div>
              <div className="text-xs break-all mt-1">{API_BASE}</div>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(API_BASE); showToast?.("success", "Endpoint copied"); }} className="cursor-pointer"><Copy /></Button>
                <Button variant="ghost" onClick={() => setShowRaw(true)} className="cursor-pointer"><List /></Button>
              </div>
            </div>
          </Card>
        </aside>

        {/* CENTER: Article preview (improved UI) */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-6">
              <div className="flex items-start flex-wrap justify-between gap-4">
                <div className=" min-w-0">
                  <h2 className="text-2xl font-extrabold leading-tight flex items-center gap-3">
                    
                    <span className="">{currentArticle?.title || "Select an article or search"}</span>
                  </h2>
                  <div className="mt-2 text-sm opacity-60 flex flex-wrap items-center gap-3">
                  <div className="text-xs  flex items-center gap-2">
                    ID:
                    <span
                      className="
                        px-2 py-0.5 rounded-md text-xs font-medium
                        backdrop-blur-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300
                      "
                    >
                      {currentArticle?.id ?? "—"}
                    </span>
                  </div>

                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(currentArticle?.published_at)}</span>
                    <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> {currentArticle?.news_site || "—"}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Updated: {formatDate(currentArticle?.updated_at)}</span>
                    {currentArticle?.featured && <Badge variant="destructive" className="ml-1"><Star size={12} /> Featured</Badge>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setShowRaw(s => !s)} className="cursor-pointer"><List /></Button>
                    <Button variant="outline" onClick={() => setImageOpen(true)} className="cursor-pointer"><ImageIcon /></Button>
                  </div>

                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* image */}
                <div className="w-full h-fit md:w-56 rounded-xl overflow-hidden border">
                  {currentArticle?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentArticle.image_url} alt={currentArticle.title} className="w-full h-40 object-cover" onError={handleImgError} />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900/30">
                      <ImageIcon />
                    </div>
                  )}
                </div>


<div className="flex-1">
  {/* Summary */}
  <div className="mb-4">
    <div className="text-sm opacity-80 mb-3">
      {currentArticle?.summary || "Summary not available."}
    </div>

    {/* Info Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

      {/* Publisher */}
      <div className="p-3 rounded-lg border bg-white/40 dark:bg-zinc-900/30 backdrop-blur-sm">
        <div className="text-xs opacity-60 flex items-center gap-1 mb-1">
          <Newspaper size={14} /> Publisher
        </div>
        <div className="font-medium truncate">{currentArticle?.news_site || "—"}</div>
      </div>

      {/* Published Date */}
      <div className="p-3 rounded-lg border bg-white/40 dark:bg-zinc-900/30 backdrop-blur-sm">
        <div className="text-xs opacity-60 flex items-center gap-1 mb-1">
          <CalendarDays size={14} /> Published
        </div>
        <div className="font-medium">{formatDate(currentArticle?.published_at)}</div>
      </div>

      {/* Featured */}
      <div className="p-3 rounded-lg border bg-white/40 dark:bg-zinc-900/30 backdrop-blur-sm">
        <div className="text-xs opacity-60 flex items-center gap-1 mb-1">
          <Star size={14} /> Featured
        </div>
        <div className="font-medium">{currentArticle?.featured ? "Yes" : "No"}</div>
      </div>

      {/* Authors */}
      <div className="p-3 rounded-lg border bg-white/40 dark:bg-zinc-900/30 backdrop-blur-sm">
        <div className="text-xs opacity-60 flex items-center gap-1 mb-1">
          <User size={14} /> Authors
        </div>
        <div className="font-medium truncate">
          {Array.isArray(currentArticle?.authors) && currentArticle.authors.length > 0
            ? currentArticle.authors.map(a => a.name).join(", ")
            : "—"}
        </div>
      </div>
    </div>
  </div>

  {/* Buttons */}
  <div className="flex items-center gap-2 mt-4">
    <Button
      variant="outline"
      onClick={downloadArticleJSON}
      className="cursor-pointer flex items-center gap-2"
    >
      <Download size={16} /> Download
    </Button>

    <Button
      variant="ghost"
      onClick={openOriginal}
      className="ml-auto cursor-pointer flex items-center gap-2"
    >
      <ExternalLink size={16} /> Read original
    </Button>
  </div>
</div>

              </div>

              <Separator className="my-4" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold flex items-center gap-2"><BookOpen /> All fields</div>
                  <div className="text-xs opacity-60">JSON preview</div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="p-3 rounded border">
                    <div className="text-xs opacity-60">URL</div>
                    <a className="text-sm underline font-medium break-all" href={currentArticle?.url} target="_blank" rel="noreferrer">{currentArticle?.url || "—"}</a>
                  </div>

                  <div className="p-3 rounded border">
                    <div className="text-xs opacity-60">Published / Updated</div>
                    <div className="font-medium">{formatDate(currentArticle?.published_at)} — <span className="text-xs opacity-60">Updated: {formatDate(currentArticle?.updated_at)}</span></div>
                  </div>

                  <div className="p-3 rounded border">
                    <div className="text-xs opacity-60">Launches</div>
                    <div className="font-medium">{relatedLaunches.length ? relatedLaunches.map(l => l.provider ?? l.id ?? l).join(", ") : "—"}</div>
                  </div>

                  <div className="p-3 rounded border">
                    <div className="text-xs opacity-60">Events</div>
                    <div className="font-medium">{relatedEvents.length ? relatedEvents.map(e => e.provider ?? e.id ?? e).join(", ") : "—"}</div>
                  </div>

                
                </div>

                <div className="mt-4">
                  <a href={currentArticle?.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium underline">
                    Read original <ChevronsRight className="w-4 h-4" />
                  </a>
                </div>

                <AnimatePresence>
                  {showRaw && rawResp && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-6 p-3 border rounded">
                      <pre className="text-xs overflow-auto" style={{ maxHeight: 420 }}>{prettyJSON(rawResp)}</pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: quick actions */}
        <aside className="lg:col-span-3">
          <div className="space-y-4">
            <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Quick actions</div>
                  <div className="text-xs opacity-60">Operate on the active article</div>
                </div>
                <div className="text-xs opacity-60">ID {currentArticle?.id ?? "—"}</div>
              </div>

              <Separator className="my-3" />

              <div className="flex flex-col gap-2">
                <Button onClick={openOriginal} variant="outline" className="cursor-pointer"><ExternalLink className="mr-2" /> Open original</Button>


                <Button onClick={downloadArticleJSON} variant="outline" className="cursor-pointer"><Download className="mr-2" /> Download JSON</Button>

                <Button onClick={() => navigator.clipboard.writeText(window.location.href)} variant="outline" className="cursor-pointer"><Share2 className="mr-2" /> Copy page link</Button>
              </div>

              <Separator className="my-3" />

              <div>
                <div className="text-sm font-semibold mb-2">Developer</div>
                <div className="text-xs opacity-60">Endpoint & debug</div>

                <div className="mt-2 text-xs break-all">{API_BASE}</div>
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(API_BASE); showToast?.("success", "Endpoint copied"); }} className="cursor-pointer"><Copy /></Button>
                  <Button variant="ghost" onClick={() => setShowRaw(true)} className="cursor-pointer"><List /></Button>
                </div>
              </div>
            </Card>

            <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
              <div className="text-sm font-semibold">Related</div>
              <div className="text-xs opacity-60 mt-2">Quick links & resources</div>

              <div className="mt-3 flex flex-col gap-2">
                <a className="text-sm underline" target="_blank" rel="noreferrer" href="https://www.nasa.gov">NASA</a>
                <a className="text-sm underline" target="_blank" rel="noreferrer" href="https://spaceflightnow.com">Spaceflight Now</a>
                <a className="text-sm underline" target="_blank" rel="noreferrer" href="https://spacenews.com">SpaceNews</a>
              </div>
            </Card>
          </div>
        </aside>
      </main>

      {/* image modal */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden")}>
          <DialogHeader>
            <DialogTitle>{currentArticle?.title || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {currentArticle?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentArticle.image_url} alt={currentArticle?.title} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} onError={handleImgError} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from the article</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageOpen(false)} className="cursor-pointer">Close</Button>
              <Button variant="outline" onClick={() => { if (currentArticle?.image_url) window.open(currentArticle.image_url, "_blank"); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
