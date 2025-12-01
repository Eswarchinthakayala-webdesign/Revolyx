// src/pages/PeriodicTablePage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Info,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  ImageIcon,
  List,
  Target,
  Zap,
  Atom,
  Grid,
  Sparkles,
  Menu,
  Check,
  RefreshCw,
  CopyCheck,
  Sidebar,
  Hash,
  Thermometer,
  Droplet,
  Calendar,
  Layers,
  FileText,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ALLELEMENTS from "@/data/PeriodicTableJSON.json";
import { useTheme } from "@/components/theme-provider";
import { ThreeDViewer } from "../components/ThreeDViewer";

/* shadcn-style sheet (mobile sidebar). If your repo uses a different sheet, adapt imports. */
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";

/* ============================
   Default embedded JSON data
   ============================ */
const ELEMENTS = ALLELEMENTS["elements"] || [];

/* ============================
   Helpers
   ============================ */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
function formatNumber(n) {
  if (n === null || n === undefined) return "—";
  if (typeof n === "number" && Math.abs(n) >= 1000) return n.toLocaleString();
  return String(n);
}

/* Small badge component */
function NumberBadge({ number, isDark }) {
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium",
        isDark ? "bg-white/6 text-white" : "bg-slate-50 text-slate-900",
        "shadow-sm border"
      )}
      style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : undefined }}
    >
      <Hash className="w-3 h-3 opacity-80" />
      <span>#{String(number ?? "—")}</span>
    </div>
  );
}

/* ============================
   Main Component
   ============================ */
