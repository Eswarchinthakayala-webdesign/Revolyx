/* eslint-disable react/prop-types */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardHeader,CardDescription, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTheme } from "../components/theme-provider";
import '../markdown.css'

import InstallMd from "../docs/Installation.md?raw";
import RequiredMd from "../docs/Required.md?raw";
import ThemingMd from "../docs/Theming.md?raw";
import ColorsMd from "../docs/Colors.md?raw";
import ColorsIntroMd from "../docs/ColorsIntro.md?raw";
import ChartsIntroMd from "../docs/charts-intro.md?raw";
import ChartsMd from "../docs/charts.md?raw";
import ChartsThemingMd from "../docs/charts-theming.md?raw";



import ResponsiveSidebar from "../components/DocSidebar";

/**
 * Documention.jsx (updated)
 *
 * Key improvements:
 * - Left baseline and thin-bar indicators aligned on the same vertical line.
 * - Clicking left topic loads markdown & right-side subtopics (derived from headings).
 * - Right subtopic active state updates during scroll; last heading selection fixed.
 * - Robust, single measurement pipeline (ResizeObserver + MutationObserver + scroll).
 * - Prevents infinite re-renders by only setting state when values actually change.
 * - Improved professional layout + theme toggle persisted to localStorage.
 */

/* -----------------------
   Data: menu + topic contents
   ----------------------- */

const menuSections = [
  {
    title: "Introduction",
    items: [
      "Introduction",
      "Installation",
      "Required",
    ],
  },
  {
    title: "Revolyx Color",
    items: [
      "ColorsIntro",
      "Colors",
      "Themes",
      
    ],
  },
    {
    title: "Revolyx Charts",
    items: [
      "ChartsIntro",
      "Charts",
      "ChartsTheming",
      
    ],
  },
];

