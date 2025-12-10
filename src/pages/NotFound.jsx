// src/pages/NotFoundRevolyxFinal.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowLeftCircle,ArrowRightCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme-provider"; // optional - fallback handled
import clsx from "clsx";

/* --------- User phrases & layout (from your list) --------- */
const CARD_PHRASES = [
  "Revolyx — Where ideas take shape",
  "Explore the future of creative tools",
  "Innovation behind the code",
  "Your journey starts here",
  "Crafted with intelligence",
  "Tools that empower your workflow",
  "Creativity fueled by AI",
  "Built for modern developers",
  "Precision meets design",
  "Find your way back →",
];

// Pre-defined scattered positions & rotation
const CARD_LAYOUT = [
  { left: "4%", top: -220, targetBottom: 8, rotate: -18, width: 260 },
  { left: "18%", top: -280, targetBottom: 14, rotate: -8, width: 300 },
  { left: "34%", top: -240, targetBottom: 4, rotate: 12, width: 280 },
  { left: "50%", top: -300, targetBottom: 10, rotate: -10, width: 320 },
  { left: "66%", top: -260, targetBottom: 6, rotate: 6, width: 260 },
  { left: "78%", top: -280, targetBottom: 12, rotate: -22, width: 300 },
  { left: "86%", top: -260, targetBottom: 4, rotate: 10, width: 200 },
  { left: "8%", top: -320, targetBottom: 44, rotate: -42, width: 180 },
  { left: "88%", top: -320, targetBottom: 44, rotate: 44, width: 180 },
  { left: "42%", top: -340, targetBottom: 50, rotate: 0, width: 220 },
];

