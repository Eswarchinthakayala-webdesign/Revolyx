// src/pages/PokemonPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Copy as CopyIcon,
  Download,
  Loader2,
  ImageIcon,
  List,
  Menu,
  X,
  Check,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clipboard,
  Zap,
  Star,
  Info,
} from "lucide-react";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { showToast } from "../lib/ToastHelper";
import { useTheme } from "@/components/theme-provider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const POKE_LIST_ENDPOINT = "https://pokeapi.co/api/v2/pokemon?limit=2000";
const DEFAULT_POKEMON = "pikachu";

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}
function safeGet(obj, path, fallback = "") {
  try {
    return path.split(".").reduce((a, k) => (a ? a[k] : undefined), obj) ?? fallback;
  } catch {
    return fallback;
  }
}
function flattenSprites(spritesObj) {
  const out = [];
  function recurse(prefix, node) {
    if (!node) return;
    Object.entries(node).forEach(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "string") {
        if (v) out.push({ key, url: v });
      } else if (typeof v === "object") {
        recurse(key, v);
      }
    });
  }
  recurse("", spritesObj);
  return out;
}

function StatTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="bg-white/95 dark:bg-black/90 border border-zinc-200 dark:border-zinc-800 rounded-md p-2 text-xs shadow">
      <div className="font-semibold capitalize">{p.statLabel}</div>
      <div className="text-sm opacity-80">Base: {p.value}</div>
    </div>
  );
}

