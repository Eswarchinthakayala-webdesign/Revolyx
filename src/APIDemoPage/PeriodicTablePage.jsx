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
  Sparkles
} from "lucide-react";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ALLELEMENTS from "@/data/PeriodicTableJSON.json"
import { useTheme } from "@/components/theme-provider";
import { ThreeDViewer } from "../components/ThreeDViewer";


/* ============================
   Default embedded JSON data
   Replace/extend ELEMENTS with API response if needed
   ============================ */
const ELEMENTS = ALLELEMENTS["elements"]

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

  const suggestTimer = useRef(null);

  // Derived list (in case you later set rawResp from real API)
  const elements = useMemo(() => rawResp?.elements || ELEMENTS, [rawResp]);

  /* Search logic: simple client-side fuzzy search for now */
  function runSearch(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      setLoadingSuggest(false);
      return;
    }
    setLoadingSuggest(true);
    // Simulate quick async search — filter by name or symbol
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
      // no-op if empty
      setShowSuggest(true);
      runSearch(query);
      return;
    }
    // if suggestions present, pick the first match as "selected search"
    if (suggestions.length > 0) {
      setCurrentElement(suggestions[0]);
      setShowSuggest(false);
    } else {
      // try broad search
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

  /* Effect: ensure suggestions list closes when clicking elsewhere */
  useEffect(() => {
    function onDocClick(e) {
      // close suggestions if click outside search container
      const target = e.target;
      const wrapper = document.querySelector("#periodic-search-wrapper");
      if (wrapper && !wrapper.contains(target)) {
        setShowSuggest(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  /* Simple accessibility: focus search on mount (optional) */
  // useEffect(() => { document.querySelector("#periodic-search-input")?.focus(); }, []);

  /* ============================
     Layout rendering
     ============================ */
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold tracking-tight")}>Element — Periodic Explorer</h1>
          <p className="mt-1 text-sm opacity-70 max-w-xl">
            Browse chemical elements, view detailed properties, and explore models & spectra. Search by name, symbol or atomic number.
          </p>
        </div>

        {/* Search */}
        <div id="periodic-search-wrapper" className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-2",
              isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-70" />
            <Input
              id="periodic-search-input"
              placeholder="Search elements (name, symbol, number). Example: hydrogen, H, 1"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>

          {/* Default quick actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" onClick={() => setCurrentElement(elements[0])}><Target /> Default</Button>
            <Button variant="ghost" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); }}><Grid /> Reset</Button>
          </div>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl",
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

      {/* Main layout: left (image/meta), center (full details), right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: visual + essential metadata */}
        <aside className={clsx("lg:col-span-3 space-y-4")}>
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
                {/* element image */}
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
                    <div className="text-xs opacity-60">Density (g/L or g/cm³)</div>
                    <div className="font-medium">{formatNumber(currentElement?.density)}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-60">Category</div>
                    <div className="font-medium">{currentElement?.category ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs opacity-60">Electronegativity</div>
                    <div className="font-medium">{currentElement?.electronegativity_pauling ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-60">Electron Config.</div>
                    <div className="font-medium">{currentElement?.electron_configuration_semantic ?? currentElement?.electron_configuration ?? "—"}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <Button variant="outline" className="w-full" onClick={() => setDialogOpen(true)}><ImageIcon /> View Bohr / Model</Button>
                  <Button variant="ghost" className="w-full" onClick={() => { if (currentElement?.source) window.open(currentElement.source, "_blank"); }}><ExternalLink /> Wikipedia / Source</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center: full details (main reading area) */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Element Details</CardTitle>
                <div className="text-xs opacity-60">{currentElement?.name ?? "—"} • {currentElement?.symbol ?? "—"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { setCurrentElement(elements[0]); }}>{/* quick reset */} <Sparkles /> Default</Button>
                <Button variant="ghost" onClick={() => setShowSuggest((s) => !s)}><List /> Suggestions</Button>
                <Button variant="ghost" onClick={() => { setRawResp((r) => r); }}><Info /> Api</Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="prose max-w-none">
                <h2 className="!mt-0">{currentElement?.name} <span className="text-sm opacity-60">{currentElement?.symbol}</span></h2>

                <p className="text-sm leading-relaxed">{currentElement?.summary}</p>

                <Separator className="my-4" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs opacity-60">Discovered by</div>
                      <div className="font-medium">{currentElement?.discovered_by ?? "—"}</div>
                    </div>

                    <div>
                      <div className="text-xs opacity-60">Named by</div>
                      <div className="font-medium">{currentElement?.named_by ?? "—"}</div>
                    </div>

                    <div>
                      <div className="text-xs opacity-60">Molar heat</div>
                      <div className="font-medium">{formatNumber(currentElement?.molar_heat)}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs opacity-60">Boiling point (K)</div>
                      <div className="font-medium">{formatNumber(currentElement?.boil)}</div>
                    </div>

                    <div>
                      <div className="text-xs opacity-60">Melting point (K)</div>
                      <div className="font-medium">{formatNumber(currentElement?.melt)}</div>
                    </div>

                    <div>
                      <div className="text-xs opacity-60">Ionization energies (eV)</div>
                      <div className="font-medium">{(currentElement?.ionization_energies || []).join(", ") || "—"}</div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <div className="text-xs opacity-60 mb-2">Spectral image</div>
                  {currentElement?.spectral_img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentElement.spectral_img} alt={`${currentElement.name} spectrum`} className="w-full rounded-md max-h-48 object-contain border" />
                  ) : (
                    <div className="h-24 rounded-md border flex items-center justify-center opacity-40">No spectral image</div>
                  )}
                </div>

                <Separator className="my-4" />

                <div>
                  <div className="text-xs opacity-60 mb-2">Complete data (flattened)</div>
                  <ScrollArea className="h-64 rounded-md border p-3">
                    <pre className={clsx("text-xs break-words", isDark ? "text-zinc-200" : "text-zinc-900")}>
                      {prettyJSON(currentElement)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions & utilities */}
        <aside className={clsx("lg:col-span-3 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Quick actions</div>
                <div className="text-xs opacity-60">Utilities & export</div>
              </div>
              <div className="text-sm opacity-60">#{currentElement?.number ?? "—"}</div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => { copyJSON(); /* silent */ }}><Copy /> Copy element JSON</Button>
              <Button variant="outline" className="w-full" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
           <Button
  variant="ghost"
  className="w-full"
  onClick={() => {
    if (currentElement?.bohr_model_3d) {
      setModelDialogOpen(true);
    }
  }}
>
  <Atom /> Open 3D model
</Button>

              <Button variant="ghost" className="w-full" onClick={() => { if (currentElement?.bohr_model_image) window.open(currentElement.bohr_model_image, "_blank"); else alert("No model image"); }}><ImageIcon /> View Bohr image</Button>
              <Button variant="ghost" className="w-full" onClick={() => { if (currentElement?.source) window.open(currentElement.source, "_blank"); else alert("No source"); }}><ExternalLink /> Open source</Button>
            </div>
          </Card>

          {/* Metadata / helpful tips */}
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/80 border-zinc-200")}>
            <div className="text-sm font-semibold mb-2">About this dataset</div>
            <div className="text-xs opacity-60 space-y-2">
              <div>• Built for clarity: property-first layout, large reading area.</div>
              <div>• Responsive: stacks on small screens, three-column layout on desktop.</div>
              <div>• Theme: light (white) & dark (black) with consistent surfaces.</div>
            </div>
          </Card>
        </aside>
      </main>

      {/* Image / model dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
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
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><XIconFallback /></Button>
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

/* Small fallback icon because we used X elsewhere above but not imported */
function XIconFallback() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
