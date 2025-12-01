// src/pages/QuranApiPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Copy,
  Download,
  ExternalLink,
  List,
  Loader2,
  BookOpen,
  Globe,
  X,
  Menu,
  RefreshCw,
  Check,
  Tag,
  Hash,
  Layers,
  Info,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

// shadcn components — adjust paths if different in your codebase
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const ENDPOINT = "https://api.alquran.cloud/v1/quran/en.asad";
const DEFAULT_PLACEHOLDER = "Search surah or verse text (e.g. 'mercy', 'al-fatiha', '1:1')...";

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function Badge({ children, color = "indigo" }) {
  // Simple badge — tweak styles to match your design system
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
  const colors = {
    indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200",
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
    slate: "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-200",
  };
  return <span className={clsx(base, colors[color] || colors.indigo)}>{children}</span>;
}

export default function QuranApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Data & state
  const [rawResp, setRawResp] = useState(null);
  const [surahs, setSurahs] = useState([]); // array of surah objects
  const [loading, setLoading] = useState(false);
  const [selectedSurahIndex, setSelectedSurahIndex] = useState(0);
  const [selectedAyahIndex, setSelectedAyahIndex] = useState(0);

  // Search / suggestions
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestTimer = useRef(null);

  // Dialog: show ayah text in modal
  const [dialogOpen, setDialogOpen] = useState(false);

  // Raw JSON view toggle
  const [showRaw, setShowRaw] = useState(false);

  // Mobile sheet (presets)
  const [sheetOpen, setSheetOpen] = useState(false);

  // Presets (10 random surah names)
  const [presets, setPresets] = useState([]);

  // Copy animation state
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  // Fetch the Quran once on mount
  useEffect(() => {
    fetchQuran();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchQuran() {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINT);
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const json = await res.json();
      setRawResp(json);
      const s = (json?.data?.surahs || []).map((surah) => {
        const ayahs = (surah.ayahs || []).map((a) => ({
          number: a.number,
          numberInSurah: a.numberInSurah,
          text: a.text,
          juz: a.juz,
          page: a.page,
          manzil: a.manzil,
          ruku: a.ruku,
          hizbQuarter: a.hizbQuarter,
        }));
        return {
          number: surah.number,
          englishName: surah.englishName,
          englishNameTranslation: surah.englishNameTranslation,
          name: surah.name,
          revelationType: surah.revelationType,
          ayahs,
        };
      });
      setSurahs(s);
      setSelectedSurahIndex(0);
      setSelectedAyahIndex(0);
      buildPresetsFromSurahs(s);
      showToast?.("success", `Loaded Quran (${s.length} surahs)`);
    } catch (err) {
      console.error(err);
      showToast?.("error", "Failed to load Quran API");
    } finally {
      setLoading(false);
    }
  }

  // Build 10 random presets from surahs
  function buildPresetsFromSurahs(sArr = surahs) {
    if (!sArr || sArr.length === 0) {
      setPresets([]);
      return;
    }
    const copy = [...sArr];
    // Fisher-Yates shuffle then take first 10
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setPresets(copy.slice(0, 10).map((s) => ({ label: s.englishName, sub: s.englishNameTranslation, number: s.number })));
  }

  function refreshPresets() {
    buildPresetsFromSurahs();
    showToast?.("info", "Presets refreshed");
  }

  // Search
  async function runSearch(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);

    try {
      const trimmed = q.trim().toLowerCase();

      // colon pattern like "2:255" or "2-255"
      const colonMatch = trimmed.match(/^(\d+)\s*[:\-]\s*(\d+)$/);
      if (colonMatch) {
        const sNum = Number(colonMatch[1]);
        const aNumInSurah = Number(colonMatch[2]);
        const surah = surahs.find((x) => x.number === sNum);
        if (surah) {
          const ayah = surah.ayahs.find((a) => a.numberInSurah === aNumInSurah);
          if (ayah) {
            setSuggestions([{ surah, ayah, snippet: ayah.text }]);
            setLoadingSuggest(false);
            return;
          }
        }
      }

      const results = [];
      // surah names
      for (const s of surahs) {
        if (
          s.englishName.toLowerCase().includes(trimmed) ||
          s.englishNameTranslation?.toLowerCase().includes(trimmed) ||
          s.name.toLowerCase().includes(trimmed)
        ) {
          results.push({ surah: s, ayah: null, snippet: `${s.englishName} — ${s.englishNameTranslation}` });
        }
      }
      // ayah search
      outer: for (const s of surahs) {
        for (const a of s.ayahs) {
          if (a.text.toLowerCase().includes(trimmed)) {
            const snippet = snippetAround(a.text, trimmed, 80);
            results.push({ surah: s, ayah: a, snippet });
            if (results.length >= 50) break outer;
          }
        }
      }

      setSuggestions(results.slice(0, 50));
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  function snippetAround(text, term, maxLen = 140) {
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? "…" : "");
    const start = Math.max(0, idx - Math.floor((maxLen - term.length) / 2));
    const end = Math.min(text.length, start + maxLen);
    return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      runSearch(v);
    }, 300);
  }

  function chooseSuggestion(item) {
    if (!item) return;
    const sIndex = surahs.findIndex((s) => s.number === item.surah.number);
    setSelectedSurahIndex(Math.max(0, sIndex));
    if (item.ayah) {
      const aIndex = item.surah.ayahs.findIndex((a) => a.number === item.ayah.number);
      setSelectedAyahIndex(Math.max(0, aIndex));
    } else {
      setSelectedAyahIndex(0);
    }
    setShowSuggest(false);
    setQuery("");
    // close mobile sheet if open
    setSheetOpen(false);
  }

  useEffect(() => {
    setSelectedAyahIndex(0);
  }, [selectedSurahIndex]);

  function currentSurah() {
    return surahs[selectedSurahIndex] || null;
  }
  function currentAyah() {
    const s = currentSurah();
    if (!s) return null;
    return s.ayahs[selectedAyahIndex] || null;
  }

  // Quick actions
  function copyAyah() {
    const ayah = currentAyah();
    if (!ayah) return showToast?.("info", "No ayah selected");
    const text = `${currentSurah().englishName} ${ayah.numberInSurah} — ${ayah.text}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => {
      setCopied(false);
    }, 1600);
    showToast?.("success", "Ayah copied to clipboard");
  }

  function downloadAyahJSON() {
    const ayah = currentAyah();
    const surah = currentSurah();
    if (!ayah || !surah) return showToast?.("info", "No ayah to download");
    const payload = { surah: { number: surah.number, englishName: surah.englishName }, ayah };
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = `quran_${surah.number}_${ayah.numberInSurah}.json`;
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast?.("success", "Downloaded JSON");
  }

  function downloadFullJSON() {
    if (!rawResp) return showToast?.("info", "Nothing to download");
    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `alquran_en_asad_full.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast?.("success", "Downloaded full JSON");
  }

  const surahList = useMemo(() => surahs.map((s) => ({ number: s.number, name: s.englishName, transl: s.englishNameTranslation })), [surahs]);

  // small helpers for badge color
  function badgeColorForRevelation(rev) {
    if (!rev) return "slate";
    if (rev.toLowerCase() === "meccan") return "amber";
    if (rev.toLowerCase() === "medinan") return "green";
    return "indigo";
  }

  // cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  // UI rendering
  return (
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Mobile menu / sheet trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 md:hidden cursor-pointer">
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className={clsx("p-3")}>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash />
                    <span>Presets</span>
                  </div>
                
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4">
                <ScrollArea className="h-[60vh]">
                  <div className="grid grid-cols-1 gap-2 p-2">
                    {presets.map((p, idx) => (
                      <button
                        key={`${p.number}_${idx}`}
                        onClick={() => {
                          const idxSurah = surahs.findIndex((s) => s.number === p.number);
                          if (idxSurah >= 0) {
                            setSelectedSurahIndex(idxSurah);
                            setSelectedAyahIndex(0);
                            setSheetOpen(false);
                          }
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{p.label}</div>
                            <div className="text-xs opacity-60">{p.sub}</div>
                          </div>
                          <div className="text-xs opacity-60">S:{p.number}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">Quran — REST Explorer</h1>
            <p className="text-xs md:text-sm opacity-70">Translation: Muhammad Asad (en.asad) — Search & preview verses</p>
          </div>
        </div>

        {/* search (desktop centered) */}
        <div className=" flex justify-center">
          <form onSubmit={(e) => { e.preventDefault(); runSearch(query); }} className={clsx("flex items-center gap-2 sm:w-[640px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-70" />
            <Input
              placeholder={DEFAULT_PLACEHOLDER}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => { setQuery(""); setShowSuggest(false); }}>
              <X />
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>

       
      </header>

      {/* Suggestions dropdown (mobile & desktop) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={`${s.surah.number}_${s.ayah?.numberInSurah || "surah"}_${idx}`} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseSuggestion(s)}>
                <div className="flex flex-col items-start gap-3">
                  <div className="">
                    <div className="text-sm font-semibold">{s.surah.englishName}</div>
                    <div className="text-xs opacity-60">{s.surah.englishNameTranslation}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">{s.snippet}</div>
                    <div className="text-xs opacity-60 mt-1">{s.ayah ? `Ayah ${s.ayah.numberInSurah} • Surah ${s.surah.number}` : "Surah match"}</div>
                  </div>
                </div>
              </li>
            ))}
            {suggestions.length === 0 && !loadingSuggest && <li className="p-3 text-sm opacity-60">No matches</li>}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT: Surah list (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 p-3 rounded-2xl h-fit", isDark ? "bg-black/30 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Presets</div>
              <div className="text-xs opacity-60">Random picks from API</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => refreshPresets()} className="cursor-pointer"><RefreshCw /></Button>
            </div>
          </div>

          <Separator />

          <div className="mt-3">
            <ScrollArea className="max-h-[65vh] overflow-y-auto">
              <div className="space-y-2 p-1">
                {presets.map((p, idx) => (
                  <button
                    key={`${p.number}_${idx}`}
                    onClick={() => {
                      const idxSurah = surahs.findIndex((s) => s.number === p.number);
                      if (idxSurah >= 0) {
                        setSelectedSurahIndex(idxSurah);
                        setSelectedAyahIndex(0);
                      }
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.label}</div>
                        <div className="text-xs opacity-60">{p.sub}</div>
                      </div>
                      <div className="text-xs opacity-60">S:{p.number}</div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* CENTER: full details */}
        <section className={clsx("lg:col-span-6 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-start justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-3">
                  <Layers className="opacity-80" />
                  <span>{currentSurah()?.englishName ?? "Surah"}</span>
                  <Badge color={badgeColorForRevelation(currentSurah()?.revelationType)}>
                    {currentSurah()?.revelationType ?? "—"}
                  </Badge>
                </CardTitle>
                <div className="text-xs opacity-60 flex items-center gap-3 mt-1">
                  <Info className="w-3 h-3 opacity-60" />
                  <span>{currentSurah()?.englishNameTranslation ?? "—"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" className="cursor-pointer" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide JSON" : "Raw"}</Button>
                <Button variant="outline" className="cursor-pointer" onClick={() => setDialogOpen(true)}><BookOpen /> Open</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentSurah() ? (
                <div className="py-12 text-center text-sm opacity-60">Select a surah to view its ayahs.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {/* Surah header block */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-2xl font-bold leading-tight flex items-center gap-3">
                          <Tag className="opacity-80" />
                          <span>{currentSurah().englishName}</span>
                        </div>
                        <div className="text-sm opacity-60 mt-1">{currentSurah().englishNameTranslation}</div>
                        <div className="mt-2 text-xs opacity-60 flex items-center gap-3">
                          <Hash className="w-4 h-4" /> Surah {currentSurah().number} • {currentSurah().revelationType}
                        </div>
                      </div>

                      <div className="text-sm opacity-60 text-right">
                        <div className="mb-2">Ayahs: {currentSurah().ayahs.length}</div>
                        <div className="text-xs">Jump to</div>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setSelectedAyahIndex(0)}>1</Button>
                          <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setSelectedAyahIndex(Math.max(0, Math.floor(currentSurah().ayahs.length/2)))}>mid</Button>
                          <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setSelectedAyahIndex(Math.max(0, currentSurah().ayahs.length - 1))}>last</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ayah list (center scrollable) */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold flex items-center gap-2"><FileText /> Ayahs</div>
                      <div className="text-xs opacity-60">{currentSurah().ayahs.length} total</div>
                    </div>

                    <div className="max-h-[52vh] overflow-auto no-scrollbar space-y-3">
                      {currentSurah().ayahs.map((a, idx) => (
                        <div
                          key={a.number}
                          onClick={() => setSelectedAyahIndex(idx)}
                          className={clsx("p-3 rounded-lg cursor-pointer", idx === selectedAyahIndex ? "bg-indigo-600/6 ring-1 ring-indigo-400/20" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/40")}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="text-base leading-relaxed">{a.text}</div>
                              <div className="text-xs opacity-60 mt-2 flex items-center gap-3">
                                <div><strong>Ayah</strong> {a.numberInSurah}</div>
                                <div>• Juz {a.juz}</div>
                                <div>• Page {a.page}</div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <div className="text-xs opacity-60">{a.numberInSurah}</div>

                           
          
                            </div>
                          </div>
                        </div>
                      ))}
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

        {/* RIGHT: Quick actions & metadata */}
        <aside className={clsx("lg:col-span-3 p-4 rounded-2xl space-y-4 h-fit", isDark ? "bg-black/30 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-1 flex items-center gap-2"><Hash /> Quick Actions</div>
            <div className="text-xs opacity-60 mb-3">Actions for the selected ayah or dataset</div>

            <div className="grid grid-cols-1 gap-2">
              <motion.button whileTap={{ scale: 0.98 }} className="w-full text-left">
                <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={() => copyAyah()}><Copy /> <span className="ml-2">Copy Ayah</span></Button>
              </motion.button>

              <Button variant="outline" className="cursor-pointer" onClick={() => downloadAyahJSON()}><Download /> <span className="ml-2">Download Ayah (JSON)</span></Button>

              <Button variant="outline" className="cursor-pointer" onClick={() => downloadFullJSON()}><Download /> <span className="ml-2">Download Full JSON</span></Button>

              <Button variant="ghost" className="cursor-pointer" onClick={() => { if (currentSurah()) { const url = `${ENDPOINT}`; window.open(url, "_blank"); } }}><ExternalLink /> <span className="ml-2">Open API Endpoint</span></Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-1">Selected</div>
            <div className="text-xs opacity-60 mb-2">Current surah & ayah metadata</div>
            <div className="text-sm">
              <div className="mb-2"><span className="font-medium">Surah:</span> {currentSurah()?.englishName ?? "—"} ({currentSurah()?.number ?? "—"})</div>
              <div className="mb-2"><span className="font-medium">Ayah:</span> {currentAyah()?.numberInSurah ?? "—"} • Global #{currentAyah()?.number ?? "—"}</div>
              <div className="mb-2"><span className="font-medium">Juz:</span> {currentAyah()?.juz ?? "—"}</div>
              <div className="mb-2"><span className="font-medium">Page:</span> {currentAyah()?.page ?? "—"}</div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-1">About this API</div>
            <div className="text-xs opacity-60 break-words">Endpoint: <span className="block break-words">{ENDPOINT}</span></div>
            <div className="mt-2 text-xs opacity-60">Translation: Muhammad Asad (en.asad). No API key required.</div>
          </div>
        </aside>
      </main>

      {/* Ayah dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BookOpen /> {currentSurah()?.englishName ?? "Ayah"}</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "70vh", overflow: "auto", padding: 24 }}>
            <div className="text-xl font-semibold mb-3">{currentSurah()?.englishName} — Ayah {currentAyah()?.numberInSurah}</div>
            <div className="text-lg leading-relaxed mb-6">{currentAyah()?.text}</div>

            <div className="text-sm opacity-60">
              <div>Global number: {currentAyah()?.number}</div>
              <div>Juz: {currentAyah()?.juz}</div>
              <div>Page: {currentAyah()?.page}</div>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Translation: Muhammad Asad</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { if (currentSurah()) window.open(ENDPOINT, "_blank"); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
