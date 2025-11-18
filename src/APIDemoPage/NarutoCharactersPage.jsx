// NarutoExplorerPage.jsx (updated fixes for tailed-beasts suggestions)
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ImageIcon,
  List,
  Loader2,
  Copy,
  Download,
  ExternalLink,
  Zap,
  User,
  MapPin,
  BookOpen,
  Speaker,
  Calendar,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

// shadcn Select imports (standard pattern)
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from "recharts";

/* ---------- Endpoints (fixed to HTTPS for tailed-beasts) ---------- */
const CHAR_LIST_URL = "https://dattebayo-api.onrender.com/characters";
const CHAR_BY_ID = (id) => `https://dattebayo-api.onrender.com/characters/${encodeURIComponent(id)}`;

// switched to HTTPS — avoids mixed-content blocking when site served over HTTPS
const TB_LIST_URL = "https://dattebayo-api.onrender.com/tailed-beasts";
const TB_BY_ID = (id) => `https://dattebayo-api.onrender.com/tailed-beasts/${encodeURIComponent(id)}`;

const DEBOUNCE_MS = 250;
const DEFAULT_MODE = "characters";
const DEFAULT_CHAR_ID = 1344;

/* ---------- Utilities ---------- */
function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}
function safeCount(x) {
  if (!x) return 0;
  if (Array.isArray(x)) return x.length;
  if (typeof x === "object") return Object.keys(x).length;
  return 1;
}
function normalizeCount(count, cap) {
  const val = Math.round((Math.min(count, cap) / cap) * 100);
  return val;
}

