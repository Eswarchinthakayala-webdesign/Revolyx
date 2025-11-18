// src/pages/DisneyCharactersPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ImageIcon,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  List,
  ArrowLeftRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/*
  Disney Characters Page
  - Uses lucide-react icons
  - Layout: left (results), center (details), right (quick actions)
  - Theme behavior matches NewsApiPage (black for dark / white for light)
  - Designed as a professional, responsive single-page component
*/

/* ------------------ Config ------------------ */
/* Official docs use /character endpoint (base docs: https://disneyapi.dev/docs/) */
const BASE_ENDPOINT = "https://api.disneyapi.dev/character"; // <-- change to /character or your custom endpoint
const DEFAULT_MSG = "Search Disney characters by name, e.g. 'Mickey', 'Ariel'...";

/* ------------------ Helpers ------------------ */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

/* ------------------ Component ------------------ */
export default function DisneyCharactersPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // State
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [selected, setSelected] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingSelected, setLoadingSelected] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogImage, setDialogImage] = useState(null);

  const suggestTimer = useRef(null);

  /* ---------- API helpers ---------- */

  // Defensive parser for different API shapes
  function extractItems(json) {
    // disneyapi.dev returns { info, data: [...] } for list endpoints
    if (!json) return [];
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.results)) return json.results;
    if (json.results?.data && Array.isArray(json.results.data)) return json.results.data;
    // fallback to values that are arrays
    const vals = Object.values(json).find((v) => Array.isArray(v));
    return vals || [];
  }

  async function searchCharacters(name) {
    if (!name || !name.trim()) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const params = new URLSearchParams();
      params.set("name", name);
      // Use the BASE_ENDPOINT - docs show `/character?name=...`
      const url = `${BASE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      const json = await res.json();
      setRawResp(json);
      const items = extractItems(json);
      // disneyapi.dev returns `data` objects with _id, name, imageUrl, films...
      setSuggestions(items);
      setShowSuggest(true);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
      showToast("error", "Failed to search characters");
    } finally {
      setLoadingSuggest(false);
    }
  }

  async function fetchById(id) {
    if (!id) return;
    setLoadingSelected(true);
    try {
      const url = `${BASE_ENDPOINT}/${id}`;
      const res = await fetch(url);
      const json = await res.json();
      setRawResp(json);
      // API returns { info, data } where data is single object for id endpoint OR { data: { ... } }
      const item = json?.data || json || null;
      setSelected(item);
      showToast("success", `Loaded: ${item?.name ?? "character"}`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load character");
    } finally {
      setLoadingSelected(false);
    }
  }

  /* ---------- Handlers ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      searchCharacters(v);
    }, 350);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", DEFAULT_MSG);
      return;
    }
    // Submit: run search and choose the first match automatically
    setLoadingSuggest(true);
    try {
      const params = new URLSearchParams();
      params.set("name", query);
      const url = `${BASE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      const json = await res.json();
      setRawResp(json);
      const items = extractItems(json);
      if (items && items.length > 0) {
        // If endpoint returns 'data' as single object, handle it
        const first = items[0] || items;
        setSelected(first);
        setShowSuggest(false);
        showToast("success", `Found: ${first.name ?? "character"}`);
      } else {
        showToast("info", "No characters found — try another name");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Search failed");
    } finally {
      setLoadingSuggest(false);
    }
  }

  function onPickSuggestion(item) {
    // If API gave id, we can fetch detail by id, otherwise set directly
    const id = item._id || item.id;
    if (id) {
      fetchById(id);
    } else {
      setSelected(item);
      setRawResp({ data: [item] });
    }
    setShowSuggest(false);
  }

  function openImageDialog(img) {
    setDialogImage(img);
    setDialogOpen(true);
  }

  function copyJSON() {
    if (!selected) return showToast("info", "No character loaded");
    navigator.clipboard.writeText(prettyJSON(selected));
    showToast("success", "Character JSON copied");
  }

  function downloadJSON() {
    const payload = rawResp || selected;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = (selected?.name || "character").replace(/\s+/g, "_");
    a.download = `disney_${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* ---------- Initial example load ---------- */
  useEffect(() => {
    // load a popular character as default (Mickey Mouse id unknown, so do a name search)
    (async () => {
      try {
        await searchCharacters("Mickey");
        // pick first suggestion automatically after a short delay if exists
        setTimeout(() => {
          if (suggestions && suggestions.length > 0) {
            onPickSuggestion(suggestions[0]);
          }
        }, 600);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Render ---------- */
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Disney — Characters</h1>
          <p className="mt-1 text-sm opacity-70">Search Disney characters, inspect details, and export JSON</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search by name — e.g. 'Ariel', 'Goofy', 'Elsa'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
            <Button type="button" variant="outline" className="px-3" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); }}>Clear</Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && (loadingSuggest || (suggestions && suggestions.length > 0)) && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {!loadingSuggest && suggestions.length === 0 && <li className="p-3 text-sm opacity-60">No results</li>}
            {suggestions.map((s, idx) => (
              <li key={s._id || s.id || s.name || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => onPickSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <img src={s.imageUrl || s.imageUrl || ""} alt={s.name} className="w-14 h-10 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-60">{s._id ? `ID: ${s._id}` : (s.films?.length ? `${s.films.length} films` : "—")}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.tvShows?.length ? `${s.tvShows.length} TV shows` : ""}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout: left results | center details | right quick actions */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT: compact results (collapsible on small screens) */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/30 border border-zinc-800" : "bg-white/90 border border-zinc-200", "rounded-2xl p-4")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Results</div>
            <div className="text-xs opacity-60">Showing {suggestions?.length ?? 0}</div>
          </div>

          <ScrollArea className="h-96 rounded-md border p-2">
            <div className="space-y-2">
              {/* If suggestions present show them, else show recent selection */}
              {(suggestions && suggestions.length > 0) ? suggestions.map((s, i) => (
                <div key={s._id || i} className={clsx("flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/40", selected?.name === s.name ? "ring-2 ring-indigo-400" : "")} onClick={() => onPickSuggestion(s)}>
                  <img src={s.imageUrl || ""} alt={s.name} className="w-12 h-12 object-cover rounded-md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-xs opacity-60 truncate">{s.films?.slice(0,2).join(", ") || s.tvShows?.slice(0,2).join(", ") || "—"}</div>
                  </div>
                </div>
              )) : (
                <div className="text-sm opacity-60">No results yet — search above to find characters.</div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About</div>
            <div className="text-xs opacity-60">Data from the Disney Characters API. Fields shown adapt to the API response.</div>
          </div>
        </aside>

        {/* CENTER: full details */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-start gap-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex-1">
                <CardTitle className="text-lg">{selected?.name || "Select a character"}</CardTitle>
                <div className="text-xs opacity-60">{selected?._id ? `ID: ${selected._id}` : (selected ? "Details available" : "No character selected")}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="ghost" onClick={() => { setSelected(null); setRawResp(null); }}><ArrowLeftRight /></Button>
                <Button className="cursor-pointer" variant="outline" onClick={() => setDialogOpen(true)}><ImageIcon /></Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowSuggest(s => !s)}><List /> {showSuggest ? "Hide" : "Show"}</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingSelected ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selected ? (
                <div className="py-12 text-center text-sm opacity-60">No character selected. Try searching above or choose a result on the left.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* IMAGE & CORE META */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <img src={selected.imageUrl || selected.image || ""} alt={selected.name} className="w-full rounded-md object-cover mb-3 max-h-64" />
                    <div className="text-lg font-semibold">{selected.name}</div>
                    <div className="text-xs opacity-60">{selected.tvShows?.length ? `${selected.tvShows.length} TV shows` : (selected.films?.length ? `${selected.films.length} films` : "—")}</div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Allies</div>
                        <div className="font-medium">{(selected.allies && selected.allies.length) ? selected.allies.join(", ") : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Enemies</div>
                        <div className="font-medium">{(selected.enemies && selected.enemies.length) ? selected.enemies.join(", ") : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Park Attractions</div>
                        <div className="font-medium">{(selected.parkAttractions && selected.parkAttractions.length) ? selected.parkAttractions.join(", ") : "—"}</div>
                      </div>
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div className={clsx("p-4 rounded-xl border md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Overview</div>
                    <div className="text-sm leading-relaxed mb-3">{selected._shortDescription || selected._shortDescription || (selected._shortBio ?? selected.description) || `Appears in ${selected.films?.length ?? 0} films and ${selected.tvShows?.length ?? 0} TV shows.`}</div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Appearances</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Films</div>
                        <div className="text-sm font-medium">{(selected.films && selected.films.length) ? selected.films.join(", ") : "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">TV Shows</div>
                        <div className="text-sm font-medium">{(selected.tvShows && selected.tvShows.length) ? selected.tvShows.join(", ") : "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Video Games</div>
                        <div className="text-sm font-medium">{(selected.videoGames && selected.videoGames.length) ? selected.videoGames.join(", ") : "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Short Films</div>
                        <div className="text-sm font-medium">{(selected.shortFilms && selected.shortFilms.length) ? selected.shortFilms.join(", ") : "—"}</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Raw Fields</div>
                    <div className="text-xs opacity-60 mb-2">A compact JSON preview of fields returned by the API</div>
                    <pre className={clsx("text-xs overflow-auto p-3 rounded-md border", isDark ? "bg-black/30 text-zinc-200 border-zinc-800" : "bg-white/80 text-zinc-900 border-zinc-200")} style={{ maxHeight: 220 }}>
                      {prettyJSON(selected)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="text-sm font-semibold">Quick Actions</div>
          <div className="text-xs opacity-60">Actions for the selected character</div>

          <div className="mt-3 space-y-2">
            <Button variant="outline" className="w-full" onClick={() => { if (selected?.imageUrl) openImageDialog(selected.imageUrl); else showToast("info", "No image available"); }}>
              <ImageIcon /> View Image
            </Button>

            <Button variant="outline" className="w-full" onClick={() => copyJSON()}>
              <Copy /> Copy JSON
            </Button>

            <Button variant="outline" className="w-full" onClick={() => downloadJSON()}>
              <Download /> Download JSON
            </Button>

            <Button variant="ghost" className="w-full" onClick={() => {
              // quick filter: show items that share a film with selected (simple client side)
              if (!selected) return showToast("info", "Select a character first");
              const shared = (suggestions || []).filter(s => {
                const a = new Set(selected.films || []);
                return (s.films || []).some(f => a.has(f));
              });
              if (shared.length === 0) return showToast("info", "No related characters in current results");
              // show them by making them the main suggestions list
              setSuggestions(shared);
              setShowSuggest(true);
              showToast("success", `Found ${shared.length} related characters`);
            }}>
              <ArrowLeftRight /> Find related (shared films)
            </Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold">Developer</div>
            <div className="text-xs opacity-60 mt-1">Endpoint: <code className="break-all">{BASE_ENDPOINT}</code></div>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(BASE_ENDPOINT); showToast("success", "Endpoint copied"); }}>
                <Copy /> Copy
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(prettyJSON(rawResp || selected || {})); showToast("success", "Payload copied"); }}>
                <ExternalLink /> Payload
              </Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Image viewer dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selected?.name || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {dialogImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dialogImage} alt={selected?.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from API</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => { if (selected?.name) window.open(`https://www.google.com/search?q=${encodeURIComponent(selected.name)}`, "_blank"); }}>
                <ExternalLink /> Search
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
