"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import clsx from "clsx";
import mermaid from "mermaid";
import { Loader2 } from "lucide-react";

export function FlowchartGrid({ filtered, selectedId, selectChart, isDark }) {
  const refs = useRef([]);
  const [loadingStates, setLoadingStates] = useState([]);

  useEffect(() => {
    if (!filtered?.length) return;
    setLoadingStates(filtered.map(() => true));

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: isDark ? "dark" : "default",
    });

    filtered.forEach((f, i) => {
      const container = refs.current[i];
      if (!container) return;
      container.innerHTML = "";

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
          setLoadingStates((prev) => {
            const copy = [...prev];
            copy[i] = false;
            return copy;
          });
        });
      } catch (err) {
        console.error("Mini flowchart render error:", err);
        container.innerHTML = `<div class='text-xs text-muted-foreground'>Render failed</div>`;
        setLoadingStates((prev) => {
          const copy = [...prev];
          copy[i] = false;
          return copy;
        });
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
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
                  ? "border-zinc-500 ring-2 ring-zinc-400/40"
                  : "border-zinc-200 dark:border-zinc-800",
                "bg-white/80 backdrop-blur-sm dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950",
                "hover:border-zinc-400 dark:hover:border-zinc-700"
              )}
            >
              <CardContent className="p-3 flex flex-col items-center justify-center gap-2">
                {/* ✅ Flowchart preview area */}
                <div className="relative w-full h-28 rounded-lg bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 border dark:border-zinc-800 overflow-hidden flex items-center justify-center">
                  {/* ✅ Loading shimmer */}
                  {loadingStates[i] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/50 dark:bg-zinc-900/50">
                      <motion.div
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="rounded-full p-2 bg-gradient-to-r from-zinc-400/50 to-zinc-600/50"
                      >
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-700 dark:text-zinc-200" />
                      </motion.div>
                    </div>
                  )}

                  {/* ✅ Mermaid chart goes here */}
                  <div
                    ref={(el) => (refs.current[i] = el)}
                    className="w-full h-full flex items-center justify-center p-1"
                  />

                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 blur-md bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 dark:from-cyan-400/15 dark:to-fuchsia-400/15 rounded-lg" />
                  </div>
                </div>

                {/* ✅ Flowchart info with tooltip */}
                <div className="relative text-center space-y-0.5 w-full">
                  <motion.div
                    className={clsx(
                      "text-xs font-medium truncate",
                      selectedId === f.id
                        ? "text-zinc-400 dark:text-zinc-400"
                        : "text-zinc-700 dark:text-white group-hover:text-zinc-900 dark:group-hover:text-white"
                    )}
                    whileHover={{ scale: 1.05 }}
                  >
                    {f.name}
                  </motion.div>

                  {/* Tooltip on hover */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-[10px] rounded-md bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 shadow-md opacity-0 group-hover:opacity-100 pointer-events-none"
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
