// src/pages/FreeToGamePage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Copy as CopyIcon,
  Download,
  ImageIcon,
  List,
  Loader2,
  X,
  Star,
  ArrowRightCircle,
  Gamepad,
  Calendar,
  Tag,
  Users,
  Menu,
  Check,
  RefreshCw,
  FileText,
  Code as CodeIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const API_ENDPOINT = "https://www.freetogame.com/api/games";
const DEFAULT_PLACEHOLDER = "Search games by title, genre, or platform…";

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/**
 * Utility: sample N random items from array
 */
function sample(arr = [], n = 10) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export default function FreeToGamePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // data/state
  const [allGames, setAllGames] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copyState, setCopyState] = useState("idle"); // idle | copying | copied
  const [sheetOpen, setSheetOpen] = useState(false); // mobile sidebar
  const [showRaw, setShowRaw] = useState(false);

  const suggestTimer = useRef(null);
  const searchInputRef = useRef(null);

  // Random sidebar list (10)
  const randomSidebar = useMemo(() => sample(allGames, 10), [allGames]);

  // Fetch all games once
  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      setLoadingAll(true);
      try {
        const res = await fetch("/f2p/api/games");
        if (!res.ok) {
          showToast("error", `Failed to fetch games (${res.status})`);
          setLoadingAll(false);
          return;
        }
        const json = await res.json();
        if (!mounted) return;
        setAllGames(Array.isArray(json) ? json : []);
        setRawResp(json);
        if (Array.isArray(json) && json.length > 0) setSelected(json[0]);
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to load games");
      } finally {
        setLoadingAll(false);
      }
    }
    fetchAll();
    return () => { mounted = false; };
  }, []);

  // Debounced suggestions
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      filterSuggestions(v);
    }, 220);
  }

  function filterSuggestions(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    const term = q.trim().toLowerCase();
    const matched = allGames.filter(g =>
      (g.title || "").toLowerCase().includes(term) ||
      (g.genre || "").toLowerCase().includes(term) ||
      (g.platform || "").toLowerCase().includes(term) ||
      (g.short_description || "").toLowerCase().includes(term)
    ).slice(0, 12);
    setSuggestions(matched);
  }

  function chooseGame(game) {
    setSelected(game);
    setShowSuggest(false);
    setQuery("");
    setSuggestions([]);
    showToast("success", `Loaded: ${game.title}`);
    setSheetOpen(false); // close mobile sheet if open
  }

  function openGame() {
    if (!selected) return showToast("info", "No game selected");
    if (selected.game_url) window.open(selected.game_url, "_blank");
    else showToast("info", "No official link available");
  }

  // Animated copy to clipboard
  async function copyJSON() {
    const payload = selected || rawResp;
    if (!payload) return showToast("info", "No game selected");
    try {
      setCopyState("copying");
      await navigator.clipboard.writeText(prettyJSON(payload));
      setCopyState("copied");
      showToast("success", "Copied JSON");
      // reset after animation
      setTimeout(() => setCopyState("idle"), 1600);
    } catch (err) {
      console.error(err);
      setCopyState("idle");
      showToast("error", "Copy failed");
    }
  }

  function downloadJSON() {
    const payload = selected || rawResp;
    if (!payload) return showToast("info", "No data to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = selected?.title?.replace(/\s+/g, "_") || `freetogame_export`;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function refreshRandom() {
    // force recompute of randomSidebar by re-setting state copy of allGames
    setAllGames(prev => prev.slice());
    showToast("info", "Refreshed random picks");
  }

  // UI small helpers
  function TagPill({ children }) {
    return (
      <div className={clsx("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium uppercase tracking-wider", isDark ? "bg-zinc-800/60 text-zinc-200" : "bg-zinc-100 text-zinc-700")}>
        {children}
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen pb-10 p-4 md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2 rounded-lg cursor-pointer">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className={clsx(isDark ? "bg-black/90" : "bg-white")}>
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Gamepad />
                    <div>
                      <div className="text-sm font-semibold">Explore Games</div>
                      <div className="text-xs opacity-60">Quick picks</div>
                    </div>
                  </div>

                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs opacity-60">Random picks</div>
                    <Button size="sm" variant="ghost" className="gap-2 cursor-pointer" onClick={refreshRandom}><RefreshCw /> Refresh</Button>
                  </div>

                  <ScrollArea className="h-[60vh]">
                    <ul className="space-y-2">
                      {randomSidebar.map((g) => (
                        <li key={g.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseGame(g)}>
                          <img src={g.thumbnail} alt={g.title} className="w-12 h-8 object-cover rounded-md flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{g.title}</div>
                            <div className="text-xs opacity-60 truncate">{g.genre} • {g.platform}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className={clsx("text-2xl md:text-3xl font-extrabold leading-tight")}>Free-to-Play Games — Explorer</h1>
            <p className="mt-0 text-xs md:text-sm opacity-70 max-w-prose">Browse free-to-play PC & web games. Fast local search, quick actions, and full JSON export.</p>
          </div>
        </div>

        <div className="hidden md:block w-full md:w-auto">
          <form onSubmit={(e) => { e.preventDefault(); }} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-xl px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              ref={searchInputRef}
              placeholder={DEFAULT_PLACEHOLDER}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); searchInputRef.current?.focus(); }}>
              Clear
            </Button>
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { if (allGames.length > 0) { setSelected(allGames[0]); showToast("info", "Reset to first game"); } }}>
              <ArrowRightCircle /> Default
            </Button>
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
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-2xl overflow-hidden shadow-2xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {suggestions.map((g, idx) => (
              <li
                key={g.id ?? `${g.title}_${idx}`}
                onClick={() => chooseGame(g)}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer flex items-center gap-4"
              >
                <img src={g.thumbnail} alt={g.title} className="w-16 h-10 object-cover rounded-md flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{g.title}</div>
                  <div className="text-xs opacity-60 truncate">{g.short_description}</div>
                </div>
                <div className="text-xs opacity-60 whitespace-nowrap">
                  {g.platform} • {g.genre}
                </div>
              </li>
            ))}
            <li className="p-2 text-xs opacity-60 text-center">Showing {suggestions.length} results</li>
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* LEFT: Desktop sidebar with 10 random picks */}
        <aside className={clsx("hidden lg:block lg:col-span-3 h-fit rounded-2xl overflow-hidden", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/95 border border-zinc-200")}>
          <div className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
            <div className="flex items-center gap-2">
              <Gamepad />
              <div>
                <div className="text-sm font-semibold">Random picks</div>
                <div className="text-xs opacity-60">10 suggested games</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="cursor-pointer" onClick={refreshRandom}><RefreshCw /></Button>
              <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => setAllGames(prev => prev.slice())}><List /></Button>
            </div>
          </div>

          <ScrollArea className="h-[70vh] p-3">
            <ul className="space-y-2">
              {randomSidebar.map((g) => (
                <li key={g.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseGame(g)}>
                  <img src={g.thumbnail} alt={g.title} className="w-14 h-10 object-cover rounded-md flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium w-30 truncate">{g.title}</div>
                    <div className="text-xs opacity-60 w-30 truncate">{g.genre} • {g.platform}</div>
                  </div>
                  <div className="text-xs opacity-60">{g.release_date}</div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </aside>

        {/* CENTER: full details (lg:col-span-7) */}
        <section className={clsx("lg:col-span-7 rounded-2xl overflow-hidden", isDark ? "bg-black border border-zinc-800" : "bg-white/95 border border-zinc-200")}>
          <Card className="rounded-none dark:bg-black/90 bg-white shadow-none border-0">
            <CardHeader className={clsx("p-5 flex flex-col md:flex-row items-start md:items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg md:text-xl flex items-center gap-3">
                  <Star className="opacity-80" />
                  <span className="truncate">{selected?.title || "Game details"}</span>
                </CardTitle>
                <div className="text-xs opacity-60 mt-1 flex items-center gap-3">
                  <div className="flex items-center gap-1"><Tag size={14} /> <span>{selected?.genre || "—"}</span></div>
                  <div className="flex items-center gap-1"><Gamepad size={14} /> <span>{selected?.platform || "—"}</span></div>
                  <div className="flex items-center gap-1"><Calendar size={14} /> <span>{selected?.release_date || "—"}</span></div>
                </div>
              </div>

             
            </CardHeader>

            <CardContent className="p-6">
              {loadingAll ? (
                <div className="py-24 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selected ? (
                <div className="py-16 text-center text-sm opacity-60">No game selected — try searching above.</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main description / synopsis (span 2) */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-28 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                          <img src={selected?.thumbnail || "/api_previews/freetogame.png"} alt={selected?.title || "Game thumbnail"} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FileText /> Overview
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-justify">{selected.short_description || selected.description || "No description available from API."}</p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {selected?.genre && <TagPill><Tag className="mr-1" size={14}/> {selected.genre}</TagPill>}
                            {selected?.platform && <TagPill><Gamepad className="mr-1" size={14}/> {selected.platform}</TagPill>}
                            {selected?.publisher && <TagPill><Users className="mr-1" size={14}/> {selected.publisher}</TagPill>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <h4 className="text-base font-semibold flex items-center gap-2"><CodeIcon /> Details & Stats</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <div className="p-3 rounded-lg border">
                          <div className="text-xs opacity-60">Game ID</div>
                          <div className="font-medium">{selected.id}</div>
                        </div>

                        <div className="p-3 rounded-lg border">
                          <div className="text-xs opacity-60">Developer</div>
                          <div className="font-medium">{selected.developer || "—"}</div>
                        </div>

                        <div className="p-3 rounded-lg border">
                          <div className="text-xs opacity-60">Publisher</div>
                          <div className="font-medium">{selected.publisher || "—"}</div>
                        </div>

                        <div className="p-3 rounded-lg border">
                          <div className="text-xs opacity-60">Release</div>
                          <div className="font-medium">{selected.release_date || "—"}</div>
                        </div>

                        <div className="p-3 rounded-lg border">
                          <div className="text-xs opacity-60">Platform</div>
                          <div className="font-medium">{selected.platform || "—"}</div>
                        </div>

                        <div className="p-3 rounded-lg border">
                          <div className="text-xs opacity-60">Version</div>
                          <div className="font-medium">{selected?.freetogame_profile?.version || "—"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <h4 className="text-base font-semibold flex items-center gap-2"><List /> About / More</h4>
                      <div className="text-sm leading-relaxed mt-2">
                        {selected.description || selected.short_description || "No extended description provided by API."}
                      </div>
                    </div>
                  </div>

                  {/* Right column inside center: screenshots / tags */}
                  <aside className="lg:col-span-1 space-y-4">
                    <div className="rounded-lg p-3 border">
                      <div className="text-xs opacity-60 mb-2 flex items-center gap-2"><ImageIcon /> Screenshots</div>
                      {selected?.screenshots && selected.screenshots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {selected.screenshots.slice(0,4).map((s, i) => (
                            <img key={i} src={s.image} alt={`screenshot-${i}`} className="w-full h-20 object-cover rounded-md" />
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm opacity-60">No screenshots</div>
                      )}
                    </div>

                    <div className="rounded-lg p-3 border">
                      <div className="text-xs opacity-60 mb-2 flex items-center gap-2"><Tag /> Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {selected?.genre && <TagPill>{selected.genre}</TagPill>}
                        {selected?.platform && <TagPill>{selected.platform}</TagPill>}
                        {selected?.publisher && <TagPill>{selected.publisher}</TagPill>}
                      </div>
                    </div>

                    <div className="rounded-lg p-3 border">
                      <div className="text-xs opacity-60 mb-2 flex items-center gap-2"><Star /> Quick Stats</div>
                      <div className="text-sm">
                        <div className="flex justify-between"><div className="opacity-60">Release</div><div className="font-medium">{selected.release_date || "—"}</div></div>
                        <div className="flex justify-between mt-2"><div className="opacity-60">Platform</div><div className="font-medium">{selected.platform}</div></div>
                        <div className="flex justify-between mt-2"><div className="opacity-60">Developer</div><div className="font-medium">{selected.developer || "—"}</div></div>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw response toggle */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs opacity-70"><FileText /> Raw API Response</div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => setShowRaw(s => !s)}>{showRaw ? "Hide" : "Show"}</Button>
                <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => { navigator.clipboard.writeText(prettyJSON(rawResp || {})); showToast("success", "Raw JSON copied"); }}><CopyIcon /></Button>
              </div>
            </div>

            <AnimatePresence>
              {showRaw && (
                <motion.pre
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={clsx("mt-3 rounded-md p-3 overflow-auto text-xs border", isDark ? "bg-black/60 border-zinc-800" : "bg-white/95 border-zinc-200")}
                  style={{ maxHeight: "32vh", whiteSpace: "pre-wrap" }}
                >
                  {prettyJSON(rawResp)}
                </motion.pre>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* RIGHT: Quick actions (lg:col-span-2) */}
        <aside className={clsx("lg:col-span-2 rounded-2xl p-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/95 border border-zinc-200")}>
          <div className="text-sm font-semibold mb-2 flex items-center gap-2"><ArrowRightCircle /> Quick Actions</div>

          <div className="space-y-2">
            <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={openGame}><ExternalLink className="mr-2" /> Open Official</Button>
            <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={() => setDialogOpen(true)}><ImageIcon className="mr-2" /> View Image</Button>
            <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={copyJSON}><CopyIcon className="mr-2" /> Copy JSON</Button>
            <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={downloadJSON}><Download className="mr-2" /> Download JSON</Button>
            <Button className="w-full justify-start cursor-pointer" onClick={() => { if (selected?.game_url) window.open(selected.game_url + "?utm_source=explorer", "_blank"); else showToast("info", "No game link"); }} variant="outline"><ArrowRightCircle className="mr-2" /> Play / Visit</Button>
          </div>

          <Separator className="my-4" />

          <div className="text-xs opacity-60">API</div>
          <div className="mt-2 text-sm break-all">{API_ENDPOINT}</div>
        </aside>
      </main>

      {/* Image dialog (unchanged) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selected?.title || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {selected?.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.thumbnail} alt={selected?.title} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from FreeToGame</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (selected?.game_url) window.open(selected.game_url, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
