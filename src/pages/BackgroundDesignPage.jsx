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
import { AuroraBackground } from "../components/ui/shadcn-io/aurora-background";
import { FlickeringGrid } from "../components/ui/shadcn-io/flickering-grid";
import { BackgroundBeams } from "../components/ui/shadcn-io/background-beams";
import { Boxes } from "../components/ui/shadcn-io/background-boxes";
import { BackgroundCircles } from "../components/ui/shadcn-io/background-circles";
import { BackgroundPaths } from "../components/ui/shadcn-io/background-paths";
import { GridPattern } from "../components/ui/shadcn-io/grid-pattern";
import { cn } from "@/lib/utils";
import { Meteors } from "../components/ui/shadcn-io/meteors";
import { RetroGrid } from "../components/ui/shadcn-io/retro-grid";
import { Ripple } from "../components/ui/shadcn-io/ripple";
import { ShootingStars } from "../components/ui/shadcn-io/shooting-stars";
import Smoke from "../components/ui/shadcn-io/smoke";
import { SparklesCore } from "../components/ui/shadcn-io/sparkles";
import { Vortex } from "../components/ui/shadcn-io/vortex";
import { showToast } from "../lib/ToastHelper";
import { GridBackground } from "../components/ui/grid-background";
import { HoverBackground } from "../components/ui/hover-background";
import { AnimatedBackground } from 'animated-backgrounds';
import Checks from "../components/animations/Checks";
import Chinese from "../components/animations/Chinese";
import Kencode from "../components/animations/Kencode";
import GridDesign from "../components/animations/GridDesign";


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
        id: "checks",
        name: "Checks",
        description: "Checks",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
       <Checks/>
   
    </div>
     

        ),
        code: `import React from 'react';
import styled from 'styled-components';

function App() {
  return (
    <div>
      <Checks/>
    </div>
  );
}

export default App;`,
      },
                  {
        id: "Kencode",
        name: "Kencode",
        description: "Kencode",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
       <Kencode/>
   
    </div>
     

        ),
        code: `import React from 'react';
import styled from 'styled-components';

function App() {
  return (
    <div>
      <Kencode/>
    </div>
  );
}

export default App;`,
      },
                  {
        id: "GridDesign",
        name: "GridDesign",
        description: "GridDesign",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
       <GridDesign/>
   
    </div>
     

        ),
        code: `import React from 'react';
import styled from 'styled-components';

function App() {
  return (
    <div>
      <GridDesign/>
    </div>
  );
}

export default App;`,
      },
                  {
        id: "Chinese",
        name: "Chinese",
        description: "Chinese;",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
       <Chinese/>
   
    </div>
     

        ),
        code: `import React from 'react';
import styled from 'styled-components';

function App() {
  return (
    <div>
      <Chinese/>
    </div>
  );
}

export default App;`,
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
        id: "starry-night",
        name: "StarryNight",
        description: "starryNight",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
        animationName="starryNight"
        blendMode="screen"
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="starryNight" 
        blendMode="screen" 
      />
      {/* Your app content */}
    </div>
  );
}

export default App;`,
      },
                  {
        id: "ocean-waves",
        name: "OceanWaves",
        description: "oceanWaves",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
        animationName="oceanWaves"
        theme="wellness"
        adaptivePerformance={true}
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="oceanWaves"
        theme="wellness"
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },
                  {
        id: "matrix-rain",
        name: "MatrixRain",
        description: "matrixRain",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
       animationName="matrixRain"
        theme="gaming"
        interactive={true}
        enablePerformanceMonitoring={true}

        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="matrixRain"
        theme="gaming"
        interactive={true}
        enablePerformanceMonitoring={true}
      />
    </div>
  );
}

export default App;`,
      },
                  {
        id: "particle-network",
        name: "particleNetwork",
        description: "particleNetwork",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
       animationName="particleNetwork"
        interactive={true}
        interactionConfig={{
          effect: 'attract',     // 'attract', 'repel', 'follow', 'burst'
          strength: 0.8,         // 0-1
          radius: 150,           // pixels
          continuous: true       // keep effect after mouse leaves
        }}


        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="particleNetwork"
        interactive={true}
        interactionConfig={{
          effect: 'attract',     // 'attract', 'repel', 'follow', 'burst'
          strength: 0.8,         // 0-1
          radius: 150,           // pixels
          continuous: true       // keep effect after mouse leaves
        }}
      />
    </div>
  );
}

