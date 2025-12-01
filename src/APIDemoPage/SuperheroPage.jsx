// ===============================================
// SuperheroApiPage.jsx (REBUILT PROFESSIONAL UI)
// Revolyx Professional API Suite
// ===============================================

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
  Menu,
  Shield,
  Zap,
  Sword,
  User,
  Users,
  Ruler,
  Weight,
  BookUser,
  BookText,
  ArrowRightCircle,
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

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// ==========================================================
// CONFIG
// ==========================================================
const ALL_ENDPOINT = "https://akabab.github.io/superhero-api/api/all.json";
const FALLBACK_IMG = "https://via.placeholder.com/400x500?text=No+Image";

// ==========================================================
// HELPERS
// ==========================================================
const prettyJSON = (o) => JSON.stringify(o, null, 2);

const clampNum = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
};

const powerstatsToRadar = (ps = {}) => {
  const keys = [
    "intelligence",
    "strength",
    "speed",
    "durability",
    "power",
    "combat",
  ];

  return keys.map((k) => ({
    subject: k.toUpperCase(),
    value: clampNum(ps[k]),
  }));
};

function pickRandom(arr, n) {
  const copy = [...arr];
  copy.sort(() => Math.random() - 0.5);
  return copy.slice(0, n);
}

// ==========================================================
// COMPONENT
// ==========================================================
export default function SuperheroApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // loading dataset
  const [allHeroes, setAllHeroes] = useState(null);
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

  const [sidebarHeroes, setSidebarHeroes] = useState([]);
  const [selectedHero, setSelectedHero] = useState(null);


  const radarColor = isDark ? "#60a5fa" : "#2563eb";
  const gridStroke = isDark ? "#2d3748" : "#e3e3e3";

  // ====================================
  // Load all heroes once
  // ====================================
  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      try {
        const res = await fetch(ALL_ENDPOINT);
        if (!res.ok) {
          showToast("error", "Failed to fetch hero dataset");
          return;
        }
        const json = await res.json();
        if (!mounted) return;

        setAllHeroes(json);
        setRawAllJson(json);
        setSidebarHeroes(pickRandom(json, 10));
      } catch (e) {
        console.error(e);
        showToast("error", "Network error");
      }
    }
    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  // ====================================
  // Convert hero powerstats
  // ====================================
  const radarData = useMemo(
    () => powerstatsToRadar(hero?.powerstats || {}),
    [hero?.powerstats]
  );

  // ====================================
  // Search helpers
  // ====================================
  const doLocalSearch = (q) => {
    if (!allHeroes || !q.trim()) return [];
    const low = q.trim().toLowerCase();

    const prefix = [];
    const contains = [];

    for (const h of allHeroes) {
      const nm = (h.name || "").toLowerCase();
      if (nm.startsWith(low)) prefix.push(h);
      else if (nm.includes(low)) contains.push(h);
    }

    return [...prefix.slice(0, 8), ...contains.slice(0, 12)];
  };

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    setLoadingSuggest(true);

    if (suggestTimer.current) clearTimeout(suggestTimer.current);

    suggestTimer.current = setTimeout(() => {
      const res = doLocalSearch(v);
      setSuggestions(res);
      setLoadingSuggest(false);
    }, 200);
  }

  function chooseHero(h) {
    setSelectedHero(h);
    setHero(h);
    setQuery(h.name);
    setShowSuggest(false);
    setShowRaw(false);

    // Preload
    const img = new Image();
    img.src =
      h.images?.md || h.images?.sm || h.images?.lg || h.images?.xs || FALLBACK_IMG;

    showToast("success", `Loaded ${h.name}`);
  }

  function submitSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    const q = query.trim().toLowerCase();

    const exact = allHeroes.find(
      (h) => (h.name || "").toLowerCase() === q
    );

    if (exact) return chooseHero(exact);

    const list = doLocalSearch(query);
    if (list.length > 0) chooseHero(list[0]);
    else showToast("info", "No hero found");
  }

  function copyJSONData() {
    navigator.clipboard.writeText(
      prettyJSON(hero || rawAllJson || {})
    );
    showToast("success", "Copied JSON");
  }

  const CustomRadarTooltip = ({ active, payload, label, theme }) => {
  if (!active || !payload || !payload.length) return null;

  const isDark = theme === "dark";

  return (
    <div
      className={`p-2 rounded-lg shadow-md border text-sm backdrop-blur-md ${
        isDark
          ? "bg-zinc-900/80 border-zinc-700 text-zinc-100"
          : "bg-white/80 border-zinc-300 text-zinc-800"
      }`}
    >
      <div className="font-medium mb-1">{label}</div>
      <div className="text-xs opacity-80">
        Value: <span className="font-semibold">{payload[0].value}</span>
      </div>
    </div>
  );
};

