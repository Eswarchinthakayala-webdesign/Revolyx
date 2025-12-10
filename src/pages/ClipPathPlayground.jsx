// src/pages/ClipPathPlayground.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Plus,
  Trash2,
  Shuffle,
  RotateCcw,
  GlassWater,
} from "lucide-react";
import { toPng } from "html-to-image";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { showToast } from "../lib/ToastHelper";
import { useTheme } from "../components/theme-provider";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 Updated ClipPathPlayground
 - Shows 4-images gallery on load (randomly picked)
 - Clicking preview or Shuffle button loads new 4 images and picks one to display
 - Thumbnails show the 4 images and can be clicked to set preview
 - Added gradient background mode and presets
 - All previous clip-path + export logic preserved
*/

// helper
const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT = {
  shape: "polygon",
  polygon: [
    { x: 10, y: 10 },
    { x: 90, y: 10 },
    { x: 80, y: 80 },
    { x: 20, y: 80 },
  ],
  inset: { top: 0, right: 0, bottom: 0, left: 0, radius: 0 },
  circle: { cx: 50, cy: 50, r: 40 },
  ellipse: { cx: 50, cy: 50, rx: 40, ry: 25 },
  // default mode will be 'images' and we will fill image set on mount
  bgMode: "images", // "images" | "gradient"
  // placeholder gradient default
  bgGradient: "linear-gradient(135deg,#06b6d4,#7c3aed,#ef4444)",
  watermark: true,
  scaleExport: 2,
};

// pool of images to pick from (Unsplash / Picsum). You can expand or replace with your own list.
const IMAGE_POOL = [
  "https://picsum.photos/1200/800?random=1",
  "https://picsum.photos/1200/800?random=2",
  "https://picsum.photos/1200/800?random=3",
  "https://picsum.photos/1200/800?random=4",
  "https://picsum.photos/1200/800?random=5",
  "https://picsum.photos/1200/800?random=6",
  "https://picsum.photos/1200/800?random=7",
  "https://picsum.photos/1200/800?random=8",
  "https://picsum.photos/1200/800?random=9",
  "https://picsum.photos/1200/800?random=10",
  "https://picsum.photos/1200/800?random=11",
  "https://picsum.photos/1200/800?random=12",
];

