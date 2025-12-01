// src/pages/RickMortyPage.jsx
"use client";

/**
 * RickMortyPage.jsx
 *
 * Rebuilt & improved Rick & Morty Explorer page.
 *
 * Improvements & features:
 * - Centered image preview in the main card with large visual focus
 * - Left desktop sidebar (10 random characters) + mobile sheet (same data)
 * - Search with suggestions (debounced)
 * - Animated copy button (tick on success, resets)
 * - Raw JSON toggle and developer view
 * - Polished UI using lucide-react icons and shadcn-style components
 * - Cursor-pointer on actionable elements
 * - Framer Motion micro-animations (hover/press/tick)
 * - Accessibility: alt text, buttons, roles
 * - Comments throughout for maintainability
 *
 * Notes:
 * - Assumes shadcn-style components are available under "@/components/ui/*"
 * - Uses react, framer-motion, lucide-react
 * - Keep endpoints as in original code (rickandmortyapi.com)
 */

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Copy as CopyIcon,
  Download,
  ImageIcon,
  Loader2,
  List,
  Link as LinkIcon,
  Info,
  X,
  Menu,
  RefreshCcw,
  User,
  Users,
  BadgeCheck,
  Telescope,
  Eye,
  Code,
  ChevronDown,
  Sparkles,
  Star,
  MapPin,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------------------- Constants ---------------------- */

// API
const API_BASE = "https://rickandmortyapi.com/api/character";

// Placeholders & UI
const DEFAULT_PLACEHOLDER = "Search characters by name (e.g. Rick, Morty...)";

/* ---------------------- Helpers ---------------------- */

/** Safe JSON pretty print */
const prettyJSON = (obj) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

/** Pick random n items from array */
const pickRandom = (arr = [], n = 10) => {
  if (!Array.isArray(arr)) return [];
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
};

/** Badge class for status (alive / dead / unknown) */
const badgeClass = (status) => {
  const map = {
    Alive: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    Dead: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    unknown: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-300",
  };
  return map[status] || map.unknown;
};

/* ---------------------- Main Component ---------------------- */