export default App;`,
      },

                  {
        id: "electric-storm",
        name: "ElectricStorm",
        description: "electricStorm",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
       animationName="electricStorm"
        enablePerformanceMonitoring={true}
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="electricStorm"
        enablePerformanceMonitoring={true}
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },
                  {
        id: "firefly-forest",
        name: "FireflyForest",
        description: "fireflyForest",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
      animationName="fireflyForest"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="fireflyForest"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },
                  {
        id: "neon-pulse",
        name: "NeonPulse",
        description: "neonPulse",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
      animationName="neonPulse"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="neonPulse"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },
                  {
        id: "geometric-shapes",
        name: "GeometricShapes",
        description: "geometricShapes",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
      animationName="geometricShapes"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="geometricShapes"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },
                  {
        id: "quantum-field",
        name: "QuantumField",
        description: "quantumField",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
      animationName="quantumField"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="quantumField"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },
                  {
        id: "autumn-leaves",
        name: "AutumnLeaves",
        description: "autumnLeaves",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
      animationName="autumnLeaves"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="autumnLeaves"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },
                  {
        id: "fire-flies",
        name: "Fireflies",
        description: "fireflies",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
      animationName="fireflies"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="fireflies"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },
                  {
        id: "snow-fall",
        name: "SnowFall",
        description: "snowfall",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
      animationName="snowFall"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="snowFall"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },
                  {
        id: "rainbow-waves",
        name: "RainbowWaves",
        description: "rainbowWaves",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
      animationName="rainbowWaves"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="rainbowWaves"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },            {
        id: "gradientWave",
        name: "GradientWave",
        description: "gradientWave",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
      animationName="gradientWave"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="gradientWave"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },            {
        id: "floatingBubbles",
        name: "FloatingBubbles",
        description: "floatingBubbles",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
      animationName="floatingBubbles"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="floatingBubbles"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },            {
        id: "auroraBorealis",
        name: "AuroraBorealis",
        description: "auroraBorealis",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
      animationName="auroraBorealis"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="auroraBorealis"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },
                  {
        id: "dnaHelix",
        name: "DnaHelix",
        description: "dnaHelix",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
      animationName="dnaHelix"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="dnaHelix"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },            {
        id: "fallingFoodFiesta",
        name: "FallingFoodFiesta",
        description: "fallingFoodFiesta",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
      animationName="fallingFoodFiesta"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
    
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="fallingFoodFiesta"
        interactive={true}
        interactionConfig={{
          effect: 'follow',
          strength: 0.6,
          radius: 100
        }}
        // Automatically optimizes for mobile
        adaptivePerformance={true}
      />
    </div>
  );
}

export default App;`,
      },
                  {
        id: "galaxy-spiral",
        name: "GalaxySpiral",
        description: "galaxySpiral",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
       animationName="galaxySpiral"
       speed="0.8"
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
        animationName="galaxySpiral", 
      opacity: 0.5, 
      blendMode: 'overlay',
      speed: 0.8 
      />
    </div>
  );
}

export default App;`,
      },
                  {
        id: "cosmic-dust",
        name: "cosmicDust",
        description: "cosmicDust",
        render: (key) => (

  <div className="relative w-full h-full overflow-hidden border border-zinc-700 rounded-lg">
      {/* Restrict the animation to this div */}
      <AnimatedBackground
       animationName='cosmicDust'
       opacity="0.5"
       blendMode='overlay'
      
        style={{
          position: "absolute", // Override the default fixed
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

   
    </div>
     

        ),
        code: `import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

function App() {
  return (
    <div>
      <AnimatedBackground 
       animation: 'cosmicDust', 
      opacity: 0.5, 
      blendMode: 'overlay',
      speed: 0.8 
      />
    </div>
  );
}