export default function PeriodicTablePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // State
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentElement, setCurrentElement] = useState(ELEMENTS[0] ?? null);
  const [rawResp, setRawResp] = useState({ elements: ELEMENTS }); // simulated API response
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // copy animation state
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  const suggestTimer = useRef(null);

  // Derived list
  const elements = useMemo(() => rawResp?.elements || ELEMENTS, [rawResp]);

  /* Same-group elements for sidebar */
  const sameGroupElements = useMemo(() => {
    if (!currentElement?.group) return [];
    return elements
      .filter((el) => el.group === currentElement.group && el.number !== currentElement.number)
      .sort((a, b) => (a.number || 0) - (b.number || 0))
      .slice(0, 10);
  }, [elements, currentElement]);

  /* Search logic */
  function runSearch(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      setLoadingSuggest(false);
      return;
    }
    setLoadingSuggest(true);
    setTimeout(() => {
      const ql = q.trim().toLowerCase();
      const results = elements.filter(
        (el) =>
          (el.name && el.name.toLowerCase().includes(ql)) ||
          (el.symbol && el.symbol.toLowerCase().includes(ql)) ||
          (String(el.number) === ql)
      );
      setSuggestions(results.slice(0, 12));
      setLoadingSuggest(false);
    }, 180);
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => runSearch(v), 220);
  }

  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query.trim()) {
      setShowSuggest(true);
      runSearch(query);
      return;
    }
    if (suggestions.length > 0) {
      setCurrentElement(suggestions[0]);
      setShowSuggest(false);
    } else {
      runSearch(query);
      setShowSuggest(true);
    }
  }

  function chooseSuggestion(el) {
    setCurrentElement(el);
    setShowSuggest(false);
    setQuery(el.name);
  }

  function copyJSON() {
    if (!currentElement) return;
    navigator.clipboard?.writeText(prettyJSON(currentElement));
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  }

  function downloadJSON() {
    if (!currentElement) return;
    const blob = new Blob([prettyJSON(currentElement)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `element_${String(currentElement.number).padStart(3, "0")}_${(currentElement.symbol || currentElement.name).replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function refreshData() {
    // placeholder for re-fetching: here we just reassign to simulate refresh + small animation
    setRawResp((r) => ({ ...r }));
  }

  /* Close suggestions when clicking elsewhere */
  useEffect(() => {
    function onDocClick(e) {
      const target = e.target;
      const wrapper = document.querySelector("#periodic-search-wrapper");
      if (wrapper && !wrapper.contains(target)) {
        setShowSuggest(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  /* cleanup timers */
  useEffect(() => {
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  /* ============================
     Layout rendering
     ============================ */
  return (
    <div className={clsx("min-h-screen pb-10 p-4 md:p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Top header */}
      <header className="flex items-center flex-wrap justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          {/* Mobile menu button opens the sheet for group/quick-nav */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden p-2 cursor-pointer" aria-label="Open sidebar">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sidebar className="w-4 h-4" /> Group elements
                </SheetTitle>
                <div className="text-sm opacity-60">Elements in the same group</div>
              </SheetHeader>

              <div className="py-4 space-y-2">
                <ScrollArea className="h-[60vh]">
                  <div className="p-2 space-y-2">
                    {sameGroupElements.length === 0 && <div className="text-sm opacity-60 p-2">No related elements</div>}
                    {sameGroupElements.map((el) => (
                      <button
                        key={el.number}
                        onClick={() => { setCurrentElement(el); setSheetOpen(false); }}
                        className="w-full text-left p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-md border flex items-center justify-center font-semibold">{el.symbol}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{el.name}</div>
                          <div className="text-xs opacity-60">{el.number}</div>
                        </div>
                        <NumberBadge number={el.number} isDark={isDark} />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <SheetFooter className="p-4">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSheetOpen(false)} className="w-full"><X /> Close</Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className={clsx("text-2xl md:text-3xl font-extrabold tracking-tight")}>Element — Periodic Explorer</h1>
            <p className="text-xs opacity-70 max-w-xl">Browse chemical elements — search, preview models, export JSON.</p>
          </div>
        </div>

        {/* Search + actions */}
        <div className="flex items-center gap-3">
          <form id="periodic-search-wrapper" onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-2",
            isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-70" />
            <Input
              id="periodic-search-input"
              placeholder="Search elements — hydrogen, H, 1"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
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
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl",
              isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60 flex items-center gap-2"><Loader2 className="animate-spin" /> Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s.number || s.symbol || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md flex items-center justify-center border" style={{ background: isDark ? "#0b0b0b" : "#fff" }}>
                    <div className="text-lg font-semibold">{s.symbol || "—"}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-xs opacity-60 truncate">{s.category || s.block || "—"}</div>
                  </div>
                  <div className="text-xs opacity-60 text-right w-24">
                    <div>#{s.number ?? "—"}</div>
                    <div>{s.phase ?? s.phase}</div>
                  </div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left (desktop sidebar) */}
        <aside className="lg:col-span-3 hidden lg:block space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-start gap-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <div className="text-2xl font-bold">{currentElement?.symbol ?? "—"}</div>
                <div className="text-xs opacity-60">Atomic No. {currentElement?.number ?? "—"}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-sm font-semibold">{currentElement?.name ?? "Unknown"}</div>
                <div className="text-xs opacity-60">Period {currentElement?.period ?? "—"} • Group {currentElement?.group ?? "—"}</div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg overflow-hidden border p-3" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "#fbfbfd" }}>
                {/* image */}
                <div className="mb-3">
                  {currentElement?.image?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentElement.image.url} alt={currentElement.name} className="w-full h-40 object-cover rounded-md" />
                  ) : (
                    <div className="w-full h-40 rounded-md border flex items-center justify-center opacity-40">
                      <Atom />
                    </div>
                  )}
                </div>

                <div className="text-sm leading-relaxed">{currentElement?.summary ?? "No summary available."}</div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs opacity-60">Atomic Mass</div>
                    <div className="font-medium">{formatNumber(currentElement?.atomic_mass)}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-60">Phase</div>
                    <div className="font-medium">{currentElement?.phase ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs opacity-60">Density</div>
                    <div className="font-medium">{formatNumber(currentElement?.density)}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-60">Category</div>
                    <div className="font-medium">{currentElement?.category ?? "—"}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <Button variant="outline" className="w-full cursor-pointer" onClick={() => setDialogOpen(true)}><ImageIcon /> View Bohr / Model</Button>
                  <Button variant="ghost" className="w-full cursor-pointer" onClick={() => { if (currentElement?.source) window.open(currentElement.source, "_blank"); }}><ExternalLink /> Wikipedia / Source</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/80 border-zinc-200")}>
            <div className="text-sm font-semibold mb-2">Same group — quick list</div>
            <ScrollArea className="h-56 rounded-md border p-2">
              <div className="space-y-2">
                {sameGroupElements.length === 0 && <div className="text-sm opacity-60 p-2">No related elements</div>}
                {sameGroupElements.map((el) => (
                  <button
                    key={el.number}
                    onClick={() => setCurrentElement(el)}
                    className="w-full text-left p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-md border flex items-center justify-center font-semibold">{el.symbol}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{el.name}</div>
                      <div className="text-xs opacity-60">#{el.number}</div>
                    </div>
                    <NumberBadge number={el.number} isDark={isDark} />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </aside>

        {/* Center: main details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex flex-wrap items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">{currentElement?.name}</div>
                    <div className="text-sm opacity-60">{currentElement?.symbol}</div>
                    <div className="ml-2"><NumberBadge number={currentElement?.number} isDark={isDark} /></div>
                  </div>
                </CardTitle>
                <div className="text-xs opacity-60 flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1"><Layers className="w-4 h-4" /> Period {currentElement?.period ?? "—"}</div>
                  <div className="flex items-center gap-1"><Droplet className="w-4 h-4" /> {currentElement?.phase ?? "—"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { setCurrentElement(elements[0]); }} className="cursor-pointer"><Sparkles /> Default</Button>

              </div>
            </CardHeader>

            <CardContent>
              <div className="prose max-w-none">
                {/* Summary */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="md:w-1/3">
                    <div className="text-sm opacity-60 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Summary</div>
                    <div className="text-sm leading-relaxed">{currentElement?.summary ?? "No summary available."}</div>

                    <div className="mt-4 space-y-2">
                      <div className="text-xs opacity-60 flex items-center gap-2"><Thermometer className="w-4 h-4" /> Thermal properties</div>
                      <div className="text-sm">{formatNumber(currentElement?.molar_heat) ?? "—"} (molar heat)</div>
                      <div className="text-sm">{formatNumber(currentElement?.boil)} K (boiling) • {formatNumber(currentElement?.melt)} K (melting)</div>
                    </div>
                  </div>

                  <div className="md:flex-1">
                    {/* Grid of properties with icons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Hash className="w-4 h-4" /> Atomic number</div>
                        <div className="font-medium text-lg">{currentElement?.number ?? "—"}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Zap className="w-4 h-4" /> Electronegativity</div>
                        <div className="font-medium">{currentElement?.electronegativity_pauling ?? "—"}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Calendar className="w-4 h-4" /> Discovered / Named</div>
                        <div className="font-medium">{currentElement?.discovered_by ?? "—"}</div>
                        <div className="text-xs opacity-60">{currentElement?.named_by ?? ""}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Thermometer className="w-4 h-4" /> Phase / Density</div>
                        <div className="font-medium">{currentElement?.phase ?? "—"} • {formatNumber(currentElement?.density)}</div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Spectrum */}
                    <div>
                      <div className="text-xs opacity-60 mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Spectral image</div>
                      {currentElement?.spectral_img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={currentElement.spectral_img} alt={`${currentElement.name} spectrum`} className="w-full rounded-md max-h-48 object-contain border" />
                      ) : (
                        <div className="h-24 rounded-md border flex items-center justify-center opacity-40">No spectral image</div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Raw data / export */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="md:flex-1">
                    <div className="text-xs opacity-60 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Complete data (flattened)</div>
                    <ScrollArea className="h-48 rounded-md border p-3">
                      <pre className={clsx("text-xs break-words", isDark ? "text-zinc-200" : "text-zinc-900")}>
                        {prettyJSON(currentElement)}
                      </pre>
                    </ScrollArea>
                  </div>

           
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Right: quick utilities (mobile stacks under main automatically) */}
        <aside className={clsx("lg:col-span-3 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold">Quick actions</div>
                <div className="text-xs opacity-60">Utilities & export</div>
              </div>
              <div className="text-sm opacity-60">{currentElement?.symbol ?? "—"}</div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2">
              <button onClick={copyJSON} className="w-full inline-flex items-center gap-2 justify-center px-3 py-2 rounded-md border cursor-pointer">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />} <span>{copied ? "Copied" : "Copy element JSON"}</span>
              </button>

              <Button variant="outline" className="w-full cursor-pointer" onClick={() => downloadJSON()}><Download /> Download JSON</Button>

              <Button
                variant="ghost"
                className="w-full cursor-pointer"
                onClick={() => { if (currentElement?.bohr_model_3d) setModelDialogOpen(true); else alert("No 3D model"); }}
              >
                <Atom /> Open 3D model
              </Button>

              <Button variant="ghost" className="w-full cursor-pointer" onClick={() => { if (currentElement?.bohr_model_image) window.open(currentElement.bohr_model_image, "_blank"); else alert("No model image"); }}><ImageIcon /> View Bohr image</Button>

              <Button variant="ghost" className="w-full cursor-pointer" onClick={() => { if (currentElement?.source) window.open(currentElement.source, "_blank"); else alert("No source"); }}><ExternalLink /> Open source</Button>
            </div>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/80 border-zinc-200")}>
            <div className="text-sm font-semibold mb-2">About this dataset</div>
            <div className="text-xs opacity-60 space-y-2">
              <div>• Property-first layout with quick export & model preview.</div>
              <div>• Responsive: sidebar on desktop, sheet on mobile.</div>
              <div>• Theme: light & dark with consistent surfaces and icons.</div>
            </div>
          </Card>
        </aside>
      </main>

      {/* Image / model dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{currentElement?.name ?? "Model"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            {currentElement?.bohr_model_image || currentElement?.image?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentElement?.bohr_model_image || currentElement?.image?.url} alt={currentElement?.name} className="h-100" />
            ) : (
              <div className="h-full flex items-center justify-center">No model or image available</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Bohr model / element image</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (currentElement?.bohr_model_3d) window.open(currentElement.bohr_model_3d, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ThreeDViewer
        open={modelDialogOpen}
        onOpenChange={setModelDialogOpen}
        modelUrl={currentElement?.bohr_model_3d}
        elementName={currentElement?.name}
        isDark={isDark}
      />
    </div>
  );
}

/* Small fallback icon (if X not imported elsewhere) kept out — we already used X from lucide */
