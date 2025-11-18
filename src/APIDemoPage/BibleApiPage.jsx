// src/pages/BibleApiPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  BookOpen,
   LucideTable as Tool,
  FileText,
  X,
  Zap,
  ArrowRightCircle,
  Book,
  MapPin
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * Bible API Page
 * - Default: john 3:16
 * - Endpoint: https://bible-api.com/{query}
 *
 * Notes:
 * - This component intentionally mirrors the NewsApiPage visual language
 *   while presenting the Bible passage as a professional reader UI.
 */

// Helpers
const BASE_ENDPOINT = "https://bible-api.com";
const DEFAULT_QUERY = "john 3:16";
const DEFAULT_MSG = "Search for a passage (e.g. 'john 3:16', 'psalm 23', 'romans 8:28')";

// small curated suggestion list (common books & sample verses)
const SUGGESTIONS_BASE = [
  "john 3:16",
  "psalm 23",
  "romans 8:28",
  "genesis 1",
  "matthew 5:3-12",
  "psalm 91",
  "proverbs 3:5-6",
  "philippians 4:6-7",
  "isaiah 40:31",
  "john 14:6",
];

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

export default function BibleApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // states
  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState(SUGGESTIONS_BASE);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [loading, setLoading] = useState(false);
  const [rawResp, setRawResp] = useState(null);
  const [passage, setPassage] = useState(null); // parsed content returned from API
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const suggestTimer = useRef(null);

  // derive endpoint for current query
  const currentEndpoint = useMemo(() => {
    const q = encodeURIComponent((query && query.trim()) || DEFAULT_QUERY);
    return `${BASE_ENDPOINT}/${q}`;
  }, [query]);

  // load default passage on mount
  useEffect(() => {
    fetchPassage(DEFAULT_QUERY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // client-side suggestion filtering (fast) + simulated loading state
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    setLoadingSuggest(true);
    suggestTimer.current = setTimeout(() => {
      const qlower = v.toLowerCase().trim();
      if (!qlower) {
        setSuggestions(SUGGESTIONS_BASE);
        setLoadingSuggest(false);
        return;
      }
      const filtered = SUGGESTIONS_BASE.filter((s) => s.includes(qlower) || s.startsWith(qlower) || s.split(" ")[0].startsWith(qlower));
      // add a couple of heuristics: if user typed a book name partially, show common verses of that book
      const enhanced = filtered.length ? filtered : [v];
      setSuggestions(enhanced.slice(0, 12));
      setLoadingSuggest(false);
    }, 220);
  }

  async function fetchPassage(q) {
    if (!q || q.trim().length === 0) {
      showToast("info", DEFAULT_MSG);
      return;
    }
    setLoading(true);
    setShowRaw(false);
    try {
      const endpoint = `${BASE_ENDPOINT}/${encodeURIComponent(q)}`;
      const res = await fetch(endpoint);
      const json = await res.json();
      setRawResp(json);
      // parse the structure returned by bible-api.com
      // Example response format often includes:
      // { "reference": "John 3:16", "verses": [{book_id, chapter, verse, text}], "text": "John 3:16 text...", "translation_id": "web", "translation_name": "World English Bible" }
      const parsed = {
        reference: json.reference || json?.passage || q,
        text: json.text || (json.verses ? json.verses.map(v => v.text).join(" ") : ""),
        verses: Array.isArray(json.verses) ? json.verses : [],
        translation_id: json.translation_id || json.translation || json.translation_name || "unspecified",
        translation_name: json.translation_name || json.translation || "Unknown translation",
        raw: json,
        endpoint,
      };
      setPassage(parsed);
      showToast("success", `Loaded: ${parsed.reference}`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch passage");
      setPassage(null);
      setRawResp(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", DEFAULT_MSG);
      return;
    }
    await fetchPassage(query);
    setShowSuggest(false);
  }

  function chooseSuggestion(s) {
    setQuery(s);
    setShowSuggest(false);
    fetchPassage(s);
  }

  function copyJSON() {
    if (!rawResp) return showToast("info", "Nothing to copy");
    navigator.clipboard.writeText(prettyJSON(rawResp));
    showToast("success", "JSON copied to clipboard");
  }

  function downloadJSON() {
    if (!rawResp && !passage) {
      showToast("info", "Nothing to download");
      return;
    }
    const payload = rawResp || passage;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const name = `bible_${(passage?.reference || query || "passage").replace(/\s+/g, "_")}.json`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function openOriginal() {
    if (!passage?.endpoint) return showToast("info", "No endpoint");
    window.open(passage.endpoint, "_blank", "noopener");
  }

  // simple formatted verse display: number + text, preserve spacing/newlines
  function renderVerses(verses) {
    if (!verses || !verses.length) {
      // fallback: if we have text, show it split by newline / double newlines
      if (passage?.text) {
        return passage.text.split(/\n\n|\n/).map((p, i) => (
          <p key={i} className="mb-3 leading-relaxed text-lg">{p}</p>
        ));
      }
      return <div className="text-sm opacity-60">No verse content available.</div>;
    }
    return verses.map((v) => (
      <div key={`${v.book_id}-${v.chapter}-${v.verse}`} className="mb-3">
        <span className="inline-block w-8 text-right mr-3 text-sm opacity-60 select-none">{v.verse}</span>
        <span className="leading-relaxed text-lg">{v.text}</span>
      </div>
    ));
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Scripture — Bible API</h1>
          <p className="mt-1 text-sm opacity-70">Search passages, inspect translation metadata, and copy/ download JSON.</p>
        </div>

        {/* search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search passage (e.g. 'john 3:16', 'psalm 23', 'matthew 5')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => fetchPassage(DEFAULT_QUERY)}>Default</Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions floating dropdown (anchored) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={`${s}-${idx}`} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <Book className="w-5 h-5 opacity-70" />
                  <div className="flex-1">
                    <div className="font-medium">{s}</div>
                    <div className="text-xs opacity-60">Quick pick</div>
                  </div>
                  <div className="text-xs opacity-60">Tap to open</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout: left (suggestion list), center (passage), right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: curated picks & books */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Quick picks</div>
            <div className="text-xs opacity-60">Common passages</div>
          </div>

          <div className="space-y-2">
            {SUGGESTIONS_BASE.map((s) => (
              <button key={s} onClick={() => chooseSuggestion(s)} className={clsx("w-full text-left p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 flex items-center gap-3", isDark ? "bg-black/20 border border-zinc-800" : "bg-white/70 border border-zinc-200")}>
                <BookOpen className="w-4 h-4 opacity-80" />
                <div className="flex-1">
                  <div className="font-medium">{s}</div>
                  <div className="text-xs opacity-60">Tap to read</div>
                </div>
                <ArrowRightCircle className="w-4 h-4 opacity-60" />
              </button>
            ))}
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Books</div>
            <div className="text-xs opacity-60">Popular books</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {["John", "Psalm", "Romans", "Genesis", "Matthew", "Proverbs", "Philippians", "Isaiah"].map(b => (
                <button key={b} onClick={() => { setQuery(`${b.toLowerCase()}`); setShowSuggest(true); }} className="text-xs p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border">
                  {b}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: passage viewer */}
        <section className="lg:col-span-7 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Passage</CardTitle>
                <div className="text-xs opacity-60">{passage?.reference || "Waiting for a passage..."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => fetchPassage(DEFAULT_QUERY)}><Loader2 className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw(s => !s)}><FileText /> {showRaw ? "Hide Raw" : "Raw"}</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><Tool /> Tools</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !passage ? (
                <div className="py-12 text-center text-sm opacity-60">No passage loaded — try search or a quick pick.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left column inside center card: metadata */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-xs opacity-60">Reference</div>
                    <div className="font-semibold mb-3">{passage.reference}</div>

                    <div className="text-xs opacity-60">Translation</div>
                    <div className="font-medium mb-3">{passage.translation_name}</div>

                    <div className="text-xs opacity-60">Endpoint</div>
                    <div className="text-sm break-words mb-3">
                      <a href={passage.endpoint} target="_blank" rel="noreferrer" className="underline">{passage.endpoint}</a>
                    </div>

                    <div className="text-xs opacity-60">Verses</div>
                    <div className="text-sm font-medium">{passage.verses.length || (passage.text ? "—" : "—")}</div>
                  </div>

                  {/* Center: big readable text */}
                  <div className={clsx("p-6 rounded-xl col-span-1 md:col-span-2 border prose max-w-none", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-xs opacity-60 mb-2">{passage.translation_name} • {passage.reference}</div>
                    <div className="text-lg leading-relaxed mb-4">
                      {renderVerses(passage.verses)}
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm opacity-70">
                      <div className="font-semibold mb-1">About this passage</div>
                      <div className="text-sm">
                        This view is parsed from the Bible API response and structured for reading. Use the quick actions to copy, download, or open the original endpoint.
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

        {/* Right: quick actions */}
        <aside className={clsx("lg:col-span-2 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="text-sm font-semibold">Quick actions</div>
          <div className="text-xs opacity-60">Actions for the current passage</div>

          <div className="mt-2 space-y-2">
            <Button className="w-full" variant="outline" onClick={() => { copyJSON(); }}><Copy /> Copy JSON</Button>
            <Button className="w-full" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
            <Button className="w-full" variant="outline" onClick={() => openOriginal()}><ExternalLink /> Open Endpoint</Button>
            <Button className="w-full" variant="ghost" onClick={() => setShowRaw(s => !s)}><FileText /> Toggle Raw</Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Tools</div>
            <div className="text-xs opacity-60">Utilities for developers</div>
            <div className="mt-2 space-y-2">
              <div className="text-xs opacity-60">Endpoint</div>
              <div className="text-sm break-words mb-2">{passage?.endpoint || currentEndpoint}</div>
              <Button className="w-full" variant="ghost" onClick={() => { navigator.clipboard.writeText(passage?.endpoint || currentEndpoint); showToast("success", "Endpoint copied"); }}><Copy /> Copy Endpoint</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Tools dialog (example) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Developer Tools</DialogTitle>
          </DialogHeader>

          <div style={{ padding: 20 }}>
            <div className="text-sm opacity-70 mb-3">Small utilities for inspecting and working with the current passage.</div>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(prettyJSON(passage)); showToast("success", "Passage JSON copied"); }}><Copy /> Copy Passage JSON</Button>
              <Button variant="outline" onClick={() => { if (passage?.endpoint) window.open(passage.endpoint, "_blank"); else showToast("info", "No endpoint"); }}><ExternalLink /> Open endpoint</Button>
            </div>
          </div>

          <DialogFooter className="flex justify-end items-center p-4 border-t">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /> Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
