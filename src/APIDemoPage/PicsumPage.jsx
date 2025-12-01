// src/pages/PicsumPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { showToast } from "../lib/ToastHelper";

import {
  Menu,
  X,
  Copy,
  Check,
  RefreshCw,
  Download,
  Image as ImageIcon,
  Eye,
  Info,
  Link as LinkIcon,
  ArrowRightCircle,
  User,
  FileText,
  Search,
  Plus,
  Loader2,
  CornerUpRight,
  Layers,
  Hash,
  Maximize,
} from "lucide-react";

/* shadcn components */
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";

/**
 * Redesigned Picsum Gallery Page
 * - Appends 100 more images on "Load 100 More" (page increments)
 * - Search with suggestions (author, id, url)
 * - Desktop sidebar + mobile sheet
 * - Professional shimmer loader + blur-up lazy load
 * - Animated copy -> tick button
 * - Raw JSON toggle
 * - Remaining images grid under preview
 */

const BASE_LIST = "https://picsum.photos/v2/list"; // supports ?page=1&limit=100
const FALLBACK_RANDOM = "https://picsum.photos/1200/800";

function useIsDark(theme) {
  if (!theme) return false;
  if (theme === "dark") return true;
  if (typeof window !== "undefined" && theme === "system") {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
}

// Small Image component with blur-up + fade-in
function ProgressiveImg({ src, alt, className, style, onClick, width, height }) {
  const [loaded, setLoaded] = useState(false);
  const [visibleSrc, setVisibleSrc] = useState(src);
  useEffect(() => {
    setLoaded(false);
    // small trick: use the same src; if you had tiny placeholder you'd set it here
    setVisibleSrc(src);
  }, [src]);

  return (
    <div
      className={clsx("relative overflow-hidden bg-gray-100 dark:bg-zinc-900", className)}
      style={{ display: "inline-block", ...style }}
    >
      {/* shimmer placeholder */}
      {!loaded && (
        <div
          aria-hidden
          className="absolute inset-0 animate-shimmer"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)",
            zIndex: 0,
            filter: "blur(2px)",
          }}
        />
      )}
      <img
        src={visibleSrc}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onClick={onClick}
        className={clsx(
          "block transition-opacity duration-500 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          "w-full h-full object-cover cursor-pointer"
        )}
      />
    </div>
  );
}

