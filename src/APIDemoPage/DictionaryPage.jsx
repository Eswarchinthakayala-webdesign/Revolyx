"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Mic,
  Play,
  Pause,
  Speaker,
  Download,
  Copy,
  X,
  List,
  BookOpen,
  Globe,
  Info,
  Loader2,
  Menu,
  Check,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "@/lib/ToastHelper";
// shadcn "Sheet" for mobile sidebar (adjust path if yours differs)
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";

const DEFAULT_WORD = "hello";
const BASE_ENDPOINT = "https://api.dictionaryapi.dev/api/v2/entries/en/";

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
}

export default function DictionaryPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [word, setWord] = useState(DEFAULT_WORD);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [playingAudioIndex, setPlayingAudioIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef(null);

  // Voice search state
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchWord(DEFAULT_WORD);
    // cleanup audio
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchWord(q) {
    const trimmed = String(q || "").trim();
    if (!trimmed) {
      setError("Please enter a word to search.");
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`${BASE_ENDPOINT}${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        const txt = await res.text();
        try {
          const parsed = JSON.parse(txt);
          setError(parsed.title || parsed.message || "No results");
        } catch {
          setError(`API error: ${res.status}`);
        }
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e?.preventDefault?.();
    fetchWord(word);
  }

  function handlePlayAudio(url, idx) {
    if (!url) return showToast("info", "No audio available");
    // stop previous
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const a = new Audio(url);
    audioRef.current = a;
    setPlayingAudioIndex(idx);
    a.play().catch((e) => {
      console.error(e);
      showToast("error", "Failed to play audio");
      setPlayingAudioIndex(null);
    });
    a.onended = () => setPlayingAudioIndex(null);
  }

  function handleStopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingAudioIndex(null);
    }
  }

  // Voice recognition: feature-detect and toggle
  function initRecognition() {
    if (typeof window === "undefined") return null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.interimResults = false;
    r.maxAlternatives = 1;
    return r;
  }

  function toggleListen() {
    if (!recognitionRef.current) recognitionRef.current = initRecognition();
    const r = recognitionRef.current;
    if (!r) return showToast("info", "Voice search not supported in this browser");

    if (!listening) {
      r.onstart = () => {
        setListening(true);
      };
      r.onresult = (ev) => {
        const txt = ev.results?.[0]?.[0]?.transcript || "";
        setWord(txt);
        fetchWord(txt);
      };
      r.onerror = (ev) => {
        console.error(ev);
        showToast("error", "Voice recognition error");
        setListening(false);
      };
      r.onend = () => {
        setListening(false);
      };
      try {
        r.start();
      } catch (e) {
        console.error(e);
        showToast("error", "Voice recognition failed to start");
        setListening(false);
      }
    } else {
      try {
        r.stop();
      } catch (e) {
        console.error(e);
      }
      setListening(false);
    }
  }

  async function copyJSON() {
    if (!data) return showToast("info", "No data to copy");
    try {
      await navigator.clipboard.writeText(prettyJSON(data));
      setCopied(true);
      showToast("success", "Copied JSON to clipboard");
      // reset animation & label after 1.6s
      window.setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to copy");
    }
  }

  function downloadJSON() {
    if (!data) return showToast("info", "No data to download");
    const blob = new Blob([prettyJSON(data)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dictionary_${(word || "word").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  // Analyze response shape (dictionaryapi.dev) and prepare presentation helpers
  const analysis = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    const entries = data.map((entry) => {
      const phonetics = Array.isArray(entry.phonetics)
        ? entry.phonetics.map((p) => ({ text: p.text || "", audio: p.audio || "" }))
        : [];
      const meanings = Array.isArray(entry.meanings)
        ? entry.meanings.map((m) => ({ partOfSpeech: m.partOfSpeech, definitions: m.definitions || [], synonyms: m.synonyms || [], antonyms: m.antonyms || [] }))
        : [];
      return {
        word: entry.word,
        phonetics,
        origin: entry.origin || "",
        meanings,
        license: entry.license || null,
        sourceUrls: entry.sourceUrls || [],
      };
    });
    return { entries };
  }, [data]);

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 max-w-8xl mx-auto")}>
      {/* Mobile sheet / sidebar */}
      <Sheet>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 md:hidden cursor-pointer" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>

            <div>
              <h1 className={clsx("text-2xl md:text-4xl font-extrabold leading-tight")}>Lexicon</h1>
              <p className="text-xs opacity-70">Search definitions, pronunciations & examples</p>
            </div>
          </div>

          {/* Desktop: search + actions */}
          <div className="hidden md:flex items-center gap-3">
            <form onSubmit={handleSubmit} className={clsx("flex items-center gap-2 w-[680px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
              <Search className="opacity-60" />
              <Input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Enter a word to lookup" className="border-0 shadow-none bg-transparent outline-none" />
              <Button type="button" variant="outline" onClick={() => fetchWord(DEFAULT_WORD)} className="cursor-pointer">Demo</Button>
              <Button type="submit" className="cursor-pointer">Search</Button>
              <Button type="button" variant="ghost" onClick={toggleListen} title="Voice search" className="cursor-pointer">
                <Mic className={listening ? "animate-pulse" : ""} />
              </Button>
            </form>
          </div>
        </div>

        <SheetContent position="left" size="full">
          <SheetHeader>
            <SheetTitle>Quick Controls</SheetTitle>
            <div className="mt-2">
              <div className="text-xs opacity-60">Endpoint</div>
              <div className="text-sm break-words">{BASE_ENDPOINT}<span className="opacity-70">[word]</span></div>
            </div>
          </SheetHeader>

          <div className="p-4 space-y-3">
            <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(`${BASE_ENDPOINT}${encodeURIComponent(word)}`); showToast("success", "Endpoint copied"); }} className="w-full justify-start cursor-pointer">
              <Globe className="mr-2" /> Copy Endpoint
            </Button>
            <Button variant="ghost" onClick={() => { if (data) downloadJSON(); else showToast("info", "No data to download"); }} className="w-full justify-start cursor-pointer">
              <Download className="mr-2" /> Download JSON
            </Button>
            <Separator />
            <div className="text-xs opacity-60">Tips</div>
            <ul className="text-sm list-disc list-inside opacity-80">
              <li>Use the microphone to speak the word aloud.</li>
              <li>Click play to listen to pronunciation (if provided).</li>
              <li>Toggle raw JSON for complete response data.</li>
            </ul>
          </div>

          <SheetFooter>
            <div className="text-xs opacity-60">Powered by DictionaryAPI.dev</div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* MAIN HEADER area for mobile + desktop search */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="md:hidden w-full">
          <form onSubmit={handleSubmit} className={clsx("flex items-center gap-2 w-full rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Enter a word to lookup" className="border-0 shadow-none bg-transparent outline-none" />
            <Button type="button" variant="outline" onClick={() => fetchWord(DEFAULT_WORD)} className="cursor-pointer">Demo</Button>
            <Button type="submit" className="cursor-pointer">Search</Button>
            <Button type="button" variant="ghost" onClick={toggleListen} title="Voice search" className="cursor-pointer">
              <Mic className={listening ? "animate-pulse" : ""} />
            </Button>
          </form>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-3">
                  <BookOpen className="opacity-80" />
                  {analysis?.entries?.[0]?.word ? `${analysis.entries[0].word}` : "No word loaded"}
                </CardTitle>
                <div className="text-xs opacity-60 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1"><Speaker className="opacity-60" size={14}/> Pronunciations</span>
                  <span className="mx-1">•</span>
                  <span>Meanings • Examples</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer" title="Toggle raw JSON"><List /> {showRaw ? "Hide JSON" : "Raw"}</Button>

                <div className="relative">
                  <Button variant="ghost" onClick={copyJSON} className="cursor-pointer flex items-center gap-2">
                    {/* animated icon */}
                    <AnimatePresence>
                      {copied ? (
                        <motion.span key="tick" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="inline-flex"><Check /></motion.span>
                      ) : (
                        <motion.span key="copy" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="inline-flex"><Copy /></motion.span>
                      )}
                    </AnimatePresence>
                    <span className="text-sm">{copied ? "Copied" : "Copy"}</span>
                  </Button>
                </div>

                <Button variant="ghost" onClick={downloadJSON} className="cursor-pointer"><Download /> Download</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-16 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : error ? (
                <div className="py-12 text-center text-sm text-rose-500">{error}</div>
              ) : !analysis ? (
                <div className="py-12 text-center text-sm opacity-60">Search for a word to see definitions and pronunciations.</div>
              ) : (
                <div className="space-y-6">
                  {/* Top: phonetics and quick info */}
                  <div className={clsx("grid grid-cols-1 md:grid-cols-3 gap-4")}>
                    <div className="p-4 rounded-xl border">
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Globe size={14}/> Word</div>
                      <div className="text-2xl font-bold">{analysis.entries[0].word}</div>
                      {analysis.entries[0].origin && <div className="text-xs opacity-60 mt-1">Origin: {analysis.entries[0].origin}</div>}
                    </div>

                    <div className="p-4 rounded-xl border">
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Speaker size={14}/> Phonetics</div>
                      <div className="space-y-2">
                        <ScrollArea style={{ maxHeight: 160 }}>
                          <div className="space-y-2">
                            {analysis.entries[0].phonetics.length === 0 && <div className="text-sm opacity-60">No phonetics available</div>}
                            {analysis.entries[0].phonetics.map((p, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm">{p.text || "—"}</div>
                                  <div className="text-xs opacity-60">Audio: {p.audio ? p.audio.split("/").slice(-1)[0] : "none"}</div>
                                </div>
                                <div className="flex gap-2 items-center">
                                  {playingAudioIndex === idx ? (
                                    <Button variant="ghost" onClick={handleStopAudio} className="cursor-pointer"><Pause /></Button>
                                  ) : (
                                    <Button variant="ghost" onClick={() => handlePlayAudio(p.audio, idx)} className="cursor-pointer"><Play /></Button>
                                  )}
                                  {p.audio && (
                                    <a href={p.audio} target="_blank" rel="noreferrer" className="text-xs underline cursor-pointer">Open</a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border">
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Info size={14}/> Sources</div>
                      <div className="text-xs opacity-60 space-y-2">
                        {Array.isArray(analysis.entries[0].sourceUrls) && analysis.entries[0].sourceUrls.length > 0 ? (
                          analysis.entries[0].sourceUrls.map((s, i) => (
                            <div key={i}><a href={s} target="_blank" rel="noreferrer" className="underline cursor-pointer">{s}</a></div>
                          ))
                        ) : (
                          <div>No source URLs</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Meanings: big detailed section */}
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2"><BookOpen /> Meanings</h3>
                      <div className="text-sm opacity-60 flex items-center gap-1"><ChevronDown size={14}/> Total: {analysis.entries[0].meanings.reduce((acc, m) => acc + (m.definitions?.length || 0), 0)}</div>
                    </div>

                    <ScrollArea style={{ maxHeight: 420 }}>
                      <div className="space-y-6">
                        {analysis.entries.map((entry, ei) => (
                          <div key={ei} className="space-y-4">
                            {entry.meanings.map((m, mi) => (
                              <div key={mi} className="p-3 rounded-md border bg-opacity-5">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-semibold">{m.partOfSpeech}</div>
                                  <div className="text-xs opacity-60">Definitions: {m.definitions.length}</div>
                                </div>

                                <div className="mt-3 space-y-3">
                                  {m.definitions.map((d, di) => (
                                    <div key={di} className="p-3 rounded-md border">
                                      <div className="text-sm font-medium">{d.definition}</div>
                                      {d.example && <div className="text-sm opacity-70 mt-2">“{d.example}”</div>}
                                      {Array.isArray(d.synonyms) && d.synonyms.length > 0 && (
                                        <div className="mt-2 text-xs">
                                          <span className="opacity-60">Synonyms: </span>
                                          {d.synonyms.map((s, si) => (
                                            <span key={si} className="inline-block mr-2 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900 text-xs">{s}</span>
                                          ))}
                                        </div>
                                      )}
                                      {Array.isArray(d.antonyms) && d.antonyms.length > 0 && (
                                        <div className="mt-1 text-xs">
                                          <span className="opacity-60">Antonyms: </span>
                                          {d.antonyms.map((a, ai) => (
                                            <span key={ai} className="inline-block mr-2 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900 text-xs">{a}</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* aggregated synonyms & antonyms for this part of speech */}
                                {Array.isArray(m.synonyms) && m.synonyms.length > 0 && (
                                  <div className="mt-3 text-xs">
                                    <span className="opacity-60">All synonyms: </span>
                                    {m.synonyms.map((s, si) => (
                                      <span key={si} className="inline-block mr-2 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900 text-xs">{s}</span>
                                    ))}
                                  </div>
                                )}

                                {Array.isArray(m.antonyms) && m.antonyms.length > 0 && (
                                  <div className="mt-2 text-xs">
                                    <span className="opacity-60">All antonyms: </span>
                                    {m.antonyms.map((a, ai) => (
                                      <span key={ai} className="inline-block mr-2 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900 text-xs">{a}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Raw JSON toggle */}
                  <AnimatePresence>
                    {showRaw && data && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={clsx("p-4 border rounded-md", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}
                      >
                        <ScrollArea style={{ maxHeight: 420 }}>
                          <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")}>{prettyJSON(data)}</pre>
                        </ScrollArea>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right column: big reference / quick facts */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold flex items-center gap-2"><Info size={14}/> Quick Info</div>
              <div className="text-xs opacity-60">Details</div>
            </div>

            <div className="text-sm opacity-60">Lookups powered by <span className="font-medium">DictionaryAPI.dev</span></div>
            <Separator className="my-3" />

            <div className="space-y-2">
              <div className="text-xs opacity-60">Loaded word</div>
              <div className="font-medium text-sm">{analysis?.entries?.[0]?.word ?? "—"}</div>

              <div className="text-xs opacity-60 mt-2">Available phonetics</div>
              <div className="text-sm">{analysis?.entries?.[0]?.phonetics?.length ?? 0}</div>

              <div className="text-xs opacity-60 mt-2">Meanings</div>
              <div className="text-sm">{analysis?.entries?.[0]?.meanings?.reduce((acc, m) => acc + (m.definitions?.length || 0), 0) ?? 0}</div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint</div>
            <div className="text-xs break-words mt-2">{BASE_ENDPOINT}<span className="opacity-70">[word]</span></div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${BASE_ENDPOINT}${encodeURIComponent(word)}`); showToast("success", "Endpoint copied"); }} className="cursor-pointer">Copy Endpoint</Button>
              <Button variant="outline" onClick={() => { if (data) downloadJSON(); else showToast("info", "No data to download"); }} className="cursor-pointer">Download JSON</Button>
            </div>
          </div>

          <Separator />

          <div className="text-xs opacity-60">Tips</div>
          <ul className="text-sm list-disc list-inside opacity-80">
            <li>Use the microphone to speak the word aloud.</li>
            <li>Click play to listen to pronunciation (if provided).</li>
            <li>Toggle raw JSON for complete response data.</li>
          </ul>
        </aside>
      </main>
    </div>
  );
}