function alignmentBadge(alignment) {
  const map = {
    good: "bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.3)]",
    bad: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.3)]",
    neutral: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.3)]",
  };

  return (
    "px-2 py-0.5 h-6 flex items-center rounded-full text-xs backdrop-blur-md font-medium " +
    (map[alignment] || map.neutral)
  );
}


  function downloadJSONFile() {
    const blob = new Blob(
      [prettyJSON(hero || rawAllJson)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(hero?.name || "superhero").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  const cardBg = isDark
    ? "bg-black/40 backdrop-blur-xl border-zinc-800"
    : "bg-white/50 backdrop-blur-xl border-white/40 shadow-sm";

  const glassBadge = clsx(
    "px-2 py-1 rounded-lg text-xs backdrop-blur-md border cursor-default",
    isDark ? "bg-zinc-800/40 border-zinc-700 text-zinc-300" : "bg-white/60 border-zinc-300 text-zinc-700"
  );

  return (
    <div className="min-h-screen p-5 md:p-8 pb-10 max-w-8xl mx-auto">

      {/* ---------------------------------------------------- */}
      {/* HEADER */}
      {/* ---------------------------------------------------- */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">

        {/* Left: Title */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden cursor-pointer">
              <Button size="icon" variant="ghost">
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[320px] p-4">

              <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-lg flex items-center gap-2">
                  <Shield /> Heroes
                </div>
               
              </div>

              <Separator className="mb-3" />

              <ScrollArea className="h-[70vh]">
               <div className="space-y-3">
  {sidebarHeroes.map((h) => {
    const selected = selectedHero?.id === h.id;

    return (
      <div
        key={h.id}
        className={clsx(
          "p-3 flex gap-3 items-center rounded-xl cursor-pointer border transition-all",
          cardBg,
          selected
            ? "border-zinc-500 bg-zinc-500/10 dark:bg-zinc-500/20 shadow-md"
            : "hover:shadow-lg border-zinc-300/30 dark:border-zinc-700/30"
        )}
        onClick={() => chooseHero(h)}
      >
        <img
          src={h.images?.xs || FALLBACK_IMG}
          className="w-12 h-12 rounded-lg object-cover"
        />

        <div className="flex-1">
          <div className="font-semibold">{h.name}</div>
          <div className="text-xs opacity-60">
            {h.biography.publisher || "—"}
          </div>
        </div>

        <ArrowRightCircle
          className={clsx(
            "transition-all",
            selected ? "text-zinc-500 opacity-100" : "opacity-50"
          )}
        />
      </div>
    );
  })}
</div>

              </ScrollArea>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
              <Shield /> Superhero Explorer
            </h1>
            <p className="text-sm opacity-70 max-w-md">
              Explore superheroes, biographies, power stats and more from the Akabab dataset.
            </p>
          </div>
        </div>

        {/* Right: Search Bar */}
        <form
          onSubmit={submitSearch}
          className={clsx(
            "relative z-500 flex w-full sm:w-[450px] items-center gap-2 rounded-xl px-4 py-2 shadow backdrop-blur-md",
            isDark
              ? "bg-black/60 border border-zinc-800"
              : "bg-white/70 border border-zinc-300"
          )}
        >
          <Search className="opacity-60" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="bg-transparent w-full outline-none text-sm"
            placeholder="Search hero..."
          />
          <Button type="submit" size="sm" variant="outline" className="cursor-pointer">
            Go
          </Button>

          {/* Suggestion Dropdown */}
          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={clsx(
                  "absolute rounded-xl border mt-2 top-full left-0 right-0 overflow-hidden z-50",
                  isDark ? "bg-black/80 border-zinc-800" : "bg-white/80 border-zinc-200 backdrop-blur-lg"
                )}
              >
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    className="p-3 hover:bg-black/10 dark:hover:bg-zinc-900 cursor-pointer flex gap-3 items-center"
                    onClick={() => chooseHero(s)}
                  >
                    <img
                      src={s.images?.xs || FALLBACK_IMG}
                      className="w-10 h-10 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs opacity-60">{s.biography.publisher}</div>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </form>
      </header>

      {/* ---------------------------------------------------- */}
      {/* MAIN LAYOUT */}
      {/* ---------------------------------------------------- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ================= Left Sidebar ================= */}
        <aside className="hidden lg:block lg:col-span-3">
          <Card className={clsx("rounded-2xl p-4", cardBg)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield /> Featured Heroes
              </CardTitle>
            </CardHeader>

            <CardContent>
              <ScrollArea className="h-[70vh] pr-2">
          <div className="space-y-3">
  {sidebarHeroes.map((h) => {
    const selected = selectedHero?.id === h.id;

    return (
      <div
        key={h.id}
        className={clsx(
          "p-3 flex gap-3 items-center rounded-xl cursor-pointer border transition-all",
          cardBg,
          selected
            ? "border-zinc-500 bg-zinc-500/10 dark:bg-zinc-500/20 shadow-md"
            : "hover:shadow-lg border-zinc-300/30 dark:border-zinc-700/30"
        )}
        onClick={() => chooseHero(h)}
      >
        <img
          src={h.images?.xs || FALLBACK_IMG}
          className="w-12 h-12 rounded-lg object-cover"
        />

        <div className="flex-1">
          <div className="font-semibold">{h.name}</div>
          <div className="text-xs opacity-60">
            {h.biography.publisher || "—"}
          </div>
        </div>

        <ArrowRightCircle
          className={clsx(
            "transition-all",
            selected ? "text-zinc-500 opacity-100" : "opacity-50"
          )}
        />
      </div>
    );
  })}
</div>

              </ScrollArea>

              <Button
                variant="outline"
                className="w-full mt-4 cursor-pointer"
                onClick={() => setSidebarHeroes(pickRandom(allHeroes, 10))}
              >
                Refresh
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* ================= Middle (Hero Preview) ================= */}
        <section className="lg:col-span-6">

          <Card className={clsx("rounded-2xl overflow-hidden border", cardBg)}>
            {/* Title Row */}
            <CardHeader
              className={clsx(
                "flex items-center justify-between p-5 border-b",
                isDark ? "border-zinc-800" : "border-zinc-300"
              )}
            >
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User /> Hero Overview
                </CardTitle>
                <div className="text-xs opacity-70">
                  {hero ? hero.name : "No hero selected"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={copyJSONData} className="cursor-pointer">
                  <Copy />
                </Button>
                <Button variant="outline" onClick={downloadJSONFile} className="cursor-pointer">
                  <Download />
                </Button>
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer">
                  <Info /> {showRaw ? "Hide Raw" : "Raw"}
                </Button>
              </div>
            </CardHeader>

            {/* Content */}
            <CardContent className="p-6">

              {allHeroes === null ? (
                <div className="py-16 text-center">
                  <Loader2 className="animate-spin w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm opacity-60">Loading heroes…</div>
                </div>
              ) : !hero ? (
                <div className="py-12 text-center text-sm opacity-60">
                  No hero selected. Use search or pick from the sidebar.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* ---------------- Hero image & identity ---------------- */}
                  <div className={clsx("p-4 rounded-xl border", cardBg)}>
                    <div
                      className="w-full h-60 rounded-md overflow-hidden flex items-center justify-center cursor-pointer"
                      onClick={() => setImageOpen(true)}
                    >
                      <img
                        src={
                          hero.images?.md ||
                          hero.images?.lg ||
                          hero.images?.sm ||
                          FALLBACK_IMG
                        }
                        className="max-h-full object-contain"
                      />
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="text-xl font-semibold flex items-center gap-2">
                        <User /> {hero.name}
                      </div>
                      <div className="text-xs">{hero.biography.fullName || "—"}</div>

                      <div className="flex gap-2 flex-wrap mt-3">
                       <div className="flex items-center gap-2">
  Alignment:
  <span className={alignmentBadge(hero.biography.alignment)}>
    {hero.biography.alignment}
  </span>
</div>

                        <div className={glassBadge}>
                          Publisher: {hero.biography.publisher}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ---------------- Radar Chart ---------------- */}
                  <div
                    className={clsx(
                      "p-4 rounded-xl border md:col-span-2",
                      cardBg
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold flex items-center gap-2">
                        <Zap /> Power Stats
                      </div>
                      <div className="text-xs opacity-50">Radar Chart</div>
                    </div>

                    <div style={{ width: "100%", height: 320 }}>
                   <ResponsiveContainer width="100%" height="100%">
  <RadarChart data={radarData}>
    <PolarGrid stroke={gridStroke} />
    <PolarAngleAxis dataKey="subject" />
    <PolarRadiusAxis domain={[0, 100]} />

    <ReTooltip
      content={<CustomRadarTooltip theme={theme} />}
      cursor={{ stroke: "transparent" }}
    />

    <Radar
      dataKey="value"
      stroke={radarColor}
      fill={radarColor}
      fillOpacity={0.25}
    />
  </RadarChart>
</ResponsiveContainer>

                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className={glassBadge}>
                        <Ruler className="inline w-3 h-3 mr-1" /> Height:
                        {hero.appearance.height.join(" / ")}
                      </div>
                      <div className={glassBadge}>
                        <Weight className="inline w-3 h-3 mr-1" /> Weight:
                        {hero.appearance.weight.join(" / ")}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* raw json */}
            <AnimatePresence>
              {showRaw && hero && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={clsx("p-4 border-t", cardBg)}
                >
                  <ScrollArea className="h-[260px] overflow-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {prettyJSON(hero)}
                    </pre>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* ================= Right Details Panel ================= */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-6", cardBg)}>

          {/* Biography */}
          <div>
            <div className="flex items-center gap-2 font-semibold mb-2">
              <BookUser /> Biography
            </div>

            {hero ? (
              <div className="text-sm space-y-2">
                <div className={glassBadge}>Place of Birth: {hero.biography.placeOfBirth}</div>
                <div className={glassBadge}>Alter Egos: {hero.biography.alterEgos}</div>
                <div className={glassBadge}>First Appearance: {hero.biography.firstAppearance}</div>
                <div className={glassBadge}>
                  Aliases: {(hero.biography.aliases || []).slice(0, 6).join(", ")}
                </div>
              </div>
            ) : (
              <div className="text-xs opacity-60">No hero selected</div>
            )}
          </div>

          <Separator />

          {/* Connections */}
          <div>
            <div className="flex items-center gap-2 font-semibold mb-2">
              <Users /> Connections
            </div>

            {hero ? (
              <div className="text-sm space-y-2">
                <div className={glassBadge}>
                  Group Affiliation: {hero.connections.groupAffiliation}
                </div>
                <div className={glassBadge}>
                  Relatives: {hero.connections.relatives}
                </div>
              </div>
            ) : (
              <div className="text-xs opacity-60">No hero selected</div>
            )}
          </div>

          <Separator />

          {/* Developer Tools */}
          <div>
            <div className="flex items-center gap-2 font-semibold mb-3">
              <BookText /> Developer Tools
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full cursor-pointer"
                onClick={copyJSONData}
              >
                <Copy /> Copy JSON
              </Button>

              <Button
                variant="outline"
                className="w-full cursor-pointer"
                onClick={downloadJSONFile}
              >
                <Download /> Download JSON
              </Button>

              <Button
                variant="ghost"
                className="w-full cursor-pointer"
                onClick={() => setShowRaw((s) => !s)}
              >
                <Info /> {showRaw ? "Hide Raw" : "Show Raw"}
              </Button>
            </div>
          </div>
        </aside>
      </main>

      {/* ========================================= */}
      {/* IMAGE DIALOG */}
      {/* ========================================= */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent
          className={clsx(
            "max-w-3xl w-full p-0 z-999 rounded-2xl overflow-hidden",
            isDark ? "bg-black/90" : "bg-white"
          )}
        >
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon /> {hero?.name}
            </DialogTitle>
          </DialogHeader>

          <div
            className="flex items-center justify-center"
            style={{ height: "70vh" }}
          >
            <img
              src={
                hero?.images?.lg ||
                hero?.images?.md ||
                FALLBACK_IMG
              }
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <DialogFooter className="flex justify-end gap-2 p-4 border-t">
            <Button variant="ghost" onClick={() => setImageOpen(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(hero?.images?.lg)}
            >
              <Copy /> Copy Image URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