/* Full markdown for one topic (debug); placeholders for others */
const topicContent = {
  Introduction: `
## Introduction  

Revolyx is a unified design and development platform for icons, charts, flowcharts, colors, and background design — built for developers, designers, and creators who value speed, control, and beauty.


**Revolyx is not a single tool. It’s your complete creative workspace.**

Most designers and developers spend hours switching between websites to find icons, chart examples, loaders, color palettes, and visual inspiration. Revolyx brings everything together — in one clean, powerful interface.

It’s built around five key pillars:

- **Icons:** Browse and copy over 200,000+ icons from all major libraries — including Lucide, Remix, Iconify, Fluent, and more.  
- **Charts:** Explore interactive chart examples powered by Recharts — all customizable and copy-ready.  
- **Loaders & Animations:** A collection of animated spinners, loaders, and motion-based icons for instant use.  
- **Flowcharts:** Create and visualize logical flows easily with the Flow Generator — powered by React Flow.  
- **Colors & Backgrounds:** Access thousands of color codes, palettes, and gradient backgrounds, all copyable with one click.  


## Unified Visual Toolkit

Revolyx gives you **everything you need to design and prototype visuals quickly** — without leaving your dev environment.

- 200k+ vector icons  
- 100+ animated loaders  
- 50+ chart patterns (line, bar, radar, pie, area, etc.)  
- Interactive flowchart editor  
- 1000+ curated colors and gradients  

Each category is designed to work seamlessly together, giving you a **cohesive design system out-of-the-box.**


## Icon Explorer

The Revolyx Icon Explorer is one of the largest and fastest icon discovery engines.

- **Libraries:** Iconify, Lucide, Remix, Tabler, Fluent, Boxicons, Iconoir, and more.  
- **Animated Icons:** Built-in motion previews for sets like line-md and svg-spinners.  
- **Smart Search:** Search by name, tag, or style.  
- **Alphabetic Jump:** Instantly navigate through massive collections.  
- **Copy Code Instantly:** Export as React, HTML, SVG, or Tailwind JSX snippets.  

_Your entire icon library — searchable, categorized, and ready to use._


## Recharts Gallery

A complete **visual gallery** of chart examples — from simple bar charts to complex data visualizations.

- **Live Examples:** Interactive charts with tooltips and animations.  
- **Customizable Props:** Change colors, labels, and data in real time.  
- **Copy & Paste Ready:** Each example comes with pre-built React + Recharts code.  
- **AI Preview (Coming Soon):** Let AI generate charts from your data input.

_Design. Test. Copy. Implement._


## Animated Loaders

Revolyx includes a vibrant set of **animated loaders and motion icons**, ideal for web and app UIs.

- **Previews in Light/Dark Mode**
- **Configurable Size & Speed**
- **Copy as SVG or JSX**
- **Based on Iconify Animation Sets**

_Instantly add dynamic motion to your UI with zero setup._


## Flowcharts & Generator

Design and visualize logic flows, systems, and app architecture with ease.

- **Interactive Flowchart Canvas:** Drag, connect, and arrange nodes visually.  
- **Flow Generator:** Create flow diagrams automatically from text or structured input.  
- **Editable Nodes:** Customize shapes, labels, and connectors.  
- **Export Options:** Save your flow as image or React Flow JSON.

_Your ideas — visualized instantly._



## Colors & Backgrounds

A complete **color system explorer** for UI and graphic design.

- **Color Palettes:** Explore curated themes and brand color collections.  
- **Background Gradients:** Copy ready-to-use linear and radial gradients.  
- **Instant Copy:** Get HEX, RGB, or HSL codes with a click.  
- **Theme Sync:** Automatically preview in light or dark mode.

_The fastest way to find the perfect color or background for your design._


## Designed for Developers & Creators

Revolyx is engineered for simplicity, speed, and creativity.

- **Built with React + Tailwind CSS + shadcn/ui**  
- **Framer Motion animations for smooth transitions**  
- **Optimized for both Desktop & Mobile**  
- **Light/Dark Mode support across all pages**  
- **Persistent search, theme, and preference memory**  

_Revolyx empowers developers, designers, and creators to move from idea to implementation — faster than ever._


## Open Code Philosophy

Like **shadcn/ui**, Revolyx embraces an **Open Code** mindset.

- You can inspect, modify, or extend every module.  
- Each collection (icons, charts, colors) follows a consistent, composable structure.  
- Easy to integrate into your own design system or internal tools.

**Your design tools. Your rules. Open and transparent.**


_“Revolyx brings your visual imagination to life — one icon, one chart, one color at a time.”_

`,

  // placeholders for other items
  Installation: InstallMd,
  Required:RequiredMd,
  Themes: ThemingMd,
  ColorsIntro:ColorsIntroMd,
  Colors: ColorsMd,
  ChartsIntro:ChartsIntroMd,
  Charts:ChartsMd,
  ChartsTheming:ChartsThemingMd,
  Checkbox: "# Checkbox\n\nShort placeholder for Checkbox.",
  Dialog: "# Dialog\n\nShort placeholder for Dialog.",
  "Dropdown Menu": "# Dropdown Menu\n\nShort placeholder for Dropdown Menu.",
  Files: "# Files\n\nShort placeholder for Files.",
};

/* -----------------------
   small helper utilities
   ----------------------- */

const sameShallow = (a = {}, b = {}) => {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (let k of ak) if (a[k] !== b[k]) return false;
  return true;
};

/* slugify title to id */
const slugId = (s = "") =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s/\\#%:;,.?!]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* -----------------------
   Component
   ----------------------- */

