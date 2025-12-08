"use client";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Palette,
  ChartAreaIcon,
  Chromium,
  Wallpaper,
  FolderDown,
  QrCode,
  ListCheckIcon,
  CupSoda,
  MoreVertical,
  Menu,
  X,
  Code2,
  LucideFootprints,
  Dessert,
  Type,
  Server,
  Brain,
  Terminal,
  Crop,
  FileJson,
  ShieldCheckIcon,
  MicIcon,
  VideoIcon,
  Cpu,
  FileQuestion,
  FileArchiveIcon,
  Network
  
} from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { useTheme } from "@/components/theme-provider";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme } = useTheme();
  const location = useLocation();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

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

  // Desktop shows FIRST 5 → rest inside "More"
  const desktopMain = navItems.slice(0, 5);
  const desktopMore = navItems.slice(5);

  // Mobile bottom bar → first 3 only
  const mobileMain = navItems.slice(0, 3);
  const mobileMore = navItems.slice(3);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path) =>
    location.pathname === path ? "text-primary font-semibold" : "";

  return (
    <>
      {/* ================= Sticky Header ================= */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
          isScrolled
            ? "bg-white/70 dark:bg-black/70 border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-8xl mx-auto flex items-center justify-between px-5 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 select-none">
            <motion.h1
              whileHover={{ scale: 1.05 }}
              className="text-2xl flex items-center font-extrabold bg-gradient-to-r from-black to-gray-700 dark:from-white dark:to-gray-400 bg-clip-text text-transparent"
            >
              <img
                src="/logo.png"
                alt="Logo"
                className={`h-8 ${isDark ? "invert brightness-150" : ""}`}
              />
              Revolyx
            </motion.h1>
          </Link>

          {/* ================= Desktop Navigation ================= */}
          <nav className="hidden lg:flex items-center gap-6 relative">
            {desktopMain.map(({ name, icon: Icon, path }) => (
              <Link
                key={name}
                to={path}
                className={`flex items-center gap-2 text-sm transition hover:text-primary ${isActive(
                  path
                )} text-gray-600 dark:text-gray-300`}
              >
                <Icon size={18} />
                {name}
              </Link>
            ))}

            {/* More (Desktop) */}
            <div className="relative">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className="flex items-center gap-1 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-primary transition"
              >
                <MoreVertical  size={20} />
                <span className="text-sm">More</span>
              </button>

              <AnimatePresence>
                {isMoreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-56 overflow-y-auto h-150 no-scrollbar bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-border/40 rounded-xl shadow-xl p-3 grid grid-cols-1 gap-2 z-50"
                  >
                    {desktopMore.map(({ name, icon: Icon, path }) => (
                      <Link
                        key={name}
                        to={path}
                        onClick={() => setIsMoreOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition"
                      >
                        <Icon size={16} className="text-primary" />
                        <span className="text-sm">{name}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <ModeToggle />
            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden text-gray-700 dark:text-gray-200 hover:text-primary"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* ================= Mobile Full Screen Menu ================= */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xl flex items-center justify-center"
          >
            <div className="relative bg-white/80 dark:bg-zinc-900/80 rounded-3xl p-6 grid grid-cols-3 gap-6 max-w-sm mx-auto shadow-2xl">
              {navItems.map(({ name, icon: Icon, path }) => (
                <Link
                  key={name}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex flex-col items-center text-center hover:scale-105 transition"
                >
                  <div className="p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs mt-2">{name}</span>
                </Link>
              ))}

              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-5 right-5 text-gray-700 dark:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= Mobile Bottom Bar ================= */}
      <motion.nav
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-40  border-t border-border backdrop-blur-xl bg-white/80 dark:bg-black/80 flex justify-around items-center py-3 lg:hidden"
      >
        {mobileMain.map(({ name, icon: Icon, path }) => (
          <Link
            key={name}
            to={path}
            className={`flex flex-col items-center ${
              location.pathname === path ? "text-primary" : "text-gray-400"
            }`}
          >
            <Icon size={22} />
            <span className="text-[11px]">{name}</span>
          </Link>
        ))}

        {/* More Button */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className="flex flex-col items-center text-gray-400 hover:text-primary transition"
        >
          <MoreVertical size={22} />
          <span className="text-[11px]">More</span>
        </button>

        {/* Floating More Panel */}
        <AnimatePresence>
          {isMoreOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-16 right-3 bg-white/90 dark:bg-zinc-900/90 border rounded-xl shadow-lg p-4 grid grid-cols-3 gap-4"
            >
              {mobileMore.map(({ name, icon: Icon, path }) => (
                <Link
                  key={name}
                  to={path}
                  onClick={() => setIsMoreOpen(false)}
                  className="flex flex-col items-center hover:scale-105 transition"
                >
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] mt-1">{name}</span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* header spacing */}
      <div className="h-16 md:h-20"></div>
    </>
  );
}
