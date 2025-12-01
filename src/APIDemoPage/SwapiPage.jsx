// SwapiPage.jsx (Rebuilt Professional Version)
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  List,
  Film,
  Globe,
  Calendar,
  Users,
  Cpu,
  HelpCircle,
  X,
  RefreshCw,
  Menu,
  Star,
  User2,
  RadioTower,
  Sparkles,
  Eye,
  Ruler,
  Weight,
  Palette,
  Globe2,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

/* -------------------------------------------
   Helpers
------------------------------------------- */

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function shortDateISO(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "—";
  }
}

// Glass badge
function GlassBadge({ icon: Icon, text }) {
  return (
    <div className="px-2.5 py-1 rounded-full text-xs flex items-center gap-1
      backdrop-blur-md bg-white/10 border border-white/20
      dark:bg-black/20 dark:border-white/10 shadow-sm w-fit">
      {Icon && <Icon size={12} className="opacity-80" />}
      <span className="opacity-90">{text}</span>
    </div>
  );
}

// Avatar
function PersonAvatar({ name, size = 120 }) {
  const initials = (name || "SW")
    .trim()
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`
        flex items-center justify-center rounded-2xl
        backdrop-blur-xl shadow-[inset_0_2px_6px_rgba(255,255,255,0.05)]
        border border-white/10 dark:border-white/5
        relative overflow-hidden
      `}
      style={{ width: size, height: size }}
    >
      {/* Zinc gradient background */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background:
            "linear-gradient(145deg, rgba(113,113,122,0.2), rgba(39,39,42,0.35))",
        }}
      />

      {/* Soft highlight glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18), transparent 60%)",
        }}
      />

      {/* Initials */}
      <span
        className="relative font-semibold tracking-wide select-none"
        style={{
          fontSize: size * 0.32,
          color: "rgba(250,250,250,0.92)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {initials}
      </span>
    </div>
  );
}


/* -------------------------------------------
   MAIN PAGE COMPONENT
------------------------------------------- */

