// src/pages/PublicApisPage.jsx
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
  List,
  Filter,
  Globe,
  Lock,
  ShieldOff,
  Grid,
  CheckCircle,
  X,
  ArrowUp,
  ArrowDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoint ---------- */
const ENDPOINT = "https://api.publicapis.org/entries";

/* ---------- Defaults ---------- */
const DEFAULT_MSG = "Search public APIs by name, description or category (e.g. weather, finance, games)";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

/* Response analysis (Public APIs):
   {
     count: number,
     entries: [
       {
         API: "Cat Facts",
         Description: "Daily cat facts",
         Auth: "",
         HTTPS: true,
         Cors: "no" | "yes" | "unknown",
         Link: "https://cat-fact.herokuapp.com",
         Category: "Animals"
       },
       ...
     ]
   }
   We'll display each entry's fields explicitly and also allow inspecting raw JSON.
*/

export default function PublicApisPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState([]); // all fetched entries
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rawResp, setRawResp] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  // filters
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [httpsOnly, setHttpsOnly] = useState(false);
  const [authFilter, setAuthFilter] = useState("Any"); // Any | No Auth | API Key | OAuth | X-Mashape | ...
  const [corsFilter, setCorsFilter] = useState("Any"); // Any | yes | no | unknown

  // pagination and sort
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  const [sortKey, setSortKey] = useState("API"); // API | Category | HTTPS
  const [sortDir, setSortDir] = useState("asc"); // asc | desc

  const [categories, setCategories] = useState([]);
  const suggestTimer = useRef(null);

  /* Fetch helpers */
