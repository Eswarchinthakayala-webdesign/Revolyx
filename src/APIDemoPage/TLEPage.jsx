// src/pages/TLEPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  X,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Satellite,
  List,
  Globe,
  Eye
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoint (TLE) ---------- */
/* Example TLE endpoint (no API key required here)
   https://tle.ivanstanojevic.me/api/tle/25544
*/
const BASE_TLE_ENDPOINT = "https://tle.ivanstanojevic.me/api/tle";

/* ---------- Helpful constants ---------- */
/* Small curated suggestions (friendly UX): name -> NORAD id */
const POPULAR_SATELLITES = [
  { name: "ISS (ZARYA)", id: "25544" },
  { name: "Hubble Space Telescope", id: "20580" },
  { name: "NOAA 19", id: "33591" },
  { name: "Terra (EOS AM-1)", id: "25994" },
  { name: "Aqua (EOS PM-1)", id: "27424" },
  { name: "GPS BIIR-2  (PRN 02)", id: "24876" }
];

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

/* Attempt to detect TLE lines and fields from various provider shapes */
function normalizeTleResponse(json) {
  // Possible shapes:
  // { name, line1, line2 } OR { tle: "LINE1\nLINE2" } OR { tle_lines: ["L1","L2"] } OR legacy shapes
  const out = { raw: json };
  // if simple keys:
  if (json?.line1 && json?.line2) {
    out.name = json.name || json?.satname || null;
    out.line1 = json.line1;
    out.line2 = json.line2;
    out.tleString = `${json.line1}\n${json.line2}`;
    return out;
  }
  if (json?.tle && typeof json.tle === "string") {
    const parts = json.tle.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    out.tleString = parts.join("\n");
    out.line1 = parts[0] || null;
    out.line2 = parts[1] || null;
    out.name = json.name || json?.satname || null;
    return out;
  }
  if (Array.isArray(json?.tle_lines) && json.tle_lines.length >= 2) {
    out.line1 = json.tle_lines[0];
    out.line2 = json.tle_lines[1];
    out.tleString = `${out.line1}\n${out.line2}`;
    out.name = json.name || json?.satname || null;
    return out;
  }
  // Some providers return { name, id, lines: [...] }
  if (Array.isArray(json?.lines) && json.lines.length >= 2) {
    out.line1 = json.lines[0];
    out.line2 = json.lines[1];
    out.tleString = out.lines?.join("\n") || `${out.line1}\n${out.line2}`;
    out.name = json.name || null;
    return out;
  }

  // Attempt to find any string properties containing "1 " and "2 " line markers:
  const strings = Object.values(json || {}).filter(v => typeof v === "string");
  for (let s of strings) {
    // crude check: two lines with leading '1 ' and '2 '.
    if (/\n.*\n/.test(s) && /(^|\n)1 [0-9].*\n.*(^|\n)2 [0-9]/.test(s)) {
      const parts = s.trim().split(/\r?\n/).map(x => x.trim());
      out.line1 = parts.find(p => p.startsWith("1 ")) || parts[0];
      out.line2 = parts.find(p => p.startsWith("2 ")) || parts[1];
      out.tleString = `${out.line1}\n${out.line2}`;
      return out;
    }
  }

  // fallback: maybe JSON is an array with the first item containing lines
  if (Array.isArray(json) && json.length > 0) {
    const first = json[0];
    return normalizeTleResponse(first);
  }

  return out;
}

