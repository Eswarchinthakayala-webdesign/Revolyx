// src/pages/FlowchartPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import mermaid from "mermaid";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import { toPng } from "html-to-image";  
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Copy,
  Loader2,
  Send,
  Download,
  Search as SearchIcon,
  List,
  Palette as PaletteIcon,
  Menu as MenuIcon,
  X,
  Zap,
  Heart as HeartIcon,
  Filter as FilterIcon,
} from "lucide-react";

/* shadcn ui - import individual components */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import FlowchartSidebar from "../components/FlowchartSidebar";
import { useTheme } from "../components/theme-provider";
import { FlowchartShowcase } from "../components/FlowchartShowcase";
import { FlowchartGrid } from "../components/FlowchartGrid";
import { BUILT_IN_FLOWCHARTS } from "../data/BuitInFlowCharts";

/* local UI helpers (if you have them) removed for portability */

/* -------------------- COLOR THEMES -------------------- */
const COLOR_THEMES = {
  zinc: ["#71717a", "#a1a1aa", "#27272a", "#52525b", "#3f3f46"],
  gray: ["#9ca3af", "#4b5563", "#6b7280", "#374151", "#1f2937"],
  slate: ["#64748b", "#94a3b8", "#334155", "#475569", "#1e293b"],
  stone: ["#78716c", "#a8a29e", "#57534e", "#44403c", "#292524"],
  orange: ["#f97316", "#fb923c", "#ea580c", "#fdba74", "#ffedd5"],
  green: ["#22c55e", "#4ade80", "#16a34a", "#86efac", "#dcfce7"],
  emerald: ["#10b981", "#34d399", "#059669", "#6ee7b7", "#a7f3d0"],
  teal: ["#14b8a6", "#2dd4bf", "#0d9488", "#5eead4", "#99f6e4"],
  cyan: ["#06b6d4", "#22d3ee", "#0891b2", "#67e8f9", "#a5f3fc"],
  sky: ["#0ea5e9", "#38bdf8", "#0284c7", "#7dd3fc", "#bae6fd"],
  blue: ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd", "#bfdbfe"],
  indigo: ["#6366f1", "#818cf8", "#4f46e5", "#a5b4fc", "#c7d2fe"],
  violet: ["#8b5cf6", "#a78bfa", "#7c3aed", "#c4b5fd", "#ddd6fe"],
  purple: ["#9333ea", "#a855f7", "#7e22ce", "#d8b4fe", "#f3e8ff"],
  pink: ["#ec4899", "#f472b6", "#db2777", "#f9a8d4", "#fce7f3"],
  rose: ["#f43f5e", "#fb7185", "#e11d48", "#fecdd3", "#ffe4e6"],
  red: ["#ef4444", "#f87171", "#dc2626", "#fca5a5", "#fee2e2"],
  yellow: ["#eab308", "#facc15", "#ca8a04", "#fde047", "#fef9c3"],
  amber: ["#f59e0b", "#fbbf24", "#d97706", "#fcd34d", "#fef3c7"],
};

/* -------------------- 30+ BUILT-IN FLOWCHARTS --------------------
   Each entry includes name, category, description and mermaid code.
   (All use 'flowchart TD' format.)
*/



/* -------------------- Mermaid Initialization -------------------- */
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "Inter, system-ui, sans-serif",
});

/* -------------------- Utilities -------------------- */
function groupAlphabetically(list) {
  const map = {};
  list.forEach((it) => {
    const letter = (it.name && it.name[0]) ? it.name[0].toUpperCase() : "#";
    if (!map[letter]) map[letter] = [];
    map[letter].push(it);
  });
  // sort letters
  return Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
}

