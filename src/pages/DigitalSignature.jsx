import React, { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, 
  Type, 
  PenTool, 
  Eraser, 
  Check, 
  ChevronDown, 
  Sun, 
  Moon, 
  Palette,
  Image as ImageIcon,
  Grid,
  Maximize2
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTheme } from "../components/theme-provider";
import { Button } from "../components/ui/button";

// --- Utility: Tailwind Merger ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* ------------------------- COLOR THEMES ------------------------- */
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
  lime: ["#84cc16", "#a3e635", "#65a30d", "#bef264", "#ecfccb"],
  mint: ["#3eb489", "#70e1a1", "#1f9f75", "#a8f5c3", "#e0fff1"],
  turquoise: ["#14c8c8", "#3be0e0", "#089b9b", "#88eded", "#ccffff"],
  aqua: ["#00ffff", "#33ffff", "#00cccc", "#66ffff", "#ccffff"],
  sapphire: ["#0f52ba", "#2563eb", "#1e40af", "#60a5fa", "#93c5fd"],
  lavender: ["#b57edc", "#c084fc", "#a855f7", "#d8b4fe", "#f3e8ff"],
  magenta: ["#d946ef", "#e879f9", "#a21caf", "#f0abfc", "#fae8ff"],
  coral: ["#fb6f5f", "#fca5a5", "#dc2626", "#fecaca", "#fee2e2"],
  peach: ["#ffb997", "#ff9478", "#ff6f61", "#ffc9b9", "#ffe5dc"],
  gold: ["#facc15", "#fbbf24", "#ca8a04", "#fde68a", "#fef9c3"],
  bronze: ["#b08d57", "#cd9a6d", "#8c6239", "#e0b589", "#f4e1c1"],
  brown: ["#92400e", "#b45309", "#78350f", "#f59e0b", "#ffedd5"],
  midnight: ["#1e1b4b", "#312e81", "#1e3a8a", "#4338ca", "#6366f1"],
  neutral: ["#737373", "#a3a3a3", "#525252", "#d4d4d4", "#f5f5f5"],
  neon: ["#39ff14", "#7fff00", "#00ffcc", "#cc00ff", "#ff00aa"],
  navy: ["#1e3a8a", "#1d4ed8", "#172554", "#3b82f6", "#93c5fd"],
  copper: ["#b87333", "#c87a4b", "#a65e2e", "#d29572", "#f1d3b2"],
  silver: ["#c0c0c0", "#d1d5db", "#9ca3af", "#e5e7eb", "#f9fafb"],
  neonGreen: ["#39ff14", "#66ff66", "#00ff00", "#aaffaa", "#ccffcc"],
  neonBlue: ["#00f0ff", "#33ffff", "#009dff", "#80eaff", "#ccf7ff"],
  neonPink: ["#ff00ff", "#ff66ff", "#ff33cc", "#ff99ff", "#ffe6ff"],
  neonPurple: ["#b026ff", "#c266ff", "#8a2be2", "#d6a6ff", "#f0e6ff"],
  neonCyan: ["#00ffff", "#40e0d0", "#00bfff", "#80ffff", "#e0ffff"],
  neonOrange: ["#ff6e00", "#ff9933", "#ff4500", "#ffbb66", "#ffe0cc"],
  neonYellow: ["#faff00", "#ffff66", "#e6ff00", "#ffff99", "#ffffe6"],
  neonRed: ["#ff073a", "#ff3366", "#ff0040", "#ff8099", "#ffd6dd"],
  neonAqua: ["#00ffee", "#00ffcc", "#00e6b8", "#66fff0", "#ccfffa"],
  neonLime: ["#aaff00", "#ccff33", "#99e600", "#ddff99", "#f4ffe0"],
  neonTeal: ["#00ffbf", "#33ffd6", "#00cc99", "#99ffee", "#e6fffa"],
  neonRose: ["#ff1493", "#ff66b2", "#ff3385", "#ffa6cc", "#ffe6f0"],
  neonViolet: ["#bf00ff", "#d966ff", "#9900cc", "#e6b3ff", "#f7e6ff"],
  neonGold: ["#ffd700", "#ffef5a", "#ffcc00", "#fff27a", "#fff9cc"],
};

