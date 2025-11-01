"use client";

import React, { useState, useMemo, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

// ✅ Lazy load heavy animation components for performance
const PixelBlast = React.lazy(() =>
  import("../components/animations/pixelblast/pixelplase")
);
const LightRays = React.lazy(() =>
  import("../components/animations/lightrays/LightRays")
);
const LiquidEther = React.lazy(() =>
  import("../components/animations/LiquidEther/LiquidEther")
);
const DarkVeil = React.lazy(() => import("../components/DarkVeil/DarkVeil"));
const Prism = React.lazy(() =>
  import("../components/animations/Prism/Prism")
);

export default function BackgroundDesignPage() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const topRef = useRef(null);

  // ✅ Detect mobile device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ✅ Define animations (wrapped in a memo for better stability)
  const ANIMATIONS = useMemo(
    () => [
      {
        id: "pixelblast",
        name: "Pixel Blast",
        description: "Ripple-based pixel explosion effect.",
        component: (
          <PixelBlast
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
            raysSpeed={isMobile ? 0.8 : 1.5}
            rayLength={1.2}
            followMouse={!isMobile}
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
            autoSpeed={isMobile ? 0.3 : 0.6}
            autoIntensity={isMobile ? 1.8 : 2.2}
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
            scale={isMobile ? 2.4 : 3.6}
            glow={isMobile ? 0.6 : 1}
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
    [isMobile]
  );

  useEffect(() => {
    if (!selected) setSelected(ANIMATIONS[0]);
  }, [ANIMATIONS, selected]);

  const filtered = useMemo(() => {
    let list = ANIMATIONS.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase())
    );
    return sortAsc
      ? list.sort((a, b) => a.name.localeCompare(b.name))
      : list.sort((a, b) => b.name.localeCompare(a.name));
  }, [search, sortAsc, ANIMATIONS]);

  const handleSelect = (animation) => {
    setSelected(animation);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      ref={topRef}
      className="min-h-screen p-4 md:p-6 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100 transition-all"
    >
      <Toaster richColors position="bottom-right" />

      {/* 🏷️ Header */}
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
            <Code className="w-4 h-4 mr-1" />
            {showCode ? "Hide Code" : "Show Code"}
          </Button>
        </div>
      </header>

      {/* 🧭 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-3 border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl p-4">
          {/* Search */}
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
          </div>

          {/* Sort */}
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

          {/* Scrollable list */}
          <ScrollArea className="h-[60vh] pr-2">
            <div className="flex flex-col gap-2">
              {filtered.map((a) => (
                <Button
                  key={a.id}
                  variant={selected?.id === a.id ? "secondary" : "ghost"}
                  onClick={() => handleSelect(a)}
                  className="justify-start w-full text-left"
                >
                  <Layers className="w-4 h-4 mr-2 opacity-70" /> {a.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Preview Section */}
        <section className="lg:col-span-3 space-y-6">
          <Card className="overflow-hidden backdrop-blur-md border-zinc-700/40 bg-white/80 dark:bg-zinc-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selected?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative h-[400px] rounded-xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected?.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0"
                >
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                        Loading animation...
                      </div>
                    }
                  >
                    {selected?.component}
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Source Code */}
          {showCode && selected && (
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

          {/* 🔸 All Designs Grid */}
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
                    selected?.id === a.id
                      ? "border-violet-400 shadow-lg shadow-violet-400/30"
                      : "border-zinc-300 dark:border-zinc-800"
                  }`}
                >
                  <div className="h-40 bg-zinc-950/70 relative overflow-hidden">
                    <div className="absolute inset-0 scale-125 opacity-70">
                      <Suspense fallback={null}>{a.component}</Suspense>
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
