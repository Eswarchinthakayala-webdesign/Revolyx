"use client";

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

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

// ✅ limit Lucide to valid icons only
const allValidLucideIcons = Object.keys(LucideIcons)
  .filter((name) => !name.endsWith("Icon"))
  .slice(0, 3730);

export default function AllIconsPage() {
  const [activeLib, setActiveLib] = useState("Lucide");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 100;

  // ✅ combine React-icons into one flat object (avoid symbol errors)
  const ReactIcons = {
    ...ReactAi,
    ...ReactFa,
    ...ReactGi,
    ...ReactMd,
  };

  // ✅ define libraries
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
    ReactIcons,
    Iconify: { "mdi:home": true, "mdi:bell": true, "mdi:email": true, "mdi:heart": true },
    Simple: SimpleIcons,
    Eva: EvaIcons,
  };

  // 📦 Icons for current library
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

  



    return Object.keys(libIcons)
      .filter((n) => /^[A-Za-z]/.test(n))
      .map((name) => ({ lib: activeLib, name }));
  }, [activeLib]);

  // 🔍 Search filter
  const filtered = useMemo(
    () => icons.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())),
    [icons, search]
  );

  // 📄 Pagination
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;

  // 🎨 Render icon safely
  const renderIcon = (icon) => {
    const { lib, name } = icon;
    const size = 24;
    const color = "currentColor";

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
          return typeof Icon === "function" ? <Icon size={size}  /> : null;
        }
        case "Iconify":
          return <IconifyIcon  icon={name} width={size} height={size} />;
        case "Simple":
        return SimpleIcons[name]
          ? <div className="bg-white p-1 rounded"> <svg viewBox="0 0 24 24" width={size} height={size} fill={`#${SimpleIcons[name].hex}`}>
              <path d={SimpleIcons[name].path} />
            </svg>
            </div>
          : null;
        case "Eva": {
          const evaIcon = EvaIcons.icons[name];
          return evaIcon
            ? (
              <div className="bg-white rounded"
                dangerouslySetInnerHTML={{
                  __html: evaIcon.toSvg({ width: size, height: size,color:"#fff" }),
                }}
              />
            )
            : null;
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-60 border-r border-zinc-300 dark:border-zinc-800 p-4 overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold mb-4">🧱 Libraries</h2>
        <div className="space-y-2">
          {Object.keys(libraries).map((lib) => (
            <button
              key={lib}
              onClick={() => {
                setActiveLib(lib);
                setPage(1);
                setSearch("");
              }}
              className={clsx(
                "block w-full text-left px-3 py-1 rounded-md transition-colors",
                activeLib === lib
                  ? "bg-blue-500 text-white"
                  : "hover:bg-zinc-200 dark:hover:bg-zinc-800"
              )}
            >
              {lib}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-3">
          <h1 className="text-2xl font-bold">
            {activeLib} Icons ({filtered.length})
          </h1>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search icons..."
            className="border rounded-md p-2 w-full sm:w-64 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <motion.div
          layout
          className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-12 gap-4"
        >
          {paginated.map((icon, idx) => (
            <div
              key={icon.lib + icon.name + idx}
              className="flex flex-col items-center justify-center p-2 border rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              title={`${icon.lib}: ${icon.name}`}
            >
              {renderIcon(icon)}
              <span className="text-[10px] text-center mt-1 opacity-70 truncate w-full">
                {icon.name}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            className={clsx(
              "px-3 py-1 rounded-md border dark:border-zinc-700",
              page === 1 && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="text-sm">
            Page {page} / {totalPages}
          </span>
          <button
            className={clsx(
              "px-3 py-1 rounded-md border dark:border-zinc-700",
              page >= totalPages && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
