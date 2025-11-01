"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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

// Animation Imports
import PixelBlast from "../components/animations/pixelblast/pixelplase";
import LightRays from "../components/animations/lightrays/LightRays";
import LiquidEther from "../components/animations/LiquidEther/LiquidEther";
import DarkVeil from "../components/DarkVeil/DarkVeil";
import Prism from "../components/animations/Prism/Prism";
import Aurora from "../components/animations/Arora/Arora";
import Plasma from "../components/animations/palsma/palsma";
import Particles from "../components/animations/Particles/particles";
import GradientBlinds from "../components/animations/GradienBlind";
import Lightning from "../components/animations/Lighting";

const isMobile =
  typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

export default function BackgroundDesignPage() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const topRef = useRef(null);

  // ✅ Use factory functions (not mounted until selected)
  const ANIMATIONS = useMemo(
    () => [
      {
        id: "arora",
        name: "Arora",
        description: "Arora",
        render: (key) => (
        <Aurora
      colorStops={["#16a34a", "#4338ca", "#ec4899"]}
      blend={0.5}
      amplitude={1.0}
      speed={0.5}
    />
        ),
        code: `import Aurora from './Aurora';
  
<Aurora
  colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
  blend={0.5}
  amplitude={1.0}
  speed={0.5}
/>`,
      },
      {
        id: "lightrays",
        name: "Light Rays",
        description: "Dynamic light beams following mouse.",
        render: () => (
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
        id: "palsma",
        name: "Palsma",
        description: "Palsma.",
        render: () => (

  <Plasma 
    color="#ff6b35"
    speed={0.6}
    direction="forward"
    scale={1.1}
    opacity={1}
    mouseInteractive={true}
  />


        ),
        code: `import Plasma from './Plasma';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Plasma 
    color="#ff6b35"
    speed={0.6}
    direction="forward"
    scale={1.1}
    opacity={0.8}
    mouseInteractive={true}
  />
</div>`,
      },
      {
        id: "particles",
        name: "Particels",
        description: "Particels",
        render: () => (
          <Particles
    particleColors={['#ffffff', '#ffffff']}
    particleCount={200}
    particleSpread={10}
    speed={0.1}
    particleBaseSize={100}
    moveParticlesOnHover={true}
    alphaParticles={false}
    disableRotation={false}
  />

        ),
        code: `import Particles from './Particles';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Particles
    particleColors={['#ffffff', '#ffffff']}
    particleCount={200}
    particleSpread={10}
    speed={0.1}
    particleBaseSize={100}
    moveParticlesOnHover={true}
    alphaParticles={false}
    disableRotation={false}
  />
</div>`,
      },
      {
        id: "lightning",
        name: "Lightning",
        description: "Lightning",
        render: () => (
          <div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Lightning
    hue={220}
    xOffset={0}
    speed={1}
    intensity={1}
    size={1}
  />
</div>

        ),
        code: `import Lightning from './Lightning';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Lightning
    hue={220}
    xOffset={0}
    speed={1}
    intensity={1}
    size={1}
  />
</div>`,
      },
      {
        id: "gradientBlinds",
        name: "GradientBlinds",
        description: "GradientBlinds",
        render: () => (
          <div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GradientBlinds
    gradientColors={['#FF9FFC', '#5227FF']}
    angle={0}
    noise={0.3}
    blindCount={12}
    blindMinWidth={50}
    spotlightRadius={0.5}
    spotlightSoftness={1}
    spotlightOpacity={1}
    mouseDampening={0.15}
    distortAmount={0}
    shineDirection="left"
    mixBlendMode="lighten"
  />
</div>

        ),
        code: `import GradientBlinds from './GradientBlinds';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GradientBlinds
    gradientColors={['#FF9FFC', '#5227FF']}
    angle={0}
    noise={0.3}
    blindCount={12}
    blindMinWidth={50}
    spotlightRadius={0.5}
    spotlightSoftness={1}
    spotlightOpacity={1}
    mouseDampening={0.15}
    distortAmount={0}
    shineDirection="left"
    mixBlendMode="lighten"
  />
</div>`,
      },

      {
        id: "liquidether",
        name: "Liquid Ether",
        description: "Ethereal flowing fluid animation.",
        render: () => (
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
        render: () => (
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
        render: () => <DarkVeil />,
        code: `<DarkVeil />`,
      },
    ],
    [refreshKey]
  );

  // Select default animation
  useEffect(() => {
    if (!selected) setSelected(ANIMATIONS[0]);
  }, [ANIMATIONS, selected]);

  // Filter + Sort logic
  const filtered = useMemo(() => {
    const list = ANIMATIONS.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase())
    );
    return sortAsc
      ? list.sort((a, b) => a.name.localeCompare(b.name))
      : list.sort((a, b) => b.name.localeCompare(a.name));
  }, [search, sortAsc, ANIMATIONS]);

  const handleSelect = (animation) => {
    setSelected(animation);
    setRefreshKey((k) => k + 1); // forces rerender
    setShowCode(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!selected) return null;

  // ✅ Only render selected animation
  const ActiveAnimation = selected.render(refreshKey);

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
            onClick={() => setShowCode((p) => !p)}
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

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1 w-full"
          >
            {sortAsc ? <ArrowDownAZ /> : <ArrowUpAZ />}{" "}
            {sortAsc ? "A–Z" : "Z–A"}
          </Button>

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

        {/* Active Animation Section */}
        <section className="lg:col-span-3 space-y-6">
          <Card className="overflow-hidden backdrop-blur-md border-zinc-700/40 bg-white/80 dark:bg-zinc-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selected.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative h-[400px] sm:h-[100vh] rounded-xl overflow-hidden">
              <motion.div
                key={`${selected.id}-${refreshKey}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
              >
                {ActiveAnimation}
              </motion.div>
            </CardContent>
          </Card>

          {/* Show Code Section */}
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
        </section>
      </div>
    </div>
  );
}
