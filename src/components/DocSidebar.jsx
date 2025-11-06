"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ResponsiveSidebar({
  menuSections,
  activeLeft,
  setActiveLeft,
  hoverLeft,
  setHoverLeft,
  leftPositions,
  leftHeights,
  leftListRef,
  leftButtonRefs,
  isDark,
  INDICATOR_LEFT_PX = 12,
}) {
  const [open, setOpen] = useState(false);

  const SidebarContent = (
        <>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-xs font-semibold text-neutral-400 uppercase">Revolyx</CardTitle>
            <div>
             
            </div>
          </div>

          <CardContent
            id="left-list"
            ref={leftListRef}
            className="relative h-[500px]  overflow-auto"
            style={{ paddingLeft: INDICATOR_LEFT_PX + 8 }}
          >
            {/* baseline vertical line - same left offset as thin bars */}
            <div
              className="absolute hidden sm:flex" 
              style={{
               
                top: 8,
                bottom: 8,
                width: 1,
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                pointerEvents: "none",
                borderRadius: 2,
              }}


            />

            {/* Hover indicator */}
            <AnimatePresence>
              {hoverLeft && leftPositions[hoverLeft] != null && (
                <motion.div
                  key="lh"
                  initial={false}
                  animate={{
                    top: leftPositions[hoverLeft],
                    height: leftHeights[hoverLeft] || 36,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 45 }}
                  style={{
                    position: "absolute",
                    left: INDICATOR_LEFT_PX +7,
                    width: 3,
                    background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
                    borderRadius: 4,
                    zIndex: 10,
                  }}
                  className="hidden sm:flex"
                />
              )}
            </AnimatePresence>

            {/* Active indicator */}
            {leftPositions[activeLeft] != null && (
              <motion.div
                layoutId="left-active"
                animate={{
                  top: leftPositions[activeLeft],
                  height: leftHeights[activeLeft] || 36,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                style={{
                  position: "absolute",
                  left: INDICATOR_LEFT_PX +7,
                  width: 4,
                  background: isDark ? "#fff" : "#111827",
                  borderRadius: 4,
                  zIndex: 20,
                  boxShadow: isDark
                    ? "0 4px 16px rgba(255,255,255,0.03)"
                    : "0 6px 20px rgba(2,6,23,0.08)",
                }}
                className="hidden sm:flex"
              />
            )}

            <div className="space-y-4">
              {menuSections.map((section) => (
                <div key={section.title}>
                  <div className="text-xs text-neutral-500  font-medium mb-2">{section.title}</div>
                  <div className="space-y-1 border-l-2">
                    {section.items.map((it) => {
                      return (
                        <button
                          key={it}
                          ref={(r) => (leftButtonRefs.current[it] = r)}
                          onClick={() => {
                            setActiveLeft(it);
                            // scroll into view inside left list
                            const btn = leftButtonRefs.current[it];
                            if (btn && leftListRef.current) {
                              leftListRef.current.scrollTo({
                                top: Math.max(0, btn.offsetTop - 40),
                                behavior: "smooth",
                              });
                            }
                          }}
                          onMouseEnter={() => setHoverLeft(it)}
                          onMouseLeave={() => setHoverLeft(null)}
                          className={`w-full text-left px-2 py-2 cursor-pointer rounded-md transition-colors ${
                            activeLeft === it
                              ? "dark:text-white text-black  font-semibold"
                              : "dark:text-neutral-300 text-neutral-900 hover:text-black hover:dark:text-white"
                          }`}
                        >
                          {it}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
      
   </>
  );

  return (
    <>
      {/* ---------- Desktop Sidebar ---------- */}
      <aside className="hidden sm:flex flex-col w-72 bg-white/30 dark:bg-[#070707] rounded-xl p-4">
      
        <CardContent>{SidebarContent}</CardContent>
      </aside>

      {/* ---------- Mobile Sheet (Drawer) ---------- */}
      <div className="sm:hidden flex items-center mb-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-md bg-white/50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="p-0 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 w-[80vw] sm:w-72"
          >
         

            <ScrollArea className="h-[calc(100vh-4rem)] px-4 py-4">
              {SidebarContent}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
