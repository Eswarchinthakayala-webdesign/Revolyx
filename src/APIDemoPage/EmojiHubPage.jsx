// EmojiHubPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  List,
  Download,
  Loader2,
  Smile,
  Tag,
  Grid,
  Zap,
  Menu,
  RefreshCw,
  Check,
  Code,
  FileText,
  Layers,
  Clock,
  ArrowRightCircle,
  Tag as TagIcon,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

/** constants */
const ENDPOINT = "https://emojihub.yurace.pro/api/all";
const DEFAULT_HINT = "Try searching 'smile', 'animal', 'food', 'cat'...";

/** safe stringify */
function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

/** pick N random unique items from array */
function pickRandom(arr = [], n = 10) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const out = [];
  const used = new Set();
  const max = Math.min(n, arr.length);
  while (out.length < max) {
    const idx = Math.floor(Math.random() * arr.length);
    if (!used.has(idx)) {
      used.add(idx);
      out.push(arr[idx]);
    }
  }
  return out;
}

/** small util to render visual emoji */
function EmojiVisual({ item, large = false }) {
  if (!item) return null;
  const size = large ? (item.unicode ? 96 : 80) : (item.unicode ? 40 : 32);
  if (item.unicode && typeof item.unicode === "string" && item.unicode.trim()) {
    return <div style={{ fontSize: size, lineHeight: 1 }} aria-hidden>{item.unicode}</div>;
  }
  if (Array.isArray(item.htmlCode) && item.htmlCode.length > 0) {
    return <div style={{ fontSize: size }} dangerouslySetInnerHTML={{ __html: item.htmlCode[0] }} />;
  }
  return <div style={{ fontSize: size }}><Smile /></div>;
}

