// src/pages/GitaTeluguPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  X,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  ImageIcon,
  List,
  BookOpen,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { useTheme } from "@/components/theme-provider";

/**
 * Gita (Telugu/Odia) Reader Page — improved & responsive
 *
 * Uses proxy base: /gita/{lang}/verse/{chapter}/{verse}
 * Language keys: 'tel' (Telugu), 'odi' (Odia)
 *
 * - Default verse: 1/1
 * - Prefetch a curated set of popular verses for suggestions
 * - Language switching updates endpoints and prefetched suggestions
 * - Dialog content scrolls to avoid page overflow
 */

const PROXY_BASE = "/gita"; // Vite proxy: /gita -> https://gita-api.vercel.app
const DEFAULT_MSG = "Search by chapter/verse (e.g. 2 47 or 2/47) or type to filter suggestions.";

const LANGUAGES = [
  { key: "tel", label: "Telugu" },
  { key: "odi", label: "Odia" },
];

const POPULAR_VERSES = [
  { ch: 1, v: 1 },
  { ch: 2, v: 47 },
  { ch: 4, v: 7 },
  { ch: 18, v: 66 },
  { ch: 3, v: 19 },
  { ch: 12, v: 15 },
];

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export default function GitaTeluguPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [language, setLanguage] = useState("tel"); // tel = Telugu, odi = Odia
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // preloaded popular verses per language
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentVerse, setCurrentVerse] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingVerse, setLoadingVerse] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const suggestTimer = useRef(null);
  const formRef = useRef(null);

  /* Build endpoint base for current language */
  const endpointForLang = useMemo(() => `${PROXY_BASE}/${language}/verse`, [language]);

  /* Fetch a single verse */
  async function fetchVerse(chapter, verse, { silent } = {}) {
    setLoadingVerse(true);
    try {
      const url = `${endpointForLang}/${chapter}/${verse}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (!silent) showToast("error", `Fetch failed (${res.status})`);
        setLoadingVerse(false);
        return;
      }
      const json = await res.json();

      setRawResp(json);
      // Normalize fields for UI
      const normalized = {
        chapter: json.chapter ?? chapter,
        verse: json.verse ?? verse,
        text: json.text || json.line || json.telugu || json.verseText || json.content || "",
        transliteration: json.transliteration || json.trans || "",
        meaning: json.meaning || json.explanation || json.translation || json.mean || "",
        source: "gita-api.vercel.app",
        raw: json,
      };
      setCurrentVerse(normalized);
      if (!silent) showToast("success", `Loaded: Chapter ${normalized.chapter} • Verse ${normalized.verse}`);
    } catch (err) {
      console.error(err);
      if (!silent) showToast("error", "Failed to fetch verse");
    } finally {
      setLoadingVerse(false);
    }
  }

  /* Prefetch curated popular verses for suggestions (for the selected language) */
  async function prefetchPopular() {
    setLoadingSuggest(true);
    try {
      const promises = POPULAR_VERSES.map(async (p) => {
        try {
          const res = await fetch(`${endpointForLang}/${p.ch}/${p.v}`);
          if (!res.ok) return null;
          const json = await res.json();
          return {
            key: `${p.ch}/${p.v}`,
            chapter: p.ch,
            verse: p.v,
            text: json.text || json.line || json.telugu || json.verseText || json.content || "",
            meaning: json.meaning || json.translation || json.mean || "",
            raw: json,
          };
        } catch {
          return null;
        }
      });
      const results = (await Promise.all(promises)).filter(Boolean);
      setSuggestions(results);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  /* Parse "2 47", "2/47", "ch 2 v 47" => {ch, v} */
  function parseChapterVerse(q) {
    if (!q) return null;
    const trimmed = q.trim();
    const nums = trimmed.match(/\d+/g);
    if (nums && nums.length >= 2) {
      const [ch, v] = nums;
      return { ch: Number(ch), v: Number(v) };
    }
    return null;
  }

  /* Query change handler with debounce and small client-side filtering */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const parsed = parseChapterVerse(v);
      if (parsed) {
        // fetch directly
        fetchVerse(parsed.ch, parsed.v);
        setShowSuggest(false);
        return;
      }
      // filter current suggestions client-side
      setLoadingSuggest(true);
      const lowered = v.trim().toLowerCase();
      setTimeout(() => {
        if (!lowered) {
          // restore original suggestions (prefetched)
          prefetchPopular();
        } else {
          setSuggestions((prev) => {
            const filtered = prev.filter(
              (it) =>
                (it.text && it.text.toLowerCase().includes(lowered)) ||
                (it.meaning && it.meaning.toLowerCase().includes(lowered)) ||
                `${it.chapter}/${it.verse}`.includes(lowered)
            );
            return filtered.length ? filtered : prev;
          });
        }
        setLoadingSuggest(false);
      }, 180);
    }, 220);
  }

  /* On search submit: tries to parse numeric chapter/verse, else looks up prefetch suggestions */
  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    const parsed = parseChapterVerse(query);
    if (parsed) {
      fetchVerse(parsed.ch, parsed.v);
      setShowSuggest(false);
      return;
    }
    if (!query || query.trim().length === 0) {
      showToast("info", DEFAULT_MSG);
      return;
    }
    const lowered = query.trim().toLowerCase();
    const match = suggestions.find(
      (s) =>
        (s.text && s.text.toLowerCase().includes(lowered)) ||
        (s.meaning && s.meaning.toLowerCase().includes(lowered)) ||
        `${s.chapter}/${s.verse}`.includes(lowered)
    );
    if (match) {
      setCurrentVerse({
        chapter: match.chapter,
        verse: match.verse,
        text: match.text,
        meaning: match.meaning,
        source: "prefetch",
        raw: match.raw,
      });
      setRawResp(match.raw);
      showToast("success", `Found: ${match.chapter}/${match.verse}`);
      setShowSuggest(false);
      return;
    }
    showToast("info", "No match in suggestions — try a chapter/verse like `2 47`");
  }

  /* Copy JSON to clipboard */
  function copyCurrentJSON() {
    if (!currentVerse) return showToast("info", "No verse to copy");
    navigator.clipboard.writeText(prettyJSON(rawResp || currentVerse));
    showToast("success", "Verse JSON copied");
  }

  /* Download JSON */
  function downloadCurrent() {
    if (!rawResp && !currentVerse) {
      showToast("info", "No verse to download");
      return;
    }
    const payload = rawResp || currentVerse;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gita_ch${currentVerse?.chapter || "?"}_v${currentVerse?.verse || "?"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* When language changes, re-prefetch suggestions and fetch default verse */
  useEffect(() => {
    prefetchPopular();
    fetchVerse(1, 1, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  /* Initial load */
  useEffect(() => {
    prefetchPopular();
    fetchVerse(1, 1, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* UI palettes */
  const headerBg = clsx(isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200");
  const surface = clsx(isDark ? "bg-black/30 border-zinc-800" : "bg-white/70 border-zinc-200");
  const pageBg = clsx("min-h-screen p-6 max-w-8xl mx-auto");

  return (
    <div className={pageBg}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold tracking-tight")}>Gita — Reader</h1>
          <p className="mt-1 text-sm opacity-70">Read Bhagavad Gita verses in Telugu or Odia. Search by chapter/verse or filter suggestions.</p>
        </div>

        {/* Controls: language select + search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Select value={language} onValueChange={(val) => setLanguage(val)} className="w-36">
              <SelectTrigger className={clsx(isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.key} value={l.key}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <form ref={formRef} onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search chapter/verse (e.g. 2 47) or type to filter suggestions..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              aria-label="Search chapter/verse"
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => { fetchVerse(1, 1); setShowSuggest(false); }}>
              Default
            </Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown anchored below search */}
      <AnimatePresence>
        {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("relative")}
          >
            <div className={clsx("absolute left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl z-40", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
              {loadingSuggest && <div className="p-3 text-sm opacity-60">Loading suggestions…</div>}
              {!loadingSuggest && suggestions.length === 0 && <div className="p-3 text-sm opacity-60">No suggestions — try typing or use chapter/verse.</div>}
              {!loadingSuggest && suggestions.length > 0 && (
                <ScrollArea style={{ maxHeight: 320 }}>
                  <ul>
                    {suggestions.map((s) => (
                      <li
                        key={s.key}
                        className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                        onClick={() => {
                          setCurrentVerse({
                            chapter: s.chapter,
                            verse: s.verse,
                            text: s.text,
                            meaning: s.meaning,
                            raw: s.raw,
                          });
                          setRawResp(s.raw);
                          setShowSuggest(false);
                          setQuery("");
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">Chapter {s.chapter} • Verse {s.verse}</div>
                            <div className="text-xs opacity-60 truncate">{(s.text || s.meaning || "—").slice(0, 120)}</div>
                          </div>
                          <div className="text-xs opacity-60">#{s.chapter}/{s.verse}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout: left meta, center reading, right quick actions */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: meta / quick links */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border shadow-sm", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", headerBg)}>
              <div>
                <CardTitle className="text-lg">Verse</CardTitle>
                <div className="text-xs opacity-60">{currentVerse ? `Chapter ${currentVerse.chapter} • Verse ${currentVerse.verse}` : "No verse loaded"}</div>
              </div>
              <div className="text-xs opacity-60">{language === "tel" ? "Telugu" : "Odia"}</div>
            </CardHeader>

            <CardContent className={clsx("p-4", surface)}>
              <div className="rounded-md overflow-hidden mb-3">
                <div className={clsx("h-40 w-full flex items-center justify-center text-3xl md:text-4xl font-semibold", isDark ? "bg-black/20" : "bg-white/70")}>
                  భగవద్గీత
                </div>
              </div>

              <div className="text-sm opacity-70 mb-2">Source</div>
              <div className="text-sm font-medium mb-3">gita-api.vercel.app</div>

              <Separator />

              <div className="mt-3">
                <div className="text-xs opacity-60">Transliteration</div>
                <div className="text-sm font-medium">{currentVerse?.transliteration || "—"}</div>
              </div>

              <div className="mt-3">
                <div className="text-xs opacity-60">Quick reference</div>
                <div className="text-sm opacity-80">Chapter {currentVerse?.chapter ?? "—"} • Verse {currentVerse?.verse ?? "—"}</div>
              </div>
            </CardContent>
          </Card>

          {/* Popular verses quick list */}
          <Card className={clsx("rounded-2xl overflow-hidden border p-4 shadow-sm", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="text-sm font-semibold mb-2">Popular Verses</div>
            <div className="grid grid-cols-1 gap-2">
              {POPULAR_VERSES.map((p) => (
                <Button key={`${p.ch}-${p.v}`} variant="ghost" className="justify-start" onClick={() => fetchVerse(p.ch, p.v)}>
                  <BookOpen className="mr-2" /> {p.ch}/{p.v}
                </Button>
              ))}
            </div>
          </Card>
        </aside>

        {/* Center: main reading area */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border shadow-sm", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", headerBg)}>
              <div>
                <CardTitle className="text-lg tracking-tight">Reading</CardTitle>
                <div className="text-xs opacity-60">{currentVerse ? `Chapter ${currentVerse.chapter} • Verse ${currentVerse.verse}` : "Awaiting verse..."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => currentVerse && setShowRaw((s) => !s)}><List /> {showRaw ? "Hide Raw" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> View</Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingVerse ? (
                <div className="py-16 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentVerse ? (
                <div className="py-12 text-center text-sm opacity-60">No verse yet — try the default or search a chapter/verse.</div>
              ) : (
                <div className="space-y-6">
                  <div className="max-w-none">
                    <h2 className="text-2xl md:text-3xl font-bold">Chapter {currentVerse.chapter} • Verse {currentVerse.verse}</h2>
                    <p className="text-2xl md:text-3xl leading-relaxed mt-2">{currentVerse.text || "—"}</p>
                  </div>

                  <div>
                    <div className="text-sm font-semibold mb-2">Translation / Meaning</div>
                    <div className="text-sm leading-relaxed">{currentVerse.meaning || "No translation available."}</div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-semibold mb-2">Fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Chapter</div>
                        <div className="text-sm font-medium">{currentVerse.chapter}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Verse</div>
                        <div className="text-sm font-medium">{currentVerse.verse}</div>
                      </div>
                      <div className="p-3 rounded-md border col-span-1 sm:col-span-2">
                        <div className="text-xs opacity-60">Source / Raw</div>
                        <div className="text-sm font-medium break-words">{currentVerse.raw ? "API payload available" : "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <ScrollArea style={{ maxHeight: 300 }}>
                    <pre className={clsx("text-xs", isDark ? "text-zinc-200" : "text-zinc-900")}>
                      {prettyJSON(rawResp)}
                    </pre>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: quick actions */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4 shadow-sm", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Quick Actions</div>
                <div className="text-xs opacity-60">Utilities for the current verse</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => { if (currentVerse) window.open(`${endpointForLang}/${currentVerse.chapter}/${currentVerse.verse}`, "_blank"); else showToast("info", "No verse"); }}>
                <ExternalLink className="mr-2" /> Open API
              </Button>
              <Button variant="outline" onClick={() => copyCurrentJSON()}>
                <Copy className="mr-2" /> Copy JSON
              </Button>
              <Button variant="outline" onClick={() => downloadCurrent()}>
                <Download className="mr-2" /> Download JSON
              </Button>
              <Button variant="outline" onClick={() => setShowRaw((s) => !s)}>
                <FileText className="mr-2" /> Toggle Raw
              </Button>
              <Button variant="ghost" onClick={() => { setQuery(""); setShowSuggest(false); showToast("info", "Query cleared"); }}>
                <X className="mr-2" /> Clear
              </Button>
            </div>

            <Separator className="my-3" />

            <div className="text-xs opacity-60">API Endpoint</div>
            <div className="text-sm break-all mt-1">{endpointForLang}/{"{chapter}"}/{"{verse}"}</div>
          </Card>
        </aside>
      </main>

      {/* Dialog: big view — content scrolls inside dialog to avoid page overflow */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{currentVerse ? `Chapter ${currentVerse.chapter} • Verse ${currentVerse.verse}` : "Verse"}</DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <ScrollArea style={{ maxHeight: "65vh" }}>
              {currentVerse ? (
                <div className="max-w-[900px]">
                  <h2 className="text-2xl font-semibold mb-4">Chapter {currentVerse.chapter} • Verse {currentVerse.verse}</h2>
                  <div className="text-lg md:text-xl leading-relaxed mb-4 whitespace-pre-wrap">{currentVerse.text}</div>
                  <div className="text-sm opacity-70">{currentVerse.meaning}</div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center">No verse</div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Data from gita-api.vercel.app</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (currentVerse) window.open(`${endpointForLang}/${currentVerse.chapter}/${currentVerse.verse}`, "_blank"); }}>
                <ExternalLink />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
