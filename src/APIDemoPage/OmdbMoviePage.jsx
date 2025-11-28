// src/pages/OmdbMoviePage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  ImageIcon,
  List,
  Film,
  Calendar,
  Clock,
  Star,
  Award,
  Users,
  Globe,
  Tag,
  Video,
  Slash,
  Menu,
  Check,
  X,
  RefreshCw,
  Code,
  Sidebar
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"; // adjust path if needed

/* ---------- OMDb endpoints ---------- */
/*
  Details by title:  https://www.omdbapi.com/?t=Inception&apikey=YOUR_API_KEY
  Details by id:     https://www.omdbapi.com/?i=tt1375666&apikey=YOUR_API_KEY
  Search (suggestions): https://www.omdbapi.com/?s=batman&apikey=YOUR_API_KEY
*/
const BASE = "https://www.omdbapi.com/";
const API_KEY = "8f8f19d3"; // replace or wire to env (preferred)

const DEFAULT_MOVIE = "Inception";
const DEFAULT_MSG = "Search by movie title (e.g. 'Inception', 'The Matrix')";

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

// sample quick list (10 items). Replace with dynamic fetch if desired.
const QUICK_TITLES = [
  "Inception",
  "The Matrix",
  "Interstellar",
  "The Dark Knight",
  "Pulp Fiction",
  "Fight Club",
  "The Shawshank Redemption",
  "Forrest Gump",
  "The Lord of the Rings: The Fellowship of the Ring",
  "The Godfather"
];