export default function EmojiHubPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // data
  const [allEmojis, setAllEmojis] = useState(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState(null);

  // sheet (mobile sidebar)
  const [sheetOpen, setSheetOpen] = useState(false);

  // sidebar items
  const [sidebarEmojis, setSidebarEmojis] = useState([]);

  // search / suggestions
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestTimer = useRef(null);

  // selected emoji + raw toggle + image preview dialog
  const [selected, setSelected] = useState(null);
  const [rawVisible, setRawVisible] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  // copy button states
  const [copyEmojiStatus, setCopyEmojiStatus] = useState("idle"); // 'idle' | 'loading' | 'copied'
  const [copyJsonStatus, setCopyJsonStatus] = useState("idle");

  // fetch all emojis once
  useEffect(() => {
    let alive = true;
    async function fetchAll() {
      setLoadingAll(true);
      setError(null);
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("Unexpected response shape");
        if (!alive) return;
        setAllEmojis(json);
        setSelected(json[0] ?? null);
        setSidebarEmojis(pickRandom(json, 10));
      } catch (err) {
        console.error("EmojiHub fetch error:", err);
        setError(String(err.message || err));
      } finally {
        setLoadingAll(false);
      }
    }
    fetchAll();
    return () => { alive = false; if (suggestTimer.current) clearTimeout(suggestTimer.current); };
  }, []);

  // filter suggestions locally (fast)
  function filterSuggestions(q) {
    if (!allEmojis) return [];
    const normalized = q.trim().toLowerCase();
    if (!normalized) return [];
    const results = [];
    for (let i = 0; i < allEmojis.length && results.length < 12; i++) {
      const e = allEmojis[i];
      if (
        (e.name && e.name.toLowerCase().includes(normalized)) ||
        (e.category && e.category.toLowerCase().includes(normalized)) ||
        (e.group && e.group.toLowerCase().includes(normalized)) ||
        (e.htmlCode && JSON.stringify(e.htmlCode).toLowerCase().includes(normalized))
      ) {
        results.push(e);
      }
    }
    return results;
  }

  // debounce local suggest filter
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    setLoadingSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const s = filterSuggestions(v);
      setSuggestions(s);
      setLoadingSuggest(false);
    }, 180);
  }

  function onSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim() === "") {
      showToast("info", DEFAULT_HINT);
      return;
    }
    const s = filterSuggestions(query);
    if (s.length > 0) {
      setSelected(s[0]);
      setShowSuggest(false);
      showToast("success", `Showing: ${s[0].name}`);
      setSheetOpen(false);
    } else {
      showToast("info", "No emoji matched your search");
    }
  }

  function pickSuggestion(item) {
    setSelected(item);
    setShowSuggest(false);
    setQuery(item.name || "");
    setSheetOpen(false);
  }

  function refreshSidebar() {
    setSidebarEmojis(prev => pickRandom(allEmojis || [], 10));
    showToast("success", "Refreshed emoji sidebar");
  }

  // copy / download actions w/ animation state
  async function handleCopyEmoji() {
    if (!selected) return showToast("info", "No emoji selected");
    try {
      setCopyEmojiStatus("loading");
      const char = selected.unicode || (selected.htmlCode && selected.htmlCode[0]) || selected.name;
      await navigator.clipboard.writeText(char);
      setCopyEmojiStatus("copied");
      showToast("success", "Emoji copied");
      // reset after animation
      setTimeout(() => setCopyEmojiStatus("idle"), 1500);
    } catch (err) {
      console.error(err);
      setCopyEmojiStatus("idle");
      showToast("error", "Failed to copy");
    }
  }

  async function handleCopyJSON() {
    if (!selected) return showToast("info", "No emoji selected");
    try {
      setCopyJsonStatus("loading");
      await navigator.clipboard.writeText(prettyJSON(selected));
      setCopyJsonStatus("copied");
      showToast("success", "JSON copied");
      setTimeout(() => setCopyJsonStatus("idle"), 1500);
    } catch (err) {
      console.error(err);
      setCopyJsonStatus("idle");
      showToast("error", "Failed to copy");
    }
  }

  function downloadSelectedJSON() {
    const payload = selected || allEmojis || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `emoji_${(selected?.name || "list").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  const detailKeys = useMemo(() => {
    if (!selected) return [];
    return Object.keys(selected);
  }, [selected]);

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 max-w-8xl mx-auto transition-colors", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu / sheet trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 md:hidden cursor-pointer" aria-label="Open emoji list">
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className={clsx("w-full max-w-xs p-0")}>
              <SheetHeader className="p-4">
                <SheetTitle className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Grid />
                    <div className="font-semibold">Emojis</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="cursor-pointer" onClick={refreshSidebar}><RefreshCw /></Button>
                    <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => setSheetOpen(false)}>Close</Button>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="p-2">
                <ScrollArea style={{ height: "calc(100vh - 110px)" }}>
                  <div className="space-y-2">
                    {sidebarEmojis.map((e, idx) => (
                      <button
                        key={`${e?.name}-${idx}`}
                        onClick={() => { pickSuggestion(e); setSheetOpen(false); }}
                        className="w-full text-left p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/40 flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-10 h-10 flex items-center justify-center text-2xl">
                          <EmojiVisual item={e} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{e.name}</div>
                          <div className="text-xs opacity-60">{e.category} • {e.group}</div>
                        </div>
                        <div className="text-xs opacity-60">{e.unicode ?? (Array.isArray(e.htmlCode) ? e.htmlCode[0] : "")}</div>
                      </button>
                    ))}
                    {(!sidebarEmojis || sidebarEmojis.length === 0) && (
                      <div className="p-4 text-sm opacity-60">No sidebar emojis yet. Try refresh.</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight flex items-center gap-3">
              <span className="hidden md:inline-flex items-center justify-center rounded-full p-2 bg-zinc-100/60 dark:bg-zinc-900/40"><Smile /></span>
              EmojiHub
            </h1>
            <p className="text-xs opacity-70 -mt-1">Browse categories · preview · copy metadata</p>
          </div>
        </div>

        {/* Search (desktop) */}
        <div className="hidden md:flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={onSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder={DEFAULT_HINT}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              aria-label="Search emojis"
            />
            <Button type="submit" variant="outline" className="px-3 cursor-pointer" aria-label="Search"><Search /></Button>
            <Button variant="ghost" className="px-3 cursor-pointer" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); }} title="Clear">Clear</Button>
          </form>
        </div>

        {/* Mobile search (condensed) */}
        <div className="md:hidden flex items-center gap-2">
          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <Input
              placeholder="Search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-44"
            />
            <Button type="submit" variant="outline" className="px-3 cursor-pointer" aria-label="Search small"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions (desktop floating) */}
      <AnimatePresence>
        {showSuggest && suggestions && suggestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto z-50 max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            <ScrollArea className="overflow-y-auto" style={{ maxHeight: 320 }}>
              <ul>
                {loadingSuggest && <li className="p-3 text-sm opacity-60 flex items-center gap-2"><Loader2 className="animate-spin" /> Searching…</li>}
                {suggestions.map((s, i) => (
                  <li key={s.name + i} onClick={() => pickSuggestion(s)} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md flex items-center justify-center">
                        <EmojiVisual item={s} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs opacity-60">{s.category} • {s.group}</div>
                      </div>
                      <div className="text-xs opacity-60">{s.unicode || (Array.isArray(s.htmlCode) ? s.htmlCode[0] : "")}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Sidebar (desktop) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid />
                <div className="text-sm font-semibold">Quick Emojis</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="p-2 cursor-pointer" onClick={refreshSidebar}><RefreshCw /></Button>
                <Button variant="ghost" className="p-2 cursor-pointer" onClick={() => setSidebarEmojis(prev => pickRandom(allEmojis || [], 10))}>Random</Button>
              </div>
            </CardHeader>

            <CardContent>
              <ScrollArea style={{ height: 420 }}>
                <div className="space-y-2">
                  {sidebarEmojis.map((e, idx) => (
                    <button key={`${e?.name}-${idx}`} onClick={() => pickSuggestion(e)} className="w-full text-left p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/40 flex items-center gap-3 cursor-pointer">
                      <div className="w-12 h-12 flex items-center justify-center text-2xl"><EmojiVisual item={e} /></div>
                      <div className="flex-1">
                        <div className="font-medium">{e.name}</div>
                        <div className="text-xs opacity-60">{e.category}</div>
                      </div>
                      <div className="text-xs opacity-60">{e.unicode ?? (Array.isArray(e.htmlCode) ? e.htmlCode[0] : "")}</div>
                    </button>
                  ))}
                  {(!sidebarEmojis || sidebarEmojis.length === 0) && (
                    <div className="p-4 text-sm opacity-60">No quick emojis yet. Try refresh.</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* Center: Preview & details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-6 flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Smile /> Preview & Usage
                </CardTitle>
                <div className="text-xs opacity-60 mt-1 flex items-center gap-2">
                  <TagIcon /> <span>Complete metadata for designers & devs</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setRawVisible(v => !v)} className="cursor-pointer" aria-pressed={rawVisible}>
                  <List />
                </Button>
                <Button variant="ghost" onClick={() => setImageOpen(true)} className="cursor-pointer" disabled={!selected}>
                  <ImageIcon />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingAll ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selected ? (
                <div className="py-12 text-center text-sm opacity-60">Select an emoji to view details here.</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="w-full md:w-44 h-44 rounded-xl flex items-center justify-center border bg-transparent">
                      <EmojiVisual item={selected} large />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start flex-wrap justify-between gap-4">
                        <div>
                          <div className="text-2xl font-extrabold">{selected.name}</div>
                          <div className="text-xs opacity-60 mt-1 flex items-center gap-2"><Layers className="h-4 w-4" /> {selected.category} • {selected.group}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Animated copy button */}
                          <motion.button
                            onClick={handleCopyEmoji}
                            className={clsx("inline-flex items-center gap-2 px-3 py-2 rounded-md shadow-sm", copyEmojiStatus === "copied" ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-900")}
                            whileTap={{ scale: 0.96 }}
                          >
                            <AnimatePresence mode="wait">
                              {copyEmojiStatus === "loading" ? (
                                <motion.span key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                  <Loader2 className="animate-spin" />
                                </motion.span>
                              ) : copyEmojiStatus === "copied" ? (
                                <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ opacity: 0 }}>
                                  <Check />
                                </motion.span>
                              ) : (
                                <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                  <Copy />
                                </motion.span>
                              )}
                            </AnimatePresence>
                            <span className="text-sm">{copyEmojiStatus === "copied" ? "Copied" : copyEmojiStatus === "loading" ? "Copying…" : "Copy"}</span>
                          </motion.button>

                          <Button variant="outline" onClick={() => { downloadSelectedJSON(); }} className="cursor-pointer flex items-center gap-2">
                            <Download /> <span className="text-sm">Download</span>
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 text-sm opacity-80">
                        <div><span className="font-medium">Unicode:</span> <span className="ml-2">{selected.unicode || "—"}</span></div>
                        <div className="mt-1"><span className="font-medium">HTML code:</span> <span className="ml-2">{Array.isArray(selected.htmlCode) ? selected.htmlCode.join(", ") : "—"}</span></div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {selected.keywords && selected.keywords.length > 0
                          ? selected.keywords.map((k, idx) => <span key={idx} className="text-xs px-2 py-1 rounded-md bg-zinc-100/50 cursor-default">{k}</span>)
                          : <span className="text-xs opacity-50">No tags</span>}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg p-3 border">
                      <div className="flex items-center gap-2 text-sm font-medium"><Code /> HTML</div>
                      <div className="mt-2 font-mono text-sm break-all">{Array.isArray(selected.htmlCode) ? selected.htmlCode[0] : "<!-- no html -->"}</div>
                    </div>

                    <div className="rounded-lg p-3 border">
                      <div className="flex items-center gap-2 text-sm font-medium"><FileText /> JS / React</div>
                      <div className="mt-2 font-mono text-sm">{"const emoji = "}{selected.unicode ? `"${selected.unicode}"` : `"${selected.name}"`}</div>
                    </div>

                    <div className="rounded-lg p-3 border md:col-span-2">
                      <div className="flex items-center gap-2 text-sm font-medium"><ArrowRightCircle /> Example usage</div>
                      <div className="mt-2 text-sm space-y-2">
                        <div className="bg-zinc-100/40 p-3 rounded font-mono text-sm">
                          <div>{Array.isArray(selected.htmlCode) ? selected.htmlCode[0] : selected.unicode}</div>
                          <div className="text-xs opacity-60 mt-1">// In React: {'<span aria-label="' + (selected.name || "") + '">' + (selected.unicode || selected.name) + '</span>'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {rawVisible && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="rounded-xl p-3 border">
                        <div className="flex items-center justify-between">
                          <div className="text-xs opacity-60">Raw object</div>
                          <div className="text-xs opacity-60">Fields: {detailKeys.length}</div>
                        </div>
                        <pre className="text-xs overflow-auto mt-2" style={{ maxHeight: 260 }}>{prettyJSON(selected)}</pre>
                        <div className="mt-2 flex gap-2">
                          <Button variant="ghost" size="sm" onClick={handleCopyJSON} className="cursor-pointer">
                            {copyJsonStatus === "copied" ? <Check className="mr-2" /> : <FileText className="mr-2" />}
                            {copyJsonStatus === "loading" ? "Copying…" : copyJsonStatus === "copied" ? "Copied" : "Copy JSON"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={downloadSelectedJSON} className="cursor-pointer"><Download className="mr-2" /> Download JSON</Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: Quick actions & dataset info */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/30 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold flex items-center gap-2"><Zap /> Quick actions</div>
              <div className="text-xs opacity-60">Developer</div>
            </div>

            <div className="mt-3 space-y-2">
              <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={handleCopyEmoji}>
                {copyEmojiStatus === "copied" ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                {copyEmojiStatus === "loading" ? "Copying…" : copyEmojiStatus === "copied" ? "Copied" : "Copy emoji"}
              </Button>

              <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={handleCopyJSON}>
                {copyJsonStatus === "copied" ? <Check className="mr-2" /> : <FileText className="mr-2" />}
                {copyJsonStatus === "loading" ? "Copying…" : copyJsonStatus === "copied" ? "Copied" : "Copy JSON"}
              </Button>

              <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={downloadSelectedJSON}><Download className="mr-2" /> Download JSON</Button>

              <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={() => window.open(ENDPOINT, "_blank")}><ExternalLink className="mr-2" /> Open endpoint</Button>

              <Button variant="ghost" className="w-full justify-start cursor-pointer" onClick={() => showToast("info", "Use HTML code in markup or unicode in JS/React") }><Clock className="mr-2" /> Quick tip</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Dataset info</div>
            <div className="text-xs opacity-60">
              Source: EmojiHub (no API key). The endpoint returns an array of emoji objects including <code>name</code>, <code>category</code>, <code>group</code>, <code>htmlCode</code>, and <code>unicode</code>. This page fetches the full list once and filters client-side for instant results.
            </div>
          </div>
        </aside>
      </main>

      {/* Image preview dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <ImageIcon />
              Preview
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 flex flex-col items-center gap-4">
            {selected ? (
              <>
                <div className="rounded-xl p-6 border bg-transparent flex items-center justify-center w-full" style={{ minHeight: 160 }}>
                  <EmojiVisual item={selected} large />
                </div>

                <div className="w-full flex gap-2">
                  <Button className="flex-1 justify-center cursor-pointer" onClick={handleCopyEmoji}><Copy className="mr-2" />Copy</Button>
                  <Button variant="outline" className="flex-1 justify-center cursor-pointer" onClick={downloadSelectedJSON}><Download className="mr-2" />Download JSON</Button>
                </div>
              </>
            ) : (
              <div className="text-sm opacity-60">No emoji selected</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setImageOpen(false)} className="cursor-pointer">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
