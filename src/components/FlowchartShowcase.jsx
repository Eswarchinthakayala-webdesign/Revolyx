"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Loader2, Download, HeartIcon, ChevronUp, ChevronDown,
  Maximize2, Minimize2, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import clsx from "clsx";
import { Canvg } from "canvg";
import { toPng } from "html-to-image";
import { showToast } from "../lib/ToastHelper";
import { Code, CodeBlock, CodeHeader } from "./animate-ui/components/animate/code";

export function FlowchartShowcase({
  selected = {},
  favorites = new Set(),
  chartRef,
  toggleFavorite = () => {},
  palette = ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd", "#bfdbfe"],
  paletteName = "Default",
  subPaletteIdx = 0,
  setSubPaletteIdx = () => {},
  isDark = true,
  themes = "default",
  setThemes = () => {},
}) {
  const [loading] = useState(false);
  const [showSource, setShowSource] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // ✅ Copy code
  const handleCopy = async () => {
    if (!selected?.code) return;
    await navigator.clipboard.writeText(selected.code);
    setCopied(true);
    showToast("success","Source code copied!",2000,"")
    setTimeout(() => setCopied(false), 1500);
  };

  // ✅ Download as SVG
  const downloadSvg = () => {
    if (!chartRef?.current) return showToast("error","No svg found",2000,"")
    const svgElement = chartRef.current.querySelector("svg");
    if (!svgElement) return showToast("error","No svg render",2000,"");

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selected.name || "flowchart"}.svg`;
    link.click();
    showToast("success","SVG downloaded successfully!",2000,"")
  };

  
const snapshotPNG = async () => {
    const node = document.querySelector(".snapshot");
    if (!node) {
      showToast("error","Snapshot Target not founded",2000,"")
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
      link.download = `Revolyx-${selected.name}.png`;
      link.href = dataUrl;
      link.click();
      showToast("success","Snapshot Saved successfully",2000,"")
    } catch (error) {
      console.error("Snapshot failed:", error);
      showToast("error","Failed to save Snapshot",2000,"")
    }
 
}

  // ✅ Download as PNG (text preserved, high-quality)
const downloadPng = async () => {
  if (!chartRef?.current) return toast.error("No chart found");

  const svgElement = chartRef.current.querySelector("svg");
  if (!svgElement) return toast.error("SVG not rendered yet");

  try {
    // Serialize the SVG
    const svgData = new XMLSerializer().serializeToString(svgElement);

    // Embed font as data URI (basic fallback, use Inter if you want)
    const fontStyle = `
      <style>
        @font-face {
          font-family: 'Inter';
          src: local('Inter'),
               url('data:font/woff2;base64,d09GMgABAAAAAA...') format('woff2');
        }
        text {
          font-family: 'Inter', 'Arial', sans-serif;
          fill: #111;
          stroke: none;
        }
      </style>
    `;

    // Inject the font style into the SVG markup
    const svgWithFont = svgData.replace(/<svg([^>]*)>/, `<svg$1>${fontStyle}`);

    // Read SVG dimensions
    const vb = svgElement.viewBox.baseVal;
    const width = vb?.width || svgElement.clientWidth || 600;
    const height = vb?.height || svgElement.clientHeight || 400;

    // Create high-res canvas
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);

    // Render SVG with Canvg (respects embedded font)
    const v = await Canvg.fromString(ctx, svgWithFont, {
      ignoreDimensions: false,
      ignoreClear: true,
      enableRedraw: true,
      useCORS: true,
    });
    await v.render();

    // Export to PNG
    canvas.toBlob((blob) => {
      if (!blob) return toast.error("PNG export failed");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${selected.name || "flowchart"}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("PNG downloaded (with text)!");
    }, "image/png");
  } catch (err) {
    console.error("PNG export failed:", err);
    toast.error("Failed to export PNG");
  }
};


  return (
    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg bg-white/70 dark:bg-black/10 backdrop-blur-xl">
      {/* Header */}
      <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <CardTitle className="flex items-center flex-wrap  gap-2 justify-between w-full">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {selected.name || "Flowchart"}
            </h2>
            <p className="text-xs opacity-70">{selected.category || "Custom"}</p>
          </div>

          <div className="flex items-center gap-2">
           

            <Button  className="cursor-pointer" size="sm" variant="outline" onClick={handleCopy}>
              {copied ? "Copied!" : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
            </Button>

            <Button  className="cursor-pointer" size="sm" variant="outline" onClick={downloadSvg}>
              <Download className="w-4 h-4 mr-1" /> SVG
            </Button>
            <Button  className="cursor-pointer" size="sm" variant="outline" onClick={snapshotPNG}>
              <Download className="w-4 h-4 mr-1" /> PNG
            </Button>

           

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setExpanded(!expanded)}
              className="cursor-pointer"
            >
              {expanded ? (
                <>
                  <Minimize2 className="w-4 h-4 " /> <span className="sm:flex hidden"> Collapse</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4"/> <span className="sm:flex hidden"> Expand</span>
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-6 space-y-6">
        {/* Chart Display */}
        <div
          className={clsx(
            "transition-all snapshot duration-500 overflow-hidden w-full max-h-screen flex justify-center items-center border rounded-lg",
            expanded
              ? "sm:h-[100vh] h-[90vh] bg-white dark:bg-zinc-900"
              : "h-[360px] bg-white/10 dark:bg-zinc-900/30"
          )}
        >
        
          {loading ? (
            <Loader2 className="animate-spin w-10 h-10 text-zinc-400" />
          ) : (
            <div ref={chartRef} className="p-4 w-full h-full flex items-center justify-center " />
          )}
        </div>

        {/* Palette Section */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 opacity-80" />
              <div className="text-sm font-medium">Palette</div>
            </div>
            <div className="text-xs opacity-70 flex items-center gap-2">
              <span>{paletteName}</span>
              <span className="px-2 py-0.5 rounded bg-zinc-100/60 dark:bg-white/5 text-[11px]">
                {subPaletteIdx + 1}/{palette.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {palette.map((c, i) => (
              <motion.button
                key={c + i}
                onClick={() => setSubPaletteIdx(i)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                  "w-9 h-9 rounded-md border-2 cursor-pointer transition-all duration-300",
                  i === subPaletteIdx
                    ? "ring-2 ring-offset-1 ring-white/20 dark:ring-white/10 scale-105 shadow-lg"
                    : "hover:scale-105"
                )}
                style={{
                  background: c,
                  borderColor:
                    i === subPaletteIdx
                      ? isDark
                        ? "#ffffff22"
                        : "#00000022"
                      : "transparent",
                }}
              />
            ))}
          </div>
        </div>

        {/* Theme Selector */}
        <Separator />
        {/* Source Code */}
        <Separator />
        <div className="flex items-center justify-between">
          <Label className="text-xs">Source Code</Label>
          <button
            onClick={() => setShowSource((s) => !s)}
            className="inline-flex  cursor-pointer items-center gap-1 text-xs px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-white/5"
          >
            <span>{showSource ? "Hide Code" : "Show Code"}</span>
            {showSource ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showSource && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28 }}
            >
              <div className="rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800 p-2">
                <Code
      key={`${0.1}-${10}-${true}-${true}`}
      className="w-full h-full"
      code={selected.code || "// No code available"}
    >
      <CodeHeader  copyButton>
        Demo
      </CodeHeader>

      <CodeBlock
        cursor={true}
        lang="js"
        writing={true}
        duration={10}
        delay={0.1}
      />
    </Code>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
