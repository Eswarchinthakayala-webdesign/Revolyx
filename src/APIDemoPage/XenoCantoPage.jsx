// XenoCantoPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  Play,
  Pause,
  ImageIcon,
  List,
  Loader2,
  Volume,
  MapPin,
  Download,
  Copy,
  FileText,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * XenoCantoPage.jsx
 *
 * Professional, full-featured UI for Xeno-Canto v3 recordings.
 * - Tag-aware queries (v3 requires tag queries)
 * - Debounced suggestions with keyboard navigation
 * - Left (media) + center (details) + right (quick-actions)
 * - Audio player with controls & download
 * - Raw JSON toggle, image modal
 * - Dark/light theme consistent with NewsApiPage style
 *
 * Replace API_KEY with your key or proxy the endpoint server-side for production.
 */

// --- Config
const BASE = "https://xeno-canto.org/api/3/recordings";
const API_KEY = "874167476dd0fc04703f63fb9525baf6823db354"; // <-- replace with your key or leave blank if using an open proxy
const DEFAULT_QUERY = "en:\"robin\""; // default tag-based query (v3 requires tags)
const DEBOUNCE_MS = 300;

// --- Utilities
function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}


// helper: safe thumbnail URL
function getThumbUrl(s) {
  if (!s) return null;
  // prefer sono.thumb, then sono.large, then image
  const candidate = s.sono?.thumb || s.sono?.large || s.image || s.sono?.full || "";
  if (!candidate) return null;
  // prefix protocol if it's protocol-relative
  if (candidate.startsWith("//")) return `https:${candidate}`;
  // if already absolute http(s)
  if (/^https?:\/\//i.test(candidate)) return candidate;
  // otherwise ignore (relative paths are not usable here)
  return null;
}


/**
 * normalizeQuery(raw)
 * - If input already contains a colon (tag:value) -> pass through
 * - If looks like "Genus species" (two words, first capitalized) -> sp:"Genus species"
 * - Otherwise wrap as en:"user input"
 */
function normalizeQuery(raw) {
  if (!raw || !raw.trim()) return "";
  const s = raw.trim();

  // Already tag-based?
  if (s.includes(":")) return s;

  const twoWords = s.split(/\s+/);
  if (twoWords.length === 2) {
    const [a, b] = twoWords;
    const looksLikeLatin = /^[A-Z][a-z-]+$/.test(a) && /^[a-z-]+$/.test(b);
    if (looksLikeLatin) {
      return `sp:"${a} ${b}"`;
    }
  }

  // Default to English/common name search
  return `en:"${s}"`;
}

/**
 * buildUrlFromUserInput(userInput, page)
 * - Uses normalizeQuery to create tag-based query required by v3.
 */
function buildUrlFromUserInput(userInput, page = 1) {
  const q = normalizeQuery(userInput);
  const params = new URLSearchParams();
  if (q) params.set("query", q);
  if (API_KEY && API_KEY !== "YOUR_API_KEY") params.set("key", API_KEY);
  params.set("page", String(page || 1));
  return `${BASE}?${params.toString()}`;
}

/**
 * buildAudioUrl(recording)
 * - Heuristic builder that tries multiple recording fields in common v3 responses
 * - Returns null if no plausible audio URL found
 */
function buildAudioUrl(rec) {
  if (!rec) return null;
  if (rec.file) return rec.file;
  if (rec.url) return rec.url;
  // many responses include "file-name" and sono.full/thumb images; try to heuristically derive
  if (rec["file-name"] && rec.sono && rec.sono.full) {
    try {
      const full = rec.sono.full; // e.g. "//www.xeno-canto.org/sounds/uploaded/XXXXX/full.png"
      const proto = full.startsWith("//") ? "https:" : "";
      // Try to strip the trailing "/full.png" and append file-name
      const base = full.replace(/\/full\.(png|jpg|jpeg)$/i, "");
      return `${proto}${base}/${rec["file-name"]}`;
    } catch (e) {
      // ignore and fallback
    }
  }
  // fallback: if rec.sono.thumb and file-name, try replacing suffix
  if (rec.sono && rec.sono.thumb && rec["file-name"]) {
    const proto = rec.sono.thumb.startsWith("//") ? "https:" : "";
    const base = rec.sono.thumb.replace(/\/thumb\.(png|jpg|jpeg)$/i, "");
    return `${proto}${base}/${rec["file-name"]}`;
  }
  return null;
}

/**
 * buildImageUrl(recording)
 * - Prefer sono.large, sono.full with https, then rec.image or rec.sono.thumb
 */
function buildImageUrl(rec) {
  if (!rec) return null;
  if (rec.sono && rec.sono.large) return rec.sono.large.startsWith("//") ? `https:${rec.sono.large}` : rec.sono.large;
  if (rec.sono && rec.sono.full) return rec.sono.full.startsWith("//") ? `https:${rec.sono.full}` : rec.sono.full;
  if (rec.image) return rec.image.startsWith("//") ? `https:${rec.image}` : rec.image;
  if (rec.sono && rec.sono.thumb) return rec.sono.thumb.startsWith("//") ? `https:${rec.sono.thumb}` : rec.sono.thumb;
  return null;
}

// --- Component
export default function XenoCantoPage() {
  // theme
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [activeSuggestIdx, setActiveSuggestIdx] = useState(-1);

  const [recording, setRecording] = useState(null); // selected recording object
  const [rawResp, setRawResp] = useState(null);
  const [loadingRecording, setLoadingRecording] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const suggestTimer = useRef(null);
  const searchController = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch suggestions (debounced caller)
  async function fetchSuggestions(q) {
    if (!q || !q.trim()) {
      setSuggestions([]);
      return;
    }
    // normalize to tag query required by v3
    const url = buildUrlFromUserInput(q);
    // abort previous
    if (searchController.current) searchController.current.abort();
    const ctrl = new AbortController();
    searchController.current = ctrl;
    setLoadingSuggest(true);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(json.recordings || []);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("suggest fetch error", err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
      searchController.current = null;
    }
  }

  // Fetch first recording by query (used for search submit and default load)
  async function fetchFirstByQuery(q) {
    if (!q || !q.trim()) {
      showToast("info", "Please enter a query using tags (e.g. cnt:India or en:\"robin\").");
      return;
    }
    setLoadingRecording(true);
    try {
      const url = buildUrlFromUserInput(q);
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Fetch failed (${res.status})`);
        setLoadingRecording(false);
        return;
      }
      const json = await res.json();
      setRawResp(json);
      const first = Array.isArray(json.recordings) && json.recordings.length > 0 ? json.recordings[0] : null;
      if (first) {
        setRecording(first);
      } else {
        setRecording(null);
        showToast("info", "No recordings found for that query.");
      }
    } catch (err) {
      console.error("fetchFirstByQuery error", err);
      showToast("error", "Network error");
    } finally {
      setLoadingRecording(false);
    }
  }

  // debounced input handler
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    setActiveSuggestIdx(-1);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => fetchSuggestions(v), DEBOUNCE_MS);
  }

  // keyboard nav for suggestions
  function onInputKeyDown(e) {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeSuggestIdx >= 0 && suggestions[activeSuggestIdx]) {
        pickSuggestion(suggestions[activeSuggestIdx]);
      } else {
        onSubmit(e);
      }
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  }

  // pick suggestion
  function pickSuggestion(item) {
    setShowSuggest(false);
    setSuggestions([]);
    setActiveSuggestIdx(-1);
    if (!item) return;
    setRecording(item);
    setRawResp({ recordings: [item] });
  }

  // form submit
  async function onSubmit(e) {
    e?.preventDefault?.();
    await fetchFirstByQuery(query);
    setShowSuggest(false);
  }

  // audio controls
  useEffect(() => {
    const aud = audioRef.current;
    if (!aud) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    aud.addEventListener("play", onPlay);
    aud.addEventListener("pause", onPause);
    return () => {
      aud.removeEventListener("play", onPlay);
      aud.removeEventListener("pause", onPause);
    };
  }, []);

  function togglePlay() {
    const aud = audioRef.current;
    if (!aud) return;
    if (aud.paused) aud.play().catch(() => showToast("error", "Playback blocked"));
    else aud.pause();
  }

  function downloadRecording() {
    if (!recording) return showToast("info", "No recording loaded");
    const url = buildAudioUrl(recording);
    if (!url) return showToast("info", "No downloadable audio URL available");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(recording.en || recording.species || "recording").replace(/\s+/g, "_")}.mp3`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function copyEndpoint() {
    const u = buildUrlFromUserInput(query);
    navigator.clipboard.writeText(u);
    showToast("success", "Endpoint copied");
  }

  // initial load
  useEffect(() => {
    // load a default safe tag query
    fetchFirstByQuery(DEFAULT_QUERY);
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (searchController.current) searchController.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived
  const audioUrl = useMemo(() => buildAudioUrl(recording), [recording]);
  const imageUrl = useMemo(() => buildImageUrl(recording), [recording]);

  const recordingMeta = useMemo(() => {
    if (!recording) return {};
    return {
      id: recording.id,
      commonName: recording.en || recording.species || recording.comName || null,
      scientific: recording.gen && recording.sp ? `${recording.gen} ${recording.sp}` : recording.scientific ?? null,
      country: recording.cnt || recording.country || null,
      location: recording.loc || recording.location || null,
      date: recording.date || null,
      time: recording.time || null,
      length: recording.length || null,
      quality: recording.q || recording.quality || null,
      recordist: recording.rec || recording.recordist || recording.username || recording.uploaded_by || null,
      tags: recording.tags || recording.type || recording.sound_type || null,
      comments: recording.rmk || recording.comments || null,
      lat: recording.lat || null,
      lng: recording.lng || null
    };
  }, [recording]);

  // render
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Songscape — Bird Recordings</h1>
          <p className="mt-1 text-sm opacity-70">Search Xeno-Canto recordings (v3), play audio and inspect full metadata.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={onSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search recordings"
              placeholder='Try: en:"European robin", cnt:India, sp:"Larus fuscus"'
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={onInputKeyDown}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" onClick={() => { setQuery(DEFAULT_QUERY); fetchFirstByQuery(DEFAULT_QUERY); }}>Default</Button>
            <Button type="submit" variant="outline"><Search /></Button>
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
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
            role="listbox"
            aria-label="Recording suggestions"
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (

              <li
                key={s.id ?? idx}
                role="option"
                aria-selected={idx === activeSuggestIdx}
                onClick={() => pickSuggestion(s)}
                onMouseEnter={() => setActiveSuggestIdx(idx)}
                className={clsx("px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer flex items-center gap-3", idx === activeSuggestIdx ? (isDark ? "bg-zinc-800/60" : "bg-zinc-100") : "")}
              >
                <img src= {getThumbUrl(s)} alt={s.en || s.species || "thumb"} className="w-12 h-10 object-cover rounded-sm bg-zinc-100" />
                <div className="flex-1">
                  <div className="font-medium">{s.en || s.species || "Unknown"}</div>
                  <div className="text-xs opacity-60">{s.cnt ?? s.country ?? "—"} • {s.date ?? "—"}</div>
                </div>
                <div className="text-xs opacity-60">id:{s.id}</div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout: left (media), center (details), right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left — Media */}
        <section className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Audio</CardTitle>
                <div className="text-xs opacity-60">{recordingMeta?.commonName ?? "—"}</div>
              </div>
              <div className="text-xs opacity-60">ID: {recordingMeta?.id ?? "—"}</div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="rounded-md overflow-hidden border">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={recordingMeta?.commonName || "thumb"} className="w-full h-48 object-cover cursor-pointer" onClick={() => setImageOpen(true)} />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                      <ImageIcon />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => togglePlay()}>
                    {isPlaying ? <Pause /> : <Play />} {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <Button variant="ghost" onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; }}><Volume /> Reset</Button>
                  <Button variant="outline" onClick={() => downloadRecording()}><Download /> Download</Button>
                </div>

                <div className="mt-2 text-xs opacity-60">
                  <div>Length: {recordingMeta.length ?? "—"}</div>
                  <div className="mt-1">Date: {recordingMeta.date ?? "—"} {recordingMeta.time ? `• ${recordingMeta.time}` : ""}</div>
                </div>

                <div className="mt-3">
                  <audio ref={audioRef} controls src={audioUrl ?? undefined} className="w-full" onError={(e) => console.warn("audio error", e)} />
                  {!audioUrl && <div className="text-xs mt-2 opacity-60">Audio URL not available. Try another recording or proxy the audio server-side if blocked.</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Center — Details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-center justify-between", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <h2 className="text-2xl font-extrabold">{recordingMeta.commonName ?? recording?.species ?? "No recording loaded"}</h2>
                <div className="text-sm opacity-60">{recordingMeta.scientific ?? ""}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { if (recording && recording.url) window.open(recording.url, "_blank"); else showToast("info", "Open source not available"); }}><ExternalLink /></Button>
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingRecording ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !recording ? (
                <div className="py-12 text-center text-sm opacity-60">No recording loaded. Use search to find recordings.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Location</div>
                      <div className="text-sm font-medium">{recordingMeta.location ?? "—"}</div>
                      <div className="text-xs opacity-60 mt-2">{recordingMeta.country ?? "—"}</div>
                      {recordingMeta.lat && recordingMeta.lng && (
                        <div className="mt-2">
                          <a href={`https://www.google.com/maps?q=${recordingMeta.lat},${recordingMeta.lng}`} target="_blank" rel="noreferrer" className="text-xs underline flex items-center gap-1"><MapPin /> Open map</a>
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Recordist</div>
                      <div className="text-sm font-medium">{recordingMeta.recordist ?? "—"}</div>
                      <div className="text-xs opacity-60 mt-2">Quality: {recordingMeta.quality ?? "—"}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-md border">
                    <div className="text-xs opacity-60">Comments / Notes</div>
                    <div className="mt-2 text-sm">{recordingMeta.comments ?? "—"}</div>
                  </div>

                  <div className="p-3 rounded-md border">
                    <div className="text-xs opacity-60">Tags / Types</div>
                    <div className="mt-2 text-sm">{recordingMeta.tags ?? "—"}</div>
                  </div>

                  <AnimatePresence>
                    {showRaw && rawResp && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Raw JSON</div>
                        <pre className="text-xs overflow-auto mt-2" style={{ maxHeight: 300 }}>{prettyJSON(rawResp)}</pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right — Quick Actions */}
        <section className="lg:col-span-3 space-y-4">
          <div className={clsx("p-4 rounded-2xl border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Quick Actions</div>
                <div className="text-xs opacity-60">Utilities & developer tools</div>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => { if (recording && recording.url) window.open(recording.url, "_blank"); else showToast("info", "No source."); }}><ExternalLink /> Open source</Button>
              <Button variant="outline" onClick={() => downloadRecording()}><Download /> Download audio</Button>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(buildUrlFromUserInput(query)); showToast("success", "Endpoint copied"); }}><Copy /> Copy endpoint</Button>
              <Button variant="outline" onClick={() => { if (rawResp) { const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `xenocanto_${recording?.id ?? "resp"}.json`; a.click(); URL.revokeObjectURL(a.href); } else showToast("info", "No data to download"); }}><FileText /> Download JSON</Button>
            </div>

            <Separator className="my-3" />

            <div className="text-xs opacity-60">Tip: use queries like <code>sp:"Larus fuscus"</code> or <code>cnt:India</code> for precise results.</div>
          </div>
        </section>
      </main>

      {/* Image dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{recordingMeta.commonName ?? "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={recordingMeta.commonName} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from Xeno-Canto</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (recording && recording.url) window.open(recording.url, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
