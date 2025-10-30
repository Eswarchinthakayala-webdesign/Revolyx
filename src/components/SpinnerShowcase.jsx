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

export function SpinnerShowcase({
  ALL_SPINNERS = [],
  selectedSpinnerKey,
  renderSpinnerPreview,
  generateSpinnerSource,
  palette = ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd", "#bfdbfe"],
  subPaletteIdx = 0,
  setSubPaletteIdx = () => {},
  paletteName = "Default",
  isDark = true,
  size,
  setSize,
  speed,
  setSpeed,
}) {
  const accent = palette[subPaletteIdx] || palette[0];
  const [loading, setLoading] = useState(false);
  const [showSource, setShowSource] = useState(true);
  const [copying, setCopying] = useState(false);
  const [copiedTick, setCopiedTick] = useState(false);

  useEffect(() => {
    if (subPaletteIdx >= palette.length) setSubPaletteIdx(0);
  }, [palette, subPaletteIdx, setSubPaletteIdx]);

  const spinnerMeta =
    ALL_SPINNERS.find((s) => s.key === selectedSpinnerKey) || {
      title: selectedSpinnerKey || "Spinner",
    };

  const copySource = async () => {
    setCopying(true);
    try {
      await new Promise((res) => setTimeout(res, 650));
      const src = generateSpinnerSource(selectedSpinnerKey, accent, size, speed);
      await navigator.clipboard.writeText(src);
      setCopying(false);
      setCopiedTick(true);
      toast.success("Source copied to clipboard");
      setTimeout(() => setCopiedTick(false), 1400);
    } catch {
      setCopying(false);
      toast.error("Failed to copy — please allow clipboard access.");
    }
  };

  const refreshPreview = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const previewVariant = {
    hidden: { opacity: 0, y: -10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
    loading: { opacity: 0.5, scale: 0.98, transition: { duration: 0.25 } },
  };

  const controlsVariant = {
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.35 } },
  };

  return (
    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-none bg-white/70 dark:bg-black/10 backdrop-blur-xl transition-all duration-300">
      <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {spinnerMeta.title}
            </h2>
            <p className="text-xs opacity-70">{selectedSpinnerKey}</p>
          </div>

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
              className="cursor-pointer"
            >
              <motion.div
                animate={{ rotate: showSource ? 180 : 0 }}
                transition={{ duration: 0.28 }}
              >
                <Code2 className="w-4 h-4" />
              </motion.div>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* LEFT: Responsive Preview + Palette */}
          <motion.div
            className="col-span-1 flex flex-col gap-4 items-center"
            initial="hidden"
            animate="visible"
            variants={previewVariant}
          >
            {/* Spinner Preview Box */}
            <div className="relative w-60 h-60 rounded-2xl bg-white/10 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shadow-inner">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedSpinnerKey}-${size}-${speed}-${accent}-${loading}`}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={
                    loading ? { opacity: 0.5, scale: 0.96 } : { opacity: 1, scale: 1 }
                  }
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.35 }}
                  className="flex items-center justify-center w-full h-full"
                >
                  {loading ? (
                    <Loader2 className="w-10 h-10 animate-spin text-zinc-400 dark:text-zinc-300" />
                  ) : (
                    <div className="scale-75 sm:scale-90 md:scale-100 transform transition-transform duration-300">
                      {renderSpinnerPreview(selectedSpinnerKey)}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* View Full Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-3 cursor-pointer right-3 flex items-center gap-1 px-2 py-1.5 text-xs backdrop-blur-md bg-white/30 dark:bg-zinc-800/50 border border-zinc-300/70 dark:border-zinc-700/40 hover:scale-105 transition-all"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    View Full
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[500px] md:max-w-[700px] lg:max-w-[850px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      Full Spinner Preview
                    </DialogTitle>
                  </DialogHeader>

                  <div className="flex items-center justify-center p-6">
                    <motion.div
                      key={`full-${selectedSpinnerKey}-${size}-${speed}-${accent}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35 }}
                    >
                      {renderSpinnerPreview(selectedSpinnerKey)}
                    </motion.div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Palette Selector */}
            <motion.div
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08 }}
              className="w-full"
            >
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
            </motion.div>
          </motion.div>

          {/* RIGHT: Controls */}
          <motion.div
            className="col-span-1 md:col-span-2 space-y-4"
            initial="hidden"
            animate="visible"
            variants={controlsVariant}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium">Speed</div>
                  <div className="text-xs opacity-70">{speed.toFixed(1)}x</div>
                </div>
                <Slider
                  defaultValue={[speed]}
                  min={0.2}
                  max={3}
                  step={0.1}
                  onValueChange={(val) => setSpeed(Number(val[0].toFixed(1)))}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={refreshPreview} variant="default" className='cursor-pointer'>
                <RefreshCcw
                  className={clsx(
                    "w-4 h-4 mr-2 transition-transform",
                    loading ? "animate-spin" : ""
                  )}
                />
                Refresh Preview
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

            <Separator className="my-2" />

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
                                       {generateSpinnerSource(selectedSpinnerKey, accent, size, speed)}
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
