// src/pages/RickMortyPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Copy,
  Download,
  ImageIcon,
  Loader2,
  List,
  Link as LinkIcon,
  Info,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------- Config for Rick & Morty ---------- */
const API_BASE = "https://rickandmortyapi.com/api/character";
const DEFAULT_PLACEHOLDER = "Search characters by name, e.g. 'Rick', 'Morty', 'Beth'...";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

export default function RickMortyPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [characters, setCharacters] = useState([]); // list from current fetch
  const [current, setCurrent] = useState(null); // selected character
  const [rawResp, setRawResp] = useState(null);
  const [loadingCharacter, setLoadingCharacter] = useState(false);

  // UI
  const [dialogOpen, setDialogOpen] = useState(false);
  const suggestTimer = useRef(null);
  const inputRef = useRef(null);

  /* ---------- Fetch helpers ---------- */
  async function fetchCharacters(name = "") {
    setLoadingCharacter(true);
    try {
      const url = name ? `${API_BASE}/?name=${encodeURIComponent(name)}` : `${API_BASE}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) {
          setCharacters([]);
          setCurrent(null);
          setRawResp(null);
          showToast("info", "No characters found.");
          return;
        }
        showToast("error", `Fetch failed (${res.status})`);
        return;
      }
      const json = await res.json();
      const results = json.results || [];
      setCharacters(results);
      setRawResp(json);
      if (results.length > 0) {
        setCurrent(results[0]);
        showToast("success", `Loaded: ${results[0].name}`);
      } else {
        setCurrent(null);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch characters");
    } finally {
      setLoadingCharacter(false);
    }
  }

  async function searchSuggestions(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const url = `${API_BASE}/?name=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(json.results || []);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  /* ---------- Handlers ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => searchSuggestions(v), 300);
  }

  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    // primary search -> fetch characters and show first
    fetchCharacters(query.trim());
    setShowSuggest(false);
  }

  function chooseSuggestion(c) {
    setCurrent(c);
    setRawResp({ results: [c] });
    setShowSuggest(false);
    setQuery(c.name);
  }

  function copyJSON() {
    const payload = rawResp || current;
    if (!payload) return showToast("info", "Nothing to copy");
    navigator.clipboard.writeText(prettyJSON(payload));
    showToast("success", "Copied JSON to clipboard");
  }

  function downloadJSON() {
    const payload = rawResp || current;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    const name = current?.name?.replace(/\s+/g, "_") || "rickmorty";
    a.href = URL.createObjectURL(blob);
    a.download = `rickmorty_${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Download started");
  }

  function openOriginal() {
    if (!current) return showToast("info", "No character selected");
    // Rick & Morty API doesn't have an article link; link to character page on rickandmortyapi.com
    const url = `https://rickandmortyapi.com/character/${current.id}`;
    window.open(url, "_blank");
  }

  useEffect(() => {
    // initial load: fetch first page
    fetchCharacters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Rick & Morty — Character Explorer</h1>
          <p className="mt-1 text-sm opacity-70 max-w-xl">
            Search and inspect characters from the Rick & Morty universe. Live suggestions, clean metadata, and quick actions.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className={clsx("relative w-full md:w-[640px]")} role="search">
          <div className={clsx("flex items-center gap-2 rounded-lg px-3 py-2",
            isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              ref={inputRef}
              placeholder={DEFAULT_PLACEHOLDER}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              className="border-0 bg-transparent outline-none shadow-none"
              aria-label="Search characters"
            />
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </div>

          {/* Suggestions dropdown anchored to the search box */}
          <AnimatePresence>
            {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={clsx("absolute left-0 right-0 mt-2 max-h-80 overflow-auto rounded-xl shadow-2xl z-50",
                  isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
              >
                {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    onClick={() => chooseSuggestion(s)}
                    className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                    role="option"
                    aria-selected={current?.id === s.id}
                  >
                    <div className="flex items-center gap-3">
                      <img src={s.image} alt={s.name} className="w-12 h-12 object-cover rounded-md" />
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

      {/* Main layout: left (meta), center (details), right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Image + quick profile summary */}
        <aside className={clsx("lg:col-span-3 space-y-4 rounded-2xl p-4 h-fit",
          isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <Card className={clsx("rounded-xl overflow-hidden border-0 bg-transparent")}>
            <CardContent className="p-0">
              <div className="p-4">
                {loadingCharacter ? (
                  <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                ) : current ? (
                  <>
                    <div className="w-full rounded-xl overflow-hidden mb-4 border">
                      <img src={current.image} alt={current.name} className="w-full h-64 object-cover" />
                    </div>
                    <div className="text-lg font-semibold">{current.name}</div>
                    <div className="text-xs opacity-60">{current.species} • {current.status}</div>

                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Gender</div>
                        <div className="font-medium">{current.gender || "Unknown"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Origin</div>
                        <div className="font-medium">{current.origin?.name || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Location</div>
                        <div className="font-medium">{current.location?.name || "—"}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-sm opacity-60">Select a character or search to get started.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About this API</div>
            <div className="text-xs opacity-70">Rick & Morty API — public, free, no API key needed. Results adapt to character fields returned by the API.</div>
            <div className="mt-3">
              <Button variant="outline" className="w-full" onClick={() => { navigator.clipboard.writeText(API_BASE); showToast("success", "Endpoint copied"); }}>
                <Copy /> Copy API Endpoint
              </Button>
            </div>
          </div>
        </aside>

        {/* Center: Full details */}
        <section className={clsx("lg:col-span-6 rounded-2xl p-4",
          isDark ? "bg-black/30 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <Card className={clsx("rounded-2xl overflow-hidden border-0",isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/50 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">{current?.name || "Character Details"}</CardTitle>
                <div className="text-xs opacity-60">{current ? `${current.species} • ${current.status} • #${current.id}` : "No character selected"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setDialogOpen(true)} disabled={!current}><ImageIcon /> View Image</Button>
                <Button variant="ghost" onClick={() => setShowSuggest((s) => !s)}><List /> Suggestions</Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingCharacter ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">Search for characters using the box above. Suggestions appear as you type.</div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="text-sm font-semibold mb-2">Biography</div>
                    <div className="text-sm leading-relaxed">
                      <span className="font-medium">{current.name}</span> is a <span className="font-medium">{current.species}</span> from <span className="font-medium">{current.origin?.name}</span>.
                      {current.type ? ` Type: ${current.type}.` : ""} {current.episode?.length ? `Appears in ${current.episode.length} episode(s).` : ""}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-semibold mb-2">Key Attributes</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Status</div>
                        <div className="font-medium">{current.status}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Species</div>
                        <div className="font-medium">{current.species}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Gender</div>
                        <div className="font-medium">{current.gender}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Origin</div>
                        <div className="font-medium">{current.origin?.name}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold mb-2">Episodes (first 6)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {current.episode?.slice(0, 6).map((epUrl) => (
                        <a key={epUrl} href={epUrl} target="_blank" rel="noreferrer" className="p-3 rounded-md border hover:shadow-sm flex items-center gap-3">
                          <LinkIcon className="opacity-70" />
                          <div className="text-sm truncate">{epUrl}</div>
                        </a>
                      ))}
                      {!current.episode?.length && <div className="text-xs opacity-60">No episode data available</div>}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-semibold mb-2">Raw fields</div>
                    <div className={clsx("p-3 rounded-md border overflow-auto text-xs", isDark ? "bg-black/20" : "bg-white") } style={{ maxHeight: 260 }}>
                      <pre className={clsx(isDark ? "text-zinc-200" : "text-zinc-900")}>
                        {prettyJSON(current)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: Quick actions + large controls */}
        <aside className={clsx("lg:col-span-3 space-y-4 rounded-2xl p-4 h-fit",
          isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Quick Actions</div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => fetchCharacters(query || "")}><Loader2 className={loadingCharacter ? "animate-spin" : ""} /> Refresh</Button>
              <Button variant="outline" onClick={openOriginal}><ExternalLink /> Open API Page</Button>
              <Button variant="outline" onClick={copyJSON}><Copy /> Copy JSON</Button>
              <Button variant="outline" onClick={downloadJSON}><Download /> Download JSON</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About</div>
            <div className="text-xs opacity-70">
              This explorer adapts to the Rick & Morty API response schema: `id`, `name`, `status`, `species`, `type`, `gender`, `origin`, `location`, `image`, `episode`.
              The page is responsive and designed for both dark and light themes.
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{current?.name || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {current?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.image} alt={current?.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center"><Info /> No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from Rick & Morty API</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={openOriginal}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
