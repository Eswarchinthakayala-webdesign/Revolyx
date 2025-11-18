// NekosBestPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  ImageIcon,
  List,
  Loader2,
  Copy,
  Download,
  RefreshCw,
  EyeOff,
  Eye,
  Tag
} from "lucide-react";
// add this import near your other UI imports
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * Categories supported by nekos.best (images + GIFs)
 */
const CATEGORIES = [
  // Images
  "husbando",
  "kitsune",
  "neko",
  "waifu",
  // GIFs
  "angry",
  "baka",
  "bite",
  "blush",
  "bored",
  "cry",
  "cuddle",
  "dance",
  "facepalm",
  "feed",
  "handhold",
  "handshake",
  "happy",
  "highfive",
  "hug",
  "kick",
  "kiss",
  "laugh",
  "lurk",
  "nod",
  "nom",
  "nope",
  "pat",
  "peck",
  "poke",
  "pout",
  "punch",
  "run",
  "shoot",
  "shrug",
  "slap",
  "sleep",
  "smile",
  "smug",
  "stare",
  "think",
  "thumbsup",
  "tickle",
  "wave",
  "wink",
  "yawn",
  "yeet"
];

const API_BASE = "https://nekos.best/api/v2";
const PREFETCH_COUNT = 8; // how many items to prefetch for suggestions
const DEFAULT_CATEGORY = "neko";

function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

