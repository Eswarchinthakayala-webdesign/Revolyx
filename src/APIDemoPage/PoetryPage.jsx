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
  Quote,
  Menu,
  Play,
  Pause,
  StopCircle,
  Check,
  Speaker,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // shadcn sheet

/**
 * PoetryPage.jsx — Improved UI
 * - Desktop: left sidebar shows 10 random poems (titles + snippet). Clicking selects.
 * - Mobile: same list in a Sheet (open via menu icon).
 * - Center: enhanced poem preview with badges, icons, line-by-line highlight while reading.
 * - Right: quick actions: random, download, copy (animated), show raw.
 * - Read aloud: start/pause/stop toggles. Uses SpeechSynthesisUtterance and onboundary to highlight current line.
 * - Copy animation: shows tick then resets.
 * - Improved responsiveness and styling (badges/colors).
 */

const BASE = "https://poetrydb.org";
const DEFAULT_AUTHOR = "Shakespeare";
const DEBOUNCE_MS = 300;
const RANDOM_LIST_SIZE = 10;

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

  // search state
  const [query, setQuery] = useState(DEFAULT_AUTHOR);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // results & current poem
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);

  // sidebar list (random 10)
  const [randomList, setRandomList] = useState([]);
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // UI states
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyAnimating, setCopyAnimating] = useState(false);

  // speech
  const synthRef = useRef(window.speechSynthesis ? window.speechSynthesis : null);
  const utterRef = useRef(null);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLineIdx, setCurrentLineIdx] = useState(-1);

  // misc
  const timer = useRef(null);
  const abortRef = useRef(null);

  // helpers to build urls
  const buildAuthorUrl = (author) => `${BASE}/author/${encodeURIComponent(author)}`;
  const buildTitleUrl = (title) => `${BASE}/title/${encodeURIComponent(title)}`;
  const buildRandomUrl = () => `${BASE}/random/1`;
  const buildRandomListUrl = (n) => `${BASE}/random/${n}`;

  // -------------------------
  // Fetch functions
  // -------------------------
  async function fetchByAuthor(author) {
    if (!author) return [];
    setLoading(true);
    try {
      const res = await fetch(buildAuthorUrl(author));
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

  async function fetchRandomOne() {
    setLoading(true);
    try {
      const res = await fetch(buildRandomUrl());
      if (!res.ok) {
        showToast("error", `Random fetch failed (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
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

  async function fetchRandomList(n = RANDOM_LIST_SIZE) {
    setLoadingRandom(true);
    try {
      const res = await fetch(buildRandomListUrl(n));
      if (!res.ok) {
        setRandomList([]);
        setLoadingRandom(false);
        return;
      }
      const json = await res.json();
      setRandomList(json || []);
      // if there's no current poem, set first of random list
      if (!current && json && json.length > 0) {
        setCurrent(json[0]);
        setRawResp(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRandom(false);
    }
  }

  // Combined search: try author then title
  async function doSearch(q) {
    if (!q || !q.trim()) {
      setResults([]);
      setCurrent(null);
      setRawResp(null);
      return;
    }

    setLoadingSuggest(true);
    try {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // author first
      const authorRes = await fetch(buildAuthorUrl(q), { signal: controller.signal }).catch(() => null);
      if (authorRes && authorRes.ok) {
        const json = await authorRes.json();
        setSuggestions(json.map(p => ({ title: p.title, author: p.author })));
        setResults(json);
        setCurrent(json[0] ?? null);
        setRawResp(json);
        setLoadingSuggest(false);
        return;
      }

      // title fallback
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

      // none found
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

  // Debounced input handler
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(v), DEBOUNCE_MS);
  }

  // explicit submit
  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (!query || !query.trim()) {
      showToast("info", "Type an author or title (e.g. Shakespeare or Sonnet 18).");
      return;
    }
    await doSearch(query.trim());
    setShowSuggest(false);
  }

  // pick poem from list or suggestion
  function pickPoem(indexOrObj) {
    if (typeof indexOrObj === "number") {
      const p = results[indexOrObj] ?? randomList[indexOrObj];
      setCurrent(p ?? null);
      setRawResp(p ? [p] : null);
      return;
    }
    const item = indexOrObj;
    const found = (results || []).find(r => r.title === item.title && r.author === item.author)
      || (randomList || []).find(r => r.title === item.title && r.author === item.author);
    if (found) {
      setCurrent(found);
      setRawResp([found]);
    } else {
      setCurrent(item);
      setRawResp([item]);
    }
    setShowSuggest(false);
    setSheetOpen(false);
  }

  // copy + download
  function copyPoemJson() {
    if (!current) return showToast("info", "No poem selected");
    navigator.clipboard.writeText(prettyJSON(current));
    // animate
    setCopied(true);
    setCopyAnimating(true);
    setTimeout(() => setCopyAnimating(false), 600);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
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

  // -------------------------
  // Speech (read aloud)
  // -------------------------
  // Build a combined text for reading
  const readingText = useMemo(() => {
    if (!current) return "";
    // title + author + lines
    const lines = Array.isArray(current.lines) ? current.lines : [];
    const header = `${current.title} by ${current.author}.`;
    return `${header}\n\n${lines.join("\n")}`;
  }, [current]);

  // Helper: start reading using Web Speech API and use onboundary to highlight lines
  function startReading() {
    if (!synthRef.current || !readingText) {
      showToast("info", "Nothing to read");
      return;
    }

    stopReading(); // ensure previous is cleared

    const utter = new SpeechSynthesisUtterance(readingText);
    utter.lang = "en-US";
    utter.rate = 1;
    utter.pitch = 1;

    // prepare cumulative lengths to map character index -> line index
    const lines = Array.isArray(current?.lines) ? current.lines : [];
    const header = `${current?.title} by ${current?.author}.`;
    const fullParts = [header, "", ...lines];
    const cumLengths = [];
    let cum = 0;
    for (let i = 0; i < fullParts.length; i++) {
      cumLengths.push(cum);
      // +1 for newline
      cum += (fullParts[i]?.length ?? 0) + 1;
    }

    utter.onboundary = (evt) => {
      // evt.charIndex gives character index in the whole text
      if (typeof evt.charIndex !== "number") return;
      const idx = evt.charIndex;
      // find the last index where cumLengths[i] <= idx
      let lineIdx = 0;
      for (let i = 0; i < cumLengths.length; i++) {
        if (idx >= cumLengths[i]) lineIdx = i;
        else break;
      }
      // convert to poem line index (skip header + blank)
      const poemLineIdx = lineIdx - 2; // because fullParts had header + blank
      setCurrentLineIdx(poemLineIdx);
    };

    utter.onend = () => {
      setIsReading(false);
      setIsPaused(false);
      setCurrentLineIdx(-1);
      utterRef.current = null;
    };

    synthRef.current.speak(utter);
    utterRef.current = utter;
    setIsReading(true);
    setIsPaused(false);
  }

  function pauseReading() {
    if (!synthRef.current) return;
    if (synthRef.current.speaking && !synthRef.current.paused) {
      synthRef.current.pause();
      setIsPaused(true);
      setIsReading(false);
    }
  }

  function resumeReading() {
    if (!synthRef.current) return;
    if (synthRef.current.paused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsReading(true);
    } else {
      startReading();
    }
  }

  function stopReading() {
    if (!synthRef.current) return;
    try {
      synthRef.current.cancel();
    } catch (e) {
      console.error(e);
    }
    setIsReading(false);
    setIsPaused(false);
    setCurrentLineIdx(-1);
    utterRef.current = null;
  }

  function toggleReading() {
    if (isReading) {
      pauseReading();
    } else if (isPaused) {
      resumeReading();
    } else {
      startReading();
    }
  }

  // cleanup speech on unmount
  useEffect(() => {
    return () => {
      try {
        synthRef.current?.cancel();
      } catch {}
      if (timer.current) clearTimeout(timer.current);
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // initial load
  // -------------------------
  useEffect(() => {
    (async () => {
      const res = await fetchByAuthor(DEFAULT_AUTHOR);
      if (res && res.length > 0) {
        setResults(res);
        setCurrent(res[0]);
        setRawResp(res);
      } else {
        fetchRandomOne();
      }
      // fetch random list for left sidebar
      fetchRandomList(RANDOM_LIST_SIZE);
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snippet = useMemo(() => {
    if (!current) return "";
    const first = Array.isArray(current.lines) ? current.lines.find(l => l && l.trim().length > 0) : "";
    return first ? first.slice(0, 120) : "";
  }, [current]);

  // theme toggle helper
  function toggleTheme() {
    setTheme?.(isDark ? "light" : "dark");
  }

  // small helper for animated copy button variants
  const copyBtnClasses = clsx(
    "inline-flex items-center gap-2 justify-center transition-all cursor-pointer",
    copyAnimating ? "scale-95" : "scale-100"
  );

  // UI: improved center content component
  function PoemView() {
    if (loading) {
      return <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>;
    }

    if (!current) {
      return <div className="py-12 text-center text-sm opacity-60">No poem selected. Search or pick from the list.</div>;
    }

    const lines = Array.isArray(current.lines) ? current.lines : [];

    return (
      <div className="space-y-6">
        <div className="flex items-start flex-wrap justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold leading-tight flex items-center gap-3">
              <BookOpen className="w-6 h-6 opacity-80" />
              <span>{current.title}</span>
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm opacity-70">
                <Quote className="w-4 h-4" />
                <span className="font-medium">{current.author}</span>
              </div>

              <div className="rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200">
                {current.linecount} lines
              </div>

              <div className="text-xs opacity-60 ml-2 hidden sm:block">{snippet}</div>
            </div>
          </div>

        
        </div>

        <Card className={clsx("p-6", isDark ? "bg-black/40 border-zinc-800" : "bg-white/95 border-zinc-200")}>
          {/* reader controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Speaker className="w-5 h-5" /> Reading
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={toggleReading} className="cursor-pointer">
                  {isReading ? <Pause className="w-4 h-4" /> : isPaused ? <Play className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="ml-2 text-sm">{isReading ? "Pause" : (isPaused ? "Resume" : "Start")}</span>
                </Button>

                <Button size="sm" variant="ghost" onClick={() => { stopReading(); }} className="cursor-pointer">
                  <StopCircle className="w-4 h-4" /><span className="ml-2 text-sm">Stop</span>
                </Button>
              </div>
            </div>

            <div className="text-xs opacity-60">Tip: highlight will follow spoken words</div>
          </div>

          <div className="prose dark:prose-invert max-w-none leading-relaxed">
            {lines.map((ln, idx) => (
              <div
                key={idx}
                className={clsx(
                  "py-1 transition-colors rounded-md",
                  currentLineIdx === idx ? "bg-amber-100/60 dark:bg-amber-700/30 text-amber-900 dark:text-amber-100 font-semibold" : "text-zinc-900 dark:text-zinc-100"
                )}
              >
                {ln === "" ? <br /> : ln}
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs opacity-60">Author</div>
              <div className="font-medium">{current.author}</div>
            </div>
            <div>
              <div className="text-xs opacity-60">Lines</div>
              <div className="font-medium">{current.linecount}</div>
            </div>
            <div>
              <div className="text-xs opacity-60">Source</div>
              <a className="underline text-sm" href="https://poetrydb.org" target="_blank" rel="noreferrer">PoetryDB</a>
            </div>
          </div>

          <AnimatePresence>
            {showRaw && rawResp && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4 p-3 rounded-md border bg-transparent overflow-auto">
                <pre className="text-xs" style={{ maxHeight: 240 }}>{prettyJSON(rawResp)}</pre>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    );
  }

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className={clsx("min-h-screen p-4 lg:p-6 max-w-8xl pb-10 mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-4">
          {/* mobile menu trigger */}
          <div className="lg:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="cursor-pointer"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen />
                    <div className="font-bold">Browse</div>
                  </div>

                </div>

                <div className="mb-3 text-sm opacity-70">Random selections</div>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-2">
                    {loadingRandom && <div className="p-3 text-sm opacity-60">Loading…</div>}
                    {!loadingRandom && randomList.map((p, i) => (
                      <button key={`${p.title}-${i}`} onClick={() => pickPoem(p)} className="w-full text-left p-3 rounded-md border hover:scale-[1.01] transition-transform cursor-pointer">
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs opacity-60">{p.author}</div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>

                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" onClick={() => fetchRandomList(RANDOM_LIST_SIZE)}><RefreshCw /> <span className="ml-2">Refresh</span></Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className={clsx("text-2xl sm:text-3xl md:text-4xl font-extrabold flex items-baseline gap-3")}>
              VerseVault
              <span className="text-sm ml-1 opacity-70 font-medium">— Poetry</span>
            </h1>
            <p className="text-xs opacity-60">Browse poems by author or title. Powered by PoetryDB — no API key.</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSubmit} className={clsx("flex items-center gap-2 w-full rounded-xl px-3 py-2 border", isDark ? "bg-black/60 border-zinc-800" : "bg-white border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search poems by author or title"
              placeholder='Try "Shakespeare" or "Sonnet 18"'
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
      
          </form>

          {/* floating suggestions */}
          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-4 right-4 lg:left-[calc(50%_-_360px)] lg:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl mt-2", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
                {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
                {suggestions.map((s, idx) => (
                  <li key={`${s.title}-${idx}`} onClick={() => { pickPoem(s); setShowSuggest(false); }} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer">
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
        </div>

        {/* header actions */}
      
      </header>

      {/* main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: desktop-only random list */}
        <aside className={clsx("hidden lg:block lg:col-span-3 space-y-4", isDark ? "bg-black/30 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Random Picks</div>
              <div className="text-xs opacity-60">{randomList.length} suggestions</div>
            </div>
            <div>
              <Button size="sm" variant="ghost" onClick={() => fetchRandomList(RANDOM_LIST_SIZE)} className="cursor-pointer"><RefreshCw /></Button>
            </div>
          </div>

          <ScrollArea className="h-80 overflow-auto no-scrollbar">
            <div className="space-y-2">
              {loadingRandom && <div className="p-3 text-sm opacity-60">Loading…</div>}
              {!loadingRandom && randomList.length === 0 && <div className="text-sm opacity-60">No suggestions — refresh.</div>}
              {!loadingRandom && randomList.map((p, i) => (
                <button
                  key={`${p.title}-${i}`}
                  onClick={() => pickPoem(p)}
                  className={clsx("w-full text-left p-3 rounded-md border flex flex-col gap-1 hover:scale-[1.01] transition-transform cursor-pointer",
                    current?.title === p.title ? (isDark ? "bg-black/20 border-zinc-700" : "bg-white/80 border-zinc-300") : (isDark ? "bg-black/10 border-zinc-800" : "bg-white/70 border-zinc-200")
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{p.title}</div>
                    <div className="text-xs opacity-60">{p.linecount}</div>
                  </div>
                  <div className="text-xs opacity-60 ">{Array.isArray(p.lines) ? (p.lines[0] || "").slice(0, 80) : ""}</div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* CENTER: poem detail */}
        <section className="lg:col-span-6">
          <PoemView />
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
            <Button variant="outline" className="w-full cursor-pointer" onClick={() => fetchRandomOne()}><RefreshCw /> <span className="ml-2">Random Poem</span></Button>

            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => downloadPoemJson()}><Download /> <span className="ml-2">Download JSON</span></Button>
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => copyPoemJson()}>
                {!copied ? <Copy /> : <Check className="text-emerald-400" />} <span className="ml-2">{copied ? "Copied" : "Copy Poem JSON"}</span>
              </Button>
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => { setShowRaw(s => !s); }}><List /> <span className="ml-2">{showRaw ? "Hide Raw" : "Show Raw"}</span></Button>
            </div>

            <Separator />

         
          </div>

          <Separator />

          <div className="text-xs opacity-60">
            <div className="text-[12px] font-medium mb-2">About</div>
            Poetry data provided by <a className="underline" href="https://poetrydb.org" target="_blank" rel="noreferrer">PoetryDB</a>. No API key required.
          </div>
        </aside>
      </main>

      {/* Dialog (large raw) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl w-full p-3 rounded-2xl overflow-hidden">
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
