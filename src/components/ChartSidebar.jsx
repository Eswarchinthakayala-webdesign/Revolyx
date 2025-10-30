// src/components/ChartSidebar.jsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Search,
  SortAsc,
  SortDesc,
  BarChart2,
  ListFilter,
} from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { FuturisticMenuButton } from "./FuturisticMenuButton";

export default function ChartSidebar({
  ALL_CHARTS = [],
  filteredCharts = [],
  selectedChartKey,
  handleChartClick,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortMode, setSortMode] = useState("asc");
  const [open, setOpen] = useState(false);
  const inputRef = useRef();

  // Apply sorting mode
  const sortedCharts = [...filteredCharts].sort((a, b) =>
    sortMode === "asc"
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title)
  );

  const SidebarContent = (
    <Card className="h-full border border-zinc-300/70 dark:border-zinc-700/50 bg-white/80 dark:bg-black/70 shadow-2xl backdrop-blur-xl">
      <CardHeader className="sticky top-0 z-40 bg-white/80 dark:bg-black/70 border-b border-zinc-200/40 dark:border-zinc-700/40 backdrop-blur-xl">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Charts Catalog
          </span>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="dark:bg-zinc-800/70 dark:text-zinc-100 text-zinc-700 border border-zinc-400/30 dark:border-zinc-700/50"
            >
              {ALL_CHARTS.length}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-300/50  dark:border-zinc-700/50 cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40"
                >
                  {sortMode === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="backdrop-blur-lg bg-white/70 dark:bg-zinc-900/80 border border-zinc-300/40 dark:border-zinc-700/40"
              >
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortMode("asc")}>A → Z</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortMode("desc")}>Z → A</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="overflow-hidden pt-3">
        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 opacity-50" />
          <Input
            ref={inputRef}
            placeholder="Search charts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="pl-9 bg-white/60 dark:bg-zinc-900/60 border border-zinc-300/40 dark:border-zinc-700/40"
          />
        </div>

        {/* Suggestions (animated) */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <ScrollArea className="mb-3 border max-h-screen overflow-y-auto rounded-md p-2 backdrop-blur-md bg-white/60 dark:bg-zinc-900/40 border-zinc-300/40 dark:border-zinc-700/40 shadow-inner">
                <div className="grid gap-2">
                  {ALL_CHARTS.filter(
                    (c) =>
                      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      searchTerm === ""
                  ).map((chart) => (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      key={chart.key}
                      onClick={() => handleChartClick(chart.key)}
                      className={clsx(
                        "text-left p-2 rounded-md w-full cursor-pointer border transition-all duration-200 border-zinc-300/40 dark:border-zinc-700/40",
                        selectedChartKey === chart.key
                          ? "bg-zinc-800/60 dark:bg-zinc-700/60 text-white"
                          : "hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{chart.title}</div>
                          {chart.tags && chart.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-1">
                              {chart.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-[10px] px-2 py-0.5 rounded-full border bg-gray-100/50 border-gray-400/20 dark:bg-zinc-950/50 text-zinc-800 dark:text-zinc-100"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-xs opacity-60">{chart.key}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        <Separator className="my-3 border-zinc-300/50 dark:border-zinc-700/50" />

        {/* Chart List */}
        <ScrollArea className="h-[70vh] pr-1">
          <AnimatePresence>
            {sortedCharts.map((chart) => (
              <motion.button
                key={chart.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChartClick(chart.key)}
                className={clsx(
                  "w-full flex justify-between cursor-pointer items-center p-3 rounded-md transition-all border border-transparent",
                  selectedChartKey === chart.key
                    ? "dark:bg-zinc-700/60 bg-zinc-100 border-zinc-300/40 dark:border-zinc-700/40"
                    : "hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50"
                )}
              >
                <div className="text-sm font-medium truncate">{chart.title}</div>
              </motion.button>
            ))}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block  max-h-screen sticky top-0">
        {SidebarContent}
      </aside>

      {/* Mobile sheet */}
      <div className="lg:hidden fixed top-16 left-1 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <FuturisticMenuButton open={open} onClick={() => setOpen(!open)} />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-80 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-r border-zinc-300/40 dark:border-zinc-700/40"
          >
            {SidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
