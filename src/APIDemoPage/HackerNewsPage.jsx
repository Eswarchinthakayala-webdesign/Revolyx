// src/pages/HackerNewsPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Download,
  Loader2,
  List,
  Star,
  Copy,
  Check,
  ArrowRight,
  MessageSquare,
  Calendar,
  User,
  Hash,
  X,
  ChevronDown,
  ChevronUp,
  Menu,
  Link as LinkIcon,
  FileText,
  Bell,
  Zap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip } from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* shadcn select & sheet (mobile sidebar) */
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";

/* ---------- Endpoint ---------- */
const BASE_LIST_ENDPOINT = "https://hacker-news.firebaseio.com/v0/topstories.json";
const ITEM_ENDPOINT = "https://hacker-news.firebaseio.com/v0/item"; // use `${ITEM_ENDPOINT}/${id}.json`

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
function timeAgo(unixSec) {
  if (!unixSec) return "—";
  const diff = Date.now() / 1000 - unixSec;
  const mins = Math.floor(diff / 60);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

/* Simple skeleton */
function Skeleton({ className = "" }) {
  return <div className={clsx("animate-pulse bg-zinc-200/50 dark:bg-zinc-800/60 rounded", className)} />;
}

/* Fetch item by id */
async function fetchItem(id) {
  const res = await fetch(`${ITEM_ENDPOINT}/${id}.json`);
  if (!res.ok) throw new Error(`Item fetch failed ${res.status}`);
  return res.json();
}

/* Fetch top stories list */
async function fetchTopIds() {
  const res = await fetch(BASE_LIST_ENDPOINT);
  if (!res.ok) throw new Error(`List fetch failed ${res.status}`);
  return res.json();
}

export default function HackerNewsPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // State
  const [query, setQuery] = useState("");
  const [ids, setIds] = useState([]); // top story ids
  const [loadingIds, setLoadingIds] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [story, setStory] = useState(null);
  const [loadingStory, setLoadingStory] = useState(false);
  const [rawResp, setRawResp] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [expandedComments, setExpandedComments] = useState({}); // id -> boolean

  const [loadingComments, setLoadingComments] = useState({}); // id -> boolean
  const commentsCache = useRef({});

  const [copied, setCopied] = useState(false); // global for copy animation
  const copiedTimeout = useRef(null);

  const [sheetOpen, setSheetOpen] = useState(false); // mobile sidebar
  const [selectedTag, setSelectedTag] = useState("top"); // example select value

  // UI: random picks
  const [randomPicks, setRandomPicks] = useState([]);
  const [loadingRandom, setLoadingRandom] = useState(false);

  // UI effects: load top ids
  useEffect(() => {
    (async () => {
      setLoadingIds(true);
      try {
        const list = await fetchTopIds();
        setIds(Array.isArray(list) ? list.slice(0, 200) : []);
        // default to first story
        if (Array.isArray(list) && list.length > 0) {
          setSelectedId(list[0]);
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to fetch top stories");
      } finally {
        setLoadingIds(false);
      }
    })();
  }, []);

  // load story when selectedId changes
  useEffect(() => {
    if (!selectedId) return;
    let mounted = true;
    (async () => {
      setLoadingStory(true);
      try {
        const item = await fetchItem(selectedId);
        if (!mounted) return;
        setStory(item);
        setRawResp(item);
        showToast("success", `Loaded: ${item?.title ?? "story"}`);
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to fetch story");
      } finally {
        if (mounted) setLoadingStory(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedId]);

  // generate 10 random picks from ids (lazy fetch)
  async function loadRandomPicks() {
    if (!ids || ids.length === 0) return;
    setLoadingRandom(true);
    const picks = [];
    const used = new Set();
    while (picks.length < 10 && used.size < ids.length) {
      const idx = Math.floor(Math.random() * ids.length);
      const id = ids[idx];
      used.add(id);
      try {
        const itm = commentsCache.current[id] || await fetchItem(id);
        commentsCache.current[id] = itm;
        picks.push(itm);
      } catch {
        // ignore
      }
    }
    setRandomPicks(picks);
    setLoadingRandom(false);
  }

  /* Search among loaded ids by title - we'll fetch titles lazily as needed.
     To keep it simple and performant, when searching we map through current top ids,
     fetch their items (but only first 30 concurrently), and filter by title/author.
     This keeps page responsive while still allowing search. */
  async function handleSearch(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Enter a keyword (title or author)");
      return;
    }

    showToast("info", "Searching top stories (this may take a sec) — results will update");
    // fetch first 60 items concurrently in throttled batches
    const limit = 60;
    const batch = ids.slice(0, limit);
    const concurrency = 8;
    let results = [];
    for (let i = 0; i < batch.length; i += concurrency) {
      const slice = batch.slice(i, i + concurrency);
      const fetched = await Promise.all(slice.map(async (id) => {
        try {
          const itm = commentsCache.current[id] || await fetchItem(id);
          commentsCache.current[id] = itm;
          return itm;
        } catch {
          return null;
        }
      }));
      results = results.concat(fetched.filter(Boolean));
    }
    const q = query.trim().toLowerCase();
    const filtered = results.filter(itm => (itm.title || "").toLowerCase().includes(q) || (itm.by || "").toLowerCase().includes(q));
    if (filtered.length > 0) {
      setSelectedId(filtered[0].id ?? filtered[0].item ?? filtered[0].kid ?? filtered[0].id);
      setStory(filtered[0]);
      setRawResp(filtered[0]);
      showToast("success", `Found: ${filtered[0].title}`);
    } else {
      showToast("info", "No matches in top stories (try different keyword)");
    }
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(BASE_LIST_ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  function downloadJSON() {
    if (!rawResp && !story) {
      showToast("info", "No data to download");
      return;
    }
    const payload = rawResp || story;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hn_${(story?.id ?? "story")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  async function loadComments(kids = []) {
    if (!kids || kids.length === 0) return [];
    const missing = kids.filter(k => !commentsCache.current[k]);
    if (missing.length === 0) return kids.map(k => commentsCache.current[k]);

    // mark loading for each
    const loadMap = {};
    missing.forEach(m => (loadMap[m] = true));
    setLoadingComments(prev => ({ ...prev, ...loadMap }));

    try {
      const results = await Promise.all(missing.map(async (id) => {
        try {
          const itm = await fetchItem(id);
          commentsCache.current[id] = itm;
          return itm;
        } catch {
          return null;
        }
      }));
      // assign false
      const clearMap = {};
      missing.forEach(m => (clearMap[m] = false));
      setLoadingComments(prev => ({ ...prev, ...clearMap }));
      return kids.map(k => commentsCache.current[k]);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load comments");
      const clearMap = {};
      missing.forEach(m => (clearMap[m] = false));
      setLoadingComments(prev => ({ ...prev, ...clearMap }));
      return kids.map(k => commentsCache.current[k]);
    }
  }

  async function toggleCommentExpand(id, kids = []) {
    const next = { ...expandedComments, [id]: !expandedComments[id] };
    setExpandedComments(next);
    if (!expandedComments[id]) {
      // expanding now -> load children if any
      await loadComments(kids);
    }
  }

  function handleCopyJSON() {
    const payload = rawResp || story;
    if (!payload) {
      showToast("info", "Nothing to copy");
      return;
    }
    navigator.clipboard.writeText(prettyJSON(payload));
    setCopied(true);
    showToast("success", "Copied JSON");
    if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    copiedTimeout.current = setTimeout(() => setCopied(false), 2000); // reset after 2s
  }

  /* Renderers */
  function StorySkeleton() {
    return (
      <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
        <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
          <div>
            <CardTitle className="text-lg">Loading story…</CardTitle>
            <div className="text-xs opacity-60">Fetching top story details</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="cursor-pointer"><Loader2 className="animate-spin" /> Refresh</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
              <Skeleton className="h-48 w-full mb-3" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
              <Skeleton className="h-4 w-1/3 mb-3" />
              <Skeleton className="h-24 w-full mb-3" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* Render comment recursively up to 2 levels for performance */
  function Comment({ c }) {
    if (!c) return null;
    return (
      <div className="border-l pl-3 ml-2 my-2">
        <div className="text-xs opacity-60 flex items-center gap-2"><User className="h-3 w-3" /> <span className="font-medium text-sm">{c.by || "unknown"}</span> • <span className="text-[11px]">{timeAgo(c.time)}</span></div>
        <div className="text-sm mt-1" dangerouslySetInnerHTML={{ __html: c.text || "" }} />
        {c.kids && c.kids.length > 0 && (
          <div className="mt-2">
            <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => toggleCommentExpand(c.id, c.kids)}>
              {expandedComments[c.id] ? (<><ChevronUp className="w-4 h-4" /> Hide replies</>) : (<><ChevronDown className="w-4 h-4" /> View replies ({c.kids.length})</>)}
            </Button>

            <AnimatePresence>
              {expandedComments[c.id] && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2">
                  {c.kids.map((kidId) => {
                    const child = commentsCache.current[kidId];
                    return <Comment key={kidId} c={child} />;
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  // small helper to display domain safely
  function getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return "self";
    }
  }

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-8xl pb-10 mx-auto")}>
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {/* mobile menu (sheet) */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 md:hidden cursor-pointer" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-3">
              <SheetHeader>
                <SheetTitle>Top Stories</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <ScrollArea style={{ height: "60vh" }}>
                  <div className="space-y-2">
                    {loadingIds ? (
                      <>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </>
                    ) : (
                      ids.slice(0, 200).map((id) => {
                        const isActive = selectedId === id;
                        const cached = commentsCache.current[id];
                        const title = cached?.title || cached?.text || `Story ${id}`;
                        return (
                          <button
                            key={id}
                            onClick={() => { setSelectedId(id); setSheetOpen(false); }}
                            className={clsx("w-full cursor-pointer text-left p-3 rounded-md flex items-center gap-3 border", isActive ? "bg-zinc-100/80 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-700" : "hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50")}
                            aria-pressed={isActive}
                          >
                            <div className="flex-1 text-sm w-50 truncate">{title}</div>
                            <div className="text-xs opacity-60">{commentsCache.current[id] ? (commentsCache.current[id].score ?? "—") : <span className="inline-flex items-center gap-1"><Hash className="w-3 h-3" />{id}</span>}</div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
              <SheetFooter className="mt-4">
                <div className="w-full flex justify-between">
                  <Button className="cursor-pointer" variant="outline" onClick={() => { setSheetOpen(false); }}><X /> Close</Button>
                  <Button className="cursor-pointer" variant="ghost" onClick={() => { loadRandomPicks(); }}><Zap /> Random 10</Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className={clsx("text-2xl md:text-3xl font-extrabold")}>Pulse — Hacker News</h1>
            <p className="mt-0.5 text-xs opacity-70">Top stories from Hacker News — browse, inspect, and explore.</p>
          </div>
        </div>

        {/* search + actions */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <form onSubmit={handleSearch} className={clsx("hidden md:flex items-center gap-2 w-[520px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")} aria-label="Search stories">
            <Search className="opacity-60" />
            <Input
              placeholder="Search titles or authors in top stories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              aria-label="search input"
            />
            <Button type="button" variant="ghost" className="cursor-pointer" onClick={() => {
              setQuery("");
              // reset to default top
              if (ids && ids.length) setSelectedId(ids[0]);
            }}>Reset</Button>
            <Button type="submit" variant="outline" className="cursor-pointer"><Search /></Button>
          </form>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden md:flex cursor-pointer" onClick={() => { if (ids && ids.length) { setSelectedId(ids[0]); showToast("info", "Refreshed to top"); } }}>
              <Loader2 className={loadingIds ? "animate-spin" : ""} /> Refresh
            </Button>

            <Select value={selectedTag} onValueChange={(v) => setSelectedTag(v)} aria-label="Filter">
              <SelectTrigger className="w-[140px] cursor-pointer">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="top">Top</SelectItem>
                <SelectItem className="cursor-pointer" value="new">New</SelectItem>
                <SelectItem className="cursor-pointer" value="ask">Ask</SelectItem>
                <SelectItem className="cursor-pointer" value="show">Show</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" className="cursor-pointer" onClick={() => { loadRandomPicks(); }}><Zap /> Picks</Button>
          </div>
        </div>
      </header>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Center: story viewer */}
        <section className="lg:col-span-7 space-y-4">
          {loadingStory || !story ? <StorySkeleton /> : (
            <Card className={clsx("rounded-2xl overflow-hidden border shadow-sm", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
              <CardHeader className={clsx("p-4 md:p-5 flex flex-wrap items-start gap-4 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
                <div className=" min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full w-10 h-10 flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800">
                      <Star className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg md:text-xl font-semibold leading-tight truncate">{story?.title}</h2>
                      <div className="text-xs opacity-60 flex items-center gap-2">
                        <User className="w-3 h-3" /> {story?.by || "unknown"} • <Calendar className="w-3 h-3" /> {timeAgo(story.time)} • <span className="inline-flex items-center gap-1"><LinkIcon className="w-3 h-3" /> {getDomain(story.url)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button className="cursor-pointer" variant="outline" onClick={() => {
                    if (story.url) window.open(story.url, "_blank");
                    else showToast("info", "No external URL for this story");
                  }}><ExternalLink /> Read</Button>

                  <motion.div whileTap={{ scale: 0.92 }}>
                    <Tooltip content={copied ? "Copied" : "Copy JSON"}>
                      <Button
                        variant="ghost"
                        className="cursor-pointer"
                        onClick={handleCopyJSON}
                        aria-label="Copy story JSON"
                      >
                        <AnimatePresence initial={false}>
                          {copied ? (
                            <motion.span key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 0 }} className="inline-flex items-center gap-2">
                              <Check className="w-4 h-4" /> Copied
                            </motion.span>
                          ) : (
                            <motion.span key="copy" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 0 }} className="inline-flex items-center gap-2">
                              <Copy className="w-4 h-4" /> Copy
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                    </Tooltip>
                  </motion.div>

                  <Button variant="ghost" className="cursor-pointer" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide Raw" : "Raw"}</Button>

                  <Button variant="ghost" className="cursor-pointer" onClick={() => setDialogOpen(true)}><ExternalLink /></Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 md:p-5">
                {/* improved preview layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <aside className={clsx("rounded-xl p-3 border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="text-xs opacity-60">By</div>
                        <div className="font-medium">{story.by || "unknown"}</div>

                        <div className="mt-3 text-xs opacity-60">Meta</div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">Score</div>
                            <div className="font-medium">{story.score ?? "—"}</div>
                          </div>
                          <div className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">Comments</div>
                            <div className="font-medium">{story.descendants ?? (story.kids ? story.kids.length : 0)}</div>
                          </div>
                          <div className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">Type</div>
                            <div className="font-medium">{story.type ?? "—"}</div>
                          </div>
                          <div className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">Posted</div>
                            <div className="font-medium">{timeAgo(story.time)}</div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Button variant="outline" className="w-full cursor-pointer" onClick={() => { if (story.url) window.open(story.url, "_blank"); else showToast("info", "No external URL"); }}>
                            <LinkIcon /> Open original
                          </Button>

                          <Button variant="ghost" className="w-full cursor-pointer" onClick={() => { navigator.clipboard.writeText(prettyJSON(story)); setCopied(true); if (copiedTimeout.current) clearTimeout(copiedTimeout.current); copiedTimeout.current = setTimeout(() => setCopied(false), 2000); }}>
                            <FileText /> Copy payload
                          </Button>
                        </div>
                      </div>
                    </div>
                  </aside>

                  <div className={clsx("p-3 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4" />
                      <div className="text-sm font-semibold">Summary</div>
                    </div>
                    <div className="text-sm leading-relaxed mb-3">
                      {story.text ? <div dangerouslySetInnerHTML={{ __html: story.text }} /> : (story.title ? <div>{story.title}</div> : "No description available.")}
                    </div>

                    <Separator className="my-3" />

                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4" />
                      <div className="text-sm font-semibold">Fields</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {["id","title","by","url","score","time","type","descendants"].map(k => (
                        <div key={k} className="p-2 rounded-md border">
                          <div className="text-xs opacity-60 flex items-center gap-2"><span className="uppercase">{k}</span></div>
                          <div className="text-sm font-medium break-words">{typeof story[k] === "object" ? prettyJSON(story[k]) : (story[k] ?? "—")}</div>
                        </div>
                      ))}
                    </div>

                    <AnimatePresence>
                      {showRaw && rawResp && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-3 p-2 rounded-md border">
                          <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 240 }}>
                            {prettyJSON(rawResp)}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <div className="text-sm font-semibold">Comments</div>
                    </div>
                    <div className="text-xs opacity-60">{story.kids ? story.kids.length : 0} total</div>
                  </div>

                  <div>
                    {!story.kids || story.kids.length === 0 ? (
                      <div className="text-sm opacity-60">No comments available.</div>
                    ) : (
                      <div className="space-y-3">
                        {story.kids.slice(0, 12).map((kidId) => {
                          const c = commentsCache.current[kidId];
                          return (
                            <div key={kidId} className="p-3 rounded-md border">
                              {!c ? (
                                <div className="flex items-center gap-3">
                                  <Skeleton className="h-8 w-full" />
                                  <Button variant="ghost" className="cursor-pointer" onClick={async () => { await loadComments([kidId]); }}>
                                    <ArrowRight />
                                  </Button>
                                </div>
                              ) : (
                                <Comment c={c} />
                              )}
                            </div>
                          );
                        })}
                        {story.kids.length > 12 && <div className="text-xs opacity-60">Showing first 12 comments. Expand in raw JSON to fetch more.</div>}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Right: list / developer tools + random picks */}
        <aside className={clsx("lg:col-span-5 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold mb-1">Top Stories</div>
                <div className="text-xs opacity-60">Recent top IDs from Hacker News</div>
              </div>
              <div className="text-xs opacity-60">#{ids.length}</div>
            </div>

            <Separator className="my-3" />

            <div className="max-h-[36vh] overflow-auto no-scrollbar space-y-2">
              {loadingIds ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : (
                ids.slice(0, 50).map((id) => {
                  const isActive = selectedId === id;
                  const cached = commentsCache.current[id];
                  const title = cached?.title || cached?.text || `Story ${id}`;
                  return (
                    <button
                      key={id}
                      onClick={() => { setSelectedId(id); }}
                      className={clsx("w-full text-left p-2 rounded-md flex items-center gap-3 border", isActive ? "bg-zinc-100/80 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-700" : "hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50")}
                      aria-pressed={isActive}
                    >
                      <div className="flex-1 text-sm truncate">{title}</div>
                      <div className="text-xs opacity-60">{commentsCache.current[id] ? (commentsCache.current[id].score ?? "—") : <span className="inline-flex items-center gap-1"><Hash className="w-3 h-3" />{id}</span>}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint examples & debugging</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => copyEndpoint()} className="cursor-pointer"><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={() => downloadJSON()} className="cursor-pointer"><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => setShowRaw(s => !s)} className="cursor-pointer"><List /> Toggle Raw</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold mb-1">Random Picks</div>
                <div className="text-xs opacity-60">10 random stories from the top list</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => loadRandomPicks()} className="cursor-pointer"><Zap /></Button>
              </div>
            </div>

            <div className="mt-2 max-h-[28vh] overflow-auto no-scrollbar space-y-2">
              {loadingRandom ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : randomPicks.length === 0 ? (
                <div className="text-xs opacity-60">No picks yet — press the lightning icon to generate.</div>
              ) : (
                randomPicks.map((p) => (
                  <button key={p.id} onClick={() => setSelectedId(p.id)} className="w-full text-left p-2 rounded-md border hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="text-sm truncate">{p.title}</div>
                      <div className="text-xs opacity-60">{p.score ?? "—"}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* External dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{story?.title || "Open link"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {story?.url ? (
              <iframe title={story?.title || "external"} src={story.url} style={{ width: "100%", height: "100%", border: "0" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No external URL</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">External story (iframe)</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { if (story?.url) window.open(story.url, "_blank"); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
