"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import clsx from "clsx";
import mermaid from "mermaid";

/**
 * FlowchartGrid Component
 * - shows all filtered flowcharts with live mini-previews rendered via Mermaid
 * - hover glow like SpinnerGrid
 */
export function FlowchartGrid({ filtered, selectedId, selectChart, isDark }) {
  const refs = useRef([]);

  // ✅ Initialize Mermaid previews
  useEffect(() => {
    if (!filtered?.length) return;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: isDark ? "dark" : "default",
    });

    filtered.forEach((f, i) => {
      const container = refs.current[i];
      if (!container) return;
      container.innerHTML = ""; // clear old preview

      try {
        const id = "mini-mermaid-" + i + "-" + Math.random().toString(36).slice(2, 8);
        mermaid.render(id, f.code).then(({ svg }) => {
          container.innerHTML = svg;
          const svgEl = container.querySelector("svg");
          if (svgEl) {
            svgEl.removeAttribute("height");
            svgEl.removeAttribute("width");
            svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
            svgEl.style.width = "100%";
            svgEl.style.height = "100%";
          }
        });
      } catch (err) {
        console.error("Mini flowchart render error:", err);
        container.innerHTML = `<div class='text-xs text-muted-foreground'>Render failed</div>`;
      }
    });
  }, [filtered, isDark]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((f, i) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.3, ease: "easeOut" }}
          >
            <Card
              onClick={() => selectChart(f.id)}
              className={clsx(
                "group cursor-pointer rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.03]",
                selectedId === f.id
                  ? "border-blue-500 ring-2 ring-blue-400/40"
                  : "border-zinc-200 dark:border-zinc-800",
                "bg-white/80 backdrop-blur-sm dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950",
                "hover:border-zinc-400 dark:hover:border-zinc-700"
              )}
            >
              <CardContent className="p-3 flex flex-col items-center justify-center gap-2">
                {/* ✅ Flowchart preview */}
                <div className="w-full h-28 rounded-lg bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 border dark:border-zinc-800 relative overflow-hidden flex items-center justify-center">
                  <div
                    ref={(el) => (refs.current[i] = el)}
                    className="w-full h-full flex items-center justify-center p-1"
                  />

                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 blur-md bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 dark:from-cyan-400/15 dark:to-fuchsia-400/15 rounded-lg" />
                  </div>
                </div>

                {/* ✅ Flowchart info */}
                <div className="text-center space-y-0.5">
                  <motion.div
                    className={clsx(
                      "text-xs font-medium",
                      selectedId === f.id
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white"
                    )}
                    whileHover={{ scale: 1.05 }}
                  >
                    {f.name}
                  </motion.div>
                  <div className="text-[10px] opacity-60">{f.category}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
