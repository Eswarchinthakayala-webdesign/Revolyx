// src/pages/StoicQuotePage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Loader2,
  Copy,
  Download,
  ExternalLink,
  Twitter,
  X,
  RefreshCw,
  Eye
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------------------- CONFIG ---------------------- */
const API_ENDPOINT = "/api/stoic/stoic-quote";
const DEFAULT_PLACEHOLDER = "Type to filter recent quotes or press Generate";

/* ---------------------- HELPERS ---------------------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

/** Normalize possible API shapes into {text, author, raw} */
function normalizeResponse(json) {
  if (!json) return null;

  // known shapes: {quote: "...", author: "..."} or {text: "...", author: "..."} or {body: "..."}
  const raw = json;
  const text =
    json.quote ??
    json.text ??
    json.phrase ??
    json.body ??
    json.quoteText ??
    json.content ??
    null;

  const author =
    json.author ??
    json.by ??
    json.person ??
    json.quoter ??
    json.source ??
    null;

  // fallback: if the API returns a string directly
  if (!text && typeof json === "string") {
    return { text: json, author: null, raw };
  }

  return { text: text ?? null, author: author ?? null, raw };
}

export default function StoicQuotePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // in-memory recent quotes (most recent first)
  const [showSuggest, setShowSuggest] = useState(false);
  const [loading, setLoading] = useState(false);

  const [current, setCurrent] = useState(null); // { text, author, raw }
  const [showRawDialog, setShowRawDialog] = useState(false);

  const suggestTimer = useRef(null);

  // Fetch one quote from API and set as current; also push to suggestions
  async function fetchQuote() {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINT);
      if (!res.ok) {
        showToast("error", `Quote fetch failed (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      const normalized = normalizeResponse(json);
      if (!normalized || !normalized.text) {
        // try if API returns {data: { ...}}
        const alt = normalizeResponse(json?.data ?? json?.result ?? json?.quote ?? null);
        setCurrent(alt ?? normalized);
        if (alt) setSuggestions((s) => [alt, ...s].slice(0, 50));
      } else {
        setCurrent(normalized);
        setSuggestions((s) => [{ ...normalized, id: Date.now().toString() }, ...s].slice(0, 50));
      }
      showToast("success", "Quote generated");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch quote");
    } finally {
      setLoading(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    // small debounce for filtering suggestions
    suggestTimer.current = setTimeout(() => {
      setShowSuggest(true);
    }, 120);
  }

  // client-side filter of suggestions (recent quotes)
  const filteredSuggestions = useMemo(() => {
    if (!query || query.trim() === "") return suggestions;
    const q = query.toLowerCase();
    return suggestions.filter((s) => {
      const text = (s.text || "").toLowerCase();
      const author = (s.author || "").toLowerCase();
      return text.includes(q) || author.includes(q);
    });
  }, [query, suggestions]);

  // quick actions
  function copyQuote() {
    if (!current?.text) return showToast("info", "No quote to copy");
    navigator.clipboard.writeText(`${current.text}${current.author ? ` — ${current.author}` : ""}`);
    showToast("success", "Quote copied");
  }

  function copyJSON() {
    if (!current?.raw) return showToast("info", "No JSON to copy");
    navigator.clipboard.writeText(prettyJSON(current.raw));
    showToast("success", "JSON copied");
  }

  function downloadJSON() {
    const payload = current?.raw ?? current ?? { text: current?.text ?? "", author: current?.author ?? "" };
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `stoic_quote_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function shareToTwitter() {
    if (!current?.text) return showToast("info", "No quote to share");
    const text = encodeURIComponent(`"${current.text}"${current.author ? ` — ${current.author}` : ""}`);
    const url = `https://twitter.com/intent/tweet?text=${text}&via=`;
    window.open(url, "_blank");
  }

  useEffect(() => {
    // initial load
    fetchQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto", isDark ? "bg-black" : "bg-white")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Stoic Quote — Daily Pulse</h1>
          <p className="mt-1 text-sm opacity-70">Random Stoic philosophy quotes, parsed and presented with context. Generate, inspect, and share.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // if there are filtered suggestions, pick first; otherwise generate new
              if (filteredSuggestions.length > 0 && query.trim() !== "") {
                const s = filteredSuggestions[0];
                setCurrent(s);
                setShowSuggest(false);
              } else {
                fetchQuote();
              }
            }}
            className={clsx(
              "flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2",
              isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            <Search className="opacity-60" />
            <Input
              placeholder={DEFAULT_PLACEHOLDER}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => fetchQuote()}>
              <RefreshCw className={loading ? "animate-spin" : ""} /> Generate
            </Button>
            <Button type="submit" variant="outline" className="px-3">
              <Search />
            </Button>
          </form>
        </div>
      </header>

      {/* Suggestion dropdown */}
      <AnimatePresence>
        {showSuggest && filteredSuggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx(
              "absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl",
              isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            {filteredSuggestions.map((s, idx) => (
              <li
                key={(s.id || s.text || idx) + idx}
                className={clsx(
                  "px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer",
                  idx === 0 ? "border-l-2 border-indigo-500" : ""
                )}
                onClick={() => {
                  setCurrent(s);
                  setShowSuggest(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium line-clamp-2">{s.text}</div>
                    <div className="text-xs opacity-60 mt-1">{s.author ?? "Unknown"}</div>
                  </div>
                  <div className="text-xs opacity-60">{/* optional timestamp placeholder */}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout: left (visual), center (detail), right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Visual Quote card */}
        <section className="lg:col-span-3">
          <Card className={clsx("rounded-2xl overflow-hidden border h-full", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <CardTitle className="text-lg">Quote</CardTitle>
              <div className="text-xs opacity-60 mt-1">Large readable quote — designed for sharing & reading.</div>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No quote loaded — press Generate.</div>
              ) : (
                <div className={clsx("flex flex-col h-full justify-between")}>
                  <div>
                    <div className="text-xl md:text-2xl font-semibold leading-9 mb-4">{current.text}</div>
                    <div className="text-sm opacity-70">— {current.author ?? "Unknown"}</div>
                  </div>

                  <div className="mt-6">
                    <Separator />
                    <div className="mt-4 text-xs opacity-60">Source: <span className="font-medium">Stoic Quote API</span></div>
                    <div className="text-xs opacity-60">Endpoint: <code className="break-all">{API_ENDPOINT}</code></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Center: Full details & analysis */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Details</CardTitle>
                <div className="text-xs opacity-60 mt-1">Parsed fields and intelligent representation of API response.</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowRawDialog(true)}><Eye /> View Raw</Button>
                <Button variant="outline" onClick={() => fetchQuote()}><RefreshCw className={loading ? "animate-spin" : ""} /> New</Button>
              </div>
            </CardHeader>

            <CardContent>
              {!current ? (
                <div className="py-12 text-center text-sm opacity-60">No data to show.</div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="text-xs opacity-60">Readable summary</div>
                    <div className="text-base md:text-lg leading-relaxed mt-2">{current.text}</div>
                    <div className="mt-3 text-sm opacity-70">Author: <span className="font-medium">{current.author ?? "Unknown"}</span></div>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <div className="text-xs opacity-60 mb-2">Fields extracted</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Text</div>
                        <div className="text-sm font-medium break-words">{current.text ?? "—"}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Author</div>
                        <div className="text-sm font-medium break-words">{current.author ?? "—"}</div>
                      </div>

                      <div className="p-3 rounded-md border sm:col-span-2">
                        <div className="text-xs opacity-60">Raw JSON (preview)</div>
                        <pre className={clsx("text-xs overflow-auto mt-2 p-2 rounded-md", isDark ? "bg-black/20 text-zinc-200" : "bg-white/80 text-zinc-900")} style={{ maxHeight: 220 }}>
                          {prettyJSON(current.raw ?? current)}
                        </pre>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <div className="text-xs opacity-60">Analysis & suggestions</div>
                    <div className="mt-2 text-sm leading-relaxed">
                      This quote has been parsed and displayed in a readable format. Use <strong>Generate</strong> to fetch another quote, or filter using the search field to find a previously generated quote from this session.
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: Quick actions */}
        <section className="lg:col-span-3">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4 h-fit", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="text-sm font-semibold mb-2">Quick actions</div>
            <div className="text-xs opacity-60 mb-3">Share, export, or inspect the current quote.</div>

            <div className="space-y-3">
              <Button className="w-full justify-start" onClick={copyQuote}><Copy className="mr-2" /> Copy Quote</Button>
              <Button className="w-full justify-start" variant="outline" onClick={copyJSON}><Copy className="mr-2" /> Copy JSON</Button>
              <Button className="w-full justify-start" variant="outline" onClick={downloadJSON}><Download className="mr-2" /> Download JSON</Button>
              <Button className="w-full justify-start" variant="ghost" onClick={shareToTwitter}><Twitter className="mr-2" /> Share to Twitter</Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => setShowRawDialog(true)}><Eye className="mr-2" /> View Raw JSON</Button>
              <Button className="w-full justify-start" onClick={() => { if (current?.raw) window.open(API_ENDPOINT, "_blank"); else showToast("info", "No source to open"); }}><ExternalLink className="mr-2" /> Open API</Button>
            </div>
          </Card>
        </section>
      </main>

      {/* Raw JSON dialog */}
      <Dialog open={showRawDialog} onOpenChange={setShowRawDialog}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Raw JSON — Stoic Quote</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "60vh", overflow: "auto", padding: 16 }}>
            <pre className={clsx("text-xs whitespace-pre-wrap", isDark ? "text-zinc-200" : "text-zinc-900")}>
              {prettyJSON(current?.raw ?? current ?? {})}
            </pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Raw API response</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowRawDialog(false)}><X /></Button>
              <Button variant="outline" onClick={() => { copyJSON(); setShowRawDialog(false); }}>Copy JSON</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