/* helper: fetch one sample for a given category */
async function fetchSampleForCategory(category) {
  const url = `${API_BASE}/${encodeURIComponent(category)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  const json = await res.json();
  return json;
}

export default function NekosBestPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [query, setQuery] = useState("");
  const [pool, setPool] = useState([]); // prefetched suggestions for current category
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [selected, setSelected] = useState(null); // selected item (object)
  const [rawResp, setRawResp] = useState(null); // raw API response for selected
  const [loadingSelected, setLoadingSelected] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const suggestTimer = useRef(null);
  const [imgError, setImgError] = useState(false);

  // helper: preview slice
  const mergedPreview = (list) => (list || []).slice(0, 8);

  // Prefetch pool for given category
  async function prefetchPoolForCategory(cat, n = PREFETCH_COUNT) {
    setLoadingSuggest(true);
    try {
      const promises = Array.from({ length: n }).map(() =>
        fetchSampleForCategory(cat).catch((e) => {
          console.warn("prefetch failed", e);
          return null;
        })
      );
      const results = await Promise.all(promises);
      const items = results
        .filter(Boolean)
        .flatMap((r) => Array.isArray(r.results) ? r.results : [])
        .filter(Boolean);

      const unique = [];
      const seen = new Set();
      for (const it of items) {
        if (!seen.has(it.url)) {
          seen.add(it.url);
          unique.push(it);
        }
      }
      setPool((prev) => {
        // replace pool for new category to avoid mixing categories
        // but ensure we keep unique
        const merged = [...unique];
        return merged.slice(0, Math.max(n, 20));
      });
      setSuggestions(unique.length ? mergedPreview(unique) : []);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to prefetch samples");
    } finally {
      setLoadingSuggest(false);
    }
  }

  // Select an item or API response
  function selectItem(itemOrResp) {
    setImgError(false);
    if (!itemOrResp) return;
    if (itemOrResp.results) {
      const item = Array.isArray(itemOrResp.results) ? itemOrResp.results[0] : null;
      setSelected(item);
      setRawResp(itemOrResp);
      // ensure item in pool
      setPool(prev => prev.some(p => p.url === item?.url) ? prev : item ? [item, ...prev].slice(0, 40) : prev);
    } else {
      setSelected(itemOrResp);
      setRawResp({ results: [itemOrResp] });
      setPool(prev => prev.some(p => p.url === itemOrResp.url) ? prev : [itemOrResp, ...prev].slice(0, 40));
    }
  }

  // On category change: clear pool, load default sample and prefetch
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingSelected(true);
      setPool([]);
      setSuggestions([]);
      setSelected(null);
      setRawResp(null);
      try {
        const resp = await fetchSampleForCategory(category);
        if (!mounted) return;
        selectItem(resp);
        // prefetch pool in background
        prefetchPoolForCategory(category, PREFETCH_COUNT);
      } catch (err) {
        console.error(err);
        showToast("error", `Failed to load samples for "${category}"`);
      } finally {
        if (mounted) setLoadingSelected(false);
      }
    })();
    return () => { mounted = false; if (suggestTimer.current) clearTimeout(suggestTimer.current); };
  }, [category]);

  // Debounced filtering of pool when query changes
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const q = String(v || "").trim().toLowerCase();
      if (!q) {
        setSuggestions(mergedPreview(pool));
        setLoadingSuggest(false);
        return;
      }
      setLoadingSuggest(true);
      const filtered = pool.filter(it => {
        const artist = (it.artist_name || "").toLowerCase();
        const src = (it.source_url || "").toLowerCase();
        const u = (it.url || "").toLowerCase();
        return artist.includes(q) || src.includes(q) || u.includes(q);
      });
      setSuggestions(filtered.length ? filtered : mergedPreview(pool));
      setLoadingSuggest(false);
    }, 200);
  }

  // Submit search: fetch fresh sample for current category
  async function onSearchSubmit(e) {
    e?.preventDefault?.();
    setLoadingSelected(true);
    try {
      const resp = await fetchSampleForCategory(category);
      selectItem(resp);
      // add to pool
      const items = Array.isArray(resp.results) ? resp.results : [];
      setPool(prev => [...items, ...prev].filter((it, idx, arr) => arr.findIndex(a => a.url === it.url) === idx).slice(0, 40));
      setShowSuggest(false);
      showToast("success", "Loaded new sample");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch sample");
    } finally {
      setLoadingSelected(false);
    }
  }

  // Quick actions
  function openInNewTab() {
    if (!selected?.url) return showToast("info", "No image");
    window.open(selected.url, "_blank", "noopener");
  }
  function copyUrl() {
    if (!selected?.url) return showToast("info", "No image URL");
    navigator.clipboard.writeText(selected.url);
    showToast("success", "Image URL copied");
  }
  function downloadImage() {
    if (!selected?.url) return showToast("info", "No image to download");
    const a = document.createElement("a");
    a.href = selected.url;
    const name = selected.url.split("/").pop() || `${category}.png`;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("success", "Download started");
  }

  function handleImgError(e) {
    console.warn("Image failed to load:", e?.target?.src);
    setImgError(true);
  }

  const shownSuggestions = useMemo(() => {
    if (showSuggest && suggestions && suggestions.length > 0) return suggestions.slice(0, 8);
    return mergedPreview(pool);
  }, [showSuggest, suggestions, pool]);

  return (
    <div className={clsx("min-h-screen p-6 overflow-hidden max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>NekosBest — Anime GIFs & Images</h1>
          <p className="mt-1 text-sm opacity-70">Choose a category, discover images & GIFs. No API key required.</p>
        </div>

        {/* Category select + search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className={clsx("flex items-center gap-2 rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
         <label htmlFor="category" className="sr-only">Category</label>

<Select
  value={category}
  onValueChange={(val) => setCategory(val)}
  aria-label="Select category"
>
  <SelectTrigger
    id="category"
    className={clsx(
      "w-40 bg-transparent cursor-pointer text-sm px-2 py-1",
      isDark ? "text-zinc-100" : "text-zinc-900"
    )}
  >
    <SelectValue placeholder="Category" />
  </SelectTrigger>

  <SelectContent>
    <SelectGroup>
      <SelectLabel>Categories</SelectLabel>
      {CATEGORIES.map((c) => (
        <SelectItem  key={c} value={c} className="capitalize cursor-pointer">
          {c}
        </SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>


            {/* quick chips for a few popular categories */}
            <div className="hidden md:flex items-center gap-2 ml-2">
              {["neko","waifu","hug","kiss"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={clsx("text-xs px-2 py-1 rounded-md", category === c ? "bg-zinc-900/80 text-white" : "bg-zinc-100/60 dark:bg-zinc-800/40")}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={onSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search neko by artist or source"
              placeholder="Filter suggestions by artist or source (optional)..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" onClick={() => prefetchPoolForCategory(category, PREFETCH_COUNT)} className="px-3"><RefreshCw /></Button>
            <Button type="submit" variant="outline" className="px-3">{loadingSelected ? <Loader2 className="animate-spin" /> : <Search />}</Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && shownSuggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_310px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {shownSuggestions.map((s, idx) => (
              <li key={s.url || idx} onClick={() => { selectItem(s); setShowSuggest(false); }} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <img src={s.url} alt={s.artist_name || "neko"} className="w-12 h-8 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="font-medium">{s.artist_name || "Unknown"}</div>
                    <div className="text-xs opacity-60">{s.source_url ? (new URL(s.source_url).hostname) : "direct"}</div>
                  </div>
                  <div className="text-xs opacity-60">{idx + 1}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: vertical thumbnail rail (hidden on mobile) */}
        <aside className="lg:col-span-2 hidden lg:block">
          <div className={clsx("space-y-3 sticky top-24")}>
            <div className={clsx("text-sm font-semibold mb-2", isDark ? "text-zinc-200" : "")}>Gallery — {category}</div>
            <div className="space-y-2">
              {pool.length === 0 && <div className="text-xs opacity-60">No samples</div>}
              {pool.map((p, i) => (
                <button key={p.url} onClick={() => selectItem(p)} className={clsx("w-full rounded-md overflow-hidden border p-0", isDark ? "border-zinc-800" : "border-zinc-200")}>
                  <img
                    src={p.url}
                    alt={p.artist_name || `neko-${i}`}
                    onError={(e) => e.currentTarget.src = ""}
                    className={clsx("w-full h-20 object-cover transition-transform hover:scale-105")}
                  />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: selected item + details */}
        <section className="lg:col-span-7">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-start justify-between gap-4", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg capitalize">{category} — Selected</CardTitle>
                <div className="text-xs opacity-60">{selected?.artist_name ? `${selected.artist_name} — ${selected.source_url ? (new URL(selected.source_url).hostname) : "direct"}` : "No selection yet"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { prefetchPoolForCategory(category, PREFETCH_COUNT); showToast("info", "Prefetch triggered"); }}><RefreshCw /></Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => setImageOpen(true)}><ImageIcon /></Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingSelected ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selected ? (
                <div className="py-12 text-center text-sm opacity-60">No image selected. Use search or click a thumbnail.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Image */}
                  <div className="md:col-span-7">
                    <div className="rounded-xl overflow-hidden border mb-3">
                      {!imgError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selected.url}
                          alt={selected.artist_name || category}
                          onError={handleImgError}
                          className="w-full h-[480px] object-contain bg-zinc-900/5"
                          style={{ maxHeight: 640 }}
                        />
                      ) : (
                        <div className="w-full h-[420px] flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded">
                          <div className="text-sm opacity-60">Image unavailable</div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-xs opacity-60">Artist</div>
                        <div className="font-medium">{selected.artist_name || "Unknown"}</div>
                        {selected.artist_href && (
                          <div className="mt-1 text-xs">
                            <a href={selected.artist_href} target="_blank" rel="noreferrer" className="underline">{selected.artist_href}</a>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Source</div>
                        <div className="text-sm">
                          {selected.source_url ? (
                            <a href={selected.source_url} className="underline" target="_blank" rel="noreferrer">{selected.source_url}</a>
                          ) : "Direct API"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Image URL</div>
                        <div className="text-sm break-words">{selected.url}</div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata / actions (right-of-center) */}
                  <div className="md:col-span-5">
                    <div className={clsx("rounded-xl p-4 border mb-3", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Details</div>
                        <div className="text-xs opacity-60">API data</div>
                      </div>

                      <div className="mt-3 space-y-2 text-sm">
                        <div>
                          <div className="text-xs opacity-60">Artist</div>
                          <div className="font-medium">{selected.artist_name || "—"}</div>
                        </div>

                        <div>
                          <div className="text-xs opacity-60">Source Host</div>
                          <div className="font-medium">{selected.source_url ? (new URL(selected.source_url).hostname) : "nekos.best"}</div>
                        </div>

                        <div>
                          <div className="text-xs opacity-60">Origin</div>
                          <div className="font-medium">{selected.source_url || "API / direct"}</div>
                        </div>

                        <div>
                          <div className="text-xs opacity-60">Tags</div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs px-2 py-1 rounded-md bg-zinc-100/60">#{category}</span>
                            <span className="text-xs px-2 py-1 rounded-md bg-zinc-100/60">{selected.artist_name ? "artist" : "unknown-artist"}</span>
                            <span className="text-xs px-2 py-1 rounded-md bg-zinc-100/60">anime</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl p-4 border">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Quick Actions</div>
                        <div className="text-xs opacity-60">Open / Download</div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <Button variant="outline" onClick={openInNewTab}><ExternalLink /> Open</Button>
                        <Button variant="outline" onClick={downloadImage}><Download /> Download</Button>
                        <Button variant="outline" onClick={copyUrl}><Copy /> Copy URL</Button>
                        <Button variant="outline" onClick={() => setShowRaw(s => !s)}>{showRaw ? <EyeOff /> : <List />} {showRaw ? "Hide JSON" : "View JSON"}</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw JSON inspector */}
              <AnimatePresence>
                {showRaw && rawResp && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("mt-4 rounded-xl p-3 border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-xs opacity-60 mb-2">Raw API Response</div>
                    <div style={{ maxHeight: 340 }} className="overflow-auto">
                      <pre className="text-xs whitespace-pre-wrap">{prettyJSON(rawResp)}</pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* Right: small info & quick panel */}
        <aside className="lg:col-span-3">
          <div className={clsx("space-y-4 sticky top-24", isDark ? "text-zinc-200" : "")}>
            <Card className={clsx("rounded-xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
              <CardHeader className="p-4">
                <CardTitle className="text-sm">Quick Info</CardTitle>
                <div className="text-xs opacity-60 mt-1">Source & tips</div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-xs opacity-60">API Base</div>
                <div className="text-sm break-words mb-3">{API_BASE}/&lt;category&gt;</div>

                <div className="text-xs opacity-60">Notes</div>
                <ul className="text-sm list-disc ml-5 mt-2 space-y-1 opacity-80">
                  <li>No API key required.</li>
                  <li>Category controls which endpoint is used (e.g. /neko, /waifu, /hug).</li>
                  <li>If image fails to render, open in a new tab or try prefetched samples.</li>
                </ul>

                <Separator className="my-3" />

                <div className="text-xs opacity-60">Actions</div>
                <div className="mt-2 flex flex-col gap-2">
                  <Button variant="outline" onClick={() => { prefetchPoolForCategory(category, PREFETCH_COUNT); showToast("info", "Prefetching more samples"); }}>Prefetch Samples</Button>
                  <Button variant="ghost" onClick={() => { setPool([]); setSuggestions([]); showToast("info", "Cleared pool"); }}>Clear Pool</Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-xs opacity-60">
              Data from <a href="https://nekos.best" target="_blank" rel="noreferrer" className="underline">Nekos.best</a>. Built with ❤️ and lucide-react icons.
            </div>
          </div>
        </aside>
      </main>

      {/* Image modal */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden")}>
          <DialogHeader>
            <DialogTitle>{selected?.artist_name || category}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {selected?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.url} alt={selected?.artist_name || category} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image Source</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageOpen(false)}><EyeOff /></Button>
              <Button variant="outline" onClick={() => selected?.url && window.open(selected.url, "_blank")}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
