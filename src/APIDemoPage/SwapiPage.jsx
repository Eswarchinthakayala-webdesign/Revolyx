// SwapiPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  List,
  Film,
  Globe,
  Calendar,
  Users,
  Cpu,
  HelpCircle,
  X,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

/**
 * SWAPI Page
 * - Default: load people/1
 * - Search: /api/people/?search=...
 * - Suggestions dropdown
 * - Left: avatar + key meta
 * - Center: detailed fields, related resources (enriched)
 * - Right: actions (copy json, download, open API link, toggle raw, refresh)
 *
 * Notes:
 * - No local save persistence.
 * - Makes extra fetches to resolve homeworld & films for better UX.
 */

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function shortDateISO(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "—";
  }
}

/* Simple placeholder avatar (SVG) for a person name */
function PersonAvatar({ name, size = 120 }) {
  const initials = (name || "SW").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  const bg = "#0ea5e9";
  return (
    <div
      role="img"
      aria-label={name}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(79,70,229,0.08))",
        border: "1px solid rgba(255,255,255,0.03)"
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
        <rect width={size} height={size} rx="12" fill="none" />
        <text x="50%" y="54%" textAnchor="middle" fontSize={size * 0.32} fill="#0ea5e9" fontWeight="700" fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto">
          {initials}
        </text>
      </svg>
    </div>
  );
}

