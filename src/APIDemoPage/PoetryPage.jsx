// src/pages/PoetryPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  BookOpen,
  RefreshCw,
  Copy,
  Download,
  List,
  ExternalLink,
  Loader2,
  Moon,
  SunMedium,
  Quote
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * PoetryPage.jsx
 * - Uses PoetryDB (https://poetrydb.org) — no API key required.
 * - Search by author or title (debounced suggestions).
 * - Default load: Shakespeare poems (author).
 * - Left column: list of matched poems (titles + snippet).
 * - Center: full poem view with line-by-line rendering.
 * - Right: quick actions (download, copy, random, toggle theme, raw JSON).
 *
 * Notes:
 * - PoetryDB endpoints used:
 *   - /author/{author}
 *   - /title/{title}
 *   - /random/1
 */

const BASE = "https://poetrydb.org";
const DEFAULT_AUTHOR = "Shakespeare";
const DEBOUNCE_MS = 300;

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export default function PoetryPage() {
  const { theme, setTheme } = useTheme?.() ?? { theme: "system", setTheme: () => {} };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [query, setQuery] = useState(DEFAULT_AUTHOR);
  const [suggestions, setSuggestions] = useState([]); // lighting suggestions (titles/authors)
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [results, setResults] = useState([]); // full array of poems
  const [current, setCurrent] = useState(null); // selected poem object { title, author, lines, linecount }
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const timer = useRef(null);
  const abortRef = useRef(null);

  // --- fetch helpers ---
  const buildAuthorUrl = (author) => `${BASE}/author/${encodeURIComponent(author)}`;
  const buildTitleUrl = (title) => `${BASE}/title/${encodeURIComponent(title)}`;
  const buildRandomUrl = () => `${BASE}/random/1`;

  async function fetchByAuthor(author) {
    if (!author) return [];
    setLoading(true);
    try {
      const res = await fetch(buildAuthorUrl(author));
      if (!res.ok) {
        // API returns 404 if not found — handle gracefully
        return [];
      }
      const json = await res.json(); // array of poems
      return json;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function fetchByTitle(title) {
    if (!title) return [];
    setLoading(true);
    try {
      const res = await fetch(buildTitleUrl(title));
      if (!res.ok) return [];
      const json = await res.json();
      return json;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function fetchRandom() {
    setLoading(true);
    try {
      const res = await fetch(buildRandomUrl());
      if (!res.ok) {
        showToast("error", `Random fetch failed (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      // json is array with one poem
      setResults(json);
      setCurrent(json[0] ?? null);
      setRawResp(json);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch random poem");
    } finally {
      setLoading(false);
    }
  }

  // Combined search: try author first, then title fallback.
  async function doSearch(q) {
    if (!q || !q.trim()) {
      setResults([]);
      setCurrent(null);
      setRawResp(null);
      return;
    }

    setLoadingSuggest(true);
    try {
      // cancel previous abortable fetch (if any) — PoetryDB doesn't need abort but we guard
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // try author search
      const authorRes = await fetch(buildAuthorUrl(q), { signal: controller.signal }).catch(() => null);
      if (authorRes && authorRes.ok) {
        const json = await authorRes.json();
        setSuggestions(json.map(p => ({ title: p.title, author: p.author })));
        // set results and current to first
        setResults(json);
        setCurrent(json[0] ?? null);
        setRawResp(json);
        setLoadingSuggest(false);
        return;
      }

      // fallback to title search
      const titleRes = await fetch(buildTitleUrl(q), { signal: controller.signal }).catch(() => null);
      if (titleRes && titleRes.ok) {
        const json = await titleRes.json();
        setSuggestions(json.map(p => ({ title: p.title, author: p.author })));
        setResults(json);
        setCurrent(json[0] ?? null);
        setRawResp(json);
        setLoadingSuggest(false);
        return;
      }

      // if neither found, clear
      setSuggestions([]);
      setResults([]);
      setCurrent(null);
      setRawResp(null);
      setLoadingSuggest(false);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(err);
      setLoadingSuggest(false);
    } finally {
      abortRef.current = null;
    }
  }

  // Debounced handler for input changes
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(v), DEBOUNCE_MS);
  }

  // Submit (explicit search)
  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (!query || !query.trim()) {
      showToast("info", "Type an author or title (e.g. Shakespeare or Sonnet 18).");
      return;
    }
    // doSearch will update state
    await doSearch(query.trim());
    setShowSuggest(false);
  }

  // pick poem from left list or suggestion
  function pickPoem(indexOrObj) {
    if (typeof indexOrObj === "number") {
      const p = results[indexOrObj];
      setCurrent(p ?? null);
      return;
    }
    // object from suggestion: find matching poem in results by title+author
    const item = indexOrObj;
    const found = results.find(r => r.title === item.title && r.author === item.author);
    if (found) {
      setCurrent(found);
    } else {
      // fallback: set current to item-like object
      setCurrent(item);
    }
  }

  // actions
  function copyPoemJson() {
    if (!current) return showToast("info", "No poem selected");
    navigator.clipboard.writeText(prettyJSON(current));
    showToast("success", "Poem JSON copied");
  }

  function downloadPoemJson() {
    const payload = current || results || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `poem_${(current?.title || "poem").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  // initial load: default author
  useEffect(() => {
    (async () => {
      const res = await fetchByAuthor(DEFAULT_AUTHOR);
      if (res && res.length > 0) {
        setResults(res);
        setCurrent(res[0]);
        setRawResp(res);
      } else {
        // fallback random
        fetchRandom();
      }
    })();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snippet = useMemo(() => {
    if (!current) return "";
    // show first non-empty line trimmed as snippet
    const first = Array.isArray(current.lines) ? current.lines.find(l => l && l.trim().length > 0) : "";
    return first ? first.slice(0, 120) : "";
  }, [current]);

  // theme toggle helper
  function toggleTheme() {
    setTheme?.(isDark ? "light" : "dark");
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>VerseVault — Poetry</h1>
          <p className="mt-1 text-sm opacity-70">Browse poems by author or title. PoetryDB powered — no API key required.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search poems by author or title"
              placeholder='Try "Shakespeare" or "Sonnet 18"'
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" onClick={() => { setQuery(DEFAULT_AUTHOR); doSearch(DEFAULT_AUTHOR); }}>Default</Button>
            <Button type="submit" variant="outline" aria-label="Search"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions (floating under search) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={`${s.title}-${idx}`} onClick={() => { pickPoem(s); setShowSuggest(false); }} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Quote className="w-6 h-6 opacity-70" />
                  <div className="flex-1">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs opacity-60">{s.author || "—"}</div>
                  </div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout: left (list) | center (poem) | right (actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT: titles list */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/30 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Results</div>
              <div className="text-xs opacity-60">{results.length} poems</div>
            </div>
            <div>
              <Button size="sm" variant="ghost" onClick={() => fetchRandom()}><RefreshCw /></Button>
            </div>
          </div>

          <ScrollArea className="h-200 overflow-auto no-scrollbar">
            <div className="space-y-2">
              {results.length === 0 && <div className="text-sm opacity-60">No results — try another query.</div>}
              {results.map((p, i) => (
                <button
                  key={`${p.title}-${i}`}
                  onClick={() => pickPoem(i)}
                  className={clsx("w-full text-left p-3 rounded-md border flex flex-col gap-1", current === p ? (isDark ? "bg-black/20 border-zinc-700" : "bg-white/80 border-zinc-300") : (isDark ? "bg-black/10 border-zinc-800" : "bg-white/70 border-zinc-200"))}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{p.title}</div>
                    <div className="text-xs opacity-60">{p.linecount} lines</div>
                  </div>
                  <div className="text-xs opacity-60 truncate">{Array.isArray(p.lines) ? (p.lines[0] || "").slice(0, 80) : ""}</div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* CENTER: poem detail */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-start justify-between gap-4", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-xl">{current?.title ?? "Select a poem"}</CardTitle>
                <div className="text-xs opacity-60 mt-1">{current?.author ?? "—"} • {snippet}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /></Button>
                <Button variant="outline" onClick={() => copyPoemJson()}><Copy /></Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No poem selected. Search or pick from the list.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <div className="prose dark:prose-invert max-w-none">
                    {current.lines.map((ln, idx) => (
                      <div key={idx} className={clsx("leading-relaxed", ln.trim() === "" ? "my-2" : "")}>
                        {ln}
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs opacity-60">Author</div>
                      <div className="font-medium">{current.author}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-60">Lines</div>
                      <div className="font-medium">{current.linecount}</div>
                    </div>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {showRaw && rawResp && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4 p-3 rounded-md border">
                    <pre className="text-xs overflow-auto" style={{ maxHeight: 280 }}>{prettyJSON(rawResp)}</pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: quick actions */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/30 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Quick actions</div>
              <div className="text-xs opacity-60">Utilities & export</div>
            </div>
            <div className="text-xs opacity-60">{current?.author || "—"}</div>
          </div>

          <div className="space-y-2">
            <Button className="w-full" onClick={() => fetchRandom()}><RefreshCw /> <span className="ml-2">Random Poem</span></Button>
            <Button className="w-full" onClick={() => downloadPoemJson()}><Download /> <span className="ml-2">Download JSON</span></Button>
            <Button className="w-full" onClick={() => copyPoemJson()}><Copy /> <span className="ml-2">Copy Poem JSON</span></Button>
            <Button className="w-full" onClick={() => { setShowRaw(s => !s); }}><List /> <span className="ml-2">{showRaw ? "Hide Raw" : "Show Raw"}</span></Button>

            <Separator />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setQuery(DEFAULT_AUTHOR) & doSearch(DEFAULT_AUTHOR)}>Default</Button>
              <Button variant="outline" className="flex-1" onClick={() => toggleTheme()}>{isDark ? <SunMedium /> : <Moon />}</Button>
            </div>
          </div>

          <Separator />

          <div className="text-xs opacity-60">
            <div className="text-[12px] font-medium mb-2">About</div>
            Poetry data provided by <a className="underline" href="https://poetrydb.org" target="_blank" rel="noreferrer">PoetryDB</a>. No API key required.
          </div>
        </aside>
      </main>

      {/* Dialog (example: larger view of raw JSON) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl w-full p-0 rounded-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Raw response</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "70vh" }} className="p-4 overflow-auto">
            <pre className="text-xs">{prettyJSON(rawResp)}</pre>
          </div>

          <DialogFooter className="p-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
            <Button onClick={() => downloadPoemJson()}>Download</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