export default function NotFoundRevolyxFinal() {
  const navigate = useNavigate();
  // theme provider fallback
  const themeObj = useTheme ? useTheme() : { theme: "dark" };
  const { theme } = themeObj;
  const [isDark, setIsDark] = useState(theme === "dark");
  const [cardsSettled, setCardsSettled] = useState(false); // after load fall-in
  const [cardsFallen, setCardsFallen] = useState(false); // after click fall-out
  const [lettersFalling, setLettersFalling] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (theme === "system") {
      const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefers);
    } else {
      setIsDark(theme === "dark");
    }
  }, [theme]);

  // Headline split into characters for falling effect
  const headline = "You're in uncharted design territory!";
  const headlineChars = useMemo(() => headline.split(""), [headline]);

  // On mount, set a timer to mark cards settled after entrance animations
  useEffect(() => {
    // we estimate longest initial animation ~ 1.1s + stagger
    const t = setTimeout(() => setCardsSettled(true), 1400);
    return () => clearTimeout(t);
  }, []);

  // Click handler: right diamond triggers the dramatic fall
  const handleTriggerFall = async () => {
    if (isLoading) return;
    setIsLoading(true);

    // begin letters falling slightly after click
    setTimeout(() => setLettersFalling(true), 80);

    // cards also fall (you selected yes)
    setTimeout(() => setCardsFallen(true), 200);

    // Show thank-you message after animation completes
    setTimeout(() => {
      setShowThanks(true);
      // hide the thanks after 3 seconds (Q4)
      setTimeout(() => {
        setShowThanks(false);
        setIsLoading(false);
        // keep page active; navigation left to user via Return Home
      }, 3000);
    }, 900); // after fall starts (timing feels smooth)
  };

  // Return home via CTA (top center)
  const handleReturnHome = () => {
    navigate("/");
  };

  // Variants
  const letterVariants = {
    idle: { y: 0, opacity: 1, rotate: 0 },
    fall: (i) => ({
      y: 700 + Math.random() * 120,
      opacity: 0,
      rotate: -25 + Math.random() * 50,
      transition: { delay: i * 0.03, type: "spring", stiffness: 90, damping: 12 }
    })
  };

  // Card initial (from top) -> settle -> fall
  const cardVariants = {
    initial: (i) => ({ y: CARD_LAYOUT[i % CARD_LAYOUT.length].top * 1, opacity: 0 }),
    dropIn: (i) => ({
      y: 0,
      opacity: 1,
      rotate: CARD_LAYOUT[i % CARD_LAYOUT.length].rotate,
      transition: { delay: 0.12 + i * 0.06, type: "spring", stiffness: 120, damping: 16 }
    }),
    fallOut: (i) => ({
      y: 900 + Math.random() * 250,
      opacity: 0,
      rotate: CARD_LAYOUT[i % CARD_LAYOUT.length].rotate + (Math.random() > 0.5 ? 40 : -40),
      transition: { duration: 1.0, ease: "easeIn" }
    })
  };

  // Diamond hover variant
  const diamondHover = { scale: 1.08, rotate: 45, transition: { type: "spring", stiffness: 200 } };

  // Colors & styles
  const bg = isDark ? "bg-black" : "bg-white";
  const mainText = isDark ? "text-white" : "text-black";
  const cardBg = isDark ? "bg-white" : "bg-black";
  const cardText = isDark ? "text-black" : "text-white";
  const neon = isDark ? "#7CFFB2" : "#00D66A"; // subtle futuristic green
  const faint404Opacity = 0.14; // more visible 404

  // Make sure the page never scrolls and fits the viewport
  // container uses 100vh and overflow-hidden

  return (
    <div
      className={clsx( " mt-[-100px] h-screen w-screen relative overflow-hidden select-none")}
      aria-labelledby="notfound-title"
      role="main"
    >
      {/* BIG 404 BACKGROUND (now more visible + subtle glow) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: faint404Opacity }}
        transition={{ duration: 1.0 }}
        className="absolute inset-0 top-[40vh] sm:top-[10vh] flex items-start justify-center pointer-events-none"
       
      >
        <div
          className="font-extrabold"
          style={{
            fontSize: "26vw",
            lineHeight: 0.7,
            color: isDark ? "#ffffff" : "#000000",
            textShadow: isDark ? "0 8px 30px rgba(124,255,178,0.06)" : "0 8px 18px rgba(0,0,0,0.06)"
          }}
        >
          404
        </div>
      </motion.div>

      {/* Center content */}
      <div className="relative z-30 w-full h-full flex items-center justify-center">
        <div className="max-w-[1000px] w-full px-6 text-center">
          {/* Headline as per-letter elements */}
          <div className="overflow-hidden">
            <div className="flex flex-wrap justify-center items-center gap-[6px]">
              {headlineChars.map((ch, idx) => (
                <motion.span
                  key={idx}
                  custom={idx}
                  variants={letterVariants}
                  initial="idle"
                  animate={lettersFalling ? "fall" : "idle"}
                  className={clsx("inline-block font-extrabold", mainText)}
                  style={{ fontSize: "clamp(22px, 3.6vw, 52px)", lineHeight: 1 }}
                >
                  {ch === " " ? "\u00A0" : ch}
                </motion.span>
              ))}
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0.95, y: 8 }}
            animate={{ opacity: 0.95, y: 0 }}
            transition={{ delay: 0.08, duration: 0.6 }}
            className={clsx("max-w-2xl mx-auto mt-4 text-sm md:text-base", mainText)}
          >
            Looks like you took a wrong turn. But don't worry — even the best explorers get lost sometimes. Try returning home or explore our tools.
          </motion.p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="outline" onClick={handleReturnHome} className="px-5 py-2">
              <ArrowLeft className="mr-2" />
              Return home
            </Button>

            {/* Quiet indicator when thanks shown */}
            <AnimatePresence>
              {showThanks && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="ml-2 px-3 py-2 rounded-md bg-white/6 backdrop-blur-sm"
                >
                  <div className={clsx("text-sm font-medium", mainText)}>
                    🎉 Thanks for exploring the unknown — you're amazing!
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom cards container: cards fall from top into their scattered positions on load */}
      <div className="absolute left-0 right-0 bottom-11 w-full h-[34vh] pointer-events-none">
        {CARD_PHRASES.map((text, i) => {
          const layout = CARD_LAYOUT[i % CARD_LAYOUT.length];
          return (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="initial"
              animate={cardsFallen ? "fallOut" : "dropIn"}
              style={{
                position: "absolute",
                left: layout.left,
                bottom: layout.targetBottom,
                width: layout.width,
                transformOrigin: "center",
                zIndex: 40 + i
              }}
            >
              {/* card content */}
              <div
                className={clsx(
                  "rounded-sm px-4 py-2 shadow-2xl transform",
                  isDark ? "bg-white" : "bg-black"
                )}
                style={{
                  rotate: `${layout.rotate}deg`,
                  boxShadow: isDark
                    ? "0 10px 30px rgba(3,8,15,0.6), 0 2px 10px rgba(0,0,0,0.25)"
                    : "0 8px 20px rgba(2,6,23,0.06)"
                }}
              >
                <div className={clsx("text-xs font-medium leading-tight", isDark ? "text-black" : "text-white")}>
                  {text}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom-left diamond (go back) */}
      <motion.button
        whileHover={{ scale: 1.06, rotate: 45 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => window.history.back()}
        aria-label="Go back"
        className="absolute left-6 bottom-6 cursor-pointer w-12 h-12 flex items-center justify-center rounded-sm z-50"
        style={{
          transform: "rotate(45deg)",
          background: neon,
          boxShadow: `0 10px 30px ${isDark ? "rgba(124,255,178,0.12)" : "rgba(0,0,0,0.08)"}`
        }}
      >
        <div style={{ transform: "rotate(-45deg)" }}>
          <span style={{ color: "#000", fontWeight: 700 }} aria-hidden>
            <ArrowLeftCircle  className="h-6 w-6 text-black/80 dark:text-white"/>
          </span>
        </div>
      </motion.button>

      {/* Bottom-right diamond (trigger fall) */}
      <motion.button
        whileHover={{ scale: 1.06, rotate: 45 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleTriggerFall}
        aria-label="Trigger animation"
        className="absolute right-6 bottom-6 cursor-pointer w-12 h-12 flex items-center justify-center rounded-sm z-50"
        style={{
          transform: "rotate(45deg)",
          background: neon,
          boxShadow: `0 10px 30px ${isDark ? "rgba(124,255,178,0.12)" : "rgba(0,0,0,0.08)"}`
        }}
      >
        <div style={{ transform: "rotate(-45deg)" }}>
          <span style={{ color: "#000", fontWeight: 700 }} aria-hidden>
            <ArrowRightCircle className="h-6 w-6 text-black/80 dark:text-white"/>
          </span>
        </div>
      </motion.button>

      {/* subtle futuristic floating shapes (decor) */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 1.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        className="absolute -left-8 top-12 w-36 h-36 rounded-full blur-3xl z-10"
        style={{ background: "linear-gradient(135deg, rgba(124,255,178,0.18), rgba(0,214,106,0.06))" }}
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.25 }}
        transition={{ duration: 2.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        className="absolute right-12 top-20 w-52 h-52 rounded-3xl blur-2xl z-10"
        style={{ background: "linear-gradient(180deg, rgba(0,176,255,0.08), rgba(124,255,178,0.06))" }}
      />
    </div>
  );
}
