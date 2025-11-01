"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

// Import all your animation components

import PixelBlast from "../components/animations/pixelblast/pixelplase";
import LightRays from "../components/animations/lightrays/LightRays";
import LiquidEther from "../components/animations/LiquidEther/LiquidEther";
import DarkVeil from "../components/DarkVeil/DarkVeil";
import Prism from "../components/animations/Prism/Prism";


const animations = [
  { id: "pixelblast", title: "Pixel Blast", component: <PixelBlast /> },
  { id: "prism", title: "Prism Refraction", component: <Prism /> },
  { id: "liquidether", title: "Liquid Ether", component: <LiquidEther /> },
  // { id: "energyflux", title: "Energy Flux", component: <EnergyFlux /> },
  // { id: "nebulawaves", title: "Nebula Waves", component: <NebulaWaves /> },
];

// ✅ Lazy loader wrapper to render only when visible
function AnimationWrapper({ children }) {
  const { ref, inView } = useInView({ threshold: 0.15, triggerOnce: true });

  return (
    <div ref={ref} className="relative w-full h-[250px] sm:h-[350px] rounded-2xl overflow-hidden bg-black/70 border border-zinc-800 shadow-lg">
      {inView ? children : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
          Loading animation...
        </div>
      )}
    </div>
  );
}

export default function BackgroundDesignPage() {
  // Click → Scroll to top behavior
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Scrolled to top 🚀");
  };

  // Optional: Cleanup on unmount (dispose stray WebGL contexts)
  useEffect(() => {
    return () => {
      const canvases = document.querySelectorAll("canvas");
      canvases.forEach((c) => {
        try {
          const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
          if (gl) {
            gl.getExtension("WEBGL_lose_context")?.loseContext();
          }
        } catch (err) {
          console.warn("WebGL cleanup error:", err);
        }
      });
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-900 to-zinc-950 text-white">
      {/* Page Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-zinc-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <motion.h1
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl sm:text-2xl font-semibold tracking-wide"
          >
            ⚡ Background Animations Gallery
          </motion.h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleScrollTop}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg border border-zinc-700 transition"
          >
            <ArrowUp size={16} /> Top
          </motion.button>
        </div>
      </header>

      {/* Animations Grid */}
      <main className="max-w-7xl mx-auto px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {animations.map((a) => (
          <motion.div
            key={a.id}
            className="group relative rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 hover:border-orange-400/50 transition"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={handleScrollTop}
          >
            <AnimationWrapper>{a.component}</AnimationWrapper>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <h2 className="text-lg font-semibold tracking-wide">{a.title}</h2>
              <p className="text-xs text-zinc-400">Tap to scroll to top</p>
            </div>

            {/* Hover Glow */}
            <motion.div
              className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition duration-300"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 0.2 }}
            />
          </motion.div>
        ))}
      </main>

      {/* Footer */}
      <footer className="text-center text-zinc-500 text-sm py-6 border-t border-zinc-800">
        <p>Made with ⚡ Framer Motion & Three.js — Optimized for Mobile ✨</p>
      </footer>
    </div>
  );
}
