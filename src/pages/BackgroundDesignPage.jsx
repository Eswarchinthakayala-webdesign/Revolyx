"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Layers,
  Code,
  Search,
  ArrowDownAZ,
  ArrowUpAZ,
  Palette,
  Copy,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Toaster, toast } from "sonner";

import PixelBlast from "../components/animations/pixelblast/pixelplase";
import LightRays from "../components/animations/lightrays/LightRays";
import LiquidEther from "../components/animations/LiquidEther/LiquidEther";
import DarkVeil from "../components/DarkVeil/DarkVeil";
import Prism from "../components/animations/Prism/Prism";

// Detect mobile for performance tuning
const isMobile = typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

export default function BackgroundDesignPage() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const topRef = useRef(null);

  // Define animations (PixelBlast included with re-render key)
  const ANIMATIONS = useMemo(
    () => [
      {
        id: "pixelblast",
        name: "Pixel Blast",
        description: "Ripple-based pixel explosion effect.",
        component: (
          <PixelBlast
            key={`pixelblast-${refreshKey}`}
            variant="circle"
            pixelSize={isMobile ? 10 : 6}
            color="#B19EEF"
            patternScale={2.5}
            patternDensity={1.1}
            enableRipples={!isMobile}
            rippleSpeed={0.4}
            rippleIntensityScale={1.5}
            liquid
            liquidStrength={0.1}
            liquidRadius={1.2}
          />
        ),
        code: `<PixelBlast variant="circle" pixelSize={6} color="#B19EEF" enableRipples liquid />`,
      },
      {
        id: "lightrays",
        name: "Light Rays",
        description: "Dynamic light beams following mouse.",
        component: (
          <LightRays
            raysOrigin="top-center"
            raysColor="#00ffff"
            raysSpeed={1.5}
            rayLength={1.2}
            followMouse
          />
        ),
        code: `<LightRays raysOrigin="top-center" raysColor="#00ffff" followMouse />`,
      },
      {
        id: "liquidether",
        name: "Liquid Ether",
        description: "Ethereal flowing fluid animation.",
        component: (
          <LiquidEther
            colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={2.2}
          />
        ),
        code: `<LiquidEther colors={["#5227FF", "#FF9FFC", "#B19EEF"]} autoDemo />`,
      },
      {
        id: "prism",
        name: "Prism Rotation",
        description: "3D rotating prism with glow effect.",
        component: (
          <Prism
            animationType="rotate"
            height={3.5}
            baseWidth={5.5}
            scale={3.6}
            glow={1}
          />
        ),
        code: `<Prism animationType="rotate" glow={1} />`,
      },
      {
        id: "darkveil",
        name: "Dark Veil",
        description: "Subtle dark distortion overlay.",
        component: <DarkVeil />,
        code: `<DarkVeil />`,
      },
    ],
    [refreshKey]
  );

  // Select default
  useEffect(() => {
    if (!selected) setSelected(ANIMATIONS[0]);
  }, [ANIMATIONS, selected]);

  // Filter + Sort
  const filtered = useMemo(() => {
    let list = ANIMATIONS.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase())
    );
    return sortAsc
      ? list.sort((a, b) => a.name.localeCompare(b.name))
      : list.sort((a, b) => b.name.localeCompare(a.name));
  }, [search, sortAsc, ANIMATIONS]);

  const handleSelect = (animation) => {
    if (animation.id === "pixelblast") {
      setRefreshKey((k) => k + 1); // ✅ Force re-render only for PixelBlast
    }
    setSelected(animation);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const suggestions = filtered.slice(0, 5);

  if (!selected) return null;

  return (
    <div
      ref={topRef}
      className="min-h-screen p-4 md:p-6 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100 transition-all"
    >
      <Toaster richColors position="bottom-right" />

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            Revolyx Designs
          </h1>
          <p className="text-sm opacity-70">
            Explore professional background animations
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(selected.code);
              toast.success("Copied source code!");
            }}
          >
            <Copy className="w-4 h-4 mr-1" /> Copy Code
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode((prev) => !prev)}
          >
            <Code className="w-4 h-4 mr-1" />{" "}
            {showCode ? "Hide Code" : "Show Code"}
          </Button>
        </div>
      </header>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-3 border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl p-4">
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search designs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
            </div>
            {search && (
              <div className="absolute z-10 bg-zinc-950/90 text-zinc-100 rounded-md shadow-lg p-2 w-full">
                {suggestions.length > 0 ? (
                  suggestions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelect(s)}
                      className="cursor-pointer hover:bg-zinc-800/50 px-2 py-1 rounded-md"
                    >
                      {s.name}
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-400 text-sm px-2 py-1">
                    No results
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSortAsc(!sortAsc)}
              className="flex items-center gap-1"
            >
              {sortAsc ? <ArrowDownAZ /> : <ArrowUpAZ />}{" "}
              {sortAsc ? "A–Z" : "Z–A"}
            </Button>
          </div>

          <Separator className="my-3" />

          <ScrollArea className="h-[60vh] pr-2">
            <div className="flex flex-col gap-2">
              {filtered.map((a) => (
                <Button
                  key={a.id}
                  variant={selected.id === a.id ? "secondary" : "ghost"}
                  onClick={() => handleSelect(a)}
                  className="justify-start w-full text-left"
                >
                  <Layers className="w-4 h-4 mr-2 opacity-70" /> {a.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Preview */}
        <section className="lg:col-span-3 space-y-6">
          <Card className="overflow-hidden backdrop-blur-md border-zinc-700/40 bg-white/80 dark:bg-zinc-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selected.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative h-[400px] rounded-xl overflow-hidden">
              <motion.div
                key={`${selected.id}-${refreshKey}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
              >
                {selected.component}
              </motion.div>
            </CardContent>
          </Card>

          {showCode && (
            <Card className="bg-zinc-950 text-zinc-100 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-zinc-300">
                  <Code className="w-4 h-4" /> Source Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-zinc-900/60 p-4 rounded-xl text-sm overflow-x-auto border border-zinc-800/60">
                  <code>{selected.code}</code>
                </pre>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4" /> All Designs
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {ANIMATIONS.map((a) => (
                <motion.div
                  key={a.id}
                  onClick={() => handleSelect(a)}
                  whileHover={{ scale: 1.05 }}
                  className={`relative group cursor-pointer border rounded-xl overflow-hidden backdrop-blur-sm transition-all ${
                    selected.id === a.id
                      ? "border-violet-400 shadow-lg shadow-violet-400/30"
                      : "border-zinc-300 dark:border-zinc-800"
                  }`}
                >
                  <div className="h-50 bg-zinc-950/70 relative overflow-hidden">
                    <div className="absolute inset-0 scale-125 opacity-80">
                      {a.component}
                    </div>
                  </div>
                  <div className="h-12 flex items-center justify-center text-sm font-medium">
                    {a.name}
                  </div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-tr from-violet-500/20 to-blue-500/20" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
