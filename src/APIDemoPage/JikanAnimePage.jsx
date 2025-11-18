// src/pages/JikanAnimePage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  ImageIcon,
  Loader2,
  Copy,
  Download,
  Share2,
  X,
  List,
  Calendar,
  Star,
  Tag,
  Film,
  Users,
  Clock,
  Play
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/*
  Jikan Anime Search Page
  - Default search: naruto
  - Suggestions while typing
  - Layout: left (thumb/meta) | center (details) | right (actions)
  - No local storage / favorites
*/

const BASE_ENDPOINT = "https://api.jikan.moe/v4/anime";

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function getImageFromEntry(entry) {
  // Jikan v4: entry.images.jpg.image_url or entry.images.webp.image_url
  return (
    entry?.images?.jpg?.image_url ||
    entry?.images?.webp?.image_url ||
    entry?.image_url || // fallback
    ""
  );
}

export default function JikanAnimePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [query, setQuery] = useState("naruto");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [current, setCurrent] = useState(null); // selected anime entry
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const suggestTimer = useRef(null);

  // Fetch default (naruto) on mount
  useEffect(() => {
    fetchAnime(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAnime(q) {
    if (!q) return;
    setLoading(true);
    try {
      const url = `${BASE_ENDPOINT}?q=${encodeURIComponent(q)}&limit=12`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Failed to fetch (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setRawResp(json);
      const first = Array.isArray(json?.data) && json.data.length > 0 ? json.data[0] : null;
      if (first) {
        setCurrent(first);
        showToast("success", `Loaded: ${first.title}`);
      } else {
        setCurrent(null);
        showToast("info", "No results found.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Fetch error");
    } finally {
      setLoading(false);
    }
  }

  async function searchSuggest(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const url = `${BASE_ENDPOINT}?q=${encodeURIComponent(q)}&limit=8`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(Array.isArray(json?.data) ? json.data : []);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      searchSuggest(v);
    }, 350);
  }

  function onSubmitSearch(e) {
    e?.preventDefault?.();
    setShowSuggest(false);
    fetchAnime(query);
  }

  function chooseSuggestion(item) {
    setCurrent(item);
    setRawResp({ data: [item] });
    setShowSuggest(false);
    setQuery(item.title || "");
  }

  function copyToClipboard() {
    if (!current) return showToast("info", "No anime selected");
    navigator.clipboard.writeText(prettyJSON(current));
    showToast("success", "Copied JSON");
  }

  function downloadJSON() {
    const payload = rawResp || current;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `jikan_${(current?.title || "anime").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  async function tryShare() {
    const payload = current || rawResp;
    if (!navigator?.share) {
      showToast("info", "Web Share not supported");
      return;
    }
    try {
      await navigator.share({
        title: current?.title || "Anime",
        text: current?.synopsis || current?.title,
        url: current?.url || current?.mal_id ? `https://myanimelist.net/anime/${current.mal_id}` : undefined
      });
    } catch (err) {
      // user cancelled share or error
    }
  }

  // Helpers to render arrays nicely
  function joinNames(arr, key = "name") {
    if (!Array.isArray(arr)) return "—";
    return arr.map((a) => (typeof a === "string" ? a : a?.[key] || "")).filter(Boolean).join(", ") || "—";
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Jikan — Anime Search</h1>
          <p className="mt-1 text-sm opacity-70">Search anime via the unofficial MyAnimeList API (Jikan). No API key required.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={onSubmitSearch} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search anime, e.g. 'Naruto', 'One Piece'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => fetchAnime(query)}>
              Top
            </Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s) => (
              <li key={s.mal_id || s.title} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseSuggestion(s)}>
                <div className="flex items-center gap-4">
                  <img src={getImageFromEntry(s)} alt={s.title} className="w-14 h-10 object-cover rounded-sm flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.title}</div>
                    <div className="text-xs opacity-60 truncate">{s.title_english || s.title_japanese || s.type || "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.score ? `${s.score} ★` : "—"}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout: left | center | right */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left column: thumbnail + compact meta */}
        <section className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center gap-3", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Preview</CardTitle>
                <div className="text-xs opacity-60">{current?.title || "No anime selected"}</div>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No anime loaded — try searching.</div>
              ) : (
                <div className={clsx("p-3 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  <img src={getImageFromEntry(current)} alt={current.title} className="w-full rounded-md object-cover mb-3" />
                  <div className="text-lg font-semibold leading-tight">{current.title}</div>
                  <div className="text-xs opacity-60 mb-2">{current.title_english ? `${current.title_english}` : ""}</div>

                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-xs opacity-70"><Star className="w-4 h-4" /> <span>{current.score ?? "—"}</span></div>
                    <div className="flex items-center gap-2 text-xs opacity-70 mt-2"><Tag className="w-4 h-4" /> <span>{current.rating ?? "—"}</span></div>
                    <div className="flex items-center gap-2 text-xs opacity-70 mt-2"><Clock className="w-4 h-4" /> <span>{current.duration ?? "—"}</span></div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(true)}><ImageIcon /> View image</Button>
                    <Button variant="ghost" onClick={() => { if (current.url) window.open(current.url, "_blank"); else showToast("info", "No external URL"); }}><ExternalLink /> Open on MAL</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Center column: full details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-start justify-between gap-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-extrabold leading-tight">{current?.title || "Anime Details"}</h2>
                <div className="mt-1 text-sm opacity-60">{current?.title_english || current?.title_japanese || ""}</div>
                <div className="mt-3 text-xs opacity-60 flex flex-wrap gap-2">
                  <span>{current?.type ?? "—"}</span>
                  <span>•</span>
                  <span>{current?.episodes ?? "—"} eps</span>
                  <span>•</span>
                  <span>{current?.status ?? "—"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fetchAnime(query)}><Loader2 className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide JSON" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> Image</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-8 text-center text-sm opacity-60">Search to load anime details.</div>
              ) : (
                <div className="space-y-4">
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold mb-2">Synopsis</h3>
                    <p className="text-sm leading-relaxed">{current.synopsis || "No synopsis available."}</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs opacity-60">Studios</div>
                        <div className="font-medium">{joinNames(current.studios)}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Genres</div>
                        <div className="font-medium">{joinNames(current.genres)}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Themes</div>
                        <div className="font-medium">{joinNames(current.themes)}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-xs opacity-60">Aired</div>
                        <div className="font-medium">{current.aired?.string ?? (current?.aired?.from ? `${current.aired.from} → ${current.aired.to}` : "—")}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Popularity / Rank</div>
                        <div className="font-medium">{current.popularity ?? "—"} / #{current.rank ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Trailer</div>
                        <div className="font-medium">
                          {current.trailer?.url ? (
                            <a href={current.trailer.url} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-2"><Play className="w-4 h-4" /> Watch trailer</a>
                          ) : "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-xs opacity-60 mb-2">Additional Fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 rounded-md border"><div className="text-xs opacity-60">Type</div><div className="text-sm font-medium">{current.type ?? "—"}</div></div>
                      <div className="p-2 rounded-md border"><div className="text-xs opacity-60">Episodes</div><div className="text-sm font-medium">{current.episodes ?? "—"}</div></div>
                      <div className="p-2 rounded-md border"><div className="text-xs opacity-60">Score</div><div className="text-sm font-medium">{current.score ?? "—"}</div></div>
                      <div className="p-2 rounded-md border"><div className="text-xs opacity-60">Rated</div><div className="text-sm font-medium">{current.rating ?? "—"}</div></div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 320 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right column: quick actions and metadata */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div>
              <div className="text-sm font-semibold mb-1">Quick Actions</div>
              <div className="text-xs opacity-60 mb-3">Open, share, copy or download data about the selected anime.</div>

              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => { if (current?.url) window.open(current.url, "_blank"); else showToast("info", "No URL available"); }}><ExternalLink /> Open on MAL</Button>
                <Button variant="outline" onClick={() => copyToClipboard()}><Copy /> Copy JSON</Button>
                <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
                <Button variant="outline" onClick={() => tryShare()}><Share2 /> Share</Button>
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> Toggle JSON</Button>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <div className="text-sm font-semibold mb-1">API Info</div>
              <div className="text-xs opacity-60">Endpoint: <code className="break-words">{BASE_ENDPOINT}?q={encodeURIComponent(query)}</code></div>
              <div className="mt-2 text-xs opacity-60">Response: <span className="font-medium">{rawResp?.data ? `${rawResp.data.length} item(s)` : "—"}</span></div>
            </div>
          </Card>

          {/* Small metadata card */}
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div>
              <div className="text-sm font-semibold mb-1">Selected</div>
              <div className="text-xs opacity-60">{current ? `${current.title}` : "None"}</div>
              <Separator className="my-3" />
              <div className="text-xs opacity-60">Type: <span className="font-medium">{current?.type ?? "—"}</span></div>
              <div className="text-xs opacity-60 mt-1">Episodes: <span className="font-medium">{current?.episodes ?? "—"}</span></div>
              <div className="text-xs opacity-60 mt-1">Score: <span className="font-medium">{current?.score ?? "—"}</span></div>
            </div>
          </Card>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{current?.title || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {getImageFromEntry(current) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getImageFromEntry(current)} alt={current?.title} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from Jikan / MAL</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (current?.url) window.open(current.url, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