export default function PokemonPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Core state
  const [query, setQuery] = useState("");
  const [pokemonList, setPokemonList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [current, setCurrent] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingPokemon, setLoadingPokemon] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const [evolutionChain, setEvolutionChain] = useState([]);
  const [speciesData, setSpeciesData] = useState(null);

  // Sprite dialog state
  const [spriteIndex, setSpriteIndex] = useState(0);
  const [spriteList, setSpriteList] = useState([]);

  // sidebar/mobile sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [randomSidebarList, setRandomSidebarList] = useState([]);
  const [sidebarLoading, setSidebarLoading] = useState(false);

  // copy animation state
  const [copied, setCopied] = useState(false);

  const suggestTimer = useRef(null);

  /* ---------- Load master list ---------- */
  useEffect(() => {
    let cancelled = false;
    async function fetchList() {
      try {
        const res = await fetch(POKE_LIST_ENDPOINT);
        if (!res.ok) throw new Error("list fetch failed");
        const json = await res.json();
        if (!cancelled) {
          setPokemonList(json.results || []);
          pickRandomSidebar(json.results || []);
        }
      } catch (err) {
        console.error("Failed to fetch pokemon list", err);
      }
    }
    fetchList();
    return () => (cancelled = true);
  }, []);

  /* ---------- Initial default pokemon ---------- */
  useEffect(() => {
    fetchPokemon(DEFAULT_POKEMON);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- pick random sidebar ---------- */
  function pickRandomSidebar(list = pokemonList, count = 10) {
    if (!list || list.length === 0) {
      setRandomSidebarList([]);
      return;
    }
    setSidebarLoading(true);
    const copy = [...list];
    const out = [];
    for (let i = 0; i < Math.min(count, copy.length); i++) {
      const idx = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    setRandomSidebarList(out);
    setSidebarLoading(false);
  }

  /* ---------- Suggestion logic ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => generateSuggestions(v), 220);
  }

  async function generateSuggestions(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      setLoadingSuggest(false);
      return;
    }
    setLoadingSuggest(true);
    try {
      const term = q.trim().toLowerCase();
      const matches = pokemonList.filter((p) => p.name.includes(term)).slice(0, 10);

      const details = await Promise.all(
        matches.map(async (m) => {
          try {
            const res = await fetch(m.url);
            if (!res.ok) return { name: m.name, url: m.url };
            const j = await res.json();
            const sprite =
              j.sprites?.other?.["official-artwork"]?.front_default ||
              j.sprites?.front_default ||
              j.sprites?.other?.home?.front_default ||
              "";
            return { name: m.name, id: j.id, sprite, url: m.url };
          } catch {
            return { name: m.name, url: m.url };
          }
        })
      );

      setSuggestions(details);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  /* ---------- Fetch single Pokémon detail ---------- */
  async function fetchPokemon(identifier) {
    if (!identifier) return;
    setLoadingPokemon(true);
    try {
      const id = typeof identifier === "string" ? identifier.toLowerCase() : identifier;
      const url = `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(id)}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Pokémon fetch failed (${res.status})`);
        setLoadingPokemon(false);
        return;
      }
      const json = await res.json();
      setCurrent(json);
      setRawResp(json);
      setQuery(json.name || "");
      setShowSuggest(false);
      const sprites = flattenSprites(json.sprites || {});
      setSpriteList(sprites);
      setSpriteIndex(0);
      fetchSpeciesAndEvolution(json.species?.url);
      showToast("success", `Loaded: ${json.name}`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch Pokémon");
    } finally {
      setLoadingPokemon(false);
    }
  }

  /* ---------- Fetch species and evolution chain ---------- */
  async function fetchSpeciesAndEvolution(speciesUrl) {
    if (!speciesUrl) {
      setSpeciesData(null);
      setEvolutionChain([]);
      return;
    }
    try {
      const res = await fetch(speciesUrl);
      if (!res.ok) throw new Error("species fetch failed");
      const speciesJson = await res.json();
      setSpeciesData(speciesJson);

      const evoUrl = speciesJson.evolution_chain?.url;
      if (!evoUrl) {
        setEvolutionChain([]);
        return;
      }
      const evoRes = await fetch(evoUrl);
      if (!evoRes.ok) throw new Error("evo fetch failed");
      const evoJson = await evoRes.json();

      const chain = [];
      function walk(node) {
        if (!node) return;
        const name = node.species?.name;
        if (name) chain.push({ name, url: `https://pokeapi.co/api/v2/pokemon/${name}` });
        if (node.evolves_to && node.evolves_to.length > 0) {
          node.evolves_to.forEach((n) => walk(n));
        }
      }
      walk(evoJson.chain);

      const enriched = await Promise.all(
        chain.map(async (c) => {
          try {
            const r = await fetch(c.url);
            if (!r.ok) return { name: c.name };
            const j = await r.json();
            const sprite =
              j.sprites?.other?.["official-artwork"]?.front_default ||
              j.sprites?.front_default ||
              j.sprites?.other?.home?.front_default ||
              "";
            return { name: c.name, id: j.id, sprite, url: c.url };
          } catch {
            return { name: c.name };
          }
        })
      );

      const seen = new Set();
      const deduped = enriched.filter((e) => {
        if (seen.has(e.name)) return false;
        seen.add(e.name);
        return true;
      });

      setEvolutionChain(deduped);
    } catch (err) {
      console.error("Failed to load evolution chain", err);
      setEvolutionChain([]);
      setSpeciesData(null);
    }
  }

  /* ---------- Search submit ---------- */
  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Search for a Pokémon, e.g. 'pikachu' or 'charizard'...");
      return;
    }
    await fetchPokemon(query.trim().toLowerCase());
  }

  /* ---------- Quick actions ---------- */
  async function copyToClipboard() {
    if (!rawResp && !current) return showToast("info", "Nothing to copy");
    navigator.clipboard.writeText(prettyJSON(rawResp || current));
    setCopied(true);
    showToast("success", "JSON copied");
    // reset animation after a delay
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadJSON() {
    if (!rawResp && !current) return showToast("info", "Nothing to download");
    const payload = rawResp || current;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pokemon_${(payload.name || "pokemon")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function openPokeapi() {
    if (!current) return showToast("info", "No Pokémon loaded");
    window.open(`https://pokeapi.co/api/v2/pokemon/${current.name}`, "_blank");
  }

  /* ---------- Radar data ---------- */
  const radarData = useMemo(() => {
    if (!current?.stats) return [];
    return current.stats.map((s) => ({
      statLabel: s.stat.name.replace("special-", "sp. "),
      value: s.base_stat,
    }));
  }, [current]);

  /* ---------- Derived fields ---------- */
  const types = (current?.types || []).map((t) => t.type.name).join(", ") || "—";
  const abilities = (current?.abilities || []).map((a) => a.ability?.name).join(", ") || "—";

  /* ---------- Sprite dialog controls ---------- */
  function openSpriteDialog(startIndex = 0) {
    if (!spriteList || spriteList.length === 0) {
      showToast("info", "No sprites available");
      return;
    }
    setSpriteIndex(Math.max(0, Math.min(startIndex, spriteList.length - 1)));
    setDialogOpen(true);
  }
  function nextSprite() {
    setSpriteIndex((i) => Math.min(spriteList.length - 1, i + 1));
  }
  function prevSprite() {
    setSpriteIndex((i) => Math.max(0, i - 1));
  }

  /* ---------- UI helpers ---------- */
  function isMobile() {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1024px)").matches;
  }

  return (
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2 rounded-full cursor-pointer" aria-label="open menu">
                  <Menu />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-[85%] max-w-xs p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md w-10 h-10 bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
                      <Zap />
                    </div>
                    <div>
                      <div className="font-semibold">PokéPulse</div>
                      <div className="text-xs opacity-70">Quick picks</div>
                    </div>
                  </div>

                </div>

                <Separator className="my-2" />
                <div className="mb-2 text-xs opacity-70">Random Pokémon</div>
                <ScrollArea style={{ height: 360 }}>
                  <div className="space-y-2">
                    {sidebarLoading ? (
                      <div className="text-sm opacity-60">Loading…</div>
                    ) : randomSidebarList.length === 0 ? (
                      <div className="text-sm opacity-60">No items</div>
                    ) : (
                      randomSidebarList.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => { fetchPokemon(p.name); setSheetOpen(false); }}
                          className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-white/2 cursor-pointer"
                        >
                          <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${(p.name ? pokemonList.findIndex(pl => pl.name === p.name) + 1 : "")}.png`} alt={p.name} className="w-10 h-10 object-contain" />
                          <div className="flex-1 text-left">
                            <div className="font-medium capitalize">{p.name}</div>
                            <div className="text-xs opacity-60">Quick view</div>
                          </div>
                          <div className="text-xs opacity-60"><ChevronRight /></div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => pickRandomSidebar()}>
                    <RefreshCw /> Shuffle
                  </Button>
                  <Button variant="ghost" onClick={() => { setSheetOpen(false); }}>
                    Close
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-3">
          
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">PokéPulse</h1>
              <div className="text-xs opacity-70">Pokémon details, stats & explorers</div>
            </div>
          </div>
        </div>

        {/* search + actions */}
        <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
          <Search className="opacity-60" />
          <Input
            placeholder="Search Pokémon by name or id (e.g. 'pikachu', '25')..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="border-0 shadow-none bg-transparent outline-none placeholder:opacity-60"
            onFocus={() => setShowSuggest(true)}
          />
          <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { fetchPokemon(DEFAULT_POKEMON); pickRandomSidebar(); }}>
            <RefreshCw /> Refresh
          </Button>
          <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
        </form>
      </header>

      {/* Suggestions dropdown (absolute under header on desktop) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            <li className="p-2 text-xs opacity-60">Suggestions — {suggestions.length} results</li>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s.name || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => fetchPokemon(s.name)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                    {s.sprite ? <img src={s.sprite} alt={s.name} className="w-full h-full object-contain" /> : <div className="text-xs opacity-60">No Image</div>}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium capitalize">{s.name}</div>
                    <div className="text-xs opacity-60">#{s.id ?? "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">View</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left: Desktop sidebar with random picks */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-3", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-semibold">Quick Picks</div>
                <div className="text-xs opacity-70">10 random Pokémon</div>
              </div>
              <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-50">Poke</Badge>
            </div>

            <Separator className="my-2" />
            <ScrollArea style={{ height: 420 }}>
              <div className="space-y-2">
                {sidebarLoading ? (
                  <div className="text-sm opacity-60">Loading…</div>
                ) : randomSidebarList.length === 0 ? (
                  <div className="text-sm opacity-60">No items</div>
                ) : (
                  randomSidebarList.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => fetchPokemon(p.name)}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-white/2 cursor-pointer"
                    >
                      <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${(p.name ? pokemonList.findIndex(pl => pl.name === p.name) + 1 : "")}.png`} alt={p.name} className="w-12 h-12 object-contain" />
                      <div className="flex-1 text-left">
                        <div className="font-medium capitalize">{p.name}</div>
                        <div className="text-xs opacity-60">Tap to open</div>
                      </div>
                      <div className="text-xs opacity-60"><ChevronRight /></div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => pickRandomSidebar()}>
                <RefreshCw /> Shuffle
              </Button>
             
            </div>
          </Card>
          

          {/* Evolution card - kept brief in sidebar */}
               <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
                 <CardHeader className={clsx("p-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
                   <CardTitle className="text-sm">Sprites & Evolution Chain</CardTitle>
                 </CardHeader>
                 <CardContent>
                       <div className="w-full p-3 rounded-md text-sm opacity-60">
                    <div className="mb-1 font-semibold">Sprites</div>
                    <div className="flex gap-2 flex-wrap">
                      {flattenSprites(current?.sprites || {})
                        .slice(0, 8)
                        .map((s) => (
                          <button key={s.key} onClick={() => {
                            const idx = spriteList.findIndex(item => item.key === s.key);
                            openSpriteDialog(idx >= 0 ? idx : 0);
                          }} className="w-20 h-20 cursor-pointer rounded-md bg-zinc-100 dark:bg-zinc-900 p-2 flex items-center justify-center border">
                            <img src={s.url} alt={s.key} className="max-h-full max-w-full object-contain" />
                          </button>
                        ))}
                    </div>
                  </div>

                  <Separator/>
                   {evolutionChain.length === 0 ? (
                     <div className="text-sm opacity-60">No evolution chain available.</div>
                   ) : (
                     <div className="flex items-center gap-4 overflow-x-auto py-2">
                       {/* Horizontal line: stage by stage */}
                       {evolutionChain.map((evo, idx) => (
                         <div key={evo.name} className="flex items-center gap-3">
                           <button
                             onClick={() => fetchPokemon(evo.name)}
                             className={clsx("flex flex-col cursor-pointer items-center p-2 rounded-md border min-w-[120px] hover:shadow", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}
                           >
                             <img src={evo.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png`} alt={evo.name} className="w-20 h-20 object-contain mb-2" />
                             <div className="text-sm font-medium capitalize">{evo.name}</div>
                             <div className="text-xs opacity-60">#{evo.id ?? "—"}</div>
                           </button>
     
                           {/* arrow except after last */}
                           {idx < evolutionChain.length - 1 && (
                             <div className="text-zinc-400 dark:text-zinc-500"><ChevronRight /></div>
                           )}
                         </div>
                       ))}
                     </div>
                   )}
                 </CardContent>
               </Card>
        </aside>

        {/* Center content - main preview */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex flex-wrap items-center justify-between gap-3", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-center gap-3">
                <div className="rounded-full w-12 h-12 bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <ImageIcon />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Details <span className="text-xs opacity-60">— composed from PokeAPI</span>
                  </CardTitle>
                  <div className="text-xs opacity-70 flex items-center gap-2">
                    <Info className="w-4 h-4 opacity-70" /> Stats, moves, sprites & species
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer"><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => openSpriteDialog(0)} className="cursor-pointer"><ImageIcon /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingPokemon ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">Select a Pokémon to view full details.</div>
              ) : (
                <div className="space-y-4">
                  {/* Top preview banner */}
                  <div className={clsx("rounded-xl p-4 border flex items-center gap-4", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="w-[150px] flex-shrink-0">
                      <img
                        src={safeGet(current, "sprites.other.official-artwork.front_default", safeGet(current, "sprites.front_default", ""))}
                        alt={current.name}
                        className="w-full h-auto object-contain"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
                        <div>
                          <div className="text-2xl font-bold capitalize">{current.name} <span className="text-sm opacity-60">#{current.id}</span></div>
                          <div className="text-sm mt-1 opacity-70">Types: <span className="font-medium capitalize">{types}</span></div>
                          <div className="text-sm opacity-70">Abilities: <span className="font-medium capitalize">{abilities}</span></div>
                        </div>

                        <div className="flex flex-col items-start sm:items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-50 capitalize">{types.split(",")[0]}</Badge>
                            <Badge className="text-xs opacity-70">{current.height ? `${current.height / 10} m` : "—"}</Badge>
                          </div>
                          <div className="text-xs opacity-70">Base XP: <span className="font-medium">{current.base_experience ?? "—"}</span></div>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-justify opacity-70">
                        {/* A small generated summary to make the preview more lively */}
                        {`#${current.id} ${current.name.charAt(0).toUpperCase() + current.name.slice(1)} is a ${types} type Pokémon. Explore stats, moves and evolution stages below.`}
                      </div>
                    </div>
                  </div>

                  {/* Stats + Radar */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1">
                        <div className="text-lg font-semibold mb-2 flex items-center gap-2"><Star /> Stats</div>
                        <div className="grid grid-cols-2 gap-3">
                          {current.stats.map((s) => (
                            <div key={s.stat.name} className="p-2 rounded-md border cursor-pointer hover:shadow">
                              <div className="text-xs opacity-60 capitalize">{s.stat.name}</div>
                              <div className="text-sm font-medium">{s.base_stat} <span className="text-xs opacity-70">({s.effort ? `Effort: ${s.effort}` : "Effort: 0"})</span></div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ width: "320px", height: 260 }}>
                        <ResponsiveContainer>
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="statLabel" tick={{ fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, Math.max(...radarData.map(d => d.value), 100)]} />
                            <Radar name={current.name} dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.35} />
                            <RechartsTooltip content={<StatTooltip />} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Moves */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold mb-1 flex items-center gap-2"><List /> Moves</div>
                        <div className="text-xs opacity-60">Showing a readable subset. Use Download for full JSON.</div>
                      </div>
                      <div className="text-xs opacity-60">Total: {current.moves?.length ?? 0}</div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-auto">
                      {(current.moves || []).slice(0, 200).map((m) => (
                        <div key={m.move.name} className="p-2 rounded-md border text-sm capitalize cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/2">
                          {m.move.name}
                        </div>
                      ))}
                    </div>
                    {current.moves && current.moves.length > 200 && (
                      <div className="mt-2 text-xs opacity-60">Showing 200 of {current.moves.length} moves.</div>
                    )}
                  </div>
                    {/* Evolution card - kept brief in sidebar */}
               <Card className={clsx("rounded-2xl block sm:hidden overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
                 <CardHeader className={clsx("p-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
                   <CardTitle className="text-sm">Evolution Chain</CardTitle>
                 </CardHeader>
                 <CardContent>
                   {evolutionChain.length === 0 ? (
                     <div className="text-sm opacity-60">No evolution chain available.</div>
                   ) : (
                     <div className="flex items-center gap-4 overflow-x-auto py-2">
                       {/* Horizontal line: stage by stage */}
                       {evolutionChain.map((evo, idx) => (
                         <div key={evo.name} className="flex items-center gap-3">
                           <button
                             onClick={() => fetchPokemon(evo.name)}
                             className={clsx("flex flex-col cursor-pointer items-center p-2 rounded-md border min-w-[120px] hover:shadow", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}
                           >
                             <img src={evo.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png`} alt={evo.name} className="w-20 h-20 object-contain mb-2" />
                             <div className="text-sm font-medium capitalize">{evo.name}</div>
                             <div className="text-xs opacity-60">#{evo.id ?? "—"}</div>
                           </button>
     
                           {/* arrow except after last */}
                           {idx < evolutionChain.length - 1 && (
                             <div className="text-zinc-400 dark:text-zinc-500"><ChevronRight /></div>
                           )}
                         </div>
                       ))}
                     </div>
                   )}
                 </CardContent>
               </Card>
                  <Separator className="my-2" />
                  <AnimatePresence>
                    {showRaw && rawResp && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 rounded-md border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                        <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 420 }}>
                          {prettyJSON(rawResp)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions & meta (mobile: collapses under center) */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Quick Actions</div>
                <div className="text-xs opacity-60">Utilities for the current Pokémon</div>
              </div>
              <div className="text-xs opacity-60">v1</div>
            </div>

            <Separator className="my-3" />
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => openSpriteDialog(spriteIndex)} className="justify-start cursor-pointer"><ImageIcon /> View Sprites</Button>
              <Button variant="outline" onClick={() => openPokeapi()} className="justify-start cursor-pointer"><ExternalLink /> PokeAPI</Button>
              <Button variant="outline" onClick={() => copyToClipboard()} className="justify-start cursor-pointer"><Clipboard /> Copy JSON</Button>
              <Button variant="outline" onClick={() => downloadJSON()} className="justify-start cursor-pointer"><Download /> Download JSON</Button>
              <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="justify-start cursor-pointer"><List /> Toggle Raw</Button>
            </div>

            <Separator className="my-3" />
            <div className="text-sm font-semibold mb-2">Endpoint</div>
            <div className="text-xs opacity-60 break-words">{current ? `https://pokeapi.co/api/v2/pokemon/${current.name}` : "https://pokeapi.co/api/v2/pokemon/{name}"}</div>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="text-sm font-semibold mb-2">Pro Tips</div>
            <ul className="list-disc list-inside text-sm opacity-70">
              <li>Search by name or numeric id. Suggestions show images for quick selection.</li>
              <li>Radar chart visualizes base stats; hover for exact values.</li>
              <li>Click evolution stages to load that Pokémon.</li>
            </ul>
          </Card>
        </aside>
      </main>

      {/* Sprites dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx(" mx-2 p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{current?.name ? `Sprites — ${current.name}` : "Sprites"}</DialogTitle>
          </DialogHeader>

          <div style={{ minHeight: "55vh" }} className="p-4">
            {!spriteList || spriteList.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-sm opacity-60">No sprites available</div>
            ) : (
              <div className="flex gap-4">
                {/* Left: tab list */}
                {/* <div className="md:col-span-1">
                  <div className={clsx("space-y-2 max-h-[60vh] overflow-auto pr-2")}>
                    {spriteList.map((s, idx) => (
                      <button
                        key={s.key}
                        onClick={() => setSpriteIndex(idx)}
                        className={clsx("w-full text-left p-2 rounded-md flex items-center gap-3", idx === spriteIndex ? (isDark ? "bg-white/5 border border-zinc-700" : "bg-zinc-100 border border-zinc-200") : "hover:bg-zinc-50 dark:hover:bg-white/2")}
                      >
                        <div className="w-12 h-12 rounded-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                          <img src={s.url} alt={s.key} className="max-h-full max-w-full object-contain" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{s.key}</div>
                          <div className="text-xs opacity-60">Preview</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div> */}

                {/* Right: preview + prev/next */}
                <div className=" flex flex-col w-full h-full overflow-hidden">
                  <div className="flex items-center flex-wrap justify-between mb-3">
                    <div className="text-sm font-semibold capitalize">{spriteList[spriteIndex]?.key}</div>
                    <div className="flex items-center gap-2">
                      <Button className="cursor-pointer" variant="ghost" onClick={() => prevSprite()}><ArrowLeft /></Button>
                      <Button className="cursor-pointer" variant="ghost" onClick={() => nextSprite()}><ArrowRight /></Button>
                    </div>
                  </div>

                  <div className="flex-1 rounded-md border p-4 flex items-center justify-center">
                    <img src={spriteList[spriteIndex]?.url} alt={spriteList[spriteIndex]?.key} className="h-[30vh] object-cover" />
                  </div>

                  <div className="mt-3 text-xs overflow-auto no-scrollbar opacity-60">
                    <div>Key: <span className="font-medium">{spriteList[spriteIndex]?.key}</span></div>
                    <div className="overflow-auto no-scrollbar w-80">URL: <span className="break-words">{spriteList[spriteIndex]?.url}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Sprites from PokeAPI</div>
            <div className="flex gap-2">
              <Button   className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
              {spriteList && spriteList[spriteIndex] && (
                <Button  className="cursor-pointer" variant="outline" onClick={() => window.open(spriteList[spriteIndex].url, "_blank")}>
                  <ExternalLink />
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
