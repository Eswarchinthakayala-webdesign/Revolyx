// src/pages/UniversitiesPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  MapPin,
  Globe,
  Building,
  X,
  Loader2,
  List,
  Menu,
  RefreshCw,
  Check,
  FileText,
  Info,
  Users,
  Link as LinkIcon,
  Eye
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";

/**
 * Improved UniversitiesPage
 * - Paste into src/pages/UniversitiesPage.jsx
 * - Requires: framer-motion + lucide-react + your existing ui components (Sheet, ScrollArea, Badge, Card, etc.)
 */

const ENDPOINT =
  "https://raw.githubusercontent.com/Hipo/university-domains-list/refs/heads/master/world_universities_and_domains.json";

const DEFAULT_PLACEHOLDER = "Search by name, country, domain or type a 1-based index (e.g. '12')";

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

export default function UniversitiesPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // data
  const [allUnis, setAllUnis] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [errorAll, setErrorAll] = useState(null);

  // suggestions/search
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestTimer = useRef(null);

  // UI / selection
  const [selected, setSelected] = useState(null);
  const [rawOpen, setRawOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [randomList, setRandomList] = useState([]);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [iframeOpen, setIframeOpen] = useState(false);
  const inputRef = useRef(null);

  // theme-driven classes
  const containerBg = isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200";
  const panelBg = isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200";
  const headerBg = isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200";
  const glassBadge = isDark
    ? "bg-white/6 backdrop-blur-sm border border-white/6 text-zinc-100"
    : "bg-white/60 backdrop-blur-sm border border-zinc-100 text-zinc-800";

  // ---------- fetch all universities ----------
  useEffect(() => {
    async function fetchAll() {
      setLoadingAll(true);
      setErrorAll(null);
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
        const json = await res.json();
        const arr = Array.isArray(json) ? json : [];
        setAllUnis(arr);
        setSelected(arr[0] ?? null);
        generateRandomList(arr);
      } catch (err) {
        console.error(err);
        setErrorAll(err?.message || "Failed to load data");
        showToast("error", "Failed to load universities list");
      } finally {
        setLoadingAll(false);
      }
    }
    fetchAll();
  }, []);

  // generate 10 random picks (safe)
  function generateRandomList(pool = allUnis) {
    if (!Array.isArray(pool) || pool.length === 0) return setRandomList([]);
    const count = Math.min(10, pool.length);
    const ids = new Set();
    while (ids.size < count) ids.add(Math.floor(Math.random() * pool.length));
    setRandomList(Array.from(ids).map((i) => pool[i]));
  }

  // ---------- suggestions (client-side) ----------
  function doSuggest(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    const needle = q.trim().toLowerCase();

    // numeric => interpret as 1-based index
    if (/^\d+$/.test(needle) && allUnis.length) {
      const idx = parseInt(needle, 10) - 1;
      if (idx >= 0 && idx < allUnis.length) {
        setTimeout(() => {
          setSuggestions([allUnis[idx]]);
          setLoadingSuggest(false);
        }, 80);
        return;
      }
    }

    // search by name/country/domain/code
    const matches = allUnis.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const country = (u.country || "").toLowerCase();
      const domains = (u.domains || []).join(" ").toLowerCase();
      const code = (u.alpha_two_code || "").toLowerCase();
      return (
        name.includes(needle) ||
        country.includes(needle) ||
        domains.includes(needle) ||
        code.includes(needle)
      );
    });

    setTimeout(() => {
      setSuggestions(matches.slice(0, 40));
      setLoadingSuggest(false);
    }, 120);
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => doSuggest(v), 250);
  }

  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", DEFAULT_PLACEHOLDER);
      return;
    }
    if (suggestions.length > 0) {
      setSelected(suggestions[0]);
      setShowSuggest(false);
      showToast("success", `Selected: ${suggestions[0].name}`);
      return;
    }
    showToast("info", "No matches found");
  }

  // ---------- copy / download ----------
  async function copyJSON() {
    const payload = selected;
    if (!payload) return showToast("info", "No item selected");
    try {
      await navigator.clipboard.writeText(prettyJSON(payload));
      setCopied(true);
      showToast("success", "Copied JSON to clipboard");
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error(err);
      showToast("error", "Copy failed");
    }
  }

  function downloadJSON() {
    if (!selected) return showToast("info", "No item selected");
    const blob = new Blob([prettyJSON(selected)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(selected.name || "university").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Download started");
  }

  function renderField(label, value) {
    return (
      <div className="mb-3">
        <div className="text-xs opacity-60">{label}</div>
        <div className="text-sm font-medium break-words">{value ?? "—"}</div>
      </div>
    );
  }

  const highlightClass = (u) =>
    selected && u && selected.name === u.name
      ? "bg-zinc-100 dark:bg-zinc-800 border-l-4 border-zinc-500 dark:border-zinc-400"
      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40";

  // derive an iframe src for preview
  function getIframeSrc(item) {
    if (!item) return null;
    // prefer primary web_page then first domain
    const wp = item.web_pages?.[0];
    if (wp && (wp.startsWith("http://") || wp.startsWith("https://"))) return wp;
    if (item.domains?.[0]) return `https://${item.domains[0]}`;
    return null;
  }

  return (
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" className="p-2 rounded-md cursor-pointer"><Menu /></Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-full max-w-xs p-3">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold flex items-center gap-2"><Users /> Universities</div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => generateRandomList()} className="cursor-pointer"><RefreshCw /></Button>

                  </div>
                </div>

                <ScrollArea style={{ height: 520 }}>
                  <div className="space-y-2">
                    {randomList.map((r) => (
                      <div
                        key={r.name + (r.domains?.[0] || "")}
                        onClick={() => { setSelected(r); setMobileSheetOpen(false); setQuery(r.name); }}
                        className={clsx("p-2 rounded-md flex items-center gap-3 cursor-pointer transition", highlightClass(r))}
                      >
                       
                        <div className="min-w-0">
                          <div className="font-medium ">{r.name}</div>
                          <div className="text-xs opacity-60 ">{r.country} • {r.domains?.[0] ?? "—"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">World Universities</h1>
            <div className="text-xs opacity-70">Search global universities — name, country, domain, or index.</div>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className={clsx("relative w-full md:w-[640px] rounded-lg px-3 py-2 flex items-center gap-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
          <Search className="opacity-60" />
          <Input
            ref={inputRef}
            placeholder={DEFAULT_PLACEHOLDER}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setShowSuggest(true)}
            className="border-0 bg-transparent outline-none shadow-none"
            aria-label="Search universities"
          />
          <Button type="button" variant="ghost" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); }} className="cursor-pointer">Clear</Button>
          <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>

        </form>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-2xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            <ScrollArea className="overflow-y-auto" style={{ maxHeight: 320 }}>
              {suggestions.map((s, idx) => (
                <li
                  key={`${s.name}-${idx}`}
                  className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                  onClick={() => { setSelected(s); setShowSuggest(false); setQuery(s.name); }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md flex items-center justify-center bg-gradient-to-tr from-slate-100 to-white dark:from-zinc-800 dark:to-zinc-700">
                      <Building className="w-5 h-5 opacity-80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{s.name}</div>
                      <div className="text-xs opacity-60 truncate">{s.country} • {s.alpha_two_code || "—"}</div>
                    </div>
                    <div className="text-xs opacity-60">{s.domains?.[0] ?? "—"}</div>
                  </div>
                </li>
              ))}
            </ScrollArea>
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Desktop sidebar (random 10) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", containerBg)}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", headerBg)}>
              <div className="flex items-center gap-2">
                <div className={clsx("rounded-md p-2", glassBadge)}><Users className="w-4 h-4" /></div>
                <div>
                  <CardTitle className="text-sm">Random Picks</CardTitle>
                  <div className="text-xs opacity-60">10 quick selections</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => generateRandomList()} className="cursor-pointer"><RefreshCw /></Button>
              </div>
            </CardHeader>

            <CardContent>
              <ScrollArea className="overflow-y-auto" style={{ maxHeight: 520 }}>
                <div className="space-y-2">
                  {loadingAll ? (
                    <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                  ) : errorAll ? (
                    <div className="py-6 text-sm text-red-500">{errorAll}</div>
                  ) : (
                    randomList.map((r) => (
                      <div
                        key={r.name + (r.domains?.[0] || "")}
                        onClick={() => { setSelected(r); setQuery(r.name); }}
                        className={clsx("p-3 rounded-md flex items-center gap-3 cursor-pointer transition", highlightClass(r))}
                      >
                        
                        <div className="min-w-0">
                          <div className="font-medium ">{r.name}</div>
                          <div className="text-xs opacity-60 ">{r.country} • {r.domains?.[0] ?? "—"}</div>
                        </div>
                        <Badge className={clsx("ml-auto", glassBadge)}>#{(allUnis.indexOf(r) + 1) || "—"}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border p-4", containerBg)}>
            <div className="text-sm font-semibold mb-2">Tips & quick filters</div>
            <div className="text-xs opacity-60 mb-3">
              Try queries like <span className="font-medium">"United Kingdom"</span>, <span className="font-medium">"Harvard"</span>, or domain fragments like <span className="font-medium">"edu"</span>. Type a number to jump to that index.
            </div>
            <Separator className="my-3" />
            <div className="space-y-2">
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => { setQuery("United States"); doSuggest("United States"); setShowSuggest(true); }}>Top: United States</Button>
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => { setQuery("India"); doSuggest("India"); setShowSuggest(true); }}>Top: India</Button>
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => { setQuery("United Kingdom"); doSuggest("United Kingdom"); setShowSuggest(true); }}>Top: UK</Button>
            </div>
          </Card>
        </aside>

        {/* Center: Detail preview */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", containerBg)}>
            <CardHeader className={clsx("p-5 flex flex-wrap gap-2 items-center justify-between", headerBg)}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Building className="w-5 h-5" /> <span>University</span></CardTitle>
                <div className="text-xs opacity-60">{selected?.name ?? "Select a university from the list or search above"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setRawOpen((s) => !s)} className="cursor-pointer"><List /> {rawOpen ? "Hide" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => { const src = getIframeSrc(selected); if (src) { setIframeOpen((s) => !s); } else showToast("info", "No web page to preview"); }} className="cursor-pointer">
                  <Eye /> Preview
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {selected ? (
                <div className="space-y-6">
                  {/* top summary */}
                  <div className={clsx("rounded-xl p-4 border", panelBg)}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-start gap-4">
                        <div className={clsx("w-20 h-20 rounded-lg flex items-center justify-center", glassBadge)}>
                          <Building className="w-8 h-8" />
                        </div>

                        <div className="min-w-0">
                          <div className="text-2xl font-bold leading-tight">{selected.name}</div>
                          <div className="text-sm opacity-60 mt-1">{selected.country} • <span className="font-medium">{selected.alpha_two_code ?? "—"}</span></div>

                          <div className="mt-3 flex items-center gap-2">
                            <span className={clsx("px-2 py-1 rounded-md text-xs font-medium", glassBadge)}><MapPin className="w-3 h-3 inline-block mr-1" />{selected["state-province"] ?? "—"}</span>
                            <a href={selected.domains?.[0] ? `https://${selected.domains[0]}` : "#"} target="_blank" rel="noreferrer" className={clsx("px-2 py-1 rounded-md text-xs font-medium", glassBadge)}>
                              <Globe className="w-3 h-3 inline-block mr-1" />{selected.domains?.[0] ?? "—"}
                            </a>
                            {selected.domains?.length > 1 && <span className={clsx("px-2 py-1 rounded-md text-xs font-medium", glassBadge)}>+{selected.domains.length - 1} domains</span>}
                          </div>
                        </div>
                      </div>

                      <div className="ml-auto text-sm flex flex-row sm:flex-col items-center  sm:items-end gap-2">
                        <div className="text-xs opacity-60">Index</div>
                        <Badge className={glassBadge}>#{allUnis.indexOf(selected) + 1}</Badge>
                        <div className="text-xs opacity-60 mt-1">Primary</div>
                        <Button size="sm" variant="ghost" onClick={() => window.open(selected.web_pages?.[0] || `https://${selected.domains?.[0]}`, "_blank")} className="cursor-pointer"><ExternalLink /> Visit</Button>
                      </div>
                    </div>
                  </div>

                  {/* Web & domains */}
                  <div className={clsx("p-4 rounded-xl border", panelBg)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4" /> Web & Domains</div>
                      <div className="text-xs opacity-60">{selected.domains?.length || 0} domains</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs opacity-60 mb-2">Domains</div>
                        <div className="flex flex-wrap gap-2">
                          {(selected.domains || []).length ? (
                            (selected.domains || []).map((d, i) => (
                              <a key={d + i} href={`https://${d}`} target="_blank" rel="noreferrer" className={clsx("px-3 py-1 rounded-md border inline-flex items-center gap-2 text-sm cursor-pointer hover:underline", glassBadge)}>
                                <Globe className="w-4 h-4" /> <span className="truncate max-w-[12rem]">{d}</span>
                              </a>
                            ))
                          ) : (
                            <div className="text-sm opacity-60">No domains</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 mb-2">Web pages</div>
                        <div className="flex flex-col gap-2">
                          {(selected.web_pages || []).length ? (
                            (selected.web_pages || []).map((p, i) => (
                              <a key={p + i} href={p} target="_blank" rel="noreferrer" className={clsx("px-3 py-2 rounded-md border hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-sm inline-flex items-center justify-between cursor-pointer", glassBadge)}>
                                <span className="truncate">{p}</span>
                                <LinkIcon className="w-4 h-4" />
                              </a>
                            ))
                          ) : (
                            <div className="text-sm opacity-60">No web pages</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className={clsx("p-4 rounded-xl border", panelBg)}>
                    <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Info className="w-4 h-4" /> Details</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {renderField("Name", selected.name)}
                      {renderField("Country", selected.country)}
                      {renderField("Alpha-2 Code", selected.alpha_two_code)}
                      {renderField("State / Province", selected["state-province"] ?? "—")}
                      {renderField("Domains", (selected.domains || []).join(", ") || "—")}
                      {renderField("Web Pages", (selected.web_pages || []).join(", ") || "—")}
                    </div>
                  </div>

                  {/* Iframe preview */}
                  <AnimatePresence>
                    {iframeOpen && getIframeSrc(selected) && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                        <div className={clsx("p-0 rounded-xl border overflow-hidden", panelBg)}>
                          <div className="flex items-center justify-between p-3 border-b">
                            <div className="text-sm font-semibold flex items-center gap-2"><Eye className="w-4 h-4" /> Site Preview</div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setIframeOpen(false)} className="cursor-pointer"><X /></Button>
                            </div>
                          </div>
                          <div style={{ height: 360 }} className="bg-white">
                            <iframe
                              title={`preview-${selected.name}`}
                              src={getIframeSrc(selected)}
                              style={{ width: "100%", height: "100%", border: 0 }}
                              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* raw JSON */}
                  <AnimatePresence>
                    {rawOpen && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                        <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                          <div className="text-xs opacity-60 mb-2">Raw JSON</div>
                          <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 320 }}>
                            {prettyJSON(selected)}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="py-20 text-center text-sm opacity-60">No university selected — try searching or pick from the list.</div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: Actions + info */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", containerBg)}>
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><List className="w-4 h-4" /> Actions</div>
            <div className="text-xs opacity-60 mb-3">Quick actions for the selected university</div>
            <div className="space-y-2">
              <Button className="w-full cursor-pointer" onClick={() => selected ? window.open(selected.web_pages?.[0] || `https://${selected.domains?.[0]}`, "_blank") : showToast("info", "No university selected")}>
                <ExternalLink /> Visit primary site
              </Button>
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => copyJSON()}><Copy /> Copy JSON</Button>
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button className="w-full cursor-pointer" variant="ghost" onClick={() => { setSelected(null); setQuery(""); setSuggestions([]); }}>
                <X /> Clear selection
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About this dataset</div>
            <div className="text-xs opacity-60">
              This view uses the <span className="font-medium">Hipo / university-domains-list</span> dataset (public JSON). Fields adapt to each entry.
            </div>
            <div className="mt-3 text-xs opacity-60 flex items-center gap-2">
              <Globe className="w-4 h-4" /> <a className="underline" href={ENDPOINT} target="_blank" rel="noreferrer">Source JSON</a>
            </div>
          </div>
        </aside>
      </main>

      {/* Dialog for raw details (optional) */}
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent />
      </Dialog>
    </div>
  );
}
