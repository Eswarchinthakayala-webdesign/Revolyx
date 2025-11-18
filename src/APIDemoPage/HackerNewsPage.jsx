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
  ArrowRight,
  MessageSquare,
  Calendar,
  User,
  Hash,
  X,
  ChevronDown,
  ChevronUp
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

  // UI effects
  useEffect(() => {
    (async () => {
      setLoadingIds(true);
      try {
        const list = await fetchTopIds();
        setIds(Array.isArray(list) ? list.slice(0, 100) : []);
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

  /* Search among loaded ids by title - we'll fetch titles lazily as needed.
     To keep it simple and performant, when searching we map through current top 100 ids,
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
            <Button variant="outline"><Loader2 className="animate-spin" /> Refresh</Button>
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
            <Button size="sm" variant="ghost" onClick={() => toggleCommentExpand(c.id, c.kids)}>
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

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Pulse — Hacker News</h1>
          <p className="mt-1 text-sm opacity-70">Top stories from Hacker News (Firebase API). Browse, inspect, and explore comments.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")} aria-label="Search stories">
            <Search className="opacity-60" />
            <Input
              placeholder="Search titles or authors in top stories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              aria-label="search input"
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => {
              setQuery("");
              // reset to default top
              if (ids && ids.length) setSelectedId(ids[0]);
            }}>Reset</Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Center: story viewer */}
        <section className="lg:col-span-9 space-y-4">
          {loadingStory || !story ? <StorySkeleton /> : (
            <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
              <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
                <div>
                  <CardTitle className="text-lg">Story</CardTitle>
                  <div className="text-xs opacity-60">{story?.title ?? "Waiting for a story..."}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="cursor-pointer" variant="outline" onClick={() => {
                    if (ids && ids.length) {
                      setSelectedId(ids[0]);
                    } else {
                      showToast("info", "No top stories loaded");
                    }
                  }}><Loader2 className={loadingIds ? "animate-spin" : ""} /> Refresh</Button>
                  <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                  <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><ExternalLink /> Open in new</Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: meta */}
                  <aside className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    {/* HN has no image; show a strong title block or domain */}
                    <div className="w-full h-48 flex items-center justify-center rounded-md bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 mb-3">
                      <div className="text-center">
                        <div className="text-sm opacity-70">Hacker News</div>
                        <div className="text-lg font-semibold">{story.title}</div>
                        <div className="text-xs opacity-60 mt-1">{story.url ? new URL(story.url).hostname : "self"}</div>
                      </div>
                    </div>

                    <div className="text-xs opacity-60">By</div>
                    <div className="font-medium">{story.by || "unknown"}</div>

                    <div className="mt-3 text-xs opacity-60">Meta</div>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
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

                    <div className="mt-4 flex flex-col gap-2">
                      <Button variant="outline" onClick={() => {
                        if (story.url) window.open(story.url, "_blank");
                        else showToast("info", "No external URL for this story");
                      }}><ExternalLink /> Read original</Button>

                      <Button variant="outline" onClick={() => {
                        navigator.clipboard.writeText(prettyJSON(story));
                        showToast("success", "Story JSON copied");
                      }}><Copy /> Copy JSON</Button>
                    </div>
                  </aside>

                  {/* Right: content */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Summary</div>
                    <div className="text-sm leading-relaxed mb-3">{story.text ? <div dangerouslySetInnerHTML={{ __html: story.text }} /> : (story.title ? `${story.title}` : "No description available.")}</div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Fields</div>
                    <div className="space-y-2">
                      <details className="rounded-md border p-2">
                        <summary className="cursor-pointer text-sm font-medium flex items-center justify-between">
                          <span>Basic fields</span>
                          <span className="text-xs opacity-60">Expand</span>
                        </summary>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {["id","title","by","url","score","time","type","descendants"].map(k => (
                            <div key={k} className="p-2 rounded-md border">
                              <div className="text-xs opacity-60">{k}</div>
                              <div className="text-sm font-medium break-words">{typeof story[k] === "object" ? prettyJSON(story[k]) : (story[k] ?? "—")}</div>
                            </div>
                          ))}
                        </div>
                      </details>

                      <details className="rounded-md border p-2">
                        <summary className="cursor-pointer text-sm font-medium flex items-center justify-between">
                          <span>Raw JSON</span>
                          <span className="text-xs opacity-60">View payload</span>
                        </summary>
                        <pre className="text-xs overflow-auto mt-2" style={{ maxHeight: 300 }}>{prettyJSON(rawResp || story)}</pre>
                      </details>
                    </div>

                    <Separator className="my-3" />

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold">Comments</div>
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
                                      <Button variant="ghost" onClick={async () => {
                                        await loadComments([kidId]);
                                      }}><ArrowRight /></Button>
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
                  </div>
                </div>
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
          )}
        </section>

        {/* Right: list / developer tools */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold mb-1">Top Stories</div>
                <div className="text-xs opacity-60">Recent top IDs from Hacker News</div>
              </div>
              <div className="text-xs opacity-60">#{ids.length}</div>
            </div>

            <Separator className="my-3" />

            <div className="max-h-[48vh] overflow-auto no-scrollbar space-y-2">
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
              <Button variant="outline" onClick={() => copyEndpoint()}><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => setShowRaw(s => !s)}><List /> Toggle Raw</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* External dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
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
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (story?.url) window.open(story.url, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