export default App;`,
      },
      {
        id: "galaxy",
        name: "Galaxy",
        description: "Galaxy",
        render: () => (
         <div className="bg-black" style={{ width: '100%', height: '600px', position: 'relative' }}>
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
          <div className="bg-black" style={{ width: '100%', height: '600px', position: 'relative' }}>
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
        id: "hover-background",
        name: "HoverBackground",
        description: "HoverBackground",
        render: () => (
<div className="w-full h-full rounded-lg overflow-hidden">
      <HoverBackground>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-white/90">Hover Me!</h2>
            <p className="text-lg text-white/70 max-w-md">
              Watch the animated objects come to life when you hover over this area.
            </p>
          </div>
        </div>
      </HoverBackground>
    </div>




        ),
        code: `import { HoverBackground } from '@/components/ui/hover-background';

export default function HoverBackgroundDefault() {
  return (
    <div className="w-full h-96 rounded-lg overflow-hidden">
      <HoverBackground>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-white/90">Hover Me!</h2>
            <p className="text-lg text-white/70 max-w-md">
              Watch the animated objects come to life when you hover over this area.
            </p>
          </div>
        </div>
      </HoverBackground>
    </div>
  );
}

`,
      },
      {
        id: "grid-background",
        name: "GridBackground",
        description: "GridBackground",
        render: () => (
<div className="relative h-full w-full rounded-xl overflow-hidden">
      <GridBackground gridSize="10:10"></GridBackground>
    </div>



        ),
        code: `import { GridBackground } from '@/components/ui/grid-background';

export default function Component() {
  return (
    <div className="relative h-96 w-full rounded-xl overflow-hidden">
      <GridBackground gridSize="6:6"></GridBackground>
    </div>
  );
}
`,
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
   
<div style={{ width: '100%', height: '600px', position: 'relative' }} className="bg-black">
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
          <div style={{ width: '100%', height: '600px', position: 'relative' }} className="bg-black">
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
        id: "vortex",
        name: "Vortex",
        description: "Vortex",
        render: () => (
    <div className="h-screen w-full overflow-hidden">
      <Vortex
        backgroundColor="black"
        particleCount={700}
        baseHue={220}
        rangeHue={100}
        baseSpeed={0.0}
        rangeSpeed={1.5}
        className="flex items-center justify-center w-full h-full"
      >
        {/* Your content floats above the vortex */}
        <div className="text-center text-white z-10">
          <h1 className="text-6xl font-bold mb-4">
            Enter the Vortex
          </h1>
          <p className="text-xl opacity-80">
            Where chaos becomes beauty
          </p>
        </div>
      </Vortex>
    </div>


        ),
        code: `import { Vortex } from "@/components/ui/vortex";

export default function CosmicHero() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <Vortex
        backgroundColor="black"
        particleCount={700}
        baseHue={220}
        rangeHue={100}
        baseSpeed={0.0}
        rangeSpeed={1.5}
        className="flex items-center justify-center w-full h-full"
      >
        {/* Your content floats above the vortex */}
        <div className="text-center text-white z-10">
          <h1 className="text-6xl font-bold mb-4">
            Enter the Vortex
          </h1>
          <p className="text-xl opacity-80">
            Where chaos becomes beauty
          </p>
        </div>
      </Vortex>
    </div>
  );
}`,
      },
      {
        id: "sparkles-core",
        name: "SparklesCore",
        description: "SparklesCore",
        render: () => (
<div className="relative h-screen w-full bg-black  overflow-hidden">
      {/* Your content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <h1 className="text-6xl font-bold text-white">
          Revolyx
        </h1>
      </div>
      
      {/* Sparkles effect */}
      <SparklesCore
        background="transparent"
        minSize={0.6}
        maxSize={1.4}
        particleDensity={100}
        className="absolute inset-0 w-full h-full"
        particleColor="#a3a3a3"
        speed={1}
      />
    </div>


        ),
        code: `import { Particles } from "@/components/ui/particles";

export default function InteractiveHero() {
  return (
<div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Your content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <h1 className="text-6xl font-bold text-white">
          Make Magic Happen
        </h1>
      </div>
      
      {/* Sparkles effect */}
      <SparklesCore
        background="transparent"
        minSize={0.6}
        maxSize={1.4}
        particleDensity={100}
        className="absolute inset-0 w-full h-full"
        particleColor="#FFFFFF"
        speed={1}
      />
    </div>
  );
}`,
      },
      {
        id: "smoke",
        name: "Smoke",
        description: "Smoke",
        render: () => (
    <Smoke>
    </Smoke>


        ),
        code: `import { Smoke } from "@/components/ui/smoke";