// Replace the existing fetchAllEntries() with this version
async function fetchAllEntries() {
  setLoading(true);
  try {
    const res = await fetch("/api/public-apis");
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    const items = Array.isArray(json?.entries) ? json.entries : [];
    setEntries(items);
    setCount(typeof json.count === "number" ? json.count : items.length);
    setRawResp(json);

    const cats = Array.from(new Set(items.map(i => i.Category).filter(Boolean))).sort();
    setCategories(cats);
    showToast("success", `Loaded ${items.length} APIs`);
  } catch (err) {
    console.error("fetchAllEntries error:", err);
    // Friendly user toast
    showToast("error", `Could not load directory: ${err.message || "network error"}`);
    // Fallback: small curated sample so UI remains functional
    const sample = {
      count: 3,
      entries: [
        {
          API: "Cat Facts",
          Description: "Daily cat facts",
          Auth: "",
          HTTPS: true,
          Cors: "no",
          Link: "https://cat-fact.herokuapp.com",
          Category: "Animals"
        },
        {
          API: "OpenWeatherMap",
          Description: "Weather data",
          Auth: "apiKey",
          HTTPS: true,
          Cors: "yes",
          Link: "https://openweathermap.org/api",
          Category: "Weather"
        },
        {
          API: "CoinGecko",
          Description: "Cryptocurrency data",
          Auth: "",
          HTTPS: true,
          Cors: "yes",
          Link: "https://www.coingecko.com/en/api",
          Category: "Cryptocurrency"
        }
      ]
    };
    setEntries(sample.entries);
    setCount(sample.count);
    setRawResp(sample);
    const cats = Array.from(new Set(sample.entries.map(i => i.Category).filter(Boolean))).sort();
    setCategories(cats);
  } finally {
    setLoading(false);
  }
}


  // debounced search — just filters client-side (since API returns all entries)
  function onQueryChange(v) {
    setQuery(v);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      setPage(1);
    }, 250);
  }

  useEffect(() => {
    fetchAllEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Derived list after applying filters, sort, and search */
  const filtered = useMemo(() => {
    let list = entries.slice();

    // Search: look into API name, Description, Category (case-insensitive)
    if (query && query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      list = list.filter(e =>
        (e.API || "").toLowerCase().includes(q) ||
        (e.Description || "").toLowerCase().includes(q) ||
        (e.Category || "").toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== "All") {
      list = list.filter(e => (e.Category || "") === categoryFilter);
    }

    // HTTPS filter
    if (httpsOnly) {
      list = list.filter(e => Boolean(e.HTTPS));
    }

    // Auth filter
    if (authFilter && authFilter !== "Any") {
      if (authFilter === "No Auth") {
        list = list.filter(e => !e.Auth || e.Auth.trim() === "");
      } else {
        list = list.filter(e => (e.Auth || "").toLowerCase().includes(authFilter.toLowerCase()));
      }
    }

    // CORS filter
    if (corsFilter && corsFilter !== "Any") {
      list = list.filter(e => ((e.Cors || "").toLowerCase() === corsFilter.toLowerCase()));
    }

    // Sort
    list.sort((a, b) => {
      const A = (a[sortKey] || "").toString().toLowerCase();
      const B = (b[sortKey] || "").toString().toLowerCase();
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [entries, query, categoryFilter, httpsOnly, authFilter, corsFilter, sortKey, sortDir]);

  // pagination slice
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* Developer helpers */
  function copyEndpoint() {
    navigator.clipboard.writeText(ENDPOINT);
    showToast("success", "Endpoint copied");
  }
  function downloadJSON() {
    if (!rawResp && entries.length === 0) {
      showToast("info", "No data to download");
      return;
    }
    const payload = rawResp || { count: entries.length, entries };
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `public-apis_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // small UI for showing details in a dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState(null);

  function openDetail(e) {
    setDetailEntry(e);
    setDetailOpen(true);
  }

  /* ---------- Render ---------- */
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Public APIs — Directory</h1>
          <p className="mt-1 text-sm opacity-70">Browse thousands of free public APIs. Filter by category, auth, HTTPS and CORS.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search APIs by name, description or category..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => {}}
            />
            <Button type="submit" variant="outline" className="px-3">Search</Button>
          </form>
        </div>
      </header>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Center: results */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">API Results</CardTitle>
                <div className="text-xs opacity-60">{filtered.length} results • {count ?? entries.length} total in directory</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { setQuery(""); setCategoryFilter("All"); setHttpsOnly(false); setAuthFilter("Any"); setCorsFilter("Any"); setPage(1); }}>{/* reset */}Reset</Button>
                <Button variant="outline" onClick={() => copyEndpoint()}><Copy /> Copy Endpoint</Button>
                <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download</Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide Raw" : "Show Raw"}</Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Controls strip */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 justify-between mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xs opacity-70 mr-2 hidden md:block">Filters:</div>

                  <div className={clsx("inline-flex items-center gap-2 px-3 py-1 rounded-lg border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <Filter className="opacity-70" />
                    <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="bg-transparent outline-none text-sm">
                      <option value="All">All categories</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className={clsx("inline-flex items-center gap-2 px-3 py-1 rounded-lg border cursor-pointer", isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200")} onClick={() => { setHttpsOnly(v => !v); setPage(1); }}>
                    <Globe className="opacity-70" />
                    <div className="text-sm">{httpsOnly ? "HTTPS only" : "Any protocol"}</div>
                  </div>

                  <div className={clsx("inline-flex items-center gap-2 px-3 py-1 rounded-lg border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <Lock className="opacity-70" />
                    <select value={authFilter} onChange={(e) => { setAuthFilter(e.target.value); setPage(1); }} className="bg-transparent outline-none text-sm">
                      <option value="Any">Any Auth</option>
                      <option value="No Auth">No Auth</option>
                      <option value="apiKey">API Key</option>
                      <option value="OAuth">OAuth</option>
                    </select>
                  </div>

                  <div className={clsx("inline-flex items-center gap-2 px-3 py-1 rounded-lg border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <ShieldOff className="opacity-70" />
                    <select value={corsFilter} onChange={(e) => { setCorsFilter(e.target.value); setPage(1); }} className="bg-transparent outline-none text-sm">
                      <option value="Any">Any CORS</option>
                      <option value="yes">CORS: yes</option>
                      <option value="no">CORS: no</option>
                      <option value="unknown">CORS: unknown</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs opacity-60 mr-2 hidden md:block">Sort</div>
                  <Button variant="ghost" onClick={() => toggleSort("API")}>
                    API {sortKey === "API" ? (sortDir === "asc" ? <ArrowUp /> : <ArrowDown />) : null}
                  </Button>
                  <Button variant="ghost" onClick={() => toggleSort("Category")}>
                    Category {sortKey === "Category" ? (sortDir === "asc" ? <ArrowUp /> : <ArrowDown />) : null}
                  </Button>
                  <Button variant="ghost" onClick={() => toggleSort("HTTPS")}>
                    HTTPS {sortKey === "HTTPS" ? (sortDir === "asc" ? <ArrowUp /> : <ArrowDown />) : null}
                  </Button>
                </div>
              </div>

              {/* Grid of api cards */}
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : pageSlice.length === 0 ? (
                <div className="py-12 text-center text-sm opacity-60">No APIs match your filters/search.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pageSlice.map((e, idx) => (
                    <article key={(e.API || "") + idx} className={clsx("p-4 rounded-xl border hover:shadow-lg transition-shadow cursor-pointer", isDark ? "bg-black/20 border-zinc-800" : "bg-white/80 border-zinc-200")} onClick={() => openDetail(e)}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{e.API}</h3>
                            <div className="text-xs opacity-60">{e.Category}</div>
                          </div>
                          <p className="text-sm mt-2 leading-relaxed opacity-80">{e.Description}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs opacity-60">
                        <div className="inline-flex items-center gap-3">
                          <div className="inline-flex items-center gap-1">
                            {e.HTTPS ? <CheckCircle /> : <X />} <span>{e.HTTPS ? "HTTPS" : "HTTP"}</span>
                          </div>
                          <div>{e.Auth ? e.Auth : "No Auth"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={e.Link} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()} className="text-xs underline flex items-center gap-1"><ExternalLink /> Visit</a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm opacity-60">Page {page} of {totalPages}</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
                  <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                  <Button variant="outline" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</Button>
                </div>
              </div>

              {/* Raw JSON */}
              <AnimatePresence>
                {showRaw && rawResp && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("mt-4 p-4 rounded-lg border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 360 }}>
                      {prettyJSON(rawResp)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* Right: meta, quick filter shortcuts & developer */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Directory</div>
              <div className="text-xs opacity-60">API metadata</div>
            </div>

            <div className="text-sm opacity-60 mb-3">The Public APIs directory contains categorized, free-to-use APIs. Each entry includes its auth model, whether HTTPS is supported, and a CORS indicator. Click any card for full details.</div>

            <div className="grid grid-cols-1 gap-2">
              <div className="p-3 rounded-md border flex items-center gap-3">
                <Globe /> <div><div className="text-xs opacity-60">Total entries</div><div className="font-medium">{entries.length}</div></div>
              </div>
              <div className="p-3 rounded-md border flex items-center gap-3">
                <Filter /> <div><div className="text-xs opacity-60">Categories</div><div className="font-medium">{categories.length}</div></div>
              </div>
              <div className="p-3 rounded-md border flex items-center gap-3">
                <Lock /> <div><div className="text-xs opacity-60">HTTPS available</div><div className="font-medium">{entries.filter(e => e.HTTPS).length}</div></div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60 mb-3">Endpoint & debugging tools</div>

            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => copyEndpoint()}><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button variant="ghost" onClick={() => window.location.reload()}><Loader2 /> Refresh</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{detailEntry?.API ?? "API Detail"}</DialogTitle>
          </DialogHeader>

          <div className="p-6">
            {!detailEntry ? (
              <div className="text-sm opacity-60">No detail selected.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{detailEntry.API}</h3>
                    <div className="text-sm opacity-60">{detailEntry.Category} • {detailEntry.Auth ? detailEntry.Auth : "No Auth"}</div>
                    <p className="mt-3 text-sm leading-relaxed">{detailEntry.Description}</p>
                  </div>

                  <div className="w-36 flex flex-col gap-2">
                    <div className="text-xs opacity-60">HTTPS</div>
                    <div className="font-medium">{detailEntry.HTTPS ? "Yes" : "No"}</div>

                    <div className="text-xs opacity-60 mt-2">CORS</div>
                    <div className="font-medium">{detailEntry.Cors}</div>

                    <div className="text-xs opacity-60 mt-2">Link</div>
                    <a href={detailEntry.Link} target="_blank" rel="noreferrer" className="text-sm underline flex items-center gap-1"><ExternalLink /> Open</a>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-xs opacity-60">Full entry (fields)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {Object.entries(detailEntry).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">{k}</div>
                        <div className="text-sm font-medium break-words">{typeof v === "object" ? JSON.stringify(v) : (v ?? "—")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Data from api.publicapis.org</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDetailOpen(false)}><X /> Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