export default function PicsumPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark = useIsDark(theme);

  // Data & states
  const [images, setImages] = useState([]); // accumulated pages
  const [page, setPage] = useState(1);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBlob, setPreviewBlob] = useState(null);
  const [headersInfo, setHeadersInfo] = useState({});
  const [showRaw, setShowRaw] = useState(false);

  // UI
  const [imageOpen, setImageOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [copied, setCopied] = useState({ endpoint: false, imageUrl: false, headers: false });
  const [query, setQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // badge colors
  const badgeColors = useMemo(
    () => [
"bg-rose-500/10 border border-rose-500/20 backdrop-blur-md text-rose-700 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-300 shadow-sm",
"bg-amber-400/10 border border-amber-400/20 backdrop-blur-md text-amber-700 dark:bg-amber-400/20 dark:border-amber-400/30 dark:text-amber-300 shadow-sm",
"bg-sky-500/10 border border-sky-500/20 backdrop-blur-md text-sky-700 dark:bg-sky-500/20 dark:border-sky-500/30 dark:text-sky-300 shadow-sm",
"bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300 shadow-sm",
"bg-violet-500/10 border border-violet-500/20 backdrop-blur-md text-violet-700 dark:bg-violet-500/20 dark:border-violet-500/30 dark:text-violet-300 shadow-sm",
"bg-pink-500/10 border border-pink-500/20 backdrop-blur-md text-pink-700 dark:bg-pink-500/20 dark:border-pink-500/30 dark:text-pink-300 shadow-sm",
"bg-blue-500/10 border border-blue-500/20 backdrop-blur-md text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-300 shadow-sm",
"bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300 shadow-sm",
"bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md text-cyan-700 dark:bg-cyan-500/20 dark:border-cyan-500/30 dark:text-cyan-300 shadow-sm",
"bg-teal-500/10 border border-teal-500/20 backdrop-blur-md text-teal-700 dark:bg-teal-500/20 dark:border-teal-500/30 dark:text-teal-300 shadow-sm",
"bg-lime-500/10 border border-lime-500/20 backdrop-blur-md text-lime-700 dark:bg-lime-500/20 dark:border-lime-500/30 dark:text-lime-300 shadow-sm",
"bg-green-500/10 border border-green-500/20 backdrop-blur-md text-green-700 dark:bg-green-500/20 dark:border-green-500/30 dark:text-green-300 shadow-sm",
"bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-md text-yellow-700 dark:bg-yellow-500/20 dark:border-yellow-500/30 dark:text-yellow-300 shadow-sm",
"bg-orange-500/10 border border-orange-500/20 backdrop-blur-md text-orange-700 dark:bg-orange-500/20 dark:border-orange-500/30 dark:text-orange-300 shadow-sm",
"bg-red-500/10 border border-red-500/20 backdrop-blur-md text-red-700 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-300 shadow-sm",
"bg-slate-500/10 border border-slate-500/20 backdrop-blur-md text-slate-700 dark:bg-slate-500/20 dark:border-slate-500/30 dark:text-slate-300 shadow-sm",


    ],
    []
  );

  // helpers
  function badgeColorFor(name) {
    return badgeColors[(name || "").length % badgeColors.length];
  }

  function buildPreviewUrl(meta, w = 1400, h = 900) {
    if (!meta) return FALLBACK_RANDOM;
    return `https://picsum.photos/id/${meta.id}/${w}/${h}`;
  }

  async function fetchPage(p = 1) {
    setLoadingList(true);
    try {
      const res = await fetch(`${BASE_LIST}?page=${p}&limit=100`);
      if (!res.ok) {
        showToast("error", `Failed to fetch images (page ${p})`);
        return [];
      }
      const json = await res.json();
      return json || [];
    } catch (err) {
      console.error(err);
      showToast("error", "Network error while fetching list");
      return [];
    } finally {
      setLoadingList(false);
    }
  }

  // initial load
  useEffect(() => {
    (async () => {
      const first = await fetchPage(1);
      setImages(first);
      setHeadersInfo({ listFetchedAt: new Date().toISOString(), listCount: (first || []).length });
      if (first && first.length > 0) {
        setSelectedIdx(0);
        setPreviewFromMeta(first[0]);
      } else {
        setPreviewUrl(FALLBACK_RANDOM);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when selected idx changes
  useEffect(() => {
    if (!images || images.length === 0) return;
    const meta = images[selectedIdx] || images[0];
    if (meta) setPreviewFromMeta(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdx]);

  // search suggestions derived from images + query
  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    const q = query.toLowerCase();
    const found = images
      .filter(
        (it) =>
          (it.author || "").toLowerCase().includes(q) ||
          String(it.id).includes(q) ||
          (it.url || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
    setSuggestions(found);
    setSuggestionsOpen(found.length > 0);
  }, [query, images]);

  // set preview; fetch blob for download & headers
  async function setPreviewFromMeta(meta) {
    if (!meta) return;
    const url = buildPreviewUrl(meta);
    setLoadingPreview(true);
    try {
      setPreviewUrl(url);
      const res = await fetch(url, { method: "GET" });
      const blob = await res.blob();
      setPreviewBlob(blob);
      const headerDump = {};
      res.headers.forEach((v, k) => (headerDump[k] = v));
      setHeadersInfo((prev) => ({
        ...prev,
        ...headerDump,
        selectedAt: new Date().toISOString(),
        selectedId: meta.id,
        selectedAuthor: meta.author,
      }));
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load preview");
      setPreviewBlob(null);
      setPreviewUrl(FALLBACK_RANDOM);
    } finally {
      setLoadingPreview(false);
    }
  }

  /* Actions */
  async function handleCopyEndpoint() {
    try {
      await navigator.clipboard.writeText(`${BASE_LIST}?page=${page}&limit=100`);
      setCopied((s) => ({ ...s, endpoint: true }));
      showToast("success", "Endpoint copied");
      setTimeout(() => setCopied((s) => ({ ...s, endpoint: false })), 1600);
    } catch {
      showToast("error", "Copy failed");
    }
  }

  async function handleCopyImageUrl() {
    if (!previewUrl) return;
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied((s) => ({ ...s, imageUrl: true }));
      showToast("success", "Image URL copied");
      setTimeout(() => setCopied((s) => ({ ...s, imageUrl: false })), 1600);
    } catch {
      showToast("error", "Copy failed");
    }
  }

  function downloadImage() {
    if (!previewBlob && !previewUrl) return;
    const url = previewBlob ? URL.createObjectURL(previewBlob) : previewUrl;
    const a = document.createElement("a");
    a.href = url;
    const meta = images[selectedIdx];
    const safeName = meta ? `picsum-${meta.id}.jpg` : "picsum-image.jpg";
    a.download = safeName;
    a.click();
    showToast("success", "Image downloaded");
    if (previewBlob) setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function downloadHeadersJSON() {
    const blob = new Blob([JSON.stringify(headersInfo, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "picsum-headers.json";
    a.click();
    showToast("success", "Headers JSON downloaded");
    setCopied((s) => ({ ...s, headers: true }));
    setTimeout(() => setCopied((s) => ({ ...s, headers: false })), 1400);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function handleRefreshAll() {
    setLoadingList(true);
    try {
      const fresh = await fetchPage(1);
      setImages(fresh);
      setPage(1);
      showToast("success", "Refreshed gallery");
      if (fresh.length > 0) {
        setSelectedIdx(0);
        setPreviewFromMeta(fresh[0]);
      }
    } finally {
      setLoadingList(false);
    }
  }

  // Append 100 more images (page++)
  async function handleLoadMore() {
    const next = page + 1;
    setIsLoadingMore(true);
    try {
      const list = await fetchPage(next);
      if (!list || list.length === 0) {
        showToast("info", "No more images available");
        setIsLoadingMore(false);
        return;
      }
      setImages((prev) => [...prev, ...list]);
      setPage(next);
      showToast("success", `Loaded page ${next} (+${list.length})`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load more");
    } finally {
      setIsLoadingMore(false);
    }
  }

  /* UI helpers */
  function onSelectSuggestion(suggIdx) {
    const idx = images.findIndex((it) => it.id === suggestions[suggIdx].id);
    if (idx >= 0) {
      setSelectedIdx(idx);
      setSuggestionsOpen(false);
      setQuery("");
    }
  }

  // keyboard behavior for search (enter selects first suggestion)
  function handleSearchKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        onSelectSuggestion(0);
      }
    } else if (e.key === "Escape") {
      setSuggestionsOpen(false);
    }
  }

  return (
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-8xl mx-auto", isDark ? "bg-black" : "bg-white")}>
      {/* header */}
      <header className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={clsx(
                  "p-2 rounded-lg border cursor-pointer md:hidden",
                  isDark ? "bg-black/40 border-zinc-800" : "bg-white/80 border-zinc-200"
                )}
                aria-label="Open list"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>

            <SheetContent side="left" className="p-2 w-[88%] sm:w-72">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Images</h2>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="p-2 rounded-md cursor-pointer border"
                  aria-label="Close"
                >
                  <X />
                </button>
              </div>

              <div className="mb-3">
                <Button variant="ghost" className="w-full justify-between cursor-pointer" onClick={handleRefreshAll}>
                  <div className="flex items-center gap-2"><RefreshCw /> Refresh</div>
                </Button>
              </div>

              <ScrollArea className="h-[70vh]">
                <div className="grid grid-cols-1 gap-2">
                  {loadingList ? (
                    <div className="text-sm opacity-60">Loading list…</div>
                  ) : (
                    images.map((it, idx) => (
                      <button
                        key={`mobile-${it.id}-${idx}`}
                        onClick={() => {
                          setSelectedIdx(idx);
                          setSheetOpen(false);
                        }}
                        className={clsx(
                          "flex cursor-pointer items-center border gap-3 w-full p-2 rounded-lg text-left hover:bg-zinc-50/40",
                          isDark ? "hover:bg-white/5" : "hover:bg-zinc-50",
                          selectedIdx === idx ? "border-zinc-400" : ""
                        )}
                      >
                        <img
                          src={`https://picsum.photos/id/${it.id}/80/60`}
                          alt={it.author}
                          loading="lazy"
                          className="w-16 h-12 object-cover rounded-md flex-shrink-0 border"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="truncate font-medium text-sm">{it.author}</div>
                            <div className="text-xs opacity-70">{it.width}×{it.height}</div>
                          </div>
                          <div className="text-xs mt-1 truncate opacity-60">{it.url}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <div className="ml-1">
            <h1 className={clsx("text-2xl md:text-3xl font-extrabold", isDark ? "text-zinc-50" : "text-zinc-900")}>
              Revolyx · Picsum Gallery
            </h1>
            <p className={clsx("text-xs mt-0.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
              Browse random images from Picsum — click a thumbnail to preview.
            </p>
          </div>
        </div>

        {/* right actions (search + small controls) */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className={clsx("relative w-full md:w-[360px]")}>
            <div className={clsx("flex items-center gap-2 border rounded-lg px-3 py-2", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
              <Search className="w-4 h-4 opacity-70" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKey}
                onFocus={() => setSuggestionsOpen(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setSuggestionsOpen(false), 180)}
                placeholder="Search author, id or url..."
                className={clsx("flex-1 outline-none bg-transparent text-sm", isDark ? "text-zinc-100" : "text-zinc-900")}
              />
              {query && (
                <button
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setSuggestions([]);
                    setSuggestionsOpen(false);
                    searchRef.current?.focus();
                  }}
                  className="p-1 rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <AnimatePresence>
              {suggestionsOpen && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={clsx(
                    "absolute left-0 right-0 mt-2 z-50 rounded-lg shadow-lg border overflow-hidden",
                    isDark ? "bg-black/80 border-zinc-800" : "bg-white border-zinc-200"
                  )}
                >
                  <div>
                    {suggestions.map((s, i) => (
                      <button
                        key={`sugg-${s.id}-${i}`}
                        onClick={() => onSelectSuggestion(i)}
                        className="w-full text-left p-2 flex items-center gap-3 hover:bg-zinc-50/40 cursor-pointer"
                      >
                        <img src={`https://picsum.photos/id/${s.id}/60/40`} alt={s.author} className="w-12 h-8 rounded-md object-cover flex-shrink-0 border" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate font-medium">{s.author}</div>
                          <div className="text-xs opacity-60 truncate">{s.url}</div>
                        </div>
                        <div className="text-xs opacity-60">#{s.id}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefreshAll} className="cursor-pointer">
              <RefreshCw />
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyEndpoint} className="cursor-pointer">
              <AnimatePresence>
                {copied.endpoint ? <motion.span key="cop" initial={{ scale: 0.8 }} animate={{ scale: 1 }}><Check /></motion.span> : <motion.span key="ep" initial={{ scale: 0.8 }} animate={{ scale: 1 }}><LinkIcon /></motion.span>}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </header>

      {/* main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={clsx(
            "hidden lg:block p-5 h-[80vh] overflow-hidden rounded-xl border",
            isDark ? "bg-black/40 border-zinc-800" : "bg-white/80 border-zinc-200"
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className={clsx("text-sm font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}>Images ({images.length})</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="cursor-pointer" onClick={handleRefreshAll}><RefreshCw /></Button>
              <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => { setSelectedIdx(0); showToast("success", "Reset to first image"); }}>
                <ArrowRightCircle />
              </Button>
            </div>
          </div>

          <Separator className="my-3" />

          <ScrollArea className="h-[72vh] overflow-hidden">
            <div className="space-y-2 overflow-y-auto pb-10">
              {loadingList ? (
                <div className="p-3 text-sm opacity-60">Loading images…</div>
              ) : (
                images.map((it, idx) => (
                  <button
                    key={`desktop-${it.id}-${idx}`}
                    onClick={() => setSelectedIdx(idx)}
                    className={clsx(
                      "w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer text-left border transition-transform",
                      selectedIdx === idx ? "border-zinc-500 " : "",
                      isDark ? "hover:bg-white/5" : "hover:bg-zinc-50"
                    )}
                  >
                    <img
                      src={`https://picsum.photos/id/${it.id}/120/80`}
                      width={120}
                      height={80}
                      loading="lazy"
                      alt={it.author}
                      className="rounded-md border object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm">{it.author}</div>
                        <span
                          className={clsx(
                            "ml-auto text-xs px-2 py-0.5 rounded-full  font-medium",
                            "bg-gradient-to-r",
                            badgeColorFor(it.author)
                          )}
                        >
                          {it.id}
                        </span>
                      </div>
                      <div className="text-xs opacity-60  mt-1">{it.width}×{it.height}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* PREVIEW + CONTROLS */}
        <section className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl border overflow-hidden", isDark ? "bg-black/40 border-zinc-800" : "bg-white/80 border-zinc-200")}>
            <CardHeader className={clsx("p-4 border-b flex items-start justify-between", isDark ? "bg-black/60 border-zinc-800" : "bg-white/80 border-zinc-200")}>
              <div>
                <CardTitle className={clsx("flex items-center gap-3")}>
                  <ImageIcon />
                  <span className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>Preview</span>
                </CardTitle>
                <p className={clsx("text-xs mt-1", isDark ? "text-zinc-400" : "text-zinc-600")}>
                  Click the image to open the full preview. Use the list or grid to change image.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" className="cursor-pointer" onClick={() => setShowRaw(!showRaw)}>
                  <AnimatePresence>
                    {showRaw ? (
                      <motion.span key="info" initial={{ rotate: -10 }} animate={{ rotate: 0 }}><FileText /></motion.span>
                    ) : (
                      <motion.span key="info2" initial={{ rotate: 10 }} animate={{ rotate: 0 }}><Info /></motion.span>
                    )}
                  </AnimatePresence>
                  <span className="ml-2 hidden sm:inline">{showRaw ? "Hide Raw" : "Show Raw"}</span>
                </Button>

                <Button variant="outline" className="cursor-pointer" onClick={() => setImageOpen(true)}>
                  <Eye />
                </Button>

                <Button variant="outline" className="cursor-pointer" onClick={downloadImage}>
                  <Download />
                </Button>

                <Button variant="outline" className="cursor-pointer" onClick={handleCopyImageUrl}>
                  <AnimatePresence>
                    {copied.imageUrl ? (
                      <motion.span key="cok" initial={{ scale: 0.8 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: "spring" }}><Check /></motion.span>
                    ) : (
                      <motion.span key="cop" initial={{ scale: 0.8 }} animate={{ scale: 1 }}><LinkIcon /></motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* preview area */}
              <div className="flex-1 flex justify-center items-center">
                <div
                  className={clsx(
                    "rounded-xl overflow-hidden border shadow-lg max-w-full w-full",
                    isDark ? "bg-black/60 border-zinc-800" : "bg-white"
                  )}
                >
                  {/* professional loader */}
                  {loadingPreview ? (
                    <div className="w-full h-[460px] flex items-center justify-center p-8">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin w-8 h-8 opacity-70" />
                        <div className="text-sm opacity-70">Loading high-res preview…</div>
                        <div className="w-64 h-2 rounded-full overflow-hidden mt-2 bg-zinc-200 dark:bg-zinc-800">
                          <div className="h-full animate-progress" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <ProgressiveImg
                        src={previewUrl}
                        alt={`Selected preview ${images[selectedIdx] ? `by ${images[selectedIdx].author}` : ""}`}
                        onClick={() => setImageOpen(true)}
                        width={1400}
                        height={900}
                      />
                      {/* overlay actions on image */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button onClick={downloadImage} className="p-2 rounded-md border cursor-pointer" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={handleCopyImageUrl} className="p-2 rounded-md border cursor-pointer" title="Copy URL">
                          <LinkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* details column */}
              <div className="w-full md:w-80 p-2">
                <div className="flex items-center gap-3 mb-3">
                  <User />
                  <div className="flex-1">
                    <div className="font-medium truncate">
                      {images[selectedIdx] ? images[selectedIdx].author : "Random image"}
                    </div>
                    <div className="text-xs opacity-60 truncate">{images[selectedIdx] ? images[selectedIdx].url : "picsum.photos"}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-xs font-semibold opacity-80 mb-1 flex items-center gap-2"><FileText /> Details</div>
                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RulerLabel />
                        <div className="text-xs opacity-70">Dimensions</div>
                      </div>
                      <div className="text-sm font-medium">{images[selectedIdx] ? `${images[selectedIdx].width} × ${images[selectedIdx].height}` : "600 × 400"}</div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Hash />
                        <div className="text-xs opacity-70">ID</div>
                      </div>
                      <div className="text-sm font-medium">{images[selectedIdx] ? images[selectedIdx].id : "-"}</div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <CornerUpRight />
                        <div className="text-xs opacity-70">Source</div>
                      </div>
                      <div className="text-sm font-medium">picsum.photos</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <Button variant="outline" className="cursor-pointer w-full" onClick={() => {
                    const meta = images[selectedIdx];
                    if (meta && meta.url) window.open(meta.url, "_blank");
                  }}>
                    <span className="flex items-center justify-center gap-2"><ArrowRightCircle /> View Source</span>
                  </Button>

                  <Button variant="ghost" className="cursor-pointer w-full" onClick={downloadHeadersJSON}>
                    <AnimatePresence>
                      {copied.headers ? (
                        <motion.span key="chk" initial={{ scale: 0.8 }} animate={{ scale: 1 }}><Check /></motion.span>
                      ) : (
                        <motion.span key="infoic" initial={{ scale: 0.8 }} animate={{ scale: 1 }}><Info /></motion.span>
                      )}
                    </AnimatePresence>
                    <span className="ml-2">Download Headers</span>
                  </Button>
                </div>
              </div>
            </CardContent>

            {/* raw viewer */}
            <AnimatePresence>
              {showRaw && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={clsx(
                    "p-4 border-t",
                    isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200"
                  )}
                >
                  <SyntaxHighlighter
                    language="json"
                    style={isDark ? oneDark : oneLight}
                    customStyle={{ padding: 12, borderRadius: 8 }}
                  >
                    {JSON.stringify({ headersInfo, currentMeta: images[selectedIdx] || null }, null, 2)}
                  </SyntaxHighlighter>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* remaining images + load more */}
          <div className={clsx("rounded-lg p-3 border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/80 border-zinc-200")}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm opacity-70">Remaining Images — click a thumbnail to preview</div>
              <div className="flex items-center gap-2">
                <div className="text-xs opacity-60">Total: {images.length}</div>
                <Button size="sm" variant="ghost" onClick={handleLoadMore} className="cursor-pointer inline-flex items-center gap-2">
                  {isLoadingMore ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus />} <span>Load 100 More</span>
                </Button>
              </div>
            </div>

            <ScrollArea className="h-100 overflow-y-auto">

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4  lg:grid-cols-6 gap-3">
              {images.map((it, idx) => (
                <div key={`grid-${it.id}-${idx}`} className="rounded-md  overflow-hidden border transition-transform hover:scale-[1.02]">
                  <ProgressiveImg
                    src={`https://picsum.photos/id/${it.id}/400/260`}
                    alt={it.author}
                    width={400}
                    height={260}
                    onClick={() => setSelectedIdx(idx)}
                    className="w-full h-40"
                  />
                  <div className="p-2 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{it.author}</div>
                      <div className="text-xs opacity-60">{it.width}×{it.height}</div>
                    </div>
                    <span className={clsx("text-xs px-2 py-0.5 rounded-full  font-medium ", badgeColorFor(it.author))}>{it.id}</span>
                  </div>
                </div>
              ))}
            </div>
            </ScrollArea>
          </div>
        </section>
      </main>

      {/* image dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-5xl w-full rounded-xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>Full Image Preview</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center p-4 bg-gradient-to-b from-transparent to-black/5">
            <img src={previewUrl} alt="Full preview" className="rounded-xl max-w-full border shadow-lg" />
          </div>

          <DialogFooter className="flex justify-between items-center p-3 border-t">
            <div className="text-xs opacity-60">Author: {images[selectedIdx] ? images[selectedIdx].author : "Unknown"}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="cursor-pointer" onClick={downloadImage}><Download /></Button>
              <Button variant="ghost" className="cursor-pointer" onClick={() => { handleCopyImageUrl(); }}>
                <AnimatePresence>
                  {copied.imageUrl ? <motion.span key="chk2" initial={{ scale: 0.8 }} animate={{ scale: 1 }}><Check /></motion.span> : <motion.span key="lnk" initial={{ scale: 0.8 }} animate={{ scale: 1 }}><LinkIcon /></motion.span>}
                </AnimatePresence>
              </Button>
              <Button variant="outline" className="cursor-pointer" onClick={() => setImageOpen(false)}>Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* tiny css for shimmer + progress */}
      <style jsx>{`
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 1.6s linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-progress {
          width: 0%;
          height: 100%;
          background: linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.12));
          animation: progress 2s linear infinite;
        }
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 60%; }
          100% { width: 0%; }
        }
      `}</style>
    </div>
  );
}

/* small icon helper: ruler label (lucide doesn't have a nice ruler with text) */
function RulerLabel() {
  return (
    <div className="flex items-center gap-1">
      <Layers className="w-4 h-4 opacity-80" />
    </div>
  );
}