export default function OmdbMoviePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [query, setQuery] = useState(DEFAULT_MOVIE);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [movie, setMovie] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingMovie, setLoadingMovie] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);

  const suggestTimer = useRef(null);

  // copy button state: 'idle' | 'copying' | 'copied'
  const [copyState, setCopyState] = useState("idle");

  // sidebar quick list "randomized" state
  const [quickList, setQuickList] = useState(shuffleArray(QUICK_TITLES));

  function shuffleArray(arr) {
    // simple fisher-yates clone
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- fetch helpers ---------- */
  async function fetchMovieByTitle(t) {
    if (!t || !t.trim()) {
      showToast("info", DEFAULT_MSG);
      return;
    }
    setLoadingMovie(true);
    try {
      const url = `${BASE}?apikey=${API_KEY}&t=${encodeURIComponent(t.trim())}&plot=full`;
      const res = await fetch(url);
      const json = await res.json();
      setRawResp(json);
      if (json.Response === "False") {
        setMovie(null);
        showToast("error", json.Error || "Movie not found");
      } else {
        setMovie(json);
        showToast("success", `${json.Title} (${json.Year}) loaded`);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch movie");
    } finally {
      setLoadingMovie(false);
    }
  }

  async function fetchMovieById(imdbID) {
    if (!imdbID) return;
    setLoadingMovie(true);
    try {
      const url = `${BASE}?apikey=${API_KEY}&i=${encodeURIComponent(imdbID)}&plot=full`;
      const res = await fetch(url);
      const json = await res.json();
      setRawResp(json);
      if (json.Response === "False") {
        setMovie(null);
        showToast("error", json.Error || "Movie not found by ID");
      } else {
        setMovie(json);
        showToast("success", `${json.Title} (${json.Year}) loaded`);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch movie by id");
    } finally {
      setLoadingMovie(false);
    }
  }

  async function searchMovies(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const url = `${BASE}?apikey=${API_KEY}&s=${encodeURIComponent(q.trim())}`;
      const res = await fetch(url);
      const json = await res.json();
      const hits = json?.Search ?? [];
      setSuggestions(hits);
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
      searchMovies(v);
    }, 300);
  }

  async function onSubmitSearch(e) {
    e?.preventDefault?.();
    await fetchMovieByTitle(query);
    setShowSuggest(false);
    setSheetOpen(false);
  }

  function copyEndpoint() {
    if (copyState === "copying") return;
    const url = `${BASE}?apikey=${API_KEY}&t=${encodeURIComponent(query || DEFAULT_MOVIE)}&plot=full`;
    setCopyState("copying");
    navigator.clipboard.writeText(url).then(() => {
      setCopyState("copied");
      showToast("success", "Endpoint copied");
      // reset after short delay
      setTimeout(() => setCopyState("idle"), 1800);
    }).catch(() => {
      setCopyState("idle");
      showToast("error", "Copy failed");
    });
  }

  function downloadJSON() {
    const payload = rawResp || movie || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safeName = (movie?.Title || query || "movie").replace(/\s+/g, "_");
    a.download = `omdb_${safeName}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "JSON downloaded");
  }

  function refreshQuickList() {
    setQuickList(shuffleArray(QUICK_TITLES));
    showToast("success", "Quick list refreshed");
  }

  useEffect(() => {
    // initial load
    fetchMovieByTitle(DEFAULT_MOVIE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- small UI helpers ---------- */
  const posterAvailable = movie?.Poster && movie.Poster !== "N/A";
  const ratingList = Array.isArray(movie?.Ratings) ? movie.Ratings : [];

  return (
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Mobile menu (sheet trigger) */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 md:hidden cursor-pointer" aria-label="Open quick list">
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className={clsx(isDark ? "bg-black/90" : "bg-white")}>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sidebar /> Quick picks
                </SheetTitle>
                <div className="text-xs opacity-60 mt-1">Tap to load a movie</div>
              </SheetHeader>

              <div className="p-2">
                <div className="flex items-center gap-2 mb-2">
                  <Button variant="ghost" className="flex-1 cursor-pointer" onClick={refreshQuickList}><RefreshCw /> Refresh</Button>
                  <Button variant="outline" className="cursor-pointer" onClick={() => { setSheetOpen(false); }}><X /></Button>
                </div>

                <ScrollArea className="h-[60vh]">
                  <div className="space-y-2 p-1">
                    {quickList.map((t, i) => (
                      <motion.button
                        key={t + i}
                        onClick={() => { fetchMovieByTitle(t); setSheetOpen(false); }}
                        whileHover={{ scale: 1.02 }}
                        className="w-full text-left p-3 rounded-md border hover:shadow cursor-pointer flex items-center gap-3"
                      >
                        <Film className="shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">{t}</div>
                          <div className="text-xs opacity-60">Quick pick</div>
                        </div>
                        <ChevronRightIcon className="opacity-60" />
                      </motion.button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <SheetFooter className="p-3">
                <div className="text-xs opacity-60">Powered by OMDb</div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">Revolyx — Movie Inspector</h1>
            <p className="text-xs opacity-60 hidden md:block">OMDb-powered movie inspector — poster viewer, raw output, and dev tools.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={onSubmitSearch} className={clsx("flex items-center gap-2 sm:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder={DEFAULT_MSG}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" variant="outline" className="px-3 cursor-pointer">Search</Button>
            <Button type="button" variant="ghost" onClick={() => fetchMovieByTitle(DEFAULT_MOVIE)} title="Load default" className="cursor-pointer">
              <Film />
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => refreshQuickList()}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-md border cursor-pointer"
              title="Refresh quick list"
            >
              <RefreshCw />
            </motion.button>
          </div>
        </div>

       
      </header>

      {/* Suggestions dropdown (small search area for mobile as well) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s.imdbID || s.Title || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setQuery(s.Title); fetchMovieById(s.imdbID); setShowSuggest(false); }}>
                <div className="flex items-center gap-3">
                  <img src={s.Poster && s.Poster !== "N/A" ? s.Poster : ""} alt={s.Title} className="w-12 h-16 object-cover rounded-sm bg-zinc-100" />
                  <div className="flex-1">
                    <div className="font-medium">{s.Title}</div>
                    <div className="text-xs opacity-60">{s.Year} • {s.Type}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.imdbID}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left/Main: Desktop sidebar (quick picks) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-3 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold flex items-center gap-2"><Sidebar /> Quick picks</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={refreshQuickList} className="p-2 cursor-pointer"><RefreshCw /></Button>
            </div>
          </div>

          <ScrollArea className="h-[48vh]">
            <div className="space-y-2">
              {quickList.map((t, i) => (
                <motion.button
                  key={t + i}
                  onClick={() => fetchMovieByTitle(t)}
                  whileHover={{ scale: 1.01 }}
                  className="w-full text-left p-3 rounded-md border hover:shadow cursor-pointer flex items-center gap-3"
                >
                  <Film className="shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{t}</div>
                    <div className="text-xs opacity-60">Quick pick</div>
                  </div>
                  <div className="text-xs opacity-60">Load</div>
                </motion.button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main content */}
        <section className="lg:col-span-7">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex flex-wrap items-start justify-between gap-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-3">
                  <Film />
                  <span>{movie ? `${movie.Title} ${movie?.Year ? `(${movie.Year})` : ""}` : "Movie details"}</span>
                </CardTitle>
                <div className="text-xs opacity-60">{movie?.Type ? `${movie.Type} • ${movie?.Runtime ?? "-"}` : "Loaded by OMDb"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => fetchMovieByTitle(query)} className="cursor-pointer"><Loader2 className={loadingMovie ? "animate-spin" : ""} /> Refresh</Button>

                <Button variant="ghost" onClick={() => setShowRaw(s => !s)} className="cursor-pointer"><Code /> {showRaw ? "Hide Raw" : "Raw"}</Button>

                <Button variant="ghost" onClick={() => setDialogOpen(true)} disabled={!posterAvailable} className="cursor-pointer"><ImageIcon /> Poster</Button>

                
              </div>
            </CardHeader>

            <CardContent>
              {loadingMovie ? (
                <div className="py-16 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !movie ? (
                <div className="py-12 text-center text-sm opacity-60">No movie found — try another title.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Poster */}
                  <div className={clsx("rounded-xl p-3 flex flex-col items-center", isDark ? "bg-black/20 border border-zinc-800" : "bg-white/70 border border-zinc-200")}>
                    {posterAvailable ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={movie.Poster} alt={movie.Title} className="w-full rounded-md mb-3 object-cover shadow-sm" />
                    ) : (
                      <div className="w-full h-64 rounded-md mb-3 bg-zinc-100 flex items-center justify-center">
                        <Slash className="opacity-30" />
                      </div>
                    )}

                    <div className="text-center">
                      <div className="text-lg font-semibold">{movie.Title}</div>
                      <div className="mt-1 text-sm opacity-70">{movie.Year} • {movie.Rated ?? "—"} • <Clock className="inline-block align-text-bottom" /> {movie.Runtime ?? "—"}</div>
                      <div className="mt-3 flex flex-wrap gap-2 justify-center">
                        {(movie.Genre || "").split(",").map(g => g.trim()).filter(Boolean).slice(0,6).map(g => (
                          <span key={g} className="text-xs px-2 py-1 rounded-full border">{g}</span>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div className="text-xs opacity-60">Language</div>
                        <div className="font-medium">{movie.Language ?? "—"}</div>
                        <div className="text-xs opacity-60">Country</div>
                        <div className="font-medium">{movie.Country ?? "—"}</div>
                        <div className="text-xs opacity-60">Type</div>
                        <div className="font-medium">{movie.Type ?? "—"}</div>
                        <div className="text-xs opacity-60">IMDB ID</div>
                        <div className="font-medium">{movie.imdbID ?? "—"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Details (takes 2 columns on md) */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="p-4 rounded-xl border" style={{ minHeight: 120 }}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0"><Star /></div>
                        <div className="flex-1">
                          <div className="text-xs opacity-60">Plot</div>
                          <div className="mt-2 text-sm leading-relaxed">{movie.Plot ?? "—"}</div>
                          <div className="mt-3 text-xs opacity-60"><Award className="inline-block mr-1" /> Awards: <span className="font-medium">{movie.Awards ?? "—"}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border">
                        <div className="flex items-center gap-2 mb-2"><Users /> <div className="text-xs opacity-60">Crew</div></div>
                        <div className="text-xs opacity-60">Director</div>
                        <div className="font-medium">{movie.Director ?? "—"}</div>

                        <div className="mt-3 text-xs opacity-60">Writer</div>
                        <div className="font-medium">{movie.Writer ?? "—"}</div>

                        <div className="mt-3 text-xs opacity-60">Actors</div>
                        <div className="font-medium">{movie.Actors ?? "—"}</div>
                      </div>

                      <div className="p-4 rounded-xl border">
                        <div className="flex items-center gap-2 mb-2"><Globe /> <div className="text-xs opacity-60">Production</div></div>
                        <div className="text-xs opacity-60">Box Office</div>
                        <div className="font-medium">{movie.BoxOffice ?? "—"}</div>

                        <div className="mt-3 text-xs opacity-60">Production</div>
                        <div className="font-medium">{movie.Production ?? "—"}</div>

                        <div className="mt-3 text-xs opacity-60">Website</div>
                        <div className="font-medium">
                          {movie.Website && movie.Website !== "N/A" ? <a href={movie.Website} target="_blank" rel="noreferrer" className="underline"><ExternalLink className="inline-block mr-1" /> {movie.Website}</a> : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2"><Tag /> <div className="text-sm opacity-60">Ratings</div></div>
                        <div className="text-xs opacity-60">IMDB: {movie.imdbRating ?? "—"} ({movie.imdbVotes ?? "—"} votes)</div>
                      </div>

                      <div className="space-y-2">
                        {ratingList.length > 0 ? ratingList.map(r => (
                          <div key={r.Source} className="flex items-center gap-3">
                            <div className="w-28 text-xs opacity-70">{r.Source}</div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{r.Value}</div>
                              {/* optional: simple visual bar for percentage-like values */}
                              {/\d+/.test(r.Value) && (
                                <div className="h-2 rounded-full bg-zinc-200 mt-1 overflow-hidden">
                                  <div style={{ width: (() => {
                                    const v = r.Value;
                                    if (v.includes("%")) return v;
                                    const slash = v.split("/");
                                    if (slash.length === 2) {
                                      const num = parseFloat(slash[0]);
                                      const den = parseFloat(slash[1]);
                                      if (!isNaN(num) && !isNaN(den) && den > 0) return `${Math.max(0, Math.min(100, (num/den)*100))}%`;
                                    }
                                    return "50%";
                                  })() }} className="h-full bg-emerald-500/80" />
                                </div>
                              )}
                            </div>
                          </div>
                        )) : (
                          <div className="text-sm opacity-60">No ratings available</div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 text-xs opacity-60 rounded-md border">
                      <div><strong>Metascore:</strong> {movie.Metascore ?? "—"}</div>
                      <div><strong>DVD Release:</strong> {movie.DVD ?? "—"}</div>
                      <div><strong>Rated:</strong> {movie.Rated ?? "—"}</div>
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

        {/* Right: Developer / Metadata */}
        <aside className={clsx("lg:col-span-2 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold flex items-center gap-2"><Code /> Developer</div>
              <div className="text-xs opacity-60">Endpoint</div>
            </div>

            <div className="text-sm opacity-70 mb-3">Use your OMDb API key. Prefer server-side proxy for production to keep the key secret.</div>

            <div className="flex flex-col gap-2">
              <Button className="flex-1 cursor-pointer" variant="outline" onClick={copyEndpoint}><Copy /> Copy Endpoint</Button>
              <Button className="flex-1 cursor-pointer" variant="outline" onClick={downloadJSON}><Download /> Download</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick info</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-xs opacity-60">Title</div>
              <div className="font-medium">{movie?.Title ?? "—"}</div>

              <div className="text-xs opacity-60">Year</div>
              <div className="font-medium">{movie?.Year ?? "—"}</div>

              <div className="text-xs opacity-60">IMDB</div>
              <div className="font-medium">{movie?.imdbRating ?? "—"}</div>

              <div className="text-xs opacity-60">Runtime</div>
              <div className="font-medium">{movie?.Runtime ?? "—"}</div>

              <div className="text-xs opacity-60">Genre</div>
              <div className="font-medium">{movie?.Genre ?? "—"}</div>

              <div className="text-xs opacity-60">Language</div>
              <div className="font-medium">{movie?.Language ?? "—"}</div>
            </div>
          </div>

          <Separator />

          <div className="text-xs opacity-60">Tip: For a production app, call OMDb from a server route that stores the API key, then the client calls your route.</div>
        </aside>
      </main>

      {/* Poster dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{movie?.Title || "Poster"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "65vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {posterAvailable ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={movie.Poster} alt={movie.Title} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">Poster not available</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Poster source: OMDb</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => movie?.Website && window.open(movie.Website, "_blank")} className="cursor-pointer"><ExternalLink /> Open</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* local helper icon used in the quick list (small fallback) */
function ChevronRightIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
