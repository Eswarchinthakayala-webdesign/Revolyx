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
  X,
  Menu,
  Gift,
  Heart,
  Info,
  Clock,
  Calendar,
  Zap,
  FileText,
  Layers,
  Smile,
  Film,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
// If you have shadcn's sheet component in your ui, import it. Otherwise replace with your modal/sheet.
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

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

function sampleTen(arr = []) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const copy = arr.slice();
  // fisher-yates shuffle first few
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 10);
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

  // mobile sheet
  const [sheetOpen, setSheetOpen] = useState(false);

  // copy button animated state
  const [copyStatus, setCopyStatus] = useState("idle"); // 'idle' | 'copied' | 'loading'

  const suggestTimer = useRef(null);

  // 10 random characters
  const [randomTen, setRandomTen] = useState([]);

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
        const arr = Array.isArray(json) ? json : [];
        setCharacters(arr);
        setRawResp(json);
        // choose a sensible default: Harry Potter if present, otherwise first
        const defaultChar = (Array.isArray(arr) && arr.find((c) => /harry potter/i.test(c.name))) ?? (arr && arr[0]) ?? null;
        setCurrent(defaultChar);
        setRandomTen(sampleTen(arr));
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
    showToast("success", `Loaded ${item.name}`);
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
    try {
      setCopyStatus("loading");
      navigator.clipboard.writeText(prettyJSON(current)).then(() => {
        setCopyStatus("copied");
        showToast("success", "Character JSON copied");
        // reset after short delay
        setTimeout(() => setCopyStatus("idle"), 1400);
      }).catch((err) => {
        console.error(err);
        setCopyStatus("idle");
        showToast("error", "Copy failed");
      });
    } catch (err) {
      console.error(err);
      showToast("error", "Copy failed");
    }
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

  // quick stats for nicer UI
  const stats = useMemo(() => {
    if (!current) return [];
    return [
      { icon: Clock, label: "Alive", value: current.alive ? "Yes" : "No" },
      { icon: Calendar, label: "Born", value: (current.dateOfBirth || current.yearOfBirth) ? `${safe(current.dateOfBirth)} ${current.yearOfBirth ? `(${current.yearOfBirth})` : ""}` : "—" },
      { icon: User, label: "Actor", value: safe(current.actor) },
      { icon: Layers, label: "Role", value: (current.hogwartsStudent ? "Student" : "") + (current.hogwartsStaff ? (current.hogwartsStudent ? ", Staff" : "Staff") : "") || "—" },
    ];
  }, [current]);

  // helper to focus a character
  const focusCharacter = (c) => {
    setCurrent(c);
    setRawResp(c);
    setSheetOpen(false); // close mobile sheet
    showToast("success", `Loaded ${c.name}`);
  };

  // refresh random ten on demand
  const refreshRandom = () => {
    setRandomTen(sampleTen(characters));
  };

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-8xl pb-10 mx-auto")}>
      {/* Responsive header: left title, right search + menu on mobile */}
      <header className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 md:hidden cursor-pointer">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full p-3 max-w-xs">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Smile /> Characters
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Random 10</div>
                  <Button size="sm" variant="ghost" onClick={refreshRandom} className="cursor-pointer"><Zap /></Button>
                </div>

                <div className="space-y-2 overflow-y-auto h-100">
                  {randomTen.map((r, idx) => (
                    <div key={r.name + idx} onClick={() => focusCharacter(r)} className="flex items-center gap-3 p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                      <img src={r.image || ""} alt={r.name} className="w-12 h-12 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{r.name}</div>
                        <div className="text-xs opacity-60 truncate">{[r.house, r.actor].filter(Boolean).join(" • ")}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button className="w-full cursor-pointer" variant="outline" onClick={() => { setCurrent(characters.find(c => /harry potter/i.test(c?.name)) ?? characters[0] ?? null); setRawResp(characters.find(c => /harry potter/i.test(c?.name)) ?? characters[0] ?? null); }}>
                    <User /> Focus Harry
                  </Button>
                  <Button className="w-full cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(ENDPOINT); showToast("success", "Endpoint copied"); }}>
                    <Copy /> Copy Endpoint
                  </Button>
                </div>
              </div>

              <SheetFooter className="mt-4">
                <div className="text-xs opacity-60">HP Dataset • API</div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className={clsx("text-2xl md:text-3xl font-extrabold leading-tight")}>Revolyx</h1>
            <div className="text-xs opacity-60">Harry Potter Characters — explore wands, houses, actors and more</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-1 border", isDark ? "bg-black/50 border-zinc-800" : "bg-white border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search by name, house, actor or species (e.g. 'Hermione', 'Slytherin')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" onClick={() => { setShowSuggest(true); searchClient(query); }} className="cursor-pointer">
              Suggest
            </Button>
            <Button type="submit" variant="ghost" className="cursor-pointer"><Search /></Button>
          </form>
        </div>

        {/* mobile search button */}
        <div className="md:hidden flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 cursor-pointer"><Search /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="max-w-md w-full">
              <SheetHeader>
                <SheetTitle>Search characters</SheetTitle>
              </SheetHeader>

              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full rounded-lg px-3 py-1 border mt-2">
                <Input
                  placeholder="Search by name, house, actor or species"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  className="border-0 shadow-none bg-transparent outline-none"
                />
                <Button type="submit" variant="ghost" className="cursor-pointer"><Search /></Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
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
            <CardHeader className={clsx("p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-3">
                  <Film className="opacity-70" />
                  <span>Character</span>
                </CardTitle>
                <div className="text-xs opacity-60">{current?.name ?? (loading ? "Loading..." : "Select a character")}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { setCurrent(characters[0] ?? null); setRawResp(characters[0] ?? null); }} className="cursor-pointer"><Loader2 className={loading ? "animate-spin" : ""} /> Default</Button>

                <Button variant="ghost" onClick={() => setShowRaw(s => !s)} className="cursor-pointer"><List /> {showRaw ? "Hide Raw" : "View Raw"}</Button>

                <Button variant="ghost" onClick={() => setImageOpen(true)} className="cursor-pointer"><ImageIcon /> View Image</Button>

                <Button variant="ghost" onClick={() => copyCurrent()} className="cursor-pointer relative">
                  {copyStatus === "copied" ? (
                    <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                      <CheckCircle />
                      <span className="sr-only">Copied</span>
                    </motion.div>
                  ) : copyStatus === "loading" ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Copy />
                  )}
                </Button>

                <Button variant="ghost" onClick={() => downloadCurrent()} className="cursor-pointer"><Download /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No character selected — use search or choose the default.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: image & key meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="w-full h-88 rounded-md overflow-hidden mb-3 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                      {current.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={current.image} alt={current.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-sm opacity-60">No image available</div>
                      )}
                    </div>

                    <div className="text-xl font-semibold">{current.name}</div>
                    <div className="text-xs opacity-60">{current.alternate_names && current.alternate_names.length ? `Also: ${current.alternate_names.join(", ")}` : ""}</div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {badges.map(b => (
                        <div key={b.key} className="px-2 py-1 rounded-full text-xs border cursor-pointer">{b.label}</div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><User className="w-3 h-3" /> Actor</div>
                        <div className="font-medium">{safe(current.actor)}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Calendar className="w-3 h-3" /> Born</div>
                        <div className="font-medium">{(current.dateOfBirth || current.yearOfBirth) ? `${safe(current.dateOfBirth)} ${current.yearOfBirth ? `(${current.yearOfBirth})` : ""}` : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Heart className="w-3 h-3" /> Alive</div>
                        <div className="font-medium">{current.alive ? "Yes" : "No"}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" onClick={() => { if (current.wand && Object.keys(current.wand).length) showToast("info", `Wand: ${wandDescription(current.wand)}`); else showToast("info", "Wand unknown"); }} className="cursor-pointer"><Wand /> Wand</Button>
                      <Button variant="ghost" onClick={() => { if (current.image) window.open(current.image, "_blank"); else showToast("info", "No image"); }} className="cursor-pointer"><ExternalLink /> Open Image</Button>
                    </div>
                  </div>

                  {/* Right: details (spans 2 cols) */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold flex items-center gap-2"><Info /> Overview</div>
                      <div className="text-xs opacity-60">ID: {current.name?.toLowerCase().replace(/\s+/g, "_")}</div>
                    </div>

                    {/* stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {stats.map((s, idx) => (
                        <div key={s.label + idx} className="p-3 rounded border text-sm cursor-default">
                          <div className="flex items-center gap-2">
                            <s.icon className="opacity-70" />
                            <div className="text-xs opacity-60">{s.label}</div>
                          </div>
                          <div className="mt-2 font-medium">{s.value}</div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-sm font-semibold mb-2"><Wand /> Wand</div>
                      <div className="text-sm">{wandDescription(current.wand)}</div>
                    </div>

                    <Separator className="my-3" />

                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold mb-2"><BookOpen /> Biography / Notes</div>
                      <div className="text-sm leading-relaxed">{current.actor ? `Played by ${current.actor}.` : ""} {current.patronus ? `Patronus: ${current.patronus}.` : ""} {(current.hogwartsStudent ? "Hogwarts student. " : "") + (current.hogwartsStaff ? "Hogwarts staff. " : "")}</div>
                    </div>

                    <Separator className="my-3" />

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm font-semibold"><FileText /> All fields (raw)</div>
                        <div className="text-xs opacity-60">Inspect</div>
                      </div>
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                        {prettyJSON(rawResp)}
                      </pre>
                    </div>
                    <div className="flex flex-col gap-2 ml-3">
                      <Button variant="outline" onClick={() => { navigator.clipboard.writeText(prettyJSON(rawResp)); showToast("success", "Raw copied"); }} className="cursor-pointer"><Copy /></Button>
                      <Button variant="outline" onClick={() => { const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `hp_raw.json`; a.click(); URL.revokeObjectURL(a.href); showToast("success", "Exported raw"); }} className="cursor-pointer"><Download /></Button>
                      <Button variant="ghost" onClick={() => setShowRaw(false)} className="cursor-pointer"><X /></Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: quick info / utilities */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold flex items-center gap-2"><Gift /> Quick Actions</div>
              <div className="text-xs opacity-60">Utilities</div>
            </div>

            <div className="space-y-2">
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { setCurrent(characters.find(c => /harry potter/i.test(c.name)) ?? characters[0] ?? null); setRawResp(characters.find(c => /harry potter/i.test(c.name)) ?? characters[0] ?? null); }}>
                <User /> Focus Harry
              </Button>

              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { setShowRaw(s => !s); }}>
                <List /> Toggle Raw Response
              </Button>

              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(ENDPOINT); showToast("success", "Endpoint copied"); }}>
                <Copy /> Copy Endpoint
              </Button>

              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { if (rawResp) { const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `hp_characters.json`; a.click(); URL.revokeObjectURL(a.href); showToast("success", "Exported dataset"); } else { showToast("info", "No dataset to export"); } }}>
                <Download /> Export Dataset
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><MapPin /> Random 10</div>
            <div className="grid grid-cols-2 gap-2">
              {randomTen.map((r, idx) => (
                <div key={r.name + idx} onClick={() => focusCharacter(r)} className="flex items-center gap-3 p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                  <img src={r.image || ""} alt={r.name} className="w-10 h-10 rounded object-cover" />
                  <div className="text-xs">
                    <div className="font-medium truncate">{r.name}</div>
                    <div className="opacity-60 truncate">{r.house || r.actor || "—"}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Button className="flex-1" variant="ghost" onClick={refreshRandom} ><Zap /></Button>
              <Button className="flex-1" variant="ghost" onClick={() => setRandomTen(sampleTen(characters))} ><RefreshIconMock /></Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About</div>
            <div className="text-xs opacity-60">This page consumes data from <code className="rounded px-1 py-0.5 bg-zinc-100 dark:bg-zinc-900">https://hp-api.onrender.com/api/characters</code>. All fields are shown for inspection.</div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
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
              <Button variant="ghost" onClick={() => setImageOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { if (current?.image) window.open(current.image, "_blank"); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Small placeholder because original icon set didn't contain Refresh in earlier import list —
   Replace this with a proper lucide import if you want (e.g. import { RefreshCcw } from "lucide-react") */
function RefreshIconMock() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80"><path d="M21 12a9 9 0 10-3 6.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 3v6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
