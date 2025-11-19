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
  List
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

/**
 * UniversitiesPage
 * - Fetches world universities JSON from GitHub raw endpoint
 * - Search by name / country / domain (client-side filter after initial fetch)
 * - Shows suggestions while typing
 * - Layout: left (search + shortlist), center (details), right (quick actions)
 *
 * Endpoint:
 * https://raw.githubusercontent.com/Hipo/university-domains-list/refs/heads/master/world_universities_and_domains.json
 */

const ENDPOINT =
  "https://raw.githubusercontent.com/Hipo/university-domains-list/refs/heads/master/world_universities_and_domains.json";
const DEFAULT_MSG = "Search universities by name, country, or domain (e.g., 'India', 'Harvard', 'edu')";

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

  // search/suggest
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestTimer = useRef(null);

  // selection / UI
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false); // optional dialog for more links/details
  const [rawOpen, setRawOpen] = useState(false);

  // initial load
  useEffect(() => {
    async function fetchAll() {
      setLoadingAll(true);
      setErrorAll(null);
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
        const json = await res.json();
        // JSON is expected to be an array of objects
        setAllUnis(Array.isArray(json) ? json : []);
        // Set a default sample (first found or find a known one)
        const defaultUni = Array.isArray(json) && json.length > 0 ? json[0] : null;
        setSelected(defaultUni);
      } catch (err) {
        console.error(err);
        setErrorAll(err?.message || "Failed to load universities");
        showToast("error", "Failed to load universities list");
      } finally {
        setLoadingAll(false);
      }
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // client-side suggestion (simple, fast)
  function doSuggest(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    const needle = q.trim().toLowerCase();
    // search name, country, domains
    const matches = allUnis.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const country = (u.country || "").toLowerCase();
      const domains = (u.domains || []).join(" ").toLowerCase();
      return name.includes(needle) || country.includes(needle) || domains.includes(needle);
    });
    // return top 30 matches
    setTimeout(() => {
      setSuggestions(matches.slice(0, 30));
      setLoadingSuggest(false);
    }, 150); // small simulated processing delay for smoother UI
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => doSuggest(v), 350);
  }

  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", DEFAULT_MSG);
      return;
    }
    // pick first suggestion or try to filter
    if (suggestions.length > 0) {
      setSelected(suggestions[0]);
      setShowSuggest(false);
      showToast("success", `Selected: ${suggestions[0].name}`);
      return;
    }
    // fallback: attempt search synchronously
    const needle = query.trim().toLowerCase();
    const found = allUnis.find((u) => {
      const name = (u.name || "").toLowerCase();
      const country = (u.country || "").toLowerCase();
      const domains = (u.domains || []).join(" ").toLowerCase();
      return name.includes(needle) || country.includes(needle) || domains.includes(needle);
    });
    if (found) {
      setSelected(found);
      setShowSuggest(false);
      showToast("success", `Selected: ${found.name}`);
    } else {
      showToast("info", "No matching university found. Try different keywords.");
    }
  }

  function copyJSON() {
    if (!selected) return showToast("info", "No university selected");
    navigator.clipboard.writeText(prettyJSON(selected));
    showToast("success", "University JSON copied");
  }

  function downloadJSON() {
    if (!selected) return showToast("info", "No university selected");
    const blob = new Blob([prettyJSON(selected)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(selected.name || "university").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  // simple extractor with safe fallbacks
  function renderField(label, value) {
    return (
      <div className="mb-3">
        <div className="text-xs opacity-60">{label}</div>
        <div className="text-sm font-medium break-words">{value ?? "—"}</div>
      </div>
    );
  }

  const containerBg = isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200";
  const panelBg = isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200";
  const headerBg = isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200";

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>World Universities</h1>
          <p className="mt-1 text-sm opacity-70">Search global universities by name, country or domain. Clean, professional listing and detail view.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search universities, e.g. 'Harvard', 'India', 'edu'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); }}>
              Clear
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            <ScrollArea style={{ maxHeight: 320 }}>
              {suggestions.map((s, idx) => (
                <li
                  key={`${s.name}-${idx}`}
                  className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer"
                  onClick={() => { setSelected(s); setShowSuggest(false); setQuery(s.name); }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md flex items-center justify-center bg-gradient-to-tr from-slate-200 to-white dark:from-zinc-800 dark:to-zinc-700">
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

      {/* Layout: left | center | right */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Shortlist / quick search history / small list */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", containerBg)}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", headerBg)}>
              <div>
                <CardTitle className="text-sm">Quick List</CardTitle>
                <div className="text-xs opacity-60">Top matches & recent results</div>
              </div>
              <div className="text-xs opacity-60">{allUnis.length ? `${allUnis.length.toLocaleString()} universities` : ""}</div>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                {loadingAll ? (
                  <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                ) : errorAll ? (
                  <div className="py-6 text-sm text-red-500">{errorAll}</div>
                ) : (
                  <ScrollArea style={{ maxHeight: 420 }}>
                    <ul className="space-y-1">
                      {/* Small shortlist: first 12 or current suggestions */}
                      {(suggestions.length ? suggestions.slice(0, 12) : allUnis.slice(0, 12)).map((u, i) => (
                        <li key={`${u.name}-${i}`}>
                          <button
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/40 flex items-center gap-3"
                            onClick={() => { setSelected(u); setQuery(u.name); setShowSuggest(false); }}
                          >
                            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-slate-100 dark:bg-zinc-800">
                              <Building className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{u.name}</div>
                              <div className="text-xs opacity-60 truncate">{u.country} • {u.domains?.[0] ?? "—"}</div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border p-4", containerBg)}>
            <div className="text-sm font-semibold mb-1">Search tips</div>
            <div className="text-xs opacity-60">
              Try queries like <span className="font-medium">"United Kingdom"</span>, <span className="font-medium">"Harvard"</span>, or domain fragments like <span className="font-medium">"edu"</span>.
            </div>

            <Separator className="my-3" />

            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => { setQuery("United States"); doSuggest("United States"); setShowSuggest(true); }}>Top: United States</Button>
              <Button variant="outline" className="w-full" onClick={() => { setQuery("India"); doSuggest("India"); setShowSuggest(true); }}>Top: India</Button>
              <Button variant="outline" className="w-full" onClick={() => { setQuery("United Kingdom"); doSuggest("United Kingdom"); setShowSuggest(true); }}>Top: UK</Button>
            </div>
          </Card>
        </aside>

        {/* Center: Large detail view */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", containerBg)}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", headerBg)}>
              <div>
                <CardTitle className="text-lg">University</CardTitle>
                <div className="text-xs opacity-60">{selected?.name ?? "Select a university from the list or search above"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setRawOpen((s) => !s)}><List /> {rawOpen ? "Hide" : "Raw"}</Button>
                <Button variant="outline" onClick={() => copyJSON()}><Copy /></Button>
                <Button variant="outline" onClick={() => downloadJSON()}><Download /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {selected ? (
                <div className="space-y-6">
                  {/* Title + meta */}
                  <div className="rounded-xl p-4 border " /* inner subtle panel */>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-lg flex items-center justify-center bg-gradient-to-tr from-slate-100 to-white dark:from-zinc-800 dark:to-zinc-700">
                          <Building className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold leading-tight">{selected.name}</div>
                          <div className="text-sm opacity-60 mt-1">{selected.country} • {selected["alpha_two_code"] ?? "—"}</div>
                        </div>
                      </div>

                      <div className="ml-auto text-sm flex items-center gap-3">
                        <div className="flex items-center gap-2 opacity-80">
                          <MapPin className="w-4 h-4" />
                          <div className="text-xs">{selected["state-province"] ?? "—"}</div>
                        </div>
                        <div className="flex items-center gap-2 opacity-80">
                          <Globe className="w-4 h-4" />
                          <div className="text-xs">{(selected.domains && selected.domains[0]) ?? "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Domains & web pages */}
                  <div className={clsx("p-4 rounded-xl border", panelBg)}>
                    <div className="text-sm font-semibold mb-2">Web & Domains</div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="text-xs opacity-60">Domains</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(selected.domains || []).length ? (
                            (selected.domains || []).map((d, i) => (
                              <a key={d + i} href={`https://${d}`} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-md border text-sm inline-flex items-center gap-2 hover:underline">
                                <Globe className="w-4 h-4" /> <span className="truncate max-w-[10rem]">{d}</span>
                              </a>
                            ))
                          ) : (
                            <div className="text-sm opacity-60">No domains</div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="text-xs opacity-60">Web pages</div>
                        <div className="mt-2 flex flex-col gap-2">
                          {(selected.web_pages || []).length ? (
                            (selected.web_pages || []).map((p, i) => (
                              <a key={p + i} href={p} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-md border hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-sm inline-flex items-center justify-between">
                                <span className="truncate">{p}</span>
                                <ExternalLink className="w-4 h-4 ml-3" />
                              </a>
                            ))
                          ) : (
                            <div className="text-sm opacity-60">No web pages</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fields / full object (responsive grid) */}
                  <div className={clsx("p-4 rounded-xl border", panelBg)}>
                    <div className="text-sm font-semibold mb-3">Details</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {renderField("Name", selected.name)}
                      {renderField("Country", selected.country)}
                      {renderField("Alpha-2 Code", selected["alpha_two_code"])}
                      {renderField("State / Province", selected["state-province"] ?? "—")}
                      {renderField("Domains", (selected.domains || []).join(", ") || "—")}
                      {renderField("Web Pages", (selected.web_pages || []).join(", ") || "—")}
                    </div>
                  </div>

                  {/* Raw JSON toggle */}
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
                <div className="py-20 text-center text-sm opacity-60">No university selected — try searching or pick from the left list.</div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: Quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", containerBg)}>
          <div>
            <div className="text-sm font-semibold mb-2">Actions</div>
            <div className="text-xs opacity-60 mb-3">Quick actions for the selected university</div>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => selected ? window.open(selected.web_pages?.[0] || selected.domains?.[0], "_blank") : showToast("info", "No university selected")}>
                <ExternalLink /> Visit primary site
              </Button>
              <Button className="w-full" variant="outline" onClick={() => copyJSON()}><Copy /> Copy JSON</Button>
              <Button className="w-full" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button className="w-full" variant="ghost" onClick={() => { setSelected(null); setQuery(""); setSuggestions([]); }}>
                <X /> Clear selection
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About this dataset</div>
            <div className="text-xs opacity-60">
              This view consumes the public <span className="font-medium">Hipo / university-domains-list</span> dataset (JSON). Fields shown adapt to the actual response for each entry.
            </div>
            <div className="mt-3 text-xs opacity-60 flex items-center gap-2">
              <Globe className="w-4 h-4" /> <a className="underline" href={ENDPOINT} target="_blank" rel="noreferrer">Source JSON</a>
            </div>
          </div>
        </aside>
      </main>

      {/* Details dialog (optional extended view) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selected?.name || "Details"}</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "60vh", overflow: "auto" }} className="p-4">
            <pre className="text-xs">{selected ? prettyJSON(selected) : "No item"}</pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Dataset entry</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
