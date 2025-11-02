"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Code2,
  Loader2,
  Maximize2,
  Minimize2,
  X,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Fullscreen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import clsx from "clsx";
import { showToast } from "../lib/ToastHelper";

export function DesignShowcase({
  selected = {},
  ActivePreview,
  showCode,
  setShowCode,
  isDark = true,
}) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const handleCopy = async () => {
    if (!selected?.code) return  showToast("error",`No code to copy`,3000,"");
    try {
      await navigator.clipboard.writeText(selected.code);
      setCopied(true);
       showToast("success",`Source code copied!`,3000,"")
      setTimeout(() => setCopied(false), 1500);
    } catch {
       showToast("error",`Copy failed`,3000,"")
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setLoading(false), 1000);
     showToast("info",`Preview Refreshed`,3000,"")
  };

  const toggleFullscreen = () => setFullscreen((f) => !f);

  return (
    <section className="lg:col-span-3 space-y-6">
      {/* ====== MAIN CARD ====== */}
      <Card
        className={clsx(
          "overflow-hidden relative backdrop-blur-md border border-zinc-300/40 dark:border-zinc-800/60",
          "bg-white/80 dark:bg-zinc-950/70 shadow-xl rounded-2xl transition-all duration-500"
        )}
      >
        {/* Header */}
        <CardHeader className="flex items-center flex-wrap gap-2 justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            {selected?.name || "Select a Design"}
          </CardTitle>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              title="Refresh preview"
              className="cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded((e) => !e)}
              title={expanded ? "Collapse" : "Expand"}
              className="cursor-pointer"
            >
              {expanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className={clsx(
                "flex items-center cursor-pointer gap-1 transition-all duration-300",
                copied && "bg-green-500/20 text-green-600 dark:text-green-400"
              )}
              title="Copy source"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.div
                    key="copied"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Copied
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex cursor-pointer items-center gap-1"
                  >
                    <Copy className="w-4 h-4" /> Copy
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              title="View fullscreen"
              className="cursor-pointer"
            >
              <Fullscreen className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* ====== Content ====== */}
        <CardContent
          className={clsx(
            "relative transition-all duration-500 overflow-hidden rounded-xl border-t border-zinc-200/60 dark:border-zinc-800/60",
            expanded
              ? "h-[85vh]"
              : "h-[320px] sm:h-[60vh] md:h-[70vh] lg:h-[75vh]"
          )}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent to-zinc-100/10 dark:to-zinc-900/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Loader2 className="w-10 h-10 text-zinc-400" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key={`${selected.id}-${refreshKey}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 flex items-center justify-center p-4"
              >
                {ActivePreview || (
                  <p className="text-zinc-400 text-sm">
                    Select a design to preview
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* ====== CODE SECTION ====== */}
      <AnimatePresence>
        {showCode && (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="dark:bg-zinc-950 bg-white border border-zinc-300/40 dark:border-zinc-800 rounded-xl shadow-md">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-300">
                  <Code2 className="w-4 h-4" /> Source Code
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCode(false)}
                  className="text-xs cursor-pointer text-zinc-400 hover:text-zinc-100 flex items-center gap-1"
                >
                  Hide <ChevronUp className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent>
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
                  {selected?.code || "// No code available"}
                </SyntaxHighlighter>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!showCode && (
          <motion.div
            key="showbtn"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="outline"
              onClick={() => setShowCode(true)}
              className="text-sm flex cursor-pointer items-center gap-2 mx-auto"
            >
              <Code2 className="w-4 h-4" /> Show Code
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== FULLSCREEN MODAL ====== */}
<AnimatePresence>
  {fullscreen && (
    <motion.div
      key="fullscreen"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="
          relative flex items-center justify-center
          w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw]
          h-[85vh] sm:h-[85vh] md:h-[90vh] lg:h-[90vh]
          bg-white/90 dark:bg-zinc-950/90
          border border-zinc-200/40 dark:border-zinc-800/50
          rounded-2xl shadow-2xl overflow-hidden
        "
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {/* ❌ Close Button */}
        <button
          onClick={() => setFullscreen(false)}
          className="
            absolute top-3 right-3 z-[10000]
            p-2 rounded-full
            bg-zinc-900/70 cursor-pointer dark:bg-zinc-800/70
            hover:bg-zinc-800/90 dark:hover:bg-zinc-700/90
            text-white transition-all duration-200
          "
          aria-label="Close  fullscreen preview"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 🧩 Preview Container */}
        <div
          className="
            relative w-full h-full flex items-center justify-center
            overflow-hidden p-4 md:p-6
          "
        >
          {ActivePreview ? (
            <motion.div
              key="preview"
              className="w-full h-full flex items-center justify-center"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {ActivePreview}
            </motion.div>
          ) : (
            <p className="text-zinc-400 text-sm">No preview available</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


    </section>
  );
}
