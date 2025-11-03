// "use client";

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
import * as MuiIcons from "@mui/icons-material";
import primeIconsCSS from "primeicons/primeicons.css?inline";
import "primeicons/primeicons.css";
import * as AntdIcons from "@ant-design/icons";
import { Icon as BlueprintIcon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
// import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import * as CarbonIcons from "@carbon/icons-react";
import * as FluentIcons from "@fluentui/react-icons";
import * as Zondicons from "zondicons";
import * as Octicons from "@primer/octicons-react";
import * as CoreUIIcons from "@coreui/icons-react";
import * as CIcon from "@coreui/icons";
import "foundation-icons/foundation-icons.css";
import twemoji from "twemoji";
import emojiData from "emoji.json";
import data from "@emoji-mart/data";
// import { getEmojiDataFromNative } from "@emoji-mart/data";
// import Picker from "@emoji-mart/react";

console.log(data)
import allTeenyIcons from "../components/TeenyIconsGallery";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { foundationIconList } from "../data/FoundationList";

// ✅ limit Lucide to valid icons only
const allValidLucideIcons = Object.keys(LucideIcons)
  .filter((name) => !name.endsWith("Icon"))
  .slice(0, 3730);
const allAntdIcons = Object.keys(AntdIcons)
  .filter((name) => /^[A-Z]/.test(name))
  .reduce((acc, name) => {
    acc[name] = AntdIcons[name];
    return acc;
  }, {});
const blueprintIconNames = Object.values(IconNames);
const emojiList = emojiData.map((e) => ({
  name: e.name,
  char: e.char,
}));
const emojisss=Object.fromEntries(
     Object.values(data.emojis).map((e) => [e.skins[0].native,true]))

     console.log(emojisss)

// You can add more emoji ranges here (objects, animals, flags, etc.)

export default function AllIconsPage() {
  const [activeLib, setActiveLib] = useState("Lucide");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 100;
  
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


  // Define all PrimeIcons dynamically
 const primeIconList = [
  ...primeIconsCSS.matchAll(/\.pi-([a-z0-9-]+):before/g),
].map((m) => `pi pi-${m[1]}`);

const validFluentIcons = Object.keys(FluentIcons).filter((n) => /^[A-Z]/.test(n));
const FluentIconsFiltered = Object.fromEntries(validFluentIcons.map((n) => [n, FluentIcons[n]]));

// const blueprintIconNames = Object.keys(BlueprintIcons.IconNames).map(
//   (key) => BlueprintIcons.IconNames[key]
// );
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
    MaterialUI: MuiIcons, // ✅ NEW
    Iconify: { "mdi:home": true, "mdi:bell": true, "mdi:email": true, "mdi:heart": true },
    Simple: SimpleIcons,
    Eva: EvaIcons,
    PrimeIcons: Object.fromEntries(primeIconList.map((n) => [n, n])),
    AntDesign: allAntdIcons,
    Blueprint: Object.fromEntries(blueprintIconNames.map((n) => [n, n])),
    Carbon: CarbonIcons,
    Fluent: FluentIconsFiltered,
    Zondicons: Zondicons,
    TeenyIcons: Object.fromEntries(allTeenyIcons.map((i) => [i.name, i.src])),
    Octicons: Octicons,
    CoreUI: CIcon, 
    Foundation: Object.fromEntries(foundationIconList.map((n) => [n, true])),
    Twemoji: Object.fromEntries(emojiList.map((e) => [e.name, e.char])),
    NotoEmoji: Object.fromEntries(emojiList.map((e) => [e.name, e.char])),
    EmojiMart: emojisss



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
       case "Octicons":
        const Icon= Octicons[name]
        return Icon ? <Icon size={20}  /> : null;

        case "Blueprint": {
            return (
                <div className="flex items-center justify-center bg-white dark:bg-transparent p-1 rounded">
                <BlueprintIcon icon={name} iconSize={size} color={color} />
                </div>
            );
            }

        case "Phosphor": {
          const Icon = PhosphorIcons[name];
          return Icon ? <Icon size={size} /> : null;
        }
      case "EmojiMart": {
      return (
        <span style={{ fontSize: size + 6, lineHeight: 1 }}>
          {name}
        </span>
      );
    }



        case "Fluent": {
            const Icon = FluentIcons[name];
            return Icon ? <Icon className="w-6 h-6" /> : null;
            }

        case "Heroicons": {
          const Icon = HeroIcons[name];
          return Icon ? <Icon className="w-6 h-6" /> : null;
        }
        case "Feather": {
          const Icon = FeatherIcons[name];
          return Icon ? <Icon size={size} /> : null;
        }
        case "Carbon": {
            const Icon = CarbonIcons[name];
            return Icon ? <Icon size={size} color={color} /> : null;
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

        case "AntDesign":
        const AntdIcon = AntdIcons[name];
        return AntdIcon ? <AntdIcon style={{ fontSize: size, color }} /> : null;

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
        case "CoreUI":
        return CoreUIIcons.CIcon && CIcon[name]
            ? <CoreUIIcons.CIcon icon={CIcon[name]}  className="bg-white p-2 rounded h-10 w-10" />
            : null;

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




      case "PrimeIcons":
        return (
            <i
            className={name}
            style={{ fontSize: size, color }}
            />
        );


        case "Tabler": {
          const Icon = TablerIcons[name];
          return Icon ? <Icon size={size} /> : null;
        }
        case "ReactIcons": {
          const Icon = ReactIcons[name];
          return typeof Icon === "function" ? <Icon size={size} /> : null;
        }
        case "MaterialUI": {
          const Icon = MuiIcons[name];
          return Icon ? <Icon style={{ fontSize: size, color }} /> : null;
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


        case "Iconify":
          return <IconifyIcon icon={name} width={size} height={size} />;
        case "Simple":
          return SimpleIcons[name] ? (
            <div className="bg-white p-1 rounded">
              <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                fill={`#${SimpleIcons[name].hex}`}
              >
                <path d={SimpleIcons[name].path} />
              </svg>
            </div>
          ) : null;
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