export default function Hero() {
  return (
    <Smoke>
      <div className="relative z-10">
        <h1>Your content here</h1>
      </div>
    </Smoke>
  );
}`,
      },
      {
        id: "shooting-stars",
        name: "ShootingStars",
        description: "ShootingStars",
        render: () => (
   <div className="relative w-full h-screen bg-gradient-to-b from-zinc-900 to-black overflow-hidden">
  <ShootingStars className="z-0" />
  <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-center text-white">
    Welcome to the Night Sky 
  </div>
</div>


        ),
        code: `import { ShootingStars } from "@/components/ui/shooting-stars";

export default function CosmicHero() {
  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Your content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">
            Explore the Universe
          </h1>
          <p className="text-xl text-gray-300">
            Journey through infinite cosmic possibilities
          </p>
        </div>
      </div>
      
      {/* Shooting stars effect */}
      <ShootingStars
        starColor="#9E00FF"
        trailColor="#2EB9DF"
        minSpeed={15}
        maxSpeed={35}
        minDelay={1200}
        maxDelay={4200}
      />
    </div>
  );
}`,
      },
      {
        id: "ripple  ",
        name: "Ripple  ",
        description: "Ripple  ",
        render: () => (
      <div className="relative h-screen w-full flex items-center justify-center bg-white dark:bg-zinc-950 overflow-hidden transition-colors duration-500">
      <Ripple />
      <div className="relative z-10 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-zinc-900 dark:text-white">
          Revolyx
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Expanding waves of innovation — adaptive to light & dark themes.
        </p>
      </div>
    </div>

        ),
        code: `import { Ripple } from "@/components/ui/ripple";

export default function CallToAction() {
  return (
    <div className="relative">
      {/* Your button or content */}
      <button className="relative z-10 px-8 py-4 bg-blue-600 text-white rounded-lg">
        Get Started
      </button>
      
      {/* Ripple attention effect */}
      <Ripple 
        mainCircleSize={200}
        mainCircleOpacity={0.2}
        numCircles={6}
      />
    </div>
  );
}`,
      },
      {
        id: "retro-grid ",
        name: "RetroGrid ",
        description: "RetroGrid ",
        render: () => (
    <div className="relative h-screen w-full overflow-hidden ">
    
      
      {/* Retro grid background */}
      <RetroGrid
        angle={65}
        cellSize={60}
        opacity={0.5}
        lightLineColor="#171717"
        darkLineColor="#fafafa"
      />
    </div>


        ),
        code: `import { RetroGrid } from "@/components/ui/retro-grid";

export default function CyberpunkHero() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Your content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <h1 className="text-6xl font-bold bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff] bg-clip-text text-transparent">
          Welcome to 2080
        </h1>
      </div>
      
      {/* Retro grid background */}
      <RetroGrid 
        angle={65}
        cellSize={60}
        opacity={0.5}
        lightLineColor="#00ff41"
        darkLineColor="#00ff41"
      />
    </div>
  );
}`,
      },
      {
        id: "meteors",
        name: "Meteors",
        description: "Meteors",
        render: () => (
<div className="relative h-screen w-full  overflow-hidden">
      <Meteors number={30} />
      
    </div>


        ),
        code: `import { Meteors } from "@/components/ui/meteors";

