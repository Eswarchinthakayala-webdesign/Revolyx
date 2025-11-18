// AmiiboPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ImageIcon,
  ExternalLink,
  List,
  Loader2,
  Copy,
  Download,
  Calendar,
  Tag,
  Box,
  Layers,
  X,
  CheckCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper"; // optional; remove or replace if not present

// Endpoint
const API_ENDPOINT = "https://amiiboapi.com/api/amiibo/";

// UI defaults
const DEFAULT_QUERY = "Mario"; // default item search on load
const DEBOUNCE_MS = 250;

// Utility
function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

export default function AmiiboPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Data cache
  const [items, setItems] = useState([]); // full amiibo list
  const [loadingList, setLoadingList] = useState(true);
  const listAbortRef = useRef(null);

  // Search + suggestions
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const suggestTimer = useRef(null);

  // Current displayed amiibo
  const [current, setCurrent] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);

  // UI toggles
  const [showRaw, setShowRaw] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  // Fetch the master list once on mount (no API key)
  useEffect(() => {
    async function loadList() {
      setLoadingList(true);
      if (listAbortRef.current) listAbortRef.current.abort();
      const c = new AbortController();
      listAbortRef.current = c;
      try {
        const res = await fetch(API_ENDPOINT, { signal: c.signal });
        if (!res.ok) {
          console.error("Amiibo list fetch failed", res.status);
          setItems([]);
          setLoadingList(false);
          return;
        }
        const json = await res.json();
        // json.amiibo is the array
        const list = Array.isArray(json?.amiibo) ? json.amiibo : [];
        setItems(list);
        setRawResp(json);
        // pick a default hero by name fuzzy match
        const found = list.find((it) => (it.character || "").toLowerCase().includes(DEFAULT_QUERY.toLowerCase()))
                    || list[0] || null;
        setCurrent(found);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
        setItems([]);
      } finally {
        setLoadingList(false);
        listAbortRef.current = null;
      }
    }
    loadList();
    return () => {
      if (listAbortRef.current) listAbortRef.current.abort();
    };
  }, []);

  // Suggestion search (client-side filter - fast)
  function computeSuggestions(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      setLoadingSuggest(false);
      return;
    }
    setLoadingSuggest(true);
    const needle = q.toLowerCase().trim();
    // filter by character, name, amiiboSeries, gameSeries
    const filtered = items.filter((it) => {
      return (
        (it.character || "").toLowerCase().includes(needle) ||
        (it.name || "").toLowerCase().includes(needle) ||
        (it.amiiboSeries || "").toLowerCase().includes(needle) ||
        (it.gameSeries || "").toLowerCase().includes(needle)
      );
    }).slice(0, 20);
    setSuggestions(filtered);
    setLoadingSuggest(false);
    setActiveIdx(-1);
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      computeSuggestions(v);
    }, DEBOUNCE_MS);
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
  }, []);

  // Keyboard navigation for suggestions
  function onInputKeyDown(e) {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && activeIdx < suggestions.length) {
        e.preventDefault();
        pickSuggestion(suggestions[activeIdx]);
      } else {
        // fallback: pick first suggestion or search exact
        if (suggestions[0]) pickSuggestion(suggestions[0]);
      }
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  }

  // Pick a suggestion
  function pickSuggestion(item) {
    if (!item) return;
    setCurrent(item);
    setShowSuggest(false);
    setActiveIdx(-1);
    // set rawResp to the current list (we have master list), but keep item-level raw too
    setRawResp(item);
  }

  // Submit form: if exact search, choose best match
  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (suggestions.length > 0) {
      pickSuggestion(suggestions[0]);
      return;
    }
    // fallback: do a case-insensitive find among items
    const q = (query || "").toLowerCase().trim();
    const found = items.find((it) => (it.character || "").toLowerCase() === q || (it.name || "").toLowerCase() === q)
                  || items.find((it) => (it.character || "").toLowerCase().includes(q))
                  || items[0] || null;
    if (found) {
      pickSuggestion(found);
      showToast?.("success", `Showing ${found.character || found.name}`); // optional
    } else {
      showToast?.("info", `No amiibo found for "${query}"`);
    }
  }

  // Helper: pretty release table
  function ReleaseGrid({ release }) {
    if (!release || typeof release !== "object") return <div className="opacity-60">—</div>;
    const entries = Object.entries(release);
    if (entries.length === 0) return <div className="opacity-60">—</div>;
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <div className="text-xs opacity-70">{k.toUpperCase()}</div>
            <div className="font-medium text-sm">{v || "—"}</div>
          </div>
        ))}
      </div>
    );
  }

  // Image fallback component
  function AmiiboImage({ src, alt, className }) {
    const [err, setErr] = useState(false);
    if (!src || err) {
      return (
        <div className={clsx("rounded-xl w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900", className)}>
          <ImageIcon className="w-10 h-10 opacity-60" />
        </div>
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || ""}
        onError={() => setErr(true)}
        className={clsx("w-full h-full object-contain rounded-xl", className)}
      />
    );
  }

  // Quick actions (right column)
  function downloadCurrentJSON() {
    const data = current || rawResp || {};
    const blob = new Blob([prettyJSON(data)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `amiibo_${(current?.character || current?.name || "amiibo").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast?.("success", "Downloaded JSON");
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(API_ENDPOINT);
    showToast?.("success", "Endpoint copied");
  }

  const totalCount = items.length;

  // Derived fields from current
  const amiiboSeries = current?.amiiboSeries || current?.gameSeries || "—";
  const title = current?.character || current?.name || "—";
  const subtitle = current?.name && current?.character && current.name !== current.character ? current.name : "";

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Amiibo Vault</h1>
          <p className="mt-1 text-sm opacity-70">Search Nintendo Amiibo figures — series, release dates, image and appearances.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
          <Search className="opacity-60" />
          <Input
            aria-label="Search amiibo"
            placeholder="Search character, variant, series (e.g. Mario, Zelda, Smash)..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onInputKeyDown}
            onFocus={() => { setShowSuggest(true); computeSuggestions(query); }}
            className="border-0 shadow-none bg-transparent outline-none"
          />
          <Button type="button" variant="outline" onClick={() => { setQuery(DEFAULT_QUERY); computeSuggestions(DEFAULT_QUERY); }}>Default</Button>
          <Button type="submit" variant="outline"><Search /></Button>
        </form>
      </header>

      {/* Suggestion dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} role="listbox" aria-label="Amiibo suggestions" className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => {
              const active = idx === activeIdx;
              return (
                <li
                  key={`${s.head}-${s.tail}-${idx}`}
                  role="option"
                  aria-selected={active}
                  onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s); }}
                  className={clsx("px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer", active ? (isDark ? "bg-zinc-800/60" : "bg-zinc-100") : "")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0">
                      <AmiiboImage src={s.image} alt={s.character || s.name} />
                    </div>

                    <div className="flex-1">
                      <div className="font-medium">{s.character || s.name}</div>
                      <div className="text-xs opacity-60">{s.amiiboSeries} • {s.gameSeries}</div>
                    </div>

                    <div className="text-xs opacity-60">{s.type}</div>
                  </div>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout: left (image/meta) | center (details) | right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left column: image + badges */}
        <div className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Artwork</CardTitle>
              <div className="text-xs opacity-60 mt-1">High-quality amiibo image</div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="w-full h-56 rounded-xl overflow-hidden flex items-center justify-center mb-3">
                <AmiiboImage src={current?.image} alt={title} />
              </div>

              <div className="flex gap-2 items-center mb-3">
                <span className={clsx("text-xs px-2 py-1 rounded-full font-medium", isDark ? "bg-zinc-800/50" : "bg-zinc-100")}>{current?.type || "—"}</span>
                <span className={clsx("text-xs px-2 py-1 rounded-full font-medium", isDark ? "bg-zinc-800/50" : "bg-zinc-100")}>{amiiboSeries}</span>
              </div>

              <div className="text-sm">
                <div className="text-xs opacity-60">ID</div>
                <div className="font-medium">{current?.head ? `${current.head} / ${current.tail}` : "—"}</div>

                <div className="mt-3 text-xs opacity-60">Game Series</div>
                <div className="font-medium">{current?.gameSeries || "—"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center: full details */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold">{title}</h2>
                {subtitle && <div className="text-sm opacity-70 mt-1">{subtitle}</div>}
                <div className="text-xs opacity-60 mt-2">{current?.amiiboSeries} • {current?.type}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setImageOpen(true)}><ImageIcon /></Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /></Button>
                <Button variant="outline" onClick={() => window.open(current?.image || "#", "_blank")}><ExternalLink /></Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {loadingList || !current ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : (
                <>
                  <div>
                    <div className="text-sm font-semibold mb-2">Overview</div>
                    <div className="text-sm opacity-70">{current?.character && current?.name ? `${current.character} — ${current.name}` : current?.character || current?.name || "—"}</div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold mb-2">Release Dates</div>
                    <ReleaseGrid release={current?.release} />
                  </div>

                  <div>
                    <div className="text-sm font-semibold mb-2">Identifiers</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Head</div>
                        <div className="font-medium">{current?.head || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Tail</div>
                        <div className="font-medium">{current?.tail || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Type</div>
                        <div className="font-medium">{current?.type || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Game Series</div>
                        <div className="font-medium">{current?.gameSeries || "—"}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold mb-2">Full fields</div>
                    <div className="text-sm">
                      {/* Render key fields and fall back to raw JSON panel for everything else */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">Amiibo Series</div>
                          <div className="font-medium">{current?.amiiboSeries || "—"}</div>
                        </div>
                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">Character</div>
                          <div className="font-medium">{current?.character || "—"}</div>
                        </div>
                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">Name</div>
                          <div className="font-medium">{current?.name || "—"}</div>
                        </div>
                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">Release Raw</div>
                          <div className="font-medium">{current?.release ? Object.keys(current.release).join(", ") : "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <AnimatePresence>
                {showRaw && rawResp && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="p-4 border rounded-md">
                    <pre className="text-xs overflow-auto" style={{ maxHeight: 280 }}>{prettyJSON(rawResp)}</pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* Right: Quick actions & info */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold">Quick Actions</div>
                <div className="text-xs opacity-60">Utilities & endpoint</div>
              </div>
              <div className="text-xs opacity-60">{totalCount} items</div>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => downloadCurrentJSON()}><Download className="mr-2" /> Download JSON</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => copyEndpoint()}><Copy className="mr-2" /> Copy Endpoint</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setShowRaw(s => !s)}><List className="mr-2" /> Toggle Raw</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.open(current?.image || API_ENDPOINT, "_blank")}><ExternalLink className="mr-2" /> Open Image / API</Button>
            </div>

            <Separator className="my-4" />

            <div className="text-xs opacity-60">
              Tip: you can search by character, series or game. Use arrow keys to navigate suggestions and Enter to pick.
            </div>
          </Card>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="max-w-3xl w-full p-0 rounded-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {current?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.image} alt={title} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from amiiboapi.com</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (current?.image) window.open(current.image, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
