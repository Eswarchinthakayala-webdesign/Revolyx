"use client";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Palette,
  Layers,
  Book,
  Menu,
  X,
  Sparkles,
  ChartAreaIcon,
  Chromium,
  Wand,
  Grid3X3,
  FolderDown,
  Wallpaper,
  CupSoda,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme } = useTheme();
  const location = useLocation();

  // Add blur on scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Colors", icon: Palette, path: "/colors" },
    { name: "Charts", icon: ChartAreaIcon, path: "/charts" },
    { name: "Spinners", icon: Chromium, path: "/spinners" },
    {name:"All Icons",icon:CupSoda,path:"/all-icons?lib=LucideReact"},
    {name:"Designs",icon:Wallpaper,path:"/designs"},
    {name:"QR Code",icon:QrCode,path:"/qr-code"},
    {name:"Flow Chart",icon:FolderDown,path:"/flow-chart"},

  ]; 

    const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const isActive = (path) =>
    location.pathname === path ? "text-black dark:text-white font-semibold" : "";

  return (
    <>
      {/* === Sticky Top Header === */}
      <motion.header
        initial={{ y: -25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-300 border-b-2 ${
          isScrolled
            ? "border-gray-300/30 dark:border-white/10 bg-white/70 dark:bg-black/70 shadow-md"
            : ""
        }`}
      >
        <div className="max-w-8xl mx-auto flex items-center justify-between px-6 py-3">
          {/* === Logo === */}
          <Link to="/" className="flex items-center gap-2">
            <motion.h1
              whileHover={{ scale: 1.05 }}
              className="text-2xl gap-1 flex items-center flex-row font-extrabold tracking-tight bg-gradient-to-r from-black to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent select-none"
            > 
            <img
              src="/logo.png"
              alt="Logo"
              className={`h-8 sm:h-10 ${
                isDark ? "invert brightness-150" : "brightness-200"
              }`}
            />
              Revolyx
            </motion.h1>
          </Link>

          {/* === Desktop Nav === */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map(({ name, icon: Icon, path }) => (
              <Link
                key={name}
                to={path}
                className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-150 ${isActive(
                  path
                )}`}
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* === Mobile Dropdown Menu === */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden  bg-white/80 dark:bg-black/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 p-5 flex flex-col gap-4"
          >
            {navItems.map(({ name, icon: Icon, path }) => (
              <Link
                key={name}
                to={path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition ${isActive(
                  path
                )}`}
              >
                <Icon size={20} />
                {name}
              </Link>
            ))}
          </motion.div>
        )}
      </motion.header>

      {/* === Full-Width Bottom Navigation (Mobile) === */}
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-300 dark:border-white/10 backdrop-blur-lg bg-white/80 dark:bg-black/80 flex justify-around items-center py-3 md:hidden"
      >
        {navItems.slice(0, 6).map(({ name, icon: Icon, path }) => (
          <Link
            key={name}
            to={path}
            className={`flex flex-col items-center transition ${
              location.pathname === path
                ? "text-black dark:text-white font-medium"
                : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <Icon size={22} />
            <span className="text-[11px] mt-1">{name}</span>
          </Link>
        ))}
      </motion.nav>

      {/* === Padding for Header === */}
      <div className="h-16 md:h-20"></div>
    </>
  );
}