/* Parse basic fields from TLE lines using column positions (classic TLE format). This is a best-effort parse. */
function parseTleLines(line1, line2) {
  if (!line1 || !line2) return null;
  try {
    // columns: https ://celestrak.com/columns/TLE.txt (classic)
    // Example line1: "1 25544U 98067A   25322.52902778  .00016882  00000-0  10270-3 0  9005"
    // Example line2: "2 25544  51.6434 354.0485 0007612  89.6047  28.5686 15.59140985304123"
    const l1 = line1;
    const l2 = line2;

    const satno = l1.slice(2, 7).trim();
    const classification = l1[7];
    const intDesignator = `${l1.slice(9, 17).trim()}`; // launch year/number
    const epoch = l1.slice(18, 32).trim(); // epoch year + day of year
    const meanMotionDot = l1.slice(33, 43).trim();
    // line2 parses
    const inclination = l2.slice(8, 16).trim();
    const raan = l2.slice(17, 25).trim();
    const eccentricity = l2.slice(26, 33).trim();
    const argPerigee = l2.slice(34, 42).trim();
    const meanAnomaly = l2.slice(43, 51).trim();
    const meanMotion = l2.slice(52, 63).trim();

    return {
      satno,
      classification,
      intDesignator,
      epoch,
      meanMotionDot,
      inclination,
      raan,
      eccentricity,
      argPerigee,
      meanAnomaly,
      meanMotion
    };
  } catch (e) {
    return null;
  }
}

