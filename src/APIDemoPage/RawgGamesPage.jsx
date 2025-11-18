// RawgGamesPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper"; // optional: replace with alert() if you don't have it

// lucide icons
import {
  Search,
  X,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  ImageIcon,
  List,
  Mic,
  MicOff,
  Filter,
  Calendar,
  Gamepad,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// UI primitives (replace with plain elements if needed)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

/* ---------- CONFIG ---------- */
const BASE_ENDPOINT = "https://api.rawg.io/api/games";
const API_KEY = "630391cdbfab488594f03b9aa6f5fa1e"; // <- Replace with your key
const DEFAULT_MSG = "Try searching: 'Elden Ring', 'Zelda', 'indie', 'racing'...";
const PAGE_SIZE = 20;

/* ---------- HELPERS ---------- */
const prettyJSON = (o) => JSON.stringify(o, null, 2);
const buildUrl = ({ q = "", page = 1, page_size = PAGE_SIZE, ordering = "" } = {}) => {
  const params = new URLSearchParams();
  params.set("key", API_KEY);
  if (q) params.set("search", q);
  params.set("page", String(page));
  params.set("page_size", String(page_size));
  if (ordering) params.set("ordering", ordering);
  return `${BASE_ENDPOINT}?${params.toString()}`;
};

/* ---------- COMPONENT ---------- */
export default function RawgGamesPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [activeSuggestIdx, setActiveSuggestIdx] = useState(-1);

  const [games, setGames] = useState([]);
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);

  const [showRaw, setShowRaw] = useState(false);
  const [screenshotOpen, setScreenshotOpen] = useState(false);
  const [screenshotSrc, setScreenshotSrc] = useState("");

  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState("-rating");

  // voice search
  const [listening, setListening] = useState(false);
  const speechRecRef = useRef(null);

  // debouncing
  const suggestTimer = useRef(null);

  /* ---------- EFFECTS: initial load ---------- */
  useEffect(() => {
    fetchGames({ q: "", page: 1, page_size: PAGE_SIZE, ordering });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordering]);

  /* ---------- Fetch helpers ---------- */
  const fetchGames = useCallback(async ({ q = "", page = 1, page_size = PAGE_SIZE, ordering = "" } = {}) => {
    setLoading(true);
    try {
      const url = buildUrl({ q, page, page_size, ordering });
      const res = await fetch(url);
      if (!res.ok) {
        showToast?.("error", `RAWG fetch failed (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setGames(json.results || []);
      setRawResp(json);
      if (json.results && json.results.length > 0) setCurrentGame(json.results[0]);
    } catch (err) {
      console.error(err);
      showToast?.("error", "Failed to fetch games");
    } finally {
      setLoading(false);
    }
  }, []);

  const searchSuggestions = useCallback(async (q) => {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const url = buildUrl({ q, page: 1, page_size: 6 });
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(json.results || []);
      setActiveSuggestIdx(-1);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }, []);

  /* ---------- Search handlers + keyboard nav ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => searchSuggestions(v), 250);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast?.("info", DEFAULT_MSG);
      return;
    }
    setPage(1);
    await fetchGames({ q: query.trim(), page: 1, page_size: PAGE_SIZE, ordering });
    setShowSuggest(false);
  }

  function handleSuggestKey(e) {
    if (!showSuggest) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeSuggestIdx >= 0 && suggestions[activeSuggestIdx]) {
        const s = suggestions[activeSuggestIdx];
        setCurrentGame(s);
        setShowSuggest(false);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  }

  /* ---------- Screenshot modal ---------- */
  function openScreenshot(src) {
    setScreenshotSrc(src);
    setScreenshotOpen(true);
  }
  function closeScreenshot() {
    setScreenshotOpen(false);
    setScreenshotSrc("");
  }

  /* ---------- Clipboard / download ---------- */
  function copyCurrentToClipboard() {
    if (!currentGame) return showToast?.("info", "No game selected");
    navigator.clipboard.writeText(prettyJSON(currentGame));
    showToast?.("success", "Copied game JSON");
  }
  function downloadRawJSON() {
    const payload = rawResp || currentGame;
    if (!payload) return showToast?.("info", "No data to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rawg_${(currentGame?.name || "games").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast?.("success", "Downloaded JSON");
  }

  /* ---------- Voice search ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      const spoken = ev.results[0][0].transcript;
      setQuery(spoken);
      setTimeout(() => handleSearchSubmit(), 200);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    speechRecRef.current = rec;
    return () => {
      try {
        speechRecRef.current?.stop?.();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleListening() {
    const rec = speechRecRef.current;
    if (!rec) {
      showToast?.("info", "Voice search not supported");
      return;
    }
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      try {
        rec.start();
        setListening(true);
      } catch (err) {
        console.warn(err);
        setListening(false);
      }
    }
  }

  /* ---------- Pagination ---------- */
  function nextPage() {
    const next = page + 1;
    setPage(next);
    fetchGames({ q: query, page: next, page_size: PAGE_SIZE, ordering });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function prevPage() {
    if (page <= 1) return;
    const prev = page - 1;
    setPage(prev);
    fetchGames({ q: query, page: prev, page_size: PAGE_SIZE, ordering });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- RENDER ---------- */
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl overflow-hidden mx-auto")}>
      {/* HERO / HEADER */}
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div className="max-w-xl">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
           
            Revolyx-Games Explorer
          </h1>
          <p className="mt-1 text-sm opacity-70">
            Discover games by name, rating, platforms, genres and screenshots
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 rounded-md border opacity-70">RAWG API</span>
            <span className="text-xs px-2 py-1 rounded-md border opacity-70">Responsive</span>
            <span className="text-xs px-2 py-1 rounded-md border opacity-70">Voice Search</span>
            <span className="text-xs px-2 py-1 rounded-md border opacity-70">Developer Tools</span>
          </div>
        </div>

        <div className="w-full lg:w-auto">
          <form
            onSubmit={handleSearchSubmit}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-lg w-full",
              isDark ? "bg-zinc-900/60 border border-zinc-800" : "bg-white border border-zinc-200"
            )}
            role="search"
            aria-label="Search games"
          >
            <Search className="opacity-60" />
            <Input
              aria-label="Search games"
              placeholder="Search games (e.g. Elden Ring, Mario, Cyberpunk...)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={handleSuggestKey}
              onFocus={() => setShowSuggest(true)}
              className="border-0 bg-transparent outline-none shadow-none"
              autoComplete="off"
            />
            <Button type="button" variant="ghost" onClick={() => { setQuery(""); setGames([]); }}>
              Clear
            </Button>
            <Button type="submit" variant="default" aria-label="Search">
              <Search />
            </Button>
            <Button type="button" variant="ghost" aria-label="Voice search" onClick={toggleListening} title="Voice search">
              {listening ? <Mic className="text-rose-400" /> : <MicOff />}
            </Button>
          </form>
        </div>
      </header>

      {/* SUGGESTIONS */}
      <AnimatePresence>
        {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="listbox"
            aria-label="Search suggestions"
            className={clsx(
              "absolute z-50 left-6 right-6 md:left-[calc(50%_-_420px)] md:right-auto max-w-6xl rounded-xl overflow-hidden shadow-2xl",
              isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => {
              const active = idx === activeSuggestIdx;
              return (
                <li
                  key={s.id}
                  role="option"
                  aria-selected={active}
                  tabIndex={-1}
                  className={clsx(
                    "px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer flex items-center gap-3",
                    active ? (isDark ? "bg-zinc-800" : "bg-zinc-100") : ""
                  )}
                  onMouseEnter={() => setActiveSuggestIdx(idx)}
                  onClick={() => {
                    setCurrentGame(s);
                    setShowSuggest(false);
                    setActiveSuggestIdx(-1);
                  }}
                >
                  <img src={s.background_image || ""} alt={s.name} loading="lazy" className="w-16 h-10 object-cover rounded-md flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-xs opacity-60 truncate">{s.released ? `${s.released} • ` : ""}{s.rating ? `${s.rating} ★` : "No rating"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.metacritic ?? "-"}</div>
                </li>
              );
            })}
            {suggestions.length === 0 && !loadingSuggest && <li className="p-3 text-sm opacity-60">No suggestions</li>}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Results */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm opacity-75">{rawResp?.count ? `Results • ${rawResp.count.toLocaleString()} total` : "Results"}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setOrdering("-rating"); fetchGames({ q: query, page: 1, page_size: PAGE_SIZE, ordering: "-rating" }); }}>
                <Star /> Top Rated
              </Button>
              <Button variant="outline" onClick={() => { setOrdering("-released"); fetchGames({ q: query, page: 1, page_size: PAGE_SIZE, ordering: "-released" }); }}>
                <Calendar /> Newest
              </Button>
              <Button variant="outline" onClick={() => { setOrdering("name"); fetchGames({ q: query, page: 1, page_size: PAGE_SIZE, ordering: "name" }); }}>
                <Filter /> Sort
              </Button>
            </div>
          </div>

          <Card className={clsx("rounded-2xl overflow-hidden border dark:bg-black dark:text-zinc-100 bg-white text-zinc-900")}>
            <CardContent>
              {loading ? (
                <div className="py-20 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                  <div className="text-sm opacity-60 mt-3">Loading games…</div>
                </div>
              ) : games.length === 0 ? (
                <div className="py-16 text-center text-sm opacity-60">No games found — try a broader query or clear filters.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {games.map((g) => (
                    <article
                      key={g.id}
                      className="grid grid-cols-4 gap-4 p-4 rounded-lg hover:dark:bg-zinc-800 hover:bg-zinc-100 transition-shadow cursor-pointer"
                      onClick={() => setCurrentGame(g)}
                      aria-label={`Open ${g.name}`}
                    >
                      <img src={g.background_image || ""} alt={g.name} loading="lazy" className="w-full h-24 object-cover rounded-md col-span-1" />
                      <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-lg truncate">{g.name}</h3>
                          <div className="text-xs opacity-60 mt-1">
                            {g.released ? <><Calendar className="inline-block mr-1" size={14}/> {g.released}</> : "TBA"}
                          </div>
                          <div className="mt-2 text-sm opacity-80 truncate">{g.slug}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-semibold">{g.rating ? `${g.rating} ★` : "—"}</div>
                          <div className="text-xs opacity-60 mt-1">{g.metacritic ? `Metacritic: ${g.metacritic}` : "No meta score"}</div>
                          <div className="mt-2 text-xs opacity-60">{(g.platforms || []).map(p => p.platform?.name).slice(0,3).join(", ")}</div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={prevPage} disabled={page <= 1} aria-label="Previous page"><ChevronLeft /></Button>
                <span className="text-sm opacity-70">Page {page}</span>
                <Button variant="outline" onClick={nextPage} aria-label="Next page"><ChevronRight /></Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => copyCurrentToClipboard()} aria-label="Copy selected game JSON"><Copy /></Button>
                <Button variant="ghost" onClick={() => downloadRawJSON()} aria-label="Download JSON"><Download /></Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)} aria-label="Toggle raw JSON"><List /></Button>
              </div>
            </CardFooter>
          </Card>
        </section>

        {/* Details */}
        <aside className={clsx("lg:col-span-5 rounded-2xl p-4 space-y-4 h-fit dark:bg-black dark:text-zinc-100 bg-white text-zinc-900")}>
          {currentGame ? (
            <>
              <div className="flex items-start gap-4">
                <img src={currentGame.background_image || currentGame.background_image_additional || ""} alt={currentGame.name} loading="lazy" className="w-40 h-28 object-cover rounded-md flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{currentGame.name}</h2>
                  <div className="text-sm opacity-60">{currentGame.released ? `Released: ${currentGame.released}` : "Release date: TBA"}</div>
                  <p className="mt-2 text-sm opacity-80 line-clamp-3">{currentGame.short_description || currentGame.description_raw || currentGame.slug}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(currentGame.genres || []).map((g) => (
                      <span key={g.id} className={clsx("px-2 py-1 rounded-md text-xs border", isDark ? "border-zinc-700" : "border-zinc-300")}>{g.name}</span>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60">Rating</div>
                  <div className="text-lg font-semibold flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" />{currentGame.rating ?? "—"}<span className="text-xs opacity-60"> {currentGame.ratings_count ? `(${currentGame.ratings_count})` : ""}</span></div>
                </div>
                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60">Metacritic</div>
                  <div className="text-lg font-semibold">{currentGame.metacritic ?? "—"}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 mt-2">
                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60">Platforms</div>
                  <div className="text-sm">{(currentGame.platforms || []).map(p => p.platform?.name).join(", ") || "—"}</div>
                </div>

                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60">Developers</div>
                  <div className="text-sm">{(currentGame.developers || []).map(d => d.name).join(", ") || "—"}</div>
                </div>

                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60">Stores</div>
                  <div className="text-sm">{(currentGame.stores || []).map(s => s.store?.name).join(", ") || "—"}</div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">Screenshots</div>
                  <div className="text-xs opacity-60">Click to open</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(currentGame.short_screenshots || []).slice(0, 6).map(s => (
                    <button key={s.id} onClick={() => openScreenshot(s.image)} className="rounded-md overflow-hidden">
                      <img src={s.image} alt={`screenshot-${s.id}`} loading="lazy" className="w-full h-28 object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-semibold mb-2">All fields</div>
                <ScrollArea className="h-[200px] overflow-auto">
                  <pre className="text-xs p-2">{prettyJSON(currentGame)}</pre>
                </ScrollArea>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => window.open(currentGame.website || `https://rawg.io/games/${currentGame.slug}`, "_blank")}><ExternalLink /> Open</Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> Raw</Button>
                <div className="ml-auto flex gap-2">
                  <Button variant="ghost" onClick={() => copyCurrentToClipboard()} aria-label="Copy game JSON"><Copy /></Button>
                  <Button variant="ghost" onClick={() => downloadRawJSON()} aria-label="Download JSON"><Download /></Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center opacity-70">
              <ImageIcon className="mx-auto mb-3" />
              <div className="text-sm">Select a game to see details here.</div>
            </div>
          )}
        </aside>
      </main>

      {/* RAW JSON inspector */}
      <AnimatePresence>
        {showRaw && rawResp && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className={clsx("max-w-6xl mx-auto mt-6 rounded-2xl overflow-hidden border", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200")}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Raw API response</div>
                <div className="text-xs opacity-60">Inspect full JSON</div>
              </div>
              <ScrollArea className="h-[200px] overflow-auto">
                <pre className="text-xs p-3">{prettyJSON(rawResp)}</pre>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screenshot dialog */}
      <Dialog open={screenshotOpen} onOpenChange={closeScreenshot}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-zinc-900" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Screenshot</DialogTitle>
          </DialogHeader>
          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {screenshotSrc ? <img src={screenshotSrc} alt="screenshot" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} /> : <div className="p-8">No image</div>}
          </div>
          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Screenshot provided by RAWG</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={closeScreenshot}><X /></Button>
              <Button variant="outline" onClick={() => screenshotSrc && window.open(screenshotSrc, "_blank")}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
