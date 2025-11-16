// src/pages/HarryPotterPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  BookOpen,
  MapPin,
  User,
  Wand,
  CheckCircle,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

/* ---------- Config ---------- */
const ENDPOINT = "https://hp-api.onrender.com/api/characters";
const DEFAULT_SUGGEST_LIMIT = 10;
const DEFAULT_MSG = "Search by name, house, actor or species — try 'Harry', 'Hermione', 'Slytherin'...";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function safe(val) {
  if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) return "—";
  if (Array.isArray(val)) return val.length ? val.join(", ") : "—";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

/* ---------- Component ---------- */
export default function HarryPotterPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Data
  const [characters, setCharacters] = useState([]); // full list
  const [current, setCurrent] = useState(null); // selected character
  const [rawResp, setRawResp] = useState(null);

  // UI state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const suggestTimer = useRef(null);

  /* Fetch the full dataset once on mount */
  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      setLoading(true);
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!mounted) return;
        setCharacters(Array.isArray(json) ? json : []);
        setRawResp(json);
        // choose a sensible default: Harry Potter if present, otherwise first
        const defaultChar = (Array.isArray(json) && json.find((c) => /harry potter/i.test(c.name))) ?? (json && json[0]) ?? null;
        setCurrent(defaultChar);
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to load characters");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAll();
    return () => { mounted = false; };
  }, []);

  /* Client-side search/suggestions — filters the loaded array */
  function searchClient(q) {
    if (!characters || characters.length === 0) {
      setSuggestions([]);
      return;
    }
    const needle = (q || "").trim().toLowerCase();
    if (!needle) {
      setSuggestions([]);
      return;
    }
    const matches = characters.filter((c) => {
      // fields to match on: name, alternate_names, house, actor, species
      const text = [
        c.name,
        ...(Array.isArray(c.alternate_names) ? c.alternate_names : []),
        c.house,
        c.actor,
        c.species,
        c.ancestry
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(needle);
    });
    setSuggestions(matches.slice(0, DEFAULT_SUGGEST_LIMIT));
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    setLoadingSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      searchClient(v);
      setLoadingSuggest(false);
    }, 230);
  }

  function pickSuggestion(item) {
    setCurrent(item);
    setShowSuggest(false);
    setQuery("");
    // attach rawResp for ability to view the particular item's JSON (local subset)
    setRawResp(item);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || !query.trim()) {
      showToast("info", DEFAULT_MSG);
      return;
    }
    // if suggestions already present, pick the first suggestion or do a broader filter
    const needle = query.trim().toLowerCase();
    setLoading(true);
    try {
      // prefer client-side exact first-match on name
      const exact = characters.find((c) => c.name?.toLowerCase() === needle);
      if (exact) {
        setCurrent(exact);
        setRawResp(exact);
        setShowSuggest(false);
        setQuery("");
        showToast("success", `Loaded ${exact.name}`);
        return;
      }
      // otherwise fallback to first partial match
      const partial = characters.find((c) => {
        const text = [
          c.name,
          ...(Array.isArray(c.alternate_names) ? c.alternate_names : []),
          c.actor,
          c.house,
          c.species
        ].filter(Boolean).join(" ").toLowerCase();
        return text.includes(needle);
      });
      if (partial) {
        setCurrent(partial);
        setRawResp(partial);
        setShowSuggest(false);
        setQuery("");
        showToast("success", `Loaded ${partial.name}`);
      } else {
        showToast("info", "No matching character found");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function copyCurrent() {
    if (!current) return showToast("info", "No character selected");
    navigator.clipboard.writeText(prettyJSON(current));
    showToast("success", "Character JSON copied");
  }

  function downloadCurrent() {
    if (!current) return showToast("info", "No character selected");
    const blob = new Blob([prettyJSON(current)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(current.name || "character").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  const wandDescription = (w) => {
    if (!w || Object.keys(w).length === 0) return "—";
    return `${w.wood || "unknown wood"} / ${w.core || "unknown core"}${w.length ? ` / ${w.length}"` : ""}`;
  };

  // presentation-ready derived values
  const badges = useMemo(() => {
    if (!current) return [];
    return [
      { label: current.house || "No house", key: "house" },
      { label: current.species || "Species unknown", key: "species" },
      { label: current.ancestry || "Ancestry unknown", key: "ancestry" },
      { label: current.patronus || "Patronus unknown", key: "patronus" }
    ];
  }, [current]);

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Revolyx — Harry Potter Characters</h1>
          <p className="mt-1 text-sm opacity-70">Explore characters, their houses, wands, actor and more. Data from the HP API.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-1 border", isDark ? "bg-black/50 border-zinc-800" : "bg-white border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search by name, house, actor or species (e.g. 'Hermione', 'Slytherin')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" onClick={() => { setShowSuggest(true); searchClient(query); }}>
              Suggest
            </Button>
            <Button type="submit" variant="ghost"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s.name + idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => pickSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <img src={s.image || ""} alt={s.name} className="w-12 h-12 object-cover rounded-sm flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-xs opacity-60 truncate">{[s.house, s.actor, s.species].filter(Boolean).join(" • ")}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.alive ? "Alive" : "Deceased"}</div>
                </div>
              </li>
            ))}
            {suggestions.length === 0 && !loadingSuggest && (<li className="p-3 text-sm opacity-60">No suggestions</li>)}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Center: character viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Character</CardTitle>
                <div className="text-xs opacity-60">{current?.name ?? (loading ? "Loading..." : "Select a character")}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { setCurrent(characters[0] ?? null); setRawResp(characters[0] ?? null); }}><Loader2 className={loading ? "animate-spin" : ""} /> Default</Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide Raw" : "View Raw"}</Button>
                <Button variant="ghost" onClick={() => setImageOpen(true)}><ImageIcon /> View Image</Button>
                <Button variant="ghost" onClick={() => copyCurrent()}><Copy /></Button>
                <Button variant="ghost" onClick={() => downloadCurrent()}><Download /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No character selected — use search or choose the default.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: image & metadata */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="w-full h-88 rounded-md overflow-hidden mb-3 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                      {current.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={current.image} alt={current.name} className=" w-full h-full" />
                      ) : (
                        <div className="text-sm opacity-60">No image available</div>
                      )}
                    </div>

                    <div className="text-xl font-semibold">{current.name}</div>
                    <div className="text-xs opacity-60">{current.alternate_names && current.alternate_names.length ? `Also: ${current.alternate_names.join(", ")}` : ""}</div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {badges.map(b => (
                        <div key={b.key} className="px-2 py-1 rounded-full text-xs border">{b.label}</div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Actor</div>
                        <div className="font-medium">{safe(current.actor)}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Born</div>
                        <div className="font-medium">{(current.dateOfBirth || current.yearOfBirth) ? `${safe(current.dateOfBirth)} ${current.yearOfBirth ? `(${current.yearOfBirth})` : ""}` : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Alive</div>
                        <div className="font-medium">{current.alive ? "Yes" : "No"}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" onClick={() => { if (current.wand && Object.keys(current.wand).length) showToast("info", `Wand: ${wandDescription(current.wand)}`); else showToast("info", "Wand unknown"); }}><Wand /> Wand</Button>
                      <Button variant="ghost" onClick={() => { if (current.image) window.open(current.image, "_blank"); else showToast("info", "No image"); }}><ExternalLink /> Open Image</Button>
                    </div>
                  </div>

                  {/* Right: details */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Overview</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs opacity-60">Gender</div>
                        <div className="font-medium">{safe(current.gender)}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Species</div>
                        <div className="font-medium">{safe(current.species)}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">House</div>
                        <div className="font-medium">{safe(current.house)}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Ancestry</div>
                        <div className="font-medium">{safe(current.ancestry)}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Eye Colour</div>
                        <div className="font-medium">{safe(current.eyeColour)}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Hair Colour</div>
                        <div className="font-medium">{safe(current.hairColour)}</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="mt-3">
                      <div className="text-sm font-semibold mb-2">Wand</div>
                      <div className="text-sm">{wandDescription(current.wand)}</div>
                    </div>

                    <Separator className="my-3" />

                    <div>
                      <div className="text-sm font-semibold mb-2">Biography / Notes</div>
                      <div className="text-sm leading-relaxed">{current.actor ? `Played by ${current.actor}.` : ""} {current.patronus ? `Patronus: ${current.patronus}.` : ""} {(current.hogwartsStudent ? "Hogwarts student. " : "") + (current.hogwartsStaff ? "Hogwarts staff. " : "")}</div>
                    </div>

                    <Separator className="my-3" />

                    <div>
                      <div className="text-sm font-semibold mb-2">All fields (raw)</div>
                      <ScrollArea className="h-40 rounded-md border p-2">
                        <pre className="text-xs whitespace-pre-wrap">{prettyJSON(current)}</pre>
                      </ScrollArea>
                    </div>

                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: quick info / utilities */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Quick Actions</div>
              <div className="text-xs opacity-60">Utilities</div>
            </div>

            <div className="space-y-2">
              <Button className="w-full" variant="outline" onClick={() => { setCurrent(characters.find(c => /harry potter/i.test(c.name)) ?? characters[0] ?? null); setRawResp(characters.find(c => /harry potter/i.test(c.name)) ?? characters[0] ?? null); }}>
                <User /> Focus Harry
              </Button>

              <Button className="w-full" variant="outline" onClick={() => { setShowRaw(s => !s); }}>
                <List /> Toggle Raw Response
              </Button>

              <Button className="w-full" variant="outline" onClick={() => { navigator.clipboard.writeText(ENDPOINT); showToast("success", "Endpoint copied"); }}>
                <Copy /> Copy Endpoint
              </Button>

              <Button className="w-full" variant="outline" onClick={() => { if (rawResp) { const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `hp_characters.json`; a.click(); URL.revokeObjectURL(a.href); showToast("success", "Exported dataset"); } else { showToast("info", "No dataset to export"); } }}>
                <Download /> Export Dataset
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About</div>
            <div className="text-xs opacity-60">This page consumes data from <code className="rounded px-1 py-0.5 bg-zinc-100 dark:bg-zinc-900">https://hp-api.onrender.com/api/characters</code>. All fields returned by the API are presented for inspection on this page.</div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{current?.name || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {current?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.image} alt={current?.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image supplied by the HP API dataset</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (current?.image) window.open(current.image, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
