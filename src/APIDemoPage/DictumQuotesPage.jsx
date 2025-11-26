// src/pages/DictumPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Quote,
  Copy,
  Twitter,
  ExternalLink,
  Loader2,
  RefreshCw,
  ImageIcon,
  X,
  Check,
  FileText,
  Menu,
  User,
  Tag,
  Database,
  MoreHorizontal
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";

import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * DictumPage.jsx (improved)
 *
 * Features added/changed:
 * - Mobile-friendly header with Menu (sheet) for the left column + controls
 * - Animated copy button (spinner -> check) with reset
 * - Toggle to show/hide raw response
 * - More Lucide icons applied to headings/metadata
 * - Use cursor-pointer consistently and better spacing
 * - Subtle motion for suggestions and selected items
 * - Keeps existing pool / random logic
 */

const RANDOM_ENDPOINT = "/dictum/api/quotes/random";
const LIST_ENDPOINT = "/dictum/api/quotes";
const FALLBACK_RANDOM_COUNT = 12;

function normalize(item) {
  return {
    id: item.id ?? item._id ?? item.uuid ?? Math.random().toString(36).slice(2),
    text: item.text ?? item.quote ?? item.content ?? "",
    author: item.author?.name ?? item.author ?? item.name ?? "Unknown",
    tags: item.tags ?? item.categories ?? [],
    image: item.image ?? item.photo ?? null,
    raw: item
  };
}