export default function SwapiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const BASE = "https://swapi.dev/api";
  const PEOPLE_BASE = `${BASE}/people/`;

  /* -------------------------------------------
      State
  ------------------------------------------- */

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [current, setCurrent] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingPerson, setLoadingPerson] = useState(false);

  const [showRaw, setShowRaw] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);

  const [sidebarList, setSidebarList] = useState([]);

  const suggestTimer = useRef(null);

  /* -------------------------------------------
      Fetching & enrichment
  ------------------------------------------- */

  async function fetchPersonByUrl(url) {
    if (!url) return;
    setSelectedPerson(url);
    setLoadingPerson(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      const enriched = await enrichPerson(json);
      setCurrent(enriched);
      setRawResp(json);
    } catch {
      toast.error("Failed to load character");
    } finally {
      setLoadingPerson(false);
    }
  }

  async function fetchPersonById(id) {
    return fetchPersonByUrl(`${PEOPLE_BASE}${id}/`);
  }

  async function searchPeople(q) {
    if (!q || !q.trim()) return setSuggestions([]);
    setLoadingSuggest(true);
    try {
      const res = await fetch(`${PEOPLE_BASE}?search=${encodeURIComponent(q)}`);
      const json = await res.json();
      setSuggestions(json.results || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => searchPeople(v), 300);
  }

  async function enrichPerson(person) {
    const out = { ...person };

    // Homeworld
    if (person.homeworld) {
      try {
        const r = await fetch(person.homeworld);
        const j = await r.json();
        out.homeworld_name = j.name;
      } catch {}
    }

    // Films
    try {
      const filmData = await Promise.all(
        (person.films || []).slice(0, 8).map(f =>
          fetch(f).then(r => r.json()).catch(() => null)
        )
      );
      out.films_data = filmData.filter(Boolean);
    } catch {
      out.films_data = [];
    }

    out.species_count = person.species?.length ?? 0;
    out.vehicles_count = person.vehicles?.length ?? 0;
    out.starships_count = person.starships?.length ?? 0;

    return out;
  }

  /* -------------------------------------------
      Sidebar random 10 characters
  ------------------------------------------- */

  async function loadSidebarList() {
    const ids = Array.from({ length: 10 }, () => Math.floor(Math.random() * 82) + 1);
    const tempList = [];
    for (let id of ids) {
      try {
        const res = await fetch(`${PEOPLE_BASE}${id}/`);
        if (res.ok) {
          const json = await res.json();
          tempList.push(json);
        }
      } catch {}
    }
    setSidebarList(tempList);
  }

  /* -------------------------------------------
      Search submit
  ------------------------------------------- */

  async function handleSearchSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return toast("Type something like 'Luke'");

    try {
      const res = await fetch(`${PEOPLE_BASE}?search=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.results?.length) {
        const first = json.results[0];
        const enriched = await enrichPerson(first);
        setCurrent(enriched);
        setRawResp(first);
        setShowSuggest(false);
        toast.success(`Loaded: ${first.name}`);
      } else toast("No characters found");
    } catch {
      toast.error("Search failed");
    }
  }

  /* -------------------------------------------
      Actions
  ------------------------------------------- */

  function copyJSON() {
    if (!current) return;
    navigator.clipboard.writeText(prettyJSON(current));
    toast.success("Copied JSON");
  }

  function downloadJSON() {
    if (!rawResp) return;
    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${current?.name?.replace(/\s+/g, "_")}.json`;
    a.click();
  }

  function openApiUrl() {
    if (current?.url) window.open(current.url, "_blank");
  }

  function viewRelated(item) {
    setDialogContent(item);
    setDialogOpen(true);
  }

  /* -------------------------------------------
      Initial load
  ------------------------------------------- */

  useEffect(() => {
    fetchPersonById(1);
    loadSidebarList();
  }, []);

  /* -------------------------------------------
      UI
  ------------------------------------------- */

  const headerBg = isDark ? "bg-black/40 border-zinc-800" : "bg-white/70 border-zinc-300 backdrop-blur-xl";
  const cardBg = isDark ? "bg-black/40" : "bg-white/90";

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 max-w-8xl mx-auto")}>
      
      {/* ---------------- HEADER ---------------- */}

      <header className="flex  gap-4 flex-row items-center flex-wrap sm:justify-between mb-4">

        {/* Mobile sidebar button */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="cursor-pointer">
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[320px] p-4">
              <div className="text-lg font-bold flex items-center gap-2 mb-4">
                <Star className="text-zinc-400" />
                Star Wars Characters
              </div>

              <ScrollArea className="h-[80vh]">

           {sidebarList.map((p) => {
  const isSelected = selectedPerson === p.url;

  return (
    <div
      key={p.url}
      className={clsx(
        "p-3 border rounded-xl mb-3 cursor-pointer transition-all",
        "hover:bg-zinc-100 dark:hover:bg-zinc-800/40",

        // selected styles
        isSelected
          ? "border-zinc-500 bg-zinc-500/10 dark:bg-zinc-500/20 shadow-md"
          : "border-zinc-300 dark:border-zinc-700"
      )}
      onClick={() => fetchPersonByUrl(p.url)}
    >
      <div className="flex items-center gap-3">
        <PersonAvatar name={p.name} size={48} />

        <div className="flex-1">
          <div className="font-medium">{p.name}</div>
          <div className="text-xs opacity-60">{p.birth_year}</div>
        </div>
      </div>
    </div>
  );
})}


              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-2">
            <Star className="text-zinc-400" />
            SWAPI Explorer
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Browse characters, explore films, planets
          </p>
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className={clsx(
            "flex items-center gap-2 px-3 py-1 rounded-xl shadow-sm border w-full md:w-[420px] backdrop-blur-md",
            headerBg
          )}
        >
          <Search />
          <Input
            placeholder="Search characters: Luke, Leia, Vader..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="border-0 bg-transparent shadow-none"
            onFocus={() => setShowSuggest(true)}
          />
          <Button variant="outline" className="cursor-pointer" type="submit"><Search /></Button>
        </form>
      </header>

      {/* ---------------- SUGGESTIONS DROPDOWN ---------------- */}

      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx(
              "absolute left-4 right-4 md:left-auto md:right-auto max-w-lg mx-auto z-50 rounded-xl p-1 overflow-hidden shadow-xl",
              headerBg
            )}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s) => (
              <li
                key={s.url}
                className="px-4 py-3 hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40 cursor-pointer"
                onClick={async () => {
                  const enriched = await enrichPerson(s);
                  setCurrent(enriched);
                  setRawResp(s);
                  setShowSuggest(false);
                  setQuery("");
                }}
              >
                <div className="flex items-center gap-3">
                  <PersonAvatar name={s.name} size={40} />
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-60">{s.birth_year} • {s.gender}</div>
                  </div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* ---------------- PAGE GRID ---------------- */}

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">

        {/* ---------------- LEFT SIDEBAR (DESKTOP) ---------------- */}

        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl p-4 border", cardBg)}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm flex items-center gap-2">
                <Users /> Characters
              </div>
              <Button variant="ghost" size="icon" className="cursor-pointer" onClick={loadSidebarList}>
                <RefreshCw />
              </Button>
            </div>

            <ScrollArea className="h-[70vh] pr-2">
           {sidebarList.map((p) => {
  const isSelected = selectedPerson === p.url;

  return (
    <div
      key={p.url}
      className={clsx(
        "p-3 border rounded-xl mb-3 cursor-pointer transition-all",
        "hover:bg-zinc-100 dark:hover:bg-zinc-800/40",

        // selected styles
        isSelected
          ? "border-zinc-500 bg-zinc-500/10 dark:bg-zinc-500/20 shadow-md"
          : "border-zinc-300 dark:border-zinc-700"
      )}
      onClick={() => fetchPersonByUrl(p.url)}
    >
      <div className="flex items-center gap-3">
        <PersonAvatar name={p.name} size={48} />

        <div className="flex-1">
          <div className="font-medium">{p.name}</div>
          <div className="text-xs opacity-60">{p.birth_year}</div>
        </div>
      </div>
    </div>
  );
})}

            </ScrollArea>

          </Card>
        </aside>

        {/* ---------------- CENTER MAIN ---------------- */}

        <section className="lg:col-span-6 space-y-5">

          <Card className={clsx("rounded-2xl border", cardBg)}>

            {/* HEADER */}
            <CardHeader className="flex items-center justify-between p-5 border-b">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <User2 /> Character Details
                </CardTitle>
                <div className="text-xs opacity-60">{current?.name ? `Viewing: ${current.name}` : "No character selected"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => fetchPersonByUrl(current?.url)}>
                  <RefreshCw className={loadingPerson ? "animate-spin" : ""} />
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setShowRaw(s => !s)}>
                  <List /> Raw
                </Button>
              </div>
            </CardHeader>

            {/* CONTENT */}
            <CardContent className="p-5">

              {/* LOADING */}
              {loadingPerson && (
                <div className="py-16 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                </div>
              )}

              {/* EMPTY */}
              {!loadingPerson && !current && (
                <div className="py-16 text-center text-sm opacity-60">
                  No character selected
                </div>
              )}

              {/* CHARACTER DETAILS */}
              {!loadingPerson && current && (
                <div className="space-y-6">

                  {/* HEADER AREA */}
                  <div className="flex items-start gap-5">
                    <PersonAvatar name={current.name} size={100} />

                    <div className="space-y-2">
                      <div className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="text-zinc-400" /> {current.name}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <GlassBadge icon={Calendar} text={current.birth_year} />
                        <GlassBadge icon={Users} text={current.gender} />
                        <GlassBadge icon={Eye} text={`${current.eye_color} eyes`} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* METRICS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 border rounded-xl flex flex-col gap-1">
                      <div className="text-xs opacity-60 flex items-center gap-1"><Ruler size={12}/> Height</div>
                      <div className="font-semibold">{current.height} cm</div>
                    </div>

                    <div className="p-3 border rounded-xl flex flex-col gap-1">
                      <div className="text-xs opacity-60 flex items-center gap-1"><Weight size={12}/> Mass</div>
                      <div className="font-semibold">{current.mass} kg</div>
                    </div>

                    <div className="p-3 border rounded-xl flex flex-col gap-1">
                      <div className="text-xs opacity-60 flex items-center gap-1"><Palette size={12}/> Hair</div>
                      <div className="font-semibold">{current.hair_color}</div>
                    </div>

                    <div className="p-3 border rounded-xl flex flex-col gap-1">
                      <div className="text-xs opacity-60 flex items-center gap-1"><Palette size={12}/> Skin</div>
                      <div className="font-semibold">{current.skin_color}</div>
                    </div>
                  </div>

                  {/* HOMEWORLD */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 font-semibold text-sm">
                      <Globe2 /> Homeworld
                    </div>

                    {current.homeworld_name ? (
                      <button
                        className="underline cursor-pointer flex items-center gap-1 text-sm"
                        onClick={() => viewRelated({ type: "world", title: current.homeworld_name, url: current.homeworld })}
                      >
                        <Globe size={14} /> {current.homeworld_name}
                      </button>
                    ) : (
                      <div className="text-xs opacity-60">Unknown</div>
                    )}
                  </div>

                  <Separator />

                  {/* FILMS */}
                  <div>
                    <div className="flex items-center gap-2 mb-3 font-semibold text-sm">
                      <Film /> Films
                    </div>

                    {current.films_data?.length ? (
                      <div className="space-y-2">
                        {current.films_data.map((film) => (
                          <div key={film.url}
                            className="p-3 border rounded-xl flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer"
                            onClick={() => viewRelated({ type: "film", title: film.title, url: film.url })}
                          >
                            <div className="flex items-center gap-3">
                              <Film size={18} />
                              <div>
                                <div className="font-medium">{film.title}</div>
                              </div>
                            </div>
                            <ChevronRight size={18} className="opacity-60" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs opacity-60">No film data.</div>
                    )}
                  </div>

                  {/* RAW RESPONSE */}
                  <AnimatePresence>
                    {showRaw && rawResp && (
                      <motion.pre
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={clsx(
                          "text-xs p-3 border rounded-xl overflow-auto mt-4",
                          isDark ? "bg-black/20" : "bg-white/50"
                        )}
                        style={{ maxHeight: 260 }}
                      >
                        {prettyJSON(rawResp)}
                      </motion.pre>
                    )}
                  </AnimatePresence>

                </div>
              )}

            </CardContent>
          </Card>

        </section>

        {/* ---------------- RIGHT SIDEBAR ---------------- */}

        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 border", cardBg)}>

          {/* QUICK ACTIONS */}
          <div>
            <div className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Cpu /> Actions
            </div>

            <div className="grid gap-2">
              <Button variant="outline" onClick={copyJSON} className="cursor-pointer"><Copy /> Copy JSON</Button>
              <Button variant="outline" onClick={downloadJSON} className="cursor-pointer"><Download /> Download JSON</Button>
              <Button variant="outline" onClick={openApiUrl} className="cursor-pointer"><ExternalLink /> API URL</Button>
              <Button variant="outline" onClick={() => setShowRaw(s => !s)} className="cursor-pointer"><List /> Toggle Raw</Button>
              <Button variant="outline" onClick={() => { setCurrent(null); setRawResp(null); }} className="cursor-pointer"><X /> Clear</Button>
            </div>
          </div>

          <Separator />

          {/* DEV INFO */}
          <div>
            <div className="text-sm font-semibold flex items-center gap-2 mb-1">
              <HelpCircle /> Developer Info
            </div>
            <div className="text-xs opacity-70">
              SWAPI Endpoint:
            </div>
            <div className="text-xs mt-1 p-2 rounded-lg border break-words">
              {PEOPLE_BASE}  
              Use <code>?search=name</code>
            </div>
          </div>

        </aside>
      </main>

      {/* ---------------- RELATED RESOURCE DIALOG ---------------- */}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0 rounded-2xl overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles /> {dialogContent?.title ?? "Resource"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4">
            <RelatedResourceViewer item={dialogContent} />
          </div>

          <DialogFooter className="p-4 border-t flex justify-between">
            <div className="text-xs opacity-60">SWAPI resource</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => dialogContent?.url && window.open(dialogContent.url, "_blank")}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}

/* -------------------------------------------
   Related Resource Viewer Component
------------------------------------------- */

function RelatedResourceViewer({ item }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const isDark = false;

  useEffect(() => {
    if (!item?.url) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(item.url);
        const json = await res.json();
        if (mounted) setData(json);
      } catch {
        if (mounted) setData({ error: "Failed to load" });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, [item]);

  return (
    <div className="space-y-4">

      {loading && (
        <div className="py-12 text-center">
          <Loader2 className="animate-spin mx-auto" />
        </div>
      )}

      {!loading && !data && (
        <div className="text-sm opacity-60">No data</div>
      )}

      {!loading && data?.error && (
        <div className="text-sm text-red-500">{data.error}</div>
      )}

      {!loading && data && !data.error && (
        <>
          <div className="font-semibold">{data.name ?? data.title}</div>
          <div className="text-xs opacity-60">
            Created: {shortDateISO(data.created)} • Updated: {shortDateISO(data.edited)}
          </div>

          <Separator />

          <ScrollArea className="max-h-[320px] overflow-y-auto pr-2">
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.keys(data).map((k) => {
                const val = data[k];

                if (Array.isArray(val)) {
                  return (
                    <div key={k} className="p-3 overflow-y-auto rounded-xl border">
                      <div className="text-xs opacity-60">{k}</div>
                      <div className="font-semibold">{val.length} item(s)</div>
                    </div>
                  );
                }

                if (typeof val === "object" && val !== null) {
                  return (
                    <div key={k} className="p-3 rounded-xl border">
                      <div className="text-xs opacity-60">{k}</div>
                      <div className="font-medium break-words text-xs">{JSON.stringify(val)}</div>
                    </div>
                  );
                }

                return (
                  <div key={k} className="p-3 rounded-xl border">
                    <div className="text-xs opacity-60">{k}</div>
                    <div className="font-medium break-words">{String(val ?? "—")}</div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