export default function TLEPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState(POPULAR_SATELLITES);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [current, setCurrent] = useState(null); // normalized TLE object
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const suggestTimer = useRef(null);
  const activeSuggestionIndex = useRef(-1);

  /* Suggestion filter (client-side) */
  useEffect(() => {
    setSuggestions(POPULAR_SATELLITES);
  }, []);

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      // client-side filter from popular list + allow numeric NORAD ID typed directly
      const q = v.trim().toLowerCase();
      if (!q) {
        setSuggestions(POPULAR_SATELLITES);
        setLoadingSuggest(false);
        return;
      }
      setLoadingSuggest(true);
      const matches = POPULAR_SATELLITES.filter(s => s.name.toLowerCase().includes(q) || s.id.includes(q));
      // if user typed a numeric string that looks like a NORAD id, suggest it directly
      if (/^\d{3,6}$/.test(q)) {
        matches.unshift({ name: `Lookup ID ${q}`, id: q });
      }
      setTimeout(() => { // small artificial delay for perceived responsiveness
        setSuggestions(matches);
        setLoadingSuggest(false);
      }, 120);
    }, 220);
  }

  /* Keyboard support for suggestions */
  function onKeyDownSearch(e) {
    if (!showSuggest) return;
    const max = suggestions.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeSuggestionIndex.current = Math.min(max, (activeSuggestionIndex.current === -1 ? 0 : activeSuggestionIndex.current + 1));
      scrollToSuggestion(activeSuggestionIndex.current);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeSuggestionIndex.current = Math.max(0, (activeSuggestionIndex.current === -1 ? 0 : activeSuggestionIndex.current - 1));
      scrollToSuggestion(activeSuggestionIndex.current);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = activeSuggestionIndex.current === -1 ? 0 : activeSuggestionIndex.current;
      const chosen = suggestions[idx] || suggestions[0];
      if (chosen) chooseSuggestion(chosen);
      activeSuggestionIndex.current = -1;
    } else if (e.key === "Escape") {
      setShowSuggest(false);
      activeSuggestionIndex.current = -1;
    }
  }

  function scrollToSuggestion(idx) {
    const el = document.querySelector(`#tle-sugg-${idx}`);
    if (el) el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  /* Fetch TLE by NORAD id or query string */
  async function fetchTleById(idOrQuery) {
    if (!idOrQuery) return;
    setLoading(true);
    try {
      // if query is a small name token (like "iss") try to map to popular first
      let idToQuery = String(idOrQuery).trim();
      const lower = idToQuery.toLowerCase();
      const match = POPULAR_SATELLITES.find(s => s.id === idToQuery || s.name.toLowerCase().includes(lower));
      if (match) idToQuery = match.id;

      const url = `${BASE_TLE_ENDPOINT}/${encodeURIComponent(idToQuery)}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `TLE fetch failed (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setRawResp(json);
      const normalized = normalizeTleResponse(json);
      // Ensure we attach a friendly name if possible
      normalized.name = normalized.name || (match?.name) || json?.name || `NORAD ${idToQuery}`;
      normalized.parsed = parseTleLines(normalized.line1, normalized.line2);
      setCurrent(normalized);
      showToast("success", `Loaded TLE for ${normalized.name}`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch TLE");
    } finally {
      setLoading(false);
      setShowSuggest(false);
    }
  }

  function chooseSuggestion(s) {
    setQuery(s.name || s.id);
    fetchTleById(s.id || s.name);
    setShowSuggest(false);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Search by satellite name or NORAD ID (e.g. 25544)");
      return;
    }
    // try to find numeric ID in query
    const numeric = (query.match(/\d{3,6}/) || [query])[0];
    await fetchTleById(numeric || query);
  }

  function copyTle() {
    if (!current) return showToast("info", "No TLE loaded");
    navigator.clipboard?.writeText(current.tleString || prettyJSON(current.raw)).then(() => {
      showToast("success", "TLE copied to clipboard");
    }).catch(() => showToast("error", "Failed to copy"));
  }

  function downloadJson() {
    if (!rawResp && !current) return showToast("info", "Nothing to download");
    const payload = rawResp || current;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const nameSafe = (current?.name || `tle`).replace(/\s+/g, "_").replace(/[^\w\-_]/g, "");
    a.download = `tle_${nameSafe}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function openExternalVisualizer() {
    // try to open a public tracker or N2YO viewer by NORAD ID (best-effort)
    const id = current?.parsed?.satno || (current?.raw?.id || "").toString();
    if (!id) return showToast("info", "No NORAD ID available");
    // open n2yo.com satellite page (no guarantee, but common pattern)
    const url = `https://www.n2yo.com/satellite/?s=${encodeURIComponent(id)}`;
    window.open(url, "_blank");
  }

  useEffect(() => {
    // initial default load: ISS (25544)
    fetchTleById("25544");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Orbital — TLE Explorer</h1>
          <p className="mt-1 text-sm opacity-70">Search Two-Line Elements by NORAD ID or name. Inspect TLE lines, parsed fields and raw response.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search satellites by name or NORAD ID (e.g. 25544)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              onKeyDown={onKeyDownSearch}
              aria-label="Search satellites"
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => fetchTleById("25544")}>ISS</Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
            role="listbox"
            aria-label="satellite suggestions"
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            <ScrollArea style={{ maxHeight: 280 }}>
              {suggestions.map((s, idx) => (
                <li
                  id={`tle-sugg-${idx}`}
                  key={`${s.id}-${idx}`}
                  className={clsx("px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer flex items-center justify-between", (activeSuggestionIndex.current === idx) ? "bg-zinc-100 dark:bg-zinc-800/50" : "")}
                  onClick={() => chooseSuggestion(s)}
                  role="option"
                  aria-selected={activeSuggestionIndex.current === idx}
                >
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-60">NORAD {s.id}</div>
                  </div>
                  <div className="text-sm opacity-50">→</div>
                </li>
              ))}
            </ScrollArea>
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout: left + center + right (no sidebar) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: suggestion / quick list (narrow) */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/40 border border-zinc-800 rounded-2xl p-4" : "bg-white/90 border border-zinc-200 rounded-2xl p-4")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Quick search</div>
            <div className="text-xs opacity-60">Popular</div>
          </div>

          <div className="mt-2 space-y-2">
            {POPULAR_SATELLITES.map((s) => (
              <Button key={s.id} variant="ghost" className="w-full justify-between" onClick={() => chooseSuggestion(s)}>
                <div className="text-sm text-left">{s.name}</div>
                <div className="text-xs opacity-60">#{s.id}</div>
              </Button>
            ))}
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-1">Tips</div>
            <div className="text-xs opacity-60">You can type a NORAD ID (e.g. 25544) or a satellite name (e.g. "Hubble").</div>
          </div>
        </aside>

        {/* Center: full detail view */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">TLE Details</CardTitle>
                <div className="text-xs opacity-60">{current?.name || "Waiting for TLE..."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fetchTleById(current?.parsed?.satno || current?.raw?.id || "25544")}>
                  <Loader2 className={loading ? "animate-spin" : ""} /> Refresh
                </Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)}><Eye /> View TLE</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No TLE loaded — use the search or pick a quick satellite.</div>
              ) : (
                <div className="space-y-4">
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="text-lg font-semibold">{current.name}</div>
                        <div className="text-xs opacity-60">NORAD {current.parsed?.satno || current.raw?.id || "—"}</div>
                        <div className="mt-2 text-sm opacity-80">{current.tleString ? (<pre className="whitespace-pre-wrap break-words text-sm">{current.tleString}</pre>) : <span className="opacity-60">No TLE lines present.</span>}</div>
                      </div>
                      <div className="w-28 text-right">
                        <div className="text-xs opacity-60">Epoch</div>
                        <div className="font-medium text-sm">{current.parsed?.epoch || "-"}</div>
                      </div>
                    </div>
                  </div>

                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Parsed elements</div>
                    {current.parsed ? (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">Inclination (deg)</div>
                          <div className="font-medium">{current.parsed.inclination || "—"}</div>
                        </div>
                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">RAAN (deg)</div>
                          <div className="font-medium">{current.parsed.raan || "—"}</div>
                        </div>
                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">Eccentricity</div>
                          <div className="font-medium">{current.parsed.eccentricity || "—"}</div>
                        </div>
                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">Argument of perigee</div>
                          <div className="font-medium">{current.parsed.argPerigee || "—"}</div>
                        </div>
                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">Mean motion (rev/day)</div>
                          <div className="font-medium">{current.parsed.meanMotion || "—"}</div>
                        </div>
                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">Mean anomaly</div>
                          <div className="font-medium">{current.parsed.meanAnomaly || "—"}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm opacity-60">TLE parsing unavailable for this response shape.</div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-semibold mb-2">Raw / All fields</div>
                    <div className="text-xs opacity-60 mb-2">Displayed below. Toggle Raw to show/hide quickly.</div>
                    <div className={clsx("p-2 rounded-md border overflow-auto", isDark ? "bg-black/20 border-zinc-800 text-zinc-200" : "bg-white/70 border-zinc-200 text-zinc-900")} style={{ maxHeight: 260 }}>
                      <pre className="text-xs">{prettyJSON(rawResp || current)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Quick actions</div>
            <div className="text-xs opacity-60">Utilities</div>
          </div>

          <div className="space-y-2">
            <Button className="w-full justify-start" variant="outline" onClick={() => copyTle()}><Copy className="mr-2" /> Copy TLE</Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => downloadJson()}><Download className="mr-2" /> Download JSON</Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => openExternalVisualizer()}><Globe className="mr-2" /> Open tracker</Button>
            <Button className="w-full justify-start" variant="ghost" onClick={() => setDialogOpen(true)}><Eye className="mr-2" /> View TLE details</Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-1">Developer</div>
            <div className="text-xs opacity-60">Endpoint: <code className="break-words">{BASE_TLE_ENDPOINT}/&lt;NORAD_ID&gt;</code></div>
          </div>
        </aside>
      </main>

      {/* TLE dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{current?.name || "TLE"}</DialogTitle>
          </DialogHeader>

          <div style={{ minHeight: "40vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20 }}>
            {current?.tleString ? (
              <pre style={{ whiteSpace: "pre-wrap", maxWidth: "100%" }}>{current.tleString}</pre>
            ) : (
              <div className="h-full flex items-center justify-center">No TLE lines</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Two-line element set (TLE)</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => copyTle()}><Copy /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
