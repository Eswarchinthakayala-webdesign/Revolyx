// src/pages/ForismaticPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Copy,
  ExternalLink,
  Download,
  Loader2,
  ImageIcon,
  List,
  MessageSquare,
  Twitter,
  X,
  User,
  FileText,
  Link as LinkIcon,
  Clock,
  Menu,
  Check,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"; // adjust if your sheet API differs
import { Tooltip } from "@/components/ui/tooltip"; // optional, only if present

const FORISMATIC_ENDPOINT = "/quote/?method=getQuote&format=json&lang=en";

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function normalizeResponse(json) {
  if (!json) return null;
  const rawText =
    json.quoteText ?? json.quote ?? json.text ?? (typeof json === "string" ? json : "—");
  const normalized = {
    text: typeof rawText === "string" ? rawText : String(rawText),
    author:
      json && json.quoteAuthor && json.quoteAuthor !== "" ? json.quoteAuthor : "Unknown",
    senderName: json?.senderName ?? null,
    senderLink: json?.senderLink ?? null,
    raw: json,
  };

  return normalized;
}

export default function ForismaticPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // states
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // ephemeral small suggestions
  const [sidebarQuotes, setSidebarQuotes] = useState([]); // 10 quotes for sidebar
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [current, setCurrent] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false); // raw / image dialog
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // desktop/hamburger state for small screens

  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef(null);

  const suggestTimer = useRef(null);

  // Helper: safe parse response text
  async function safeFetchJsonFromResponse(res) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      // try to repair common issues
      try {
        const safer = text.replace(/\r?\n/g, "\\n");
        return JSON.parse(safer);
      } catch {
        // if it is a plain URL or HTML, return the string
        return text;
      }
    }
  }

  // Fetch a single random quote and set current
  async function fetchQuote({ openDialog = false } = {}) {
    setLoadingQuote(true);
    try {
      const res = await fetch(FORISMATIC_ENDPOINT, { cache: "no-store" });
      const json = await safeFetchJsonFromResponse(res);
      // if response is just a string and looks like an image URL, show as image
      if (typeof json === "string" && /^https?:\/\/.*\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(json.trim())) {
        setImagePreviewUrl(json.trim());
        setRawResp(json);
        setCurrent(normalizeResponse({ quoteText: "Image response", quoteAuthor: "Unknown", senderLink: json }));
        if (openDialog) setDialogOpen(true);
        showToast("info", "Image response received — preview available");
      } else {
        const norm = normalizeResponse(json);
        setCurrent(norm);
        setRawResp(json);
        setImagePreviewUrl(null);
        if (openDialog && json) setDialogOpen(true);
        showToast("success", `Loaded quote — ${norm?.author ?? "Unknown"}`);
      }
      return true;
    } catch (err) {
      console.error("fetchQuote error", err);
      showToast("error", "Failed to fetch quote");
      return false;
    } finally {
      setLoadingQuote(false);
    }
  }

  // Fetch N sample quotes for suggestions / sidebar
  async function fetchMultipleQuotes(count = 10) {
    setLoadingSuggest(true);
    const results = [];
    try {
      // Do sequential-ish to avoid hammering endpoint at once (but still reasonably fast)
      const promises = Array.from({ length: count }).map(async () => {
        try {
          const res = await fetch(FORISMATIC_ENDPOINT, { cache: "no-store" });
          const parsed = await safeFetchJsonFromResponse(res);
          // normalize
          const norm = normalizeResponse(parsed);
          if (norm?.text) results.push(norm);
        } catch (e) {
          // ignore
        }
      });
      await Promise.all(promises);
      // dedupe by text
      const unique = results.filter((v, i, a) => a.findIndex(x => x.text === v.text) === i).slice(0, count);
      setSidebarQuotes(unique);
      return unique;
    } catch (err) {
      console.error("fetchMultipleQuotes", err);
      setSidebarQuotes([]);
      return [];
    } finally {
      setLoadingSuggest(false);
    }
  }

  // Debounced suggestions while typing
  function onQueryChange(v) {
    setQuery(v);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      fetchSuggestionsSample(6);
    }, 350);
  }

  async function fetchSuggestionsSample(count = 5) {
    setLoadingSuggest(true);
    try {
      const results = [];
      const promises = Array.from({ length: count }).map(async () => {
        try {
          const res = await fetch(FORISMATIC_ENDPOINT, { cache: "no-store" });
          const parsed = await safeFetchJsonFromResponse(res);
          const norm = normalizeResponse(parsed);
          if (!query || query.trim() === "" || (norm.text + " " + norm.author).toLowerCase().includes(query.toLowerCase())) {
            results.push(norm);
          }
        } catch (e) {
          // ignore
        }
      });
      await Promise.all(promises);
      const unique = results.filter((v, i, a) => a.findIndex(x => x.text === v.text) === i).slice(0, 7);
      setSuggestions(unique);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  // copy with animated tick
  function copyQuote() {
    if (!current) return showToast("info", "No quote loaded");
    const text = `"${current.text}" — ${current.author}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast("success", "Quote copied to clipboard");
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2200);
    });
  }

  function tweetQuote() {
    if (!current) return showToast("info", "No quote to tweet");
    const text = encodeURIComponent(`"${current.text}" — ${current.author}`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, "_blank");
  }

  function downloadJSON() {
    const payload = rawResp || current?.raw || current || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    const filename = `quote_${(current?.author || "quote").replace(/\s+/g, "_")}.json`;
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function copyRawJSON() {
    const payload = rawResp || current?.raw || current || {};
    navigator.clipboard.writeText(prettyJSON(payload));
    showToast("success", "JSON copied to clipboard");
  }

  // show raw only when toggled
  function toggleShowRaw() {
    setShowRaw((s) => !s);
  }

  // image preview handler
  function handleImagePreview() {
    // If rawResp is an image URL or current.senderLink is image - prefer that
    if (typeof rawResp === "string" && /^https?:\/\/.*\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(rawResp.trim())) {
      setImagePreviewUrl(rawResp.trim());
      setDialogOpen(true);
      return;
    }
    const maybeUrl = current?.raw?.senderLink || current?.senderLink;
    if (maybeUrl && /^https?:\/\/.*\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(maybeUrl)) {
      setImagePreviewUrl(maybeUrl);
      setDialogOpen(true);
      return;
    }
    // otherwise open raw dialog
    setImagePreviewUrl(null);
    setDialogOpen(true);
  }

  // mobile: open sheet with sidebar list
  function openSidebarMobile() {
    setSheetOpen(true);
  }

  // keyboard/misc: close dialogs
  useEffect(() => {
    // initial load: fetch main quote and sidebar quotes
    fetchQuote();
    fetchMultipleQuotes(10);
    // cleanup on unmount
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // small utility: pick from sidebar (also close mobile sheet)
  function pickFromSidebar(q) {
    setCurrent(q);
    setRawResp(q.raw);
    setSidebarOpen(false);
    setSheetOpen(false);
    setSuggestions([]);
  }

  return (
    <div className={clsx("min-h-screen pb-10 p-4 md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-start flex-wrap md:items-center justify-between gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-3">
       

          <div>
            <h1 className={clsx("text-2xl md:text-3xl font-extrabold")}>Inspire — Quotes</h1>
            <p className="mt-0.5 text-sm opacity-70">Random quotes from Forismatic with pro actions & quick export</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form
            onSubmit={(e) => {
              e?.preventDefault?.();
              fetchQuote();
            }}
            className={clsx(
              "flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-1",
              isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            <Search className="opacity-60" />
            <Input
              placeholder="Search quotes or author, e.g., 'love', 'Einstein'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => fetchSuggestionsSample(6)}
            />
            <Button
              type="button"
              variant="ghost"
              className="px-3 cursor-pointer"
              onClick={() => {
                fetchSuggestionsSample(6);
                setSuggestions((s) => s); // noop but ensure UI update
              }}
            >
              Suggest
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer" title="Get random quote">
              <Search />
            </Button>
          </form>

          {/* Mobile sheet trigger */}
          <div className="md:hidden ml-2">
            <Button variant="ghost" className="p-2 cursor-pointer" onClick={openSidebarMobile}><List /></Button>
          </div>
        </div>
      </header>

      {/* Suggestion dropdown */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx(
              "absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl",
              isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200"
            )}
            style={{ marginTop: 84 }}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {!loadingSuggest &&
              suggestions.map((s, idx) => (
                <li
                  key={idx}
                  onClick={() => {
                    setCurrent(s);
                    setRawResp(s.raw);
                    setSuggestions([]);
                  }}
                  className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm line-clamp-2">“{s.text}”</div>
                      <div className="text-xs opacity-60 mt-1">{s.author}</div>
                    </div>
                    <div className="text-xs opacity-60">{s.senderName}</div>
                  </div>
                </li>
              ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left: Sidebar (desktop) */}
        <aside
          className={clsx(
            "hidden lg:block lg:col-span-3 space-y-4  h-[calc(100vh-96px)]",
            isDark ? "text-zinc-200" : "text-zinc-900"
          )}
        >
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-sm">Quick Picks</CardTitle>
                <div className="text-xs opacity-60">10 random quotes</div>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip content="Refresh list">
                  <Button variant="ghost" onClick={() => fetchMultipleQuotes(10)} className="p-2 cursor-pointer"><RefreshCw /></Button>
                </Tooltip>
                <Badge>{sidebarQuotes.length}</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea style={{ height: 420 }}>
                <div className="p-2 space-y-2">
                  {sidebarQuotes.length === 0 && (
                    <div className="p-4 text-sm opacity-60">No sidebar quotes yet — refresh to load.</div>
                  )}
                  {sidebarQuotes.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => pickFromSidebar(q)}
                      className="w-full text-left p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition cursor-pointer"
                    >
                      <div className="text-sm line-clamp-2">“{q.text}”</div>
                      <div className="text-xs opacity-60 mt-1 flex items-center gap-2">
                        <User className="w-3 h-3" /> {q.author}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <CardTitle className="text-sm">About</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm opacity-70">
                Source: <strong>Forismatic</strong> — public quote API. Use the actions to copy, tweet, or download JSON.
              </div>

              <Separator className="my-3" />

              <div className="text-xs opacity-60">Endpoint</div>
              <div className="text-sm break-words mt-1">{FORISMATIC_ENDPOINT}</div>
            </CardContent>
          </Card>
        </aside>

        {/* Center */}
        <section className="lg:col-span-7">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-start flex-wrap justify-between gap-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-3">
                  <FileText /> Quote
                  <Badge className="ml-2">Random</Badge>
                </CardTitle>
                <div className="text-xs opacity-60 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> Instant</span>
                  <span className="flex items-center gap-2"><List className="w-3 h-3" /> Curated view</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => fetchQuote()}
                  className={clsx("px-3 cursor-pointer")}
                  title="New random quote"
                >
                  <motion.div whileTap={{ scale: 0.92 }} className="flex items-center gap-2">
                    <RefreshCw className={loadingQuote ? "animate-spin" : ""} /> Refresh
                  </motion.div>
                </Button>

                <Button variant="ghost" onClick={() => toggleShowRaw()} className="px-3 cursor-pointer">
                  <List /> {showRaw ? "Hide" : "Raw"}
                </Button>

                <Button variant="ghost" onClick={() => handleImagePreview()} className="px-3 cursor-pointer">
                  <ImageIcon /> Preview
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingQuote ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No quote loaded — try "Suggest" or "Refresh".</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={clsx("col-span-1 md:col-span-2 p-6 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-2xl md:text-3xl font-semibold leading-relaxed mb-4">“{current.text}”</div>

                    <div className="flex items-center gap-3 text-lg font-medium opacity-90">
                      <User /> <span> {current.author}</span>
                      {current.senderLink && (
                        <a target="_blank" rel="noreferrer" href={current.senderLink} className="ml-3 text-sm underline flex items-center gap-1">
                          <LinkIcon className="w-4 h-4" /> source
                        </a>
                      )}
                    </div>

                    <div className="mt-6 text-sm leading-relaxed opacity-80 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">Length</Badge>
                        <div>{current.text.length} chars</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">Sender</Badge>
                        <div>{current.senderName || "—"}</div>
                      </div>

                      <div className="mt-3 text-sm opacity-80">
                        <strong>Why this is interesting</strong>
                        <p className="mt-2">
                          Quote presented with key metadata and quick actions. Use the preview to inspect images or raw data.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right meta column */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2"><FileText /> Fields</div>
                      <Badge>{current?.author?.slice(0, 10) || "—"}</Badge>
                    </div>

                    <div className="space-y-3 text-sm mt-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <div>
                          <div className="text-xs opacity-60">Author</div>
                          <div className="font-medium">{current.author}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <div>
                          <div className="text-xs opacity-60">Text length</div>
                          <div className="font-medium">{current.text.length} chars</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        <div>
                          <div className="text-xs opacity-60">Sender</div>
                          <div className="font-medium">{current.senderName || "—"}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Preview</div>
                        <div className="font-medium line-clamp-4 text-sm">{current.text}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw response toggled */}
              <AnimatePresence>
                {showRaw && rawResp && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("mt-6 p-4 rounded-md border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs opacity-60">Raw response</div>
                      <div className="text-xs opacity-60">Copy / download</div>
                    </div>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 260 }}>
                      {prettyJSON(rawResp)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* Right quick actions */}
        <aside className={clsx("lg:col-span-2 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
                <div className="text-xs opacity-60">Copy, tweet, export</div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <motion.button whileTap={{ scale: 0.98 }} onClick={copyQuote} className="w-full flex items-center gap-2 justify-center p-2 rounded-md border hover:shadow cursor-pointer">
                  {!copied ? <Copy /> : <Check />}
                  <span>{!copied ? "Copy Quote" : "Copied"}</span>
                </motion.button>

                <Button onClick={tweetQuote} className="w-full cursor-pointer" variant="outline"><Twitter /> Tweet</Button>

                <Button onClick={copyRawJSON} className="w-full cursor-pointer" variant="outline"><MessageSquare /> Copy JSON</Button>

                <Button onClick={downloadJSON} className="w-full cursor-pointer" variant="outline"><Download /> Download JSON</Button>

                <Button onClick={() => { if (current?.raw?.senderLink) window.open(current.raw.senderLink, "_blank"); else showToast("info", "No link available"); }} className="w-full cursor-pointer" variant="outline"><ExternalLink /> Open Source</Button>
              </div>

              <Separator className="my-2" />

              <div className="text-xs opacity-60">
                Pro tip: use the Suggest button for multiple picks. Use Preview to inspect images returned by API.
              </div>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-sm opacity-70">
                Source: Forismatic API — no API key required. Page adapts to fields the API returns.
              </div>

              <Separator className="my-3" />

              <div className="text-xs opacity-60">Last updated</div>
              <div className="text-sm font-medium mt-1">{new Date().toLocaleString()}</div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Desktop sidebar overlay (when hamburger toggled) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 lg:hidden">
            <div onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/30" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="relative w-[320px] bg-white dark:bg-black h-full p-4 overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold">Quick Picks</div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 cursor-pointer rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"><X /></button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs opacity-60">Random</div>
                  <Badge>{sidebarQuotes.length}</Badge>
                </div>

                <div>
                  <ScrollArea style={{ height: "70vh" }}>
                    <div className="space-y-2">
                      {sidebarQuotes.map((q, i) => (
                        <button key={i} onClick={() => pickFromSidebar(q)} className="w-full text-left cursor-pointer p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                          <div className="font-medium text-sm line-clamp-2">“{q.text}”</div>
                          <div className="text-xs opacity-60 mt-1">{q.author}</div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sheet for picks */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Quick Picks</SheetTitle>
          </SheetHeader>

          <div className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs opacity-60">Tap to pick</div>
              <div className="flex items-center gap-2">
                 <Button className="cursor-pointer" variant="ghost" size="sm" onClick={() => fetchMultipleQuotes(10)}><RefreshCw /></Button>
                <Badge>{sidebarQuotes.length}</Badge>
              </div>
            </div>

            <ScrollArea style={{ height: 320 }}>
              <div className="space-y-2">
                {sidebarQuotes.map((q, i) => (
                  <button key={i} onClick={() => pickFromSidebar(q)} className="w-full text-left cursor-pointer p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <div className="font-medium text-sm line-clamp-2">“{q.text}”</div>
                    <div className="text-xs opacity-60 mt-1">{q.author}</div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Raw / Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{imagePreviewUrl ? "Image preview" : "Raw response"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", flexDirection: "column" }}>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {imagePreviewUrl ? (
                // image preview
                <img src={imagePreviewUrl} alt="preview" className="max-h-[56vh] rounded-md object-contain" />
              ) : (
                <pre className={clsx("text-xs whitespace-pre-wrap", isDark ? "text-zinc-200" : "text-zinc-900")}>
                  {prettyJSON(rawResp || current?.raw || current || {})}
                </pre>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">API raw payload</div>
            <div className="flex gap-2">
              <Button className='cursor-pointer' variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button className='cursor-pointer' variant="outline" onClick={() => downloadJSON()}><Download /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