// presets
const PRESETS = [
  // --- Shapes from your images (image_d2b26e.jpg & image_d1d8b6.png) ---
  
  // Row 1
  { name: "Triangle", shape: "polygon", polygon: [{ x: 50, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }] },
  { name: "Trapezoid", shape: "polygon", polygon: [{ x: 20, y: 0 }, { x: 80, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }] },
  { name: "Parallelogram", shape: "polygon", polygon: [{ x: 25, y: 0 }, { x: 100, y: 0 }, { x: 75, y: 100 }, { x: 0, y: 100 }] },
  { name: "Rhombus", shape: "polygon", polygon: [{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }] },

  // Row 2
  { name: "Pentagon", shape: "polygon", polygon: [{ x: 50, y: 0 }, { x: 100, y: 38 }, { x: 81, y: 100 }, { x: 19, y: 100 }, { x: 0, y: 38 }] },
  { name: "Hexagon", shape: "polygon", polygon: [{ x: 25, y: 0 }, { x: 75, y: 0 }, { x: 100, y: 50 }, { x: 75, y: 100 }, { x: 25, y: 100 }, { x: 0, y: 50 }] },
  // Heptagon (7 sides) - approximate
  { name: "Heptagon", shape: "polygon", polygon: [{ x: 50, y: 0 }, { x: 89, y: 17 }, { x: 100, y: 56 }, { x: 75, y: 100 }, { x: 25, y: 100 }, { x: 0, y: 56 }, { x: 11, y: 17 }] },
  { name: "Octagon", shape: "polygon", polygon: [{ x: 30, y: 0 }, { x: 70, y: 0 }, { x: 100, y: 30 }, { x: 100, y: 70 }, { x: 70, y: 100 }, { x: 30, y: 100 }, { x: 0, y: 70 }, { x: 0, y: 30 }] },

  // Row 3
  // Nonagon (9 sides) - approximate
  { name: "Nonagon", shape: "polygon", polygon: [{ x: 50, y: 0 }, { x: 83, y: 11 }, { x: 99, y: 41 }, { x: 93, y: 73 }, { x: 67, y: 95 }, { x: 33, y: 95 }, { x: 7, y: 73 }, { x: 1, y: 41 }, { x: 17, y: 11 }] },
  // Decagon (10 sides) - approximate
  { name: "Decagon", shape: "polygon", polygon: [{ x: 50, y: 0 }, { x: 77, y: 11 }, { x: 96, y: 35 }, { x: 96, y: 65 }, { x: 77, y: 89 }, { x: 50, y: 100 }, { x: 23, y: 89 }, { x: 4, y: 65 }, { x: 4, y: 35 }, { x: 23, y: 11 }] },
  // Bevel (Corner cut) - approximate
  { name: "Bevel", shape: "polygon", polygon: [{ x: 0, y: 25 }, { x: 25, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }] },
  // Rabbet (L-shape cutout) - approximate
  { name: "Rabbet", shape: "polygon", polygon: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 75 }, { x: 75, y: 75 }, { x: 75, y: 100 }, { x: 0, y: 100 }] },

  // Row 4 (Arrows/Points)
  // Left arrow
  { name: "Left arrow", shape: "polygon", polygon: [{ x: 100, y: 20 }, { x: 30, y: 20 }, { x: 30, y: 0 }, { x: 0, y: 50 }, { x: 30, y: 100 }, { x: 30, y: 80 }, { x: 100, y: 80 }] },
  // Right arrow (already in previous code, renaming for consistency)
  { name: "Right arrow", shape: "polygon", polygon: [{ x: 0, y: 20 }, { x: 70, y: 20 }, { x: 70, y: 0 }, { x: 100, y: 50 }, { x: 70, y: 100 }, { x: 70, y: 80 }, { x: 0, y: 80 }] },
  // Left Point
  { name: "Left Point", shape: "polygon", polygon: [{ x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 50 }] },
  // Right Point
  { name: "Right Point", shape: "polygon", polygon: [{ x: 0, y: 0 }, { x: 0, y: 100 }, { x: 100, y: 50 }] },

  // Row 5 (Chevrons, Star, Cross)
  // Left Chevron
  { name: "Left Chevron", shape: "polygon", polygon: [{ x: 100, y: 0 }, { x: 100, y: 25 }, { x: 50, y: 50 }, { x: 100, y: 75 }, { x: 100, y: 100 }, { x: 0, y: 50 }] },
  // Right Chevron
  { name: "Right Chevron", shape: "polygon", polygon: [{ x: 0, y: 0 }, { x: 0, y: 25 }, { x: 50, y: 50 }, { x: 0, y: 75 }, { x: 0, y: 100 }, { x: 100, y: 50 }] },
  // Star (5-point) - already in previous code, adjusted for standard points
  { name: "Star", shape: "polygon", polygon: [{ x: 50, y: 0 }, { x: 61, y: 35 }, { x: 98, y: 35 }, { x: 68, y: 57 }, { x: 79, y: 91 }, { x: 50, y: 72 }, { x: 21, y: 91 }, { x: 32, y: 57 }, { x: 2, y: 35 }, { x: 39, y: 35 }] },
  // Cross (Plus shape)
  { name: "Cross", shape: "polygon", polygon: [{ x: 35, y: 0 }, { x: 65, y: 0 }, { x: 65, y: 35 }, { x: 100, y: 35 }, { x: 100, y: 65 }, { x: 65, y: 65 }, { x: 65, y: 100 }, { x: 35, y: 100 }, { x: 35, y: 65 }, { x: 0, y: 65 }, { x: 0, y: 35 }, { x: 35, y: 35 }] },

  // Row 6
  // Message (Chat bubble) - approximate
  { name: "Message", shape: "polygon", polygon: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 70 }, { x: 60, y: 70 }, { x: 50, y: 100 }, { x: 40, y: 70 }, { x: 0, y: 70 }] },
  // Close (X shape)
  { name: "Close", shape: "polygon", polygon: [{ x: 20, y: 0 }, { x: 50, y: 30 }, { x: 80, y: 0 }, { x: 100, y: 20 }, { x: 70, y: 50 }, { x: 100, y: 80 }, { x: 80, y: 100 }, { x: 50, y: 70 }, { x: 20, y: 100 }, { x: 0, y: 80 }, { x: 30, y: 50 }, { x: 0, y: 20 }] },
  // Frame (Hollow square) - use multiple polygons for accuracy, but single for simplicity
  { name: "Frame", shape: "inset", inset: { top: 10, right: 10, bottom: 10, left: 10, radius: 0 } }, 
  // Inset (Rounded square) - re-use and simplify the 'Rounded square'
  { name: "Inset", shape: "inset", inset: { top: 0, right: 0, bottom: 0, left: 0, radius: 10 } },
  
  
  { name: "Circle", shape: "circle", circle: DEFAULT.circle },
  { name: "Ellipse", shape: "ellipse", ellipse: DEFAULT.ellipse },
];

