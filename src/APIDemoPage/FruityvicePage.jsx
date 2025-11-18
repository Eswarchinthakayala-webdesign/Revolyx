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
  SunMoon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * FruityvicePage
 * - Fetches the entire fruit list from /api/fruit/all on mount
 * - Uses client-side suggestions (fast & stable)
 * - No localStorage / save logic
 *
 * NOTE: Make sure your project has lucide-react and the UI primitives imported above.
 */

const API_ENDPOINT = "/fruityvice/api/fruit/all";
const DEFAULT_FRUIT = "Apple";
const DEBOUNCE_MS = 200;

function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

export default function FruityvicePage() {
  // theme
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
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
        setAllFruits(Array.isArray(json) ? json : []);
        // choose default fruit if present
        const defaultItem = (Array.isArray(json) && json.find(f => f.name?.toLowerCase() === DEFAULT_FRUIT.toLowerCase())) || (Array.isArray(json) && json[0]);
        if (defaultItem) {
          setCurrentFruit(defaultItem);
          setRawResp(defaultItem);
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to load fruits");
      } finally {
        if (mounted) setLoadingAll(false);
      }
    }
    fetchAll();
    return () => { mounted = false; };
  }, []);

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
      const filtered = allFruits.filter(f => f.name?.toLowerCase().includes(q) || (f.family || "").toLowerCase().includes(q));
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

  // select fruit object (set current fruit). We already have full object from allFruits
  function selectFruit(item) {
    if (!item) return;
    setCurrentFruit(item);
    setRawResp(item);
    setQuery(item.name || "");
    setShowSuggest(false);
    setActiveIdx(-1);
  }

  // quick actions
  function copyJSON() {
    const payload = rawResp || currentFruit || {};
    navigator.clipboard.writeText(prettyJSON(payload));
    showToast("success", "Copied JSON to clipboard");
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

  // small utility: nutritions array and scale
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
    const max = Math.max(1, ...entries.map(e => e.value));
    return entries.map(e => ({ ...e, pct: Math.round((e.value / max) * 100) }));
  }, [currentFruit]);

  // small avatar: colored circle with initial
  function FruitAvatar({ name, size = 120 }) {
    const initial = (name?.[0] || "?").toUpperCase();
    const colors = ["#F97316", "#10B981", "#EF4444", "#60A5FA", "#A78BFA", "#F59E0B"];
    const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
    return (
      <div style={{ width: size, height: size, borderRadius: 20, background: color }} className="flex items-center justify-center flex-shrink-0">
        <div style={{ fontSize: size / 2.6, fontWeight: 700, color: "white" }}>{initial}</div>
      </div>
    );
  }

  // friendly UI skeleton states
  const headerPlaceholder = loadingAll ? "Loading fruits..." : "Fruityvice — Fruit Data";

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>{headerPlaceholder}</h1>
          <p className="mt-1 text-sm opacity-70">Browse nutritional data for many fruits. Search to find a fruit and inspect all fields.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")} onSubmit={(e) => { e.preventDefault(); if (suggestions.length) selectFruit(suggestions[0]); }}>
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
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {suggestions.map((s, i) => (
              <li
                key={s.id || s.name || i}
                role="option"
                aria-selected={activeIdx === i}
                onMouseDown={(ev) => { ev.preventDefault(); selectFruit(s); }}
                className={clsx("px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer", activeIdx === i ? (isDark ? "bg-zinc-800" : "bg-zinc-100") : "")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-900 text-sm font-semibold">
                    {s.name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-60">{s.family || s.genus || "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">ID: {s.id}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout: left + center, right quick actions */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: small identity + nutritions visual */}
        <section className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex flex-col items-center gap-4", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div className="flex items-center gap-4">
                <FruitAvatar name={currentFruit?.name} size={96} />
                <div>
                  <div className="text-lg font-extrabold">{currentFruit?.name ?? "—"}</div>
                  <div className="text-xs opacity-60 mt-1">{currentFruit?.genus ? `${currentFruit.genus} • ${currentFruit.family}` : "—"}</div>
                </div>
              </div>

              <div className="w-full mt-2">
                <div className="flex items-center justify-between text-xs opacity-60">
                  <div>ID</div>
                  <div>{currentFruit?.id ?? "—"}</div>
                </div>
                <div className="flex items-center justify-between text-xs opacity-60 mt-1">
                  <div>Order</div>
                  <div>{currentFruit?.order ?? "—"}</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="text-sm font-semibold mb-2">Nutrition Snapshot</div>
              <div className="space-y-3">
                {nutritions.map((n) => (
                  <div key={n.key}>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 opacity-70" />
                        <span className="capitalize">{n.label}</span>
                      </div>
                      <div className="text-xs opacity-70">{n.value}</div>
                    </div>
                    <div className="h-3 rounded-full mt-2 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div style={{ width: `${n.pct}%` }} className={clsx("h-full rounded-full", n.pct >= 70 ? "bg-red-500" : n.pct >= 40 ? "bg-amber-400" : "bg-green-500")}></div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-3" />

              <div className="text-sm opacity-70">
                <div><span className="text-xs opacity-60">Tip</span></div>
                <div className="mt-1 text-xs">Nutritional values are per 100g as provided by Fruityvice. Use the Raw JSON panel for full fields.</div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Center: full details */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-center justify-between", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Fruit Details</CardTitle>
                <div className="text-xs opacity-60">{currentFruit?.name ?? "Select a fruit to view details"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { if (allFruits.length === 0) return; const idx = Math.floor(Math.random() * allFruits.length); selectFruit(allFruits[idx]); }}><Zap /></Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /></Button>
                <Button variant="ghost" onClick={() => { if (currentFruit?.name) window.open(`${API_ENDPOINT}`, "_blank"); }}><ExternalLink /></Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingAll || loadingFruit ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentFruit ? (
                <div className="py-12 text-center text-sm opacity-60">No fruit selected yet — try searching above.</div>
              ) : (
                <div className="space-y-4">
                  {/* Overview */}
                  <div className={clsx("rounded-xl p-4 border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs opacity-60">Scientific</div>
                        <div className="font-medium">{currentFruit?.genus ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Family</div>
                        <div className="font-medium">{currentFruit?.family ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Order</div>
                        <div className="font-medium">{currentFruit?.order ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">ID</div>
                        <div className="font-medium">{currentFruit?.id ?? "—"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Nutrition table */}
                  <div className={clsx("rounded-xl p-4 border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Nutrition (per 100g)</div>
                      <div className="text-xs opacity-60">Source: Fruityvice</div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-3 text-sm">
                      {["carbohydrates","protein","fat","sugar","calories"].map((k) => (
                        <div key={k} className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-900/30 text-center">
                          <div className="text-xs opacity-60 capitalize">{k}</div>
                          <div className="font-medium mt-1">{(currentFruit?.nutritions?.[k] ?? "—")}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Full JSON (optional) */}
                  <AnimatePresence>
                    {showRaw && rawResp && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="rounded-xl p-4 border">
                        <div className="flex items-center justify-between">
                          <div className="text-sm opacity-70">Raw JSON</div>
                          <div className="text-xs opacity-60">Response</div>
                        </div>
                        <div className="mt-3 text-xs overflow-auto" style={{ maxHeight: 360 }}>
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

        {/* Right: Quick actions */}
        <section className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
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
              <Button className="w-full justify-start" variant="outline" onClick={() => { navigator.clipboard.writeText(API_ENDPOINT); showToast("success", "Endpoint copied"); }}><Copy className="mr-3" /> Copy Endpoint</Button>

              <Button className="w-full justify-start" variant="outline" onClick={() => copyJSON()}><Copy className="mr-3" /> Copy JSON</Button>

              <Button className="w-full justify-start" variant="outline" onClick={() => downloadJSON()}><Download className="mr-3" /> Download JSON</Button>

              <Button className="w-full justify-start" variant="outline" onClick={() => { if (allFruits.length) { selectFruit(allFruits[Math.floor(Math.random() * allFruits.length)]); } else showToast("info","No fruits loaded"); }}><Zap className="mr-3" /> Surprise me</Button>

              <Button className="w-full justify-start" variant="ghost" onClick={() => setShowRaw(s => !s)}><List className="mr-3" /> Toggle Raw</Button>
            </div>

            <Separator className="my-4" />

            <div className="text-xs opacity-60">
              Endpoint: <code className="text-xs break-all">{API_ENDPOINT}</code>
            </div>
          </Card>
        </section>
      </main>

      {/* Image dialog (shows large avatar) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden")}>
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
              <Button variant="outline" onClick={() => { if (currentFruit?.name) navigator.clipboard.writeText(currentFruit.name); }}><Copy /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
