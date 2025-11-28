// src/pages/LaunchLibraryPage.jsx
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
  MapPin,
  Calendar,
  Rocket,
  Globe,
  X,
  Loader,
  Menu,
  Check,
  RefreshCw,
  Star,
  FileText
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoint ---------- */
const BASE_ENDPOINT = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/* Safe getter with fallback */
function safe(obj, path, fallback = "—") {
  try {
    if (!obj) return fallback;
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (!cur) return fallback;
      cur = cur[p];
    }
    return cur ?? fallback;
  } catch {
    return fallback;
  }
}

/* Simple shuffle for random picks */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Placeholder image (data URI SVG) */
const PLACEHOLDER_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='#e6e9ee'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9aa3b2' font-family='Arial' font-size='20'>No image</text></svg>`
  );

/* ---------- Animated Copy Button component ---------- */
function AnimatedCopyButton({ textToCopy, size = 16, label = "Copy", className = "" }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  async function handleCopy() {
    if (!textToCopy) {
      showToast("info", "Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(String(textToCopy));
      setCopied(true);
      showToast("success", "Copied");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error(err);
      showToast("error", "Copy failed");
      setCopied(false);
    }
  }

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.96 }}
      className={clsx(
        "inline-flex items-center gap-2 px-3 py-1 rounded-md border shadow-sm cursor-pointer select-none",
        className
      )}
      aria-pressed={copied}
      title={copied ? "Copied" : label}
    >
      <AnimatePresence mode="popLayout">
        {!copied && (
          <motion.span
            key="copy"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex items-center gap-2"
          >
            <Copy size={size} />
            <span className="text-sm">{label}</span>
          </motion.span>
        )}

        {copied && (
          <motion.span
            key="tick"
            initial={{ scale: 0.7, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.7, rotate: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 700, damping: 22 }}
            className="flex items-center gap-2 text-emerald-500"
          >
            <Check size={size} />
            <span className="text-sm">Copied</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ---------- Main page ---------- */
export default function LaunchLibraryPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI / data state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentLaunch, setCurrentLaunch] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingLaunch, setLoadingLaunch] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // desktop left panel visible

  const [randomList, setRandomList] = useState([]);
  const [refreshingRandom, setRefreshingRandom] = useState(false);

  const suggestTimer = useRef(null);

  /* ---------- Fetching and search helpers ---------- */

  // Generic fetch helper for "upcoming" with optional params
  async function fetchUpcoming(params = {}) {
    setLoadingLaunch(true);
    try {
      const urlParams = new URLSearchParams();
      if (params.search) urlParams.set("search", params.search);
      if (params.limit) urlParams.set("limit", params.limit);
      // request a larger page when we need a pool for random picks
      const url = `${BASE_ENDPOINT}?${urlParams.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Request failed (${res.status})`);
        return null;
      }
      const json = await res.json();
      setRawResp(json);
      const items = json.results || [];
      if (items && items.length > 0) {
        setCurrentLaunch(items[0]);
      }
      return json;
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch launches");
      return null;
    } finally {
      setLoadingLaunch(false);
    }
  }

  // Fetch a bigger pool (limit up to 100) and pick 10 random items
  async function loadRandomList() {
    try {
      setRefreshingRandom(true);
      const limit = 100; // API allows larger page sizes; adjust if needed
      const url = `${BASE_ENDPOINT}?limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Failed to load random list (${res.status})`);
        setRandomList([]);
        setRefreshingRandom(false);
        return;
      }
      const json = await res.json();
      const items = json.results || [];
      const shuffled = shuffleArray(items);
      const picked = shuffled.slice(0, Math.min(10, shuffled.length));
      setRandomList(picked);
      if (!currentLaunch && picked.length > 0) {
        setCurrentLaunch(picked[0]);
        setRawResp({ results: picked });
      }
    } catch (err) {
      console.error(err);
      setRandomList([]);
    } finally {
      setRefreshingRandom(false);
    }
  }

  async function searchLaunches(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const urlParams = new URLSearchParams();
      urlParams.set("search", q);
      urlParams.set("limit", "12");
      const url = `${BASE_ENDPOINT}?${urlParams.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      const items = json.results || [];
      setSuggestions(items || []);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      searchLaunches(v);
    }, 300);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Search launches by name, pad, rocket or mission...");
      return;
    }
    setLoadingSuggest(true);
    try {
      const urlParams = new URLSearchParams();
      urlParams.set("search", query);
      urlParams.set("limit", "20");
      const url = `${BASE_ENDPOINT}?${urlParams.toString()}`;
      const res = await fetch(url);
      const json = await res.json();
      setLoadingSuggest(false);
      const items = json.results || [];
      if (items && items.length > 0) {
        setCurrentLaunch(items[0]);
        setRawResp(json);
        setShowSuggest(false);
        showToast("success", `Loaded: ${items[0].name || "launch"}`);
      } else {
        showToast("info", "No launches found — try another keyword");
      }
    } catch (err) {
      setLoadingSuggest(false);
      console.error(err);
      showToast("error", "Failed to search launches");
    }
  }

  function selectSuggestion(item) {
    setCurrentLaunch(item);
    setRawResp({ results: [item] });
    setShowSuggest(false);
  }

  /* Clipboard & download helpers */
  function copyLaunchToClipboard() {
    if (!currentLaunch) return showToast("info", "No launch to copy");
    navigator.clipboard.writeText(prettyJSON(currentLaunch));
    showToast("success", "Launch JSON copied");
  }

  function downloadJSON() {
    if (!rawResp && !currentLaunch) {
      showToast("info", "No launch to download");
      return;
    }
    const payload = rawResp || currentLaunch;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = currentLaunch?.name ? currentLaunch.name.replace(/\s+/g, "_") : "launch";
    a.download = `launch_${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* initial load */
  useEffect(() => {
    fetchUpcoming({ limit: 10 });
    loadRandomList();
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Utilities */
  function renderPrimaryImage(launch) {
    // Try typical fields
    const candidates = [
      launch?.image,
      launch?.rocket?.configuration?.image,
      launch?.mission?.thumbnail,
      launch?.mission?.image
    ];
    for (const c of candidates) {
      if (c && typeof c === "string" && c.length > 5) return c;
    }
    return PLACEHOLDER_SVG;
  }

  function formatDate(str) {
    if (!str) return "TBD";
    try {
      const d = new Date(str);
      return d.toLocaleString();
    } catch {
      return str;
    }
  }

  const randomListMemo = useMemo(() => randomList, [randomList]);

  return (
    <div className={clsx("min-h-screen p-4 sm:p-6 max-w-9xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Mobile menu / sheet */}
          <div className="sm:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2 rounded-md cursor-pointer">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:w-[340px]">
                <SheetHeader>
                  <SheetTitle>Launches</SheetTitle>
                </SheetHeader>
                <ScrollArea style={{ height: "70vh" }} className="px-3 pb-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Random launches</div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => loadRandomList()} className="cursor-pointer"><RefreshCw /></Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {randomListMemo.length === 0 && <div className="text-xs opacity-60">No random list yet.</div>}
                      {randomListMemo.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setCurrentLaunch(r);
                            setRawResp({ results: [r] });
                            setSheetOpen(false);
                          }}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                          <img src={renderPrimaryImage(r)} alt={r.name} onError={(e) => (e.currentTarget.src = PLACEHOLDER_SVG)} className="w-14 h-10 object-cover rounded-md" />
                          <div className="text-left flex-1">
                            <div className="text-sm font-medium">{r.name}</div>
                            <div className="text-xs opacity-60">{formatDate(r.net)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              {/* Desktop left toggle */}
              <Button variant="ghost" onClick={() => setSidebarOpen((s) => !s)} className="p-2 rounded-md cursor-pointer">
                <Menu />
              </Button>
            </div>

            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-extrabold">Launchbook</h1>
              <div className="text-xs opacity-60">Upcoming launches — browse, inspect, and export</div>
            </div>
          </div>
        </div>

        {/* search + actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full sm:w-[520px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search launches (Falcon 9, Vandenberg, Artemis...)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              aria-label="Search launches"
            />
            <Button type="button" variant="outline" onClick={() => fetchUpcoming({ limit: 10 })} className="px-3 cursor-pointer"><RefreshCw /> Refresh</Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx(
              "absolute z-50 left-4 right-4 sm:left-[calc(50%_-_320px)] sm:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl",
              isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => {
              const key = s.id || s.name || idx;
              const date = s.net;
              return (
                <li key={key} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => selectSuggestion(s)}>
                  <div className="flex items-center gap-3">
                    <img src={renderPrimaryImage(s)} alt={s.name || "thumb"} onError={(e) => (e.currentTarget.src = PLACEHOLDER_SVG)} className="w-14 h-10 object-cover rounded-md" />
                    <div className="flex-1">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs opacity-60">{safe(s, "launch_service_provider.name", "—")}</div>
                    </div>
                    <div className="text-xs opacity-60">{formatDate(date)}</div>
                  </div>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: sidebar (desktop only) */}
        {sidebarOpen && (
          <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Random launches</div>
                <div className="text-xs opacity-60">10 picks from upcoming launches</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => loadRandomList()} className="cursor-pointer"><RefreshCw /></Button>
              </div>
            </div>

            <ScrollArea style={{ height: 420 }} className="px-1">
              <div className="grid grid-cols-1 gap-2">
                {randomListMemo.length === 0 && <div className="text-xs opacity-60 p-2">Loading…</div>}
                {randomListMemo.map((r) => (
                  <div key={r.id} className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer" onClick={() => { setCurrentLaunch(r); setRawResp({ results: [r] }); }}>
                    <div className="flex items-center gap-3">
                      <img src={renderPrimaryImage(r)} alt={r.name} onError={(e) => (e.currentTarget.src = PLACEHOLDER_SVG)} className="w-14 h-10 object-cover rounded-md" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{r.name}</div>
                        <div className="text-xs opacity-60">{formatDate(r.net)}</div>
                      </div>
                      <div className="text-xs opacity-60">{safe(r, "launch_service_provider.name", "—")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Middle: main preview */}
        <section className="lg:col-span- sidebarOpen ? 9 : 12 lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 w-12 h-12 flex items-center justify-center">
                  <ImageIcon />
                </div>
                <div>
                  <CardTitle className="text-lg">{currentLaunch?.name || "Waiting for a launch..."}</CardTitle>
                  <div className="text-xs opacity-60 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> {safe(currentLaunch, "launch_service_provider.name", "—")}
                    <Calendar className="w-4 h-4 ml-3" /> {formatDate(currentLaunch?.net)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => { fetchUpcoming({ limit: 10 }); loadRandomList(); }}><RefreshCw className={loadingLaunch || refreshingRandom ? "animate-spin" : ""} /> Refresh</Button>

               
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide Raw" : "Raw"}</Button>

                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingLaunch ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentLaunch ? (
                <div className="py-12 text-center text-sm opacity-60">No launch loaded — try search or refresh.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left column: image + quick meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="w-full rounded-md overflow-hidden mb-3">
                      <img
                        src={renderPrimaryImage(currentLaunch)}
                        alt={currentLaunch.name}
                        className="w-full h-44 object-cover"
                        onError={(e) => (e.currentTarget.src = PLACEHOLDER_SVG)}
                      />
                    </div>

                    <div className="text-lg font-semibold">{currentLaunch.name}</div>
                    <div className="text-xs opacity-60">{safe(currentLaunch, "launch_service_provider.name", "Unknown provider")}</div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Star className="w-4 h-4" /> Status</div>
                        <div className="font-medium">{safe(currentLaunch, "status.name", currentLaunch.status || "—")}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Rocket className="w-4 h-4" /> Rocket</div>
                        <div className="font-medium">{safe(currentLaunch, "rocket.configuration.name", safe(currentLaunch, "rocket.name", "—"))}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><MapPin className="w-4 h-4" /> Pad</div>
                        <div className="font-medium">{safe(currentLaunch, "pad.name", safe(currentLaunch, "pad", "—"))}</div>
                        <div className="text-xs opacity-60">{safe(currentLaunch, "pad.location.name", "")}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Calendar className="w-4 h-4" /> Window</div>
                        <div className="font-medium">{formatDate(currentLaunch.net)} {currentLaunch.window_start ? `— ${formatDate(currentLaunch.window_end)}` : ""}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" onClick={() => { if (currentLaunch?.url) window.open(currentLaunch.url, "_blank"); else showToast("info", "No external URL"); }} className="cursor-pointer"><ExternalLink /> View on Launch Library</Button>
                      <Button variant="ghost" onClick={() => downloadJSON()} className="cursor-pointer"><Download /></Button>
                    </div>
                  </div>

                  {/* Right column: overview + fields */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Overview</div>
                        <div className="text-sm leading-relaxed mb-3">
                          {currentLaunch.mission?.description || currentLaunch.summary || currentLaunch.name || "No mission summary available."}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-3 rounded-md border">
                            <div className="text-xs opacity-60 flex items-center gap-2"><Rocket className="w-4 h-4" /> Rocket</div>
                            <div className="text-sm font-medium">{safe(currentLaunch, "rocket.configuration.name", safe(currentLaunch, "rocket.name", "—"))}</div>
                          </div>

                          <div className="p-3 rounded-md border">
                            <div className="text-xs opacity-60 flex items-center gap-2"><MapPin className="w-4 h-4" /> Launch Pad</div>
                            <div className="text-sm font-medium">{safe(currentLaunch, "pad.name", safe(currentLaunch, "pad", "—"))}</div>
                            <div className="text-xs opacity-60">{safe(currentLaunch, "pad.location.name", "")}</div>
                          </div>

                          <div className="p-3 rounded-md border">
                            <div className="text-xs opacity-60 flex items-center gap-2"><Calendar className="w-4 h-4" /> Window</div>
                            <div className="text-sm font-medium">{formatDate(currentLaunch.net)}</div>
                          </div>

                          <div className="p-3 rounded-md border">
                            <div className="text-xs opacity-60 flex items-center gap-2"><Globe className="w-4 h-4" /> Provider</div>
                            <div className="text-sm font-medium">{safe(currentLaunch, "launch_service_provider.name", "—")}</div>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <Button variant="ghost" onClick={() => copyLaunchToClipboard()} className="cursor-pointer"><Copy /></Button>
                        <Button variant="ghost" onClick={() => downloadJSON()} className="cursor-pointer"><Download /></Button>
                        <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer"><List /></Button>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Full fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.keys(currentLaunch).map((k) => (
                        <div key={k} className="p-2 rounded-md border break-words">
                          <div className="text-xs opacity-60">{k}</div>
                          <div className="text-sm font-medium">{typeof currentLaunch[k] === "object" ? prettyJSON(currentLaunch[k]) : (currentLaunch[k] ?? "—")}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Animated raw JSON area */}
            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}
                >
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right quick developer panel for small screens */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/30 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Developer</div>
            <div className="text-xs opacity-60 mb-2">Endpoint & quick actions</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button className="cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(`${BASE_ENDPOINT}`); showToast("success", "Endpoint copied"); }}><Copy /> Copy Endpoint</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => setShowRaw((s) => !s)}><List /> Toggle Raw</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick info</div>
            <div className="text-xs opacity-60">Primary fields shown: name, provider, rocket, pad, mission, window</div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{currentLaunch?.name || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {currentLaunch ? (
              <img
                src={renderPrimaryImage(currentLaunch)}
                alt={currentLaunch?.name}
                style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                onError={(e) => (e.currentTarget.src = PLACEHOLDER_SVG)}
              />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from Launch Library</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { if (currentLaunch?.url) window.open(currentLaunch.url, "_blank"); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
