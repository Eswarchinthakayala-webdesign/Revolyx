// src/pages/FreeToGamePage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Copy,
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
  Users
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * FreeToGamePage
 * - Fetches all games from https://www.freetogame.com/api/games
 * - Search is client-side (fast suggestions)
 * - Layout: left (image/meta), center (details), right (quick actions)
 * - No local save/favorites
 */

const API_ENDPOINT = "https://www.freetogame.com/api/games";
const DEFAULT_PLACEHOLDER = "Search games by title, genre, or platform…";

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export default function FreeToGamePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [allGames, setAllGames] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const suggestTimer = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    // initial load: fetch all games
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
        // default to first game
        if (Array.isArray(json) && json.length > 0) {
          setSelected(json[0]);
        }
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

  // debounce search & generate suggestions from allGames
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      filterSuggestions(v);
    }, 250);
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
    // no separate detail fetch required — API returns full object
    showToast("success", `Loaded: ${game.title}`);
  }

  function openGame() {
    if (!selected) return showToast("info", "No game selected");
    if (selected.game_url) window.open(selected.game_url, "_blank");
    else showToast("info", "No official link available");
  }

  function copyJSON() {
    if (!selected) return showToast("info", "No game selected");
    navigator.clipboard.writeText(prettyJSON(selected));
    showToast("success", "Game JSON copied");
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

  // Utility: render tags
  function TagPill({ children }) {
    return (
      <div className={clsx("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium uppercase tracking-wider", isDark ? "bg-zinc-800/60 text-zinc-200" : "bg-zinc-100 text-zinc-700")}>
        {children}
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold leading-tight")}>Free-to-Play Games — Explorer</h1>
          <p className="mt-1 text-sm opacity-70 max-w-prose">Browse free-to-play PC games. Search by title, genre or platform — view details and quick actions.</p>
        </div>

        <div className="w-full md:w-auto">
          <form onSubmit={(e) => { e.preventDefault(); /* keep client-side search */ }} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-xl px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              ref={searchInputRef}
              placeholder={DEFAULT_PLACEHOLDER}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); searchInputRef.current?.focus(); }}>
              Clear
            </Button>
            <Button type="button" variant="outline" className="px-3" onClick={() => { if (allGames.length > 0) { setSelected(allGames[0]); showToast("info", "Reset to first game"); } }}>
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
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-2xl overflow-hidden shadow-2xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
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
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT: Image + meta (lg:col-span-3) */}
        <aside className={clsx("lg:col-span-3 rounded-2xl overflow-hidden", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/95 border border-zinc-200")}>
          <div className={clsx("p-5", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                <img src={selected?.thumbnail || "/api_previews/freetogame.png"} alt={selected?.title || "Game thumbnail"} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold leading-tight">{selected?.title || "Loading..."}</h2>
                <div className="text-sm opacity-60 mt-1">{selected?.short_description || "Select a game to view details."}</div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selected?.genre && <TagPill><Tag className="mr-1" size={14}/> {selected.genre}</TagPill>}
                  {selected?.platform && <TagPill><Gamepad className="mr-1" size={14}/> {selected.platform}</TagPill>}
                  {selected?.publisher && <TagPill><Users className="mr-1" size={14}/> {selected.publisher}</TagPill>}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={() => setDialogOpen(true)} variant="outline" className="flex-1"><ImageIcon /> View Image</Button>
              <Button onClick={openGame} variant="ghost" className="flex-1"><ExternalLink /> Official</Button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <div className="text-xs opacity-60">Release Date</div>
              <div className="font-medium">{selected?.release_date || "—"}</div>
            </div>

            <div>
              <div className="text-xs opacity-60">Developer</div>
              <div className="font-medium">{selected?.developer || "—"}</div>
            </div>

            <div>
              <div className="text-xs opacity-60">Publisher</div>
              <div className="font-medium">{selected?.publisher || "—"}</div>
            </div>

            <Separator />

            <div>
              <div className="text-xs opacity-60">Genre</div>
              <div className="font-medium">{selected?.genre || "—"}</div>
            </div>

            <div>
              <div className="text-xs opacity-60">Platform</div>
              <div className="font-medium">{selected?.platform || "—"}</div>
            </div>
          </div>
        </aside>

        {/* CENTER: full details (lg:col-span-7) */}
        <section className={clsx("lg:col-span-7 rounded-2xl overflow-hidden", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/95 border border-zinc-200")}>
          <Card className="rounded-none shadow-none border-0">
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-xl md:text-2xl">{selected?.title || "Game details"}</CardTitle>
                <div className="text-sm opacity-60">{selected?.genre} • {selected?.platform} • {selected?.release_date}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={copyJSON}><Copy /></Button>
                <Button variant="outline" onClick={downloadJSON}><Download /></Button>
                <Button variant="ghost" onClick={() => setShowSuggest(s => !s)}>{showSuggest ? <List /> : <List />}</Button>
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
                  <div className="lg:col-span-2">
                    <div className="prose max-w-none dark:prose-invert">
                      <h3 className="text-lg font-semibold mb-2">Overview</h3>
                      <p className="text-sm leading-relaxed">{selected.short_description || selected.description || "No description available."}</p>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-base font-semibold mb-2">Details & Stats</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg border">
                          <div className="text-xs opacity-60">Game ID</div>
                          <div className="font-medium">{selected.id}</div>
                        </div>

                        <div className="p-3 rounded-lg border">
                          <div className="text-xs opacity-60">Genre</div>
                          <div className="font-medium">{selected.genre}</div>
                        </div>

                        <div className="p-3 rounded-lg border">
                          <div className="text-xs opacity-60">Platform</div>
                          <div className="font-medium">{selected.platform}</div>
                        </div>

                        <div className="p-3 rounded-lg border">
                          <div className="text-xs opacity-60">Developer</div>
                          <div className="font-medium">{selected.developer}</div>
                        </div>

                        <div className="p-3 rounded-lg border">
                          <div className="text-xs opacity-60">Publisher</div>
                          <div className="font-medium">{selected.publisher}</div>
                        </div>

                        <div className="p-3 rounded-lg border">
                          <div className="text-xs opacity-60">Version</div>
                          <div className="font-medium">{selected?.freetogame_profile?.version || "—"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-base font-semibold mb-2">About / More</h4>
                      <div className="text-sm leading-relaxed">
                        {selected.description || selected.short_description || "No extended description provided by API."}
                      </div>
                    </div>
                  </div>

                  {/* Right column inside center: screenshots / tags */}
                  <aside className="lg:col-span-1 space-y-4">
                    <div className="rounded-lg p-3 border">
                      <div className="text-xs opacity-60 mb-2">Screenshots</div>
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
                      <div className="text-xs opacity-60 mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {selected?.genre && <TagPill>{selected.genre}</TagPill>}
                        {selected?.platform && <TagPill>{selected.platform}</TagPill>}
                        {selected?.publisher && <TagPill>{selected.publisher}</TagPill>}
                      </div>
                    </div>

                    <div className="rounded-lg p-3 border">
                      <div className="text-xs opacity-60 mb-2">Quick Stats</div>
                      <div className="text-sm">
                        <div className="flex justify-between"><div className="opacity-60">Release</div><div className="font-medium">{selected.release_date || "—"}</div></div>
                        <div className="flex justify-between mt-2"><div className="opacity-60">Platform</div><div className="font-medium">{selected.platform}</div></div>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: Quick actions (lg:col-span-2) */}
        <aside className={clsx("lg:col-span-2 rounded-2xl p-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/95 border border-zinc-200")}>
          <div className="text-sm font-semibold mb-2">Quick Actions</div>

          <div className="space-y-2">
            <Button className="w-full justify-start" onClick={openGame}><ExternalLink className="mr-2" /> Open Official</Button>
            <Button className="w-full justify-start" onClick={() => setDialogOpen(true)}><ImageIcon className="mr-2" /> View Image</Button>
            <Button className="w-full justify-start" onClick={copyJSON}><Copy className="mr-2" /> Copy JSON</Button>
            <Button className="w-full justify-start" onClick={downloadJSON}><Download className="mr-2" /> Download JSON</Button>
            <Button className="w-full justify-start" onClick={() => { if (selected?.game_url) window.open(selected.game_url + "?utm_source=explorer", "_blank"); else showToast("info", "No game link"); }} variant="outline"><ArrowRightCircle className="mr-2" /> Play / Visit</Button>
          </div>

          <Separator className="my-4" />

          <div className="text-xs opacity-60">API</div>
          <div className="mt-2 text-sm break-all">{API_ENDPOINT}</div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
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