/* ---------- Component ---------- */
export default function NarutoExplorerPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // mode: "characters" | "tailed-beasts"
  const [mode, setMode] = useState(DEFAULT_MODE);

  // full lists
  const [charactersList, setCharactersList] = useState([]);
  const [beastsList, setBeastsList] = useState([]);

  // suggestions + search
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestTimer = useRef(null);

  // selected item
  const [selected, setSelected] = useState(null); // object (character or beast)
  const [rawResp, setRawResp] = useState(null);
  const [loadingSelected, setLoadingSelected] = useState(false);

  // UI controls
  const [showRaw, setShowRaw] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);

  /* ---------- Load lists once ---------- */
  useEffect(() => {
    // fetch characters list (robust handling)
    fetch(CHAR_LIST_URL)
      .then(r => r.json())
      .then(j => {
        const arr = Array.isArray(j.characters) ? j.characters : (Array.isArray(j) ? j : (Array.isArray(j.results) ? j.results : []));
        setCharactersList(arr);
      })
      .catch(err => {
        console.error("Failed to load characters list", err);
        setCharactersList([]);
      });

    // fetch tailed beasts list (robust: handles { "tailed-beasts": [...] } and plain array)
    fetch(TB_LIST_URL)
      .then(r => r.json())
      .then(j => {
        const arr = Array.isArray(j["tailed-beasts"]) ? j["tailed-beasts"] : (Array.isArray(j) ? j : (Array.isArray(j.results) ? j.results : []));
        setBeastsList(arr);
      })
      .catch(err => {
        console.error("Failed to load tailed beasts list", err);
        // Keep empty array so UI still works
        setBeastsList([]);
      });

    // initial load: default character by id
    fetchSelectedByMode(DEFAULT_MODE, DEFAULT_CHAR_ID);

    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* When mode changes clear suggestions/selection so UX is predictable */
  useEffect(() => {
    setSuggestions([]);
    setQuery("");
    setSelected(null);
    setRawResp(null);
    setCarouselIdx(0);
  }, [mode]);

  /* ---------- Helpers ---------- */

  // Fetch selected by id and mode
  async function fetchSelectedByMode(modeArg, idOrName) {
    if (!idOrName) return;
    setLoadingSelected(true);
    try {
      const isChar = modeArg === "characters";
      const url = isChar ? CHAR_BY_ID(idOrName) : TB_BY_ID(idOrName);
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Fetch failed (${res.status})`);
        setSelected(null);
        setRawResp(null);
        setLoadingSelected(false);
        return;
      }
      const json = await res.json();
      const obj = Array.isArray(json) ? json[0] : json;
      setSelected(obj);
      setRawResp(obj);
      setCarouselIdx(0);
    } catch (err) {
      console.error("fetchSelectedByMode err", err);
      showToast("error", "Network error");
      setSelected(null);
      setRawResp(null);
    } finally {
      setLoadingSelected(false);
    }
  }

  // Suggestion builder: show name & id below
  function buildSuggestions(q) {
    if (!q || q.trim() === "") {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const ql = q.toLowerCase();
      const list = mode === "characters" ? charactersList : beastsList;
      // Defensive: if list empty, show message or try fetching list again (optional)
      const filtered = (list || [])
        .filter(item => (item?.name || "").toLowerCase().includes(ql))
        .slice(0, 12)
        .map(it => ({ id: it.id, name: it.name }));
      setSuggestions(filtered);
      setLoadingSuggest(false);
    }, DEBOUNCE_MS);
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    buildSuggestions(v);
  }

  function pickSuggestion(item) {
    if (!item) return;
    fetchSelectedByMode(mode, item.id);
    setShowSuggest(false);
    setQuery(item.name);
  }

  // image carousel helpers (images arrays might be at images[] or image property)
  const imagesArr = useMemo(() => {
    if (!selected) return [];
    const imgs = selected.images || selected.image || [];
    if (Array.isArray(imgs)) return imgs;
    if (typeof imgs === "string") return [imgs];
    return [];
  }, [selected]);

  function prevImage() { setCarouselIdx(i => (imagesArr.length ? (i - 1 + imagesArr.length) % imagesArr.length : 0)); }
  function nextImage() { setCarouselIdx(i => (imagesArr.length ? (i + 1) % imagesArr.length : 0)); }

  // derived radar data
  const radarData = useMemo(() => {
    if (!selected) return [];
    if (mode === "characters") {
      const jutsu = safeCount(selected.jutsu);
      const natures = safeCount(selected.natureType);
      const tools = safeCount(selected.tools);
      const titles = safeCount(selected.personal?.titles || selected.titles);
      const voices = safeCount(selected.voiceActors?.japanese) + safeCount(selected.voiceActors?.english);
      return [
        { subject: "Jutsu", A: normalizeCount(jutsu, 120) },
        { subject: "Natures", A: normalizeCount(natures, 12) },
        { subject: "Tools", A: normalizeCount(tools, 12) },
        { subject: "Titles", A: normalizeCount(titles, 20) },
        { subject: "Voices", A: normalizeCount(voices, 6) },
      ];
    } else {
      const jutsu = safeCount(selected.jutsu);
      const natures = safeCount(selected.natureType);
      const traits = safeCount(selected.uniqueTraits);
      const jinch = safeCount(selected.personal?.jinchūriki) || safeCount(selected.jinchūriki);
      return [
        { subject: "Jutsu", A: normalizeCount(jutsu, 60) },
        { subject: "Natures", A: normalizeCount(natures, 12) },
        { subject: "Traits", A: normalizeCount(traits, 10) },
        { subject: "Hosts", A: normalizeCount(jinch, 10) },
      ];
    }
  }, [selected, mode]);

  // copy & download
  function copyJSON() {
    if (!selected) return showToast("info", "No item selected");
    navigator.clipboard.writeText(prettyJSON(selected));
    showToast("success", "Copied JSON");
  }
  function downloadJSON() {
    if (!selected) return showToast("info", "No item selected");
    const blob = new Blob([prettyJSON(selected)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${mode === "characters" ? "character" : "tailedbeast"}_${(selected.name || "item").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function renderValue(v) {
    if (v === null || v === undefined) return "—";
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
    try { return JSON.stringify(v); } catch { return String(v); }
  }

  /* ---------- Render ---------- */
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl overflow-hidden mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header & Mode select */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Dattebayo Explorer</h1>
          <p className="mt-1 text-sm opacity-70">Search Naruto characters & Tailed Beasts — suggestions show name + id.</p>
        </div>

        <div className="flex items-center flex-wrap gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <div className={clsx("px-2 py-1 rounded-md border", isDark ? "bg-black/40 border-zinc-800" : "bg-white border-zinc-200")}>
              <Select onValueChange={(v) => { setMode(v); setSelected(null); setQuery(""); setSuggestions([]); }}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="characters">Characters</SelectItem>
                  <SelectItem value="tailed-beasts">Tailed Beasts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if (suggestions.length) pickSuggestion(suggestions[0]); }} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")} role="search" aria-label="Search dataset">
            <Search className="opacity-60" />
            <Input placeholder={`Search ${mode === "characters" ? "characters" : "tailed beasts"} by name or paste id`} value={query} onChange={(e) => onQueryChange(e.target.value)} onFocus={() => setShowSuggest(true)} className="border-0 shadow-none bg-transparent outline-none" />
            <Button type="button" variant="outline" onClick={() => {
              if (mode === "characters") fetchSelectedByMode("characters", DEFAULT_CHAR_ID);
              else {
                if (beastsList.length) fetchSelectedByMode("tailed-beasts", beastsList[0].id);
                else showToast("info", "No tailed-beasts available");
              }
            }}>Default</Button>
            <Button type="button" variant="outline" onClick={() => { if (suggestions.length) pickSuggestion(suggestions[0]); else showToast("info", "No suggestion"); }}><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} role="listbox" aria-label="Suggestions" className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s) => (
              <li key={s.id} role="option" tabIndex={0} onClick={() => pickSuggestion(s)} onKeyDown={(e) => { if (e.key === "Enter") pickSuggestion(s); }} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                <div className="flex flex-col">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs opacity-60">id: {s.id}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: portrait & meta */}
        <aside className="lg:col-span-3">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">{mode === "characters" ? "Portrait" : "Artwork"}</CardTitle>
                <div className="text-xs opacity-60">{selected?.name ?? "—"}</div>
              </div>
              <div className="text-xs opacity-60">id: {selected?.id ?? "—"}</div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="relative rounded-xl flex items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-900" style={{ aspectRatio: "3/4" }}>
                  {loadingSelected ? (
                    <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin" /></div>
                  ) : imagesArr.length > 0 ? (
                    <>
                      <img src={imagesArr[carouselIdx]} alt={`${selected?.name ?? ""} image`} className="w-50 h-50 object-cover" onError={(e) => { e.currentTarget.style.objectFit = "contain"; }} />
                      {imagesArr.length > 1 && (
                        <>
                          <button aria-label="Prev" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full">
                            <X className="w-4 h-4 text-white rotate-45" />
                          </button>
                          <button aria-label="Next" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full">
                            <X className="w-4 h-4 text-white rotate-45" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm opacity-60">No image available</div>
                  )}
                </div>

                {/* meta small cards */}
                <div className="grid grid-cols-2 gap-2">
                  {mode === "characters" ? (
                    <>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Village</div>
                        <div className="text-sm font-medium">{selected?.village ?? (selected?.personal?.affiliation?.[0] || "—")}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Clan</div>
                        <div className="text-sm font-medium">{selected?.personal?.clan ?? selected?.clan ?? "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Rank</div>
                        <div className="text-sm font-medium">{selected?.rank?.ninjaRank?.["Part I"] ?? selected?.rank?.ninjaRank ?? selected?.rank ?? "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Gender</div>
                        <div className="text-sm font-medium">{selected?.personal?.sex ?? selected?.gender ?? "—"}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Classification</div>
                        <div className="text-sm font-medium">{selected?.personal?.classification ?? selected?.classification ?? "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Status</div>
                        <div className="text-sm font-medium">{selected?.personal?.status ?? "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Nature Types</div>
                        <div className="text-sm font-medium">{(selected?.natureType || []).slice(0,2).join(", ") || "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Unique Traits</div>
                        <div className="text-sm font-medium">{(selected?.uniqueTraits || []).slice(0,2).join(", ") || "—"}</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60">Debut</div>
                  <div className="mt-2 text-sm">
                    {selected?.debut ? Object.entries(selected.debut).map(([k,v]) => (<div key={k}><strong className="capitalize">{k}:</strong> {v}</div>)) : <div className="opacity-60">—</div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center: full details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-start justify-between", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <h2 className="text-2xl font-extrabold">{selected?.name ?? (mode === "characters" ? "Character" : "Tailed Beast")}</h2>
                <div className="text-xs opacity-60 mt-1">{selected?.personal?.birthdate ? `Born: ${selected.personal.birthdate}` : selected?.personal?.status ? `Status: ${selected.personal.status}` : ""}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setImageOpen(true)} aria-label="Open image"><ImageIcon /></Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)} aria-label="Toggle raw"><List /></Button>
                <Button variant="outline" onClick={() => copyJSON()} aria-label="Copy JSON"><Copy /></Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingSelected ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selected ? (
                <div className="py-12 text-center text-sm opacity-60">No item selected — search above.</div>
              ) : (
                <div className="space-y-6">
                  {selected.about && (
                    <div>
                      <div className="text-sm font-semibold mb-2">About</div>
                      <div className="text-sm leading-relaxed">{selected.about}</div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{`Jutsu (${safeCount(selected.jutsu)})`}</div>
                      <div className="text-xs opacity-60">Techniques</div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(selected.jutsu || []).map((j,i) => <div key={i} className="p-2 rounded-md border text-sm break-words">{j}</div>)}
                      {(selected.jutsu || []).length === 0 && <div className="text-sm opacity-60">—</div>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-semibold mb-2">Nature Types</div>
                      <div className="flex flex-wrap gap-2">
                        {(selected.natureType || []).map((n,i) => <span key={i} className="text-xs px-2 py-1 rounded-md bg-zinc-100/50">{n}</span>)}
                        {(selected.natureType || []).length === 0 && <div className="opacity-60">—</div>}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold mb-2">Tools</div>
                      <div className="flex flex-wrap gap-2">
                        {(selected.tools || []).map((t,i) => <span key={i} className="text-xs px-2 py-1 rounded-md bg-zinc-100/50">{t}</span>)}
                        {(selected.tools || []).length === 0 && <div className="opacity-60">—</div>}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold mb-2">Affiliations</div>
                      <div className="text-sm">{(selected.affiliation || selected.affiliations || selected.team || selected.teams || []).join?.(", ") || selected?.personal?.affiliation?.join?.(", ") || "—"}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold">Quick summary</div>
                      <div className="text-xs opacity-60">Derived counts</div>
                    </div>
                    <div style={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name={selected?.name || "item"} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.5} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {mode === "characters" && selected.family && (
                    <div>
                      <div className="text-sm font-semibold mb-2">Family & Relations</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(selected.family || {}).map(([k,v]) => (
                          <div key={k} className="p-2 rounded-md border text-sm">
                            <div className="text-xs opacity-60 capitalize">{k.replace(/_/g," ")}</div>
                            <div className="font-medium">{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {mode === "tailed-beasts" && selected.uniqueTraits && (
                    <div>
                      <div className="text-sm font-semibold mb-2">Unique Traits</div>
                      <div className="text-sm">{(selected.uniqueTraits || []).join?.(", ") || selected.uniqueTraits}</div>
                    </div>
                  )}

                 

                  <div>
                    <div className="text-sm font-semibold mb-3">All fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.keys(selected).map(k => (
                        <div key={k} className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">{k}</div>
                          <div className="text-sm font-medium break-words">{renderValue(selected[k])}</div>
                        </div>
                      ))}
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

        {/* Right: Quick actions */}
        <aside className="lg:col-span-3">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-5 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Quick actions</CardTitle>
                <div className="text-xs opacity-60">Utilities</div>
              </div>
              <div className="text-xs opacity-60">id: {selected?.id ?? "—"}</div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => { if (selected?.id) window.open(mode === "characters" ? CHAR_BY_ID(selected.id) : TB_BY_ID(selected.id), "_blank"); else showToast("info","No id"); }}><ExternalLink /> Open API</Button>
                <Button variant="outline" onClick={() => copyJSON()}><Copy /> Copy JSON</Button>
                <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
                <Button variant="outline" onClick={() => setShowRaw(s => !s)}><List /> Toggle Raw</Button>
              </div>

              <Separator />

              <div>
                <div className="text-xs opacity-60">Summary</div>
                <div className="mt-2 text-sm opacity-70">
                  <div><strong>Jutsu:</strong> {safeCount(selected?.jutsu)}</div>
                  <div><strong>Natures:</strong> {safeCount(selected?.natureType)}</div>
                  <div><strong>Tools:</strong> {safeCount(selected?.tools)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selected?.name || (mode === "characters" ? "Character" : "Tailed Beast")}</DialogTitle>
            <button className="absolute right-3 top-3" onClick={() => setImageOpen(false)} aria-label="Close"><X /></button>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {imagesArr.length > 0 ? (
              <img src={imagesArr[carouselIdx]} alt={`${selected?.name} image`} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Images from Dattebayo API</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageOpen(false)}>Close</Button>
              {imagesArr.length > 0 && <Button variant="outline" onClick={() => window.open(imagesArr[carouselIdx], "_blank")}><ExternalLink /></Button>}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