const SIGNATURE_FONTS = [
  // Original 20
  "Great Vibes", "Dancing Script", "Pacifico", "Sacramento", 
  "Parisienne", "Cookie", "Yellowtail", "Rochester", 
  "Allura", "Tangerine", "Mrs Saint Delafield", "Pinyon Script", 
  "Italianno", "Herr Von Muellerhoff", "Mr De Haviland", "Alex Brush", 
  "Qwigley", "Ruthie", "WindSong", "Monsieur La Doulaise",
  
  // 20 New Additions
  "Arizonia", "Birthstone", "Bonbon", "Cherish", 
  "Comforter Brush", "Ephesis", "Fleur De Leah", "Gideon Roman", 
  "Grey Qo", "Imperial Script", "Island Moments", "Jim Nightshade", 
  "Mea Culpa", "Meddon", "Miss Fayette", "MonteCarlo", 
  "Mr Bedfort", "Petemoss", "Puppert", "Updock"
];

// --- Mock Shadcn UI Components ---
const Select = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
      >
        <span className="capitalize">{value || placeholder}</span>
        <ChevronDown size={16} className="opacity-50" />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <div 
                key={opt} 
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-900 capitalize"
              >
                {opt}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- Helper: Generate SVG Path from Stroke Data ---
const pointToPath = (points) => {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
};

