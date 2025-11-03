// src/pages/AllIconsPage.jsx
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import * as LucideIcons from "lucide-react";
import * as RadixIcons from "@radix-ui/react-icons";
import * as PhosphorIcons from "phosphor-react";
import * as HeroIcons from "@heroicons/react/24/outline";
import * as FeatherIcons from "react-feather";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as FaSolid from "@fortawesome/free-solid-svg-icons";
import * as FaRegular from "@fortawesome/free-regular-svg-icons";
import * as FaBrands from "@fortawesome/free-brands-svg-icons";
import * as RemixIcons from "@remixicon/react";
import * as TablerIcons from "tabler-icons-react";
import { Icon as IconifyIcon } from "@iconify/react";
import * as SimpleIcons from "simple-icons";
import * as EvaIcons from "eva-icons";
import * as ReactAi from "react-icons/ai";
import * as ReactFa from "react-icons/fa";
import * as ReactGi from "react-icons/gi";
import * as ReactMd from "react-icons/md";
import * as ReactTfi from "react-icons/tfi"
import * as MuiIcons from "@mui/icons-material";
import * as AntdIcons from "@ant-design/icons";
import * as CarbonIcons from "@carbon/icons-react";
import * as FluentIcons from "@fluentui/react-icons";
import * as Octicons from "@primer/octicons-react";
import * as CoreUIIcons from "@coreui/icons-react";
import * as CIcon from "@coreui/icons";
import * as Zondicons from "zondicons";
import allTeenyIcons from "../components/TeenyIconsGallery";
import "foundation-icons/foundation-icons.css";
import { foundationIconList } from "../data/FoundationList";
import twemoji from "twemoji";
import emojiData from "emoji.json";
import data from "@emoji-mart/data";
import primeIconsCSS from "primeicons/primeicons.css?inline";
import "primeicons/primeicons.css";
import { Icon as BlueprintIcon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import * as Evergreen from "evergreen-ui";
import * as GrommetIcons from "grommet-icons";
import * as Web3Icons from "@web3icons/react";
import * as PayIcons from "react-pay-icons";
import * as IconPark from "@icon-park/react";
import * as BoxIcons from "react-icons/bi";
import * as IconoirIcons from "iconoir-react";
import * as HugeIcons from "@hugeicons/react";
import * as ReactBs from "react-icons/bs"
import * as ReactCi from "react-icons/ci"
import * as ReactCg from "react-icons/cg"
import * as ReactDi from "react-icons/di"
import * as ReactFi from "react-icons/fi"
import * as ReactFc from "react-icons/fc"


console.log(HugeIcons)
import { motion } from "framer-motion";
import clsx from "clsx";

import { Toaster, toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import {
  Search as SearchIcon,
  List as ListIcon,
  Copy as CopyIcon,
  Filter as FilterIcon,
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  Palette as PaletteIcon,
  Menu as MenuIcon,
  X as XIcon
} from "lucide-react";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

/* ------------------------- COLOR THEMES ------------------------- */
const COLOR_THEMES = {
  zinc: ["#71717a", "#a1a1aa", "#27272a", "#52525b", "#3f3f46"],
  gray: ["#9ca3af", "#4b5563", "#6b7280", "#374151", "#1f2937"],
  slate: ["#64748b", "#94a3b8", "#334155", "#475569", "#1e293b"],
  stone: ["#78716c", "#a8a29e", "#57534e", "#44403c", "#292524"],
  orange: ["#f97316", "#fb923c", "#ea580c", "#fdba74", "#ffedd5"],
  green: ["#22c55e", "#4ade80", "#16a34a", "#86efac", "#dcfce7"],
  emerald: ["#10b981", "#34d399", "#059669", "#6ee7b7", "#a7f3d0"],
  teal: ["#14b8a6", "#2dd4bf", "#0d9488", "#5eead4", "#99f6e4"],
  cyan: ["#06b6d4", "#22d3ee", "#0891b2", "#67e8f9", "#a5f3fc"],
  sky: ["#0ea5e9", "#38bdf8", "#0284c7", "#7dd3fc", "#bae6fd"],
  blue: ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd", "#bfdbfe"],
  indigo: ["#6366f1", "#818cf8", "#4f46e5", "#a5b4fc", "#c7d2fe"],
  violet: ["#8b5cf6", "#a78bfa", "#7c3aed", "#c4b5fd", "#ddd6fe"],
  purple: ["#9333ea", "#a855f7", "#7e22ce", "#d8b4fe", "#f3e8ff"],
  pink: ["#ec4899", "#f472b6", "#db2777", "#f9a8d4", "#fce7f3"],
  rose: ["#f43f5e", "#fb7185", "#e11d48", "#fecdd3", "#ffe4e6"],
  red: ["#ef4444", "#f87171", "#dc2626", "#fca5a5", "#fee2e2"],
  yellow: ["#eab308", "#facc15", "#ca8a04", "#fde047", "#fef9c3"],
  amber: ["#f59e0b", "#fbbf24", "#d97706", "#fcd34d", "#fef3c7"],
};

const allValidLucideIcons = Object.keys(LucideIcons)
  .filter((name) => !name.endsWith("Icon"))
  .slice(0, 3730);
/* ------------------------- LIBRARIES (use earlier pattern) ------------------------- */
/* NOTE: you already imported many libs above; we create a libraries map for UI listing.
   Some libs expose objects of components; others are svg strings or font classes.
   This page will attempt to render safe previews for the major ones. */
  const ReactIcons = {
    ...ReactAi,
    ...ReactFa,
    ...ReactGi,
    ...ReactMd,
    ...ReactTfi,
  };
const validFluentIcons = Object.keys(FluentIcons).filter((n) => /^[A-Z]/.test(n));
const FluentIconsFiltered = Object.fromEntries(validFluentIcons.map((n) => [n, FluentIcons[n]]));
const emojiList = emojiData.map((e) => ({
  name: e.name,
  char: e.char,
})); 
const emojiMartData=Object.fromEntries(
     Object.values(data.emojis).map((e) => [e.skins[0].native,true]))
const primeIconList = [
  ...primeIconsCSS.matchAll(/\.pi-([a-z0-9-]+):before/g),
].map((m) => `pi pi-${m[1]}`);
const blueprintIconNames = Object.values(IconNames);

const EvergreenIcons = Object.fromEntries(
  Object.entries(Evergreen)
    .filter(([name]) => name.endsWith("Icon"))
    .map(([name, Comp]) => [name, Comp])
);


const GrommetIconsList = Object.fromEntries(
  Object.entries(GrommetIcons).filter(([name, Comp]) => {
    return (
      typeof Comp === "object" &&
      Comp.$$typeof && // only React components
      name !== "Blank" &&
      name !== "extendDefaultTheme"
    );
  })
);

const Web3IconsList = Object.fromEntries(
  Object.entries(Web3Icons).filter(([name, Comp]) => {
    return (
      typeof Comp === "function" ||
      (typeof Comp === "object" && Comp.$$typeof)
    );
  })
);


const PayIconsList = Object.fromEntries(
  Object.entries(PayIcons).filter(([name, Comp]) => {
    return (
      typeof Comp === "function" ||
      (typeof Comp === "object" && Comp.$$typeof)
    );
  })
);
const IconParkList = Object.fromEntries(
  Object.entries(IconPark).filter(([name, Comp]) =>
    typeof Comp === "function"
  )
);


const libraries = {
  Lucide: Object.fromEntries(allValidLucideIcons.map((n) => [n, LucideIcons[n]])),
  Radix: RadixIcons,
  Phosphor: PhosphorIcons,
  Heroicons: HeroIcons,
  Feather: FeatherIcons,
  FontAwesomeSolid: FaSolid,
  FontAwesomeRegular: FaRegular,
  FontAwesomeBrands: FaBrands,
  Remix: RemixIcons,
  Tabler: TablerIcons,
  ReactIcons: { ...ReactAi, ...ReactFa, ...ReactGi, ...ReactMd,...ReactTfi },
  MaterialUI: MuiIcons,
  AntDesign: AntdIcons,
  Fluent: FluentIconsFiltered,
  Octicons: Octicons,
  CoreUI: CIcon, 
  Simple: SimpleIcons,
  Eva: EvaIcons,
  Zondicons: Zondicons,
  Iconify: { "mdi:home": true, "mdi:bell": true, "mdi:email": true },
  Carbon: CarbonIcons,
  TeenyIcons: Object.fromEntries(allTeenyIcons.map((i) => [i.name, i.src])),
  Foundation: Object.fromEntries(foundationIconList.map((n) => [n, true])),
  Twemoji: Object.fromEntries(emojiList.map((e) => [e.name, e.char])),
  NotoEmoji: Object.fromEntries(emojiList.map((e) => [e.name, e.char])),
  EmojiMart: emojiMartData,
  PrimeIcons: Object.fromEntries(primeIconList.map((n) => [n, n])),
  Blueprint: Object.fromEntries(blueprintIconNames.map((n) => [n, n])),
  Evergreen: EvergreenIcons,
  Grommet: GrommetIconsList,
  Web3: Web3IconsList,
  PayIcons: PayIconsList,
  IconPark: IconParkList,
  Boxicons: BoxIcons,
  Iconoir: IconoirIcons,
  BootStrap:ReactBs,
  Circumicons:ReactCi,
  CSSgg:ReactCg,
  Devicons:ReactDi,




  // Add more mappings if necessary
};

/* helper to get icon names for each library */
function getIconListForLib(libKey) {
  const lib = libraries[libKey];
  if (!lib) return [];
  // For some libs the keys are complex; we filter to readable names
  return Object.keys(lib).filter((n) => /^[A-Za-z0-9_-]/.test(n));
}

/* ------------------------- UI Component ------------------------- */
export default function AllIconsPage() {
  const [activeLib, setActiveLib] = useState("Lucide");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [paletteKey, setPaletteKey] = useState("blue");
  const [subPaletteIndex, setSubPaletteIndex] = useState(0);
  const [sortAsc, setSortAsc] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [zondiconSvgs, setZondiconSvgs] = useState({});
  
  useEffect(() => {
    const loadZondicons = async () => {
      const entries = await Promise.all(
        Object.entries(Zondicons).map(async ([name, loader]) => {
          if (typeof loader === "function") {
            try {
              const mod = await loader();
              return [name, mod.default]; // SVG file URL
            } catch {
              return [name, null];
            }
          }
          return [name, null];
        })
      );
      setZondiconSvgs(Object.fromEntries(entries));
    };
    loadZondicons();
  }, []);
  const ITEMS_PER_PAGE = 120;
  const iconNames = useMemo(() => getIconListForLib(activeLib), [activeLib]);

  // build icon objects array: { lib, name }
   const icons = useMemo(() => {
     if (activeLib === "Lucide") {
       const allValidIcons = Object.keys(LucideIcons)
         .filter((name) => !name.endsWith("Icon"))
         .slice(0, 3730);
       return allValidIcons.map((name) => ({ lib: activeLib, name }));
     }
 
     const libIcons = libraries[activeLib];
     if (!libIcons) return [];
 
     // Eva uses icons object
     if (activeLib === "Eva") {
       return Object.keys(EvaIcons.icons || {}).map((name) => ({
         lib: activeLib,
         name,
       }));
     }
 
     if (activeLib === "EmojiMart") {
     return Object.values(data.emojis).map((e) => ({
       lib: activeLib,
       name: e.skins[0].native,
     }));
   }
 
 
     return Object.keys(libIcons)
       .filter((n) => /^[A-Za-z]/.test(n))
       .map((name) => ({ lib: activeLib, name }));
   }, [activeLib]);
  // filter / search / sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = icons.filter((i) => (q ? i.name.toLowerCase().includes(q) : true));
    arr.sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    return arr;
  }, [icons, search, sortAsc]);

  

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  // grouped alphabetically for quick categories
  const grouped = useMemo(() => {
    const m = {};
    filtered.forEach((it) => {
      const letter = it.name && it.name[0] ? it.name[0].toUpperCase() : "#";
      if (!m[letter]) m[letter] = [];
      m[letter].push(it);
    });
    return Object.fromEntries(Object.entries(m).sort(([a], [b]) => a.localeCompare(b)));
  }, [filtered]);

  /* palette helpers */
  const palette = COLOR_THEMES[paletteKey] || COLOR_THEMES.blue;
  const subColor = palette[subPaletteIndex % palette.length];

  /* render icon safely */
  function renderIconPreview({ lib, name }, size = 28, color = "currentColor") {
    try {
      switch (lib) {
        case "Lucide": {
          const Icon = LucideIcons[name];
          return Icon ? <Icon size={size} color={color} /> : null;
        }
        case "Radix": {
          const Icon = RadixIcons[name];
          return Icon ? <Icon width={size} height={size} /> : null;
        }
        case "Phosphor": {
          const Icon = PhosphorIcons[name];
          return Icon ? <Icon size={size} /> : null;
        }
        case "Heroicons": {
          const Icon = HeroIcons[name];
          return Icon ? <Icon className="w-6 h-6" /> : null;
        }
        case "Feather": {
          const Icon = FeatherIcons[name];
          return Icon ? <Icon size={size} /> : null;
        }

        case "Circumicons": {
        const Icon = ReactCi[name];
        return Icon ? <Icon size={size} color={color} /> : null;
      }
       case "CSSgg": {
        const Icon = ReactCi[name];
        return Icon ? <Icon size={size} color={color} /> : null;
      }
      case "Grommet": {
        const Icon = libraries[lib][name];
        if (!Icon) return null;
        // Grommet requires size as string (like "24px")
        return <Icon size={`${size}px`} color={color} />;
      }
      case "PayIcons": {
        const Icon = PayIconsList[name];
        return Icon ? <Icon className="bg-white rounded" style={{ width: 40, height: 40 }} /> : null;
      }
       case "Devicons": {
        const Icon = ReactCi[name];
        return Icon ? <Icon size={size} color={color} /> : null;
      }
      case "HugeIcons": {
        const Icon = HugeIcons[name];
        return Icon ? <Icon size={size} color={color} /> : null;
      }
     
      case "IconPark": {
        const Icon = IconPark[name];
        return Icon ? (
          <Icon theme="outline" size={size} fill={color} />
        ) : null;
      }
       case "BootStrap": {
        const Icon = ReactBs[name];
        return Icon ? <Icon size={size} color={color} /> : null;
      }
      case "Boxicons": {
        const Icon = BoxIcons[name];
        return Icon ? <Icon size={size} color={color} /> : null;
      }
     case "Iconoir": {
        const Icon = IconoirIcons[name];
        return Icon ? <Icon color={color} size={size} /> : null;
      }
      case "Web3": {
          const Icon = Web3IconsList[name];
          return Icon ? <Icon variant="background" size={64} color={color} /> : null;
        }
       case "Evergreen": {
          const Icon = libraries[lib][name];
          return Icon ? <Icon size={size} color={color} /> : null;
        }
        
        case "AntDesign": {
          const Icon = AntdIcons[name];
          return Icon ? <Icon style={{ fontSize: size, color }} /> : null;
        }
        case "Zondicons": {
          const svgUrl = zondiconSvgs[name];
          return svgUrl ? (
              <img
              src={svgUrl}
              alt={name}
              className="w-6 h-6 bg-white p-1 rounded object-contain"
              loading="lazy"
              />
          ) : (
              <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded" />
          );
          }
        case "Fluent": {
          const Icon = FluentIcons[name];
          return Icon ? <Icon className="w-6 h-6" /> : null;
          }
        case "FontAwesomeSolid":
          return FaSolid[name] ? <FontAwesomeIcon icon={FaSolid[name]} size="lg" /> : null;
        case "FontAwesomeRegular":
          return FaRegular[name] ? <FontAwesomeIcon icon={FaRegular[name]} size="lg" /> : null;
        case "FontAwesomeBrands":
          return FaBrands[name] ? <FontAwesomeIcon icon={FaBrands[name]} size="lg" /> : null;
        case "Remix": {
          const Icon = RemixIcons[name];
          return Icon ? <Icon size={size} /> : null;
        }
        case "Tabler": {
          const Icon = TablerIcons[name];
          return Icon ? <Icon size={size} /> : null;
        }
        case "ReactIcons": {
          const Icon = ReactIcons[name];
          return typeof Icon === "function" ? <Icon size={size} /> : null;
        }
       case "NotoEmoji": {
          const emojiChar = libraries.NotoEmoji[name];
          if (!emojiChar) return null;

          return (
            <span
              style={{
                fontFamily: '"Noto Color Emoji"',
                fontSize: size,
                lineHeight: 1,
              }}
            >
              {emojiChar}
            </span>
          );
        }
        case "Blueprint": {
          return (
                <div className="flex items-center justify-center bg-white dark:bg-transparent p-1 rounded">
                <BlueprintIcon icon={name} iconSize={size} color={color} />
                </div>
                  );
                }
        case "Twemoji": {
          const emojiChar = libraries.Twemoji[name];
          if (!emojiChar) return null;
        
          const parsedHTML = twemoji.parse(emojiChar, {
            folder: "svg",
            ext: ".svg",
            base: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/",
          });
        
          return (
            <div
              className="flex items-center justify-center"
              style={{ width: size, height: size }}
              dangerouslySetInnerHTML={{ __html: parsedHTML }}
            />
          );
        }
        case "TeenyIcons": {
          const src = libraries[lib][name];
          return src ? (
              <img
              src={src}
              alt={name}
              className="w-6 h-6 bg-white p-1 rounded object-contain"
              loading="lazy"
              />
          ) : (
              <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded" />
          );
          }
        case "Octicons": {
          const Icon = Octicons[name];
          return Icon ? <Icon /> : null;
        }
        case "PrimeIcons":
         return (
            <i
            className={name}
            style={{ fontSize: size, color }}
            />
        );
        case "Carbon": {
          const Icon = CarbonIcons[name];
          return Icon ? <Icon size={size} color={color} /> : null;
          }
        case "CoreUI":
          return CoreUIIcons.CIcon && CIcon[name]
              ? <CoreUIIcons.CIcon icon={CIcon[name]}  className="bg-white text-red-500 p-2 rounded h-10 w-10" />
              : null;
        case "Simple": {
          const s = SimpleIcons[name];
          if (!s) return null;
          return (
            <div className="w-full h-full flex bg-white rounded items-center justify-center">
              <svg viewBox="0 0 24 24" width={size} height={size} fill={`#${s.hex}`}>
                <path d={s.path} />
              </svg>
            </div>
          );
        }
        case "MaterialUI": {
          const Icon = MuiIcons[name];
          return Icon ? <Icon style={{ fontSize: size, color }} /> : null;
        }
        case "Foundation":
          return (
            <i
              className={`fi fi-${name}`}
              style={{
                fontSize: size,
                color,
                display: "inline-block",
                lineHeight: 1,
              }}
            />
          );
        case "EmojiMart": {
          return (
            <span style={{ fontSize: size + 6, lineHeight: 1 }}>
              {name}
            </span>
          );
        }  
        case "Iconify":
          return <IconifyIcon icon={name} width={size} height={size} />;
        case "Eva": {
          const evaIcon = EvaIcons.icons[name];
          return evaIcon ? (
            <div
              className="bg-white rounded"
              dangerouslySetInnerHTML={{
                __html: evaIcon.toSvg({ width: size, height: size, color: "#fff" }),
              }}
            />
          ) : null;
        }
        default:
          return null;
      }
    } catch (e) {
      return null;
    }
  }

  /* preview & code panel actions */
  function handleSelect(icon) {
    setSelectedIcon(icon);
    // show toast
    toast.success(`Selected ${icon.lib}: ${icon.name}`);
  }

  function copySource(icon) {
    if (!icon) return;
    // generate a small JSX snippet depending on lib
    const snippet = `<${icon.lib}Icon name="${icon.name}" size={24} color="${subColor}" />`;
    navigator.clipboard.writeText(snippet);
    toast.success("Icon JSX copied!");
  }

  // keyboard: quick open suggestions on slash or ctrl+k
  useEffect(() => {
    function onKey(e) {
      if ((e.key === "/" && !e.metaKey && !e.ctrlKey) || (e.key === "k" && (e.ctrlKey || e.metaKey))) {
        setShowSuggestions(true);
        const el = document.getElementById("icon-search-input");
        if (el) el.focus();
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* mobile sheet ref */
  const searchRef = useRef(null);

  /* small UI helpers */
  function renderPaletteSwatches() {
    return (
      <div className="flex gap-2 items-center flex-wrap">
        {palette.map((c, i) => (
          <button
            key={c + i}
            title={c}
            className={clsx(
              "w-8 h-8 rounded-md border cursor-pointer shadow-sm transition-transform",
              i === subPaletteIndex ? "ring-2 ring-offset-1 ring-zinc-400/30 scale-105" : "hover:scale-105"
            )}
            style={{ background: c }}
            onClick={() => {
              setSubPaletteIndex(i);
              toast(`Subcolor set to ${c}`, { icon: "🎨" });
            }}
          />
        ))}
      </div>
    );
  }

  /* responsive sheet for mobile */
  const SidebarSheet = (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="lg:hidden cursor-pointer">
          <MenuIcon className="w-5 h-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[300px] p-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListIcon className="w-4 h-4" />
              <div className="font-medium">Icons</div>
            </div>
            
          </div>

          

           <ScrollArea className="h-[68vh] pr-2">
            <div className="flex flex-col gap-2">
              {Object.keys(libraries).map((lib) => (
                  <button
                  key={lib}
                  onClick={() => { setActiveLib(lib); setPage(1); setSearch(""); }}
                  className={clsx(
                    "w-full text-left cursor-pointer px-3 py-2 rounded-md transition-colors flex items-center justify-between",
                    activeLib === lib ? "bg-zinc-200/80 dark:bg-zinc-500/30 border border-indigo-500/10" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                  )}
                >
                  <span>{lib}</span>
                  <span className="text-xs opacity-60">{getIconListForLib(lib).length}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="min-h-screen max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />

      {/* header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
            <PaletteIcon className="w-7 h-7 text-indigo-500" />
            Revolyx Icons
          </h1>
          <p className="text-sm opacity-70 mt-1">Browse, preview and copy icon JSX with palettes & code.</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* mobile sheet trigger */}
          {SidebarSheet}

          <div className="flex items-center gap-2 border rounded-md px-2 py-1 bg-white/60 dark:bg-zinc-900">
            <SearchIcon className="w-4 h-4 opacity-60" />
            <Input
              id="icon-search-input"
              ref={searchRef}
              placeholder="Search icons (click to show suggestions)"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              className="border-0 shadow-none"
            />
          </div>

          <Select value={paletteKey} onValueChange={(v) => { setPaletteKey(v); setSubPaletteIndex(0); }}>
            <SelectTrigger className="w-40 cursor-pointer">
              <SelectValue placeholder="Palette" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(COLOR_THEMES).map((k) => (
                <SelectItem className="cursor-pointer" key={k} value={k}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-sm" style={{ background: `linear-gradient(90deg, ${COLOR_THEMES[k].join(",")})` }} />
                    <div className="text-sm">{k}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden md:flex items-center gap-2 ml-2">
            <Button size="sm" className='cursor-pointer' variant="outline" onClick={() => setSortAsc((s) => !s)}>
              {sortAsc ? <><ArrowDownIcon className="w-4 h-4 mr-1" /> A→Z</> : <><ArrowUpIcon className="w-4 h-4 mr-1" /> Z→A</>}
            </Button>

            <Button size="sm" className="cursor-pointer" variant="ghost" onClick={() => { setPage(1); setSearch(""); toast("Filters reset"); }}>
              <FilterIcon className="w-4 h-4 mr-1" /> Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* left sidebar (desktop) */}
        <aside className="lg:col-span-1 hidden lg:block border rounded-xl p-4 bg-white/70 dark:bg-zinc-950/60">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Libraries</div>
            <Badge>{Object.keys(libraries).length}</Badge>
          </div>

          <ScrollArea className="h-[68vh] pr-2">
            <div className="flex flex-col gap-2">
              {Object.keys(libraries).map((lib) => (
                <button
                  key={lib}
                  onClick={() => { setActiveLib(lib); setPage(1); setSearch(""); }}
                  className={clsx(
                    "w-full text-left cursor-pointer px-3 py-2 rounded-md transition-colors flex items-center justify-between",
                    activeLib === lib ? "bg-zinc-200/80 dark:bg-zinc-500/30 border border-indigo-500/10" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                  )}
                >
                  <span>{lib}</span>
                  <span className="text-xs opacity-60">{getIconListForLib(lib).length}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* center + right */}
        <section className="lg:col-span-3 space-y-4">
          {/* top row: preview + actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* big preview */}
            <Card className="lg:col-span-2 overflow-hidden border bg-white/70 dark:bg-zinc-950/60">
              <CardHeader className="flex items-center justify-between p-4">
                <CardTitle className="flex items-center gap-2">
                  <ListIcon className="w-5 h-5" /> Preview
                </CardTitle>

                <div className="flex items-center gap-2">
                  {renderPaletteSwatches()}
                </div>
              </CardHeader>

              <CardContent className="p-4">
                {selectedIcon ? (
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-none w-full md:w-36 h-36 rounded-lg border flex items-center justify-center">
                      <div style={{ color: subColor }}>
                        {renderIconPreview(selectedIcon, 48, subColor) || <div className="text-xs opacity-60">Preview unavailable</div>}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold">{selectedIcon.name}</div>
                          <div className="text-sm opacity-60">{selectedIcon.lib}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => copySource(selectedIcon)}><CopyIcon className="w-4 h-4 mr-1" /> Copy JSX</Button>
                          <Button size="sm" variant="outline" onClick={() => { setDialogOpen(true); }}>
                            View Code
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 text-sm opacity-80">
                        {/* Example inline snippet */}
                        <pre className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded text-sm overflow-x-auto">
{`<${selectedIcon.lib} icon="${selectedIcon.name}" size={24} color="${subColor}" />`}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-sm opacity-60">Select an icon from the list to preview</div>
                )}
              </CardContent>
            </Card>

            {/* quick stats / filters */}
            <Card className="overflow-hidden border bg-white/70 dark:bg-zinc-950/60">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Selected palette</Label>
                    <div className="text-sm font-medium">{paletteKey}</div>
                  </div>

                  <div>
                    <Label className="text-xs">Subcolor</Label>
                    <div className="mt-2">{renderPaletteSwatches()}</div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button onClick={() => { setSearch(""); setPage(1); toast("Search cleared"); }} size="sm">Clear Search</Button>
                    <Button onClick={() => { setSelectedIcon(null); toast("Selection cleared"); }} size="sm" variant="outline">Clear Selection</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* gallery grid */}
          <Card className="overflow-hidden border bg-white/70 dark:bg-zinc-950/60">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListIcon className="w-4 h-4" /> Gallery
                </div>

                <div className="flex items-center gap-2">
                  <Badge>{filtered.length}</Badge>
                  <div className="text-xs opacity-60">Page {page} / {totalPages}</div>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* grid of icons */}
              <ScrollArea className="h-[60vh]">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 p-2 gap-3">
                  {paginated.map((ic) => (
                    <motion.button
                      key={ic.lib + ic.name}
                      onClick={() => handleSelect(ic)}
                      whileHover={{ scale: 1.02 }}
                      className={clsx(
                        "flex flex-col items-center justify-center cursor-pointer p-3 border rounded-lg transition-colors",
                        selectedIcon && selectedIcon.lib === ic.lib && selectedIcon.name === ic.name ? "ring-2 ring-zinc-400/20" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
                      )}
                      title={`${ic.lib}: ${ic.name}`}
                    >
                      <div className="w-10 h-10 flex items-center justify-center mb-2" style={{ color: subColor }}>
                        {renderIconPreview(ic, 20, subColor) || <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-center opacity-80 truncate w-full">{ic.name}</div>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>

              {/* pagination */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <Button size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>

                <div className="text-xs opacity-70">Showing {paginated.length} icons</div>
              </div>
            </CardContent>
          </Card>

          {/* alphabetized quick jump */}
          <div className="flex flex-wrap gap-2 items-center">
            {Object.keys(grouped).map((letter) => (
              <button key={letter} className="px-2 py-1 rounded cursor-pointer bg-zinc-100 dark:bg-zinc-800 text-sm" onClick={() => {
                // jump to first icon starting with letter (find page)
                const idx = filtered.findIndex((f) => f.name[0].toUpperCase() === letter);
                if (idx >= 0) {
                  setPage(Math.floor(idx / ITEMS_PER_PAGE) + 1);
                }
              }}>{letter}</button>
            ))}
          </div>
        </section>
      </main>

      {/* code dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Icon JSX Source</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            {selectedIcon ? (
              <SyntaxHighlighter language="jsx" style={oneDark} customStyle={{ borderRadius: 8 }}>
{`// Example JSX for ${selectedIcon.lib} ${selectedIcon.name}
<${selectedIcon.lib} icon="${selectedIcon.name}" size={24} color="${subColor}" />`}
              </SyntaxHighlighter>
            ) : (
              <div className="text-sm opacity-60">No icon selected</div>
            )}
          </div>

          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
            <Button onClick={() => { copySource(selectedIcon); setDialogOpen(false); }}>Copy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