// gradient presets
const GRADIENT_PRESETS = [
  "linear-gradient(135deg,#06b6d4,#7c3aed,#ef4444)",
  "linear-gradient(135deg,#f97316,#f43f5e)",
  "linear-gradient(135deg,#22c55e,#06b6d4)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
];

// URL helpers
function serializeState(s) {
  return encodeURIComponent(JSON.stringify(s));
}
function deserializeState(q) {
  try {
    return JSON.parse(decodeURIComponent(q));
  } catch {
    return null;
  }
}

// build clip-path strings
function buildClipPath(shape, state) {
  if (shape === "polygon") {
    const pts = state.polygon.map((p) => `${p.x}% ${p.y}%`).join(", ");
    return `polygon(${pts})`;
  }
  if (shape === "inset") {
    const { top, right, bottom, left, radius } = state.inset;
    const rad = radius ? ` round ${radius}px` : "";
    return `inset(${top}px ${right}px ${bottom}px ${left}px${rad})`;
  }
  if (shape === "circle") {
    const { cx, cy, r } = state.circle;
    return `circle(${r}% at ${cx}% ${cy}%)`;
  }
  if (shape === "ellipse") {
    const { cx, cy, rx, ry } = state.ellipse;
    return `ellipse(${rx}% ${ry}% at ${cx}% ${cy}%)`;
  }
  return "none";
}

// tailwind arbitrary wrapper
function tailwindClipArbitrary(clip) {
  return `clip-path-[${clip}]`;
}

// small presentational preset tile
const PresetButton = React.memo(({ name, clipPath, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer justify-center p-2  h-[88px] rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors dark:border-zinc-700 dark:hover:bg-zinc-800"
      title={`Apply ${name} preset`}
    >
      <div
        className="w-10 h-10 bg-emerald-500/80 mb-1"
        style={{
          clipPath: clipPath,
          WebkitClipPath: clipPath,
        }}
      />
      <span className="text-xs font-medium text-center">{name}</span>
    </button>
  );
});