export default function DictumPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [pool, setPool] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingPool, setLoadingPool] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogImage, setDialogImage] = useState(null);

  const [sheetOpen, setSheetOpen] = useState(false);

  const [copyState, setCopyState] = useState("idle"); // idle | copying | done
  const [showRaw, setShowRaw] = useState(false);

  const timerRef = useRef(null);
  const copyResetTimer = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadInitialPool();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInitialPool() {
    setLoadingPool(true);
    try {
      // Try listing endpoint first
      let res = null;
      try {
        res = await fetch(LIST_ENDPOINT);
      } catch (err) {
        res = null;
      }

      if (res && res.ok) {
        const json = await res.json();
        const list =
          Array.isArray(json) ? json : json.results ?? json.data ?? json.quotes ?? [];
        const normalized = list.map(normalize);
        setPool(normalized);
        if (normalized.length > 0) setSelected(normalized[0]);
        setLoadingPool(false);
        return;
      }

      // Fallback random multiple fetches
      const tmp = [];
      for (let i = 0; i < FALLBACK_RANDOM_COUNT; i++) {
        try {
          const r = await fetch(RANDOM_ENDPOINT);
          if (!r.ok) continue;
          const j = await r.json();
          tmp.push(normalize(j));
        } catch (err) {
          // ignore
        }
      }

      const dedup = [];
      const seen = new Set();
      for (const it of tmp) {
        const key = `${it.text.slice(0, 60)}::${it.author}`;
        if (!seen.has(key)) {
          seen.add(key);
          dedup.push(it);
        }
      }

      setPool(dedup);
      if (dedup.length > 0) setSelected(dedup[0]);
    } catch (err) {
      console.error("Failed to load initial pool:", err);
      showToast?.("error", "Failed to load quotes");
    } finally {
      setLoadingPool(false);
    }
  }

  function doSuggest(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    const ql = q.toLowerCase();
    setLoadingSuggest(true);
    const matches = pool
      .filter((p) => {
        const t = (p.text || "").toLowerCase();
        const a = (p.author || "").toLowerCase();
        const tags = (p.tags || []).join(" ").toLowerCase();
        return t.includes(ql) || a.includes(ql) || tags.includes(ql);
      })
      .slice(0, 20);
    setSuggestions(matches);
    setLoadingSuggest(false);
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSuggest(v), 250);
  }

  async function fetchRandomAndShow() {
    try {
      showToast?.("info", "Fetching a random quote...");
      const r = await fetch(RANDOM_ENDPOINT);
      if (!r.ok) throw new Error(`Status ${r.status}`);
      const j = await r.json();
      const norm = normalize(j);
      setSelected(norm);
      setPool((prev) => {
        const exists = prev.some((p) => p.text === norm.text && p.author === norm.author);
        return exists ? prev : [norm, ...prev].slice(0, 200);
      });
      showToast?.("success", "Random quote loaded");
    } catch (err) {
      console.error("Random fetch failed:", err);
      showToast?.("error", "Failed to fetch random quote — check CORS or proxy");
    }
  }

  function chooseSuggestion(item) {
    setSelected(item);
    setShowSuggest(false);
    setSuggestions([]);
    setQuery(item.text.slice(0, 60));
  }

  async function copySelected() {
    if (!selected) {
      showToast?.("info", "No quote selected");
      return;
    }
    try {
      setCopyState("copying");
      const payload = `"${selected.text}" — ${selected.author}`;
      await navigator.clipboard.writeText(payload);
      setCopyState("done");
      showToast?.("success", "Copied quote");

      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => {
        setCopyState("idle");
      }, 2200);
    } catch (err) {
      console.error("Copy failed", err);
      setCopyState("idle");
      showToast?.("error", "Failed to copy");
    }
  }

  function tweetSelected() {
    if (!selected) {
      showToast?.("info", "No quote selected");
      return;
    }
    const txt = encodeURIComponent(`"${selected.text}" — ${selected.author}`);
    window.open(`https://twitter.com/intent/tweet?text=${txt}`, "_blank", "noopener");
  }

  function openSource() {
    window.open(RANDOM_ENDPOINT, "_blank", "noopener");
  }

  function openImageDialog(img) {
    setDialogImage(img);
    setDialogOpen(true);
  }

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-8xl mx-auto", isDark ? "bg-black" : "bg-gray-50")}>
      {/* Header */}
      <header className="flex items-center justify-between gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu / sheet trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button aria-label="Open menu" variant="ghost" className="md:hidden p-2 cursor-pointer">
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className={clsx("w-[320px] p-0")}>
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <Menu />
                  <span>Explore</span>
                </SheetTitle>
              </SheetHeader>

              <div className="p-3 overflow-y-auto no-scrollbar">
                <Card className={clsx("rounded-xl overflow-hidden border p-0", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
                  <CardHeader className={clsx("p-4 border-b", isDark ? "bg-black/40 border-zinc-800" : "bg-white/95 border-zinc-200")}>
                    <CardTitle className="text-sm">Pool</CardTitle>
                    <div className="text-xs opacity-60">Tap a quote to view</div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[60vh] overflow-y-auto">
                      <div className="p-3 space-y-2">
                        {loadingPool ? (
                          <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                        ) : pool.length === 0 ? (
                          <div className="py-6 text-sm opacity-60 px-3">No quotes available</div>
                        ) : (
                          pool.map((q) => (
                            <button
                              key={q.id}
                              onClick={() => { setSelected(q); setSheetOpen(false); }}
                              className={clsx(" text-left p-3 w-full cursor-pointer rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/40 flex gap-3 items-start", selected?.id === q.id ? "ring-2 ring-zinc-400/20" : "")}
                            >
                              <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                <Quote className="opacity-70" size={16} />
                              </div>
                              <div className="flex-1 ">
                                <div className="text-sm w-50 font-medium truncate">{q.text}</div>
                                <div className="text-xs opacity-60 ">{q.author}</div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <div className="mt-3 grid gap-2">
                  <Button variant="outline" onClick={() => loadInitialPool()} className="w-full cursor-pointer"><RefreshCw /> Refresh</Button>
                  <Button variant="ghost" onClick={() => fetchRandomAndShow()} className="w-full cursor-pointer"><Loader2 /> Random</Button>
                  <Button variant="ghost" onClick={() => openSource()} className="w-full cursor-pointer"><ExternalLink /> API</Button>
                </div>
              </div>

              <SheetFooter className="p-3 border-t">
                <div className="text-xs opacity-60">Dictum — mobile menu</div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className={clsx("text-2xl md:text-3xl font-extrabold", isDark ? "text-white" : "text-black")}>Dictum</h1>
            <p className="text-xs md:text-sm opacity-70 mt-0.5">Inspiring quotes — search, share, inspect.</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 w-full max-w-2xl">
          <form onSubmit={(e) => e.preventDefault()} className={clsx("relative rounded-lg px-3 py-2 flex items-center gap-3 w-full", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              ref={inputRef}
              placeholder="Search quotes, authors, or keywords..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              aria-label="Search quotes"
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { doSuggest(query); setShowSuggest(true); }}>Search</Button>
            <Button type="button" variant="ghost" className="px-2 cursor-pointer" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); inputRef.current?.focus(); }}><X /></Button>
          </form>
        </div>

      </header>

      {/* Suggestions dropdown (anchored under header search) */}
      <AnimatePresence>
        {showSuggest && (loadingSuggest || suggestions.length > 0) && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_360px)] md:right-auto mt-2 max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60 flex items-center gap-2"><Loader2 className="animate-spin" /> Searching…</li>}
            {!loadingSuggest && suggestions.length === 0 && <li className="p-3 text-sm opacity-60">No suggestions</li>}

            {suggestions.map((s) => (
              <li key={s.id} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center rounded-sm bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                    {s.image ? (<img src={s.image} alt={s.author} className="w-full h-full object-cover" />) : (<Quote className="opacity-60" />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.text}</div>
                    <div className="text-xs opacity-60 truncate">{s.author}</div>
                  </div>
                  <div className="text-xs opacity-60">{(s.tags || []).slice(0,2).join(", ") || "—"}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left column - visible on desktop */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-0", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <CardTitle className="text-sm">Explore</CardTitle>
              <div className="text-xs opacity-60">Pool of quotes (click to view)</div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="max-h-[68vh] overflow-auto">
                <div className="p-3 space-y-2 ">
                  {loadingPool ? (
                    <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                  ) : pool.length === 0 ? (
                    <div className="py-6 text-sm opacity-60 px-3">No quotes available — try fetching random.</div>
                  ) : (
                    pool.map((q) => (
                      <motion.button
                        key={q.id}
                        onClick={() => setSelected(q)}
                        layout
                        whileHover={{ scale: 1.01 }}
                        className={clsx(" text-left p-3 w-80 cursor-pointer rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/40 flex gap-3 items-start", selected?.id === q.id ? "ring-2 ring-zinc-400/20" : "")}
                      >
                        <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                          <Quote className="opacity-70" size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{q.text}</div>
                          <div className="text-xs opacity-60 truncate">{q.author}</div>
                        </div>
                        <div className="text-xs opacity-60">{(q.tags || []).slice(0,1).join(", ") || "—"}</div>
                      </motion.button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="text-sm font-semibold mb-1">Controls</div>
            <div className="text-xs opacity-60">Quick helpers for pool and data</div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => loadInitialPool()} className="cursor-pointer"><RefreshCw /> Refresh pool</Button>
              <Button variant="ghost" onClick={() => fetchRandomAndShow()} className="cursor-pointer"><Loader2 /> Fetch single random</Button>
              <Button variant="ghost" onClick={() => openSource()} className="cursor-pointer"><ExternalLink /> Open API</Button>
            </div>
          </Card>
        </aside>

        {/* Center content */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-start justify-between gap-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <Quote />
                  <span>Quote</span>
                </CardTitle>
                <div className="text-xs opacity-60 flex items-center gap-2">
                  <User size={14} />
                  <span>{selected ? selected.author : "No quote selected"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
            <motion.button
  onClick={copySelected}
  type="button"
  whileTap={{ scale: 0.95 }}
  whileHover={{ scale: 1.02 }}
  className={clsx(
    "flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all select-none",
    "cursor-pointer shadow-sm border-zinc-300 dark:border-zinc-700",
    "bg-white/80 dark:bg-zinc-900/70 hover:bg-zinc-100 dark:hover:bg-zinc-800",
    "focus:outline-none focus:ring-2 focus:ring-zinc-300/40 dark:focus:ring-zinc-600/40"
  )}
>
  <AnimatePresence mode="wait" initial={false}>
    {/* IDLE */}
    {copyState === "idle" && (
      <motion.span
        key="idle"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.18 }}
        className="flex items-center gap-2 text-zinc-800 dark:text-zinc-100"
      >
        <Copy className="w-4 h-4" />
        <span className="text-sm">Copy</span>
      </motion.span>
    )}

    {/* COPYING */}
    {copyState === "copying" && (
      <motion.span
        key="copying"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-center justify-center"
      >
        <Loader2 className="w-4 h-4 animate-spin text-zinc-700 dark:text-zinc-300" />
      </motion.span>
    )}

    {/* DONE */}
    {copyState === "done" && (
      <motion.span
        key="done"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
        className="flex items-center gap-2 text-green-600 dark:text-green-400"
      >
        <Check className="w-4 h-4" />
        <span className="text-sm">Copied</span>
      </motion.span>
    )}
  </AnimatePresence>
</motion.button>


                <Button variant="ghost" onClick={tweetSelected} className="cursor-pointer"><Twitter /> Tweet</Button>
        
                {/* raw toggle */}
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer">
                  <FileText />
                  <span className="ml-1 text-sm">{showRaw ? "Hide raw" : "Show raw"}</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {selected ? (
                <div className="space-y-6">
                  <blockquote className={clsx("m-0 p-6 rounded-2xl", isDark ? "bg-black/20 border border-zinc-800" : "bg-white/70")}>
                    <p className="text-2xl md:text-3xl leading-snug font-semibold">“{selected.text}”</p>
                    <footer className="mt-4 text-right text-sm opacity-70">— {selected.author}</footer>
                  </blockquote>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={clsx("p-4 rounded-lg border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} />
                        <div className="text-xs opacity-60">Content</div>
                      </div>
                      <div className="text-sm break-words">{selected.text}</div>
                    </div>

                    <div className={clsx("p-4 rounded-lg border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="flex items-center gap-2 mb-2">
                        <Database size={16} />
                        <div className="text-xs opacity-60">Metadata</div>
                      </div>

                      <div className="text-sm">
                        <div className="flex items-center gap-2"><User size={14} /><span className="text-xs opacity-60">Author</span>: <span className="font-medium ml-1">{selected.author}</span></div>
                        <div className="mt-2 flex items-center gap-2"><Tag size={14} /><span className="text-xs opacity-60">Tags</span>: <span className="font-medium ml-1">{(selected.tags || []).length > 0 ? selected.tags.join(", ") : "—"}</span></div>
                        <div className="mt-2 flex items-center gap-2"><MoreHorizontal size={14} /><span className="text-xs opacity-60">ID</span>: <span className="font-medium ml-1 break-words">{selected.id}</span></div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Raw response area (toggle) */}
                  <AnimatePresence>
                    {showRaw && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
                        <div className="text-xs opacity-60 mb-2 flex items-center gap-2"><FileText /> Raw response</div>
                        <pre className={clsx("text-xs overflow-auto rounded-md p-3", isDark ? "bg-black/20 text-zinc-200" : "bg-white/60 text-zinc-900")} style={{ maxHeight: 260 }}>
                          {JSON.stringify(selected.raw ?? selected, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="py-12 text-center text-sm opacity-60">Select a quote on the left, or fetch a random quote.</div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right column */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold flex items-center gap-2"><Tag /> Quick Actions</div>
                <div className="text-xs opacity-60">Share, copy, or lookup the quote</div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button className="w-full justify-start cursor-pointer" onClick={copySelected}><Copy /> Copy quote</Button>
              <Button className="w-full justify-start cursor-pointer" onClick={tweetSelected}><Twitter /> Tweet quote</Button>
              <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={openSource}><ExternalLink /> Open API</Button>
              <Button className="w-full justify-start cursor-pointer" variant="ghost" onClick={() => {
                if (!selected) return showToast?.("info", "Select a quote first");
                const q = encodeURIComponent(`${selected.author} quote "${selected.text.slice(0, 60)}"`);
                window.open(`https://www.google.com/search?q=${q}`, "_blank", "noopener");
              }}><ExternalLink /> Search author & context</Button>
            </div>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="text-sm font-semibold mb-2">Design notes</div>
            <div className="text-xs opacity-60">Layout inspired by your NewsApiPage: left/center/right, card surfaces, subtle glass-like backgrounds, and consistent spacing for a professional desktop-first reading experience. Mobile uses a sheet-based sidebar.</div>
          </Card>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selected?.author ? `${selected.author} — Image` : "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {dialogImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dialogImage} alt={selected?.author ?? "image"} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm opacity-60">No image available</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from quote (if provided)</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { if (selected?.raw?.source) window.open(selected.raw.source, "_blank"); else openSource(); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
