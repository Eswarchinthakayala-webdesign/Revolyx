"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTheme } from "@/components/theme-provider";
import { Link } from "react-router-dom";
import {
  Cpu,
  Layers,
  QrCode,
  Sparkles,
  Database,
  Code2,
  Workflow,
  LineChart,
  Home,
  Palette,
  CupSoda,
  Wallpaper,
  FolderDown,
  Chrome,
  Server,
  Type,
  Dessert,
  Brain,
  Terminal,
  Crop,
  FileJson,
  Shield,
  Mic,
  Video,
  FileQuestion,
  FileArchive,
  Paintbrush2,
  Grid,
  PlayCircle,
  Component,
  Images,
  Zap,
  ListChecks,
  ChartArea,
  ArrowRight,
  Stars,
  Binary,
  Scale,
  Command,
  Calculator
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

/**
 * LandingPage — monochrome grayscale (three-tone groups B1)
 *
 * Group mappings (B1):
 *  purple → group1
 *  blue   → group2
 *  green  → group3
 *  orange → group1
 *  violet → group2
 *  indigo → group3
 *
 * All nav items are included as feature cards (Option A1).
 */

export default function LandingPage() {

  
  const { theme } = useTheme();
  const isDark =
  theme === "dark" ||
  (theme === "system" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [open, setOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);

  // mouse tracking for subtle cursor glow
  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Grayscale gradient classes (three groups)
  const GRADIENT_GROUPS = {
    group1: {
      bg: "bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800",
      glow: "bg-zinc-300/10 dark:bg-zinc-700/10",
      btn: "bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800",
    },
    group2: {
      bg: "bg-gradient-to-r from-zinc-300 to-zinc-500 dark:from-zinc-600 dark:to-zinc-700",
      glow: "bg-zinc-400/10 dark:bg-zinc-600/10",
      btn: "bg-gradient-to-r from-zinc-300 to-zinc-500 dark:from-zinc-600 dark:to-zinc-700",
    },
    group3: {
      bg: "bg-gradient-to-r from-zinc-500 to-zinc-700 dark:from-zinc-500 dark:to-zinc-600",
      glow: "bg-zinc-600/10 dark:bg-zinc-600/12",
      btn: "bg-gradient-to-r from-zinc-500 to-zinc-700 dark:from-zinc-500 dark:to-zinc-600",
    },
  };

  // base features (original 6) — map their original colors to B1 groups
  const initialFeatures = [
    {
      icon: Palette,
      title: "All-in-One Design System",
      desc: "Seamlessly access icons, colors, gradients, and UI backgrounds in one unified platform.",
      group: "group1", // purple -> group1
    },
    {
      icon: LineChart,
      title: "Charts & Data Visuals",
      desc: "Create and customize professional-level charts and dashboards effortlessly.",
      group: "group2", // blue -> group2
    },
    {
      icon: Workflow,
      title: "Flowchart & Diagram Builder",
      desc: "Design logic flows and processes visually — export them as clean, scalable SVGs.",
      group: "group3", // green -> group3
    },
    {
      icon: QrCode,
      title: "QR & Code Generators",
      desc: "Generate dynamic, theme-based QR codes that adapt to your palette instantly.",
      group: "group1", // orange -> group1
    },
    {
      icon: Layers,
      title: "Animated Backgrounds",
      desc: "Choose from pixel, prism, or fluid effects to power immersive experiences.",
      group: "group2", // violet -> group2
    },
    {
      icon: Database,
      title: "Smart Resource Finder",
      desc: "Search and save modern developer tools, libraries, and UI snippets instantly.",
      group: "group3", // indigo -> group3
    },
  ];

  // navItems (copied from your list) — all items will be added as feature cards
  const navItems = [
    { name: "Home", icon: Home, path: "/", gradient: "" },
    { name: "Colors", icon: Palette, path: "/colors", gradient: "" },
    { name: "Charts", icon: ChartArea, path: "/charts", gradient: "" },
    { name: "Spinners", icon: Chrome, path: "/spinners", gradient: "" },
    { name: "All Icons", icon: CupSoda, path: "/all-icons?lib=LucideReact", gradient: "" },
    { name: "Background Designs", icon: Wallpaper, path: "/designs", gradient: "" },
    { name: "QR Code", icon: QrCode, path: "/qr-code", gradient: "" },
    { name: "AI Resources", icon: ListChecks, path: "/resources", gradient: "" },
    { name: "Flow Chart", icon: FolderDown, path: "/flow-chart", gradient: "" },
    { name: "All Fonts", icon: Type, path: "/fonts", gradient: "" },
    { name: "Code Snippet", icon: Code2, path: "/code-snippet", gradient: "" },
    { name: "Neumorphism Design", icon: Dessert, path: "/neumorphism", gradient: "" },
    { name: "Public APIs", icon: Server, path: "/apis", gradient: "" },
    { name: "AI Text Tools", icon: Brain, path: "/ai-tools", gradient: "" },
    { name: "Web Utilities", icon: Terminal, path: "/web-utilities", gradient: "" },
    { name: "Image Tools", icon: Crop, path: "/image-tools", gradient: "" },
    { name: "JSON Tools", icon: FileJson, path: "/json-tools", gradient: "" },
    { name: "Security Tools", icon: Shield, path: "/security-tools", gradient: "" },
    { name: "Audio Tools", icon: Mic, path: "/audio-tools", gradient: "" },
    { name: "Video Tools", icon: Video, path: "/video-tools", gradient: "" },
    { name: "Hardware & System", icon: Cpu, path: "/hardware-and-system-tools", gradient: "" },
    { name: "Merge & Split", icon: FileQuestion, path: "/merge-and-split", gradient: "" },
    { name: "File & Conversion", icon: FileArchive, path: "/file-and-conversion", gradient: "" },
    { name: "Gradient Playground", icon: Paintbrush2, path: "/gradient-playground", gradient: "" },
    { name: "Grid Playground", icon: Grid, path: "/grid-playground", gradient: "" },
    { name: "Border Radius", icon: PlayCircle, path: "/border-radius", gradient: "" },
    { name: "Clip Path", icon: Component, path: "/clip-path", gradient: "" },
    { name: "Image Playground", icon: Images, path: "/image-playground", gradient: "" },
    {name:"Binary Tools",icon:Binary,path:"/binary-tools", gradient: ""},
    {name:"Unit Measurements",icon:Scale,path:"/measurement-tools", gradient: ""},
    {name:"Misc Tools",icon:Command,path:"/misc-tools",gradient:""},
     {name:"Calculators",icon: Calculator,path:"/calculators"}
  ];

  // Build full features list: start with initialFeatures, then append all navItems (exclude Home duplication)
  // For nav items, create a short description and rotate grayscale groups round-robin
  const navFeatureCards = navItems
    .filter((n) => n.name !== "Home")
    .map((n, idx) => {
      const groups = ["group1", "group2", "group3"];
      const group = groups[idx % groups.length];
      return {
        icon: n.icon,
        title: n.name,
        desc: `Explore ${n.name} — quick access and helpful tools.`,
        group,
        path: n.path,
      };
    });

  const features = [...initialFeatures, ...navFeatureCards];

  const faqs = [
    {
      q: "What is Revolyx?",
      a: "Revolyx is a modern design and development platform offering tools for icons, flowcharts, backgrounds, QR codes, and more — all in one place.",
    },
    {
      q: "Can I use these tools for free?",
      a: "Yes. All core tools are available for free. Some advanced templates may include optional premium features.",
    },
    {
      q: "Which technologies power Revolyx?",
      a: "It's built with React, Tailwind, Framer Motion, and Shadcn/UI — ensuring blazing-fast, smooth experiences.",
    },
    {
      q: "Does it support themes and palettes?",
      a: "Yes. The site supports light and dark themes; visuals are now monochrome for a clean look.",
    },
    {
      q: "Is Revolyx responsive?",
      a: "Yes. It's built with full responsiveness in mind for mobile, tablet, and desktop.",
    },
  ];

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors relative overflow-hidden">
      {/* Background subtle grid */}
      <div className="hidden sm:fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        {/* subtle radial orbs replaced with grayscale glows */}
        <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl animate-pulse ${GRADIENT_GROUPS.group1.glow}`} />
        <div className={`absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse ${GRADIENT_GROUPS.group2.glow}`} style={{ animationDelay: "1s" }} />
        <div className={`absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full blur-3xl animate-pulse ${GRADIENT_GROUPS.group3.glow}`} style={{ animationDelay: "2s" }} />
      </div>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-20"
        animate={{
          background: isDark
            ? `radial-gradient(
                520px at ${mousePosition.x}px ${mousePosition.y}px,
                rgba(255,255,255,0.06),
                rgba(255,255,255,0.025) 25%,
                rgba(0,0,0,0.15) 55%,
                transparent 70%
              )`
            : `radial-gradient(
                520px at ${mousePosition.x}px ${mousePosition.y}px,
                rgba(0,0,0,0.09),
                rgba(0,0,0,0.095) 25%,
                rgba(255,255,255,0.15) 55%,
                transparent 70%
              )`,
        }}
        transition={{
          type: "tween",
          ease: "easeOut",
          duration: 0.25,
        }}
      />


      {/* HERO */}
      <motion.section
        ref={heroRef}
        style={{ opacity, scale, y }}
        className="relative flex flex-col items-center justify-center text-center px-6 py-32 md:py-48 overflow-hidden"
      >
        {/* Animated orbs (grayscale gradients) */}
        <motion.div
          animate={{ y: [0, -30, 0], scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className={`hidden sm:absolute top-20 left-10 w-80 h-80 ${GRADIENT_GROUPS.group1.bg} rounded-full blur-3xl`}
        />
        <motion.div
          animate={{ y: [0, 40, 0], scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className={`hidden sm:absolute bottom-10 right-10 w-96 h-96 ${GRADIENT_GROUPS.group2.bg} rounded-full blur-3xl`}
        />

        {/* Content */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="relative z-10">
        <motion.div
  initial={{ scale: 0.85, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  whileHover={{ scale: 1.03 }}
  transition={{ delay: 0.2, duration: 0.6 }}
  className="
    inline-flex items-center gap-2 
    px-[clamp(12px,2vw,20px)] 
    py-[clamp(6px,1.2vw,10px)]
    rounded-full 
    backdrop-blur-xl 
    bg-orange-500/10 
    border border-orange-500/20 
    text-orange-700 dark:text-orange-300 
    shadow-[0_4px_20px_rgba(0,0,0,0.1)]
    hover:shadow-[0_6px_26px_rgba(0,0,0,0.15)]
    transition-shadow
  "
>
  {/* Rotating Icon */}
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    className="flex-shrink-0"
  >
    <Zap className="w-[clamp(14px,1.8vw,18px)] h-[clamp(14px,1.8vw,18px)]" />
  </motion.div>

  {/* Text */}
  <span className="text-[clamp(11px,1.2vw,14px)] font-semibold whitespace-nowrap">
    New: AI-Powered Tools
  </span>

  {/* Sparkles */}
  <Sparkles className="w-[clamp(14px,1.8vw,18px)] h-[clamp(14px,1.8vw,18px)] flex-shrink-0" />
</motion.div>


      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6" > Build the Future with{" "} <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent"> Revolyx </span> </motion.h1>

         <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-600 text-center dark:text-zinc-300 mb-10 relative z-10"
        >
          Revolyx brings design, development, and creativity together in one seamless workspace
        </motion.p>

              <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center gap-4 justify-center"
        >
           <Button
           
            variant="outline"
            className="rounded-full h-10  cursor-pointer border-zinc-400 dark:border-zinc-600 font-semibold"
            onClick={() => setOpen(true)}
          >
          Explore for Free
          </Button>
          <Link to="/docs">
            <Button  className="rounded-full cursor-pointer font-semibold shadow-md">
              View Docs
            </Button>
          </Link>
         
        </motion.div>
        </motion.div>

        {/* floating particles (neutral gray) */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: theme === "dark" ? "rgba(200,200,200,0.08)" : "rgba(40,40,40,0.06)",
            }}
            animate={{ y: [0, -30, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </motion.section>

      {/* Features Grid (NOW includes all nav items + initial features) */}
      <section className="relative px-6 py-24 max-w-7xl mx-auto z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }} className="text-center mb-20">
          <motion.div
  initial={{ scale: 0.9, opacity: 0 }}
  whileInView={{ scale: 1, opacity: 1 }}
  viewport={{ once: true, amount: 0.4 }}
  whileHover={{ scale: 1.04 }}
  transition={{ duration: 0.5 }}
  className="
    inline-flex items-center gap-2
    px-[clamp(10px,2vw,18px)]
    py-[clamp(6px,1.4vw,10px)]
    rounded-full
    backdrop-blur-xl
    bg-emerald-500/10
    border border-emerald-500/20
    text-emerald-700 dark:text-emerald-300
    shadow-sm hover:shadow-md
    transition-all
    mb-6
  "
>
  <Stars className="w-[clamp(14px,1.6vw,18px)] h-[clamp(14px,1.6vw,18px)] flex-shrink-0" />

  <span className="text-[clamp(12px,1.2vw,14px)] font-semibold whitespace-nowrap">
    Core Features
  </span>
</motion.div>


          <h2 className="text-4xl  font-black mb-4 text-zinc-900 dark:text-zinc-100">Unified Tools for Creative Developers</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-xl max-w-2xl mx-auto font-medium">Everything you need to bring your vision to life</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc, group }, index) => {
            const g = GRADIENT_GROUPS[group] || GRADIENT_GROUPS.group2;
            return (
              <motion.div
                key={title + index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.03 }}
                whileHover={{ y: -12, transition: { duration: 0.3 } }}
                className="group relative overflow-hidden rounded-3xl p-8 cursor-pointer bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xl hover:shadow-2xl transition-all duration-500"
              >
                {/* subtle neutral gradient glow on hover */}
                <motion.div className={`absolute inset-0 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-500 `} />

                {/* animated soft border */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className={`absolute inset-0 rounded-3xl  blur-xl`} />
                </div>

                {/* Icon */}
                <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6, type: "spring" }} className={`relative z-10 mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl p-0.5 shadow-2xl `}>
                  <div className="w-full h-full bg-white dark:bg-zinc-950 border rounded-2xl flex items-center justify-center">
                    <Icon className="h-8 w-8 text-zinc-900 dark:text-zinc-100" />
                  </div>
                </motion.div>

                <h3 className="relative z-10 font-black text-xl mb-3 text-zinc-900 dark:text-zinc-100">{title}</h3>
                <p className="relative z-10 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{desc}</p>

                {/* shimmer */}
                <motion.div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-black/30 dark:via-white/10 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000" />
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* All Tools quick grid (same nav items) */}
      <section className="relative px-6 py-24 max-w-7xl mx-auto z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-20">
         <motion.div
  initial={{ scale: 0.9, opacity: 0 }}
  whileInView={{ scale: 1, opacity: 1 }}
  viewport={{ once: true, amount: 0.4 }}
  whileHover={{ scale: 1.04 }}
  transition={{ duration: 0.5 }}
  className="
    inline-flex items-center gap-2
    px-[clamp(10px,2vw,18px)]
    py-[clamp(6px,1.4vw,10px)]
    rounded-full
    backdrop-blur-xl
    bg-amber-500/10
    border border-amber-500/20
    text-amber-700 dark:text-amber-300
    shadow-sm hover:shadow-md
    transition-all
    mb-6
  "
>
  <Layers className="w-[clamp(14px,1.6vw,18px)] h-[clamp(14px,1.6vw,18px)] flex-shrink-0" />

  <span className="text-[clamp(12px,1.2vw,14px)] font-semibold whitespace-nowrap">
    Complete Toolkit
  </span>
</motion.div>


          <h2 className="text-4xl  font-black mb-4 text-zinc-900 dark:text-zinc-100">Explore All Tools</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-xl max-w-2xl mx-auto font-medium">Discover our comprehensive suite of design and development tools</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {navItems.filter(item => item.name !== "Home").map(({ name, icon: Icon, path }, index) => (
            <motion.div key={name + index} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.4, delay: index * 0.03 }}>
              <Link to={path} className="group relative flex flex-col items-center justify-center rounded-2xl p-6 bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-300" />

                <motion.div whileHover={{ scale: 1.2, rotate: 10 }} transition={{ type: "spring", stiffness: 400 }} className="relative z-10 mb-4 flex items-center justify-center w-14 h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-3 shadow-lg group-hover:shadow-2xl transition-all">
                  <Icon className="w-7 h-7 text-zinc-700 dark:text-zinc-200" />
                </motion.div>

                <span className="relative z-10 text-xs font-bold text-center text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors leading-tight">{name}</span>

                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="relative px-6 py-32 max-w-5xl mx-auto z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <h2 className="text-4xl text-center  font-black mb-4 text-zinc-900 dark:text-zinc-100">
          Frequently Asked Questions
        </h2>

              <Accordion type="single" collapsible className="space-y-4">
          {faqs.map(({ q, a }, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border-b border-zinc-300 dark:border-zinc-800"
            >
              <AccordionTrigger className="text-lg cursor-pointer font-medium hover:text-zinc-800 dark:hover:text-zinc-100">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        </motion.div>
      </section>

      {/* Explore Modal */}
<Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border  border-zinc-300 dark:border-zinc-700 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              Explore Revolyx Tools
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Select a category to start exploring
            </DialogDescription>
          </DialogHeader>

        <div className="space-y-2 h-100 no-scrollbar overflow-y-auto">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-2 sm:p-4">
  {navItems
    .filter((n) => n.name !== "Home")
    .map(({ name, icon: Icon, path }) => (
      <Link
        key={name}
        to={path}
        onClick={() => setOpen(false)}
        className="group flex flex-col overflow-hidden items-center justify-center rounded-2xl p-4 sm:p-5 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
      >
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 shadow-inner group-hover:shadow group-hover:from-primary/10 group-hover:to-primary/20 transition-all"
        >
          <Icon className="w-6 h-6 text-zinc-800 dark:text-zinc-100 group-hover:text-primary transition-colors" />
          <div className="absolute inset-0 rounded-xl bg-white/5 dark:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>

        <span className="mt-2  text-center text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center  group-hover:text-primary transition-colors">
          {name}
        </span>
      </Link>
    ))}
</div>
</div>

        </DialogContent>
      </Dialog>
    </div>
  );
}
