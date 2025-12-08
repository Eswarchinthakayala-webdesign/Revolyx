"use client";

import { motion } from "framer-motion";
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
  Network,
  QrCode,
  Sparkles,
  Database,
  Code2,
  Workflow,
  LineChart,
  Loader2,
  Star,
  Home,
  ChartAreaIcon,
  Palette,
  CupSoda,
  Wallpaper,
  ListCheckIcon,
  FolderDown,
  Chromium,
  LucideFootprints,
  Server,
  Type,
  Dessert,
  Brain,
  Terminal,
  Crop,
  FileJson,
 ShieldCheckIcon,
 MicIcon,
 VideoIcon,
 FileQuestion,
 FileArchiveIcon,
 

} from "lucide-react";
import { useState } from "react";

/**
 * 🚀 LandingPage – Professional hero + feature showcase + FAQ section
 * + Interactive explore modal for quick navigation
 */

export default function LandingPage() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  const features = [
    {
      icon: Palette,
      title: "All-in-One Design System",
      desc: "Seamlessly access icons, colors, gradients, and UI backgrounds in one unified platform.",
    },
    {
      icon: LineChart,
      title: "Charts & Data Visuals",
      desc: "Create and customize professional-level charts and dashboards effortlessly.",
    },
    {
      icon: Workflow,
      title: "Flowchart & Diagram Builder",
      desc: "Design logic flows and processes visually — export them as clean, scalable SVGs.",
    },
    {
      icon: QrCode,
      title: "QR & Code Generators",
      desc: "Generate dynamic, theme-based QR codes that adapt to your palette instantly.",
    },
    {
      icon: Layers,
      title: "Animated Backgrounds",
      desc: "Choose from pixel, prism, or fluid effects to power immersive experiences.",
    },
    {
      icon: Database,
      title: "Smart Resource Finder",
      desc: "Search and save modern developer tools, libraries, and UI snippets instantly.",
    },
  ];

   const navItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Colors", icon: Palette, path: "/colors" },
    { name: "Charts", icon: ChartAreaIcon, path: "/charts" },
    { name: "Spinners", icon: Chromium, path: "/spinners" },
    { name: "All Icons", icon: CupSoda, path: "/all-icons?lib=LucideReact" },
    { name: "Designs", icon: Wallpaper, path: "/designs" },
    { name: "QR Code", icon: QrCode, path: "/qr-code" },
    { name: "Resources", icon: ListCheckIcon, path: "/resources" },
    { name: "Flow Chart", icon: FolderDown, path: "/flow-chart" },
    { name: "Fonts", icon:  Type, path: "/fonts" },
    { name: "Code Snippet", icon: Code2, path: "/code-snippet" },
    { name: "Neumorphism", icon: Dessert, path: "/neumorphism" },
    { name: "APIs", icon:Server, path: "/apis" },
    {name:"AI Tools",icon:Brain,path:"/ai-tools"},
    {name:"WebUtilities",icon:Terminal,path:"/web-utilities"},
     {name:"ImageTools",icon:Crop,path:"/image-tools"},
      {name:"JSONTools",icon:FileJson,path:"/json-tools" },
      {name:"SecurityTools",icon:ShieldCheckIcon,path:"/security-tools"},
      {name:"Audio Tools",icon:MicIcon,path:"/audio-tools"},
       {name:"Video Tools",icon:VideoIcon,path:"/video-tools"},
       {name:"Hardware & System",icon:Cpu,path:"/hardware-and-system-tools"},
        {name:"Merge & Split",icon:FileQuestion,path:"/merge-and-split"},
        {name:"File & Conversion",icon:FileArchiveIcon,path:"/file-and-conversion"},
        {name:"Network Tools",icon:Network,path:"/networktools"},
      
  ];

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
      a: "It’s built with React, Tailwind, Framer Motion, and Shadcn/UI — ensuring blazing-fast, smooth experiences.",
    },
    {
      q: "Does it support themes and palettes?",
      a: "Absolutely. Every component is color-aware and supports live palette customization.",
    },
    {
      q: "Is Revolyx responsive?",
      a: "Yes. It’s built with full responsiveness in mind for mobile, tablet, and desktop.",
    },
  ];

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* === Hero Section === */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-28 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute inset-0 bg-gradient-to-br from-zinc-200/40 to-transparent dark:from-white/5 dark:to-black/50 pointer-events-none"
        />

       <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6" > Build the Future with{" "} <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent"> Revolyx </span> </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl mb-10 relative z-10"
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
      </section>

      {/* === Features Grid Section === */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center mb-14 bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent"
        >
          Unified Tools for Creative Developers
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              whileHover={{ scale: 1.04, y: -3 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="relative overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm hover:shadow-lg"
            >
              <Icon className="mb-4 h-8 w-8 text-zinc-800 dark:text-zinc-100" />
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* === FAQ Section === */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
          Frequently Asked Questions
        </h2>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map(({ q, a }, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border-b border-zinc-300 dark:border-zinc-800"
            >
              <AccordionTrigger className="text-lg font-medium hover:text-zinc-800 dark:hover:text-zinc-100">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* === Explore Modal === */}
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
        className="group flex flex-col items-center justify-center rounded-2xl p-4 sm:p-5 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
      >
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 shadow-inner group-hover:shadow group-hover:from-primary/10 group-hover:to-primary/20 transition-all"
        >
          <Icon className="w-6 h-6 text-zinc-800 dark:text-zinc-100 group-hover:text-primary transition-colors" />
          <div className="absolute inset-0 rounded-xl bg-white/5 dark:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>

        <span className="mt-2 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center truncate group-hover:text-primary transition-colors">
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
