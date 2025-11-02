"use client";
import React from "react";
import { cn } from "@/lib/utils";

export function RetroGrid({
  className,
  angle = 65,
  cellSize = 60,
  opacity = 0.4,
  lightLineColor = "rgba(0,0,0,0.15)",
  darkLineColor = "rgba(255,255,255,0.2)",
  speed = 12, // speed of motion
  ...props
}) {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
    "--speed": `${speed}s`,
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden [perspective:500px]",
        className
      )}
      style={gridStyles}
      {...props}
    >
      {/* Animated Grid Layer */}
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))] [transform-origin:center]">
        <div
          className={cn(
            "animate-retro-grid-move",
            "[background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--light-line)_1px,transparent_1px)]",
            "dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_1px)]",
            "[background-repeat:repeat]",
            "[background-size:var(--cell-size)_var(--cell-size)]",
            "absolute inset-0 w-[400vw] h-[400vh] opacity-[var(--opacity)] will-change-transform"
          )}
        />
      </div>

      {/* Glowing Horizon Line */}
      <div className="absolute bottom-0 left-0 w-full h-[150px] bg-gradient-to-t from-white/70 to-transparent dark:from-cyan-400/40 blur-[30px]" />

      {/* Gradient Overlay for Depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent dark:from-black/90 to-90%" />
    </div>
  );
}
