"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Layers,
  Code,
  Search,
  ArrowDownAZ,
  ArrowUpAZ,
  Palette,
  Copy,
  Check,
  Eye,
  EyeOff,
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
import PrismaticBurst from "../components/animations/PrismaticBurst";
import Galaxy from "../components/animations/Galaxy";
import FaultyTerminal from "../components/animations/FaultyTerminal";
import RippleGrid from "../components/animations/RippleGrid";
import DotGrid from "../components/animations/DotGrid";
import Threads from "../components/animations/Threads";
import Iridescence from "../components/animations/Iridescenec";
import Waves from "../components/animations/Waves";
import GridDistortion from "../components/animations/GridDistortion";
import Ballpit from "../components/animations/Ballpit";
import Orb from "../components/animations/Orb";
import LetterGlitch from "../components/animations/LetterGlitch";
import { HexagonBackground } from "../components/animate-ui/components/backgrounds/hexagon";
import { HoleBackground } from "../components/animate-ui/components/backgrounds/hole";
import { FireworksBackground } from "../components/animate-ui/components/backgrounds/fireworks";
import { useTheme } from "../components/theme-provider";
import DesignSidebar from "../components/DesignSidebar";
import { DesignShowcase } from "../components/DesignShowcase";
import clsx from "clsx";

  typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

