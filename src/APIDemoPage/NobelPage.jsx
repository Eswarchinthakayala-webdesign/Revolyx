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
  Globe
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * Robust NobelPage.jsx
 * - Defensive parsing
 * - Null-safe laureate handling
 * - Debounced client-side suggestions
 * - AbortController for search
 * - No localStorage
 */

const API_ENDPOINT = "https://api.nobelprize.org/2.1/nobelPrizes";
const DEFAULT_QUERY = "2020";
const DEBOUNCE_MS = 300;

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/** safeText: returns readable text from possible { en } objects or strings */
function safeText(field) {
  if (!field && field !== 0) return "—";
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null) {
    if ("en" in field && field.en) return field.en;
    // possibly older shape
    const keys = Object.keys(field);
    if (keys.length > 0 && typeof field[keys[0]] === "string") return field[keys[0]];
  }
  return String(field);
}

/** null-safe laureate name extractor */
function laureateName(L) {
  if (!L || typeof L !== "object") return "Unknown Laureate";
  const known = safeText(L.knownName);
  if (known && known !== "—") return known;
  const given = safeText(L.givenName);
  const family = safeText(L.familyName);
  const combined = `${given !== "—" ? given : ""} ${family !== "—" ? family : ""}`.trim();
  return combined || "Unknown Laureate";
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

  const debRef = useRef(null);
  const searchAbort = useRef(null);
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
          // pick default: try to match DEFAULT_QUERY by year, else first prize
          const pick = prizes.find(p => p?.awardYear === DEFAULT_QUERY) || prizes[0] || null;
          setCurrent(pick);
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
    };
  }, []);

  // helper: search client-side
  function computeMatches(term) {
    if (!term) return [];
    const t = term.toLowerCase().trim();
    return allPrizes.filter((p) => {
      if (!p) return false;
      // year match
      if ((p.awardYear || "").toLowerCase().includes(t)) return true;
      // category
      const cat = safeText(p.category || "");
      if (cat.toLowerCase().includes(t)) return true;
      // laureates
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

  // debounced suggestion search with AbortController
  function searchSuggestions(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      setLoadingSuggest(false);
      return;
    }

    setLoadingSuggest(true);
    // Cancel previous abort if any (not strictly needed for client-side filter, but left for future remote calls)
    if (searchAbort.current) {
      try { searchAbort.current.abort(); } catch {}
      searchAbort.current = null;
    }

    // tiny debounce (we still handle with debRef in onQueryChange)
    const results = computeMatches(q);
    // small promise-style delay for UX
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
    // cleanup debounce on unmount
    return () => {
      if (debRef.current) clearTimeout(debRef.current);
      if (searchAbort.current) {
        try { searchAbort.current.abort(); } catch {}
      }
    };
  }, []);

  function onSubmit(e) {
    e?.preventDefault?.();
    // prefer suggestion if present
    if (suggestions && suggestions.length > 0) {
      setCurrent(suggestions[0]);
      setShowSuggest(false);
      return;
    }
    // fallback: attempt to compute matches immediately
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

  // quick helpers
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

  function copyEndpoint() {
    navigator.clipboard.writeText(API_ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  const totalPrizes = allPrizes.length;

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Nobel Explorer</h1>
          <p className="mt-1 text-sm opacity-70">Explore Nobel Prize open data — search by year, category or laureate.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={onSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search Nobel prizes"
              placeholder="Search by year (e.g. 2020), category (Physics) or laureate (Marie Curie)..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" variant="outline" className="px-3">Search</Button>
          </form>
        </div>
      </header>

      {/* Suggestions (animated) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
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
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: summary */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/20 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Overview</div>
              <div className="text-xs opacity-60">{totalPrizes} prizes</div>
            </div>

            <div className="mt-3 text-xs opacity-70 space-y-2">
              <div><span className="opacity-60 text-[11px]">API</span><div className="font-medium break-all">{API_ENDPOINT}</div></div>
              <div><span className="opacity-60 text-[11px]">Default query</span><div className="font-medium">{DEFAULT_QUERY}</div></div>
              <div><span className="opacity-60 text-[11px]">Tips</span><div className="font-medium">Search by year, category (Physics) or laureate name.</div></div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Categories</div>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(allPrizes.map(p => safeText(p?.category)).filter(Boolean))).slice(0, 12).map((c) => (
                <button key={c} onClick={() => { setQuery(c); searchSuggestions(c); }} className={clsx("text-xs px-2 py-1 rounded-md border", isDark ? "bg-black/10 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick filters</div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => { setQuery("2021"); searchSuggestions("2021"); }}>Year: 2021</Button>
              <Button variant="outline" onClick={() => { setQuery("2020"); searchSuggestions("2020"); }}>Year: 2020</Button>
              <Button variant="outline" onClick={() => { setQuery("Physics"); searchSuggestions("Physics"); }}>Physics</Button>
            </div>
          </div>
        </aside>

        {/* Center: details */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Prize Details</CardTitle>
                <div className="text-xs opacity-60">{current ? `${safeText(current.category)} • ${current.awardYear}` : "No prize selected"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { setCurrent(null); setQuery(DEFAULT_QUERY); showToast("info", "Cleared selection"); }}>Clear</Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-16 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No prize selected — use search or quick filters.</div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-extrabold">{safeText(current.category)}</div>
                        <div className="text-sm px-2 py-1 rounded-full bg-zinc-100/40 text-xs">{current.awardYear}</div>
                      </div>
                      <div className="mt-2 text-sm opacity-70">Prize Amount: {current.prizeAmount ? `${current.prizeAmount} SEK` : "—"}</div>
                    </div>

                    <div className="w-44">
                      <div className="text-xs opacity-60">Prize status</div>
                      <div className="font-medium mt-1">{current.prizeStatus || "—"}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Laureates</div>
                      <div className="text-xs opacity-60">{Array.isArray(current.laureates) ? current.laureates.filter(Boolean).length : 0}</div>
                    </div>

                    <div className="mt-3 space-y-3">
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
                                  <a href={L.links.find(ln => ln.rel && ln.href).href} target="_blank" rel="noreferrer" className="text-xs opacity-70 flex items-center gap-1">
                                    <ExternalLink className="w-4 h-4" /> More
                                  </a>
                                )}
                                <Button variant="ghost" onClick={() => setLaureateDialog({ open: true, laureate: L })}>Details</Button>
                              </div>
                            </div>

                            {L?.motivation && (
                              <div className="mt-2 text-sm opacity-80 italic">“{safeText(L.motivation)}”</div>
                            )}

                            {Array.isArray(L?.affiliations) && L.affiliations.length > 0 && (
                              <div className="mt-2 text-xs opacity-60">
                                Affiliation: {L.affiliations.map(a => safeText(a?.name)).join(", ")}
                              </div>
                            )}
                          </div>
                        </div>
                      )) : (
                        <div className="text-sm opacity-60">No laureates listed for this prize.</div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs opacity-60">Category</div>
                        <div className="font-medium">{safeText(current.category)}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Award year</div>
                        <div className="font-medium">{current.awardYear}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Prize amount</div>
                        <div className="font-medium">{current.prizeAmount ? `${current.prizeAmount} SEK` : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Prize amount (adjusted)</div>
                        <div className="font-medium">{current.prizeAmountAdjusted ? `${current.prizeAmountAdjusted} SEK` : "—"}</div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showRaw && current && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="rounded-xl p-4 border">
                        <div className="flex items-center justify-between">
                          <div className="text-sm opacity-70">Raw JSON (selected prize)</div>
                          <div className="text-xs opacity-60">Response</div>
                        </div>
                        <div className="mt-3 text-xs overflow-auto" style={{ maxHeight: 300 }}>
                          <pre className="whitespace-pre-wrap text-xs">{prettyJSON(current)}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/20 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Quick actions</div>
            <div className="text-xs opacity-60">Utilities</div>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={copyEndpoint}><Copy className="mr-2" /> Copy endpoint</Button>
            <Button variant="outline" onClick={downloadCurrentJSON}><Download className="mr-2" /> Download JSON</Button>
            <Button variant="outline" onClick={() => window.open("https://api.nobelprize.org/2.1/documentation", "_blank")}><Globe className="mr-2" /> API docs</Button>
            <Button variant="outline" onClick={() => setShowRaw(s => !s)}><List className="mr-2" /> Toggle raw</Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About this dataset</div>
            <div className="text-xs opacity-60">
              Open Nobel Prize data. Results include prize metadata and laureates. Designed for easy exploration — use search suggestions to jump to a year or laureate.
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Shortcuts</div>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="ghost" onClick={() => { setQuery("Physics"); searchSuggestions("Physics"); }}>Physics</Button>
              <Button variant="ghost" onClick={() => { setQuery("2020"); searchSuggestions("2020"); }}>Year 2020</Button>
              <Button variant="ghost" onClick={() => { setQuery("Marie Curie"); searchSuggestions("Marie Curie"); }}>Marie Curie</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Laureate dialog */}
      <Dialog open={laureateDialog.open} onOpenChange={(v) => setLaureateDialog(s => ({ ...s, open: v }))}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{laureateName(laureateDialog.laureate) || "Laureate details"}</DialogTitle>
          </DialogHeader>

          <div style={{ padding: 20 }}>
            {laureateDialog.laureate ? (
              <div className="space-y-3 text-sm">
                <div><span className="opacity-60">Name</span><div className="font-medium">{laureateName(laureateDialog.laureate)}</div></div>
                <div><span className="opacity-60">Gender</span><div className="font-medium">{laureateDialog.laureate?.gender || "—"}</div></div>
                <div><span className="opacity-60">Born</span><div className="font-medium">{laureateDialog.laureate?.born?.date || laureateDialog.laureate?.birth?.date || "—"} {laureateDialog.laureate?.born?.place || laureateDialog.laureate?.birth?.place ? <span className="text-xs opacity-60"> • {laureateDialog.laureate?.born?.place || laureateDialog.laureate?.birth?.place}</span> : null}</div></div>
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
            <Button variant="outline" onClick={() => setLaureateDialog({ open: false, laureate: null })}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
