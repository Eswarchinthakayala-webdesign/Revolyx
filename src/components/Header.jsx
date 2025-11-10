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
  Menu,
  X,
  MoreHorizontal,
  Sparkles,
  Code2,
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
      { name: "Code Snippet", icon: Code2, path: "/code-snippet" },
  ];

  const mainNav = navItems.slice(0, 3); // First 3 visible in bottom bar
  const moreNav = navItems.slice(3); // Remaining in “More”

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path) =>
    location.pathname === path ? "text-primary font-semibold" : "";

  return (
    <>
      {/* === Sticky Header === */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
          isScrolled
            ? "bg-white/70 dark:bg-black/70 border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-8xl mx-auto flex items-center justify-between px-5 py-3">
          {/* === Logo === */}
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

          {/* === Desktop Nav === */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map(({ name, icon: Icon, path }) => (
              <Link
                key={name}
                to={path}
                className={`flex items-center gap-2 text-sm transition-colors hover:text-primary ${isActive(
                  path
                )} text-gray-600 dark:text-gray-300`}
              >
                <Icon size={18} />
                {name}
              </Link>
            ))}
          </nav>

          {/* === Right Controls === */}
          <div className="flex items-center gap-3">
            <ModeToggle />
            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden text-gray-700 dark:text-gray-200 hover:text-primary transition"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* === Overlay Menu (Mobile “App Grid” Style) === */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xl flex items-center justify-center"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white/80 dark:bg-zinc-900/80 rounded-3xl p-6 grid grid-cols-3 gap-6 max-w-sm mx-auto shadow-2xl"
            >
              {navItems.map(({ name, icon: Icon, path }) => (
                <Link
                  key={name}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex flex-col items-center justify-center text-center hover:scale-105 transition-transform"
                >
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-pink-500/10 hover:from-primary/20 hover:to-pink-500/20 transition-all">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs mt-2 text-gray-700 dark:text-gray-300">
                    {name}
                  </span>
                </Link>
              ))}
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-5 right-5 text-gray-600 dark:text-gray-300 hover:text-primary"
              >
                <X size={24} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === Mobile Bottom Bar === */}
      <motion.nav
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border backdrop-blur-xl bg-white/80 dark:bg-black/80 flex justify-around items-center py-3 lg:hidden"
      >
        {mainNav.map(({ name, icon: Icon, path }) => (
          <Link
            key={name}
            to={path}
            className={`flex flex-col items-center ${
              location.pathname === path
                ? "text-primary"
                : "text-gray-500 dark:text-gray-400 hover:text-primary"
            }`}
          >
            <Icon size={22} />
            <span className="text-[11px] mt-1">{name}</span>
          </Link>
        ))}

        {/* More Option */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className="flex flex-col items-center text-gray-500 dark:text-gray-400 hover:text-primary transition"
        >
          <MoreHorizontal size={22} />
          <span className="text-[11px] mt-1">More</span>
        </button>

        {/* Floating More Box */}
        <AnimatePresence>
          {isMoreOpen && (
            <motion.div
              key="more"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-16 right-3 bg-white/90 dark:bg-zinc-900/90 border border-border/40 rounded-2xl shadow-2xl p-4 grid grid-cols-3 gap-4 backdrop-blur-lg"
            >
              {moreNav.map(({ name, icon: Icon, path }) => (
                <Link
                  key={name}
                  to={path}
                  onClick={() => setIsMoreOpen(false)}
                  className="flex flex-col items-center text-center hover:scale-105 transition-transform"
                >
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-pink-500/10 hover:from-primary/20 hover:to-pink-500/20 transition-all">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] mt-1 text-gray-700 dark:text-gray-300">
                    {name}
                  </span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Padding for Header */}
      <div className="h-16 md:h-20"></div>
    </>
  );
}