export default function SpaceHero() {
  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      <Meteors number={30} />
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">
            Launch into the Future
          </h1>
          <p className="text-xl text-gray-300">
            Where innovation meets the cosmos
          </p>
        </div>
      </div>
    </div>
  );
}`,
      },
      {
        id: "grid-pattern",
        name: "GridPattern",
        description: "GridPattern",
        render: () => (
<div className="relative flex h-screen w-full flex-col items-center justify-center  bg-black overflow-hidden border ">
      <GridPattern
        width={40}
        height={40}
        x={-1}
        y={-1}
        squares={[
          [4, 4],
          [5, 1],
          [8, 2],
          [5, 3],
          [5, 5],
        ]}
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
        )}
      />
    </div>


        ),
        code: `import { GridPattern } from "@/components/ui/grid-pattern";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden border bg-background">
      <GridPattern
        width={40}
        height={40}
        x={-1}
        y={-1}
        squares={[
          [4, 4],
          [5, 1],
          [8, 2],
          [5, 3],
          [5, 5],
        ]}
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
        )}
      />
      <div className="relative z-10">
        <h1 className="text-4xl font-bold">Your Content</h1>
      </div>
    </div>
  );
}`,
      },
      {
        id: "background-paths",
        name: "BackgroundPaths",
        description: "BackgroundPaths",
        render: () => (
 <div className="relative h-screen w-full">
      <BackgroundPaths title="Revolyx" />
      {/* The component includes its own content overlay with title and button */}
      {/* Additional content can be layered with higher z-index if needed */}
    </div>

        ),
        code: `import { BackgroundPaths } from "@/components/ui/background-paths";

export default function ArtisticLanding() {
  return (
    <div className="relative h-screen w-full">
      <BackgroundPaths title="Creative Studio" />
      {/* The component includes its own content overlay with title and button */}
      {/* Additional content can be layered with higher z-index if needed */}
    </div>
  );
}`,
      },
      {
        id: "background-circles",
        name: "BackgroundCircles",
        description: "BackgroundCircles",
        render: () => (
   
<BackgroundCircles 
      title="Revolyx"
      description=""
      variant="septenary"
    />

        ),
        code: `import { BackgroundCircles } from "@/components/ui/background-circles";

export default function Hero() {
  return (
  <BackgroundCircles 
      title="Revolyx"
      description=""
      variant="primary"
    />
  );
}`,
      },
      {
        id: "boxes",
        name: "Boxes",
        description: "Boxes",
        render: () => (
   
  

      <Boxes className="absolute  inset-0" />
      
   


        ),
        code: `import { Boxes } from "@/components/ui/background-boxes";

export default function Hero() {
  return (
    <div className="relative h-screen">
      <Boxes className="absolute inset-0" />
      <div className="relative z-20">
        <h1>Your content here</h1>
      </div>
    </div>
  );
}`,
      },
      {
        id: "background-beams",
        name: "BackgroundBeams",
        description: "BackgroundBeams",
        render: () => (
   
  
 
      <BackgroundBeams className="absolute inset-0" />
      
   


        ),
        code: `import { BackgroundBeams } from "@/components/ui/background-beams";

export default function Hero() {
  return (
    <div className="relative">
      <BackgroundBeams className="absolute inset-0" />
      <div className="relative z-10">
        <h1>Your content here</h1>
      </div>
    </div>
  );
}`,
      },
      {
        id: "flickering-grid",
        name: "FlickeringGrid",
        description: "FlickeringGrid",
        render: () => (
   
  
<FlickeringGrid
  className="absolute inset-0 z-0"  // ensure grid is below
  squareSize={4}
  gridGap={6}
  flickerChance={0.3}
  color="rgb(100, 100, 100)"
  maxOpacity={0.2}
/>



        ),
        code: `import { AuroraBackground } from "@/components/ui/aurora-background";

export default function Hero() {
  return (
    <AuroraBackground>
      <div className="relative z-10">
        <h1>Your content here</h1>
      </div>
    </AuroraBackground>
  );
}`,
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
    showToast("success",`Revolyx Design: ${animation.name}`,3000,"")
   
    setRefreshKey((k) => k + 1); // forces rerender
    setShowCode(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!selected) return null;
   const copySource = async () => {
    if (!selected?.code) return toast.error("No code to copy!");
    await navigator.clipboard.writeText(selected.code);
    showToast("success",`Source code copied!`,3000,"")
    
  };

 const handleCopy = async () => {
    if (!selected?.code) return toast.error("No code to copy!");
    try {
      await navigator.clipboard.writeText(selected.code);
      setCopied(true);
      showToast("success",`Source code copied!`,3000,"")
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("error",`Copy Failed`,3000,"")
    }
  };
  // ✅ Only render selected  animation
  const ActiveAnimation = selected.render(refreshKey);

  return (
    <div
      ref={topRef}
      className="min-h-screen p-4 md:p-6   transition-all"
    >
     

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