export default function ClipPathPlayground() {
  const { theme } = useTheme?.() ?? { theme: "light" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // init from URL (mount only)
  const initialUrlState = useMemo(() => {
    try {
      const s = searchParams.get("cstate");
      return s ? deserializeState(s) : null;
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // clip state
  const [shape, setShape] = useState(initialUrlState?.shape ?? DEFAULT.shape);
  const [polygon, setPolygon] = useState(initialUrlState?.polygon ?? DEFAULT.polygon);
  const [inset, setInset] = useState(initialUrlState?.inset ?? DEFAULT.inset);
  const [circle, setCircle] = useState(initialUrlState?.circle ?? DEFAULT.circle);
  const [ellipse, setEllipse] = useState(initialUrlState?.ellipse ?? DEFAULT.ellipse);

  // background state
  const [bgMode, setBgMode] = useState(initialUrlState?.bgMode ?? DEFAULT.bgMode); // "images" | "gradient"
  const [bgGradient, setBgGradient] = useState(initialUrlState?.bgGradient ?? DEFAULT.bgGradient);

  // image gallery state (4 images)
  const [currentImages, setCurrentImages] = useState(() => []); // array of 4 image URLs
  const [activeImageIndex, setActiveImageIndex] = useState(0); // which of the 4 images is shown in preview

  const [watermark, setWatermark] = useState(initialUrlState?.watermark ?? DEFAULT.watermark);
  const [scaleExport, setScaleExport] = useState(initialUrlState?.scaleExport ?? DEFAULT.scaleExport);

  const [fullscreen, setFullscreen] = useState(false);
  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedTailwind, setCopiedTailwind] = useState(false);

  // polygon dragging refs
  const previewRef = useRef(null);
  const draggingRef = useRef({ idx: -1, active: false });
  const touchIdRef = useRef(null);

  // derived clip + snippets
  const clip = useMemo(() => buildClipPath(shape, { polygon, inset, circle, ellipse }), [shape, polygon, inset, circle, ellipse]);
  const cssSnippet = useMemo(() => `clip-path: ${clip};\n/* fallback */\n-webkit-clip-path: ${clip};`, [clip]);
  const tailwindSnippet = useMemo(() => tailwindClipArbitrary(clip), [clip]);

  // push state to URL
  const pushUrlState = useCallback(
    (s) => {
      try {
        const q = serializeState(s);
        setSearchParams({ cstate: q }, { replace: true });
      } catch (e) {
        // ignore
      }
    },
    [setSearchParams]
  );

  useEffect(() => {
    const state = { shape, polygon, inset, circle, ellipse, bgMode, bgGradient, watermark, scaleExport };
    pushUrlState(state);
  }, [shape, polygon, inset, circle, ellipse, bgMode, bgGradient, watermark, scaleExport, pushUrlState]);

  // helpers for polygon editing
  const clientToPercent = useCallback((clientX, clientY) => {
    const el = previewRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const x = Math.round(((clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((clientY - rect.top) / rect.height) * 100);
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }, []);

  const onPointerDownPoint = useCallback((e, idx) => {
    e.preventDefault();
    const isTouch = e.type.startsWith("touch");
    if (isTouch) {
      const t = e.changedTouches[0];
      touchIdRef.current = t.identifier;
      draggingRef.current = { idx, active: true };
      return;
    }
    draggingRef.current = { idx, active: true };
  }, []);

  const onPointerMove = useCallback(
    (e) => {
      if (!draggingRef.current.active) return;
      let clientX, clientY;
      if (e.type.startsWith("touch")) {
        const touch = Array.from(e.changedTouches).find((t) => t.identifier === touchIdRef.current) || e.changedTouches[0];
        if (!touch) return;
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const p = clientToPercent(clientX, clientY);
      setPolygon((prev) => prev.map((pt, i) => (i === draggingRef.current.idx ? { x: p.x, y: p.y } : pt)));
    },
    [clientToPercent]
  );

  const onPointerUp = useCallback(() => {
    draggingRef.current = { idx: -1, active: false };
    touchIdRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);
    window.addEventListener("touchcancel", onPointerUp);
    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      window.removeEventListener("touchcancel", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  // polygon add/remove/randomize
  const addPoint = () => {
    setPolygon((p) => {
      const last = p[p.length - 1] || { x: 50, y: 50 };
      const next = { x: Math.min(95, last.x + 6), y: Math.min(95, last.y + 6) };
      return [...p, next];
    });
  };
  const removePoint = (idx) => {
    setPolygon((p) => (p.length <= 3 ? p : p.filter((_, i) => i !== idx)));
  };
  const randomPolygon = () => {
    const count = 5 + Math.floor(Math.random() * 4);
    const pts = Array.from({ length: count }).map(() => ({ x: Math.round(Math.random() * 100), y: Math.round(Math.random() * 100) }));
    setPolygon(pts);
    showToast("success", "Random polygon");
  };

  // image gallery helpers
  const pickRandomImages = useCallback(() => {
    const pool = [...IMAGE_POOL];
    const picks = [];
    // choose up to 4 unique images
    for (let i = 0; i < 4 && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    // if we have less than 4 (rare), fill with picsum randoms
    while (picks.length < 4) {
      picks.push(`https://picsum.photos/1200/800?random=${Math.floor(Math.random() * 10000)}`);
    }
    return picks;
  }, []);

  // set new 4 images and pick active
  const loadNewImageSet = useCallback(() => {
    const set = pickRandomImages();
    setCurrentImages(set);
    const active = Math.floor(Math.random() * set.length);
    setActiveImageIndex(active);
  }, [pickRandomImages]);

  // on mount, populate 4 images
  useEffect(() => {
    if (!initialUrlState) {
      loadNewImageSet();
    } else {
      // If URL state contains images (not currently serialized), keep current logic.
      // For now, if user provided no image set in URL, load fresh set.
      loadNewImageSet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // export PNG with watermark logic (unchanged)
  const previewWrapperRef = useRef(null);
  const capturePng = useCallback(
    async ({ withWatermark = true, fileName = `clippath.png`, scale = 2 } = {}) => {
      try {
        const node = previewWrapperRef.current;
        if (!node) return showToast("error", "Preview not available");
        const wnodes = node.querySelectorAll("[data-clip-watermark]");
        const saved = [];
        wnodes.forEach((n) => {
          saved.push({ node: n, style: n.getAttribute("style") || "" });
          n.style.transition = "opacity 120ms ease";
          n.style.opacity = withWatermark ? "1" : "0";
          n.style.zIndex = 9999;
          n.style.pointerEvents = "none";
        });
        await new Promise((r) => requestAnimationFrame(r));
        const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: Math.max(1, scale) });
        saved.forEach(({ node, style }) => node.setAttribute("style", style));
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast("success", "PNG downloaded");
      } catch (err) {
        console.error(err);
        showToast("error", "Export failed");
      }
    },
    []
  );

  // copy helpers
  const copyCss = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssSnippet);
      setCopiedCss(true);
      showToast("success", "Copied CSS");
      setTimeout(() => setCopiedCss(false), 1400);
    } catch {
      showToast("error", "Copy failed");
    }
  }, [cssSnippet]);

  const copyTailwind = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(tailwindSnippet);
      setCopiedTailwind(true);
      showToast("success", "Copied Tailwind");
      setTimeout(() => setCopiedTailwind(false), 1400);
    } catch {
      showToast("error", "Copy failed");
    }
  }, [tailwindSnippet]);

  // apply preset
  const applyPreset = (p) => {
    if (p.shape) setShape(p.shape);
    if (p.polygon) setPolygon(p.polygon);
    if (p.inset) setInset(p.inset);
    if (p.circle) setCircle(p.circle);
    if (p.ellipse) setEllipse(p.ellipse);
    showToast("success", `Loaded ${p.name}`);
  };

  // clear url state
  const clearUrlState = () => {
    setSearchParams({}, { replace: true });
    navigate(window.location.pathname, { replace: true });
    showToast("success", "Cleared URL state");
  };

  // preview style chooses image (if mode=images) or gradient
  const previewStyle = useMemo(() => {
    if (bgMode === "images" && currentImages.length) {
      const url = currentImages[activeImageIndex];
      // use center/cover formatting for nice fit
      return {
        clipPath: clip,
        WebkitClipPath: clip,
        background: `url('${url}') no-repeat center / cover`,
        transition: "clip-path 140ms ease, background 180ms ease",
      };
    }
    // gradient mode
    return {
      clipPath: clip,
      WebkitClipPath: clip,
      background: bgGradient,
      transition: "clip-path 140ms ease, background 180ms ease",
    };
  }, [bgMode, currentImages, activeImageIndex, bgGradient, clip]);

  // Background thumbnail click
  const handleThumbnailClick = (idx) => {
    if (!currentImages || currentImages.length === 0) return;
    setActiveImageIndex(idx);
    setBgMode("images");
  };

  // clicking preview will shuffle images (load new four)
  const onPreviewClick = () => {
    // toggle: if in image mode, load new set; if in gradient mode, do nothing (or we can toggle to images)
    if (bgMode === "images") {
      loadNewImageSet();
    } else {
      // switch to images
      loadNewImageSet();
      setBgMode("images");
    }
  };

  // small thumbnail backgrounds to choose from (also includes gradient option)
  const BG_PRESETS = [
    { type: "gradient", value: "linear-gradient(135deg,#06b6d4,#7c3aed,#ef4444)", name: "Gradient 1" },
    { type: "gradient", value: "linear-gradient(135deg,#f97316,#f43f5e)", name: "Gradient 2" },
    { type: "image", value: IMAGE_POOL[0], name: "Image 1" },
    { type: "image", value: IMAGE_POOL[1], name: "Image 2" },
  ];

  return (
    <div className="min-h-screen max-w-8xl overflow-hidden mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            Clip-Path Playground
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create CSS clip-paths visually</p>
        </div>

        <div className="flex items-center gap-2">
          <Button className="cursor-pointer" variant="secondary" onClick={() => { setShape(DEFAULT.shape); setPolygon(DEFAULT.polygon); setInset(DEFAULT.inset); setCircle(DEFAULT.circle); setEllipse(DEFAULT.ellipse); setBgMode(DEFAULT.bgMode); setBgGradient(DEFAULT.bgGradient); loadNewImageSet(); showToast("success", "Defaults restored"); }}>
            <RotateCcw className="w-4 h-4" /> Defaults
          </Button>

          <div className="flex items-center gap-2">
            <Button className="cursor-pointer" onClick={() => setFullscreen(true)}><Maximize2 className="w-4 h-4" />Preview</Button>
            <Button className="cursor-pointer" variant="outline" onClick={() => capturePng({ withWatermark: watermark, scale: scaleExport })}><ImageIcon className="w-4 h-4" />Export PNG</Button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Shape</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={shape} onValueChange={(v) => setShape(v)}>
                  <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value="polygon">Polygon (draggable)</SelectItem>
                    <SelectItem className="cursor-pointer" value="inset">Inset (rounded)</SelectItem>
                    <SelectItem className="cursor-pointer" value="circle">Circle</SelectItem>
                    <SelectItem className="cursor-pointer" value="ellipse">Ellipse</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                {shape === "polygon" && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Polygon points</Label>
                      <div className="flex items-center gap-2">
                        <Button className="cursor-pointer" size="sm" variant="ghost" onClick={randomPolygon}><Shuffle className="w-4 h-4" /></Button>
                        <Button className="cursor-pointer" size="sm" onClick={addPoint}><Plus className="w-4 h-4" /></Button>
                        <Button className="cursor-pointer" size="sm" variant="destructive" onClick={() => setPolygon(DEFAULT.polygon)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>

                    <div className="rounded border p-2 bg-white/60 dark:bg-zinc-900/60 min-h-[120px] overflow-auto">
                      {polygon.map((p, i) => (
                        <div key={i} className="flex items-center  justify-between gap-2 text-xs mb-2">
                            <div className="flex  items-center gap-4">
                          <div className="w-6 text-right">{i + 1}.</div>
                          <Input value={String(p.x)} onChange={(e) => setPolygon((prev) => prev.map((pt, idx) => (idx === i ? { ...pt, x: Math.max(0, Math.min(100, Number(e.target.value || 0))) } : pt)))} className="w-16" />
                          <Input value={String(p.y)} onChange={(e) => setPolygon((prev) => prev.map((pt, idx) => (idx === i ? { ...pt, y: Math.max(0, Math.min(100, Number(e.target.value || 0))) } : pt)))} className="w-16" />
                          <div className="text-xs opacity-70">%</div>
                          </div>
                          <Button className="cursor-pointer" size="sm" variant="destructive" onClick={() => removePoint(i)} disabled={polygon.length <= 3}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs opacity-70">Drag handles in preview to reposition points.</div>
                  </>
                )}

                {shape === "inset" && (
                  <>
                    <Label className="text-xs">Inset (px)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={String(inset.top)} onChange={(e) => setInset((s) => ({ ...s, top: Number(e.target.value || 0) }))} placeholder="top" />
                      <Input value={String(inset.right)} onChange={(e) => setInset((s) => ({ ...s, right: Number(e.target.value || 0) }))} placeholder="right" />
                      <Input value={String(inset.bottom)} onChange={(e) => setInset((s) => ({ ...s, bottom: Number(e.target.value || 0) }))} placeholder="bottom" />
                      <Input value={String(inset.left)} onChange={(e) => setInset((s) => ({ ...s, left: Number(e.target.value || 0) }))} placeholder="left" />
                    </div>
                    <Label className="text-xs mt-2">Border radius (px)</Label>
                    <Slider  value={[inset.radius]} onValueChange={(v) => setInset((s) => ({ ...s, radius: v[0] }))} min={0} max={200} className="w-full cursor-pointer" />
                  </>
                )}

                {shape === "circle" && (
                  <>
                    <Label className="text-xs">Circle (percent)</Label>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label className="text-xs">CX</Label>
                        <Slider className="cursor-pointer" value={[circle.cx]} onValueChange={(v) => setCircle((s) => ({ ...s, cx: v[0] }))} min={0} max={100} />
                        <div className="text-xs text-right">{circle.cx}%</div>
                      </div>
                      <div>
                        <Label className="text-xs">CY</Label>
                        <Slider className="cursor-pointer" value={[circle.cy]} onValueChange={(v) => setCircle((s) => ({ ...s, cy: v[0] }))} min={0} max={100} />
                        <div className="text-xs text-right">{circle.cy}%</div>
                      </div>
                      <div>
                        <Label className="text-xs">R</Label>
                        <Slider className="cursor-pointer" value={[circle.r]} onValueChange={(v) => setCircle((s) => ({ ...s, r: v[0] }))} min={0} max={100} />
                        <div className="text-xs text-right">{circle.r}%</div>
                      </div>
                    </div>
                  </>
                )}

                {shape === "ellipse" && (
                  <>
                    <Label className="text-xs">Ellipse (percent)</Label>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label className="text-xs mb-1">Center (CX / CY)</Label>
                        <div className="flex gap-2">
                          <Input value={String(ellipse.cx)} onChange={(e) => setEllipse((s) => ({ ...s, cx: Number(e.target.value || 0) }))} />
                          <Input value={String(ellipse.cy)} onChange={(e) => setEllipse((s) => ({ ...s, cy: Number(e.target.value || 0) }))} />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Radius (RX / RY)</Label>
                        <div className="flex gap-2 mb-1">
                          <Input value={String(ellipse.rx)} onChange={(e) => setEllipse((s) => ({ ...s, rx: Number(e.target.value || 0) }))} />
                          <Input value={String(ellipse.ry)} onChange={(e) => setEllipse((s) => ({ ...s, ry: Number(e.target.value || 0) }))} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <Label className="text-xs">Background Mode</Label>
                <div className="flex gap-2">
                  <Badge  onClick={() => setBgMode("images")} className={clsx(" cursor-pointer rounded", bgMode === "images" ? "backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-transparent border border-zinc-400/50 text-black dark:text-white ")}>Images</Badge>
                  <Badge onClick={() => setBgMode("gradient")} className={clsx(" cursor-pointer rounded", bgMode === "gradient" ? "backdrop-blur-md  bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-transparent text-black dark:text-white border border-zinc-400/50")}>Gradient</Badge>
                </div>

                <Label className="text-xs mt-3">Background</Label>
                <Input value={bgMode === "gradient" ? bgGradient : (currentImages[activeImageIndex] || "")} onChange={(e) => {
                  if (bgMode === "gradient") setBgGradient(e.target.value);
                }} />
                <div className="text-xs opacity-70 mt-1">For images: use selection thumbnails on the right. For gradients paste CSS like <code>linear-gradient(...)</code>.</div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Checkbox className="cursor-pointer" id="wm" checked={watermark} onCheckedChange={(v) => setWatermark(Boolean(v))} />
                  <label htmlFor="wm" className="text-sm">Watermark on export</label>
                </div>

                <div>
                  <Label className="text-xs mb-1">Export scale</Label>
                  <Select value={String(scaleExport)} onValueChange={(v) => setScaleExport(Number(v))}>
                    <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem className="cursor-pointer" value="1">1× (screen)</SelectItem>
                      <SelectItem className="cursor-pointer" value="2">2× (hi-res)</SelectItem>
                      <SelectItem className="cursor-pointer" value="3">3× (super)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

        
        </aside>

        {/* center: preview */}
        <section className="lg:col-span-6 space-y-4">
          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Live Preview
                <Badge  className="ml-2 backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">{shape}</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                
                <Button className="cursor-pointer" variant="ghost" size="sm" onClick={() => capturePng({ withWatermark: watermark, scale: scaleExport })}><Download className="w-4 h-4" /></Button>
                <Button className="cursor-pointer"  variant="ghost" size="sm" onClick={() => setFullscreen(true)}><Maximize2 className="w-4 h-4" /></Button>
              </div>
            </CardHeader>

            <CardContent>
              <div ref={previewWrapperRef} className="rounded-lg border p-4 bg-white/60 dark:bg-black/60 relative" style={{ minHeight: 320 }}>
                <div
                  ref={previewRef}
                  className="mx-auto rounded-lg overflow-hidden relative cursor-pointer"
                //   onClick={onPreviewClick}
                  style={{
                    width: "100%",
                    maxWidth: 720,
                    height: 320,
                    margin: "0 auto",
                    boxShadow: isDark ? "0 6px 30px rgba(2,6,23,0.6)" : "0 6px 18px rgba(15,23,42,0.06)",
                    ...previewStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ color: isDark ? "#000" : "#fff", fontWeight: 800, fontSize: 24, textAlign: "center", textShadow: isDark ? "none" : "0 1px 0 rgba(0,0,0,0.25)" }}>
                    Clip Preview
                  </div>

                  {/* polygon handles overlay */}
                  {shape === "polygon" &&
                    polygon.map((p, i) => {
                      const left = `${p.x}%`;
                      const top = `${p.y}%`;
                      return (
                        <div
                          key={i}
                          onMouseDown={(e) => onPointerDownPoint(e, i)}
                          onTouchStart={(e) => onPointerDownPoint(e, i)}
                          title={`Point ${i + 1}`}
                          style={{
                            position: "absolute",
                            left,
                            top,
                            transform: "translate(-50%,-50%)",
                            width: 14,
                            height: 14,
                            borderRadius: 999,
                            background: isDark?"#fff":"#000",
                            border: "2px solid rgba(0,0,0,0.6)",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                            cursor: "grab",
                            zIndex: 10,
                          }}
                          aria-hidden
                        />
                      );
                    })}
                </div>

                {/* watermark inside wrapper (absolute) */}
                <div data-clip-watermark style={{ position: "absolute", bottom: 14, right: 14, padding: "6px 8px", borderRadius: 6, background: isDark ? "#fff4" : "#0007", color: isDark ? "#000" : "#fff", opacity: watermark ? 0.95 : 0, pointerEvents: "none", transition: "opacity 120ms ease" }}>
                  Revolyx
                </div>
              </div>
            </CardContent>
          </Card >
            <Card className="shadow mt-4 dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Presets</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4  justify-items-stretch items-stretch sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
                {PRESETS.map((p) => (
                  <PresetButton
                    key={p.name}
                    name={p.name}
                    clipPath={buildClipPath(p.shape, p)}
                    onClick={() => applyPreset(p)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* right: thumbnails + CSS outputs */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Thumbnails (click to set)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs opacity-70">Showing 4 candidates</div>
                <div className="flex gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => loadNewImageSet()}><Shuffle className="w-4 h-4" /> Shuffle</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {currentImages && currentImages.length ? currentImages.map((img, i) => (
                  <button key={i} onClick={() => handleThumbnailClick(i)} className={clsx("rounded cursor-pointer overflow-hidden border relative h-28", activeImageIndex === i ? "ring-2 ring-emerald-400" : "")}>
                    <div className="w-full h-full bg-center bg-cover" style={{ backgroundImage: `url('${img}')` }} />
                    <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-black/40 text-white">#{i + 1}</div>
                  </button>
                )) : (
                  <div className="text-xs opacity-60">Loading images…</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>CSS</CardTitle></CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="rounded border p-3 bg-white/60 dark:bg-zinc-900/60 font-mono text-sm overflow-auto max-h-40 whitespace-pre-wrap">{cssSnippet}</pre>
                <button onClick={copyCss} className="absolute top-2 cursor-pointer right-2 p-1.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700" aria-label="Copy CSS" type="button">
                  {copiedCss ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Tailwind</CardTitle></CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="rounded border p-3 bg-white/60 dark:bg-zinc-900/60 font-mono text-sm overflow-auto max-h-40 whitespace-pre-wrap">{tailwindSnippet}</pre>
                <button onClick={copyTailwind} className="absolute cursor-pointer top-2 right-2 p-1.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700" aria-label="Copy Tailwind" type="button">
                  {copiedTailwind ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>

                <div className="text-xs opacity-70 mt-2">Tailwind tip: use arbitrary classes with JIT or safelist in your config for production.</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Share</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm mb-2">Share a link to this clip (state encoded in URL)</div>
              <div className="flex gap-2">
                <Button className="cursor-pointer" onClick={() => { navigator.clipboard.writeText(window.location.href); showToast("success", "Copied share URL"); }}>Copy URL</Button>
                <Button className="cursor-pointer" variant="outline" onClick={() => { setSearchParams({}, { replace: true }); navigate(window.location.pathname, { replace: true }); showToast("success", "Cleared URL"); }}>Clear URL</Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Fullscreen preview */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
          <div className="absolute top-6 right-6 flex gap-2">
            <Button className="cursor-pointer" size="sm" onClick={() => capturePng({ withWatermark: watermark, scale: scaleExport })}><Download className="w-4 h-4 " /></Button>
            <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => capturePng({ withWatermark: false, scale: scaleExport })}><GlassWater/></Button>
            <Button className="cursor-pointer" size="sm" onClick={() => setFullscreen(false)}><Minimize2 className="w-4 h-4" />Close</Button>
          </div>

          <div className="w-full h-full max-w-4xl max-h-full rounded overflow-hidden p-6">
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: isDark ? "#05060a" : "#f7fafc" }}>
              <div style={{ width: "80%", maxWidth: 1200, height: "70vh", borderRadius: 18, overflow: "hidden", ...previewStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: isDark ? "#000" : "#fff", fontSize: 36, fontWeight: 800 }}>Clip Preview</div>

                <div data-clip-watermark style={{ position: "absolute", bottom: 24, right: 24, padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,0.4)", color: "#fff", opacity: watermark ? 0.95 : 0, pointerEvents: "none", transition: "opacity 120ms ease" }}>
                  Revolyx
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