function injectThemeIntoMermaid(code, colors = ["#3b82f6"]) {
  const [primary] = colors;
  const initBlock = `%%{init: { "themeVariables": { "primaryColor": "${primary}", "edgeLabelBackground": "#fff", "lineColor": "${primary}" } } }%%\n`;
  return initBlock + code;
}
async function downloadPng() {
  if (!chartRef.current) return toast.error("No chart to download");

  const svgElement = chartRef.current.querySelector("svg");
  if (!svgElement) return toast.error("SVG not rendered yet");

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${selected.name.replace(/\s+/g, "_")}.png`;
      a.click();
      toast.success("PNG downloaded");
    }, "image/png");
  };
  img.onerror = () => toast.error("Failed to generate PNG");
  img.src = url;
}


/* -------------------- The Page Component -------------------- */
export default function FlowchartPage() {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false); // hidden by default
  const [sortMode, setSortMode] = useState("asc");
  const [paletteName, setPaletteName] = useState("blue");
  const [subPaletteIdx, setSubPaletteIdx] = useState(0);
  const [palette, setPalette] = useState(COLOR_THEMES.blue.slice());
  const [selectedId, setSelectedId] = useState(BUILT_IN_FLOWCHARTS[0].id);
  const [favorites, setFavorites] = useState(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [themes, setThemes] = useState("default");
  const chartRef = useRef(null);
  const searchRef = useRef(null);
  
   const {theme}=useTheme()
     const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    // keep palette in sync with paletteName
    setPalette(COLOR_THEMES[paletteName] ? COLOR_THEMES[paletteName].slice() : COLOR_THEMES.blue.slice());
  }, [paletteName]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = BUILT_IN_FLOWCHARTS.filter((d) => {
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || (d.category || "").toLowerCase().includes(q);
    });
    arr = arr.sort((a, b) => (sortMode === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    return arr;
  }, [query, sortMode]);

  const grouped = useMemo(() => groupAlphabetically(filtered), [filtered]);

  const selected = useMemo(() => BUILT_IN_FLOWCHARTS.find(d => d.id === selectedId) || BUILT_IN_FLOWCHARTS[0], [selectedId]);

  // Render mermaid into chartRef whenever selected, palette or theme changes
// Render mermaid into chartRef whenever selected, palette or theme changes
useEffect(() => {
  if (!selected || !chartRef.current) return;

  // pick a single color subset
  const activeColor = palette[subPaletteIdx % palette.length];
  const themedCode = injectThemeIntoMermaid(selected.code, [activeColor]);

  const container = chartRef.current;
  container.innerHTML = "";

  try {
    const id = "mermaid-" + Math.random().toString(36).slice(2, 9);
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: isDark ? "dark" : "default",
    });

    mermaid.render(id, themedCode).then(({ svg }) => {
      container.innerHTML = svg;
       const svgEl = container.querySelector("svg");
          if (svgEl) {
            svgEl.removeAttribute("height");
            svgEl.removeAttribute("width");
            svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
            svgEl.style.width = "100%";
            svgEl.style.height = "100%";
          }
    }).catch((err) => {
      console.error("Mermaid render error:", err);
      container.innerHTML = `<pre style="color:var(--muted)">${err?.str || err?.message || "Mermaid render error"}</pre>`;
      toast.error("Failed to render chart");
    });
  } catch (e) {
    console.error("Mermaid exception:", e);
    toast.error("Invalid Mermaid syntax");
  }
}, [selected, subPaletteIdx, theme]);


  function selectChart(id) {
    setSelectedId(id);
    // smooth scroll to top (like spinner page)
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Selected: " + (BUILT_IN_FLOWCHARTS.find(c => c.id === id)?.name || id));
  }

  function toggleFavorite(id) {
    setFavorites(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  function copySource() {
    const code = selected.code;
    navigator.clipboard.writeText(code).then(() => toast.success("Source copied to clipboard"));
  }

  function downloadSvg() {
    if (!chartRef.current) return toast.error("Nothing to download");
    const svg = chartRef.current.innerHTML;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.name.replace(/\s+/g, "_")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("SVG downloaded");
  }


  // AI generation calling Gemini — optional and requires a valid env var in Vite
  async function generateWithAI(prompt) {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      toast.error("Missing Gemini API key (VITE_GEMINI_API_KEY)");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Enter a prompt");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Generate valid Mermaid flowchart code in "flowchart TD" format for this prompt. Return only pure mermaid code (no backticks):\n\n${prompt}`
                }
              ]
            }
          ]
        })
      });
      const data = await res.json();
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      text = text.replace(/```mermaid/gi, "").replace(/```/g, "").trim();
      if (!text.startsWith("flowchart")) {
        toast.error("AI did not return valid mermaid code");
        console.log("AI response:", text);
      } else {
        // create a new temporary built-in (or set as selected AI)
        const newId = "ai-" + Math.random().toString(36).slice(2, 9);
        const aiEntry = { id: newId, name: "AI: " + prompt.slice(0, 30), category: "AI", description: prompt, code: text };
        BUILT_IN_FLOWCHARTS.unshift(aiEntry); // add to front
        setSelectedId(newId);
        toast.success("AI flowchart generated");
        setDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("AI generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  // Palette editor actions
  function setThemePalette(key) {
    if (COLOR_THEMES[key]) {
      setPaletteName(key);
      setPalette(COLOR_THEMES[key].slice());
      toast.success(`Palette ${key} applied`);
    }
  }

  function addColor(hex) {
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
      toast.error("Invalid color");
      return;
    }
    setPalette(p => [...p, hex]);
    toast.success("Color added");
  }

  function removeColor(idx) {
    setPalette(p => p.filter((_, i) => i !== idx));
  }

  function updateColor(idx, value) {
    setPalette(p => p.map((c, i) => i === idx ? value : c));
  }

  const snapshotPNG = async () => {
    const node = document.querySelector(".snapshot");
    if (!node) {
      toast.error("Snapshot target not found");
      return;
    }

    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: isDark?"#000":"#fff",
        quality: 1,
      });
      const link = document.createElement("a");
      link.download = `snapshot-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Snapshot saved!");
    } catch (error) {
      console.error("Snapshot failed:", error);
      toast.error("Failed to capture snapshot");
    }}


  /* Layout: follow spinnersPage: main container max-w-8xl, grid with 4 cols on lg:
     left: sidebar (col 1)
     middle+right: main preview + gallery (col-span-3)
     inside main: large preview + controls + source code
  */

  return (
    <div className="min-h-screen overflow-hidden max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <div className="">
        {/* Header */}
        <header className="flex flex-row flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">Revolyx Flowchart</h1>
            <p className="text-sm opacity-80 mt-1">Browse, preview and customize flowcharts .</p>
          </div>

          <div className="flex items-center gap-3">
         

            <Select value={paletteName} onValueChange={(v) => setThemePalette(v)}>
              <SelectTrigger className="w-44 cursor-pointer">
                <SelectValue placeholder="Palette" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(COLOR_THEMES).map(k => (
                  <SelectItem  className="cursor-pointer" key={k} value={k}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-5 rounded-sm" style={{ background: `linear-gradient(90deg, ${COLOR_THEMES[k].join(",")})` }} />
                      <div className="text-sm">{k}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline"  className="cursor-pointer" onClick={() => setDialogOpen(true)}><SparklesIconFallback /> Generate with AI</Button>

          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left column: sidebar */}
          <aside className="lg:col-span-1 max-h-screen">
       <FlowchartSidebar
        filtered={filtered}
        grouped={grouped}
        sortMode={sortMode}
        setSortMode={setSortMode}
        query={query}
        setQuery={setQuery}
        showSuggestions={showSuggestions}
        setShowSuggestions={setShowSuggestions}
        selectChart={selectChart}
        selectedId={selectedId}
      />
          </aside>

          {/* Middle + Right: preview and gallery */}
          <section className="lg:col-span-3 space-y-4">
            {/* Preview card */}
     <FlowchartShowcase
  selected={selected}
  favorites={favorites}
  toggleFavorite={toggleFavorite}
  copySource={copySource}
  downloadSvg={downloadSvg}
  snapshotPNG={downloadPng}  // ✅ use the new PNG function
  palette={palette}
  paletteName="Custom Palette"
  subPaletteIdx={subPaletteIdx}
  setSubPaletteIdx={setSubPaletteIdx}
  isDark={isDark}
  chartRef={chartRef}
  addColor={addColor}
  removeColor={removeColor}
  updateColor={updateColor}
  themes={themes}
  setThemes={setThemes}
/>


            {/* Gallery (remaining designs) */}
          <Card>
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <List className="w-4 h-4" /> Gallery
      </span>
      <div className="flex items-center gap-2">
        <Badge>{filtered.length}</Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setQuery("");
            setSortMode("asc");
            toast("Reset filters");
          }}
        >
          <FilterIcon className="w-4 h-4" />
        </Button>
      </div>
    </CardTitle>
  </CardHeader>
  <CardContent>
    
      <FlowchartGrid
        filtered={filtered}
        selectedId={selectedId}
        selectChart={selectChart}
        isDark={isDark}
      />
    
  </CardContent>
</Card>

          </section>
        </main>
      </div>

      {/* AI dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Flowchart with AI</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Label>Describe the flowchart you'd like</Label>
            <Input placeholder="e.g. User registration with email confirmation" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
          </div>

          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="cursor-pointer" onClick={() => generateWithAI(aiPrompt)} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />} Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------- tiny fallbacks for icons used inline (to avoid import mismatch) -------------------- */
function SparklesIconFallback() { return <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l1.9 4.9L18 9l-4 1 4 1-3.9 1.1L12 21l-1.1-4.9L7 15l4-1-4-1 4.1-1.1L12 3z" /></svg>; }
function PlusIconFallback() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" /></svg>; }