export default function DocsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();


  /* Left menu state */
  const [activeLeft, setActiveLeft] = useState("Introduction");
  const [hoverLeft, setHoverLeft] = useState(null);

  /* Markdown state for center */
  const [markdown, setMarkdown] = useState(topicContent[activeLeft] || "# Empty");

  /* Right subtopics derived from rendered markdown */
  const [subtopics, setSubtopics] = useState([]); // [{id, text}]
  const [activeSubtopic, setActiveSubtopic] = useState(null);
  const [hoverRight, setHoverRight] = useState(null);

  /* Refs */
  const leftListRef = useRef(null);
  const rightListRef = useRef(null);
  const contentRef = useRef(null);

  const leftButtonRefs = useRef({}); // key -> dom node
  const rightButtonRefs = useRef({}); // id -> dom node
  const headingElementsRef = useRef({}); // id -> heading dom element

  /* positions for indicators (top offsets relative to container) */
  const [leftPositions, setLeftPositions] = useState({});
  const [leftHeights, setLeftHeights] = useState({});
  const [rightPositions, setRightPositions] = useState({});
  const [rightHeights, setRightHeights] = useState({});

  /* prev refs to avoid unnecessary setState */
  const prevLeftPos = useRef({});
  const prevLeftH = useRef({});
  const prevRightPos = useRef({});
  const prevRightH = useRef({});

  /* update markdown when activeLeft changes */
  useEffect(() => {
    setMarkdown(topicContent[activeLeft] || `# ${activeLeft}\n\nNo content yet.`);
    // reset scroll
    if (contentRef.current) contentRef.current.scrollTop = 0;
    // clear heading refs - will be re-populated after render
    headingElementsRef.current = {};
    rightButtonRefs.current = {};
    setSubtopics([]);
    setActiveSubtopic(null);
  }, [activeLeft]);

  /* After markdown DOM renders, find headings (h2,h3) and populate subtopics.
     We use a MutationObserver to react to MDEditor.Markdown DOM changes robustly.
  */
  useLayoutEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    let destroyed = false;
    let retryCount = 0;
    const MAX_RETRIES = 6;

    const scanHeadings = () => {
      if (destroyed) return [];
      const headings = Array.from(container.querySelectorAll("h2, h3"));
      const cleaned = headings.map((h) => {
        if (!h.id) h.id = slugId(h.textContent || "");
        const id = h.id;
        headingElementsRef.current[id] = h;
        return { id, text: h.textContent.trim(), level: h.tagName.toLowerCase() };
      });

      // setSubtopics only if changed
      setSubtopics((prev) => {
        const prevIds = (prev || []).map((p) => p.id).join("|");
        const nextIds = (cleaned || []).map((p) => p.id).join("|");
        if (prevIds !== nextIds) return cleaned;
        return prev;
      });

      // set first activeSubtopic if none already set
      setActiveSubtopic((prev) => prev || (cleaned[0] && cleaned[0].id) || null);

      // measure positions after headings exist (defer to next frame)
      requestAnimationFrame(() => {
        if (!destroyed) measurePositions();
      });

      return cleaned;
    };

    // initial scan in next paint
    requestAnimationFrame(() => {
      const found = scanHeadings();
      // if nothing found, schedule retries (renderer may be async)
      if ((!found || found.length === 0) && retryCount < MAX_RETRIES) {
        const attempt = () => {
          if (destroyed) return;
          retryCount += 1;
          const found2 = scanHeadings();
          if ((!found2 || found2.length === 0) && retryCount < MAX_RETRIES) {
            setTimeout(attempt, 80 * retryCount); // exponential-ish backoff
          }
        };
        setTimeout(attempt, 60);
      }
    });

    // mutation observer as robust fallback
    const mo = new MutationObserver(() => {
      // whenever DOM inside container changes, rescan
      scanHeadings();
    });
    mo.observe(container, { childList: true, subtree: true, characterData: true });

    return () => {
      destroyed = true;
      mo.disconnect();
    };
    // Re-run when markdown changes (new content)
  }, [markdown]);

  /* measurePositions - measure left & right items relative to their containers.
     Use getBoundingClientRect so values are accurate and stable across transforms.
  */
  const measurePositions = () => {
    // LEFT
    const leftCont = leftListRef.current;
    const newLeftPos = {};
    const newLeftH = {};
    if (leftCont) {
      const contRect = leftCont.getBoundingClientRect();
      Object.entries(leftButtonRefs.current).forEach(([key, el]) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const top = Math.round(r.top - contRect.top + leftCont.scrollTop);
        newLeftPos[key] = top;
        newLeftH[key] = Math.round(r.height || 36);
      });
    }

    // RIGHT
    const rightCont = rightListRef.current;
    const newRightPos = {};
    const newRightH = {};
    if (rightCont) {
      const contRect = rightCont.getBoundingClientRect();
      Object.entries(rightButtonRefs.current).forEach(([key, el]) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const top = Math.round(r.top - contRect.top + rightCont.scrollTop);
        newRightPos[key] = top;
        newRightH[key] = Math.round(r.height || 28);
      });
    }

    // Compare and set only if changed
    if (!sameShallow(prevLeftPos.current, newLeftPos)) {
      prevLeftPos.current = newLeftPos;
      setLeftPositions(newLeftPos);
    }
    if (!sameShallow(prevLeftH.current, newLeftH)) {
      prevLeftH.current = newLeftH;
      setLeftHeights(newLeftH);
    }
    if (!sameShallow(prevRightPos.current, newRightPos)) {
      prevRightPos.current = newRightPos;
      setRightPositions(newRightPos);
    }
    if (!sameShallow(prevRightH.current, newRightH)) {
      prevRightH.current = newRightH;
      setRightHeights(newRightH);
    }
  };

   useEffect(() => {
    const urlTopic = searchParams.get("topic");
    if (urlTopic && topicContent[urlTopic]) {
      setActiveLeft(urlTopic);
      setMarkdown(topicContent[urlTopic]);
    }
  }, []);

  /* -----------------------
     Update URL when topic changes
  ------------------------ */
  useEffect(() => {
    if (!activeLeft) return;
    setMarkdown(topicContent[activeLeft] || `# ${activeLeft}`);
    setSearchParams({ topic: activeLeft });
    window.scrollTo(0, 0);
  }, [activeLeft]);

  /* Measurements and observers setup (ResizeObserver + scroll handlers).
     We set up a ResizeObserver on left, right, content and window resize to re-measure.
  */
  useLayoutEffect(() => {
    // do an initial measure
    measurePositions();

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measurePositions);
    });

    if (leftListRef.current) ro.observe(leftListRef.current);
    if (rightListRef.current) ro.observe(rightListRef.current);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", measurePositions);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measurePositions);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtopics, markdown]);

  const {theme}=useTheme()
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

  /* Scroll sync:
     - Listens to scroll on contentRef
     - Determines which heading is active based on offsetTop and threshold
     - Also checks if scrolled to bottom to set last heading active
  */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const headings = (subtopics || []).map((s) => ({
          id: s.id,
          el: headingElementsRef.current[s.id],
        })).filter(Boolean);

        if (headings.length === 0) {
          setActiveSubtopic(null);
          return;
        }

        // if scrolled to bottom, choose last heading
        const atBottom =
          Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) <= 6;

        if (atBottom) {
          const last = headings[headings.length - 1];
          setActiveSubtopic((prev) => (prev === last.id ? prev : last.id));
          return;
        }

        // threshold: a bit below top of content area so section "sticks"
        const threshold = 120;
        let found = null;
        for (let i = 0; i < headings.length; i++) {
          const h = headings[i];
          if (!h.el) continue;
          const rect = h.el.getBoundingClientRect();
          const containerRect = el.getBoundingClientRect();
          const relativeTop = rect.top - containerRect.top;
          if (relativeTop <= threshold) {
            found = h.id;
          } else {
            break; // headings are in document order
          }
        }
        if (!found) found = headings[0].id;
        setActiveSubtopic((prev) => (prev === found ? prev : found));
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    // initial sync
    onScroll();

    return () => el.removeEventListener("scroll", onScroll);
  }, [subtopics]);

  /* When subtopics or DOM changes, re-measure and rebuild rightButtonRefs
     We do this after a slight delay so DOM is stable (MDEditor may render asynchronously)
  */
  useEffect(() => {
    // build rightButtonRefs from DOM nodes inside right list container after render
    const t = setTimeout(() => {
      // populate rightButtonRefs by DOM lookup (right-list children)
      const rightCont = rightListRef.current;
      if (rightCont) {
        Object.values(rightButtonRefs.current).forEach((_) => {}); // keep current
      }
      // measure positions after
      measurePositions();
    }, 40);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtopics, markdown]);

  /* scroll to subtopic - centers slightly below top for better UX */
  const scrollToSubtopic = (id) => {
    const el = headingElementsRef.current[id];
    const container = contentRef.current;
    if (!el || !container) return;
    // compute top relative to container
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const top = container.scrollTop + (elRect.top - containerRect.top) - 28;
    container.scrollTo({ top, behavior: "smooth" });
  };

  /* helper: compute left column thinbar left offset CSS value (same for both lists)
     We'll define a shared offset that aligns baseline line and thin bars.
  */
  const INDICATOR_LEFT_PX = 20; // px from left-list/right-list container inner left padding

  /* UI render */
  return (
    <div className={`  max-h-[500px] max-w-8xl mx-auto   text-gray-900 dark:text-gray-100`}>
      <div className=" flex sm:flex-row flex-col gap-6 px-4 md:px-8 pt-6">
        {/* Left column */}
       <ResponsiveSidebar
        menuSections={menuSections}
        activeLeft={activeLeft}
        setActiveLeft={setActiveLeft}
        hoverLeft={hoverLeft}
        setHoverLeft={setHoverLeft}
        leftPositions={leftPositions}
        leftHeights={leftHeights}
        leftListRef={leftListRef}
        leftButtonRefs={leftButtonRefs}
        isDark={isDark}
        />


        {/* Center content */}
        <main className="flex-1 overflow-hidden pb-20">
          <Card className="rounded-xl shadow-lg border bg-white dark:bg-black border-neutral-800/30 p-6">
            <CardHeader className="flex items-start justify-between gap-6">
              <div>
                <CardTitle className="text-2xl font-bold mb-1">{activeLeft}</CardTitle>
                <CardDescription className="text-sm text-neutral-400">Documentation • {activeLeft}</CardDescription>
              </div>
            </CardHeader>

            <CardContent
              ref={contentRef}
              id="doc-content"
              className="prose prose-lg dark:prose-invert mt-6 pb-20 no-scrollbar text-neutral-800 dark:text-neutral-200 overflow-auto"
              style={{ maxHeight: "72vh", paddingRight: 18 }}
            >
             <div data-color-mode={isDark ? "dark" : "light"}
            className="prose prose-invert sm:max-w-5xl sm:mx-auto dark:bg-[#0a0a0a] bg-white text-neutral-200  ">
                <div className="wmde-markdown-var"> </div>
                    <MDEditor.Markdown 
                source={markdown}
                className="bg-transparent sm:text-lg p-4 rounded-xl" // add global ul styles - tutorial
              />
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Right: On this page */}
        <aside className="w-64 hidden lg:block">
          <div className="bg-white dark:bg-[#070707]  p-4">
            <CardHeader className="flex items-center justify-between mb-3">
              <CardTitle className="text-sm font-semibold text-neutral-500">On this page</CardTitle>
            </CardHeader>

            <CardContent
              id="right-list"
              ref={rightListRef}
              className="relative overflow-auto"
              style={{ maxHeight: "72vh", paddingLeft: INDICATOR_LEFT_PX + 8 }}
            >
              {/* baseline vertical line for right - same left offset */}
              <div
                style={{
                  position: "absolute",
                  left: INDICATOR_LEFT_PX - 2,
                  top: 8,
                  bottom: 8,
                  width: 1,
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                  pointerEvents: "none",
                  borderRadius: 2,
                }}
                aria-hidden
              />

              {/* hover indicator */}
              <AnimatePresence>
                {hoverRight && rightPositions[hoverRight] != null && (
                  <motion.div
                    key="rh"
                    initial={false}
                    animate={{
                      top: rightPositions[hoverRight],
                      height: rightHeights[hoverRight] || 28,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 45 }}
                    style={{
                      position: "absolute",
                      left: INDICATOR_LEFT_PX - 3,
                      width: 3,
                      background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
                      borderRadius: 4,
                      zIndex: 10,
                    }}
                  />
                )}
              </AnimatePresence>

              {/* active indicator */}
              {activeSubtopic && rightPositions[activeSubtopic] != null && (
                <motion.div
                  layoutId="right-active"
                  animate={{
                    top: rightPositions[activeSubtopic],
                    height: rightHeights[activeSubtopic] || 28,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  style={{
                    position: "absolute",
                    left: INDICATOR_LEFT_PX - 3,
                    width: 4,
                    background: isDark ? "#fff" : "#111827",
                    borderRadius: 4,
                    zIndex: 20,
                    boxShadow: isDark
                      ? "0 4px 16px rgba(255,255,255,0.03)"
                      : "0 6px 20px rgba(2,6,23,0.08)",
                  }}
                />
              )}

              <ul className="space-y-1">
                {subtopics.length === 0 ? (
                  <li className="text-sm text-neutral-400 px-3 py-2">No subtopics</li>
                ) : (
                  subtopics.map((s) => (
                    <li key={s.id}>
                      <button
                        ref={(r) => (rightButtonRefs.current[s.id] = r)}
                        onClick={() => {
                          scrollToSubtopic(s.id);
                          // small delay to allow scroll to finish then set active
                          setTimeout(() => setActiveSubtopic(s.id), 300);
                        }}
                        onMouseEnter={() => setHoverRight(s.id)}
                        onMouseLeave={() => setHoverRight(null)}
                        className={`w-full text-left cursor-pointer px-2 py-1 rounded-md text-sm transition-all ${
                          activeSubtopic === s.id
                            ? "dark:text-white text-bl4  font-medium"
                            : "dark:text-neutral-400 text-neutral-700 hover:text-neutral-800"
                        }`}
                      >
                        {s.text}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </div>
        </aside>
      </div>
    </div>
  );
}
