// src/pages/ThronesApiPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  ExternalLink,
  Copy,
  Shuffle,
  Image as ImageIcon,
  Info,
  Users,
  Loader2,
  X,
  Menu,
  RefreshCcw,
  Check,
  FileText,
  MapPin,
  Star,
  List,
  IdCard,
  DollarSign,
  Globe,
  Clipboard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

// Leaflet map (optional, for map dialog)
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const API_ENDPOINT = "https://thronesapi.com/api/v2/Characters";
const DEFAULT_MSG = "Search characters by name, title, family or ID...";

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/* Detail Dialog component used for showing a single field (and currency rates if applicable) */
function DetailDialog({ open, onOpenChange, fieldKey, fieldValue, themeDark }) {
  const [loadingRates, setLoadingRates] = useState(false);
  const [rates, setRates] = useState(null);

  useEffect(() => {
    setRates(null);
  }, [fieldKey, fieldValue]);

  // detect 3-letter currency like "USD" or "EUR" (simple heuristic)
  const maybeCurrency =
    typeof fieldValue === "string" && /^[A-Za-z]{3}$/.test(fieldValue.trim());

  async function fetchRates(base) {
    if (!base) return;
    setLoadingRates(true);
    try {
      const res = await fetch(`https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`);
      if (!res.ok) throw new Error("Rates fetch failed");
      const json = await res.json();
      setRates(json);
    } catch (err) {
      console.error(err);
      showToast("error", `Failed to load exchange rates for ${base}`);
    } finally {
      setLoadingRates(false);
    }
  }

  useEffect(() => {
    if (maybeCurrency) {
      fetchRates(fieldValue.trim().toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", themeDark ? "bg-zinc-900" : "bg-white")}>
        <DialogHeader className="p-4">
          <DialogTitle className="flex items-center gap-3">
            <IdCard /> Field details
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <div className="text-xs opacity-60 mb-2">Key</div>
          <div className="font-medium mb-3 break-words">{fieldKey}</div>

          <div className="text-xs opacity-60 mb-2">Value</div>
          <div className="mb-4">
            <pre className="text-sm rounded-md p-3 border" style={{ maxHeight: 200, overflow: "auto" }}>
              {prettyJSON(fieldValue)}
            </pre>
          </div>

          {maybeCurrency && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold flex items-center gap-2"><DollarSign /> Exchange rates (base {String(fieldValue).toUpperCase()})</div>
                <div className="text-xs opacity-60">{loadingRates ? "Loading..." : rates ? `Updated ${rates.date}` : "Auto-load"}</div>
              </div>

              <div className="rounded-md border p-3 max-h-64 overflow-auto">
                {loadingRates ? (
                  <div className="text-center py-6"><Loader2 className="animate-spin mx-auto" /></div>
                ) : !rates ? (
                  <div className="text-xs opacity-60">No rates loaded yet.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(rates.rates).slice(0, 60).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-md border flex items-center justify-between">
                        <div>{k}</div>
                        <div className="font-medium">{Number(v).toFixed(4)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t flex justify-between items-center">
          <div className="text-xs opacity-60">Field inspector</div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="cursor-pointer"><X /></Button>
            {maybeCurrency && <Button variant="outline" onClick={() => fetchRates(String(fieldValue).toUpperCase())} className="cursor-pointer">Refresh rates</Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ThronesApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // dataset
  const [allChars, setAllChars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rawResp, setRawResp] = useState(null);

  // UI & search
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestTimer = useRef(null);

  // selection / random picks
  const [selected, setSelected] = useState(null);
  const [randomPicks, setRandomPicks] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // dialogs & toasts
  const [imgDialogOpen, setImgDialogOpen] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailFieldKey, setDetailFieldKey] = useState("");
  const [detailFieldValue, setDetailFieldValue] = useState(null);

  // copy animations
  const [copied, setCopied] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const copyTimer = useRef(null);

  useEffect(() => {
    // fetch once
    let mounted = true;
    async function fetchAll() {
      setLoading(true);
      try {
        const res = await fetch(API_ENDPOINT);
        if (!res.ok) {
          showToast("error", `Failed to load characters (${res.status})`);
          setLoading(false);
          return;
        }
        const json = await res.json();
        if (!mounted) return;
        const arr = Array.isArray(json) ? json : [];
        setAllChars(arr);
        setRawResp(json);
        if (arr.length > 0) {
          setSelected(arr[0]);
          setRandomPicks(pickRandom(arr, 10));
          showToast("success", `Loaded ${arr.length} characters`);
        } else {
          showToast("info", "No characters returned");
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to fetch characters");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
    return () => {
      mounted = false;
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  function pickRandom(pool = [], n = 10) {
    if (!pool || pool.length === 0) return [];
    const copy = pool.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  }

  function generateRandomPicks() {
    setRandomPicks(pickRandom(allChars, 10));
  }

  /* Search & suggestions: match by name, title, family, or numeric id */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const q = (v || "").trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        return;
      }
      // if q is numeric, match id as well
      const isNumeric = /^\d+$/.test(q);
      const res = allChars.filter((c) => {
        if (isNumeric && String(c.id) === q) return true;
        const combined = `${c.fullName ?? ""} ${c.firstName ?? ""} ${c.lastName ?? ""} ${c.title ?? ""} ${c.family ?? ""}`.toLowerCase();
        return combined.includes(q);
      }).slice(0, 30);
      setSuggestions(res);
    }, 180);
  }

  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", DEFAULT_MSG);
      return;
    }
    const q = query.trim().toLowerCase();
    const isNumeric = /^\d+$/.test(q);
    let found = null;
    if (isNumeric) {
      found = allChars.find((c) => String(c.id) === q);
    }
    if (!found) {
      found = allChars.find((c) => {
        const combined = `${c.fullName ?? ""} ${c.firstName ?? ""} ${c.lastName ?? ""} ${c.title ?? ""} ${c.family ?? ""}`.toLowerCase();
        return combined.includes(q);
      });
    }
    if (found) {
      setSelected(found);
      setShowSuggest(false);
      showToast("success", `Selected: ${found.fullName ?? `${found.firstName} ${found.lastName}`}`);
    } else {
      showToast("info", "No match found — try another term or ID");
    }
  }

  function chooseSuggestion(item) {
    setSelected(item);
    setShowSuggest(false);
    setQuery(item.fullName ?? `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim());
  }

  /* Copy character JSON */
  async function handleCopy() {
    if (!selected) {
      showToast("info", "No character selected");
      return;
    }
    try {
      await navigator.clipboard.writeText(prettyJSON(selected));
      setCopied(true);
      showToast("success", "Character JSON copied");
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1400);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to copy");
    }
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(API_ENDPOINT);
    setCopiedEndpoint(true);
    showToast("success", "Endpoint copied");
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedEndpoint(false), 1400);
  }

  function openImageExternal() {
    if (!selected || !selected.imageUrl) {
      showToast("info", "No image available");
      return;
    }
    window.open(selected.imageUrl, "_blank");
  }

  function openImageLocally() {
    if (!selected || !selected.imageUrl) {
      showToast("info", "No image available");
      return;
    }
    setImgDialogOpen(true);
  }

  function openMapDialog() {
    setMapDialogOpen(true);
  }

  function onFieldClick(k, v) {
    setDetailFieldKey(k);
    setDetailFieldValue(v);
    setDetailDialogOpen(true);
  }

  const leftList = useMemo(() => (showSuggest && suggestions.length > 0 ? suggestions : randomPicks.length ? randomPicks : allChars.slice(0, 50)), [allChars, suggestions, showSuggest, randomPicks]);

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 max-w-9xl mx-auto", isDark ? "text-white" : "text-zinc-900")}>
      {/* Header */}
      <header className="flex items-start md:items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Sheet trigger for mobile */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden cursor-pointer"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px]">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users />
                    <div>
                      <div className="font-semibold">Characters</div>
                      <div className="text-xs opacity-60">Quick picks</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => generateRandomPicks()} className="cursor-pointer"><RefreshCcw /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setSheetOpen(false)} className="cursor-pointer"><X /></Button>
                  </div>
                </div>

                <ScrollArea style={{ height: 620 }}>
                  <div className="space-y-2">
                    {leftList.map((c) => {
                      const name = c.fullName ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
                      const active = selected && selected.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => { setSelected(c); setSheetOpen(false); }}
                          className={clsx("flex items-center gap-3 p-2 rounded-md cursor-pointer transition", active ? "bg-gradient-to-r from-white/10 to-white/5 border border-zinc-300 dark:border-zinc-700 shadow-sm" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/30")}
                        >
                          <img src={c.imageUrl || ""} alt={name} className="w-12 h-12 object-cover rounded-md" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{name}</div>
                            <div className="text-xs opacity-60 truncate">{c.title || c.family || "—"}</div>
                          </div>
                          <Badge className="ml-auto glass">{c.id}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div className="rounded-full w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-zinc-800 shadow-sm">
            <Star />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">Thrones — Characters</h1>
            <p className="text-xs opacity-60">Browse characters, inspect metadata, export JSON.</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-[640px]" role="search">
          <div className={clsx("flex items-center gap-2 rounded-lg px-3 py-2 shadow-sm", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search characters, titles, family or numeric ID..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="button" variant="ghost" className="px-2 cursor-pointer" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); }}>
              Clear
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>

            <div className="flex items-center gap-1 ml-2">
              <Button variant="ghost" onClick={() => { generateRandomPicks(); showToast("success", "Random picks refreshed"); }} className="cursor-pointer"><Shuffle /></Button>
              <Button variant="ghost" onClick={() => { setRandomPicks(allChars.slice(0, 10)); showToast("success", "Top 10 loaded"); }} className="cursor-pointer"><List /></Button>
            </div>
          </div>

          {/* suggestions dropdown */}
          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={clsx("absolute left-0 right-0 mt-2 max-h-80 overflow-auto rounded-xl shadow-2xl z-50", isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200")}
              >
                {suggestions.map((s) => (
                  <li key={s.id} onClick={() => chooseSuggestion(s)} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <img src={s.imageUrl || ""} alt={s.fullName ?? s.firstName} className="w-12 h-12 object-cover rounded-sm" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{s.fullName ?? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim()}</div>
                        <div className="text-xs opacity-60 truncate">{s.title || s.family || "—"}</div>
                      </div>
                      <div className="text-xs opacity-60">#{s.id}</div>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </form>
      </header>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar desktop */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-center gap-2">
                <Users />
                <div>
                  <CardTitle className="text-sm">Picks</CardTitle>
                  <div className="text-xs opacity-60">Ten random characters</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => generateRandomPicks()} className="cursor-pointer"><RefreshCcw /></Button>
                <Button variant="ghost" size="sm" onClick={() => setRandomPicks(allChars.slice(0, 10))} className="cursor-pointer">Top</Button>
              </div>
            </CardHeader>

            <CardContent>
              <ScrollArea className="h-[60vh]">
                <div className="space-y-2">
                  {loading ? (
                    <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                  ) : leftList.length === 0 ? (
                    <div className="py-6 text-center text-sm opacity-60">No characters available</div>
                  ) : (
                    leftList.map((c) => {
                      const name = c.fullName ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
                      const active = selected && selected.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => { setSelected(c); setShowSuggest(false); }}
                          className={clsx("flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all", active ? "bg-gradient-to-r from-white/10 to-white/5 border border-zinc-300 dark:border-zinc-700 shadow-sm" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/30")}
                        >
                          <img src={c.imageUrl || ""} alt={name} className="w-12 h-12 object-cover rounded-md" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{name}</div>
                            <div className="text-xs opacity-60 truncate">{c.title || c.family || "—"}</div>
                          </div>
                          <Badge className="glass">{c.id}</Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border p-3", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="text-sm font-semibold mb-2">Actions</div>
            <div className="text-xs opacity-60 mb-3">Utilities</div>
            <div className="flex flex-col gap-2">
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => copyEndpoint()}><Clipboard /> Copy Endpoint</Button>
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { const idx = Math.floor(Math.random() * allChars.length); setSelected(allChars[idx]); }}><Shuffle /> Random</Button>
              <Button className="w-full cursor-pointer" variant="ghost" onClick={() => setShowSuggest((s) => !s)}><List /> Toggle suggestions</Button>
            </div>
          </Card>
        </aside>

        {/* Center preview */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-start justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><List /> Character Preview</CardTitle>
                <div className="mt-1 text-xs opacity-60 flex items-center gap-3">
                  <div className="flex items-center gap-1"><MapPin className="opacity-70" /> {selected?.title ?? "Title"}</div>
                  <div className="flex items-center gap-1"><Star className="opacity-70" /> {selected?.family ?? "Family"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="cursor-pointer" onClick={() => { setSelected(null); setQuery(""); setShowSuggest(false); }}>Clear</Button>
                <Button variant="ghost" className="cursor-pointer" onClick={() => openImageLocally()} title="View image"><ImageIcon /></Button>

              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selected ? (
                <div className="py-12 text-center text-sm opacity-60">Select a character from the left or search to begin.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* left column: image & badges */}
                    <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="w-full h-44 rounded-md overflow-hidden mb-3 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                        {selected.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selected.imageUrl} alt={selected.fullName ?? selected.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-xs opacity-60">No image</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-semibold truncate">{selected.fullName ?? `${selected.firstName ?? ""} ${selected.lastName ?? ""}`}</h2>
                        <Badge className="glass">{selected.id}</Badge>
                      </div>

                      <div className="flex gap-2 flex-wrap mb-3">
                        <Badge className="glass">{selected.title || "No title"}</Badge>
                        <Badge className="glass">{selected.family || "No family"}</Badge>
                      </div>

                      <div className="text-sm opacity-80">
                        <div className="text-xs opacity-60">Basic</div>
                        <div className="font-medium">{selected.firstName ?? "—"} {selected.lastName ?? ""}</div>
                        <div className="mt-2 text-xs opacity-60">ID</div>
                        <div className="font-medium">#{selected.id}</div>
                      </div>

                      <div className="mt-4">
                        <Button className="w-full cursor-pointer" variant="outline" onClick={() => openImageExternal()}><ExternalLink /> Open image</Button>
                      </div>
                    </div>

                    {/* right columns: details */}
                    <div className={clsx("p-4 rounded-xl border md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold flex items-center gap-2"><Users /> Overview</div>
                        <div className="text-xs opacity-60">Fields</div>
                      </div>

                      <div className="text-sm leading-relaxed mb-3">This panel shows all returned fields for the selected character. Click any field to open a detailed inspector (currency rates will auto-load for 3-letter currency codes).</div>

                      <Separator className="my-3" />

                      <ScrollArea className="max-h-[52vh] pr-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.keys(selected).map((k) => {
                            const v = selected[k];
                            return (
                              <div key={k} className="p-3 rounded-md border">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs capitalize flex items-center gap-2 opacity-60"><IdCard /> {k}</div>
                                  <Button variant="ghost" size="sm" onClick={() => onFieldClick(k, v)} className="cursor-pointer"><Info /></Button>
                                </div>
                                <div className="text-sm font-medium mt-2 break-words">
                                  {typeof v === "object" ? <pre className="text-xs">{prettyJSON(v)}</pre> : (v ?? "—")}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  {/* raw response toggled section */}
                  <AnimatePresence>
                    {showSuggest === false && rawResp && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("mt-4 p-4 rounded-md border", isDark ? "bg-black/30 border-zinc-800 text-zinc-200" : "bg-white/60 border-zinc-200 text-zinc-900")}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold">Raw dataset (preview)</div>
                          <div className="flex items-center gap-2">
                            <motion.button onClick={handleCopy} className="p-2 rounded-md cursor-pointer" initial={{ scale: 1 }} animate={{ scale: copied ? 0.96 : 1 }}>
                              {copied ? <Check className="text-green-500" /> : <Copy />}
                            </motion.button>
                            <Button variant="ghost" className="cursor-pointer" onClick={() => setShowSuggest((s) => !s)}>{showSuggest ? "Hide suggestions" : "Show suggestions"}</Button>
                          </div>
                        </div>
                        <pre className="text-xs overflow-auto" style={{ maxHeight: 220 }}>{prettyJSON(rawResp).slice(0, 3000)}{prettyJSON(rawResp).length > 3000 ? "…" : ""}</pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right actions & utilities */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Quick Actions</div>
              <div className="text-xs opacity-60">Developer & utility</div>
            </div>
            <div className="text-xs opacity-60">v1</div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button className="w-full cursor-pointer" onClick={() => handleCopy()}><Copy /> Copy character JSON</Button>
            <Button className="w-full cursor-pointer" variant="outline" onClick={() => openImageLocally()}><ImageIcon /> View image</Button>
            <Button className="w-full cursor-pointer" variant="outline" onClick={() => { if (allChars.length) { const idx = Math.floor(Math.random() * allChars.length); setSelected(allChars[idx]); showToast("success", "Random character chosen"); } else showToast("info", "No data"); }}><Shuffle /> Random</Button>
            <motion.button onClick={copyEndpoint} className="w-full p-2 rounded-md border flex items-center justify-center gap-2 cursor-pointer" initial={{ scale: 1 }} animate={{ scale: copiedEndpoint ? 0.96 : 1 }}>
              {copiedEndpoint ? <Check className="text-green-500" /> : <ExternalLink />} Copy endpoint
            </motion.button>
            <Button className="w-full cursor-pointer" variant="ghost" onClick={() => { setRandomPicks(pickRandom(allChars, 10)); showToast("success", "Random picks updated"); }}><RefreshCcw /> Refresh picks</Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-1">Meta</div>
            <div className="text-xs opacity-60">This page fetches the full dataset from <code className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded">/api/v2/Characters</code> and performs client-side search for low-latency suggestions.</div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={imgDialogOpen} onOpenChange={setImgDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-zinc-900" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selected?.fullName ?? "Image"}</DialogTitle>
          </DialogHeader>
          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {selected?.imageUrl ? (
              <img src={selected.imageUrl} alt={selected?.fullName} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center"><Info /> No image</div>
            )}
          </div>
          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image (if available)</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImgDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => openImageExternal()} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Map Dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-zinc-900" : "bg-white")}>
          <DialogHeader>
            <DialogTitle><MapPin /> Location map</DialogTitle>
          </DialogHeader>
          <div style={{ height: "70vh" }}>
            <MapContainer
              center={(selected && selected.coordinates && [selected.coordinates.latitude, selected.coordinates.longitude]) || [20, 0]}
              zoom={(selected && selected.coordinates) ? 10 : 2}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {selected && selected.coordinates && (
                <Marker position={[selected.coordinates.latitude, selected.coordinates.longitude]}>
                  <Popup>
                    <div className="font-medium">{selected.fullName ?? selected.location}</div>
                    <div className="text-xs opacity-60">{selected.title || ""}</div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
          <DialogFooter className="p-4 border-t flex justify-end">
            <Button variant="outline" onClick={() => setMapDialogOpen(false)} className="cursor-pointer">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <DetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        fieldKey={detailFieldKey}
        fieldValue={detailFieldValue}
        themeDark={isDark}
      />
    </div>
  );
}