export default function BackgroundDesignPage() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
   const [copied, setCopied] = useState(false);
  const topRef = useRef(null);

   const {theme}=useTheme()
   const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
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
        id: "galaxy",
        name: "Galaxy",
        description: "Galaxy",
        render: () => (
         <div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Galaxy 
    mouseRepulsion={true}
    mouseInteraction={true}
    density={1.5}
    glowIntensity={0.5}
    saturation={0.8}
    hueShift={240}
  />
</div>

        ),
        code: `import Galaxy from './Galaxy';

// Basic usage
<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Galaxy />
</div>

// With custom prop values
<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Galaxy 
    mouseRepulsion={true}
    mouseInteraction={true}
    density={1.5}
    glowIntensity={0.5}
    saturation={0.8}
    hueShift={240}
  />
</div>`,
      },
      {
        id: "prismatic-burst",
        name: "PrismaticBurst",
        description: "PrismaticBurst",
        render: () => (
          <div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <PrismaticBurst
    animationType="rotate3d"
    intensity={2}
    speed={0.5}
    distort={1.0}
    paused={false}
    offset={{ x: 0, y: 0 }}
    hoverDampness={0.25}
    rayCount={24}
    mixBlendMode="lighten"
    colors={['#ff007a', '#4d3dff', '#ffffff']}
  />
</div>

        ),
        code: `import PrismaticBurst from './PrismaticBurst';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <PrismaticBurst
    animationType="rotate3d"
    intensity={2}
    speed={0.5}
    distort={1.0}
    paused={false}
    offset={{ x: 0, y: 0 }}
    hoverDampness={0.25}
    rayCount={24}
    mixBlendMode="lighten"
    colors={['#ff007a', '#4d3dff', '#ffffff']}
  />
</div>`,
      },
      {
        id: "particles",
        name: "Particles",
        description: "Particles",
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
        id: "waves",
        name: "Waves",
        description: "Waves",
        render: () => (
    <Waves
  lineColor="#fff"
  backgroundColor="rgba(255, 255, 255, 0.2)"
  waveSpeedX={0.02}
  waveSpeedY={0.01}
  waveAmpX={40}
  waveAmpY={20}
  friction={0.9}
  tension={0.01}
  maxCursorMove={120}
  xGap={12}
  yGap={36}
/>
        ),
        code: `import Waves from './Waves';

<Waves
  lineColor="#fff"
  backgroundColor="rgba(255, 255, 255, 0.2)"
  waveSpeedX={0.02}
  waveSpeedY={0.01}
  waveAmpX={40}
  waveAmpY={20}
  friction={0.9}
  tension={0.01}
  maxCursorMove={120}
  xGap={12}
  yGap={36}
/>`,
      },
      {
        id: "hole-background",
        name: "HoleBackground",
        description: "HoleBackground",
        render: () => (
   
  
 <HoleBackground className="absolute inset-0 flex items-center justify-center rounded-xl" />

        ),
        code: `import { HoleBackground } from '@/components/animate-ui/components/backgrounds/hole';

export const HoleBackgroundDemo = () => {
  return (
    <HoleBackground className="absolute inset-0 flex items-center justify-center rounded-xl" />
  );
};`,
      },
      {
        id: "hexagon-background",
        name: "HexagonBackground",
        description: "HexagonBackground",
        render: () => (
   
  
 <HexagonBackground className="absolute inset-0 flex items-center justify-center rounded-xl" />
        ),
        code: `import { HexagonBackground } from '@/components/animate-ui/components/backgrounds/hexagon';

export const HexagonBackgroundDemo = () => {
  return (
    <HexagonBackground className="absolute inset-0 flex items-center justify-center rounded-xl" />
  );
};`,
      },
      {
        id: "letter-glitch",
        name: "LetterGlitch",
        description: "LetterGlitch",
        render: () => (
   
  
<LetterGlitch
  glitchSpeed={50}
  centerVignette={true}
  outerVignette={false}
  smooth={true}
/>
        ),
        code: `import LetterGlitch from './LetterGlitch';
  
<LetterGlitch
  glitchSpeed={50}
  centerVignette={true}
  outerVignette={false}
  smooth={true}
/>`,
      },
      {
        id: "fireworks-background",
        name: "FireworksBackground",
        description: "FireworksBackground",
        render: () => (
   
  
 <FireworksBackground
      className="absolute inset-0 flex items-center justify-center rounded-xl"
      color={isDark ? 'white' : 'black'}
      population={1000}
    />


        ),
        code: `'use client';

import { useTheme } from 'next-themes';
import { FireworksBackground } from '@/components/animate-ui/components/backgrounds/fireworks';

type FireworksBackgroundDemoProps = {
  population: number;
};

export default function FireworksBackgroundDemo({
  population,
}: FireworksBackgroundDemoProps) {
  const { resolvedTheme: theme } = useTheme();

  return (
    <FireworksBackground
      className="absolute inset-0 flex items-center justify-center rounded-xl"
      color={theme === 'dark' ? 'white' : 'black'}
      population={population}
    />
  );
}`,
      },
      {
        id: "orb",
        name: "Orb",
        description: "Orb",
        render: () => (
   
<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Orb
    hoverIntensity={0.5}
    rotateOnHover={true}
    hue={0}
    forceHoverState={false}
  />
</div>
        ),
        code: `import Orb from './Orb';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Orb
    hoverIntensity={0.5}
    rotateOnHover={true}
    hue={0}
    forceHoverState={false}
  />
</div>`,
      },
      {
        id: "ballpit",
        name: "Ballpit",
        description: "Ballpit",
        render: () => (
    <div style={{position: 'relative', overflow: 'hidden', minHeight: '500px', maxHeight: '500px', width: '100%'}}>
  <Ballpit
    count={200}
    gravity={0.7}
    friction={0.8}
    wallBounce={0.95}
    followCursor={true}
  />
</div>
        ),
        code: `//Component inspired by Kevin Levron:
//https://x.com/soju22/status/1858925191671271801
  
import Ballpit from './Ballpit;'

<div style={{position: 'relative', overflow: 'hidden', minHeight: '500px', maxHeight: '500px', width: '100%'}}>
  <Ballpit
    count={200}
    gravity={0.7}
    friction={0.8}
    wallBounce={0.95}
    followCursor={true}
  />
</div>`,
      },
      {
        id: "grid-distortion",
        name: "GridDistortion",
        description: "GridDistortion",
        render: () => (
    <div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GridDistortion
    imageSrc="https://picsum.photos/1920/1080?grayscale"
    grid={10}
    mouse={0.1}
    strength={0.15}
    relaxation={0.9}
    className="custom-class"
  />
</div>
        ),
        code: `import GridDistortion from './GridDistortion';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GridDistortion
    imageSrc="https://picsum.photos/1920/1080?grayscale"
    grid={10}
    mouse={0.1}
    strength={0.15}
    relaxation={0.9}
    className="custom-class"
  />
</div>`,
      },
      {
        id: "iridescence",
        name: "Iridescence",
        description: "Iridescence",
        render: () => (
    <Iridescence
  color={[1, 1, 1]}
  mouseReact={false}
  amplitude={0.1}
  speed={1.0}
/>
        ),
        code: `import Iridescence from './Iridescence';
  
<Iridescence
  color={[1, 1, 1]}
  mouseReact={false}
  amplitude={0.1}
  speed={1.0}
/>`,
      },
      {
        id: "threads",
        name: "Threads",
        description: "Threads",
        render: () => (
         <div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Threads
    amplitude={1}
    distance={0}
    enableMouseInteraction={true}
  />
</div>
        ),
        code: `import Threads from './Threads';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Threads
    amplitude={1}
    distance={0}
    enableMouseInteraction={true}
  />
</div>`,
      },
      {
        id: "dot-grid",
        name: "DotGrid",
        description: "DotGrid",
        render: () => (
          <div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <DotGrid
    dotSize={10}
    gap={15}
    baseColor="#5227FF"
    activeColor="#5227FF"
    proximity={120}
    shockRadius={250}
    shockStrength={5}
    resistance={750}
    returnDuration={1.5}
  />
</div>
        ),
        code: `import DotGrid from './DotGrid';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <DotGrid
    dotSize={10}
    gap={15}
    baseColor="#5227FF"
    activeColor="#5227FF"
    proximity={120}
    shockRadius={250}
    shockStrength={5}
    resistance={750}
    returnDuration={1.5}
  />
</div>`,
      },

      {
        id: "faulty-terminal",
        name: "FaultyTerminal",
        description: "FaultyTerminal",
        render: () => (
          <div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <FaultyTerminal
    scale={1.5}
    gridMul={[2, 1]}
    digitSize={1.2}
    timeScale={1}
    pause={false}
    scanlineIntensity={1}
    glitchAmount={1}
    flickerAmount={1}
    noiseAmp={1}
    chromaticAberration={0}
    dither={0}
    curvature={0}
    tint="#ffffff"
    mouseReact={true}
    mouseStrength={0.5}
    pageLoadAnimation={false}
    brightness={1}
  />
</div>

        ),
        code: `import FaultyTerminal from './FaultyTerminal';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <FaultyTerminal
    scale={1.5}
    gridMul={[2, 1]}
    digitSize={1.2}
    timeScale={1}
    pause={false}
    scanlineIntensity={1}
    glitchAmount={1}
    flickerAmount={1}
    noiseAmp={1}
    chromaticAberration={0}
    dither={0}
    curvature={0}
    tint="#ffffff"
    mouseReact={true}
    mouseStrength={0.5}
    pageLoadAnimation={false}
    brightness={1}
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
    toast.success(`Revolyx Design: ${animation.name}`)
    setRefreshKey((k) => k + 1); // forces rerender
    setShowCode(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!selected) return null;
   const copySource = async () => {
    if (!selected?.code) return toast.error("No code to copy!");
    await navigator.clipboard.writeText(selected.code);
    toast.success("Source code copied!");
  };

 const handleCopy = async () => {
    if (!selected?.code) return toast.error("No code to copy!");
    try {
      await navigator.clipboard.writeText(selected.code);
      setCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };
  // ✅ Only render selected  animation
  const ActiveAnimation = selected.render(refreshKey);

  return (
    <div
      ref={topRef}
      className="min-h-screen p-4 md:p-6   transition-all"
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

        <div className="hidden sm:flex flex-wrap gap-2">
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
            variant="outline"
            size="sm"
            onClick={() => setShowCode((p) => !p)}
          >
          
            {showCode ? (
                  <motion.div
                    key="copied"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex cursor-pointer items-center gap-1"
                  >
                    <EyeOff className="w-4 h-4 mb-[-2px]" /> Hide Code
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex cursor-pointer items-center gap-1"
                  >
                    <Eye className="w-4 h-4 mb-[-2px]" /> Show Code
                  </motion.div>
                )}
          </Button>
        </div>
      </header>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
    <DesignSidebar
  search={search}
  setSearch={setSearch}
  sortAsc={sortAsc}
  setSortAsc={setSortAsc}
  filtered={filtered}
  selected={selected}
  handleSelect={handleSelect}
/>


        {/* Active Animation Section */}
     
     
<DesignShowcase
        selected={selected}
        ActivePreview={ActiveAnimation}
        showCode={showCode}
        setShowCode={setShowCode}
        onCopySource={copySource}
        isDark={isDark}
      />
      </div>
    </div>
  );
}
