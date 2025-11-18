// src/pages/ItunesPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper"; // optional: reuse your toast helper

// lucide icons
import {
  Search,
  Mic,
  MicOff,
  Play,
  Pause,
  ExternalLink,
  Copy,
  Download,
  ImageIcon,
  X,
  Loader2,
  Music,
  Speaker,
  Star,
  List
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";


/*
  iTunes Search API page
  - Default term: "drake"
  - Debounced suggestions
  - Voice search (Web Speech)
  - Preview audio player
  - Raw JSON view, copy & download
  - Image modal
  - No local save logic (per user request)
*/

const ITUNES_BASE = "https://itunes.apple.com/search";
const DEFAULT_TERM = "drake";
const DEFAULT_LIMIT = 12;

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function msToTime(ms) {
  if (!ms) return "--:--";
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ItunesPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // search state
  const [term, setTerm] = useState(DEFAULT_TERM);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestTimer = useRef(null);

  // results + selection
  const [results, setResults] = useState([]);
  const [rawResp, setRawResp] = useState(null);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);

  // UI toggles
  const [showRaw, setShowRaw] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);

  // audio preview
  const audioRef = useRef(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);

  // voice search
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  // init: search default term
  useEffect(() => {
    searchItunes(DEFAULT_TERM, DEFAULT_LIMIT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch iTunes search
  async function searchItunes(q, lim = limit) {
    if (!q || q.trim().length === 0) {
      setResults([]);
      setRawResp(null);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        term: q,
        media: "music",
        limit: String(lim),
        entity: "song"
      });
      const url = `${ITUNES_BASE}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast?.("error", `iTunes search failed (${res.status})`);
        setResults([]);
        setRawResp(null);
        setLoading(false);
        return;
      }
      const json = await res.json();
      const items = Array.isArray(json.results) ? json.results : [];
      setResults(items);
      setRawResp(json);
      if (items.length > 0) {
        setCurrent(items[0]);
      } else {
        setCurrent(null);
        showToast?.("info", "No results for that term.");
      }
    } catch (err) {
      console.error(err);
      showToast?.("error", "Search error");
      setResults([]);
      setRawResp(null);
    } finally {
      setLoading(false);
    }
  }

  // debounced suggestions (uses the same API but smaller limit)
  function onTermChange(v) {
    setTerm(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      if (!v || v.trim() === "") {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      setLoadingSuggest(true);
      try {
        const params = new URLSearchParams({
          term: v,
          media: "music",
          limit: "6",
          entity: "song"
        });
        const url = `${ITUNES_BASE}?${params.toString()}`;
        const res = await fetch(url);
        const json = await res.json();
        setSuggestions((json.results || []).slice(0, 6));
      } catch (e) {
        console.error(e);
        setSuggestions([]);
      } finally {
        setLoadingSuggest(false);
      }
    }, 300);
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    await searchItunes(term, limit);
    setShowSuggest(false);
  }

  function chooseSuggestion(item) {
    setCurrent(item);
    setShowSuggest(false);
  }

  // audio controls
  function playPreview(track) {
    if (!track?.previewUrl) {
      showToast?.("info", "No preview available");
      return;
    }

    if (playingTrack && playingTrack.previewUrl === track.previewUrl) {
      // toggle pause
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setPlayingTrack(null);
      } else if (audioRef.current) {
        audioRef.current.play();
        setPlayingTrack(track);
      }
      return;
    }

    // load new track
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = track.previewUrl;
      audioRef.current.load();
      setAudioLoading(true);
      audioRef.current.play().then(() => {
        setPlayingTrack(track);
        setAudioLoading(false);
      }).catch((err) => {
        console.error(err);
        setAudioLoading(false);
        showToast?.("error", "Unable to play preview");
      });
    }
  }

  // copy & download
  function copyJSON() {
    if (!current && !rawResp) {
      showToast?.("info", "Nothing to copy");
      return;
    }
    navigator.clipboard.writeText(prettyJSON(current || rawResp));
    showToast?.("success", "Copied JSON to clipboard");
  }

  function downloadJSON() {
    const payload = rawResp || current || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `itunes_${(term || "search").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast?.("success", "JSON downloaded");
  }

  // image dialog open
  function openImageModal(item) {
    setCurrent(item);
    setImgOpen(true);
  }

  // Voice search: Web Speech API (browser support required)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }
    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (ev) => {
      const spoken = ev.results[0][0].transcript;
      setTerm(spoken);
      // auto search after spoken recognized
      searchItunes(spoken, limit);
      setListening(false);
      showToast?.("success", `Heard: "${spoken}"`);
    };
    r.onerror = (err) => {
      console.error("speech error", err);
      setListening(false);
      showToast?.("error", "Voice recognition error");
    };
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    // cleanup
    return () => {
      try {
        r.onresult = null;
        r.onerror = null;
        r.onend = null;
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) {
      showToast?.("info", "Voice recognition not supported in this browser");
      return;
    }
    if (!listening) {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (err) {
        console.error(err);
        setListening(false);
        showToast?.("error", "Failed to start voice recognition");
      }
    } else {
      recognitionRef.current.stop();
      setListening(false);
    }
  }

  // helpful derived values
  const primaryTrack = current || (results.length > 0 ? results[0] : null);

  return (
    <div className={clsx("min-h-screen p-6 max-w-9xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Harmony — iTunes Music Search</h1>
          <p className="mt-1 text-sm opacity-70">Explore songs, play previews, view full metadata. Dark (black) / Light (white) theme-ready.</p>
        </div>

        <div className="w-full md:w-auto flex items-center gap-3">
          <form onSubmit={handleSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-xl px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-70" />
            <Input
              placeholder="Search artist, song, or album (e.g. 'Drake')"
              value={term}
              onChange={(e) => onTermChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => { setTerm(DEFAULT_TERM); searchItunes(DEFAULT_TERM, limit); }}>Default</Button>
              <Button type="submit" variant="ghost"><Search /></Button>
              <Button variant="ghost" onClick={toggleListening} title="Voice search">
                {listening ? <MicOff className="animate-pulse" /> : <Mic />}
              </Button>
            </div>
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
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-[640px] rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, i) => (
              <li key={s.trackId || s.collectionId || i} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer" onClick={() => chooseSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <img src={s.artworkUrl60} alt={s.trackName} className="w-12 h-12 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.trackName}</div>
                    <div className="text-xs opacity-60 truncate">{s.artistName} • {s.collectionName}</div>
                  </div>
                  <div className="text-xs opacity-60">{msToTime(s.trackTimeMillis)}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* center content */}
        <section className="lg:col-span-8 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Track Details</CardTitle>
                <div className="text-xs opacity-60">{primaryTrack?.trackName ?? "No track loaded"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => searchItunes(term, limit)}>{loading ? <Loader2 className="animate-spin" /> : "Refresh"}</Button>
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide Raw" : "Show Raw"}</Button>
                <Button variant="ghost" onClick={copyJSON}><Copy /></Button>
                <Button variant="ghost" onClick={downloadJSON}><Download /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !primaryTrack ? (
                <div className="py-12 text-center text-sm opacity-60">No track selected. Try searching for an artist or song.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* left: artwork + controls */}
                  <div className={clsx("p-4 rounded-xl border flex flex-col items-start gap-4", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <img src={primaryTrack.artworkUrl100} alt={primaryTrack.trackName} className="w-full rounded-lg object-cover cursor-pointer" onClick={() => openImageModal(primaryTrack)} />
                    <div className="w-full">
                      <div className="text-lg font-semibold">{primaryTrack.trackName}</div>
                      <div className="text-sm opacity-60">{primaryTrack.artistName} • {primaryTrack.collectionName}</div>
                      <div className="mt-2 text-xs opacity-60">Genre: {primaryTrack.primaryGenreName || "—"}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button variant="outline" onClick={() => playPreview(primaryTrack)}>{audioLoading ? <Loader2 className="animate-spin" /> : (playingTrack && playingTrack.previewUrl === primaryTrack.previewUrl ? <Pause /> : <Play />)}</Button>
                        <Button variant="ghost" onClick={() => { if (primaryTrack.trackViewUrl) window.open(primaryTrack.trackViewUrl, "_blank"); }}><ExternalLink /></Button>
                        <Button variant="ghost" onClick={() => showToast?.("info", "Feature: Add to playlist (placeholder)") }><Star /></Button>
                      </div>
                    </div>

                    <div className="w-full mt-2 text-sm">
                      <div className="text-xs opacity-60">Duration</div>
                      <div className="font-medium">{msToTime(primaryTrack.trackTimeMillis)}</div>
                    </div>

                    <div className="w-full mt-2 text-sm">
                      <div className="text-xs opacity-60">Release</div>
                      <div className="font-medium">{primaryTrack.releaseDate ? new Date(primaryTrack.releaseDate).toLocaleDateString() : "—"}</div>
                    </div>

                    <div className="w-full mt-2 text-sm">
                      <div className="text-xs opacity-60">Price</div>
                      <div className="font-medium">{primaryTrack.trackPrice ? `${primaryTrack.trackPrice} ${primaryTrack.currency || ""}` : "—"}</div>
                    </div>
                  </div>

                  {/* center+right: results list + metadata */}
                  <div className="md:col-span-2 space-y-4">
                    <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold">Top results</div>
                        <div className="text-xs opacity-60">Showing {results.length} items</div>
                      </div>

                      <ScrollArea className="h-[400px] overflow-auto">
                        <div className="space-y-3">
                          {results.map((r) => (
                            <div key={r.trackId || r.collectionId} className="flex items-center gap-3 p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer" onClick={() => setCurrent(r)}>
                              <img src={r.artworkUrl60} alt={r.trackName} className="w-12 h-12 rounded-sm object-cover" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{r.trackName}</div>
                                <div className="text-xs opacity-60 truncate">{r.artistName} • {r.collectionName}</div>
                              </div>
                              <div className="text-xs opacity-60">{msToTime(r.trackTimeMillis)}</div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="text-sm font-semibold mb-2">Full metadata</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.keys(primaryTrack).map((k) => (
                          <div key={k} className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">{k}</div>
                            <div className="text-sm font-medium break-words">{typeof primaryTrack[k] === "object" ? JSON.stringify(primaryTrack[k]) : (primaryTrack[k] ?? "—")}</div>
                          </div>
                        ))}
                      </div>
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

        {/* right side: developer & controls */}
        <aside className={clsx("lg:col-span-4 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Developer</div>
              <div className="text-xs opacity-60">Tools</div>
            </div>

            <div className="text-xs opacity-60 mb-3">Endpoint: <code className="break-all">https://itunes.apple.com/search?term=&lt;term&gt;&amp;media=music&amp;entity=song&amp;limit={limit}</code></div>

            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${ITUNES_BASE}?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}`); showToast?.("success", "Endpoint copied"); }}><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => setShowRaw(s => !s)}><List /> Toggle Raw</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Playback</div>
              <div className="text-xs opacity-60">Preview player</div>
            </div>

            <div className="space-y-2">
              <div className="text-xs opacity-60">Now playing</div>
              <div className="font-medium">{playingTrack?.trackName ?? "—"}</div>
              <div className="text-xs opacity-60">{playingTrack?.artistName ?? ""}</div>

              <div className="mt-2 flex gap-2">
                <Button variant="ghost" onClick={() => { if (playingTrack) { if (audioRef.current && !audioRef.current.paused) { audioRef.current.pause(); setPlayingTrack(null); } else if (audioRef.current) { audioRef.current.play(); setPlayingTrack(playingTrack); } } }}><Speaker /></Button>
                <Button variant="outline" onClick={() => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; setPlayingTrack(null); } }}><X /> Stop</Button>
              </div>

              <audio ref={audioRef} style={{ display: "none" }} onEnded={() => setPlayingTrack(null)} onPlaying={() => setAudioLoading(false)} onLoadStart={() => setAudioLoading(true)} />
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Options</div>
              <div className="text-xs opacity-60">Customize</div>
            </div>

<div className="grid grid-cols-1 gap-3">
  <label className="text-xs opacity-70">Results limit</label>

  {/* Select for quick presets */}
  <Select
    value={String(limit)}
    onValueChange={(v) => setLimit(Number(v))}
  >
    <SelectTrigger
      className={clsx(
        "w-full rounded-md p-2 text-sm",
        isDark ? "bg-black/30 border border-zinc-800" : "bg-white border border-zinc-200"
      )}
      aria-label="Results limit"
    >
      <SelectValue placeholder="Select limit" />
    </SelectTrigger>

    <SelectContent>
      {[6, 12, 24, 48].map((n) => (
        <SelectItem key={n} value={String(n)}>
          {n}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  {/* Manual entry */}
  <div className="flex items-center gap-2">
    <Input
      type="number"
      min={1}
      placeholder="Enter custom limit"
      value={limit}
      onChange={(e) => {
        const val = Number(e.target.value);
        if (!isNaN(val) && val > 0) setLimit(val);
      }}
      className={clsx(
        "flex-1 rounded-md",
        isDark ? "bg-black/30 border border-zinc-800" : "bg-white border border-zinc-200"
      )}
    />

    <Button
      variant="outline"
      onClick={() => searchItunes(term, limit)}
      className="whitespace-nowrap"
    >
      <Search /> Apply
    </Button>
  </div>
</div>


          </div>
        </aside>
      </main>

      {/* image modal */}
      <Dialog open={imgOpen} onOpenChange={setImgOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{primaryTrack?.trackName ?? "Artwork"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {primaryTrack?.artworkUrl100 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primaryTrack.artworkUrl100.replace("100x100", "600x600")} alt={primaryTrack?.trackName} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Artwork from iTunes</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImgOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (primaryTrack?.trackViewUrl) window.open(primaryTrack.trackViewUrl, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
