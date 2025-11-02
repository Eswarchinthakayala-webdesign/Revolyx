"use client";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Randomized start points for stars
const getRandomStartPoint = (width, height) => {
  const side = Math.floor(Math.random() * 4);
  const offsetX = Math.random() * width;
  const offsetY = Math.random() * height;

  switch (side) {
    case 0: return { x: offsetX, y: 0, angle: 45 };
    case 1: return { x: width, y: offsetY, angle: 135 };
    case 2: return { x: offsetX, y: height, angle: 225 };
    case 3: return { x: 0, y: offsetY, angle: 315 };
    default: return { x: 0, y: 0, angle: 45 };
  }
};

export const ShootingStars = ({
  numStars = 12,
  minSpeed = 8,
  maxSpeed = 22,
  minDelay = 300,
  maxDelay = 1800,
  lightStarColor = "#60a5fa", // light: blue-400
  lightTrailColor = "#bfdbfe", // light: blue-200
  darkStarColor = "#a78bfa", // dark: violet-400
  darkTrailColor = "#4c1d95", // dark: violet-900
  starWidth = 14,
  starHeight = 2,
  className,
}) => {
  const [stars, setStars] = useState([]);
  const svgRef = useRef(null);
  const [theme, setTheme] = useState("light");

  // Detect system dark mode dynamically
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => setTheme(mq.matches ? "dark" : "light");
    updateTheme();
    mq.addEventListener("change", updateTheme);
    return () => mq.removeEventListener("change", updateTheme);
  }, []);

  const starColor = theme === "dark" ? darkStarColor : lightStarColor;
  const trailColor = theme === "dark" ? darkTrailColor : lightTrailColor;

  // Animation setup
  useEffect(() => {
    let rafId;
    let timeoutIds = [];

    const createStar = () => {
      const { innerWidth: width, innerHeight: height } = window;
      const { x, y, angle } = getRandomStartPoint(width, height);

      const newStar = {
        id: Math.random(),
        x,
        y,
        angle,
        speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
        scale: 1,
        distance: 0,
        opacity: 0.8 + Math.random() * 0.2,
      };

      setStars((prev) => [...prev, newStar]);
      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      timeoutIds.push(setTimeout(createStar, randomDelay));
    };

    const animate = () => {
      setStars((prevStars) =>
        prevStars
          .map((s) => {
            const dx = s.speed * Math.cos((s.angle * Math.PI) / 180);
            const dy = s.speed * Math.sin((s.angle * Math.PI) / 180);
            const newX = s.x + dx;
            const newY = s.y + dy;
            const newDistance = s.distance + s.speed;

            if (
              newX < -100 ||
              newX > window.innerWidth + 100 ||
              newY < -100 ||
              newY > window.innerHeight + 100
            )
              return null;

            return {
              ...s,
              x: newX,
              y: newY,
              distance: newDistance,
              scale: 1 + newDistance / 400,
            };
          })
          .filter(Boolean)
      );

      rafId = requestAnimationFrame(animate);
    };

    // Create multiple shooting stars initially
    for (let i = 0; i < numStars; i++) {
      const delay = Math.random() * (maxDelay - minDelay) + minDelay;
      timeoutIds.push(setTimeout(createStar, delay));
    }

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      timeoutIds.forEach(clearTimeout);
    };
  }, [minSpeed, maxSpeed, minDelay, maxDelay, numStars]);

  return (
    <svg
      ref={svgRef}
      className={cn("absolute inset-0 w-full h-full overflow-hidden", className)}
    >
      {/* Star Trail Gradient */}
      <defs>
        <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
          <stop offset="100%" style={{ stopColor: starColor, stopOpacity: 1 }} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Stars */}
      {stars.map((s) => (
        <rect
          key={s.id}
          x={s.x}
          y={s.y}
          width={starWidth * s.scale}
          height={starHeight}
          fill="url(#starGradient)"
          opacity={s.opacity}
          filter="url(#glow)"
          transform={`rotate(${s.angle}, ${s.x + (starWidth * s.scale) / 2}, ${
            s.y + starHeight / 2
          })`}
          style={{
            transition: "opacity 0.3s ease-out",
          }}
        />
      ))}

      {/* Subtle twinkling stars in the background */}
      {Array.from({ length: 20 }).map((_, i) => (
        <circle
          key={`bg-${i}`}
          cx={Math.random() * window.innerWidth}
          cy={Math.random() * window.innerHeight}
          r={Math.random() * 1.2}
          fill={theme === "dark" ? "#a78bfa" : "#60a5fa"}
          opacity={Math.random() * 0.8}
        />
      ))}
    </svg>
  );
};
