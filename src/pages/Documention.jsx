// src/pages/DocumentationPage.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import MDEditor from "@uiw/react-md-editor";
import clsx from "clsx";
import { toast, Toaster } from "sonner";
import {
  Menu,
  Search,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Button,
} from "@/components/ui/button";
import {
  Input,
} from "@/components/ui/input";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ------------------ SAMPLE DOCUMENT SECTIONS ------------------ */
const docsSections = [
  {
    id: "intro",
    title: "Introduction",
    markdown: `
# Welcome to Revolyx Documentation

This page demonstrates a professional, scroll-synced documentation layout.

Features include:
- Scroll indicator synced with sections
- Fixed left & right navigation
- Smooth scrolling and section detection
- Markdown rendering with **@uiw/react-md-editor**

`,
  },
  {
    id: "setup",
    title: "Setup Guide",
    markdown: `
## Setup Guide

1. Install required dependencies:
   \`\`\`bash
   npm install @uiw/react-md-editor sonner lucide-react
   \`\`\`

2. Import the components:
   \`\`\`jsx
   import MDEditor from "@uiw/react-md-editor";
   import { toast } from "sonner";
   \`\`\`
   `,
  },
  {
    id: "usage",
    title: "Usage Example",
    markdown: `
## Usage Example

Here's an example of using \`MDEditor.Markdown\` to render content:

\`\`\`jsx
<MDEditor.Markdown
  source={\`## Hello, Revolyx Docs!\\nThis is **markdown** rendered beautifully.\`}
/>
\`\`\`
`,
  },
  {
    id: "components",
    title: "Component Design",
    markdown: `
## Component Design

Revolyx uses **shadcn/ui** for components:
- Buttons
- Inputs
- Cards
- Dialogs

Each component is theme-aware and adaptive.
`,
  },
  {
    id: "api",
    title: "API Reference",
    markdown: `
## API Reference

| Prop | Type | Description |
|------|------|-------------|
| \`id\` | string | Unique section identifier |
| \`title\` | string | Section title |
| \`markdown\` | string | Markdown content for section |

`,
  },
  {
    id: "conclusion",
    title: "Conclusion",
    markdown: `
## Conclusion

You can customize this layout easily to match any design system.

Thank you for using **Revolyx Docs** ✨
`,
  },
];

export default function DocumentationPage() {
  const [activeId, setActiveId] = useState(docsSections[0].id);
  const [hoveredId, setHoveredId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const contentRefs = useRef({});
  const indicatorRef = useRef(null);

  /* ---------- Scroll Sync ---------- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 1] }
    );
    docsSections.forEach((sec) => {
      const el = contentRefs.current[sec.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  /* ---------- Handle Sidebar Indicator ---------- */
  const sidebarRef = useRef(null);
  useEffect(() => {
    const activeEl = document.getElementById(`nav-${activeId}`);
    const sidebar = sidebarRef.current;
    if (activeEl && sidebar && indicatorRef.current) {
      const rect = activeEl.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      const offsetTop = rect.top - sidebarRect.top;
      const height = rect.height;
      indicatorRef.current.style.transform = `translateY(${offsetTop}px)`;
      indicatorRef.current.style.height = `${height}px`;
    }
  }, [activeId]);

  /* ---------- Scroll to Section ---------- */
  const scrollToSection = (id) => {
    const el = contentRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setActiveId(id);
      toast.success(`Navigated to ${id}`);
    }
  };

  /* ---------- Layout ---------- */
  return (
    <div className="min-h-screen  dark:text-zinc-100 relative">
      <Toaster richColors />



      {/* Main Layout */}
      <div className="flex20 pb- relative">
        {/* Left Sidebar */}
        <aside className="hidden lg:block lg:w-64 border-r border-zinc-200 dark:border-zinc-800 fixed top-16 bottom-0 left-0 overflow-y-auto">
          <div ref={sidebarRef} className="relative h-full">
            {/* Vertical indicator line */}
            <svg
              className="absolute left-0 top-0 h-full w-[2px] text-zinc-300 dark:text-zinc-700"
              preserveAspectRatio="none"
            >
              <rect width="100%" height="100%" fill="currentColor" />
            </svg>

            {/* Active highlight */}
            <motion.div
              ref={indicatorRef}
              className="absolute left-0 w-[2px] bg-indigo-500 rounded transition-all"
              layout
            />

            <nav className="relative z-10 flex flex-col p-4 space-y-1">
              {docsSections.map((sec) => (
                <button
                  key={sec.id}
                  id={`nav-${sec.id}`}
                  onMouseEnter={() => setHoveredId(sec.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => scrollToSection(sec.id)}
                  className={clsx(
                    "text-left px-3 py-2 text-sm rounded-md transition-colors w-full",
                    activeId === sec.id
                      ? "text-indigo-600 dark:text-indigo-400 font-medium"
                      : hoveredId === sec.id
                      ? "bg-zinc-100/50 dark:bg-zinc-800/40"
                      : "opacity-80 hover:opacity-100"
                  )}
                >
                  {sec.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Middle Documentation Content */}
        <main className="flex-1 lg:ml-64 lg:mr-64  overflow-y-auto px-6 py-10 space-y-24">
          {docsSections.map((sec) => (
            <section
              key={sec.id}
              id={sec.id}
              ref={(el) => (contentRefs.current[sec.id] = el)}
              className="scroll-mt-20 mb-40"
              data-color-mode="dark"
            >
              <MDEditor.Markdown
                source={sec.markdown}
                className="prose prose-zinc dark:prose-invert max-w-3xl  mx-auto"
              />
            </section>
          ))}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:flex lg:w-64 fixed right-0 top-16 bottom-0 border-l border-zinc-200 dark:border-zinc-800 flex-col items-start p-6">
          <div className="w-full relative">
            <svg
              className="absolute right-0 top-0 h-full w-[2px] text-zinc-300 dark:text-zinc-700"
              preserveAspectRatio="none"
            >
              <rect width="100%" height="100%" fill="currentColor" />
            </svg>
            <div className="relative z-10 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">
                Sections
              </h2>
              {docsSections.map((sec) => (
                <div
                  key={sec.id}
                  className={clsx(
                    "text-sm cursor-pointer transition-colors",
                    activeId === sec.id
                      ? "text-indigo-500 font-medium"
                      : "opacity-70 hover:opacity-100"
                  )}
                  onClick={() => scrollToSection(sec.id)}
                >
                  <ChevronRight className="inline w-3 h-3 mr-1" />
                  {sec.title}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-4 w-72">
          <h2 className="font-semibold text-lg mb-4">Docs Navigation</h2>
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2">
              {docsSections.map((sec) => (
                <Button
                  key={sec.id}
                  variant={activeId === sec.id ? "secondary" : "ghost"}
                  onClick={() => {
                    scrollToSection(sec.id);
                    setMobileOpen(false);
                  }}
                >
                  {sec.title}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
