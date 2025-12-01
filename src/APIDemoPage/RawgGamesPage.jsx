// RawgGamesPage.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper"; // optional

// lucide icons
import {
  Search,
  X,
  ExternalLink,
  Copy as CopyIcon,
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
  Menu,
  RefreshCw,
  Check,
  Zap,
  Tag,
} from "lucide-react";

// shadcn / ui primitives (adjust paths if needed)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";

// config
const BASE_ENDPOINT = "https://api.rawg.io/api/games";
const API_KEY = "630391cdbfab488594f03b9aa6f5fa1e"; // replace if needed
const DEFAULT_MSG = "Try searching: 'Elden Ring', 'Zelda', 'indie', 'racing'...";
const PAGE_SIZE = 20;

// helpers
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

export default function RawgGamesPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // app state
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

  // voice
  const [listening, setListening] = useState(false);
  const speechRecRef = useRef(null);

  // copy animation state
  const [copyStatus, setCopyStatus] = useState("idle"); // 'idle' | 'copying' | 'copied'

  // sidebar (sheet) state for mobile
  const [sheetOpen, setSheetOpen] = useState(false);

  // debounce
  const suggestTimer = useRef(null);

  /* ---------- initial fetch ---------- */
  useEffect(() => {
    fetchGames({ q: "", page: 1, page_size: PAGE_SIZE, ordering });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordering]);

  /* ---------- fetch helpers ---------- */
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

  /* ---------- search / suggestions ---------- */
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

  /* ---------- screenshot modal ---------- */
  function openScreenshot(src) {
    setScreenshotSrc(src);
    setScreenshotOpen(true);
  }
  function closeScreenshot() {
    setScreenshotOpen(false);
    setScreenshotSrc("");
  }

  /* ---------- clipboard / download with animation ---------- */
  function copyCurrentToClipboardAnimated() {
    if (!currentGame) return showToast?.("info", "No game selected");
    try {
      setCopyStatus("copying");
      navigator.clipboard.writeText(prettyJSON(currentGame));
      // small animation delay
      setTimeout(() => {
        setCopyStatus("copied");
        showToast?.("success", "Copied game JSON");
        setTimeout(() => setCopyStatus("idle"), 1600);
      }, 250);
    } catch (err) {
      console.error(err);
      showToast?.("error", "Copy failed");
      setCopyStatus("idle");
    }
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

  /* ---------- voice search ---------- */
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

  /* ---------- pagination ---------- */
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

  /* ---------- computed: 10 random sidebar items ---------- */
  const randomSidebar = useMemo(() => {
    if (!games || games.length === 0) return [];
    // shuffle a copy and take up to 10
    const arr = [...games];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 10);
  }, [games]);

  /* ---------- small helper: badge color by rating ---------- */
  const ratingBadgeClass = (rating) => {
    if (rating === null || rating === undefined) return "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200";
    if (rating >= 4.5) return "bg-amber-100 text-amber-700";
    if (rating >= 3.5) return "bg-emerald-100 text-emerald-700";
    if (rating >= 2.5) return "bg-sky-100 text-sky-700";
    return "bg-red-100 text-rose-700";
  };

  /* ---------- render ---------- */
  return (
    <div className={clsx("min-h-screen pb-10 p-4 md:p-6 max-w-8xl mx-auto")}>
      {/* HEADER */}
      <header className="flex items-center flex-wrap justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu / sheet trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 md:hidden cursor-pointer" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="p-2">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2"><List /> Quick Picks</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[70vh] mt-2">
                <div className="space-y-2 p-2">
                  {randomSidebar.length === 0 ? (
                    <div className="p-4 text-sm opacity-60">No items</div>
                  ) : (
                    randomSidebar.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => { setCurrentGame(g); setSheetOpen(false); }}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 w-full text-left cursor-pointer"
                      >
                        <img src={g.background_image || ""} alt={g.name} className="w-12 h-8 object-cover rounded-md" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{g.name}</div>
                          <div className="text-xs opacity-60 truncate">{g.released ?? "TBA"}</div>
                        </div>
                        <div className={clsx("text-xs px-2 py-1 rounded-md text-center", ratingBadgeClass(g.rating))}>
                          {g.rating ? g.rating : "—"}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <Zap className="hidden md:inline-block" />
              Revolyx-Games
              <span className="ml-1 text-base font-medium text-zinc-500">Explorer</span>
            </h1>
            <div className="text-xs md:text-sm opacity-70">Search games by name, rating, platforms, genres and screenshots</div>
          </div>
        </div>

        {/* search + actions */}
        <div className="flex-1 max-w-2xl">
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
              placeholder="Search games (eg. Elden Ring, Mario, Cyberpunk...)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={handleSuggestKey}
              onFocus={() => setShowSuggest(true)}
              className="border-0 bg-transparent outline-none shadow-none"
              autoComplete="off"
            />
            <Button type="button" variant="ghost" onClick={() => { setQuery(""); setGames([]); }} className="cursor-pointer">
              Clear
            </Button>
            <Button type="submit" variant="default" aria-label="Search" className="cursor-pointer">
              <Search />
            </Button>
            <Button type="button" variant="ghost" aria-label="Voice search" onClick={toggleListening} title="Voice search" className="cursor-pointer">
              {listening ? <Mic className="text-rose-400" /> : <MicOff />}
            </Button>
            <Button type="button" variant="ghost" onClick={() => fetchGames({ q: query, page: 1, page_size: PAGE_SIZE, ordering })} title="Refresh" className="cursor-pointer">
              <RefreshCw />
            </Button>
          </form>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" onClick={() => { setOrdering("-rating"); fetchGames({ q: query, page: 1, page_size: PAGE_SIZE, ordering: "-rating" }); }} className="cursor-pointer">
            <Star /> Top
          </Button>
          <Button variant="outline" onClick={() => { setOrdering("-released"); fetchGames({ q: query, page: 1, page_size: PAGE_SIZE, ordering: "-released" }); }} className="cursor-pointer">
            <Calendar /> New
          </Button>
          <Button variant="outline" onClick={() => { setOrdering("name"); fetchGames({ q: query, page: 1, page_size: PAGE_SIZE, ordering: "name" }); }} className="cursor-pointer">
            <Filter /> Sort
          </Button>
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
              "absolute z-50 left-4 right-4 md:left-[calc(50%_-_420px)] md:right-auto max-w-6xl rounded-xl overflow-hidden shadow-2xl",
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
        {/* LEFT: Sidebar (desktop) */}
        <aside className="hidden lg:block lg:col-span-3">
          <Card className={clsx("rounded-2xl overflow-hidden border p-3", isDark ? "dark:bg-black" : "bg-white")}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <List /> Quick Picks
              </div>
              <Button variant="ghost" size="sm" onClick={() => fetchGames({ q: query, page: 1, page_size: PAGE_SIZE, ordering })} className="cursor-pointer">
                <RefreshCw />
              </Button>
            </div>

            <ScrollArea className="h-[60vh]">
              <div className="space-y-2">
                {randomSidebar.length === 0 ? (
                  <div className="p-4 text-sm opacity-60">No items</div>
                ) : (
                  randomSidebar.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setCurrentGame(g)}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 w-full text-left cursor-pointer"
                    >
                      <img src={g.background_image || ""} alt={g.name} className="w-12 h-8 object-cover rounded-md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm ">{g.name}</div>
                        <div className="text-xs opacity-60 ">{g.released ?? "TBA"}</div>
                      </div>
                      <div className={clsx("text-xs px-2 py-1 rounded-md text-center", ratingBadgeClass(g.rating))}>
                        {g.rating ? g.rating : "—"}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </aside>

        {/* MIDDLE: Results / list + improved preview */}
        <section className="lg:col-span-5 space-y-4">
          {/* top controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm opacity-75">{rawResp?.count ? `Results • ${rawResp.count.toLocaleString()} total` : "Results"}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setOrdering("-rating"); fetchGames({ q: query, page: 1, page_size: PAGE_SIZE, ordering: "-rating" }); }} className="cursor-pointer">
                <Star /> Top Rated
              </Button>
              <Button variant="outline" onClick={() => { setOrdering("-released"); fetchGames({ q: query, page: 1, page_size: PAGE_SIZE, ordering: "-released" }); }} className="cursor-pointer">
                <Calendar /> Newest
              </Button>
              <Button variant="outline" onClick={() => { setOrdering("name"); fetchGames({ q: query, page: 1, page_size: PAGE_SIZE, ordering: "name" }); }} className="cursor-pointer">
                <Filter /> Sort
              </Button>
            </div>
          </div>

          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "dark:bg-black dark:text-zinc-100 bg-black/5" : "bg-white text-zinc-900")}>
            <CardContent className="h-100 sm:h-150 overflow-y-auto">
              {loading ? (
                <div className="py-24 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                  <div className="text-sm opacity-60 mt-3">Loading games…</div>
                </div>
              ) : games.length === 0 ? (
                <div className="py-16 text-center text-sm opacity-60">No games found — try a broader query or clear filters.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {/* improved list item layout */}
                  {games.map((g) => (
                    <article
                      key={g.id}
                      onClick={() => setCurrentGame(g)}
                      className="grid grid-cols-5 gap-4 p-4 rounded-lg hover:dark:bg-zinc-800 hover:bg-zinc-100 transition-shadow cursor-pointer items-center"
                      aria-label={`Open ${g.name}`}
                    >
                      <img src={g.background_image || ""} alt={g.name} loading="lazy" className="w-full h-28 object-cover rounded-md col-span-2" />
                      <div className="col-span-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg truncate flex items-center gap-2">
                              {g.name}
                              <span className="text-xs opacity-60">{g.released ?? "TBA"}</span>
                            </h3>
                            <div className="text-sm opacity-70 mt-1 line-clamp-2">{g.slug}</div>
                          </div>
                          <div className="text-right">
                            <div className={clsx("text-sm font-semibold inline-flex items-center gap-2 px-2 py-1 rounded-md", ratingBadgeClass(g.rating))}>
                              <Star className="w-3 h-3" /> {g.rating ?? "—"}
                            </div>
                            <div className="text-xs opacity-60 mt-1">{g.metacritic ? `Metacritic: ${g.metacritic}` : "No meta score"}</div>
                            <div className="mt-2 text-xs opacity-60">{(g.platforms || []).map(p => p.platform?.name).slice(0,3).join(", ")}</div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={prevPage} disabled={page <= 1} aria-label="Previous page" className="cursor-pointer"><ChevronLeft /></Button>
                <span className="text-sm opacity-70">Page {page}</span>
                <Button variant="outline" onClick={nextPage} aria-label="Next page" className="cursor-pointer"><ChevronRight /></Button>
              </div>


            </CardFooter>
          </Card>
        </section>

        {/* RIGHT: Details */}
        <aside className={clsx("lg:col-span-4 rounded-2xl p-4 space-y-4 h-fit", isDark ? "dark:bg-black dark:text-zinc-100 bg-black/5" : "bg-white text-zinc-900")}>
          {currentGame ? (
            <>
              <div className="flex  flex-col items-center gap-3 text-center">
                <img src={currentGame.background_image || currentGame.background_image_additional || ""} alt={currentGame.name} loading="lazy" className="w-full h-60 object-cover rounded-md" />
                <div className="w-full flex justify-between flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold flex items-center justify-center gap-2">
                    <Gamepad /> {currentGame.name}
                  </h2>
                  <div className="text-xs opacity-60 flex items-center justify-center gap-2"><Calendar /> {currentGame.released ?? "TBA"}</div>

                  <div className="mt-2 flex items-center justify-center gap-2">
                    {(currentGame.genres || []).slice(0,3).map((g) => (
                      <span key={g.id} className={clsx("px-2 py-1 rounded-full text-xs border", isDark ? "border-zinc-700" : "border-zinc-200")}>
                        <Tag className="inline-block mr-1" size={12} /> {g.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-md border text-center">
                  <div className="text-xs opacity-60 flex items-center justify-center gap-2"><Star /> Rating</div>
                  <div className="text-lg font-semibold mt-1">{currentGame.rating ?? "—"} <span className="text-xs opacity-60"> {currentGame.ratings_count ? `(${currentGame.ratings_count})` : ""}</span></div>
                </div>

                <div className="p-3 rounded-md border text-center">
                  <div className="text-xs opacity-60 flex items-center justify-center gap-2"><ExternalLink /> Metacritic</div>
                  <div className="text-lg font-semibold mt-1">{currentGame.metacritic ?? "—"}</div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold flex items-center gap-2"><ImageIcon /> Screenshots</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(currentGame.short_screenshots || []).map(s => (
                    <button key={s.id} onClick={() => openScreenshot(s.image)} className="rounded-md overflow-hidden cursor-pointer">
                      <img src={s.image} alt={`s-${s.id}`} loading="lazy" className="w-full h-20 object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm font-semibold flex items-center gap-2"><List /> All fields</div>
                  <div className="text-xs opacity-60 ml-auto">JSON</div>
                </div>
                <ScrollArea className="h-[200px] overflow-auto">
                  <pre className="text-xs p-2">{prettyJSON(currentGame)}</pre>
                </ScrollArea>
              </div>

          
            </>
          ) : (
            <div className="py-12 text-center opacity-70">
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
              <ScrollArea className="h-[300px] overflow-auto">
                <pre className="text-xs p-3">{prettyJSON(rawResp)}</pre>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screenshot dialog */}
      <Dialog open={screenshotOpen} onOpenChange={closeScreenshot}>
        <DialogContent className={clsx("max-w-4xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-zinc-900" : "bg-white")}>
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