// --- Main Application ---
export default function DigitalSignatureApp() {
  const [activeTab, setActiveTab] = useState("draw");
  const [textInput, setTextInput] = useState("John Doe");
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);
  
  // Theme State
  const [themeFamily, setThemeFamily] = useState("slate");
  const [signatureColor, setSignatureColor] = useState(COLOR_THEMES["slate"][4]);
  
  // Background State
  const [bgType, setBgType] = useState("transparent");
  const [customBgColor, setCustomBgColor] = useState("#ffffff");

  // Refs
  const sigPadRef = useRef(null);
  
  const { theme } = useTheme();
   const isDark =
     theme === "dark" ||
     (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Load Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${SIGNATURE_FONTS.join("&family=").replace(/ /g, "+")}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    setSignatureColor(COLOR_THEMES[themeFamily][2]);
  }, [themeFamily]);

  // --- Logic: Export Handling ---
  const handleExport = (format) => {
    const width = 800; // Standardize export width
    const height = 400; // Standardize export height
    
    // Determine Background Color
    let finalBg = "transparent";
    if (bgType === "white") finalBg = "#ffffff";
    else if (bgType === "black") finalBg = "#000000";
    else if (bgType === "custom") finalBg = customBgColor;

    // --- 1. SVG EXPORT ---
    if (format === "svg") {
      let svgContent = "";
      
      if (activeTab === "draw") {
        // DRAW MODE SVG: Convert strokes to paths
        const data = sigPadRef.current.toData(); // Get raw point data
        const paths = data.map((stroke) => {
             // Simple bezier curve approximation or straight lines
             // Note: react-signature-canvas stores points. We create a simple path.
             // For production perfect curves, we'd need bezier calculations, but simple Lines are robust for SVG export.
             return `<path d="${pointToPath(stroke.points)}" stroke="${signatureColor}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
        }).join("\n");
        
        svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            ${bgType !== "transparent" ? `<rect width="100%" height="100%" fill="${finalBg}"/>` : ""}
            ${paths}
          </svg>
        `;
      } else {
        // TYPE MODE SVG: Create text element
        svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
             <style>
               @import url('https://fonts.googleapis.com/css2?family=${selectedFont.replace(/ /g, "+")}&display=swap');
             </style>
            ${bgType !== "transparent" ? `<rect width="100%" height="100%" fill="${finalBg}"/>` : ""}
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="'${selectedFont}', cursive" font-size="60" fill="${signatureColor}">
              ${textInput}
            </text>
          </svg>
        `;
      }
      
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "svg");
    } 
    
    // --- 2. PNG/JPEG EXPORT ---
    else {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // Fill Background
      if (bgType !== "transparent") {
        ctx.fillStyle = finalBg;
        ctx.fillRect(0, 0, width, height);
      }

      if (activeTab === "draw") {
        // Draw Mode: Draw the signature pad canvas onto our export canvas
        const sigCanvas = sigPadRef.current.getCanvas();
        ctx.drawImage(sigCanvas, 0, 0, width, height);
        triggerDownload(canvas.toDataURL(`image/${format}`), format);
      } else {
        // Type Mode: Draw text manually onto canvas
        // Wait for font to load slightly to ensure it renders correctly (rare edge case handling)
        document.fonts.load(`100px "${selectedFont}"`).then(() => {
          ctx.font = `100px "${selectedFont}"`;
          ctx.fillStyle = signatureColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(textInput, width / 2, height / 2);
          triggerDownload(canvas.toDataURL(`image/${format}`), format);
        });
      }
    }
  };

  const triggerDownload = (url, ext) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `signature-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearPad = () => sigPadRef.current?.clear();

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-300")}>
      
      {/* Header */}
    {/* Header */}
<header className="sticky top-0 z-30 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-black/60">
  <div className="mx-auto max-w-8xl px-4 sm:px-6 h-14 flex items-center justify-between">
    
    {/* Brand */}
     <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">Sign FLow</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Digital Signature • PNG & JPG • More
            </p>
          </div>

  </div>
</header>


      <main className="max-w-8xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Controls */}
<div className="lg:col-span-3 space-y-6">

  {/* ================= Mode Tabs ================= */}
  <div className="flex rounded-xl border border-border bg-background p-1">
    {[
      { id: "draw", label: "Draw", icon: PenTool },
      { id: "type", label: "Type", icon: Type },
    ].map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        onClick={() => setActiveTab(id)}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors",
          activeTab === id
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon size={16} />
        {label}
      </button>
    ))}
  </div>

  {/* ================= Ink Color ================= */}
  <section className="rounded-2xl border border-border bg-background p-5 space-y-4">
    <header className="flex items-center justify-between">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Palette size={16} />
        Ink Color
      </h3>
    </header>

    <div className="space-y-3">
      <Select
        placeholder="Theme"
        options={Object.keys(COLOR_THEMES)}
        value={themeFamily}
        onChange={setThemeFamily}
      />

      <div className="flex flex-wrap justify-between gap-2 rounded-lg  p-2">
        {COLOR_THEMES[themeFamily]?.map((color) => (
          <button
            key={color}
            onClick={() => setSignatureColor(color)}
            aria-label={`Select ${color}`}
            className={cn(
              "h-8 w-8 rounded-full cursor-pointer border transition-all",
              signatureColor === color
                ? "border-foreground scale-110"
                : "border-transparent hover:scale-105"
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  </section>

  {/* ================= Background ================= */}
  <section className="rounded-2xl border border-border bg-background p-5 space-y-4">
    <h3 className="text-sm font-semibold flex items-center gap-2">
      <ImageIcon size={16} />
      Background
    </h3>

    <div className="grid grid-cols-4 gap-2">
      {[
        { id: "transparent", label: "None", icon: Grid },
        { id: "white", label: "White", color: "#fff" },
        { id: "black", label: "Black", color: "#000" },
        { id: "custom", label: "Custom", icon: Palette },
      ].map((bg) => (
        <button
          key={bg.id}
          onClick={() => setBgType(bg.id)}
          className={cn(
            "h-16 rounded-xl border cursor-pointer text-xs font-medium flex flex-col items-center justify-center gap-1 transition",
            bgType === bg.id
              ? "border-foreground bg-muted"
              : "border-border hover:border-foreground/40"
          )}
        >
          {bg.icon ? (
            <bg.icon size={16} />
          ) : (
            <span
              className="h-4 w-4 rounded-full border"
              style={{ backgroundColor: bg.color }}
            />
          )}
          {bg.label}
        </button>
      ))}
    </div>

    <AnimatePresence>
      {bgType === "custom" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 rounded-lg bg-muted p-2">
            <input
              type="color"
              value={customBgColor}
              onChange={(e) => setCustomBgColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <span className="font-mono text-xs text-muted-foreground">
              {customBgColor}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </section>

  {/* ================= Export ================= */}
  <section className="space-y-3">
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      Export
    </p>
    
    <Button
      onClick={() => handleExport("png")}
      className="w-full rounded-xl bg-foreground cursor-pointer text-background py-3 font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
    >
      <Download size={18} />
      Download PNG
    </Button>

    <Button
      variant="outline"
      onClick={() => handleExport("jpeg")}
      className="w-full cursor-pointer rounded-xl border border-border py-3 text-sm font-medium  transition"
    >
      Download JPG
    </Button>
  </section>
</div>


        {/* RIGHT COLUMN: Canvas / Preview */}
    <div className="lg:col-span-9 space-y-8">
  {/* ================= Preview Container ================= */}
  <div className="relative group">
    {/* Label */}
    <div className="absolute -top-3 left-4 z-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
      Preview
    </div>

    <div
      className="relative flex min-h-[360px] resize-y flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-sm"
      style={{ height: "480px" }}
    >
      {/* Toolbar */}
      <div className="flex h-12 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Maximize2 className="h-3.5 w-3.5" />
          Resize preview
        </div>

        {activeTab === "draw" && (
          <button
            onClick={clearPad}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Canvas / Preview Area */}
 <div className={cn("flex-1 relative transition-colors duration-300 w-full h-full", bgType === 'transparent' && "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/50" )} style={{ backgroundColor: bgType === 'custom' ? customBgColor : bgType === 'white' ? '#fff' : bgType === 'black' ? '#000' : 'transparent' }} >
        {activeTab === "draw" ? (
          <SignatureCanvas
            ref={sigPadRef}
            penColor={signatureColor}
            canvasProps={{
              className:
                "h-full w-full cursor-crosshair touch-none block",
            }}
            backgroundColor="rgba(0,0,0,0)"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center">
            <p
              style={{
                fontFamily: selectedFont,
                color: signatureColor,
                fontSize: "clamp(2.5rem, 6vw, 6rem)",
                lineHeight: 1,
              }}
              className="w-full break-words font-medium select-none"
            >
              {textInput || "Signature"}
            </p>
          </div>
        )}
      </div>

      {/* Resize Hint */}
      <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 transition group-hover:opacity-100">
        <div className="h-4 w-4 rounded-br border-b-2 border-r-2 border-zinc-400 dark:border-zinc-600" />
      </div>
    </div>
  </div>

  {/* ================= Type Controls ================= */}
  <AnimatePresence mode="wait">
    {activeTab === "type" && (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {/* Text Input */}
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-500">
            <Type className="h-5 w-5" />
          </div>

          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your name…"
            className="w-full bg-transparent text-lg font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
          />
        </div>

        {/* Font Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Font Style
            </h3>
            <span className="text-xs text-zinc-400">
              {SIGNATURE_FONTS.length} fonts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 max-h-[300px] overflow-y-auto pr-1">
            {SIGNATURE_FONTS.map((font) => (
              <button
                key={font}
                onClick={() => setSelectedFont(font)}
                className={cn(
                  "flex h-14 items-center justify-center cursor-pointer rounded-lg border px-3 transition-all",
                  selectedFont === font
                    ? "border-black dark:border-white ring-1  ring-black dark:ring-white"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                )}
              >
                <span
                  style={{ fontFamily: font }}
                  className="truncate text-lg text-zinc-700 dark:text-zinc-300"
                >
                  Signature
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>

      </main>
      
      {/* CSS for custom scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
        }
      `}</style>
    </div>
  );
}