export default function RickMortyPage() {
  // theme detection
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // search & suggestions
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // results & selected character
  const [characters, setCharacters] = useState([]);
  const [current, setCurrent] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingCharacter, setLoadingCharacter] = useState(false);

  // sidebar (random picks)
  const [allCharacters, setAllCharacters] = useState([]);
  const [sidebarRandom, setSidebarRandom] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // UI state
  const [dialogOpen, setDialogOpen] = useState(false); // image dialog
  const [showRaw, setShowRaw] = useState(false); // raw JSON panel on center

  // copy animation state
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  // refs for debounce and input
  const inputRef = useRef(null);
  const suggestTimer = useRef(null);

  /* ---------------------- Fetch Utilities ---------------------- */

  // Fetch first page characters (or all if no name) and set current to first
  async function fetchCharacters(name = "") {
    setLoadingCharacter(true);
    try {
      const url = name ? `${API_BASE}/?name=${encodeURIComponent(name)}` : `${API_BASE}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) {
          // no results
          setCharacters([]);
          setCurrent(null);
          setRawResp(null);
          showToast("info", "No characters found");
          return;
        }
        showToast("error", `Request failed (${res.status})`);
        return;
      }
      const json = await res.json();
      const results = json.results || [];
      setCharacters(results);
      setRawResp(json);
      if (results.length > 0) {
        setCurrent(results[0]);
        showToast("success", `Loaded ${results[0].name}`);
      } else {
        setCurrent(null);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Network error");
    } finally {
      setLoadingCharacter(false);
    }
  }

  // Fetch entire dataset (all pages) to populate sidebar random picks (best-effort)
  async function fetchAllCharacters() {
    let page = 1;
    let accum = [];
    try {
      while (true) {
        const res = await fetch(`${API_BASE}/?page=${page}`);
        if (!res.ok) break;
        const json = await res.json();
        if (Array.isArray(json.results) && json.results.length) {
          accum = accum.concat(json.results);
          page++;
          // small safety: stop after 20 pages in case API expands
          if (page > 20) break;
        } else break;
      }
      setAllCharacters(accum);
      setSidebarRandom(pickRandom(accum, 10));
    } catch (err) {
      console.warn("Failed loading all characters for sidebar", err);
      // fallback: use current list
      setSidebarRandom(pickRandom(characters, 10));
    }
  }

  /* ---------------------- Suggestion (debounced) ---------------------- */

  async function searchSuggestions(q) {
    if (!q || !q.trim()) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const res = await fetch(`${API_BASE}/?name=${encodeURIComponent(q)}`);
      if (!res.ok) {
        // 404 will return not found
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(json.results || []);
    } catch (err) {
      console.warn("suggestion error", err);
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
      searchSuggestions(v);
    }, 300);
  }

  function handleSearchSubmit(e) {
    e?.preventDefault();
    // load characters list for query
    fetchCharacters(query.trim());
    setShowSuggest(false);
  }

  function chooseSuggestion(c) {
    setCurrent(c);
    setRawResp({ results: [c] });
    setQuery(c.name);
    setShowSuggest(false);
    showToast("success", `Selected ${c.name}`);
  }

  /* ---------------------- Copy & Download JSON ---------------------- */

  function copyJSON() {
    const payload = rawResp || current;
    if (!payload) {
      showToast("info", "Nothing to copy");
      return;
    }
    try {
      navigator.clipboard.writeText(prettyJSON(payload));
      setCopied(true);
      showToast("success", "Copied JSON");
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to copy");
    }
  }

  function downloadJSON() {
    const payload = rawResp || current;
    if (!payload) {
      showToast("info", "Nothing to download");
      return;
    }
    const name = (current?.name || "rickmorty").replace(/\s+/g, "_");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rickmorty_${name}.json`;
    a.click();
    showToast("success", "Downloaded JSON");
  }

  function openOriginal() {
    if (!current) return showToast("info", "No character selected");
    const url = `https://rickandmortyapi.com/character/${current.id}`;
    window.open(url, "_blank", "noopener");
  }

  /* ---------------------- Sidebar controls ---------------------- */

  function refreshSidebar() {
    if (allCharacters.length > 0) {
      setSidebarRandom(pickRandom(allCharacters, 10));
    } else {
      // fallback: re-fetch
      fetchAllCharacters();
    }
    showToast("success", "Sidebar refreshed");
  }

  /* ---------------------- Lifecycle ---------------------- */

  useEffect(() => {
    // initial load: load first page & all characters for sidebar
    fetchCharacters();
    // fetch all characters in background (best-effort)
    fetchAllCharacters();

    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------- Render ---------------------- */

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-8xl mx-auto", isDark ? "text-white" : "text-zinc-900")}>
      {/* ---------------------- HEADER ---------------------- */}
      <header className="flex items-start md:items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Mobile sheet trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden cursor-pointer">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-3">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  <div>
                    <div className="font-semibold">Random Picks</div>
                    <div className="text-xs opacity-60">10 random characters</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="cursor-pointer" onClick={refreshSidebar}><RefreshCcw /></Button>
                  <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => setSheetOpen(false)}><X /></Button>
                </div>
              </div>

              <Separator />

              <ScrollArea className="h-[72vh] p-3">
                <div className="space-y-3">
                  {sidebarRandom.map((c) => (
                    <motion.div
                    
                      key={c.id}
                      onClick={() => {
                        setCurrent(c);
                        setRawResp({ results: [c] });
                        setSheetOpen(false);
                      }}
                      className="p-3 rounded-lg border hover:shadow cursor-pointer flex items-start gap-3"
                    >
                      <img src={c.image} alt={c.name} className="w-12 h-12 rounded-md object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium ">{c.name}</div>
                        <div className="text-xs opacity-60 ">{c.species} • {c.status}</div>
                        <div className="mt-2 flex gap-2">
                          <span className={clsx("text-[11px] px-2 py-0.5 rounded-full border", badgeClass(c.status))}>{c.status}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full border bg-zinc-100 dark:bg-zinc-800 text-xs">{c.species}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1 cursor-pointer" onClick={refreshSidebar}><RefreshCcw /> Refresh</Button>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Brand */}
          <div className="rounded-full w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-zinc-800 shadow-sm">
            <Sparkles size={18} />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <User size={18} /> Rick & Morty Explorer
            </h1>
            <div className="text-xs opacity-60 max-w-md">
              Search, inspect characters, and view image previews. Mobile-friendly and developer friendly.
            </div>
          </div>
        </div>

        {/* Search box */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-[460px]" role="search">
          <div className={clsx("flex items-center gap-2 rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              ref={inputRef}
              placeholder={DEFAULT_PLACEHOLDER}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              className="border-0 bg-transparent outline-none shadow-none"
            />
            <Button type="submit" variant="outline" className="cursor-pointer px-3">
              <Search size={16} />
            </Button>
          </div>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={clsx("absolute w-full mt-2 rounded-xl shadow-2xl z-50 overflow-hidden", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
                style={{ maxHeight: 320 }}
              >
                {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    onClick={() => chooseSuggestion(s)}
                    className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-3">
                      <img src={s.image} alt={s.name} className="w-10 h-10 rounded-md object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{s.name}</div>
                        <div className="text-xs opacity-60 truncate">{s.species} • {s.status}</div>
                      </div>
                      <div className="text-xs opacity-60">#{s.id}</div>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </form>
      </header>

      {/* ---------------------- MAIN GRID ---------------------- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT desktop sidebar */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <Card className="rounded-xl dark:bg-black/90 bg-white p-0 overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} /> <span>Random 10 Picks</span>
                </div>
                <div className="text-xs opacity-60">{sidebarRandom.length} items</div>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[68vh] p-3">
                <div className="space-y-3">
                  {sidebarRandom.map((c) => (
                    <motion.div
                   
                      key={c.id}
                      onClick={() => { setCurrent(c); setRawResp({ results: [c] }); }}
                      className="p-3 rounded-lg border hover:shadow cursor-pointer flex items-start gap-3"
                    >
                      <img src={c.image} alt={c.name} className="w-12 h-12 rounded-md object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium ">{c.name}</div>
                        <div className="text-xs opacity-60 ">{c.species} • {c.status}</div>
                        <div className="mt-2 flex gap-2">
                          <span className={clsx("text-[11px] px-2 py-0.5 rounded-full border", badgeClass(c.status))}>{c.status}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full border bg-zinc-100 dark:bg-zinc-800 text-xs">{c.species}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1 cursor-pointer" onClick={refreshSidebar}><RefreshCcw /> Refresh</Button>
                  <Button variant="ghost" className="cursor-pointer" onClick={() => setSidebarRandom(pickRandom(allCharacters, 10))}>Shuffle</Button>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* CENTER content (preview + details) */}
        <section className={clsx("lg:col-span-6 rounded-2xl p-0", isDark ? "bg-black/30 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <Card className="rounded-2xl overflow-hidden dark:bg-black bg-white">
            <CardHeader className={clsx("p-4 flex flex-wrap gap-3 items-center justify-between", isDark ? "bg-black/50 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User size={18} /> {current?.name || "Character Preview"}
                </CardTitle>
                <div className="text-xs opacity-60">{current ? `${current.species} • ${current.status} • #${current.id}` : "Select a character to view details"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" className="cursor-pointer" onClick={() => setDialogOpen(true)} disabled={!current}><ImageIcon /> Image</Button>
                <Button variant="ghost" className="cursor-pointer" onClick={() => setShowRaw((s) => !s)}><Code /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button variant="outline" className="cursor-pointer" onClick={() => fetchCharacters(query || "")}><RefreshCcw /> Refresh</Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Layout: big image on top, center aligned, details below */}
              <div className="flex flex-col sm:flex-row sm:items-start  gap-6 items-center">
                {/* Visual: centered large image */}
                <div className=" flex items-center justify-center">
                  <div className="rounded-lg border overflow-hidden bg-zinc-100 dark:bg-zinc-900 w-full md:w-[420px] h-[340px] flex items-center justify-center">
                    {loadingCharacter ? (
                      <div className="text-center">
                        <Loader2 className="animate-spin mx-auto" />
                        <div className="text-xs opacity-60 mt-2">Loading...</div>
                      </div>
                    ) : current?.image ? (
                      <motion.img
                        src={current.image}
                        alt={current.name}
                        initial={{ scale: 0.98, opacity: 0.92 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.02 }}
                        className="object-contain max-h-full max-w-full"
                        onClick={() => setDialogOpen(true)}
                        style={{ cursor: "pointer" }}
                      />
                    ) : (
                      <div className="text-sm opacity-60">No image available</div>
                    )}
                  </div>
                </div>

                {/* Details panel */}
                <div className="md:w-[420px] w-full space-y-4">
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BadgeCheck /> <div className="font-semibold">Biography</div>
                      </div>
                      <div className={clsx("text-xs inline-block px-2 py-0.5 rounded-full", badgeClass(current?.status))}>{current?.status || "—"}</div>
                    </div>

                    <div className="mt-3 text-sm leading-relaxed">
                      <div><span className="font-medium">{current?.name}</span> — {current?.species || "Unknown species"}</div>
                      <div className="mt-2 text-xs opacity-70">
                        Origin: <span className="font-medium">{current?.origin?.name || "—"}</span> • Location: <span className="font-medium">{current?.location?.name || "—"}</span>
                      </div>
                      {current?.type && <div className="mt-2 text-xs opacity-70">Type: <span className="font-medium">{current.type}</span></div>}
                      {current?.episode?.length ? <div className="mt-2 text-xs opacity-70">Appears in <span className="font-medium">{current.episode.length}</span> episodes</div> : null}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <List /> <div className="font-semibold">Key Attributes</div>
                      </div>
                      <div className="text-xs opacity-60">{current ? "Details" : ""}</div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Species</div>
                        <div className="font-medium">{current?.species || "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Gender</div>
                        <div className="font-medium">{current?.gender || "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Origin</div>
                        <div className="font-medium">{current?.origin?.name || "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Location</div>
                        <div className="font-medium truncate">{current?.location?.name || "—"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><Telescope /> <div className="font-semibold">Episodes (first 6)</div></div>
                      <div className="text-xs opacity-60">Links</div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {current?.episode?.slice(0, 6).map((epUrl) => (
                        <a key={epUrl} href={epUrl} target="_blank" rel="noreferrer" className="p-2 rounded-md border hover:shadow-sm flex items-center gap-3 cursor-pointer">
                          <LinkIcon size={16} className="opacity-70" />
                          <div className="text-sm truncate">{epUrl}</div>
                        </a>
                      ))}
                      {!current?.episode?.length && <div className="text-xs opacity-60">No episode links</div>}
                    </div>
                  </div>

                
                </div>
              </div>

              {/* RAW JSON (toggle) */}
              <AnimatePresence>
                {showRaw && current && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-6 p-3 rounded-md border overflow-auto text-xs" style={{ maxHeight: 300 }}>
                    <pre>{prettyJSON(current)}</pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* RIGHT action / dev panel */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Eye /> Quick Actions</div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="cursor-pointer" onClick={() => fetchCharacters(query || "")}>
                <Loader2 className={loadingCharacter ? "animate-spin" : ""} /> Refresh
              </Button>

              <Button variant="outline" className="cursor-pointer" onClick={openOriginal}><ExternalLink /> API Page</Button>

              <motion.button
                onClick={copyJSON}
                className={clsx("w-full p-2 rounded-md border flex items-center justify-center gap-2 cursor-pointer", isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100")}
                animate={{ scale: copied ? 0.98 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
              >
                {copied ? <BadgeCheck className="text-green-500" /> : <CopyIcon />} {copied ? "Copied!" : "Copy JSON"}
              </motion.button>

              <Button variant="outline" className="cursor-pointer" onClick={downloadJSON}><Download /> Download JSON</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Info /> About</div>
            <div className="text-xs opacity-70">
              This explorer is mobile-first and uses a sheet for the mobile sidebar, desktop sidebar for larger screens, and provides quick developer actions. Click a character to view the center preview and large image.
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Code /> Developer</div>
            <div className="text-xs opacity-70">
              <div className="mb-2">Raw response & copy utilities are available. Use the search to find characters by name.</div>
              <div className="text-xs opacity-60">API: {API_BASE}</div>
            </div>
          </div>
        </aside>
      </main>

      {/* ---------------------- Image Dialog ---------------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ImageIcon /> {current?.name || "Image Preview"}</DialogTitle>
          </DialogHeader>

          <div className="h-[60vh] flex items-center justify-center bg-zinc-50 dark:bg-black">
            {current?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.image} alt={current?.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-sm opacity-60 flex items-center gap-2"><Info /> No image available</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from Rick & Morty API</div>
            <div className="flex gap-2">
              <Button variant="ghost" className="cursor-pointer" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" className="cursor-pointer" onClick={openOriginal}><ExternalLink /> Open</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
