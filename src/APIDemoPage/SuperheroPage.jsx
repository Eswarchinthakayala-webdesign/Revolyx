// src/pages/SuperheroApiPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Copy,
  Download,
  Loader2,
  ExternalLink,
  ImageIcon,
  Info,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as ReTooltip,
} from "recharts";

/**
 * SuperheroApiPage
 *
 * - Uses the Akabab dataset hosted at:
 *   https://akabab.github.io/superhero-api/api/all.json
 *
 * - Layout / theme / UI follows the NewsApiPage style:
 *   - Header with search + animated suggestion dropdown
 *   - Main card (hero overview + radar chart)
 *   - Right developer tools / metadata panel
 *   - Raw JSON viewer toggle
 *   - Modal image preview
 *
 * - NOTE: Saved favorites were removed per request.
 */

// -------------------- CONFIG --------------------
const ALL_ENDPOINT = "https://akabab.github.io/superhero-api/api/all.json";
const FALLBACK_IMG = "https://via.placeholder.com/512x640?text=No+Image";

// -------------------- HELPERS --------------------
const prettyJSON = (o) => JSON.stringify(o, null, 2);
const clampNum = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
};
const powerstatsToRadar = (ps = {}) => {
  // order consistent with UI
  const keys = ["intelligence", "strength", "speed", "durability", "power", "combat"];
  return keys.map((k) => ({ subject: k.replace(/^\w/, (c) => c.toUpperCase()), value: clampNum(ps[k]) }));
};

