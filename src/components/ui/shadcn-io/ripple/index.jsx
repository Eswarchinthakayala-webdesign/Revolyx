"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 200,
  mainCircleOpacity = 0.25,
  numCircles = 8,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 select-none overflow-hidden [mask-image:linear-gradient(to_bottom,white,transparent)]",
        className
      )}
      {...props}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 90;
        const opacity = Math.max(mainCircleOpacity - i * 0.03, 0.05);
        const animationDelay = `${i * 0.6}s`;

        return (
          <div
            key={i}
            className={cn(
              "absolute animate-ripple rounded-full border",
              // Light mode colors
              "border-zinc-700/30 bg-zinc-500/10",
              // Dark mode override
              "dark:border-zinc-200/30 dark:bg-white/5"
            )}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity,
              animationDelay,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </div>
  );
});

Ripple.displayName = "Ripple";
