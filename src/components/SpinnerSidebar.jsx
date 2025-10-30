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
  ListFilter,
  X,
} from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { FuturisticMenuButton } from "./FuturisticMenuButton";

export default function SpinnerSidebar({
  ALL_SPINNERS = [],
  categories = {},
  selectedSpinnerKey,
  handleSelectSpinner,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortMode, setSortMode] = useState("asc");
  const inputRef = useRef();

  // Mobile sheet open state
  const [open, setOpen] = useState(false);

  const sortedCategories = Object.entries(categories).sort(([a], [b]) =>
    sortMode === "asc" ? a.localeCompare(b) : b.localeCompare(a)
  );

  const SidebarContent = (
    <Card className="h-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#0a0a0a] shadow-xl">
      <CardHeader className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-30 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-700/50">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ListFilter className="w-4 h-4" />
            All Spinners
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="dark:bg-zinc-800 dark:text-zinc-100">
              {ALL_SPINNERS.length}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="dark:border-zinc-700 cursor-pointer dark:bg-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {sortMode === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortMode("asc")}>
                  A → Z
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortMode("desc")}>
                  Z → A
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="overflow-hidden">
        {/* Search Bar */}
        <div className="sticky top-0 z-20 py-2 bg-white dark:bg-[#0a0a0a]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
            <Input
              ref={inputRef}
              placeholder="Search spinners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="pl-8 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            />
          </div>

          {showSuggestions && (
            <ScrollArea className="mt-2 border border-zinc-200 dark:border-zinc-700 max-h-screen overflow-y-auto rounded-md ">
              <motion.div
                className="p-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {ALL_SPINNERS.filter(
                  (s) =>
                    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    searchTerm === ""
                )
                  
                  .map((s) => (
                    <button
                      key={s.key}
                      className={clsx(
                        "w-full text-left  cursor-pointer px-3 py-2 rounded-md transition-colors",
                        "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        selectedSpinnerKey === s.key
                          ? "bg-zinc-200 dark:bg-zinc-700"
                          : ""
                      )}
                      onClick={() => handleSelectSpinner(s.key)}
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {s.title}
                      </div>
                    </button>
                  ))}
              </motion.div>
            </ScrollArea>
          )}
        </div>

        <Separator className="my-3 dark:bg-zinc-700" />

        {/* List by Category */}
        <ScrollArea className="h-[75vh] pr-1">
          <div className="space-y-3">
            {sortedCategories.map(([letter, group]) => (
              <div key={letter}>
                <div className="text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">
                  {letter}
                </div>
                <div className="space-y-1">
                  {group.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleSelectSpinner(item.key)}
                      className={clsx(
                        "flex items-center cursor-pointer w-full px-3 py-2 rounded-md transition-all",
                        "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        selectedSpinnerKey === item.key
                          ? "bg-zinc-200 dark:bg-zinc-700"
                          : ""
                      )}
                    >
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block  max-h-screen sticky top-0">
        {SidebarContent}
      </aside>

      {/* Mobile Sheet */}
      <div className="lg:hidden fixed top-16 left-1 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <FuturisticMenuButton open={open} onClick={() => setOpen(!open)} />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-80 bg-white dark:bg-[#0a0a0a] border-r border-zinc-300 dark:border-zinc-700 overflow-y-auto"
          >
            {SidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
