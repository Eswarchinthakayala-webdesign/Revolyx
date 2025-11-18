// src/pages/OpenDotaPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Copy,
  Download,
  ImageIcon,
  Loader2,
  List,
  Menu,
  Share2,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* -------------------- Endpoint -------------------- */
const ENDPOINT = "https://api.opendota.com/api/heroStats";

/* -------------------- Helpers -------------------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function pluralize(n, s) {
  return `${n} ${s}${n === 1 ? "" : "s"}`;
}

export default function OpenDotaPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const suggestTimer = useRef(null);
  const searchInputRef = useRef(null);

  /* Fetch hero stats on mount */
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
        const json = await res.json();
        if (!mounted) return;
        setHeroes(json || []);
        setRawResp(json);
        if (Array.isArray(json) && json.length > 0) {
          setSelected(json[0]);
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to fetch hero stats");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  /* Suggestion search (client-side filtering) */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      runSuggest(v);
    }, 250);
  }

  async function runSuggest(q) {
    setLoadingSuggest(true);
    try {
      if (!q || q.trim() === "") {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const qlow = q.trim().toLowerCase();
      // If heroes already loaded, filter client-side for snappy suggestions
      if (heroes && heroes.length > 0) {
        const filtered = heroes.filter(h =>
          (h.localized_name || "").toLowerCase().includes(qlow) ||
          (h.name || "").toLowerCase().includes(qlow)
        ).slice(0, 12);
        setSuggestions(filtered);
        setLoadingSuggest(false);
        return;
      }
      // fallback: fetch endpoint
      const res = await fetch(ENDPOINT);
      const json = await res.json();
      setHeroes(json || []);
      const filtered = (json || []).filter(h =>
        (h.localized_name || "").toLowerCase().includes(qlow) ||
        (h.name || "").toLowerCase().includes(qlow)
      ).slice(0, 12);
      setSuggestions(filtered);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  function handleSelectHero(hero) {
    setSelected(hero);
    setShowSuggest(false);
    setQuery(hero.localized_name || hero.name || "");
    // Scroll to top of details if needed
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCopyJSON() {
    if (!selected) return showToast("info", "No hero selected");
    navigator.clipboard.writeText(prettyJSON(selected));
    showToast("success", "Hero JSON copied to clipboard");
  }

  function handleDownloadJSON() {
    const payload = selected || rawResp;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `opendota_hero_${(selected?.localized_name || "heroes").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function openExternalHeroPage(hero) {
    // Try to link to OpenDota hero page by name; fallback to API link
    if (!hero) return;
    const localized = hero.localized_name?.toLowerCase().replace(/\s+/g, "-");
    if (localized) {
      window.open(`https://www.opendota.com/heroes/${localized}`, "_blank");
    } else if (hero.id) {
      window.open(`https://api.opendota.com/api/heroes/${hero.id}`, "_blank");
    } else {
      window.open(ENDPOINT, "_blank");
    }
  }

  /* Derived lists */
  const roles = useMemo(() => {
    const set = new Set();
    (heroes || []).forEach(h => (h.roles || []).forEach(r => set.add(r)));
    return Array.from(set);
  }, [heroes]);

  /* small helper to render stat row */
  function StatRow({ label, value, suffix }) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs opacity-70">{label}</div>
        <div className="text-sm font-medium">{value}{suffix ? <span className="text-xs opacity-60 ml-1">{suffix}</span> : null}</div>
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>OpenDota — Hero Explorer</h1>
          <p className="mt-1 text-sm opacity-70">Browse hero stats, compare numeric attributes, and inspect the API response.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={(e)=>{e.preventDefault(); setShowSuggest(true); runSuggest(query);}} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              ref={searchInputRef}
              placeholder="Search heroes, e.g. 'Anti-Mage', 'Invoker'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {!loadingSuggest && suggestions.map((s) => (
              <li key={s.id || s.name} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => handleSelectHero(s)}>
                <div className="flex items-center gap-3">
            <img src={`https://cdn.cloudflare.steamstatic.com${s.img}`} alt={s.localized_name} className="w-12 h-8 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="font-medium">{s.localized_name}</div>
                    <div className="text-xs opacity-60">{s.primary_attr?.toUpperCase?.() ?? "-" } • {s.attack_type ?? "-"}</div>
                  </div>
                  <div className="text-xs opacity-60">{(s.roles || []).join(", ")}</div>
                </div>
              </li>
            ))}
            {!loadingSuggest && suggestions.length === 0 && <li className="p-3 text-sm opacity-60">No matches</li>}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout - Left + Center + Right */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: quick list of heroes (compact) */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-3 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Heroes</div>
            <div className="text-xs opacity-60">{pluralize(heroes?.length || 0, "heroes")}</div>
          </div>

          <ScrollArea className="h-[66vh]">
            <div className="grid grid-cols-1 gap-2 p-3">
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : (heroes || []).slice(0, 60).map(h => (
                <button
                  key={h.id}
                  onClick={() => handleSelectHero(h)}
                  className={clsx("flex cursor-pointer items-center gap-3 w-full text-left p-2 rounded-lg transition", selected?.id === h.id ? "ring-2 ring-zinc-500/30" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50")}
                >
                  <img src={`https://cdn.cloudflare.steamstatic.com${h.icon}`}  alt={h.localized_name} className="w-10 h-6 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{h.localized_name}</div>
                    <div className="text-xs opacity-60">{h.primary_attr?.toUpperCase?.()} • {h.attack_type}</div>
                  </div>
                  <div className="text-xs opacity-60 hidden sm:block">{(h.roles || []).slice(0,2).join(", ")}</div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Center: detailed hero view */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-start gap-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                 <img src={`https://cdn.cloudflare.steamstatic.com${selected?.img}`}  alt={selected?.localized_name} className="object-cover w-full h-full" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selected?.localized_name ?? "Select a hero"}</h2>
                  <div className="text-xs opacity-60">{selected?.name ?? "—"} • {selected?.primary_attr?.toUpperCase?.()} • {selected?.attack_type}</div>
                  <div className="mt-1 text-xs opacity-60">{(selected?.roles || []).join(", ")}</div>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" className="px-3" onClick={() => setDialogOpen(true)}><ImageIcon /> View Image</Button>
                <Button variant="outline" className="px-3" onClick={() => openExternalHeroPage(selected)}><ExternalLink /> Open</Button>
              </div>
            </CardHeader>

            <CardContent>
              {!selected ? (
                <div className="py-12 text-center text-sm opacity-60">Choose a hero from the list or search above.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* left: core summary */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Overview</div>
                    <div className="text-sm leading-relaxed mb-3">
                      <div><span className="text-xs opacity-60">Primary:</span> <span className="font-medium">{selected.primary_attr?.toUpperCase?.() ?? "—"}</span></div>
                      <div><span className="text-xs opacity-60">Attack:</span> <span className="font-medium">{selected.attack_type ?? "—"}</span></div>
                      <div><span className="text-xs opacity-60">Roles:</span> <span className="font-medium">{(selected.roles || []).join(", ") || "—"}</span></div>
                      <div className="mt-2 text-xs opacity-60">Base health / mana / armor / move speed</div>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <StatRow label="Base Str" value={selected?.base_str ?? "—"} />
                        <StatRow label="Base Agi" value={selected?.base_agi ?? "—"} />
                        <StatRow label="Base Int" value={selected?.base_int ?? "—"} />
                        <StatRow label="Base Health" value={selected?.base_health ?? (selected?.base_str ? (selected.base_str * 20) : "—")} />
                        <StatRow label="Base Mana" value={selected?.base_mana ?? (selected?.base_int ? (selected.base_int * 12) : "—")} />
                        <StatRow label="Move Speed" value={selected?.move_speed ?? "—"} />
                        <StatRow label="Armor" value={selected?.base_armor ?? "—"} />
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div>
                      <div className="text-sm font-semibold mb-2">Attack</div>
                      <div className="grid grid-cols-1 gap-2">
                        <StatRow label="Attack Range" value={selected?.attack_range ?? "—"} />
                        <StatRow label="Projectile Speed" value={selected?.projectile_speed ?? "—"} />
                        <StatRow label="Base ATK Min" value={selected?.base_attack_min ?? "—"} />
                        <StatRow label="Base ATK Max" value={selected?.base_attack_max ?? "—"} />
                      </div>
                    </div>
                  </div>

                  {/* right: detailed numeric and fields */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Detailed Stats</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Base strength gain</div>
                        <div className="text-sm font-medium">{selected?.str_gain ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Base agility gain</div>
                        <div className="text-sm font-medium">{selected?.agi_gain ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Base intelligence gain</div>
                        <div className="text-sm font-medium">{selected?.int_gain ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Turn rate</div>
                        <div className="text-sm font-medium">{selected?.turn_rate ?? "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border col-span-1 sm:col-span-2">
                        <div className="text-xs opacity-60">Talent and other fields</div>
                        <div className="text-sm font-medium break-words">{selected.talent ? (Array.isArray(selected.talent) ? selected.talent.join(", ") : selected.talent) : "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border col-span-1 sm:col-span-2">
                        <div className="text-xs opacity-60">Raw fields (click to view)</div>
                        <div className="mt-2 flex gap-2">
                          <Button variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> Icon</Button>
                          <Button variant="ghost" onClick={() => handleCopyJSON()}><Copy /> Copy JSON</Button>
                          <Button variant="ghost" onClick={() => handleDownloadJSON()}><Download /> Download</Button>
                          <Button variant="ghost" onClick={() => openExternalHeroPage(selected)}><ExternalLink /> Open</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw JSON viewer (collapsible style) */}
          <AnimatePresence>
            {selected && rawResp && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">API Response (excerpt)</div>
                    <div className="text-xs opacity-60">Showing selected hero object</div>
                  </div>

                  <pre className={clsx("text-xs overflow-auto mt-3 p-3 rounded-md", isDark ? "text-zinc-200 bg-black/40" : "text-zinc-900 bg-white/90")} style={{ maxHeight: 260 }}>
                    {prettyJSON(selected)}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right: quick action / context */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Quick Actions</div>
            <div className="text-xs opacity-60 mb-2">Tools for working with the selected hero</div>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => handleCopyJSON()}><Copy /> Copy selected JSON</Button>
              <Button variant="outline" onClick={() => handleDownloadJSON()}><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => openExternalHeroPage(selected)}><ExternalLink /> Open on OpenDota</Button>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${ENDPOINT}`); showToast("success", "Endpoint copied"); }}><List /> Copy Endpoint</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Filter by role</div>
            <div className="text-xs opacity-60 mb-2">Click a role to show a subset in the left list.</div>
            <div className="flex flex-wrap gap-2">
              {roles.map(r => (
                <Button key={r} variant="ghost" className="px-2 py-1 text-xs" onClick={() => {
                  const filtered = (heroes || []).filter(h => (h.roles || []).includes(r));
                  if (filtered.length > 0) {
                    // show filtered list in left by temporarily selecting the first and scrolling
                    setSelected(filtered[0]);
                    setQuery(filtered[0].localized_name || filtered[0].name || "");
                    showToast("info", `Showing ${filtered.length} heroes with role ${r}`);
                  }
                }}>{r} <ChevronRight className="ml-1" size={12} /></Button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About</div>
            <div className="text-xs opacity-60">Data provided by OpenDota (public API). The page renders hero stats responsively for quick inspection and export.</div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selected?.localized_name || "Icon"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {selected?.img || selected?.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://cdn.cloudflare.steamstatic.com${selected.img}`}  alt={selected?.localized_name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from OpenDota</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => { if (selected) openExternalHeroPage(selected); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
