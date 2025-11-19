// src/pages/IcanHazDadJokePage.jsx
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  MessageSquare,
  Smile,
  List,
  X,
  RefreshCw,
  ImageIcon,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------- Endpoint ---------- */
const BASE_SEARCH = "https://icanhazdadjoke.com/search";
const RANDOM_ENDPOINT = "https://icanhazdadjoke.com/";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function sanitizeFilename(s) {
  return (s || "joke").replace(/[^a-z0-9_\-\.]/gi, "_").slice(0, 120);
}

/* ---------- Component ---------- */
export default function IcanHazDadJokePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  // State
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // array of jokes {id, joke}
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentJoke, setCurrentJoke] = useState(null); // single joke object
  const [rawResp, setRawResp] = useState(null);
  const [loadingJoke, setLoadingJoke] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);

  const suggestAbortRef = useRef(null);
  const searchDebounceTimer = useRef(null);
  const latestRequestId = useRef(0);

  /* ---------- Fetch helpers ---------- */

  // fetch random joke
  async function fetchRandomJoke() {
    setLoadingJoke(true);
    const reqId = ++latestRequestId.current;
    try {
      const res = await fetch(RANDOM_ENDPOINT, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        showToast("error", `Failed to fetch random joke (${res.status})`);
        return;
      }
      const json = await res.json();
      if (reqId !== latestRequestId.current) return; // stale
      setCurrentJoke(json);
      setRawResp(json);
      showToast("success", "Random joke loaded");
    } catch (err) {
      console.error(err);
      showToast("error", "Could not load random joke");
    } finally {
      setLoadingJoke(false);
    }
  }

  // search suggestions (debounced + abortable)
  async function fetchSuggestions(term) {
    if (!term || term.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    if (suggestAbortRef.current) {
      suggestAbortRef.current.abort();
    }
    const controller = new AbortController();
    suggestAbortRef.current = controller;

    setLoadingSuggest(true);
    const reqId = ++latestRequestId.current;
    try {
      const params = new URLSearchParams({ term, limit: 10 });
      const url = `${BASE_SEARCH}?${params.toString()}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const json = await res.json();
      if (reqId !== latestRequestId.current) return; // stale
      // json.results = [{ id, joke }, ...]
      setSuggestions(json.results || []);
    } catch (err) {
      if (err.name === "AbortError") {
        // expected on new request
      } else {
        console.error(err);
        setSuggestions([]);
      }
    } finally {
      setLoadingSuggest(false);
      suggestAbortRef.current = null;
    }
  }

  // search submit (choose first or show none)
  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Try searching for a word or phrase (e.g. 'chicken').");
      return;
    }
    setLoadingSuggest(true);
    try {
      const params = new URLSearchParams({ term: query, limit: 10 });
      const url = `${BASE_SEARCH}?${params.toString()}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const json = await res.json();
      setLoadingSuggest(false);
      if (json.results && json.results.length > 0) {
        setCurrentJoke(json.results[0]);
        setRawResp(json);
        setShowSuggest(false);
        showToast("success", "Joke found");
      } else {
        showToast("info", "No jokes found — try another word");
      }
    } catch (err) {
      console.error(err);
      setLoadingSuggest(false);
      showToast("error", "Search failed");
    }
  }

  // click suggestion
  function chooseSuggestion(s) {
    setCurrentJoke(s);
    setRawResp({ results: [s] });
    setShowSuggest(false);
  }

  // copy joke to clipboard
  async function copyJoke() {
    if (!currentJoke) return showToast("info", "No joke to copy");
    try {
      await navigator.clipboard.writeText(currentJoke.joke || currentJoke);
      showToast("success", "Joke copied to clipboard");
    } catch {
      showToast("error", "Could not copy");
    }
  }

  // download JSON (sanitized filename)
  function downloadJSON() {
    const payload = rawResp || currentJoke;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `joke_${sanitizeFilename(currentJoke?.joke || currentJoke?.id || "joke")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* ---------- Effects ---------- */

  // Initial load: show a random joke to start
  useEffect(() => {
    fetchRandomJoke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search suggestions
  useEffect(() => {
    setShowSuggest(true);
    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
    searchDebounceTimer.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
    return () => {
      if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  /* ---------- keyboard navigation for suggestions (basic) ---------- */
  const [activeIndex, setActiveIndex] = useState(-1);
  function onKeyDown(e) {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        chooseSuggestion(suggestions[activeIndex]);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  }

  /* ---------- Render ---------- */
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>LaughLab — Random Dad Jokes</h1>
          <p className="mt-1 text-sm opacity-70">Search jokes, view suggestions, copy or download JSON. Powered by icanhazdadjoke.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search jokes"
              placeholder="Search jokes, e.g. 'chicken', 'doctor', 'why'..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); }}
              onFocus={() => setShowSuggest(true)}
              onKeyDown={onKeyDown}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => fetchRandomJoke()}>
              <RefreshCw className={loadingJoke ? "animate-spin" : ""} /> Random
            </Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="listbox"
            aria-label="Joke suggestions"
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li
                key={s.id || `${s.joke}_${idx}`}
                role="option"
                aria-selected={activeIndex === idx}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => chooseSuggestion(s)}
                className={clsx("px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer", activeIndex === idx && "bg-zinc-100 dark:bg-zinc-800/50")}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center bg-zinc-100 dark:bg-zinc-900/40">
                    <Smile />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm line-clamp-2">{s.joke}</div>
                    <div className="text-xs opacity-60">ID: {s.id}</div>
                  </div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main Layout: left + center + right */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: small preview / meta */}
        <aside className={clsx("lg:col-span-2 space-y-4", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200", "rounded-2xl p-4")}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-pink-500 to-yellow-400 flex items-center justify-center text-white text-4xl">
              <Smile />
            </div>

            <div className="text-center">
              <div className="text-sm font-semibold">Current Joke</div>
              <div className="text-xs opacity-60 mt-1">{currentJoke ? `ID: ${currentJoke.id ?? "—"}` : "No joke loaded"}</div>
            </div>

            <Separator />

            <div className="space-y-2 w-full">
              <Button variant="outline" onClick={() => { if (currentJoke?.id) window.open(`https://icanhazdadjoke.com/j/${currentJoke.id}`, "_blank", "noreferrer"); else showToast("info", "No ID available"); }}>
                <ExternalLink /> View on icanhazdadjoke
              </Button>
              <Button variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> Quick view</Button>
            </div>
          </div>
        </aside>

        {/* Center: main joke content */}
        <section className="lg:col-span-7">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Joke</CardTitle>
                <div className="text-xs opacity-60">{currentJoke?.id ? `ID: ${currentJoke.id}` : "Waiting for a joke..."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fetchRandomJoke()}><Loader2 className={loadingJoke ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" onClick={() => { setRawResp((r) => r ? null : rawResp); }}><List /> Raw</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingJoke ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentJoke ? (
                <div className="py-12 text-center text-sm opacity-60">No joke loaded — click Random or search</div>
              ) : (
                <div className="space-y-4">
                  <div className="text-2xl md:text-3xl font-semibold leading-relaxed">{currentJoke.joke}</div>

                  <Separator />

                  <div>
                    <div className="text-sm font-semibold mb-2">Full fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.keys(currentJoke).map((k) => (
                        <div key={k} className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">{k}</div>
                          <div className="text-sm font-medium break-words">{typeof currentJoke[k] === "object" ? JSON.stringify(currentJoke[k]) : (currentJoke[k] ?? "—")}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {rawResp && (
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
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Actions</div>
            <div className="text-xs opacity-60">Copy, download or load new jokes quickly</div>

            <div className="mt-3 space-y-2">
              <Button className="w-full" variant="outline" onClick={copyJoke}><Copy /> Copy Joke</Button>
              <Button className="w-full" variant="outline" onClick={downloadJSON}><Download /> Download JSON</Button>
              <Button className="w-full" variant="outline" onClick={() => fetchRandomJoke()}><RefreshCw /> Load Random</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint examples & debugging</div>
            <div className="mt-2 space-y-2">
              <Button className="w-full" variant="ghost" onClick={() => { navigator.clipboard.writeText(RANDOM_ENDPOINT); showToast("success", "Endpoint copied"); }}><Copy /> Copy Random Endpoint</Button>
              <Button className="w-full" variant="ghost" onClick={() => { navigator.clipboard.writeText(`${BASE_SEARCH}?term=${encodeURIComponent(query || "")}`); showToast("success", "Search endpoint copied"); }}><Copy /> Copy Search Endpoint</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Joke dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{currentJoke?.id ? `Joke — ${currentJoke.id}` : "Joke"}</DialogTitle>
          </DialogHeader>

          <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            {currentJoke ? (
              <div className="text-xl md:text-2xl text-center">{currentJoke.joke}</div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm opacity-60">No joke</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">From icanhazdadjoke.com</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (currentJoke?.id) window.open(`https://icanhazdadjoke.com/j/${currentJoke.id}`, "_blank", "noreferrer"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
