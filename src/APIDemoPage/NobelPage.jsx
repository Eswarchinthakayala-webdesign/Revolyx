// NobelPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Copy,
  Download,
  List,
  Loader2,
  Calendar,
  BookOpen,
  MapPin,
  Users,
  Info,
  Globe,
  Menu,
  RefreshCw,
  Check,
  Clipboard,
  FileText,
  Tag,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const API_ENDPOINT = "https://api.nobelprize.org/2.1/nobelPrizes";
const DEFAULT_QUERY = "2020";
const DEBOUNCE_MS = 300;

/** utilities (kept safe/defensive) */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
function safeText(field) {
  if (!field && field !== 0) return "—";
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null) {
    if ("en" in field && field.en) return field.en;
    const keys = Object.keys(field);
    if (keys.length > 0 && typeof field[keys[0]] === "string") return field[keys[0]];
  }
  return String(field);
}
function laureateName(L) {
  if (!L || typeof L !== "object") return "Unknown Laureate";
  const known = safeText(L.knownName);
  if (known && known !== "—") return known;
  const given = safeText(L.givenName);
  const family = safeText(L.familyName);
  const combined = `${given !== "—" ? given : ""} ${family !== "—" ? family : ""}`.trim();
  return combined || "Unknown Laureate";
}

/** helper: pick N random prizes */
function pickRandom(arr, n = 10) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const copy = arr.slice();
  const out = [];
  while (out.length < Math.min(n, copy.length)) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export default function NobelPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [allPrizes, setAllPrizes] = useState([]);
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [current, setCurrent] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [laureateDialog, setLaureateDialog] = useState({ open: false, laureate: null });

  const [sidebarOpen, setSidebarOpen] = useState(true); // desktop togglable
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [randomSidebar, setRandomSidebar] = useState([]);
  const [copyStatus, setCopyStatus] = useState("idle"); // idle | copying | done

  const debRef = useRef(null);
  const mountedRef = useRef(true);

  // fetch full list once (defensive)
  useEffect(() => {
    mountedRef.current = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(API_ENDPOINT);
        if (!res.ok) {
          showToast("error", `Failed to fetch Nobel data (${res.status})`);
          setLoading(false);
          return;
        }
        const json = await res.json();
        const prizes = Array.isArray(json?.nobelPrizes) ? json.nobelPrizes : Array.isArray(json) ? json : [];
        if (mountedRef.current) {
          setAllPrizes(prizes);
          setRawResp(json);
          const pick = prizes.find(p => p?.awardYear === DEFAULT_QUERY) || prizes[0] || null;
          setCurrent(pick);
          setRandomSidebar(pickRandom(prizes, 10));
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Network error fetching Nobel data");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }
    load();
    return () => {
      mountedRef.current = false;
      if (debRef.current) clearTimeout(debRef.current);
    };
  }, []);

  // client-side matcher
  function computeMatches(term) {
    if (!term) return [];
    const t = term.toLowerCase().trim();
    return allPrizes.filter((p) => {
      if (!p) return false;
      if ((p.awardYear || "").toLowerCase().includes(t)) return true;
      const cat = safeText(p.category || "");
      if (cat.toLowerCase().includes(t)) return true;
      if (Array.isArray(p.laureates)) {
        for (const L of p.laureates) {
          if (!L) continue;
          const name = laureateName(L).toLowerCase();
          if (name.includes(t)) return true;
        }
      }
      return false;
    });
  }

  // debounced suggestion search
  function searchSuggestions(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      setLoadingSuggest(false);
      return;
    }
    setLoadingSuggest(true);
    const results = computeMatches(q);
    setTimeout(() => {
      if (!mountedRef.current) return;
      setSuggestions(results.slice(0, 12));
      setLoadingSuggest(false);
    }, 80);
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      searchSuggestions(v);
    }, DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (debRef.current) clearTimeout(debRef.current);
    };
  }, []);

  function onSubmit(e) {
    e?.preventDefault?.();
    if (suggestions && suggestions.length > 0) {
      setCurrent(suggestions[0]);
      setShowSuggest(false);
      return;
    }
    const matches = computeMatches(query);
    if (matches.length > 0) {
      setCurrent(matches[0]);
      setShowSuggest(false);
    } else {
      showToast("info", "No matches. Try a year (e.g. 2020), category (Physics) or laureate.");
    }
  }

  function pickSuggestion(p) {
    if (!p) return;
    setCurrent(p);
    setShowSuggest(false);
  }

  function refreshRandom() {
    setRandomSidebar(pickRandom(allPrizes, 10));
    showToast("success", "Refreshed list");
  }

  // copy endpoint with animated tick
  async function handleCopyEndpoint() {
    try {
      setCopyStatus("copying");
      await navigator.clipboard.writeText(API_ENDPOINT);
      setCopyStatus("done");
      setTimeout(() => {
        if (mountedRef.current) setCopyStatus("idle");
      }, 1400);
      showToast("success", "Endpoint copied");
    } catch {
      setCopyStatus("idle");
      showToast("error", "Could not copy");
    }
  }

  function downloadCurrentJSON() {
    const payload = current || rawResp || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safeCategory = current ? safeText(current.category).replace(/\s+/g, "_") : "nobel";
    a.download = `${current ? `nobel_${current.awardYear}_${safeCategory}` : "nobel_data"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  const totalPrizes = allPrizes.length;

  // small sub-components to keep render tidy
  const SidebarList = ({ items = [], onPick }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Random Picks</div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={refreshRandom} className="cursor-pointer" aria-label="Refresh picks">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <ScrollArea style={{ height: 340 }} className="rounded-md border p-2">
        <div className="flex flex-col gap-2">
          {items && items.length > 0 ? items.map((p, i) => (
            <button
              key={`${p?.awardYear ?? "ny"}-${i}`}
              onClick={() => { onPick?.(p); setSidebarOpen(false); setMobileSheetOpen(false); }}
              className="text-left p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer"
              type="button"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{safeText(p?.category) || "—"}</div>
                  <div className="text-xs opacity-60">{p?.awardYear ?? "—"}</div>
                </div>
                <div className="text-xs opacity-60">{p?.prizeAmount ? `${p.prizeAmount} SEK` : "—"}</div>
              </div>
            </button>
          )) : (
            <div className="text-xs opacity-60 p-2">No items</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex items-start flex-wrap md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Mobile menu / sheet trigger */}
          <div className="md:hidden">
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2 cursor-pointer" aria-label="Open menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className={clsx(isDark ? "bg-black" : "bg-white")}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-lg font-bold">Nobel Picks</div>
                    <Button variant="ghost" onClick={() => setMobileSheetOpen(false)} className="cursor-pointer">Close</Button>
                  </div>
                  <SidebarList items={randomSidebar} onPick={(p) => { setCurrent(p); setMobileSheetOpen(false); }} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">Nobel Explorer</h1>
            <p className="mt-0.5 text-sm opacity-70">Explore Nobel Prize open data</p>
          </div>
        </div>

        {/* search & actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={onSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search Nobel prizes"
              placeholder="Year (e.g. 2020), category (Physics) or laureate (Marie Curie)..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" variant="outline" className="px-3 cursor-pointer">Search</Button>
          </form>

          {/* endpoint copy + download */}
    
        </div>
      </header>

      {/* Suggestions popup */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, i) => (
              <li key={`${s?.awardYear ?? "ny"}-${i}`} onClick={() => pickSuggestion(s)} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{safeText(s?.category) || "—"} — {s?.awardYear ?? "—"}</div>
                    <div className="text-xs opacity-60">{Array.isArray(s?.laureates) && s.laureates.length > 0 ? laureateName(s.laureates[0]) : "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s?.prizeAmount ? `${s.prizeAmount} SEK` : "—"}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left sidebar (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3", isDark ? "bg-black/10 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          

          <SidebarList items={randomSidebar} onPick={(p) => setCurrent(p)} />
          <Separator className="my-3" />
          <div className="text-xs opacity-70">
            <div><span className="opacity-60 text-[11px]">API</span><div className="font-medium break-all">{API_ENDPOINT}</div></div>
            <div className="mt-2"><span className="opacity-60 text-[11px]">Total prizes</span><div className="font-medium">{totalPrizes}</div></div>
          </div>
        </aside>

        {/* Center */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-start justify-between", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 opacity-80" /> Prize Details
                  </CardTitle>
                </div>
                <div className="mt-1 text-xs opacity-60 flex items-center gap-3">
                  <Tag className="w-3.5 h-3.5" /> {current ? `${safeText(current.category)} • ${current.awardYear}` : "No prize selected"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { setCurrent(null); setQuery(DEFAULT_QUERY); showToast("info", "Cleared selection"); }} className="cursor-pointer">
                  Clear
                </Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)} className="cursor-pointer">
                  <List />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-16 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No prize selected — use search, picks or quick filters.</div>
              ) : (
                <div className="space-y-4">
                  {/* summary top */}
                  <div className="p-4 rounded-xl border flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-extrabold">{safeText(current.category)}</div>
                        <Badge variant="secondary" className="text-xs">{current.awardYear}</Badge>
                      </div>
                      <div className="mt-2 text-sm opacity-70 flex items-center gap-3">
                        <Calendar className="w-4 h-4" /> Prize amount: {current.prizeAmount ? `${current.prizeAmount} SEK` : "—"}
                      </div>
                      <div className="mt-1 text-xs opacity-60 flex items-center gap-3">
                        <Info className="w-3.5 h-3.5" /> Status: <span className="ml-1 font-medium">{current.prizeStatus || "—"}</span>
                      </div>
                    </div>

                    <div className="w-44 text-right">
                      <div className="text-xs opacity-60">Adjusted</div>
                      <div className="font-medium mt-1">{current.prizeAmountAdjusted ? `${current.prizeAmountAdjusted} SEK` : "—"}</div>
                    </div>
                  </div>

                  {/* laureates */}
                  <div className="p-4 rounded-xl border">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4" /> Laureates
                      </div>
                      <div className="text-xs opacity-60">{Array.isArray(current.laureates) ? current.laureates.filter(Boolean).length : 0}</div>
                    </div>

                    <div className="mt-3 space-y-3">
                      <ScrollArea className="overflow-y-auto"  style={{ height: 240 }}>
                        {Array.isArray(current.laureates) && current.laureates.filter(Boolean).length > 0 ? current.laureates.filter(Boolean).map((L, idx) => (
                          <div key={L?.id ?? idx} className="p-3 rounded-md border flex items-start gap-4">
                            <div className="w-12 h-12 rounded-md bg-zinc-100/40 flex items-center justify-center text-sm">
                              {(laureateName(L) || "—").slice(0, 2).toUpperCase()}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{laureateName(L)}</div>
                                  <div className="text-xs opacity-60">{L?.gender || ""} • {safeText(L?.born?.place || L?.birth?.place) || "—"}</div>
                                </div>

                                <div className="flex gap-2 items-start">
                                  {Array.isArray(L?.links) && L.links.find(ln => ln.rel && ln.href) && (
                                    <a href={L.links.find(ln => ln.rel && ln.href).href} target="_blank" rel="noreferrer" className="text-xs opacity-70 flex items-center gap-1 cursor-pointer">
                                      <ExternalLink className="w-4 h-4" /> More
                                    </a>
                                  )}
                                  <Button variant="ghost" onClick={() => setLaureateDialog({ open: true, laureate: L })} className="cursor-pointer">Details</Button>
                                </div>
                              </div>

                              {L?.motivation && (
                                <div className="mt-2 text-sm opacity-80 italic">“{safeText(L.motivation)}”</div>
                              )}

                              {Array.isArray(L?.affiliations) && L.affiliations.length > 0 && (
                                <div className="mt-2 text-xs opacity-60">
                                  <MapPin className="w-3.5 h-3.5 inline-block mr-1" /> Affiliation: {L.affiliations.map(a => safeText(a?.name)).join(", ")}
                                </div>
                              )}
                            </div>
                          </div>
                        )) : (
                          <div className="text-sm opacity-60 p-2">No laureates listed for this prize.</div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>

                  {/* metadata grid */}
                  <div className="p-4 rounded-xl border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Category</div>
                        <div className="font-medium">{safeText(current.category)}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Award year</div>
                        <div className="font-medium">{current.awardYear}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Prize amount</div>
                        <div className="font-medium">{current.prizeAmount ? `${current.prizeAmount} SEK` : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Info className="w-3.5 h-3.5" /> Prize (adjusted)</div>
                        <div className="font-medium">{current.prizeAmountAdjusted ? `${current.prizeAmountAdjusted} SEK` : "—"}</div>
                      </div>
                    </div>
                  </div>

                  {/* raw JSON (toggle) */}
                  <AnimatePresence>
                    {showRaw && current && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="rounded-xl p-4 border">
                        <div className="flex items-center justify-between">
                          <div className="text-sm opacity-70 flex items-center gap-2"><FileText className="w-4 h-4" /> Raw JSON (selected prize)</div>
                          <div className="text-xs opacity-60">Response</div>
                        </div>
                        <div className="mt-3 text-xs overflow-auto" style={{ maxHeight: 300 }}>
                          <pre className="whitespace-pre-wrap text-xs">{prettyJSON(current)}</pre>
                        </div>
                      </motion.div>
                    )}
                    {showRaw && !current && rawResp && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="rounded-xl p-4 border">
                        <div className="text-sm opacity-70 flex items-center gap-2"><FileText className="w-4 h-4" /> Raw JSON (full response)</div>
                        <div className="mt-3 text-xs overflow-auto" style={{ maxHeight: 300 }}>
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
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/20 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold flex items-center gap-2"><Info className="w-4 h-4" /> Quick actions</div>
            <div className="text-xs opacity-60">Utilities</div>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={handleCopyEndpoint} className="cursor-pointer flex items-center gap-2">
              <Copy className="mr-2" /> Copy endpoint
            </Button>
            <Button variant="outline" onClick={downloadCurrentJSON} className="cursor-pointer flex items-center gap-2">
              <Download className="mr-2" /> Download JSON
            </Button>
            <Button variant="outline" onClick={() => window.open("https://api.nobelprize.org/2.1/documentation", "_blank")} className="cursor-pointer flex items-center gap-2">
              <Globe className="mr-2" /> API docs
            </Button>
            <Button variant="outline" onClick={() => setShowRaw(s => !s)} className="cursor-pointer flex items-center gap-2">
              <List className="mr-2" /> Toggle raw
            </Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About this dataset</div>
            <div className="text-xs opacity-60">
              Open Nobel Prize data. Results include prize metadata and laureates. Use the random picks, search or mobile menu to browse quickly.
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Shortcuts</div>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="ghost" onClick={() => { setQuery("Physics"); searchSuggestions("Physics"); }} className="cursor-pointer">Physics</Button>
              <Button variant="ghost" onClick={() => { setQuery("2020"); searchSuggestions("2020"); }} className="cursor-pointer">Year 2020</Button>
              <Button variant="ghost" onClick={() => { setQuery("Marie Curie"); searchSuggestions("Marie Curie"); }} className="cursor-pointer">Marie Curie</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Laureate dialog */}
      <Dialog open={laureateDialog.open} onOpenChange={(v) => setLaureateDialog(s => ({ ...s, open: v }))}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{laureateName(laureateDialog.laureate) || "Laureate details"}</DialogTitle>
          </DialogHeader>

          <div style={{ padding: 20 }}>
            {laureateDialog.laureate ? (
              <div className="space-y-3 text-sm">
                <div><span className="opacity-60">Name</span><div className="font-medium">{laureateName(laureateDialog.laureate)}</div></div>
                <div><span className="opacity-60">Gender</span><div className="font-medium">{laureateDialog.laureate?.gender || "—"}</div></div>
                <div><span className="opacity-60">Born</span>
                  <div className="font-medium">
                    {laureateDialog.laureate?.born?.date || laureateDialog.laureate?.birth?.date || "—"}
                    {laureateDialog.laureate?.born?.place || laureateDialog.laureate?.birth?.place ? <span className="text-xs opacity-60"> • {laureateDialog.laureate?.born?.place || laureateDialog.laureate?.birth?.place}</span> : null}
                  </div>
                </div>
                <div><span className="opacity-60">Died</span><div className="font-medium">{laureateDialog.laureate?.died?.date || laureateDialog.laureate?.death?.date || "—"}</div></div>

                {Array.isArray(laureateDialog.laureate?.affiliations) && (
                  <div><span className="opacity-60">Affiliations</span><div className="font-medium">{laureateDialog.laureate.affiliations.map(a => safeText(a?.name)).join(", ")}</div></div>
                )}

                {Array.isArray(laureateDialog.laureate?.links) && (
                  <div>
                    <span className="opacity-60">Links</span>
                    <div className="flex gap-2 mt-1">
                      {laureateDialog.laureate.links.map((ln, i) => (
                        <a key={i} href={ln.href} target="_blank" rel="noreferrer" className="text-xs underline opacity-80">{ln.rel || ln.href}</a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-sm opacity-60">No laureate selected</div>
            )}
          </div>

          <DialogFooter className="flex justify-end p-4 border-t">
            <Button variant="outline" onClick={() => setLaureateDialog({ open: false, laureate: null })} className="cursor-pointer">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
