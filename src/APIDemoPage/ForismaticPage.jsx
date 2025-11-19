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
 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/*
  ForismaticPage.jsx
  - Presents a professional quote explorer for the Forismatic API
  - Left: compact list / suggestions while searching
  - Center: big quote view + structured fields (analyzed from response)
  - Right: quick actions (copy, tweet, download JSON, raw view)
  - No local storage or save-to-favorites
  - Uses lucide icons and shadcn components, same theme approach as NewsApiPage
*/

const FORISMATIC_ENDPOINT = "/quote/?method=getQuote&format=json&lang=en";

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export default function ForismaticPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // States
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // small list of quote candidates from quick fetches
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [current, setCurrent] = useState(null); // selected quote (object)
  const [rawResp, setRawResp] = useState(null); // raw response for download/view
  const [loadingQuote, setLoadingQuote] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false); // image/raw (we'll use for raw)
  const [showRaw, setShowRaw] = useState(false);

  const suggestTimer = useRef(null);

  // Helpful parser: normalize the forismatic response into known fields.
  function normalizeResponse(json) {
    // Forismatic typical fields: quoteText, quoteAuthor, senderName, senderLink
    if (!json) return null;
    const normalized = {
      text: json.quoteText ?? json.quote ?? json.text ?? "—",
      author: (json.quoteAuthor && json.quoteAuthor !== "") ? json.quoteAuthor : "Unknown",
      senderName: json.senderName ?? null,
      senderLink: json.senderLink ?? null,
      raw: json
    };
    return normalized;
  }

  // Fetch a single random quote from Forismatic
  async function fetchQuote() {
    setLoadingQuote(true);
    try {
      // Forismatic sometimes returns invalid JSON (escaped quotes). Use a fetch + text + safe JSON parse.
      const res = await fetch(FORISMATIC_ENDPOINT, { cache: "no-store" });
      const text = await res.text();
      // forismatic sometimes returns a JSON string with invalid backslashes - try to parse gracefully
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        // If parsing fails, try to fix common issues: replace unescaped newlines
        try {
          const safer = text.replace(/\r?\n/g, "\\n");
          json = JSON.parse(safer);
        } catch {
          // fallback: wrap to an object with text
          json = { quoteText: text };
        }
      }
      const norm = normalizeResponse(json);
      setCurrent(norm);
      setRawResp(json);
      showToast("success", `Loaded quote — ${norm?.author ?? "Unknown"}`);
      return norm;
    } catch (err) {
      console.error("fetchQuote error", err);
      showToast("error", "Failed to fetch quote");
      return null;
    } finally {
      setLoadingQuote(false);
    }
  }

  // When user types in search, we'll fetch a handful of quotes to use as suggestions.
  // Forismatic doesn't support search; we emulate "suggestions" by sampling multiple random quotes.
  async function fetchSuggestionsSample(count = 5) {
    setLoadingSuggest(true);
    try {
      const results = [];
      const promises = Array.from({ length: count }).map(async () => {
        try {
          const res = await fetch(FORISMATIC_ENDPOINT, { cache: "no-store" });
          const text = await res.text();
          let json;
          try { json = JSON.parse(text); } catch { json = { quoteText: text }; }
          const norm = normalizeResponse(json);
          // If user has typed a query, filter by matching text or author
          if (!query || query.trim() === "" || (norm.text + " " + norm.author).toLowerCase().includes(query.toLowerCase())) {
            results.push(norm);
          }
        } catch (e) {
          // ignore per-sample errors
        }
      });
      await Promise.all(promises);
      // dedupe by text
      const unique = results.filter((v, i, a) => a.findIndex(x => x.text === v.text) === i).slice(0, 7);
      setSuggestions(unique);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  // Debounced search handler
  function onQueryChange(v) {
    setQuery(v);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      fetchSuggestionsSample(6);
    }, 350);
  }

  // Copy quote text to clipboard
  function copyQuote() {
    if (!current) return showToast("info", "No quote loaded");
    const text = `"${current.text}" — ${current.author}`;
    navigator.clipboard.writeText(text);
    showToast("success", "Quote copied to clipboard");
  }

  // Tweet the current quote
  function tweetQuote() {
    if (!current) return showToast("info", "No quote to tweet");
    const text = encodeURIComponent(`"${current.text}" — ${current.author}`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, "_blank");
  }

  // Download JSON
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

  // Copy raw JSON representation to clipboard
  function copyRawJSON() {
    const payload = rawResp || current?.raw || current || {};
    navigator.clipboard.writeText(prettyJSON(payload));
    showToast("success", "JSON copied to clipboard");
  }

  // Initial load: one example quote
  useEffect(() => {
    fetchQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Inspire — Quotes</h1>
          <p className="mt-1 text-sm opacity-70">Browse random inspirational quotes from Forismatic — quick search & suggestions.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={(e) => { e?.preventDefault?.(); fetchQuote(); }} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search quotes or author, e.g., 'love', 'Einstein'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => fetchSuggestionsSample(6)}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => fetchSuggestionsSample(6)}>
              Suggest
            </Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestion dropdown */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
            style={{ marginTop: 84 }}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {!loadingSuggest && suggestions.map((s, idx) => (
              <li key={idx} onClick={() => { setCurrent(s); setRawResp(s.raw); setSuggestions([]); }} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
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

      {/* Main layout: Left (compact list), Center (big view), Right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Compact list of recent suggestions / history */}
        {/* <aside className={clsx("lg:col-span-3 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-sm">Suggestions</CardTitle>
                <div className="text-xs opacity-60">Quick picks based on your search</div>
              </div>
              <div className="text-xs opacity-60">{suggestions.length} items</div>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                {suggestions.length === 0 && <div className="text-sm opacity-60">No suggestions — ask or hit Suggest</div>}
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { setCurrent(s); setRawResp(s.raw); }} className="w-full text-left p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50">
                    <div className="font-medium text-sm line-clamp-2">“{s.text}”</div>
                    <div className="text-xs opacity-60 mt-1">{s.author}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-sm">About</CardTitle>
                <div className="text-xs opacity-60">Forismatic — public inspirational quotes API</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm leading-relaxed">
                Fetches random, timeless quotes. Response structure is parsed and presented here — read the quote on the center pane. Use quick actions to copy, tweet or download.
              </div>

              <Separator className="my-3" />

              <div className="text-xs opacity-60">Endpoint</div>
              <div className="text-sm break-words mt-1">{FORISMATIC_ENDPOINT}</div>
            </CardContent>
          </Card>
        </aside> */}

        {/* Center: Main Quote Display */}
        <section className="lg:col-span-9">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-start justify-between gap-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex-1">
                <CardTitle className="text-lg">Quote</CardTitle>
                <div className="text-xs opacity-60">A beautifully rendered quote — auto-analyzed from the API response</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => fetchQuote()} className={clsx("px-3")}>
                  <Loader2 className={loadingQuote ? "animate-spin" : ""} /> Refresh
                </Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> Raw View</Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingQuote ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No quote loaded — try "Suggest" or "Refresh".</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Big Quote block */}
                  <div className={clsx("col-span-1 md:col-span-2 p-6 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-2xl md:text-3xl font-semibold leading-relaxed mb-4">“{current.text}”</div>
                    <div className="text-lg font-medium opacity-90">— {current.author}</div>

                    {current.senderName && (
                      <div className="mt-3 text-sm opacity-70">Sender: {current.senderName}{current.senderLink && (<a target="_blank" rel="noreferrer" href={current.senderLink} className="underline ml-2">source</a>)}</div>
                    )}

                    <div className="mt-6 text-sm leading-relaxed opacity-80">
                      <strong>Why this is interesting</strong>
                      <p className="mt-2">
                        This quote was analyzed from the API response and presented prominently. We surface key fields and allow quick actions on the right for professional workflows (copy, tweet, download).
                      </p>
                    </div>
                  </div>

                  {/* Fields / metadata */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Fields</div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Author</div>
                        <div className="font-medium">{current.author}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Text length</div>
                        <div className="font-medium">{current.text.length} chars</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Sender</div>
                        <div className="font-medium">{current.senderName || "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Preview</div>
                        <div className="font-medium line-clamp-4 text-sm">{current.text}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {showRaw && rawResp && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("mt-6 p-4 rounded-md border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <div className="text-xs opacity-60 mb-2">Raw response</div>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                      {prettyJSON(rawResp)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* Right: Quick actions */}
        <aside className={clsx("lg:col-span-3 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
                <div className="text-xs opacity-60">Copy, tweet, export</div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={copyQuote} className="w-full" variant="outline"><Copy /> Copy Quote</Button>
                <Button onClick={tweetQuote} className="w-full" variant="outline"><Twitter /> Tweet</Button>
                <Button onClick={copyRawJSON} className="w-full" variant="outline"><MessageSquare /> Copy JSON</Button>
                <Button onClick={downloadJSON} className="w-full" variant="outline"><Download /> Download JSON</Button>
                <Button onClick={() => { if (current?.raw?.senderLink) window.open(current.raw.senderLink, "_blank"); else showToast("info", "No link available"); }} className="w-full" variant="outline"><ExternalLink /> Open Source</Button>
              </div>

              <Separator className="my-2" />

              <div className="text-xs opacity-60">
                Pro tip: use the Suggest button for multiple curated picks. Use Raw view to inspect API keys and structure.
              </div>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-sm opacity-70">
                Source: Forismatic API — no API key required. This page adapts to whatever fields the API returns and surfaces them in a readable format.
              </div>

              <Separator className="my-3" />

              <div className="text-xs opacity-60">Last updated</div>
              <div className="text-sm font-medium mt-1">{new Date().toLocaleString()}</div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Raw dialog (modal) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Raw response</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", flexDirection: "column" }}>
            <div className="flex-1 overflow-auto p-4">
              <pre className={clsx("text-xs whitespace-pre-wrap", isDark ? "text-zinc-200" : "text-zinc-900")}>
                {prettyJSON(rawResp || current?.raw || current || {})}
              </pre>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">API raw payload</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => downloadJSON()}><Download /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