export default function SwapiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const BASE = "https://swapi.dev/api";
  const PEOPLE_BASE = `${BASE}/people/`;

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [current, setCurrent] = useState(null); // person object
  const [rawResp, setRawResp] = useState(null);
  const [loadingPerson, setLoadingPerson] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState(null); // for related resource viewer

  const suggestTimer = useRef(null);

  /* ---------- Fetching helpers ---------- */
  async function fetchPersonByUrl(url) {
    if (!url) return;
    setLoadingPerson(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const json = await res.json();
      // enrich person (fetch homeworld name and film titles)
      const enriched = await enrichPerson(json);
      setCurrent(enriched);
      setRawResp(json);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch person");
    } finally {
      setLoadingPerson(false);
    }
  }

  async function fetchPersonById(id) {
    if (!id) return;
    const url = PEOPLE_BASE + (id.toString().endsWith("/") ? id : `${id}/`);
    return fetchPersonByUrl(url);
  }

  async function searchPeople(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const url = `${PEOPLE_BASE}?search=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      const items = json.results || [];
      // basic items (we will enrich on selection, not for suggestion list)
      setSuggestions(items);
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
      searchPeople(v);
    }, 300);
  }

  async function enrichPerson(person) {
    // fetch homeworld name and film titles (parallel)
    const out = { ...person };
    const promises = [];

    if (person.homeworld) {
      promises.push(
        fetch(person.homeworld)
          .then((r) => r.ok ? r.json() : null)
          .then((j) => { if (j) out.homeworld_name = j.name; })
          .catch(() => {})
      );
    }

    if (Array.isArray(person.films) && person.films.length) {
      promises.push(
        Promise.all(person.films.slice(0, 8).map(f => fetch(f).then(r => r.ok ? r.json() : null).catch(() => null)))
          .then((filmsData) => {
            out.films_data = filmsData.filter(Boolean).map(f => ({ title: f.title, url: f.url }));
          })
          .catch(() => { out.films_data = []; })
      );
    } else {
      out.films_data = [];
    }

    // species, vehicles, starships counts (we won't fetch all names to keep response light)
    out.species_count = Array.isArray(person.species) ? person.species.length : 0;
    out.vehicles_count = Array.isArray(person.vehicles) ? person.vehicles.length : 0;
    out.starships_count = Array.isArray(person.starships) ? person.starships.length : 0;

    await Promise.all(promises);
    return out;
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      toast("Type a name to search, e.g. 'Luke'"); // small guidance
      return;
    }
    setLoadingSuggest(true);
    try {
      const url = `${PEOPLE_BASE}?search=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      const items = json.results || [];
      if (items.length > 0) {
        const first = items[0];
        const enriched = await enrichPerson(first);
        setCurrent(enriched);
        setRawResp(first);
        setShowSuggest(false);
        toast.success(`Loaded: ${first.name}`);
      } else {
        toast("No matching characters found");
      }
    } catch (err) {
      console.error(err);
      toast.error("Search failed");
    } finally {
      setLoadingSuggest(false);
    }
  }

  /* ---------- Actions ---------- */
  function copyJSON() {
    if (!current) return toast("No data to copy");
    navigator.clipboard.writeText(prettyJSON(current));
    toast.success("Copied JSON to clipboard");
  }

  function downloadJSON() {
    const payload = rawResp || current;
    if (!payload) return toast("Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const filename = `swapi_${(current?.name || "person").replace(/\s+/g, "_")}.json`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Downloaded JSON");
  }

  function openApiUrl() {
    if (!current?.url) {
      toast("No API URL present");
      return;
    }
    window.open(current.url, "_blank");
  }

  async function refreshCurrent() {
    if (!current) {
      toast("Nothing to refresh");
      return;
    }
    // If current has url, fetch it; else ignore
    if (current.url) {
      await fetchPersonByUrl(current.url);
      toast.success("Refreshed");
    }
  }

  function viewRelated(item) {
    // item: { type: 'film'|'homeworld'|..., url, title? }
    setDialogContent(item);
    setDialogOpen(true);
  }

  /* ---------- Initial load ---------- */
  useEffect(() => {
    // default: load people/1 (Luke Skywalker)
    fetchPersonById(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Render ---------- */
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">SWAPI — Star Wars Characters</h1>
          <p className="mt-1 text-sm opacity-70">Browse people from the Star Wars API. Search, inspect, and explore related resources.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search characters, e.g. 'Luke', 'Darth'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => fetchPersonById(1)} title="Load default (id:1)"><RefreshCw /></Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li
                key={s.url || s.name || idx}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                onClick={async () => { const enriched = await enrichPerson(s); setCurrent(enriched); setRawResp(s); setShowSuggest(false); setQuery(""); }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex-shrink-0">
                    <PersonAvatar name={s.name} size={48} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-60">{s.gender ?? "—"} • {s.birth_year ?? "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.height ? `${s.height} cm` : "—"}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* left: profile card & meta */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center gap-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <div className="text-sm font-semibold">Profile</div>
                <div className="text-xs opacity-60">Overview & quick facts</div>
              </div>
            </CardHeader>

            <CardContent>
              {loadingPerson ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No character selected — try search.</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <PersonAvatar name={current.name} size={96} />
                    <div>
                      <div className="text-lg font-semibold">{current.name}</div>
                      <div className="text-xs opacity-60">{current.birth_year ?? "birth year unknown"}</div>
                      <div className="mt-2 text-sm opacity-80">{current.gender ?? "—"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Height</div>
                      <div className="font-medium">{current.height ?? "—"} cm</div>
                    </div>
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Mass</div>
                      <div className="font-medium">{current.mass ?? "—"} kg</div>
                    </div>
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Hair</div>
                      <div className="font-medium">{current.hair_color ?? "—"}</div>
                    </div>
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Eyes</div>
                      <div className="font-medium">{current.eye_color ?? "—"}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs opacity-60">Homeworld</div>
                    <div className="font-medium">
                      {current.homeworld_name ? (
                        <button className="underline text-left" onClick={() => viewRelated({ type: "homeworld", url: current.homeworld, title: current.homeworld_name })}>
                          <Globe className="inline-block mr-2 -mt-0.5" size={14} /> {current.homeworld_name}
                        </button>
                      ) : current.homeworld ? (
                        <button className="underline text-left" onClick={() => viewRelated({ type: "homeworld", url: current.homeworld })}><Globe className="inline-block mr-2 -mt-0.5" size={14} /> View</button>
                      ) : "—"}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* quick stats */}
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="text-sm font-semibold mb-2">Counts & relations</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs opacity-60">Films</div>
                <div className="font-medium">{current?.films_data?.length ?? (current ? current.films?.length ?? 0 : "—")}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Species</div>
                <div className="font-medium">{current?.species_count ?? (current ? current.species?.length ?? 0 : "—")}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Starships</div>
                <div className="font-medium">{current?.starships_count ?? (current ? current.starships?.length ?? 0 : "—")}</div>
              </div>
            </div>
          </Card>
        </aside>

        {/* center: large details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Character Details</CardTitle>
                <div className="text-xs opacity-60">{current?.name ?? "Waiting for selection..."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={refreshCurrent}><RefreshCw className={loadingPerson ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide Raw" : "Raw"}</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingPerson ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No data — try searching above.</div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm leading-relaxed">
                    <div className="mb-3 text-base font-semibold">Overview</div>
                    <div className="text-sm opacity-80">
                      {current.name} — {current.gender ?? "unknown gender"} • Born {current.birth_year ?? "unknown"} • {current.height ? `${current.height} cm` : ""} {current.mass ? `• ${current.mass} kg` : ""}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-semibold mb-2">Profile fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* deliberately pick useful keys and show them nicely */}
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Hair Color</div>
                        <div className="font-medium">{current.hair_color ?? "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Skin Color</div>
                        <div className="font-medium">{current.skin_color ?? "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Eye Color</div>
                        <div className="font-medium">{current.eye_color ?? "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Birth Year</div>
                        <div className="font-medium">{current.birth_year ?? "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border col-span-1 sm:col-span-2">
                        <div className="text-xs opacity-60">URL</div>
                        <div className="font-medium"><a className="underline" href={current.url} target="_blank" rel="noreferrer">{current.url}</a></div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold">Films</div>
                      <div className="text-xs opacity-60">{current.films_data?.length ?? (current.films?.length ?? 0)} found</div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {current.films_data && current.films_data.length > 0 ? (
                        current.films_data.map((f) => (
                          <div key={f.url} className="p-3 rounded-md border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Film />
                              <div>
                                <div className="font-medium">{f.title}</div>
                                <div className="text-xs opacity-60">Film URL: <span className="underline">{f.url}</span></div>
                              </div>
                            </div>
                            <div>
                              <Button size="sm" variant="outline" onClick={() => viewRelated({ type: "film", url: f.url, title: f.title })}><ExternalLink /></Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm opacity-60">No film metadata available.</div>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {showRaw && rawResp && (
                      <motion.pre initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={clsx("text-xs overflow-auto p-3 rounded-md border mt-3", isDark ? "bg-black/30 border-zinc-800 text-zinc-200" : "bg-white/60 border-zinc-200 text-zinc-900")} style={{ maxHeight: 260 }}>
                        {prettyJSON(rawResp)}
                      </motion.pre>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* right: actions and developer utilities */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Quick actions</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={copyJSON}><Copy /> Copy JSON</Button>
              <Button variant="outline" onClick={downloadJSON}><Download /> Download JSON</Button>
              <Button variant="outline" onClick={openApiUrl}><ExternalLink /> Open API URL</Button>
              <Button variant="outline" onClick={() => setShowRaw(s => !s)}><List /> Toggle Raw</Button>
              <Button variant="outline" onClick={() => { setCurrent(null); setRawResp(null); toast("Cleared selection"); }}><X /> Clear</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint & tips</div>
            <div className="mt-2 space-y-2">
              <div className="text-xs p-2 rounded-md border break-words">{PEOPLE_BASE} (use <code>?search=NAME</code> or <code>/1/</code>)</div>
              <div className="text-sm mt-2 opacity-80">Click any related resource to open a quick viewer.</div>
            </div>
          </div>
        </aside>
      </main>

      {/* Dialog: show related resource (homeworld / film) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{dialogContent?.title ?? `${dialogContent?.type ?? "Resource"}`}</DialogTitle>
          </DialogHeader>

          <div style={{ minHeight: "40vh", padding: 20 }}>
            {dialogContent ? (
              <RelatedResourceViewer item={dialogContent} />
            ) : (
              <div className="p-6 text-center text-sm opacity-60">No resource selected</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">SWAPI resource</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (dialogContent?.url) window.open(dialogContent.url, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------- RelatedResourceViewer ----------------- */
/* Small helper component that fetches the provided resource URL and renders its fields nicely */
function RelatedResourceViewer({ item }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!item?.url) return;
      setLoading(true);
      try {
        const res = await fetch(item.url);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        if (mounted) setData(json);
      } catch (err) {
        console.error(err);
        if (mounted) setData({ error: "Failed to load resource" });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [item]);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
      ) : !data ? (
        <div className="text-sm opacity-60">No data</div>
      ) : data.error ? (
        <div className="text-sm text-red-500">{data.error}</div>
      ) : (
        <>
          <div className="text-sm font-semibold">{data.name ?? data.title ?? "Resource"}</div>
          <div className="text-xs opacity-60">{shortDateISO(data.created)} • {shortDateISO(data.edited)}</div>

          <Separator />

          <ScrollArea style={{ maxHeight: 360 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.keys(data).map((k) => {
                // skip arrays of URLs (we'll show counts instead)
                const val = data[k];
                if (Array.isArray(val)) {
                  return (
                    <div key={k} className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">{k}</div>
                      <div className="font-medium">{val.length} item(s)</div>
                    </div>
                  );
                }
                if (typeof val === "object" && val !== null) {
                  return (
                    <div key={k} className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">{k}</div>
                      <div className="font-medium break-words">{JSON.stringify(val)}</div>
                    </div>
                  );
                }
                return (
                  <div key={k} className="p-3 rounded-md border">
                    <div className="text-xs opacity-60">{k}</div>
                    <div className="font-medium break-words">{String(val ?? "—")}</div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
