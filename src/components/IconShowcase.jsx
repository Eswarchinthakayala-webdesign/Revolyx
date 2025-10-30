"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Code2,
  Loader2,
  RefreshCcw,
  Palette,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Star,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import clsx from "clsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


/**
 * IconShowcase
 * 
 * Props:
 *  selectedIconKey, renderIconPreview, generateIconSource,
 *  palette, subPaletteIdx, setSubPaletteIdx, paletteName,
 *  isDark, size, setSize
 */
export function IconShowcase({
  selectedIconKey = "",
  renderIconPreview = () => null,
  generateIconSource = () => "",
  palette = ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd", "#bfdbfe"],
  subPaletteIdx = 0,
  setSubPaletteIdx = () => {},
  paletteName = "Default",
  isDark = true,
  size = 64,
  setSize = () => {},
}) {
  const accent = palette[subPaletteIdx] || palette[0];
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showSource, setShowSource] = useState(true);
  const [copying, setCopying] = useState(false);
  const [copiedTick, setCopiedTick] = useState(false);

  useEffect(() => {
    if (subPaletteIdx >= palette.length) setSubPaletteIdx(0);
  }, [palette, subPaletteIdx, setSubPaletteIdx]);

  // 📋 Copy JSX source
  const copySource = async () => {
    setCopying(true);
    try {
      await new Promise((res) => setTimeout(res, 650));
      const src = generateIconSource(selectedIconKey, accent, size);
      await navigator.clipboard.writeText(src);
      setCopying(false);
      setCopiedTick(true);
      toast.success("Source copied to clipboard");
      setTimeout(() => setCopiedTick(false), 1400);
    } catch {
      setCopying(false);
      toast.error("Failed to copy source — please allow clipboard access.");
    }
  };

  const refreshPreview = () => {
    setLoadingPreview(true);
    setTimeout(() => setLoadingPreview(false), 1200);
    toast("Preview refreshed");
  };

  const previewVariant = {
    hidden: { opacity: 0, y: -10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
  };

  return (
    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-none bg-white/70 dark:bg-black/10 backdrop-blur-xl transition-all duration-300">
      <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Left: Icon Info */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedIconKey || "Select an Icon"}
            </h2>
            <p className="text-xs opacity-70">{selectedIconKey}</p>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={copySource}
              size="sm"
              variant="outline"
              className={clsx(
                "relative flex cursor-pointer items-center gap-2 text-sm",
                copying ? "opacity-80" : "",
                copiedTick ? "ring-2 ring-green-400/40" : ""
              )}
              disabled={copying}
            >
              {copying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Copying...
                </>
              ) : copiedTick ? (
                <>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Source
                </>
              )}
            </Button>


            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSource((s) => !s)}
              aria-expanded={showSource}
              title={showSource ? "Hide source" : "Show source"}
              className={`cursor-pointer ${showSource?"text-blue-600":"text-red-500"}`}
            >
              <motion.div
                animate={{ rotate: showSource ? 180 : 0 }}
                transition={{ duration: 0.28 }}
              >
               {showSource?<EyeOff classname="w-4 h-4"/>: <Code2 className="w-4 h-4" />}
              </motion.div>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* LEFT: Preview */}
          <motion.div
            className="col-span-1 flex flex-col items-center gap-4"
            initial="hidden"
            animate="visible"
            variants={previewVariant}
          >
            <div className="relative w-60 h-60 rounded-2xl bg-white/10 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-inner overflow-hidden">
              {loadingPreview ? (
                <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
                  <div className="w-16 h-16 rounded-full bg-zinc-700/20 animate-pulse" />
                  <div className="text-xs opacity-70">Loading preview...</div>
                </div>
              ) : (
                <div className="scale-90 sm:scale-100 transform transition-transform duration-300">
                  {renderIconPreview(selectedIconKey)}
                </div>
              )}

              {/* Full View Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-3 right-3 text-xs flex items-center gap-1 px-2 py-1.5 bg-white/40 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-300/50 dark:border-zinc-700/50 hover:scale-105 transition-all"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    View Full
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] md:max-w-[700px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      Full Icon Preview
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center justify-center p-6">
                    <motion.div
                      key={`icon-full-${selectedIconKey}-${size}-${accent}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35 }}
                    >
                      {renderIconPreview(selectedIconKey)}
                    </motion.div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Palette */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 opacity-80" />
                  <div className="text-sm font-medium">Palette</div>
                </div>
                <div className="text-xs opacity-70">
                  {paletteName} [{subPaletteIdx + 1}/{palette.length}]
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
                    "w-9 h-9 rounded-md border-2 cursor-pointer transition-all duration-300 relative overflow-hidden",
                    i === subPaletteIdx
                        ? "ring-2 ring-offset-1 ring-white/20 dark:ring-white/10 scale-105 shadow-lg shadow-zinc-900/20"
                        : "hover:scale-105"
                    )}
                    style={{
                    background: c,
                    borderColor:
                        i === subPaletteIdx
                        ? isDark
                            ? "#ffffff22"
                            : "#00000012"
                        : "transparent",
                    }}
                    aria-label={`Use palette color ${i + 1}`}
                />
                ))}
            </div>
            <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Click swatch to change color. Palette includes sub-colors for quick testing.
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Controls */}
          <motion.div
            className="col-span-1 md:col-span-2 space-y-5"
            initial="hidden"
            animate="visible"
            variants={previewVariant}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium">Size</div>
                <div className="text-xs opacity-70">{size}px</div>
              </div>
              <Slider
                defaultValue={[size]}
                min={8}
                max={160}
                step={2}
                onValueChange={(val) => setSize(val[0])}
                className="cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={refreshPreview}>
                <RefreshCcw
                  className={clsx(
                    "w-4 h-4 mr-2 cursor-pointer transition-transform",
                    loadingPreview ? "animate-spin" : ""
                  )}
                />
                Refresh
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <div className="text-xs opacity-70">Preview options</div>
                <button
                  onClick={() => setShowSource((s) => !s)}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-white/5"
                >
                  <span>{showSource ? "Hide Code" : "Show Code"}</span>
                  {showSource ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Source Code Section */}
            <AnimatePresence initial={false}>
              {showSource && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28 }}
                >
                  <div className="rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800 p-2">
                    <SyntaxHighlighter
                      language="jsx"
                      style={isDark ? oneDark : oneLight}
                      customStyle={{
                        fontSize: "0.75rem",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        whiteSpace: "pre-wrap",
                      }}
                      wrapLines
                    >
                      {generateIconSource(selectedIconKey, accent, size)}
                    </SyntaxHighlighter>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