// -------------------- COMPONENT --------------------
export default function SuperheroApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // data
  const [allHeroes, setAllHeroes] = useState(null); // null = loading, [] = loaded no results
  const [rawAllJson, setRawAllJson] = useState(null);

  // search UI
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestTimer = useRef(null);

  // selected hero
  const [hero, setHero] = useState(null);
  const [loadingHero, setLoadingHero] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  // chart/theme visuals
  const radarColor = isDark ? "#60a5fa" : "#2563eb";
  const gridStroke = isDark ? "#17202a" : "#e6e6e6";

  // fetch all heroes once on mount (fast CDN)
  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      try {
        setAllHeroes(null);
        const res = await fetch(ALL_ENDPOINT);
        if (!res.ok) {
          showToast("error", `Failed to load heroes (${res.status})`);
          setAllHeroes([]);
          return;
        }
        const json = await res.json();
        if (!mounted) return;
        setAllHeroes(json);
        setRawAllJson(json);
      } catch (err) {
        console.error("load all err", err);
        showToast("error", "Failed to fetch hero dataset");
        setAllHeroes([]);
      }
    }
    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  // helper: search/filter locally from allHeroes
  const doLocalSearch = (q) => {
    if (!allHeroes || !q.trim()) return [];
    const low = q.trim().toLowerCase();
    // prioritize prefix matches then contains
    const prefix = [];
    const contains = [];
    for (const h of allHeroes) {
      const name = (h.name || "").toLowerCase();
      if (name.startsWith(low)) prefix.push(h);
      else if (name.includes(low)) contains.push(h);
    }
    return [...prefix.slice(0, 8), ...contains.slice(0, 12)];
  };

  // debounce suggestions
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    setLoadingSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const res = doLocalSearch(v);
      setSuggestions(res);
      setLoadingSuggest(false);
    }, 180);
  }

  // handle pick a suggestion
  function chooseHero(h) {
    if (!h) return;
    setHero(h);
    setShowSuggest(false);
    setQuery(h.name);
    setShowRaw(false);
    // ensure image preloads
    const img = new Image();
    img.src = h.images?.md || h.images?.sm || h.images?.lg || FALLBACK_IMG;
    showToast("success", `Loaded ${h.name}`);
  }

  // handle search submit -> try to pick exact match else first suggestion
  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query.trim()) return;
    setShowSuggest(false);
    setLoadingHero(true);
    // try exact match in allHeroes
    const q = query.trim().toLowerCase();
    const exact = (allHeroes || []).find((h) => (h.name || "").toLowerCase() === q);
    if (exact) {
      chooseHero(exact);
      setLoadingHero(false);
      return;
    }
    // else pick first suggestion
    const candidates = doLocalSearch(query);
    if (candidates && candidates.length > 0) {
      chooseHero(candidates[0]);
    } else {
      showToast("info", "No matching hero found");
    }
    setLoadingHero(false);
  }

  // copy & download tooling
  function copyEndpointFor(name) {
    // We'll reference the all.json + id endpoint pattern
    const ep = `https://akabab.github.io/superhero-api/api/id/{id}.json  (use id for hero)`;
    navigator.clipboard.writeText(ep);
    showToast("success", "Endpoint reference copied");
  }
  function copyJSON(payload) {
    const p = payload || hero || rawAllJson || {};
    navigator.clipboard.writeText(prettyJSON(p));
    showToast("success", "Copied JSON");
  }
  function downloadJSON(payload, filename = "superhero.json") {
    const p = payload || hero || rawAllJson || {};
    const blob = new Blob([prettyJSON(p)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  // derived radar data
  const radarData = useMemo(() => powerstatsToRadar(hero?.powerstats || {}), [hero?.powerstats]);

  // small ui helpers
  const cardBg = isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200";
  const subtle = isDark ? "text-zinc-300" : "text-zinc-600";

  // preload first hero sample if dataset loaded and no hero selected: pick a representative hero (Iron Man if present)
  useEffect(() => {
    if (!allHeroes || allHeroes.length === 0 || hero) return;
    // try find "Iron Man" / "Ironman" / id 732
    const prefer = allHeroes.find((h) => h.id === 732) || allHeroes.find((h) => (h.name || "").toLowerCase().includes("ironman")) || allHeroes[0];
    if (prefer) {
      setHero(prefer);
      setQuery(prefer.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allHeroes]);

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Revolyx · Superheroes</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 max-w-xl">Search and explore heroes using the Akabab dataset. Click a result to view full profile and powerstats.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("relative flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="w-4 h-4 text-gray-500 dark:text-gray-300" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search hero (e.g. Iron Man, Batman, A-Bomb)"
              className="border-none outline-none py-1 bg-transparent px-0 w-full"
            />
            <Button type="submit" className="cursor-pointer" variant="outline">Search</Button>

            {/* suggestion dropdown positioned within form */}
            <AnimatePresence>
              {showSuggest && suggestions && suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={clsx("absolute left-2 right-2 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
                >
                  {loadingSuggest && <li className="px-4 py-3 text-sm opacity-60">Searching…</li>}
                  {suggestions.map((s) => (
                    <li key={s.id} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseHero(s)}>
                      <div className="flex items-center gap-3">
                        <img src={s.images?.xs || s.images?.sm || FALLBACK_IMG} alt={s.name} className="w-10 h-10 object-cover rounded-md" onError={(e) => (e.currentTarget.src = FALLBACK_IMG)} />
                        <div className="flex-1">
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs opacity-60">{s.biography?.publisher || "—"}</div>
                        </div>
                        <div className="text-xs opacity-60">#{s.id}</div>
                      </div>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </form>
        </div>
      </header>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Main card - centered (like News page main viewer) */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", cardBg)}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>Hero Overview</CardTitle>
                <div className="text-xs opacity-70">{hero ? hero.name : "No hero selected"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => copyEndpointFor(query)}><Copy /></Button>
                <Button variant="outline" onClick={() => copyJSON(hero)}><Copy /></Button>
                <Button variant="outline" onClick={() => downloadJSON(hero, `${(hero?.name || "hero").replace(/\s+/g, "_")}.json`)}><Download /></Button>
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><Info /> {showRaw ? "Hide Raw" : "Show Raw"}</Button>
              </div>
            </CardHeader>

            <CardContent>
              {allHeroes === null ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !hero ? (
                <div className="py-12 text-center text-sm opacity-60">No hero loaded — search or pick from suggestions.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* left: hero image & basics */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="w-full h-56 rounded-md overflow-hidden bg-gradient-to-br from-black/10 to-white/5 flex items-center justify-center">
                      <img
                        src={hero.images?.md || hero.images?.lg || hero.images?.sm || FALLBACK_IMG}
                        alt={hero.name}
                        className="object-contain max-h-full"
                        onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                        style={{ cursor: "pointer" }}
                        onClick={() => setImageOpen(true)}
                      />
                    </div>

                    <div className="mt-3">
                      <div className="text-lg font-semibold">{hero.name}</div>
                      <div className="text-xs opacity-60">Full name: {hero.biography?.fullName || "—"}</div>
                      <div className={`mt-2 text-sm ${subtle}`}>{hero.biography?.publisher || "Unknown publisher"}</div>

                      <div className="mt-3 flex gap-2 flex-wrap">
                        <div className="p-2 rounded-md border text-xs">Alignment: <strong className="ml-1">{hero.biography?.alignment || "—"}</strong></div>
                        <div className="p-2 rounded-md border text-xs">First: <span className="ml-1 opacity-70">{hero.biography?.firstAppearance || "—"}</span></div>
                      </div>

                      <div className="mt-3 text-sm">
                        <div className="font-medium">Aliases</div>
                        <div className="text-xs opacity-70">{(hero.biography?.aliases || []).slice(0, 6).join(", ") || "—"}</div>
                      </div>
                    </div>
                  </div>

                  {/* middle & right: radar chart + quick facts */}
                  <div className={clsx("p-4 rounded-xl border md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold">Power Stats</div>
                      <div className="text-xs opacity-60">Radar chart</div>
                    </div>

                    <div style={{ width: "100%", height: 320 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke={gridStroke} />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis domain={[0, 100]} />
                          <ReTooltip contentStyle={{ background: isDark ? "#000" : "#fff", borderColor: gridStroke,borderRadius:"10px" }} />
                          <Radar dataKey="value" stroke={radarColor} fill={radarColor} fillOpacity={0.25} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Gender</div>
                        <div className="font-medium">{hero.appearance?.gender || "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Race</div>
                        <div className="font-medium">{hero.appearance?.race || "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Height</div>
                        <div className="font-medium">{(hero.appearance?.height || ["—"]).join(" / ")}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Weight</div>
                        <div className="font-medium">{(hero.appearance?.weight || ["—"]).join(" / ")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* raw JSON */}
            <AnimatePresence>
              {showRaw && (hero || rawAllJson) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <ScrollArea className="h-[200px] overflow-auto">
                    <pre className="text-xs whitespace-pre-wrap">{prettyJSON(hero || rawAllJson)}</pre>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right sidebar - developer tools & connections (like News page dev panel) */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", cardBg)}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Biography</div>
              <div className="text-xs opacity-60">Quick facts</div>
            </div>

            <div className="text-sm opacity-70 space-y-2">
              <div><strong>Place of birth:</strong> {hero?.biography?.placeOfBirth || "—"}</div>
              <div><strong>Publisher:</strong> {hero?.biography?.publisher || "—"}</div>
              <div><strong>Alter egos:</strong> {hero?.biography?.alterEgos || "—"}</div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Connections</div>
              <div className="text-xs opacity-60">Groups & relatives</div>
            </div>

            <div className="text-sm opacity-70 space-y-2">
              <div><strong>Group affiliation:</strong> {hero?.connections?.groupAffiliation || "—"}</div>
              <div><strong>Relatives:</strong> {hero?.connections?.relatives || "—"}</div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Developer</div>
              <div className="text-xs opacity-60">API tools</div>
            </div>

            <div className="space-y-2">
              <Button variant="outline" onClick={() => copyEndpointFor(query)}><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={() => copyJSON(hero)}><Copy /> Copy JSON</Button>
              <Button variant="outline" onClick={() => downloadJSON(hero, `${(hero?.name || "hero").replace(/\s+/g, "_")}.json`)}><Download /> Download JSON</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* image modal */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-2xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{hero?.name}</DialogTitle>

          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <img
              src={hero?.images?.lg || hero?.images?.md || FALLBACK_IMG}
              alt={hero?.name}
              style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
              onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
            />
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Images: Akabab Superhero API</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => { if (hero?.images?.lg) navigator.clipboard.writeText(hero.images.lg); }}><Copy /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
