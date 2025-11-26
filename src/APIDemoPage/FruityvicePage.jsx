// FruityvicePage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  List,
  Loader2,
  Download,
  Copy,
  BarChart2,
  Circle,
  Info,
  Apple,
  Zap,
  SunMoon,
  Menu,
  RefreshCw,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Heart,
  ImageIcon
} from "lucide-react";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

// shadcn/ui Sheet (mobile sidebar)
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";

const API_ENDPOINT = "/fruityvice/api/fruit/all";
const DEFAULT_FRUIT = "Apple";
const DEBOUNCE_MS = 180;

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/**
 * FruityvicePage (refactored)
 * - Desktop: left sidebar with 10 random fruits
 * - Mobile: Sheet that slides up (using shadcn Sheet) containing the list
 * - Middle: enhanced preview with icons, area chart (recharts)
 * - Right: Quick actions with animated copy/download
 */

export default function FruityvicePage() {
  // theme detection
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // data
  const [allFruits, setAllFruits] = useState([]); // full dataset
  const [loadingAll, setLoadingAll] = useState(false);
  const [currentFruit, setCurrentFruit] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingFruit, setLoadingFruit] = useState(false);

  // search/suggestions
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const suggestTimer = useRef(null);

  // UI
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false); // mobile sheet
  const [copiedState, setCopiedState] = useState({ json: false, endpoint: false, name: false }); // animated copy flags

  // sidebar random list (10)
  const [sidebarFruits, setSidebarFruits] = useState([]);

  // load all fruits once
  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      setLoadingAll(true);
      try {
        const res = await fetch(API_ENDPOINT);
        if (!res.ok) {
          showToast("error", `Failed to fetch fruits (${res.status})`);
          setLoadingAll(false);
          return;
        }
        const json = await res.json();
        if (!mounted) return;
        const arr = Array.isArray(json) ? json : [];
        setAllFruits(arr);

        // pick default or first
        const defaultItem =
          arr.find((f) => f.name?.toLowerCase() === DEFAULT_FRUIT.toLowerCase()) ||
          arr[0] ||
          null;
        if (defaultItem) {
          setCurrentFruit(defaultItem);
          setRawResp(defaultItem);
        }

        // initial sidebar pick
        setSidebarFruits(pickRandom(arr, 10));
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to load fruits");
      } finally {
        if (mounted) setLoadingAll(false);
      }
    }
    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  // helpers
  function pickRandom(arr, n) {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    const copy = [...arr];
    shuffleArray(copy);
    return copy.slice(0, Math.min(n, copy.length));
  }

  function shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  // refresh sidebar list
  function refreshSidebar() {
    const pick = pickRandom(allFruits, 10);
    setSidebarFruits(pick);
    showToast("success", "Sidebar refreshed");
  }

  // filter suggestions locally (debounced)
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    setActiveIdx(-1);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const q = v.trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        return;
      }
      const filtered = allFruits.filter(
        (f) =>
          f.name?.toLowerCase().includes(q) ||
          (f.family || "").toLowerCase().includes(q) ||
          (f.genus || "").toLowerCase().includes(q)
      );
      setSuggestions(filtered.slice(0, 8));
    }, DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
  }, []);

  // keyboard navigation for suggestions
  function handleKeyDown(e) {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0];
      if (sel) selectFruit(sel);
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  }

  // select fruit object (set current fruit)
  function selectFruit(item) {
    if (!item) return;
    setCurrentFruit(item);
    setRawResp(item);
    setQuery(item.name || "");
    setShowSuggest(false);
    setActiveIdx(-1);
    // ensure sidebar updates a highlighted one if on desktop
    setSidebarFruits((prev) => {
      // keep the existing but move selected to top if present
      const copy = prev ? [...prev] : [];
      const idx = copy.findIndex((p) => p.id === item.id);
      if (idx >= 0) {
        const [it] = copy.splice(idx, 1);
        copy.unshift(it);
        return copy;
      }
      return copy;
    });
  }

  // animated copy helpers
  async function copyToClipboard(payload, type = "json") {
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedState((s) => ({ ...s, [type]: true }));
      // quick animation then reset
      setTimeout(() => setCopiedState((s) => ({ ...s, [type]: false })), 1400);
      showToast("success", "Copied");
    } catch (err) {
      showToast("error", "Copy failed");
      console.error(err);
    }
  }

  function downloadJSON() {
    const payload = rawResp || currentFruit || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = (currentFruit?.name || "fruit").replace(/\s+/g, "_").toLowerCase();
    a.download = `fruityvice_${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  // nutritions derived
  const nutritions = useMemo(() => {
    if (!currentFruit?.nutritions) return [];
    const n = currentFruit.nutritions;
    const entries = [
      { key: "carbohydrates", label: "Carbs", value: Number(n.carbohydrates ?? 0) },
      { key: "protein", label: "Protein", value: Number(n.protein ?? 0) },
      { key: "fat", label: "Fat", value: Number(n.fat ?? 0) },
      { key: "sugar", label: "Sugar", value: Number(n.sugar ?? 0) },
      { key: "calories", label: "Calories", value: Number(n.calories ?? 0) }
    ];
    const max = Math.max(1, ...entries.map((e) => e.value));
    return entries.map((e) => ({ ...e, pct: Math.round((e.value / max) * 100) }));
  }, [currentFruit]);

  // chart data for Recharts (simple: convert nutritions into x,y)
  const chartData = useMemo(() => {
    if (!currentFruit?.nutritions) return [];
    const n = currentFruit.nutritions;
    // keep order consistent
    return [
      { name: "Carbs", key: "carbohydrates", value: Number(n.carbohydrates ?? 0) },
      { name: "Protein", key: "protein", value: Number(n.protein ?? 0) },
      { name: "Fat", key: "fat", value: Number(n.fat ?? 0) },
      { name: "Sugar", key: "sugar", value: Number(n.sugar ?? 0) },
      { name: "Calories", key: "calories", value: Number(n.calories ?? 0) }
    ];
  }, [currentFruit]);

  // small avatar
  function FruitAvatar({ name, size = 120, className = "" }) {
    const initial = (name?.[0] || "?").toUpperCase();
    const colors = ["#F97316", "#10B981", "#EF4444", "#60A5FA", "#A78BFA", "#F59E0B"];
    const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
    return (
      <div
        style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, ${shade(color, -18)})` }}
        className={clsx("flex items-center justify-center flex-shrink-0 rounded-2xl shadow-md", className)}
      >
        <div style={{ fontSize: size / 2.6, fontWeight: 800, color: "white" }}>{initial}</div>
      </div>
    );
  }

  // small color shade helper
  function shade(hex, percent) {
    // simple hex shade, percent negative or positive
    const f = hex.slice(1);
    const t = percent < 0 ? 0 : 255;
    const p = Math.abs(percent) / 100;
    const R = parseInt(f.substring(0, 2), 16);
    const G = parseInt(f.substring(2, 4), 16);
    const B = parseInt(f.substring(4, 6), 16);
    const newR = Math.round((t - R) * p) + R;
    const newG = Math.round((t - G) * p) + G;
    const newB = Math.round((t - B) * p) + B;
    return `#${(0x1000000 + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
  }

  // Custom tooltip component for recharts
  function NutritionTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0]?.payload;
    const key = item?.key;
    const val = item?.value;
    const nutrition = nutritions.find((n) => n.key === key);
    return (
      <div className={clsx("p-3 rounded-md shadow-lg text-xs", isDark ? "bg-zinc-900 text-zinc-100" : "bg-white text-zinc-900")}>
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4" />
          <div className="font-semibold">{item.name}</div>
        </div>
        <div className="mt-2">
          <div className="text-xs opacity-70">Value</div>
          <div className="font-medium mt-1">{val}</div>
        </div>
        {nutrition && (
          <div className="mt-2">
            <div className="text-xs opacity-70">Relative</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-40 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div style={{ width: `${nutrition.pct}%` }} className={clsx("h-full rounded-full", nutrition.pct >= 70 ? "bg-red-500" : nutrition.pct >= 40 ? "bg-amber-400" : "bg-green-500")}></div>
              </div>
              <div className="text-xs opacity-70">{nutrition.pct}%</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // header placeholder
  const headerPlaceholder = loadingAll ? "Loading fruits..." : "Fruityvice — Fruit Data";

  return (
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-8xl mx-auto", isDark ? "bg-zinc-950 text-zinc-100" : "bg-gradient-to-b from-white to-zinc-50 text-zinc-900")}>
      {/* Top header */}
      <header className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button aria-label="Open menu" className="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>

            <SheetContent side="left" className={clsx("w-[320px] p-0")}>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <Apple className="w-5 h-5" />
                    <div className="font-semibold">Fruits</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { refreshSidebar(); }}><RefreshCw /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setSheetOpen(false)}><X /></Button>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <ScrollArea style={{ height: "calc(100vh - 120px)" }}>
                <div className="p-3 space-y-2">
                  {sidebarFruits.map((f) => (
                    <div key={f.id} onClick={() => { selectFruit(f); setSheetOpen(false); }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                      <div className="w-10 h-10 flex items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-900 text-sm font-semibold">
                        {f.name?.[0] ?? "?"}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs opacity-60">{f.family || f.genus || "—"}</div>
                      </div>
                      <div className="text-xs opacity-60">ID: {f.id}</div>
                    </div>
                  ))}

                  <div className="pt-3">
                    <Button variant="outline" className="w-full" onClick={() => setSidebarFruits(pickRandom(allFruits, 10))}><RefreshCw className="mr-2" /> Refresh</Button>
                  </div>
                </div>
              </ScrollArea>

              <SheetFooter className="p-3">
                <div className="text-xs opacity-60">Endpoint: <code className="break-all text-xs">{API_ENDPOINT}</code></div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">{headerPlaceholder}</h1>
            <p className="text-xs opacity-70">Browse nutritional data for many fruits — search or pick one from the list.</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <form className={clsx("flex items-center gap-2 w-[480px] rounded-lg px-3 py-1", isDark ? "bg-zinc-900/40 border border-zinc-800" : "bg-white border border-zinc-200")} onSubmit={(e) => { e.preventDefault(); if (suggestions.length) selectFruit(suggestions[0]); }}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search fruits"
              placeholder="Search fruits (e.g. apple, banana, mango)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" variant="ghost" className="px-3 cursor-pointer"><Search /></Button>
          </form>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => { refreshSidebar(); }} className="cursor-pointer"><RefreshCw /></Button>
            <Button variant="outline" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer"><List /></Button>
            <Button variant="ghost" onClick={() => { if (allFruits.length === 0) return; const idx = Math.floor(Math.random() * allFruits.length); selectFruit(allFruits[idx]); }} className="cursor-pointer"><Zap /></Button>
          </div>
        </div>
      </header>

      {/* suggestions (floating under header on mobile too) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_360px)] md:right-auto max-w-6xl rounded-xl overflow-hidden shadow-2xl", isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {suggestions.map((s, i) => (
              <li
                key={s.id || s.name || i}
                role="option"
                aria-selected={activeIdx === i}
                onMouseDown={(ev) => { ev.preventDefault(); selectFruit(s); }}
                className={clsx("px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer flex items-center gap-3", activeIdx === i ? (isDark ? "bg-zinc-800" : "bg-zinc-100") : "")}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-900 text-sm font-semibold">
                  {s.name?.[0] ?? "?"}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs opacity-60">{s.family || s.genus || "—"}</div>
                </div>
                <div className="text-xs opacity-60">ID: {s.id}</div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left sidebar (desktop) */}
        <aside className="hidden lg:block lg:col-span-3">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "border-b border-zinc-800" : "border-b border-zinc-200")}>
              <div className="flex items-center gap-2">
                <Apple className="w-5 h-5" />
                <CardTitle className="text-sm">Fruits</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={refreshSidebar} className="cursor-pointer"><RefreshCw /></Button>
                <Button variant="ghost" size="sm" onClick={() => setSidebarFruits(pickRandom(allFruits, 10))} className="cursor-pointer"><Zap /></Button>
              </div>
            </CardHeader>

            <CardContent className="p-3">
              <ScrollArea style={{ height: 440 }}>
                <div className="space-y-2">
                  {sidebarFruits.map((f) => (
                    <div key={f.id} onClick={() => selectFruit(f)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                      <div className="w-12 h-12 flex items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-900 text-sm font-semibold">
                        {f.name?.[0] ?? "?"}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs opacity-60">{f.family || f.genus || "—"}</div>
                      </div>
                      <div className="text-xs opacity-60">ID: {f.id}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-3 flex gap-2">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setSidebarFruits(pickRandom(allFruits, 10))}><RefreshCw className="mr-2" /> Refresh</Button>
                <Button variant="ghost" className="cursor-pointer" onClick={() => { showToast("info", "Feature: view all (not implemented)"); }}><ChevronRight /></Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center: main preview */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-start justify-between", isDark ? "border-b border-zinc-800" : "border-b border-zinc-200")}>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg flex items-center gap-2"><Apple /> Fruit Details</CardTitle>
                </div>
                <div className="text-xs opacity-60 mt-1 flex items-center gap-2">
                  <Info className="w-4 h-4" /> {currentFruit?.name ?? "Select a fruit to view details"}
                </div>
              </div>

              <div className="flex items-center gap-2">
 <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={() => setDialogOpen(true)}><ImageIcon className="mr-2" /> View Image</Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingAll || loadingFruit ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentFruit ? (
                <div className="py-12 text-center text-sm opacity-60">No fruit selected yet — try searching above or pick one from the list.</div>
              ) : (
                <div className="space-y-6">
                  {/* Top overview */}
                  <div className={clsx("rounded-xl p-4 border", isDark ? "bg-zinc-900/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center gap-4">
                      <FruitAvatar name={currentFruit?.name} size={88} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xl font-extrabold">{currentFruit?.name}</div>
                            <div className="text-xs opacity-60 mt-1 flex items-center gap-2"><Circle className="w-3 h-3" /> {currentFruit?.genus ?? "—"} • {currentFruit?.family ?? "—"}</div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs opacity-60">ID</div>
                            <div className="font-medium">{currentFruit?.id ?? "—"}</div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          <div className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-900/30 text-center">
                            <div className="text-xs opacity-60">Order</div>
                            <div className="font-medium mt-1">{currentFruit?.order ?? "—"}</div>
                          </div>
                          <div className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-900/30 text-center">
                            <div className="text-xs opacity-60">Genus</div>
                            <div className="font-medium mt-1">{currentFruit?.genus ?? "—"}</div>
                          </div>
                          <div className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-900/30 text-center">
                            <div className="text-xs opacity-60">Family</div>
                            <div className="font-medium mt-1">{currentFruit?.family ?? "—"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart + nutrition list */}
                  <div className={clsx("rounded-xl p-4 border", isDark ? "bg-zinc-900/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5" />
                        <div className="text-sm font-semibold">Nutrition (per 100g)</div>
                        <div className="text-xs opacity-60"> • Source: Fruityvice</div>
                      </div>
                      <div className="text-xs opacity-60">Visualized</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="md:col-span-2 h-44">
                        {/* Recharts area */}
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 4, right: 12, left: -6, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorNut" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1f2937" : "#e6e6e6"} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip content={<NutritionTooltip />} />
                            <Area type="monotone" dataKey="value" stroke="#60A5FA" fillOpacity={1} fill="url(#colorNut)" activeDot={{ r: 6 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-3">
                        {nutritions.map((n) => (
                          <div key={n.key} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 flex items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-900">
                                <BarChart2 className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium capitalize">{n.label}</div>
                                <div className="text-xs opacity-60">{n.value}</div>
                              </div>
                            </div>
                            <div className="w-24 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div style={{ width: `${n.pct}%` }} className={clsx("h-full rounded-full", n.pct >= 70 ? "bg-red-500" : n.pct >= 40 ? "bg-amber-400" : "bg-green-500")}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Raw JSON toggle + animated reveal */}
                  <AnimatePresence>
                    {showRaw && rawResp && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("rounded-xl p-4 border", isDark ? "bg-zinc-900/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm opacity-70 flex items-center gap-2"><List /> Raw JSON</div>
                          <div className="text-xs opacity-60">Response</div>
                        </div>
                        <div className="mt-3 text-xs overflow-auto" style={{ maxHeight: 260 }}>
                          <pre className="whitespace-pre-wrap text-xs">{prettyJSON(rawResp)}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right quick actions */}
        <aside className="lg:col-span-3">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Quick Actions</div>
                <div className="text-xs opacity-60">Developer & data tools</div>
              </div>
              <div>
                <SunMoon className="w-5 h-5 opacity-60" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {/* Copy endpoint with animation */}
              <div>
                <button
                  onClick={() => copyToClipboard(API_ENDPOINT, "endpoint")}
                  className={clsx("w-full flex items-center justify-between rounded-lg px-3 py-2 border transition-all", isDark ? "bg-zinc-900/20 border-zinc-800 hover:bg-zinc-900/30" : "bg-white border-zinc-200 hover:bg-zinc-50", "cursor-pointer")}
                >
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4 opacity-80" />
                    <div className="text-sm text-left">Copy Endpoint</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div initial={{ scale: 1 }} animate={{ scale: copiedState.endpoint ? 1.05 : 1 }} transition={{ type: "spring", stiffness: 400 }} className="flex items-center gap-2">
                      {copiedState.endpoint ? <Check className="w-4 h-4 text-green-400" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                    </motion.div>
                  </div>
                </button>
              </div>

              {/* Copy JSON */}
              <div>
                <button
                  onClick={() => copyToClipboard(prettyJSON(rawResp || currentFruit || {}), "json")}
                  className={clsx("w-full flex items-center justify-between rounded-lg px-3 py-2 border transition-all", isDark ? "bg-zinc-900/20 border-zinc-800 hover:bg-zinc-900/30" : "bg-white border-zinc-200 hover:bg-zinc-50", "cursor-pointer")}
                >
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4 opacity-80" />
                    <div className="text-sm text-left">Copy JSON</div>
                  </div>
                  <motion.div initial={{ scale: 1 }} animate={{ scale: copiedState.json ? 1.05 : 1 }} transition={{ type: "spring", stiffness: 400 }}>
                    {copiedState.json ? <Check className="w-4 h-4 text-green-400" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                  </motion.div>
                </button>
              </div>

              {/* Download */}
              <div>
                <button
                  onClick={() => downloadJSON()}
                  className={clsx("w-full flex items-center justify-between rounded-lg px-3 py-2 border transition-all", isDark ? "bg-zinc-900/20 border-zinc-800 hover:bg-zinc-900/30" : "bg-white border-zinc-200 hover:bg-zinc-50", "cursor-pointer")}
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 opacity-80" />
                    <div className="text-sm text-left">Download JSON</div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              </div>

              {/* Surprise me */}
              <div>
                <button
                  onClick={() => { if (allFruits.length) { selectFruit(allFruits[Math.floor(Math.random() * allFruits.length)]); } else showToast("info", "No fruits loaded"); }}
                  className={clsx("w-full flex items-center justify-between rounded-lg px-3 py-2 border transition-all", isDark ? "bg-zinc-900/20 border-zinc-800 hover:bg-zinc-900/30" : "bg-white border-zinc-200 hover:bg-zinc-50", "cursor-pointer")}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 opacity-80" />
                    <div className="text-sm text-left">Surprise me</div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              </div>

              <div>
                <button className={clsx("w-full flex items-center justify-between rounded-lg px-3 py-2 border transition-all text-left", isDark ? "bg-transparent border-transparent hover:bg-zinc-900/20" : "bg-transparent border-transparent hover:bg-zinc-50", "cursor-pointer")} onClick={() => setShowRaw((s) => !s)}>
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4 opacity-80" />
                    <div className="text-sm">Toggle Raw</div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="text-xs opacity-60">
              Endpoint: <code className="text-xs break-all">{API_ENDPOINT}</code>
            </div>
          </Card>
        </aside>
      </main>

      {/* Image/dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden")}>
          <DialogHeader>
            <DialogTitle>{currentFruit?.name || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: isDark ? "#000" : "#fff" }}>
            {currentFruit ? (
              <div className="flex flex-col items-center gap-3">
                <FruitAvatar name={currentFruit.name} size={260} />
                <div className="text-sm opacity-60">{currentFruit?.genus} • {currentFruit?.family}</div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Generated avatar (placeholder)</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => { if (currentFruit?.name) copyToClipboard(currentFruit.name, "name"); }}><Copy /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
