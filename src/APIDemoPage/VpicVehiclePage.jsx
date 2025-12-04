// src/pages/VpicNhtsaPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  Copy as CopyIcon,
  Download,
  Code,
  RefreshCcw,
  RefreshCw,
  Sun,
  Moon,
  Info,
  Database,
  Menu,
  Grid,
  Check,
  FileText,
  List,
  Zap,
  Car,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "../components/theme-provider";

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------
const API_BASE = "https://vpic.nhtsa.dot.gov/api";
const DEFAULT_MAKE = "honda";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function pickRandom(arr = [], n = 10) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function VpicNhtsaPage() {
  // -------------------------------------
  // Theme System with smooth switching
  // -------------------------------------
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // -------------------------------------
  // State
  // -------------------------------------
  const [allMakes, setAllMakes] = useState([]);
  const [sidebarMakes, setSidebarMakes] = useState([]);
  const [loadingMakes, setLoadingMakes] = useState(false);

  const [query, setQuery] = useState(DEFAULT_MAKE);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const [selectedMake, setSelectedMake] = useState({ Make_Name: DEFAULT_MAKE });
  const [lastFetchedMake, setLastFetchedMake] = useState(DEFAULT_MAKE);

  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState(null);

  const [rawResp, setRawResp] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);

  const suggestionRef = useRef(null);

  // copy animations
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);
  const copyTimer = useRef(null);

  // keyboard navigation
  const suggestionsListRef = useRef(null);

  // -----------------------------------------------------
  // Load all makes (initial)
  // -----------------------------------------------------
  useEffect(() => {
    let mounted = true;
    async function loadAllMakes() {
      setLoadingMakes(true);
      try {
        const res = await fetch(`${API_BASE}/vehicles/GetAllMakes?format=json`);
        const json = await res.json();
        if (!mounted) return;
        const list = Array.isArray(json?.Results) ? json.Results : [];
        setAllMakes(list);
        setSidebarMakes(pickRandom(list, 10));
      } catch (err) {
        console.error("GetAllMakes failed:", err);
      } finally {
        if (mounted) setLoadingMakes(false);
      }
    }
    loadAllMakes();
    return () => (mounted = false);
  }, []);

  // -----------------------------------------------------
  // Suggestion filter
  // -----------------------------------------------------
  useEffect(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      return;
    }
    const starts = [];
    const includes = [];
    for (const m of allMakes) {
      const name = (m.Make_Name || "").toLowerCase();
      const id = String(m.Make_ID || "").toLowerCase();
      if (name.startsWith(q) || id.startsWith(q)) starts.push(m);
      else if (name.includes(q) || id.includes(q)) includes.push(m);
      if (starts.length + includes.length >= 30) break;
    }
    setSuggestions([...starts.slice(0, 10), ...includes.slice(0, 10)]);
  }, [query, allMakes]);

  // -----------------------------------------------------
  // Fetch models
  // -----------------------------------------------------
  async function fetchModelsForMake(makeName) {
    if (!makeName) return;

    setLoadingModels(true);
    setError(null);
    setModels([]);
    setShowRaw(false);

    try {
      const url = `${API_BASE}/vehicles/GetModelsForMake/${encodeURIComponent(makeName)}?format=json`;
      const res = await fetch(url);
      const json = await res.json();

      const list = Array.isArray(json?.Results) ? json.Results : [];
      const normalized = list.map((r) => ({
        Make_ID: r.Make_ID ?? null,
        Make_Name: r.Make_Name ?? makeName,
        Model_ID: r.Model_ID ?? null,
        Model_Name: r.Model_Name ?? "Unknown",
        Model_Year: r.Model_Year ?? null,
        _raw: r,
      }));

      setModels(normalized);
      setRawResp(json);
      setLastFetchedMake(makeName);
      setSelectedMake({ Make_Name: makeName });
      setSheetOpen(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch models");
    } finally {
      setLoadingModels(false);
    }
  }

  // initial fetch
  useEffect(() => {
    fetchModelsForMake(DEFAULT_MAKE);
  }, []);

  // -----------------------------------------------------
  // Selection helpers
  // -----------------------------------------------------
  function onSelectMake(makeObj) {
    const name = makeObj?.Make_Name || String(makeObj);
    setQuery(name);
    setShowSuggestions(false);
    setHighlightIndex(-1);
    fetchModelsForMake(name);
  }

  function onSuggestionKeyDown(e) {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        onSelectMake(suggestions[highlightIndex]);
      } else if (suggestions.length > 0) {
        onSelectMake(suggestions[0]);
      }
    } else if (e.key === "Escape") setShowSuggestions(false);
  }

  function refreshSidebar() {
    setSidebarMakes(pickRandom(allMakes, 10));
  }

  // -----------------------------------------------------
  // Copy utilities
  // -----------------------------------------------------
  function copyTextWithAnim(text, which = "endpoint") {
    try {
      navigator.clipboard.writeText(text);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      if (which === "endpoint") setCopiedEndpoint(true);
      else setCopiedJSON(true);

      copyTimer.current = setTimeout(() => {
        setCopiedEndpoint(false);
        setCopiedJSON(false);
      }, 1400);
    } catch (e) {
      console.warn("copy failed");
    }
  }

  function downloadCSV() {
    if (!models?.length) return;
    const headers = ["Make_ID", "Make_Name", "Model_ID", "Model_Name", "Model_Year"];
    const rows = models.map((m) =>
      headers.map((h) => `"${String(m[h] ?? "")}"`).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(lastFetchedMake || "models").replace(/\s+/g, "_")}_models.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // -----------------------------------------------------
  // Derived values
  // -----------------------------------------------------
  const uniqueModels = useMemo(() => {
    const set = new Set(models.map((m) => `${m.Model_ID || m.Model_Name}`));
    return set.size;
  }, [models]);

  // click outside suggestions → close
  useEffect(() => {
    const handler = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const sampleCode = `fetch("${API_BASE}/vehicles/GetModelsForMake/${encodeURIComponent(
    lastFetchedMake || query
  )}?format=json")
  .then(r => r.json())
  .then(console.log);`;

  // -----------------------------------------------------
  // Render
  // -----------------------------------------------------
  return (
    <div
      className={clsx(
        "min-h-screen py-6 px-4 pb-10 md:px-8 lg:px-12 transition-colors"
      )}
    >
      <div className="max-w-8xl mx-auto">

        {/* ---------------------------------------------------------
         Header
        --------------------------------------------------------- */}
        <header className="flex items-center flex-wrap justify-between gap-4 mb-6">

          <div className="flex items-center gap-4">

            {/* Mobile sidebar */}
            <div className="md:hidden">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="cursor-pointer">
                    <Menu />
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="left"
                  className={clsx(
                    "w-[320px] transition-colors",
                    isDark
                      ? "bg-neutral-950 text-white border-neutral-700"
                      : "bg-white border-zinc-300"
                  )}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Grid />
                      <div>
                        <div className="font-semibold">Makes</div>
                        <div className="text-xs opacity-60">Quick picks</div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      onClick={refreshSidebar}
                    >
                      <RefreshCcw />
                    </Button>
                  </div>

                  <Separator />

                  <ScrollArea className="h-[72vh] p-3">
                    <div className="space-y-2">
                      {sidebarMakes.map((s) => (
                        <div
                          key={`${s.Make_ID}-${s.Make_Name}`}
                          className={clsx(
                            "p-3 rounded-lg border hover:shadow cursor-pointer flex items-center gap-3 transition-colors",
                            isDark
                              ? "bg-neutral-950 border-neutral-700 hover:bg-neutral-800"
                              : "bg-white border-zinc-200 hover:bg-zinc-50"
                          )}
                          onClick={() => {
                            onSelectMake(s);
                            setSheetOpen(false);
                          }}
                        >
                          <div
                            className={clsx(
                              "rounded-md w-10 h-10 flex items-center justify-center text-white",
                              isDark ? "bg-zinc-700" : "bg-zinc-600"
                            )}
                          >
                            <Grid className="w-4 h-4" />
                          </div>

                          <div className="flex-1">
                            <div className="font-medium">{s.Make_Name}</div>
                            <div className="text-xs opacity-60">ID: {s.Make_ID}</div>
                          </div>

                          {/* AMBER GLASS BADGE */}
                          <Badge
                            className={clsx(
                              "text-xs backdrop-blur-sm border",
                              "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20"
                            )}
                          >
                            Make
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>

            {/* Icon */}
            <div
              className={clsx(
                "w-12 h-12 rounded-lg flex items-center justify-center shadow transition-colors",
                isDark
                  ? "bg-neutral-900 border border-neutral-700"
                  : "bg-white border border-zinc-300"
              )}
            >
              <Car className="w-7 h-7" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold">
                NHTSA VPIC — Vehicle Explorer
              </h1>
              <div className="text-xs opacity-70">
                Makes & Models · No API key required · Fast typeahead
              </div>
            </div>
          </div>

          {/* Right Header Section */}
          <div className="flex items-center gap-3">

            {/* Search */}
            <div
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-1 border transition-colors",
                isDark
                  ? "bg-black/60 border-neutral-800"
                  : "bg-white border-zinc-300"
              )}
            >
              <Search className="opacity-60" />

              <Input
                placeholder="Search by make name or ID (e.g. honda or 440)"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                  setHighlightIndex(-1);
                }}
                onKeyDown={onSuggestionKeyDown}
                className="w-64 border-0 bg-transparent outline-none"
              />

              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => onSelectMake({ Make_Name: query })}
              >
                Run
              </Button>

              <Button
                variant="ghost"
                className="cursor-pointer"
                onClick={() => {
                  setQuery("");
                  setShowSuggestions(false);
                }}
              >
                <RefreshCw />
              </Button>
            </div>

          
          </div>
        </header>

        {/* ---------------------------------------------------------
         Suggestions (Desktop)
        --------------------------------------------------------- */}
        <div className="hidden md:block relative">
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                ref={suggestionRef}
                className={clsx(
                  "absolute left-12 right-12 md:left-[calc(50%_-_360px)] md:right-auto max-w-4xl rounded-2xl overflow-hidden shadow-2xl z-40 transition-colors",
                  isDark
                    ? "bg-neutral-950 border border-neutral-800"
                    : "bg-white border border-zinc-200"
                )}
              >
                <ScrollArea style={{ maxHeight: 320 }}>
                  <ul role="listbox" className="divide-y">
                    {suggestions.map((s, i) => (
                      <li
                        key={`${s.Make_ID}-${s.Make_Name}-${i}`}
                        role="option"
                        aria-selected={
                          selectedMake?.Make_Name === s.Make_Name
                        }
                        onMouseEnter={() => setHighlightIndex(i)}
                        onClick={() => onSelectMake(s)}
                        className={clsx(
                          "px-4 py-3 cursor-pointer flex items-center justify-between gap-4 transition-colors",
                          i === highlightIndex
                            ? isDark
                              ? "bg-neutral-800"
                              : "bg-zinc-100"
                            : "",
                          "hover:bg-zinc-100 dark:hover:bg-neutral-800/80"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={clsx(
                              "rounded-sm w-12 h-8 flex items-center justify-center font-medium border transition-colors",
                              isDark
                                ? "bg-neutral-800 border-neutral-700"
                                : "bg-zinc-100 border-zinc-200"
                            )}
                          >
                            {s.Make_ID}
                          </div>

                          <div>
                            <div className="font-medium">{s.Make_Name}</div>
                            <div className="text-xs opacity-60">Make</div>
                          </div>
                        </div>

                        <Badge
                          className={clsx(
                            "text-xs backdrop-blur-sm border",
                            "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20"
                          )}
                        >
                          Make
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---------------------------------------------------------
         Main Grid
        --------------------------------------------------------- */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <Card
              className={clsx(
                "rounded-2xl p-3 transition-colors",
                isDark
                  ? "bg-black/90 border-neutral-800"
                  : "bg-white border-zinc-200"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Grid />
                    <div>
                      <div className="font-semibold">Random Makes</div>
                      <div className="text-xs opacity-60">10 picks</div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={refreshSidebar}
                  >
                    <RefreshCcw />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <ScrollArea className="h-[70vh] p-1">
                  <div className="space-y-2 p-1">
                    {loadingMakes ? (
                      <div className="py-6 text-center opacity-60">
                        Loading makes…
                      </div>
                    ) : sidebarMakes.length === 0 ? (
                      <div className="py-6 text-center opacity-60">
                        No makes
                      </div>
                    ) : (
                      sidebarMakes.map((m) => {
                        const isSelected =
                          (m.Make_Name || "").toLowerCase() ===
                          (selectedMake?.Make_Name || "").toLowerCase();

                        return (
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            key={`${m.Make_ID}-${m.Make_Name}`}
                            className={clsx(
                              "p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-colors",
                              isSelected
                                ? isDark
                                  ? "bg-neutral-800 border-zinc-500/20"
                                  : "bg-zinc-100 border-zinc-600/20"
                                : isDark
                                ? "hover:bg-neutral-800/50 border-neutral-700"
                                : "hover:bg-zinc-50 border-zinc-200"
                            )}
                            onClick={() => onSelectMake(m)}
                          >
                            <div
                              className={clsx(
                                "rounded-md w-10 h-10 flex items-center justify-center text-white",
                                isSelected
                                  ? "dark:bg-zinc-600/70 bg-zinc-300 "
                                  : isDark
                                  ? "bg-zinc-700"
                                  : "bg-zinc-300"
                              )}
                            >
                              <Grid className="w-4 h-4" />
                            </div>

                            <div className="flex-1">
                              <div className="font-medium">{m.Make_Name}</div>
                              <div className="text-xs opacity-60">
                                ID: {m.Make_ID}
                              </div>

                              <Badge
                                className={clsx(
                                  "mt-2 text-[11px] px-2 py-0.5 backdrop-blur-sm border",
                                  "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20"
                                )}
                              >
                                make
                              </Badge>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </aside>

          {/* ---------------------------------------------------------
           CENTER PREVIEW
          --------------------------------------------------------- */}
          <section className="lg:col-span-6 space-y-4">
            <Card
              className={clsx(
                "rounded-2xl overflow-hidden border transition-colors",
                isDark
                  ? "bg-black/90 border-neutral-800"
                  : "bg-white border-zinc-200"
              )}
            >
              <CardHeader
                className={clsx(
                  "p-5 flex items-start justify-between border-b transition-colors",
                  isDark
                    ? "bg-neutral-900/30 border-neutral-800"
                    : "bg-white/90 border-zinc-200"
                )}
              >
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText />{" "}
                    {(lastFetchedMake ||
                      selectedMake?.Make_Name ||
                      query ||
                      "—"
                    ).toUpperCase()}
                  </CardTitle>

                  <div className="text-xs opacity-70 mt-1">
                    Models list · preview · export
                  </div>

                  {/* AMBER GLASS BADGES */}
                  <div className="mt-2 flex gap-2">
                    <Badge
                      className={clsx(
                        "glass text-xs backdrop-blur-sm border",
                        "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20"
                      )}
                    >
                      Entries {models.length}
                    </Badge>

                    <Badge
                      className={clsx(
                        "glass text-xs backdrop-blur-sm border",
                        "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20"
                      )}
                    >
                      Unique {uniqueModels}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() =>
                      fetchModelsForMake(lastFetchedMake || query)
                    }
                    title="Refresh"
                  >
                    <RefreshCw />
                  </Button>

                  <Button
                    className="cursor-pointer"
                    variant="ghost"
                    onClick={() => setShowRaw((s) => !s)}
                    title="Toggle raw"
                  >
                    <List />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {loadingModels ? (
                  <div className="py-20 text-center">
                    <Zap className="animate-pulse mx-auto" />
                    <div className="text-xs opacity-60 mt-2">
                      Loading models…
                    </div>
                  </div>
                ) : error ? (
                  <div className="py-8 text-center text-rose-500">
                    {error}
                  </div>
                ) : models && models.length ? (
                  <>
                    <div className="mb-3 text-sm opacity-80">
                      Showing{" "}
                      <span className="font-medium">{models.length}</span>{" "}
                      models for{" "}
                      <span className="font-medium">{lastFetchedMake}</span>.
                    </div>

                    <div
                      className={clsx(
                        "overflow-auto max-h-[56vh] rounded-md border transition-colors",
                        isDark
                          ? "border-neutral-800"
                          : "border-zinc-200"
                      )}
                    >
                      <table className="w-full text-sm">
                        <thead
                          className={clsx(
                            isDark
                              ? "bg-neutral-900"
                              : "bg-zinc-50"
                          )}
                        >
                          <tr>
                            <th className="text-left p-3 text-xs opacity-70">
                              Model
                            </th>
                            <th className="text-left p-3 text-xs opacity-70">
                              Model Year
                            </th>
                            <th className="text-left p-3 text-xs opacity-70">
                              IDs
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {models.map((m, idx) => (
                            <tr
                              key={`${m.Make_ID}-${m.Model_ID || idx}`}
                              className={clsx(
                                idx % 2 === 0
                                  ? isDark
                                    ? "bg-neutral-900/80"
                                    : "bg-white"
                                  : ""
                              )}
                            >
                              <td className="p-3 align-top">
                                <div className="font-medium">
                                  {m.Model_Name}
                                </div>
                                <div className="text-xs opacity-60">
                                  {m.Make_Name}
                                </div>
                              </td>

                              <td className="p-3 align-top">
                                {m.Model_Year ?? (
                                  <span className="opacity-60">—</span>
                                )}
                              </td>

                              <td className="p-3 align-top">
                                <div className="text-xs opacity-70">
                                  Model ID: {m.Model_ID ?? "—"}
                                </div>
                                <div className="text-xs opacity-70">
                                  Make ID: {m.Make_ID ?? "—"}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center opacity-70">
                    No models found for{" "}
                    <span className="font-medium">
                      {lastFetchedMake || query}
                    </span>
                    .
                  </div>
                )}

                {/* RAW JSON */}
                <AnimatePresence>
                  {showRaw && rawResp && (
                    <motion.pre
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={clsx(
                        "mt-4 p-3 rounded-md border overflow-auto text-xs transition-colors",
                        isDark
                          ? "border-neutral-800 bg-neutral-950/50"
                          : "border-zinc-300 bg-zinc-100"
                      )}
                      style={{ maxHeight: 280 }}
                    >
                      {prettyJSON(rawResp)}
                    </motion.pre>
                  )}
                </AnimatePresence>
              </CardContent>

              {/* Footer */}
              <CardFooter>
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="text-xs opacity-60 flex-1">
                    Endpoint:&nbsp;
                    <span className="font-mono text-[12px] break-all">
                      {API_BASE}/vehicles/GetModelsForMake/
                      {encodeURIComponent(lastFetchedMake || query)}?format=json
                    </span>
                  </div>

                </div>
              </CardFooter>
            </Card>

            {/* -------------------------------------------
             About Card
            ------------------------------------------- */}
            <Card
              className={clsx(
                "rounded-2xl transition-colors",
                isDark
                  ? "bg-neutral-950 border-neutral-800"
                  : "bg-white border-zinc-200"
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info /> About
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-sm opacity-80">
                  This view queries the NHTSA VPIC endpoint
                  <code className="px-1">GetModelsForMake</code>.
                  Use the search box to type make names or numerical make IDs —
                  suggestions match both.  
                  The left panel provides 10 random makes for quick exploration.
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ---------------------------------------------------------
           RIGHT SIDEBAR
          --------------------------------------------------------- */}
          <aside className="lg:col-span-3">
            <div className="sticky top-6 space-y-4">

              {/* Quick Actions */}
              <Card
                className={clsx(
                  "transition-colors",
                  isDark
                    ? "bg-neutral-950 border-neutral-800"
                    : "bg-white border-zinc-200"
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText /> Quick Actions
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-3">
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() =>
                      copyTextWithAnim(
                        `${API_BASE}/vehicles/GetModelsForMake/${encodeURIComponent(
                          lastFetchedMake || query
                        )}?format=json`,
                        "endpoint"
                      )
                    }
                  >
                    <CopyIcon className="w-4 h-4 mr-2" /> Copy endpoint
                  </Button>

                  <Button
                    className="cursor-pointer"
                    variant="ghost"
                    onClick={() => copyTextWithAnim(sampleCode, "json")}
                  >
                    <Code className="w-4 h-4 mr-2" /> Copy sample fetch
                  </Button>

                  <Button
                    className="cursor-pointer"
                    variant="secondary"
                    onClick={downloadCSV}
                  >
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </Button>

                  <Button
                    as="a"
                    className="cursor-pointer"
                    href={`${API_BASE}/vehicles/GetModelsForMake/${encodeURIComponent(
                      lastFetchedMake || query
                    )}?format=json`}
                    target="_blank"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Open raw JSON
                  </Button>
                </CardContent>
              </Card>

              {/* Sample code */}
              <Card
                className={clsx(
                  "transition-colors",
                  isDark
                    ? "bg-neutral-950 border-neutral-800"
                    : "bg-white border-zinc-200"
                )}
              >
                <CardHeader>
                  <CardTitle>Sample code</CardTitle>
                </CardHeader>

                <CardContent>
                  <pre
                    className={clsx(
                      "text-xs font-mono p-3 rounded overflow-auto transition-colors",
                      isDark
                        ? "bg-neutral-950/50 border border-neutral-800"
                        : "bg-zinc-100 border border-zinc-300"
                    )}
                    style={{ maxHeight: 170 }}
                  >
                    {sampleCode}
                  </pre>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card
                className={clsx(
                  "transition-colors",
                  isDark
                    ? "bg-neutral-950 border-neutral-800"
                    : "bg-white border-zinc-200"
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database /> Notes
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="text-sm opacity-80">
                    • Suggestions match both Make_Name and Make_ID.  
                    • Clicking any make loads its models immediately.  
                    • Raw responses can be viewed and copied.  
                    • Light & Dark themes fully supported.  
                    • Amber glass badges indicate categories.
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </main>

       
      </div>
    </div>
  );
}
