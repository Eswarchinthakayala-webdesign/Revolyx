// src/pages/BibleApiPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  BookOpen,
  FileText,
  X,
  Zap,
  ArrowRightCircle,
  Book,
  MapPin,
  Menu,
  Info,
  Layers,
  ChevronDown,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";

/**
 * Bible API Page — improved
 * - Desktop: left sidebar visible
 * - Mobile: hamburger Menu -> Sheet (shadcn UI) with search, quick picks, books, tools
 * - All buttons have cursor-pointer
 * - Middle preview has icons for each heading
 * - ScrollArea used inside sheet for scrollable content
 *
 * Note: file uploaded previously: /mnt/data/NewsApiPage.jsx (see top of assistant message)
 */

const BASE_ENDPOINT = "https://bible-api.com";
const DEFAULT_QUERY = "john 3:16";
const DEFAULT_MSG = "Search for a passage (e.g. 'john 3:16', 'psalm 23', 'romans 8:28')";

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

  // state
  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState(SUGGESTIONS_BASE);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [loading, setLoading] = useState(false);
  const [rawResp, setRawResp] = useState(null);
  const [passage, setPassage] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);

  const suggestTimer = useRef(null);

  const currentEndpoint = useMemo(() => {
    const q = encodeURIComponent((query && query.trim()) || DEFAULT_QUERY);
    return `${BASE_ENDPOINT}/${q}`;
  }, [query]);

  useEffect(() => {
    fetchPassage(DEFAULT_QUERY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const filtered = SUGGESTIONS_BASE.filter(
        (s) =>
          s.includes(qlower) ||
          s.startsWith(qlower) ||
          s.split(" ")[0].startsWith(qlower)
      );
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
      const parsed = {
        reference: json.reference || json?.passage || q,
        text:
          json.text || (json.verses ? json.verses.map((v) => v.text).join(" ") : ""),
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
    setSheetOpen(false); // close sheet on mobile after search
  }

  function chooseSuggestion(s) {
    setQuery(s);
    setShowSuggest(false);
    fetchPassage(s);
    setSheetOpen(false);
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

  function renderVerses(verses) {
    if (!verses || !verses.length) {
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
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-8xl overflow-hidden mx-auto")}>
      {/* Header */}
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
         Scripture — Bible API
          </h1>
          <p className="text-xs md:text-sm opacity-70 mt-1">Search passages, inspect translations, copy or download results.</p>
        </div>

        {/* Desktop search + mobile menu */}
        <div className="flex items-center gap-3">
          {/* Desktop search */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1 border bg-transparent">
            <Search className="opacity-60" />
            <Input
              placeholder="Search passage (e.g. 'john 3:16')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 bg-transparent shadow-none outline-none w-[420px]"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" className="cursor-pointer px-3" variant="outline">Search</Button>
          </form>

          {/* Mobile menu (Sheet) trigger */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button className="cursor-pointer" variant="ghost" aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>

              <SheetContent side="bottom" className="rounded-t-2xl p-0">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Menu className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">Menu</div>
                      <div className="text-xs opacity-60">Quick access</div>
                    </div>
                  </div>

                </div>

                <ScrollArea style={{ height: "60vh" }} className="p-4">
                  {/* Mobile search inside sheet */}
                  <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-4">
                    <Search className="opacity-60" />
                    <Input
                      placeholder="Search passage (mobile)"
                      value={query}
                      onChange={(e) => onQueryChange(e.target.value)}
                      className=" shadow-none mt-2  outline-none"
                      onFocus={() => setShowSuggest(true)}
                    />
                    <Button type="submit" className="cursor-pointer px-3" variant="outline">Go</Button>
                  </form>

                  <div className="mb-4">
                    <div className="text-sm font-semibold mb-2">Quick picks</div>
                    <div className="grid grid-cols-1 gap-2">
                      {SUGGESTIONS_BASE.map((s) => (
                        <button key={s} onClick={() => chooseSuggestion(s)} className="w-full text-left p-3 rounded-md border hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Book className="w-5 h-5 opacity-70" />
                            <div>
                              <div className="font-medium">{s}</div>
                              <div className="text-xs opacity-60">Tap to read</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-semibold mb-2">Books</div>
                    <div className="flex flex-wrap gap-2">
                      {["John","Psalm","Romans","Genesis","Matthew","Proverbs","Philippians","Isaiah"].map((b) => (
                        <button key={b} onClick={() => { setQuery(b.toLowerCase()); setShowSuggest(true); }} className="px-3 py-2 rounded-md border text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50">
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="mt-4">
                    <div className="text-sm font-semibold mb-2">Tools</div>
                    <div className="flex flex-col gap-2">
                      <Button className="cursor-pointer w-full" variant="outline" onClick={() => { navigator.clipboard.writeText(currentEndpoint); showToast("success", "Endpoint copied"); }}><Copy /> Copy Endpoint</Button>
                      <Button className="cursor-pointer w-full" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
                      <Button className="cursor-pointer w-full" variant="outline" onClick={() => setSheetOpen(false)}><X /> Close</Button>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={`${s}-${idx}`} onClick={() => chooseSuggestion(s)} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 opacity-70" />
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

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left sidebar — visible on desktop */}
        <aside className={clsx("hidden lg:block lg:col-span-3 h-fit rounded-2xl p-4 space-y-4", isDark ? "bg-black border border-zinc-700" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Quick picks</div>
              <div className="text-xs opacity-60">Common passages</div>
            </div>
            <div className="text-xs opacity-60">Desktop</div>
          </div>

          <div className="space-y-2">
            {SUGGESTIONS_BASE.map((s) => (
              <button key={s} onClick={() => chooseSuggestion(s)} className="w-full text-left p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 flex items-center gap-3 cursor-pointer" >
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
            <div className="text-xs opacity-60">Popular</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {["John", "Psalm", "Romans", "Genesis", "Matthew", "Proverbs", "Philippians", "Isaiah"].map(b => (
                <button key={b} onClick={() => { setQuery(`${b.toLowerCase()}`); setShowSuggest(true); }} className="text-xs p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border cursor-pointer">
                  {b}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: passage viewer */}
        <section className={clsx("col-span-1 lg:col-span-7 space-y-4 ")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black border-zinc-800" : "bg-white border border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-zinc-900/40 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Passage</CardTitle>
                <div className="text-xs opacity-60">{passage?.reference || "Waiting for a passage..."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => fetchPassage(DEFAULT_QUERY)}><Loader2 className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw(s => !s)}><FileText /> {showRaw ? "Hide Raw" : "Raw"}</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><Layers /> Tools</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !passage ? (
                <div className="py-12 text-center text-sm opacity-60">No passage loaded — try search or a quick pick.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* metadata */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black border-zinc-800" : "bg-white/70 border border-zinc-200")}>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-5 h-5 opacity-80" /><div className="text-xs opacity-60">Reference</div>
                    </div>
                    <div className="font-semibold mb-3">{passage.reference}</div>

                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-5 h-5 opacity-70" /><div className="text-xs opacity-60">Translation</div>
                    </div>
                    <div className="font-medium mb-3">{passage.translation_name}</div>

                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="w-4 h-4 opacity-70" /><div className="text-xs opacity-60">Endpoint</div>
                    </div>
                    <div className="text-sm break-words mb-3"><a className="underline" href={passage.endpoint} target="_blank" rel="noreferrer">{passage.endpoint}</a></div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 opacity-70" /><div className="text-xs opacity-60">Verses</div>
                    </div>
                    <div className="font-medium">{passage.verses.length || (passage.text ? "—" : "—")}</div>
                  </div>

                  {/* main text */}
                  <div className={clsx("p-6 rounded-xl col-span-1 md:col-span-2 border prose max-w-none", isDark ? "bg-zinc-900/10 border-zinc-800" : "bg-white/70 border border-zinc-200")}>
                    <div className="text-xs opacity-60 mb-2">{passage.translation_name} • {passage.reference}</div>

                    <div className="text-lg leading-relaxed mb-4">
                      {renderVerses(passage.verses)}
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm opacity-70">
                      <div className="font-semibold mb-1">About this passage</div>
                      <div>
                        This passage is parsed from the Bible API response and structured for reading. Use the actions to copy, download, or open the original endpoint.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white/60 border border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right quick actions */}
        <aside className={clsx("col-span-1 lg:col-span-2 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black border border-zinc-700" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold">Quick actions</div>
            <div className="text-xs opacity-60">Actions for current passage</div>
          </div>

          <div className="mt-2 space-y-2">
            <Button className="w-full cursor-pointer" variant="outline" onClick={() => { copyJSON(); }}><Copy /> Copy JSON</Button>
            <Button className="w-full cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
            <Button className="w-full cursor-pointer" variant="outline" onClick={() => openOriginal()}><ExternalLink /> Open Endpoint</Button>
            <Button className="w-full cursor-pointer" variant="ghost" onClick={() => setShowRaw(s => !s)}><FileText /> Toggle Raw</Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Tools</div>
            <div className="text-xs opacity-60">Utilities for developers</div>
            <div className="mt-2 text-sm break-words">{passage?.endpoint || currentEndpoint}</div>
            <Button className="w-full cursor-pointer mt-2" variant="ghost" onClick={() => { navigator.clipboard.writeText(passage?.endpoint || currentEndpoint); showToast("success", "Endpoint copied"); }}><Copy /> Copy Endpoint</Button>
          </div>
        </aside>
      </main>

      {/* Tools dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-zinc-900" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Developer Tools</DialogTitle>
          </DialogHeader>

          <div style={{ padding: 20 }}>
            <div className="text-sm opacity-70 mb-3">Utilities for inspecting the current passage.</div>
            <div className="grid grid-cols-1 gap-2">
              <Button className="cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(prettyJSON(passage)); showToast("success", "Passage JSON copied"); }}><Copy /> Copy Passage JSON</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => { if (passage?.endpoint) window.open(passage.endpoint, "_blank"); else showToast("info", "No endpoint"); }}><ExternalLink /> Open endpoint</Button>
            </div>
          </div>

          <DialogFooter className="flex justify-end items-center p-4 border-t">
            <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(false)}><X /> Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
