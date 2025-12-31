import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Check, Shuffle, SortAsc, LayoutGrid, Layers, 
  Palette, Search, Copy, Hash, Pipette, Zap, 
  ChevronRight, Filter, Maximize2
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utility ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Curated Data ---
const PALETTES_DATA = [
  { id: "1", name: "Crimson", colors: ["#4B0000", "#800000", "#B11226", "#DC143C", "#F08080"], tags: ["Red"] },
  { id: "2", name: "Ruby", colors: ["#5A000F", "#8B0000", "#C9184A", "#E63946", "#F2A1B3"], tags: ["Red", "Jewel"] },
  { id: "3", name: "Twilight", colors: ["#0B132B", "#1C2541", "#3A506B", "#5BC0BE", "#CAE9FF"], tags: ["Blue", "Night"] },
  { id: "4", name: "Scarlet", colors: ["#7F1D1D", "#991B1B", "#DC2626", "#F87171", "#FECACA"], tags: ["Red"] },
  { id: "5", name: "Burgundy", colors: ["#2A0008", "#4A0404", "#6A040F", "#9D0208", "#E85D75"], tags: ["Red", "Dark"] },
  { id: "6", name: "Maroon", colors: ["#3C0008", "#5A000F", "#800020", "#A4161A", "#E8B4BC"], tags: ["Red", "Deep"] },
  { id: "7", name: "Olive", colors: ["#3A5A40", "#588157", "#6B8E23", "#A3B18A", "#DAD7CD"], tags: ["Green", "Earth"] },
  { id: "8", name: "Cherry", colors: ["#5D001E", "#8E0038", "#C9184A", "#FF4D6D", "#FFD6E0"], tags: ["Red", "Pink"] },
  { id: "9", name: "Cardinal", colors: ["#6E0000", "#9B111E", "#C1121F", "#E5383B", "#F5B7B1"], tags: ["Red"] },
  { id: "10", name: "Olive Lime", colors: ["#4F772D", "#6A994E", "#A7C957", "#CFE1B9", "#F2F8E5"], tags: ["Green", "Lime"] },
  { id: "11", name: "Garnet", colors: ["#5A0F16", "#800020", "#A4161A", "#C9184A", "#F2A1B3"], tags: ["Red", "Jewel"] },
  { id: "12", name: "Merlot", colors: ["#2A0A12", "#4A0E2E", "#6A1B4D", "#8E245C", "#C77D8F"], tags: ["Wine", "Dark"] },
  { id: "13", name: "Rust", colors: ["#7C2D12", "#9A3412", "#C2410C", "#EA580C", "#FED7AA"], tags: ["Orange", "Earth"] },
  { id: "14", name: "Orange", colors: ["#7C2D12", "#EA580C", "#FB923C", "#FDBA74", "#FFEDD5"], tags: ["Orange"] },
  { id: "15", name: "Wine", colors: ["#2B0A1F", "#4A0F2E", "#6D1B4E", "#8E245C", "#D8A1B3"], tags: ["Wine"] },
  { id: "16", name: "Blood", colors: ["#2B0000", "#5A0000", "#8B0000", "#B11226", "#DC143C"], tags: ["Red", "Dark"] },
  { id: "17", name: "Carmine", colors: ["#960018", "#B11226", "#C9184A", "#E5383B", "#FADADD"], tags: ["Red"] },
  { id: "18", name: "Rose", colors: ["#FFF1F2", "#FFE4E6", "#FECDD3", "#FDA4AF", "#FB7185"], tags: ["Pink", "Soft"] },
  { id: "19", name: "Coral", colors: ["#7F1D1D", "#FB6F92", "#FF8FAB", "#FFC2D1", "#FFE5EC"], tags: ["Pink", "Orange"] },
  { id: "20", name: "Ocean", colors: ["#001F3F", "#003566", "#0077B6", "#00B4D8", "#CAF0F8"], tags: ["Blue", "Water"] },
  { id: "21", name: "Brick", colors: ["#5A1F1B", "#7B2D26", "#A63C2D", "#C95A49", "#E8A598"], tags: ["Red", "Earth"] },
  { id: "22", name: "Olive Green", colors: ["#1B4332", "#2D6A4F", "#40916C", "#74C69D", "#D8F3DC"], tags: ["Green"] },
  { id: "23", name: "Cherry", colors: ["#5B0F14", "#7A1C20", "#9B2226", "#C9184A", "#FF758F"], tags: ["Red"] },
  { id: "24", name: "Cardinal", colors: ["#6A040F", "#9D0208", "#C1121F", "#E5383B", "#FFB3C1"], tags: ["Red"] },
  { id: "25", name: "Olive", colors: ["#3A5A40", "#588157", "#6B8E23", "#A3B18A", "#DAD7CD"], tags: ["Green"] },
  { id: "26", name: "Garnet", colors: ["#4B000F", "#800020", "#A4161A", "#C9184A", "#F2A1B3"], tags: ["Red", "Jewel"] },
  { id: "27", name: "Merlot", colors: ["#2A0A12", "#4A0E2E", "#6A1B4D", "#8E245C", "#C77D8F"], tags: ["Wine"] },
  { id: "28", name: "Rust", colors: ["#7C2D12", "#9A3412", "#C2410C", "#EA580C", "#FED7AA"], tags: ["Orange"] },
  { id: "29", name: "Pale Yellow", colors: ["#FFFDE7", "#FFF9C4", "#FFF59D", "#FFF176", "#FFEE58"], tags: ["Yellow"] },
  { id: "30", name: "Wine", colors: ["#2B0A1E", "#4A0E2E", "#6D1B3D", "#8E245C", "#C77D8F"], tags: ["Wine"] },
  { id: "31", name: "Blood", colors: ["#2B0000", "#5A0000", "#8B0000", "#B11226", "#DC143C"], tags: ["Red", "Dark"] },
  { id: "32", name: "Sunrise", colors: ["#FFB703", "#FF9F1C", "#FFD166", "#FFE29A", "#FFF3C4"], tags: ["Warm"] },
  { id: "33", name: "Carmine", colors: ["#7A001E", "#A0002C", "#C9184A", "#E5383B", "#FF9EB5"], tags: ["Red"] },
  { id: "34", name: "Rose", colors: ["#FFF0F3", "#FFD6E0", "#FFADC9", "#FF8FAB", "#FB6F92"], tags: ["Pink"] },
  { id: "35", name: "Coral", colors: ["#FF6F61", "#FF8C69", "#FFA07A", "#FFC1A1", "#FFE5D9"], tags: ["Orange", "Pink"] },
  { id: "36", name: "Muted Yellow", colors: ["#EDE6C8", "#E6D690", "#D9C46A", "#CBBF45", "#BFAF2F"], tags: ["Yellow"] },
  { id: "37", name: "Brick", colors: ["#5A1F1B", "#7B2D26", "#A63C2D", "#C95A49", "#E8A598"], tags: ["Red"] },
  { id: "38", name: "Crimson", colors: ["#67000D", "#9A031E", "#C1121F", "#E5383B", "#FFCCD5"], tags: ["Red"] },
  { id: "39", name: "Ruby", colors: ["#5B0F14", "#9D0208", "#C9184A", "#E5383B", "#FF8FAB"], tags: ["Jewel"] },
  { id: "40", name: "Scarlet", colors: ["#7A040F", "#B11226", "#D62828", "#EF233C", "#FFCCD5"], tags: ["Red"] },
  { id: "41", name: "Sunset", colors: ["#F72585", "#FF4D6D", "#FF9F1C", "#FFD166", "#FFE29A"], tags: ["Warm"] },
  { id: "42", name: "Blush", colors: ["#FFF1F2", "#FFE4E6", "#FECDD3", "#FDA4AF", "#FB7185"], tags: ["Pink"] },
  { id: "43", name: "Fuchsia", colors: ["#4A044E", "#86198F", "#C026D3", "#E879F9", "#F5D0FE"], tags: ["Pink", "Purple"] },
  { id: "44", name: "Magenta", colors: ["#6A0572", "#9D4EDD", "#C77DFF", "#E0AAFF", "#F3D9FF"], tags: ["Purple"] },
  { id: "45", name: "Autumn", colors: ["#7C2D12", "#C2410C", "#EA580C", "#F59E0B", "#FDE68A"], tags: ["Seasonal"] },
  { id: "46", name: "Raspberry", colors: ["#590D22", "#800F2F", "#A4133C", "#C9184A", "#FF758F"], tags: ["Red"] },
  { id: "47", name: "Salmon", colors: ["#FFA69E", "#FF8FAB", "#FFB3C1", "#FFD6E0", "#FFF0F3"], tags: ["Pink"] },
  { id: "48", name: "Peach", colors: ["#FFE5B4", "#FFDAB9", "#FFCBA4", "#FFB07C", "#FF8C42"], tags: ["Orange"] },
  { id: "49", name: "Forest Lime", colors: ["#365314", "#4D7C0F", "#65A30D", "#A3E635", "#ECFCCB"], tags: ["Green"] },
  { id: "50", name: "Bubblegum", colors: ["#FFD6FF", "#FFB3E6", "#FF8DC7", "#FF5DA2", "#FF2E93"], tags: ["Pink"] },
  { id: "51", name: "Bright Yellow", colors: ["#FFD700", "#FFEB3B", "#FFF176", "#FFF9C4", "#FFFDE7"], tags: ["Yellow"] },
  { id: "52", name: "Cotton Candy", colors: ["#FFE4F3", "#FFD1EB", "#FFB6E1", "#FF9AD5", "#FF80CC"], tags: ["Pink"] },
  { id: "53", name: "Hot Pink", colors: ["#7A003C", "#AD1457", "#E91E63", "#F06292", "#F8BBD0"], tags: ["Pink"] },
  { id: "54", name: "Neon Pink", colors: ["#FF007F", "#FF1493", "#FF5DA2", "#FF85C1", "#FFB6D9"], tags: ["Neon"] },
  { id: "55", name: "Light Yellow", colors: ["#FFFDE7", "#FFF9C4", "#FFF59D", "#FFF176", "#FFEE58"], tags: ["Yellow"] },
  { id: "56", name: "Pastel Pink", colors: ["#FFF0F5", "#FFE4EC", "#FFC1D9", "#FF9EB5", "#FF6F91"], tags: ["Pink"] },
  { id: "57", name: "Dusty Rose", colors: ["#7F4F5B", "#9E5A63", "#BC6C7C", "#D8A7B1", "#F2D7DD"], tags: ["Muted"] },
  { id: "58", name: "Mauve", colors: ["#4A2C3D", "#6D3B53", "#9A5E7A", "#C48CB3", "#EBDCF0"], tags: ["Purple"] },
  { id: "59", name: "Rose Gold", colors: ["#7A4A4A", "#B76E79", "#D4A5A5", "#EAC4C4", "#F7E7E7"], tags: ["Metallic"] },
  { id: "60", name: "Pink Pearl", colors: ["#FFF0F5", "#FFE4EC", "#FFC1D9", "#FF9EB5", "#FF6F91"], tags: ["Pink"] },
  { id: "61", name: "Twilight", colors: ["#0B132B", "#1C2541", "#3A506B", "#5BC0BE", "#CAE9FF"], tags: ["Blue"] },
  { id: "62", name: "Pink Diamond", colors: ["#FFE6F0", "#FFC2D9", "#FF9EC2", "#FF6FAE", "#FF3D9A"], tags: ["Pink"] },
  { id: "63", name: "Pink Quartz", colors: ["#F7CAD0", "#F4ACB7", "#FF8FAB", "#FF6F91", "#E05678"], tags: ["Pink"] },
  { id: "64", name: "Pink Sapphire", colors: ["#9D0208", "#E5383B", "#FF4D6D", "#FF758F", "#FFD6E0"], tags: ["Jewel"] },
  { id: "65", name: "Mist", colors: ["#F8FAFC", "#E2E8F0", "#CBD5E1", "#94A3B8", "#64748B"], tags: ["Neutral"] },
  { id: "66", name: "Pink Ruby", colors: ["#9B2226", "#C9184A", "#FF4D6D", "#FF8FAB", "#FFD6E0"], tags: ["Pink"] },
  { id: "67", name: "Pink Garnet", colors: ["#800020", "#A4161A", "#C9184A", "#E5383B", "#FF9EB5"], tags: ["Pink"] },
  { id: "68", name: "Pink Amethyst", colors: ["#4A044E", "#86198F", "#C026D3", "#E879F9", "#F5D0FE"], tags: ["Purple"] },
  { id: "69", name: "Pink Topaz", colors: ["#7A003C", "#AD1457", "#E91E63", "#F06292", "#F8BBD0"], tags: ["Pink"] },
  { id: "70", name: "Pink Emerald", colors: ["#065F46", "#10B981", "#6EE7B7", "#A7F3D0", "#ECFDF5"], tags: ["Green"] },
  { id: "71", name: "Pink Aquamarine", colors: ["#0F766E", "#2DD4BF", "#5EEAD4", "#99F6E4", "#E6FFFA"], tags: ["Teal"] },
  { id: "72", name: "Pink Opal", colors: ["#FEE2E2", "#FECACA", "#FCA5A5", "#F87171", "#EF4444"], tags: ["Pink"] },
  { id: "73", name: "Pink Jade", colors: ["#064E3B", "#10B981", "#6EE7B7", "#A7F3D0", "#ECFDF5"], tags: ["Green"] },
  { id: "74", name: "Gold", colors: ["#FFD700", "#FFC300", "#FFB703", "#FFD166", "#FFF1C1"], tags: ["Gold"] },
  { id: "75", name: "Pink Onyx", colors: ["#2A0A12", "#4A0E2E", "#6A1B4D", "#8E245C", "#C77D8F"], tags: ["Dark"] },
  { id: "76", name: "Pink Agate", colors: ["#F72585", "#FF5DA2", "#FF87B7", "#FFADC9", "#FFE5EE"], tags: ["Pink"] },
  { id: "77", name: "Orange", colors: ["#7C2D12", "#EA580C", "#FB923C", "#FED7AA", "#FFF7ED"], tags: ["Orange"] },
  { id: "78", name: "Pink Jasper", colors: ["#7A040F", "#B11226", "#D62828", "#EF233C", "#FFCCD5"], tags: ["Pink"] },
  { id: "79", name: "Pink Moonstone", colors: ["#FDF2F8", "#FCE7F3", "#FBCFE8", "#F9A8D4", "#EC4899"], tags: ["Pink"] },
  { id: "80", name: "Forest", colors: ["#052E16", "#14532D", "#166534", "#4ADE80", "#BBF7D0"], tags: ["Green"] },
  { id: "81", name: "Royal Purple", colors: ["#2E1065", "#4C1D95", "#6D28D9", "#A78BFA", "#EDE9FE"], tags: ["Purple"] },
  { id: "82", name: "Lavender", colors: ["#F5F3FF", "#EDE9FE", "#DDD6FE", "#C4B5FD", "#A78BFA"], tags: ["Purple"] },
  { id: "83", name: "Amethyst", colors: ["#4A044E", "#6D28D9", "#8B5CF6", "#C4B5FD", "#EDE9FE"], tags: ["Purple"] },
  { id: "84", name: "Violet", colors: ["#2E1065", "#5B21B6", "#7C3AED", "#A78BFA", "#DDD6FE"], tags: ["Purple"] },
  { id: "85", name: "Plum", colors: ["#2A0A3D", "#4B296B", "#6A4C93", "#9D7BB0", "#E6DAF2"], tags: ["Purple"] },
  { id: "86", name: "Grape", colors: ["#240046", "#3C096C", "#5A189A", "#7B2CBF", "#C77DFF"], tags: ["Purple"] },
  { id: "87", name: "Orchid", colors: ["#4A044E", "#86198F", "#C026D3", "#E879F9", "#F5D0FE"], tags: ["Purple"] },
  { id: "88", name: "Lilac", colors: ["#F5F3FF", "#EDE9FE", "#DDD6FE", "#C4B5FD", "#A78BFA"], tags: ["Purple"] },
  { id: "89", name: "Periwinkle", colors: ["#EEF2FF", "#E0E7FF", "#C7D2FE", "#A5B4FC", "#818CF8"], tags: ["Blue"] },
  { id: "90", name: "Iris", colors: ["#312E81", "#4338CA", "#6366F1", "#A5B4FC", "#E0E7FF"], tags: ["Purple"] },
  { id: "91", name: "Wisteria", colors: ["#2A0A3D", "#6A4C93", "#9D7BB0", "#CDB4DB", "#EDE9FE"], tags: ["Purple"] },
  { id: "92", name: "Eggplant", colors: ["#1B0F2F", "#2A0A3D", "#3C096C", "#5A189A", "#9D4EDD"], tags: ["Purple"] },
  { id: "93", name: "Deep Purple", colors: ["#12002F", "#2E1065", "#4C1D95", "#6D28D9", "#A78BFA"], tags: ["Purple"] },
  { id: "94", name: "Spring", colors: ["#A7F3D0", "#FDE68A", "#BFDBFE", "#FBCFE8", "#DCFCE7"], tags: ["Seasonal"] },
  { id: "95", name: "Mystic", colors: ["#0F172A", "#1E293B", "#334155", "#64748B", "#CBD5E1"], tags: ["Dark"] },
  { id: "96", name: "Purple Haze", colors: ["#2E1065", "#4C1D95", "#6D28D9", "#A78BFA", "#EDE9FE"], tags: ["Purple"] },
  { id: "97", name: "Purple Rain", colors: ["#240046", "#3C096C", "#5A189A", "#7B2CBF", "#C77DFF"], tags: ["Purple"] },
  { id: "98", name: "Purple Heart", colors: ["#2A0A3D", "#5A189A", "#7B2CBF", "#C77DFF", "#EBD3FF"], tags: ["Purple"] },
  { id: "99", name: "Purple Majesty", colors: ["#1B0F2F", "#2E1065", "#5A189A", "#9D4EDD", "#E0AAFF"], tags: ["Purple"] },
  { id: "100", name: "Purple Passion", colors: ["#3C096C", "#6D28D9", "#A855F7", "#C77DFF", "#F3D9FF"], tags: ["Purple"] },
  { id: "101", name: "Purple Dream", colors: ["#2E1065", "#4C1D95", "#6D28D9", "#A78BFA", "#DDD6FE"], tags: ["Purple"] },
  { id: "102", name: "Purple Night", colors: ["#0F002B", "#1B0F2F", "#2E1065", "#4C1D95", "#6D28D9"], tags: ["Purple"] },
  { id: "103", name: "Neon Lime", colors: ["#39FF14", "#66FF00", "#8FFF00", "#B2FF59", "#E6FFB1"], tags: ["Neon"] },
  { id: "104", name: "Purple Dawn", colors: ["#2A0A3D", "#4B296B", "#6A4C93", "#9D7BB0", "#E6DAF2"], tags: ["Purple"] },
  { id: "105", name: "Purple Dusk", colors: ["#1B0F2F", "#2A0A3D", "#3C096C", "#5A189A", "#9D4EDD"], tags: ["Purple"] },
  { id: "106", name: "Purple Twilight", colors: ["#0B132B", "#1C2541", "#3A506B", "#6D28D9", "#A78BFA"], tags: ["Purple"] },
  { id: "107", name: "Light Lime", colors: ["#ECFCCB", "#D9F99D", "#BEF264", "#A3E635", "#65A30D"], tags: ["Green"] },
  { id: "108", name: "Purple Midnight", colors: ["#12002F", "#1B0F2F", "#2E1065", "#4C1D95", "#6D28D9"], tags: ["Purple"] },
  { id: "109", name: "Purple Magic", colors: ["#240046", "#5A189A", "#7B2CBF", "#C77DFF", "#EBD3FF"], tags: ["Purple"] },
  { id: "110", name: "Forest Green", colors: ["#052E16", "#14532D", "#166534", "#4ADE80", "#BBF7D0"], tags: ["Green"] },
  { id: "111", name: "Purple Mystery", colors: ["#1B0F2F", "#2E1065", "#5A189A", "#9D4EDD", "#E0AAFF"], tags: ["Purple"] },
  { id: "112", name: "Purple Enchantment", colors: ["#3C096C", "#6D28D9", "#A855F7", "#C77DFF", "#F3D9FF"], tags: ["Purple"] },
  { id: "113", name: "Purple Whisper", colors: ["#F3E8FF", "#E9D5FF", "#D8B4FE", "#C084FC", "#A855F7"], tags: ["Purple"] },
  { id: "114", name: "Purple Echo", colors: ["#EEF2FF", "#E0E7FF", "#C7D2FE", "#A5B4FC", "#818CF8"], tags: ["Purple"] },
  { id: "115", name: "Purple Shadow", colors: ["#1B0F2F", "#2A0A3D", "#3C096C", "#5A189A", "#9D4EDD"], tags: ["Purple"] },
  { id: "116", name: "Purple Mist", colors: ["#F5F3FF", "#EDE9FE", "#DDD6FE", "#C4B5FD", "#A78BFA"], tags: ["Purple"] },


  { id: "117", name: "Pale Yellow", colors: ["#FFFDE7", "#FFF9C4", "#FFF59D", "#FFF176", "#FFEE58"], tags: ["Yellow", "Soft"] },
  { id: "118", name: "Purple Haze", colors: ["#2E1065", "#4C1D95", "#6D28D9", "#A78BFA", "#EDE9FE"], tags: ["Purple"] },
  { id: "119", name: "Purple Dream", colors: ["#240046", "#5A189A", "#7B2CBF", "#C77DFF", "#EBD3FF"], tags: ["Purple"] },
  { id: "120", name: "Bright Gold", colors: ["#FFD700", "#FFC300", "#FFB703", "#FFD166", "#FFF1C1"], tags: ["Gold", "Bright"] },
  { id: "121", name: "Purple Fantasy", colors: ["#2A0A3D", "#4B296B", "#6A4C93", "#9D7BB0", "#E6DAF2"], tags: ["Purple"] },
  { id: "122", name: "Purple Wonder", colors: ["#3C096C", "#5A189A", "#7B2CBF", "#9D4EDD", "#E0AAFF"], tags: ["Purple"] },
  { id: "123", name: "Purple Magic", colors: ["#240046", "#3C096C", "#5A189A", "#7B2CBF", "#C77DFF"], tags: ["Purple"] },
  { id: "124", name: "Orange", colors: ["#7C2D12", "#EA580C", "#FB923C", "#FDBA74", "#FFEDD5"], tags: ["Orange"] },
  { id: "125", name: "Purple Mystery", colors: ["#1B0F2F", "#2A0A3D", "#3C096C", "#5A189A", "#9D4EDD"], tags: ["Purple", "Dark"] },
  { id: "126", name: "Purple Enchantment", colors: ["#2D033B", "#4A0E5C", "#6A1B9A", "#9D4EDD", "#D0A2F7"], tags: ["Purple"] },
  { id: "127", name: "Purple Whisper", colors: ["#F3E8FF", "#E9D5FF", "#D8B4FE", "#C084FC", "#A855F7"], tags: ["Purple", "Soft"] },
  { id: "128", name: "Yellow", colors: ["#FACC15", "#FDE047", "#FEF08A", "#FEF9C3", "#FFFBEB"], tags: ["Yellow"] },
  { id: "129", name: "Purple Echo", colors: ["#312E81", "#4338CA", "#6366F1", "#A5B4FC", "#E0E7FF"], tags: ["Purple"] },
  { id: "130", name: "Purple Shadow", colors: ["#1B0F2F", "#2A0A3D", "#3C096C", "#5A189A", "#9D4EDD"], tags: ["Purple", "Dark"] },
  { id: "131", name: "Gold", colors: ["#FFD700", "#FFC300", "#FFB703", "#FFD166", "#FFF1C1"], tags: ["Gold"] },
  { id: "132", name: "Purple Mist", colors: ["#F5F3FF", "#EDE9FE", "#DDD6FE", "#C4B5FD", "#A78BFA"], tags: ["Purple", "Soft"] },
  { id: "133", name: "Ocean", colors: ["#001219", "#003566", "#005F73", "#0A9396", "#94D2BD"], tags: ["Blue", "Ocean"] },
  { id: "134", name: "Winter", colors: ["#E0F2FE", "#BAE6FD", "#7DD3FC", "#38BDF8", "#0284C7"], tags: ["Blue", "Cold"] },
  { id: "135", name: "Autumn", colors: ["#7C2D12", "#9A3412", "#C2410C", "#EA580C", "#FED7AA"], tags: ["Orange", "Season"] },
  { id: "136", name: "Desert", colors: ["#EDC9AF", "#E6B89C", "#D4A373", "#B08968", "#7F5539"], tags: ["Sand", "Warm"] },
  { id: "137", name: "Sunrise", colors: ["#FF6F61", "#FF9671", "#FFC75F", "#F9F871", "#FFF3C7"], tags: ["Warm", "Morning"] },
  { id: "138", name: "Deep Forest", colors: ["#041B15", "#052E16", "#0F3D2E", "#14532D", "#2F855A"], tags: ["Green", "Dark"] },
  { id: "139", name: "Sky Blue", colors: ["#E0F2FE", "#BAE6FD", "#7DD3FC", "#38BDF8", "#0284C7"], tags: ["Blue", "Sky"] },
  { id: "140", name: "Navy Blue", colors: ["#020617", "#020617", "#020617", "#1E293B", "#334155"], tags: ["Blue", "Dark"] },
  { id: "141", name: "Pale Lime", colors: ["#F7FEE7", "#ECFCCB", "#D9F99D", "#BEF264", "#A3E635"], tags: ["Lime", "Soft"] },
  { id: "142", name: "Ocean Blue", colors: ["#001F3F", "#003566", "#004E89", "#0077B6", "#90DBF4"], tags: ["Blue", "Ocean"] },
  { id: "143", name: "Azure", colors: ["#ECFEFF", "#CFFAFE", "#A5F3FC", "#67E8F9", "#22D3EE"], tags: ["Cyan"] },
  { id: "144", name: "Bright Yellow", colors: ["#FFD700", "#FFEB3B", "#FFF176", "#FFF9C4", "#FFFDE7"], tags: ["Yellow", "Bright"] },
  { id: "145", name: "Deep Ocean", colors: ["#000814", "#001D3D", "#003566", "#005F73", "#94D2BD"], tags: ["Blue", "Deep"] },
  { id: "146", name: "Royal Blue", colors: ["#1E3A8A", "#1D4ED8", "#3B82F6", "#93C5FD", "#DBEAFE"], tags: ["Blue", "Royal"] },
  { id: "147", name: "Cobalt", colors: ["#1E3A8A", "#1E40AF", "#2563EB", "#60A5FA", "#DBEAFE"], tags: ["Blue"] },
  { id: "148", name: "Bright Green", colors: ["#14532D", "#16A34A", "#22C55E", "#4ADE80", "#BBF7D0"], tags: ["Green", "Bright"] },
  { id: "149", name: "Powder Blue", colors: ["#EFF6FF", "#DBEAFE", "#BFDBFE", "#93C5FD", "#60A5FA"], tags: ["Blue", "Soft"] },
  { id: "150", name: "Baby Blue", colors: ["#F0F9FF", "#E0F2FE", "#BAE6FD", "#7DD3FC", "#38BDF8"], tags: ["Blue", "Soft"] },
  { id: "151", name: "Steel Blue", colors: ["#1E293B", "#334155", "#475569", "#64748B", "#94A3B8"], tags: ["Blue", "Muted"] },
  { id: "152", name: "Electric Blue", colors: ["#0EA5E9", "#38BDF8", "#7DD3FC", "#BAE6FD", "#E0F2FE"], tags: ["Blue", "Bright"] },
  { id: "153", name: "Indigo", colors: ["#1E1B4B", "#312E81", "#4338CA", "#6366F1", "#A5B4FC"], tags: ["Indigo"] },
  { id: "154", name: "Denim", colors: ["#0F172A", "#1E293B", "#334155", "#475569", "#64748B"], tags: ["Blue"] },
  { id: "155", name: "Slate Blue", colors: ["#1E293B", "#334155", "#475569", "#64748B", "#94A3B8"], tags: ["Slate", "Blue"] },
  { id: "156", name: "Cornflower", colors: ["#E7F0FF", "#C3D8FF", "#9DBFFF", "#6495ED", "#3B6EDC"], tags: ["Blue"] },
  { id: "157", name: "Lime", colors: ["#365314", "#4D7C0F", "#65A30D", "#84CC16", "#BEF264"], tags: ["Lime"] },
  { id: "158", name: "Sapphire", colors: ["#0F172A", "#1E3A8A", "#1D4ED8", "#2563EB", "#60A5FA"], tags: ["Blue", "Jewel"] },
  { id: "159", name: "Ice Blue", colors: ["#F0F9FF", "#E0F2FE", "#BAE6FD", "#7DD3FC", "#38BDF8"], tags: ["Blue", "Cold"] },
  { id: "160", name: "Dark Olive", colors: ["#1A2E05", "#2F3E1E", "#3F4F2F", "#6B8E23", "#A3B18A"], tags: ["Green", "Dark"] },
  { id: "161", name: "Cerulean", colors: ["#083344", "#155E75", "#0891B2", "#22D3EE", "#CFFAFE"], tags: ["Cyan"] },
  { id: "162", name: "Midnight Blue", colors: ["#020617", "#020617", "#020617", "#020617", "#1E293B"], tags: ["Blue", "Dark"] },
  { id: "163", name: "Turquoise", colors: ["#134E4A", "#0F766E", "#14B8A6", "#5EEAD4", "#CCFBF1"], tags: ["Teal"] },
  { id: "164", name: "Teal", colors: ["#042F2E", "#0F766E", "#14B8A6", "#5EEAD4", "#CCFBF1"], tags: ["Teal"] },
  { id: "165", name: "Arctic Blue", colors: ["#F0F9FF", "#E0F2FE", "#BAE6FD", "#7DD3FC", "#38BDF8"], tags: ["Blue", "Cold"] },
  { id: "166", name: "Deep Sea", colors: ["#001219", "#002F49", "#003566", "#005F73", "#94D2BD"], tags: ["Blue", "Deep"] },
  { id: "167", name: "Marine Blue", colors: ["#001F3F", "#003566", "#004E89", "#0077B6", "#90DBF4"], tags: ["Blue", "Ocean"] },
  { id: "168", name: "Ocean Deep", colors: ["#000814", "#001D3D", "#003566", "#005F73", "#0A9396"], tags: ["Ocean", "Dark"] },
  { id: "169", name: "Pacific Blue", colors: ["#003049", "#005F73", "#0A9396", "#94D2BD", "#E9D8A6"], tags: ["Ocean"] },
  { id: "170", name: "Caribbean", colors: ["#006D77", "#83C5BE", "#EDF6F9", "#FFDDD2", "#E29578"], tags: ["Tropical"] },
  { id: "171", name: "Mediterranean", colors: ["#003566", "#005F73", "#0A9396", "#94D2BD", "#E9D8A6"], tags: ["Sea"] },


  { id: "172", name: "Pale Yellow", colors: ["#FFFDE7", "#FFF9C4", "#FFF59D", "#FFF176", "#FFEE58"], tags: ["Yellow", "Soft"] },
  { id: "173", name: "Aqua", colors: ["#E0F7FA", "#B2EBF2", "#80DEEA", "#4DD0E1", "#26C6DA"], tags: ["Aqua", "Cyan"] },
  { id: "174", name: "Deep Ocean", colors: ["#001219", "#002F49", "#003566", "#005F73", "#0A9396"], tags: ["Blue", "Ocean", "Dark"] },
  { id: "175", name: "Navy", colors: ["#020617", "#020A1F", "#0A2540", "#1E3A8A", "#3B82F6"], tags: ["Blue", "Navy"] },
  { id: "176", name: "Olive", colors: ["#3A5A40", "#588157", "#6B8E23", "#A3B18A", "#DAD7CD"], tags: ["Green", "Olive"] },
  { id: "177", name: "Sky", colors: ["#E0F2FE", "#BAE6FD", "#7DD3FC", "#38BDF8", "#0284C7"], tags: ["Blue", "Sky"] },
  { id: "178", name: "Powder", colors: ["#F1F5F9", "#E2E8F0", "#CBD5E1", "#94A3B8", "#64748B"], tags: ["Neutral", "Soft"] },
  { id: "179", name: "Light Yellow", colors: ["#FFFDE7", "#FFF9C4", "#FFF59D", "#FFF176", "#FFEB3B"], tags: ["Yellow", "Light"] },
  { id: "180", name: "Royal", colors: ["#1E40AF", "#1D4ED8", "#2563EB", "#3B82F6", "#BFDBFE"], tags: ["Blue", "Royal"] },
  { id: "181", name: "Azure", colors: ["#F0F9FF", "#E0F2FE", "#BAE6FD", "#7DD3FC", "#0EA5E9"], tags: ["Blue", "Azure"] },
  { id: "182", name: "Cobalt", colors: ["#0A1AFF", "#1E3A8A", "#1E40AF", "#2563EB", "#60A5FA"], tags: ["Blue", "Bold"] },
  { id: "183", name: "Desert", colors: ["#F4E3C1", "#E6CC9C", "#D2B48C", "#C19A6B", "#A47551"], tags: ["Earth", "Warm"] },
  { id: "184", name: "Slate Cyan", colors: ["#1E293B", "#334155", "#0F766E", "#14B8A6", "#5EEAD4"], tags: ["Cyan", "Slate"] },
  { id: "185", name: "Ice Cyan", colors: ["#ECFEFF", "#CFFAFE", "#A5F3FC", "#67E8F9", "#22D3EE"], tags: ["Cyan", "Ice"] },
  { id: "186", name: "Summer", colors: ["#FDE68A", "#FDBA74", "#67E8F9", "#6EE7B7", "#FBCFE8"], tags: ["Bright", "Seasonal"] },
  { id: "187", name: "Mist Cyan", colors: ["#F0FDFA", "#CCFBF1", "#99F6E4", "#5EEAD4", "#2DD4BF"], tags: ["Cyan", "Soft"] },
  { id: "188", name: "Bright Cyan", colors: ["#00E5FF", "#18FFFF", "#64FFDA", "#A7FFEB", "#E0FFFA"], tags: ["Cyan", "Bright"] },
  { id: "189", name: "Ocean Cyan", colors: ["#003B44", "#005F73", "#0A9396", "#52B69A", "#99D98C"], tags: ["Cyan", "Ocean"] },
  { id: "190", name: "Forest", colors: ["#052E16", "#14532D", "#166534", "#4ADE80", "#BBF7D0"], tags: ["Green", "Forest"] },
  { id: "191", name: "Deep Cyan", colors: ["#083344", "#0E7490", "#0891B2", "#22D3EE", "#67E8F9"], tags: ["Cyan", "Deep"] },
  { id: "192", name: "Dark Cyan", colors: ["#042F2E", "#064E3B", "#0F766E", "#14B8A6", "#2DD4BF"], tags: ["Cyan", "Dark"] },
  { id: "193", name: "Winter", colors: ["#F1F5F9", "#E2E8F0", "#CBD5E1", "#94A3B8", "#64748B"], tags: ["Cool", "Seasonal"] },
  { id: "194", name: "Light Cyan", colors: ["#ECFEFF", "#CFFAFE", "#A5F3FC", "#67E8F9", "#22D3EE"], tags: ["Cyan", "Light"] },
  { id: "195", name: "Cyan", colors: ["#083344", "#0E7490", "#0891B2", "#22D3EE", "#67E8F9"], tags: ["Cyan"] },
  { id: "196", name: "Teal Cyan", colors: ["#134E4A", "#115E59", "#0D9488", "#2DD4BF", "#99F6E4"], tags: ["Teal", "Cyan"] },
  { id: "197", name: "Pale Cyan", colors: ["#ECFEFF", "#E0F2FE", "#BAE6FD", "#7DD3FC", "#38BDF8"], tags: ["Cyan", "Soft"] },
  { id: "198", name: "Bright Aqua", colors: ["#00E5FF", "#18FFFF", "#64FFDA", "#A7FFEB", "#E0FFFA"], tags: ["Aqua", "Bright"] },
  { id: "199", name: "Muted Cyan", colors: ["#164E63", "#155E75", "#0891B2", "#67E8F9", "#CFFAFE"], tags: ["Cyan", "Muted"] },
  { id: "200", name: "Pure Cyan", colors: ["#083344", "#0891B2", "#06B6D4", "#22D3EE", "#67E8F9"], tags: ["Cyan", "Pure"] },
  { id: "201", name: "Vibrant Cyan", colors: ["#00E5FF", "#18FFFF", "#64FFDA", "#5EEAD4", "#99F6E4"], tags: ["Cyan", "Vibrant"] },
  { id: "202", name: "Deep Aqua", colors: ["#042F2E", "#134E4A", "#0F766E", "#14B8A6", "#2DD4BF"], tags: ["Aqua", "Deep"] },
  { id: "203", name: "Dark Teal", colors: ["#042F2E", "#134E4A", "#115E59", "#0D9488", "#5EEAD4"], tags: ["Teal", "Dark"] },
  { id: "204", name: "Sea Green", colors: ["#064E3B", "#047857", "#10B981", "#6EE7B7", "#D1FAE5"], tags: ["Green", "Sea"] },
  { id: "205", name: "Light Aqua", colors: ["#E0FFFA", "#CCFBF1", "#99F6E4", "#5EEAD4", "#2DD4BF"], tags: ["Aqua", "Light"] },
  { id: "206", name: "Pale Aqua", colors: ["#ECFEFF", "#CFFAFE", "#A5F3FC", "#67E8F9", "#22D3EE"], tags: ["Aqua", "Soft"] },
  { id: "207", name: "Bright Lime", colors: ["#66FF00", "#8FFF00", "#B2FF59", "#CCFF90", "#E6FFB1"], tags: ["Lime", "Bright"] },
  { id: "208", name: "Slate", colors: ["#020617", "#0F172A", "#1E293B", "#334155", "#64748B"], tags: ["Neutral", "Slate"] },
  { id: "209", name: "Ocean", colors: ["#001F3F", "#003566", "#005F73", "#0A9396", "#94D2BD"], tags: ["Ocean", "Blue"] },
  { id: "210", name: "Mist", colors: ["#F8FAFC", "#F1F5F9", "#E2E8F0", "#CBD5E1", "#94A3B8"], tags: ["Neutral", "Soft"] },
  { id: "211", name: "Deep Sea", colors: ["#001219", "#002F49", "#003566", "#005F73", "#0A9396"], tags: ["Sea", "Dark"] },
  { id: "212", name: "Sea Teal", colors: ["#0F766E", "#14B8A6", "#2DD4BF", "#5EEAD4", "#99F6E4"], tags: ["Teal", "Sea"] },
  { id: "213", name: "Olive Green", colors: ["#3A5A40", "#588157", "#6B8E23", "#A3B18A", "#DAD7CD"], tags: ["Green", "Olive"] },
  { id: "214", name: "Ocean Teal", colors: ["#003844", "#005F73", "#0A9396", "#52B69A", "#99D98C"], tags: ["Teal", "Ocean"] },
  { id: "215", name: "Forest Teal", colors: ["#022C22", "#064E3B", "#047857", "#10B981", "#6EE7B7"], tags: ["Teal", "Forest"] },
  { id: "216", name: "Dark Olive", colors: ["#1B2A1F", "#2F3E2E", "#3A5A40", "#588157", "#A3B18A"], tags: ["Olive", "Dark"] },
  { id: "217", name: "Mint Teal", colors: ["#ECFDF5", "#D1FAE5", "#6EE7B7", "#2DD4BF", "#0D9488"], tags: ["Mint", "Teal"] },
  { id: "218", name: "Pure Teal", colors: ["#042F2E", "#115E59", "#0D9488", "#2DD4BF", "#99F6E4"], tags: ["Teal", "Pure"] },
  { id: "219", name: "Bright Teal", colors: ["#00FFD5", "#2DD4BF", "#5EEAD4", "#99F6E4", "#CCFBF1"], tags: ["Teal", "Bright"] },
  { id: "220", name: "Muted Teal", colors: ["#134E4A", "#115E59", "#0F766E", "#14B8A6", "#5EEAD4"], tags: ["Teal", "Muted"] },


  { id: "221", name: "Neon Green", colors: ["#39FF14", "#66FF00", "#8FFF00", "#B2FF59", "#E6FFB1"], tags: ["Green", "Neon", "Bright"] },
  { id: "222", name: "Deep Forest", colors: ["#041B15", "#052E16", "#0F3D2E", "#14532D", "#2F855A"], tags: ["Green", "Dark", "Forest"] },
  { id: "223", name: "Sea Green", colors: ["#064E3B", "#047857", "#10B981", "#6EE7B7", "#D1FAE5"], tags: ["Green", "Sea"] },
  { id: "224", name: "Aqua Teal", colors: ["#004E64", "#007F91", "#00B4D8", "#48CAE4", "#ADE8F4"], tags: ["Teal", "Aqua"] },
  { id: "225", name: "Pale Yellow", colors: ["#FFFDE7", "#FFF9C4", "#FFF59D", "#FFF176", "#FFEE58"], tags: ["Yellow", "Soft"] },
  { id: "226", name: "Pale Teal", colors: ["#ECFEFF", "#CFFAFE", "#A5F3FC", "#67E8F9", "#22D3EE"], tags: ["Teal", "Soft"] },
  { id: "227", name: "Dark Forest", colors: ["#022C22", "#064E3B", "#065F46", "#047857", "#0F766E"], tags: ["Green", "Dark"] },
  { id: "228", name: "Forest", colors: ["#052E16", "#14532D", "#166534", "#4ADE80", "#BBF7D0"], tags: ["Green", "Nature"] },
  { id: "229", name: "Mist Teal", colors: ["#E6FFFA", "#CCFBF1", "#99F6E4", "#5EEAD4", "#2DD4BF"], tags: ["Teal", "Mist"] },
  { id: "230", name: "Teal", colors: ["#042F2E", "#134E4A", "#0F766E", "#14B8A6", "#5EEAD4"], tags: ["Teal"] },
  { id: "231", name: "Light Teal", colors: ["#F0FDFA", "#CCFBF1", "#99F6E4", "#5EEAD4", "#2DD4BF"], tags: ["Teal", "Light"] },
  { id: "232", name: "Ocean Teal", colors: ["#001F3F", "#003566", "#005F73", "#0A9396", "#94D2BD"], tags: ["Teal", "Ocean"] },
  { id: "233", name: "Sea Foam", colors: ["#ECFEFF", "#D1FAE5", "#A7F3D0", "#6EE7B7", "#34D399"], tags: ["Green", "Fresh"] },
  { id: "234", name: "Bright Yellow", colors: ["#FFD700", "#FFEB3B", "#FFF176", "#FFF9C4", "#FFFDE7"], tags: ["Yellow", "Bright"] },
  { id: "235", name: "Slate Teal", colors: ["#1F2933", "#374151", "#0F766E", "#14B8A6", "#99F6E4"], tags: ["Teal", "Slate"] },
  { id: "236", name: "Bright Aqua", colors: ["#00E5FF", "#18FFFF", "#64FFDA", "#A7FFEB", "#E0FFFA"], tags: ["Aqua", "Bright"] },
  { id: "237", name: "Mint", colors: ["#ECFDF5", "#D1FAE5", "#A7F3D0", "#6EE7B7", "#34D399"], tags: ["Green", "Mint"] },
  { id: "238", name: "Orange Yellow", colors: ["#FFB703", "#FFC300", "#FFD166", "#FFEA85", "#FFF1C1"], tags: ["Orange", "Yellow"] },
  { id: "239", name: "Deep Sea", colors: ["#001219", "#002F49", "#003566", "#005F73", "#94D2BD"], tags: ["Blue", "Deep"] },
  { id: "240", name: "Forest Green", colors: ["#064E3B", "#047857", "#065F46", "#16A34A", "#4ADE80"], tags: ["Green"] },
  { id: "241", name: "Orange", colors: ["#7C2D12", "#C2410C", "#EA580C", "#FB923C", "#FED7AA"], tags: ["Orange"] },
  { id: "242", name: "Mist", colors: ["#F8FAFC", "#E2E8F0", "#CBD5E1", "#94A3B8", "#64748B"], tags: ["Neutral", "Soft"] },
  { id: "243", name: "Yellow", colors: ["#FEF08A", "#FDE047", "#FACC15", "#EAB308", "#CA8A04"], tags: ["Yellow"] },
  { id: "244", name: "Pale Mint", colors: ["#F0FDFA", "#CCFBF1", "#99F6E4", "#5EEAD4", "#2DD4BF"], tags: ["Mint", "Soft"] },
  { id: "245", name: "Bright Mint", colors: ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0", "#D1FAE5"], tags: ["Mint", "Bright"] },
  { id: "246", name: "Teal Green", colors: ["#022C22", "#064E3B", "#047857", "#10B981", "#6EE7B7"], tags: ["Teal", "Green"] },
  { id: "247", name: "Slate", colors: ["#020617", "#1E293B", "#334155", "#64748B", "#CBD5E1"], tags: ["Slate", "Neutral"] },
  { id: "248", name: "Olive", colors: ["#3A5A40", "#588157", "#6B8E23", "#A3B18A", "#DAD7CD"], tags: ["Olive", "Green"] },
  { id: "249", name: "Sage Green", colors: ["#ECFDF5", "#D1FAE5", "#A7F3D0", "#86EFAC", "#4ADE80"], tags: ["Green", "Sage"] },
  { id: "250", name: "Mint Green", colors: ["#ECFDF5", "#D1FAE5", "#A7F3D0", "#6EE7B7", "#34D399"], tags: ["Green", "Mint"] },
  { id: "251", name: "Lime Green", colors: ["#365314", "#4D7C0F", "#65A30D", "#84CC16", "#BEF264"], tags: ["Lime", "Green"] },
  { id: "252", name: "Bright Green", colors: ["#22C55E", "#4ADE80", "#86EFAC", "#BBF7D0", "#DCFCE7"], tags: ["Green", "Bright"] },
  { id: "253", name: "Pure Green", colors: ["#14532D", "#16A34A", "#22C55E", "#4ADE80", "#BBF7D0"], tags: ["Green", "Pure"] },
  { id: "254", name: "Olive Green", colors: ["#3F6212", "#4D7C0F", "#65A30D", "#84CC16", "#BEF264"], tags: ["Olive", "Green"] },
  { id: "255", name: "Moss Green", colors: ["#14532D", "#166534", "#365314", "#4D7C0F", "#84CC16"], tags: ["Green", "Moss"] },
  { id: "256", name: "Spring", colors: ["#A7F3D0", "#FDE68A", "#BFDBFE", "#FBCFE8", "#DCFCE7"], tags: ["Fresh", "Season"] },
  { id: "257", name: "Light Green", colors: ["#ECFDF5", "#D1FAE5", "#A7F3D0", "#6EE7B7", "#34D399"], tags: ["Green", "Light"] },
  { id: "258", name: "Sunrise", colors: ["#FFB703", "#FB8500", "#F77F00", "#FEC89A", "#FFF1C1"], tags: ["Warm", "Sunrise"] },

  {
    id: "259",
    name: "Lime",
    colors: ["#65A30D", "#84CC16", "#A3E635", "#BEF264", "#ECFCCB"],
    tags: ["Green", "Lime", "Fresh"]
  },
  {
    id: "260",
    name: "Mist Green",
    colors: ["#F0FDF4", "#DCFCE7", "#BBF7D0", "#86EFAC", "#4ADE80"],
    tags: ["Green", "Soft", "Pastel"]
  },
  {
    id: "261",
    name: "Pale Green",
    colors: ["#ECFDF5", "#D1FAE5", "#A7F3D0", "#6EE7B7", "#34D399"],
    tags: ["Green", "Light", "Minimal"]
  },
  {
    id: "262",
    name: "Desert",
    colors: ["#F5E6C8", "#EAD7B7", "#D6B98C", "#C19A6B", "#A47551"],
    tags: ["Earth", "Warm", "Neutral"]
  },
  {
    id: "263",
    name: "Forest",
    colors: ["#052E16", "#14532D", "#166534", "#22C55E", "#BBF7D0"],
    tags: ["Green", "Nature", "Deep"]
  },
  {
    id: "264",
    name: "Sage",
    colors: ["#ECFDF5", "#D1FAE5", "#9FB8A0", "#7A9E7E", "#5F8575"],
    tags: ["Green", "Muted", "Calm"]
  },
  {
    id: "265",
    name: "Mint",
    colors: ["#ECFEFF", "#CFFAFE", "#99F6E4", "#5EEAD4", "#2DD4BF"],
    tags: ["Mint", "Fresh", "Cool"]
  },
  {
    id: "266",
    name: "Summer",
    colors: ["#FDE68A", "#A7F3D0", "#7DD3FC", "#FBCFE8", "#FED7AA"],
    tags: ["Bright", "Seasonal", "Vibrant"]
  },
  {
    id: "267",
    name: "Bright Lime",
    colors: ["#66FF00", "#8FFF00", "#B2FF59", "#CCFF90", "#E6FFB1"],
    tags: ["Lime", "Neon", "Bright"]
  },
  {
    id: "268",
    name: "Olive",
    colors: ["#3A5A40", "#588157", "#6B8E23", "#A3B18A", "#DAD7CD"],
    tags: ["Green", "Olive", "Earth"]
  },
  {
    id: "269",
    name: "Sunset",
    colors: ["#FF6F61", "#FF9F45", "#FFD166", "#FFE29A", "#FFF3C4"],
    tags: ["Warm", "Orange", "Evening"]
  },
  {
    id: "270",
    name: "Lime Green",
    colors: ["#4D7C0F", "#65A30D", "#84CC16", "#BEF264", "#ECFCCB"],
    tags: ["Green", "Lime", "Nature"]
  },
  {
    id: "271",
    name: "Forest Green",
    colors: ["#022C22", "#064E3B", "#065F46", "#16A34A", "#86EFAC"],
    tags: ["Green", "Forest", "Dark"]
  },
  {
    id: "272",
    name: "Green",
    colors: ["#14532D", "#16A34A", "#22C55E", "#4ADE80", "#BBF7D0"],
    tags: ["Green", "Primary", "Natural"]
  },
  {
    id: "273",
    name: "Twilight",
    colors: ["#0B132B", "#1C2541", "#3A506B", "#5BC0BE", "#CAE9FF"],
    tags: ["Blue", "Night", "Cool"]
  },
  {
    id: "274",
    name: "Bright Forest",
    colors: ["#14532D", "#22C55E", "#4ADE80", "#86EFAC", "#DCFCE7"],
    tags: ["Green", "Bright", "Nature"]
  }


];

const COLORS_FILTER = ["All", "Favorites", "Red", "Pink", "Purple", "Cyan", "Teal", "Green", "Lime", "Yellow"];

// --- The "Infinite" Hex Mapping Logic ---
// We map the spectrum by rotating Hue (0-360), Saturation (0-100), and Lightness (0-100)
// providing a mathematical representation of the entire 16.7M color space.
const generateTrueSpectrum = () => {
  const steps = 1800; // Increased granularity for true #000 to #FFF transition
  const blocks = [];

  const hslToHex = (h, s, l) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  };

  for (let i = 0; i <= steps; i++) {
    const hue = (i / steps) * 360;
    // We create "slices" of the color cube
    const colors = [
      hslToHex(hue, 100, 10), // Deep
      hslToHex(hue, 100, 30), // Dark
      hslToHex(hue, 100, 50), // Pure
      hslToHex(hue, 100, 70), // Bright
      hslToHex(hue, 100, 90), // Pastel
      hslToHex(hue, 20, 50),  // Muted
      hslToHex(hue, 0, i / steps * 100), // Grayscale track integrated
    ];

    blocks.push({
      id: `hex-${i}`,
      hue,
      colors
    });
  }
  return blocks;
};

const TRUE_SPECTRUM_DATA = generateTrueSpectrum();

export default function ColorPalettePage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("Default");
  const [copyStatus, setCopyStatus] = useState(null);
  const [customHex, setCustomHex] = useState("#6366F1");

  const [favorites, setFavorites] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("revolyx_favorites");
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("revolyx_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  const copyToClipboard = useCallback((hex) => {
    navigator.clipboard.writeText(hex);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCopyStatus(hex);
    setCustomHex(hex);
    setTimeout(() => setCopyStatus(null), 2000);
  }, []);

  const filteredPalettes = useMemo(() => {
    let result = [...PALETTES_DATA];
    if (activeFilter === "Favorites") {
      result = result.filter((p) => favorites.includes(p.id));
    } else if (activeFilter !== "All") {
      result = result.filter((p) => p.tags.includes(activeFilter));
    }
    if (activeSort === "A-Z") result.sort((a, b) => a.name.localeCompare(b.name));
    if (activeSort === "Random") result.sort(() => Math.random() - 0.5);
    return result;
  }, [activeFilter, activeSort, favorites]);

  return (
    <div className="min-h-screen  text-slate-900 font-sans pb-40">
      {/* Dynamic Background Glow */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-5 transition-colors duration-1000"
        style={{ backgroundColor: customHex }}
      />

<header className="
  relative
  max-w-8xl mx-auto
  px-6 py-8 md:px-12 md:py-14
  flex flex-col md:flex-row
  md:items-center md:justify-between
  gap-10
">
  {/* ================= Left / Branding ================= */}
  <div>
    <div className="flex items-center gap-4 mb-3">
      <div className="
        p-3 rounded-2xl
        bg-black dark:bg-white
        text-white dark:text-black
        shadow-xl
      ">
        <Palette size={26} />
      </div>

      <h1 className="
        text-4xl md:text-5xl
        font-black tracking-tighter italic
        text-black dark:text-white
      ">
        HEX
        <span className="text-slate-400 dark:text-zinc-500">FLOW</span>
      </h1>
    </div>

    <p className="
      max-w-md
      text-base md:text-lg
      font-medium
      text-slate-500 dark:text-zinc-400
      leading-relaxed
    ">
      A continuous mathematical mapping of the visual spectrum.
    </p>
  </div>

  {/* ================= Active Color Card ================= */}
  <div className="
    group
    relative
    flex items-center justify-between gap-6
    p-4 pr-6
    rounded-[2.5rem]
    border border-slate-200 dark:border-white/10
    bg-white dark:bg-zinc-900
    shadow-2xl shadow-slate-200/70 dark:shadow-black/40
    transition-all duration-300
    hover:scale-[1.02]
  ">
    {/* Color Preview */}
    <div
      className="
        w-16 h-16
        rounded-[1.5rem]
        shadow-inner
        transition-all duration-500
        rotate-3 group-hover:rotate-0
      "
      style={{
        backgroundColor: customHex,
        boxShadow: `0 20px 40px ${customHex}33`,
      }}
    />

    {/* Color Info */}
    <div className="flex flex-col">
      <span className="
        text-[10px]
        font-extrabold
        uppercase tracking-[0.25em]
        text-slate-400 dark:text-zinc-500
        mb-1
      ">
        Current Focus
      </span>

      <span className="
        font-mono
        text-2xl
        font-black
        tracking-tight
        uppercase
        text-slate-800 dark:text-zinc-100
      ">
        {customHex}
      </span>
    </div>

    {/* Copy Button */}
    <button
      onClick={() => copyToClipboard(customHex)}
      className="
        ml-4
        w-12 h-12
        flex items-center justify-center
        rounded-full
        bg-slate-900 dark:bg-white
        text-white dark:text-black
        transition-all
        hover:scale-105
        active:scale-95
        focus:outline-none
        focus-visible:ring-2
        cursor-pointer
        focus-visible:ring-zinc-500
      "
    >
      <Copy size={18} />
    </button>
  </div>
</header>


      <main className="max-w-[1600px] mx-auto px-6 md:px-12 space-y-24 relative z-10">
        
        {/* Navigation */}
<div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6 items-center justify-between">
  
  {/* ================= Filters ================= */}
  <nav
    className="
      w-full lg:w-auto
      flex flex-wrap items-center justify-center gap-1
      rounded-2xl p-2
      border border-black/5 dark:border-white/10
      bg-white/80 dark:bg-zinc-900/70
      backdrop-blur-xl
      shadow-lg
    "
  >
    {COLORS_FILTER.map((color) => (
      <button
        key={color}
        onClick={() => setActiveFilter(color)}
        className={cn(
          `
            px-4 sm:px-5 py-2 sm:py-2.5
            rounded-full
            text-[10px] sm:text-[11px]
            font-extrabold uppercase tracking-widest
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
          `,
          activeFilter === color
            ? `
              bg-zinc-900 text-white
              dark:bg-white dark:text-zinc-900
              shadow-md scale-[1.04]
            `
            : `
              text-zinc-500 dark:text-zinc-400
              hover:text-zinc-900 dark:hover:text-white
              hover:bg-zinc-100 dark:hover:bg-white/10
            `
        )}
      >
        {color}
      </button>
    ))}
  </nav>

  {/* ================= Sort Controls ================= */}
  <div className="flex items-center gap-4">
    
    {/* Divider (Desktop only) */}
    <div className="hidden lg:block h-8 w-px bg-zinc-200 dark:bg-white/10" />

    <div
      className="
        flex items-center gap-1
        rounded-xl p-1
        bg-zinc-100 dark:bg-zinc-800
        border border-black/5 dark:border-white/10
        shadow-sm
      "
    >
      {[ 
        { n: "Default", i: LayoutGrid },
        { n: "Random", i: Shuffle },
        { n: "A-Z", i: SortAsc }
      ].map((s) => (
        <button
          key={s.n}
          onClick={() => setActiveSort(s.n)}
          className={cn(
            `
              flex items-center gap-2
              px-3 py-2
              cursor-pointer
              rounded-lg
              text-[10px] font-extrabold uppercase tracking-wide
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500
            `,
            activeSort === s.n
              ? `
                bg-white dark:bg-zinc-900
                text-zinc-600 dark:text-zinc-400
                shadow
              `
              : `
                text-zinc-400 dark:text-zinc-500
                hover:text-zinc-700 dark:hover:text-zinc-300
              `
          )}
        >
          <s.i size={16} />
          <span className="hidden sm:inline">{s.n}</span>
        </button>
      ))}
    </div>
  </div>
</div>


{/* ================= Curated Section ================= */}
<section className="relative">
  
  {/* Section Header */}
  <div className="flex items-center gap-4 mb-10">
    <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
    
    <h2
      className="
        
        text-[10px] sm:text-xs
        font-extrabold
        uppercase tracking-[0.35em]
        text-zinc-400 dark:text-zinc-500
        whitespace-nowrap
      "
    >
      Curated Samples
    </h2>

    <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
  </div>

  {/* Grid */}
  <div
    className="
      grid gap-5 sm:gap-6
      grid-cols-1
      sm:grid-cols-4
      md:grid-cols-5
      lg:grid-cols-6
     
    "
  >
    <AnimatePresence mode="popLayout">
      {filteredPalettes.map((p) => (
        <PaletteCard
          key={p.id}
          palette={p}
          onCopy={copyToClipboard}
          isLiked={favorites.includes(p.id)}
          onToggleLike={() => toggleFavorite(p.id)}
        />
      ))}
    </AnimatePresence>
  </div>

</section>


        {/* The Infinite Flow Section */}
        <section className="space-y-12">
           <div className="flex items-center gap-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">The Complete Flow</h2>
            <div className="h-px flex-1 bg-slate-200" />
            <div className="flex gap-2 text-[10px] font-bold text-slate-500 italic">
              <span>#000000</span>
              <ChevronRight size={12} />
              <span>#FFFFFF</span>
            </div>
          </div>

          <div className="grid h-100 sm:h-150 overflow-y-auto grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
            {TRUE_SPECTRUM_DATA.map((set) => (
              <div 
                key={set.id}
                className="group relative h-40 flex flex-col border-2 border-black/10 dark:border-white/70  overflow-hidden rounded-2xl"
              >
                {set.colors.map((color, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    onClick={() => copyToClipboard(color)}
                    className="flex-1 w-full cursor-crosshair transition-all hover:flex-[4] relative group/cell"
                    style={{ backgroundColor: color }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 flex items-center justify-center pointer-events-none">
                      <div className="bg-white/10 backdrop-blur-md p-1 rounded border border-white/20 shadow-2xl">
                         <Pipette size={12} className="text-white" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>

 {/* Modern Toast */}
<AnimatePresence>
  {copyStatus && (
    <motion.div
      initial={{ y: 80, x: "-50%", opacity: 0, scale: 0.95 }}
      animate={{ y: 0, x: "-50%", opacity: 1, scale: 1 }}
      exit={{ y: 80, x: "-50%", opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="
        fixed bottom-6 left-1/2 z-[100]
        flex items-center gap-4
        px-4 py-3 pr-6
        rounded-full
        backdrop-blur-2xl
        border
        shadow-2xl
        bg-white/80 text-black
        border-black/10
        dark:bg-black/70 dark:text-white
        dark:border-white/10
      "
    >
      {/* Color Preview */}
      <div
        className="
          w-10 h-10 rounded-full
          ring-2 ring-black/10 dark:ring-white/20
          shadow-inner
        "
        style={{ backgroundColor: copyStatus }}
      />

      {/* Text */}
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-black/50 dark:text-white/40">
          Copied
        </span>
        <span className="font-mono text-sm font-black tracking-tight">
          {copyStatus}
        </span>
      </div>

      {/* Accent Glow */}
      <div className="absolute inset-0 rounded-full pointer-events-none ring-1 ring-black/5 dark:ring-white/5" />
    </motion.div>
  )}
</AnimatePresence>

    </div>
  );
}

function PaletteCard({ palette, onCopy, isLiked, onToggleLike }) {
  return (
    <motion.div
      layout
      className="
        group
        relative
        overflow-hidden
        rounded-3xl
        border border-zinc-200 dark:border-white/10
        bg-white dark:bg-zinc-900
        transition-all duration-500
        hover:shadow-2xl hover:shadow-zinc-200/60 dark:hover:shadow-black/40
      "
    >
      {/* ================= Color Strip ================= */}
      <div className="flex h-32 w-full cursor-pointer p-1.5">
        <div className="flex w-full overflow-hidden rounded-2xl">
          {palette.colors.map((color, idx) => (
            <div
              key={idx}
              onClick={() => onCopy(color)}
              style={{ backgroundColor: color }}
              className="
                group/swatch
                relative
                flex-1
                flex items-center justify-center
                transition-all duration-300 ease-out
                hover:flex-[3]
              "
            >
              {/* Hover tooltip */}
              <span
                className="
                  pointer-events-none
                  absolute bottom-2
                  opacity-0 group-hover/swatch:opacity-100
                  transition-all duration-200
                  text-[9px] font-extrabold tracking-widest
                  px-2 py-1 rounded-full
                  bg-black/60 text-white
                  backdrop-blur
                "
              >
                {color}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= Content ================= */}
      <div className="flex items-center justify-between px-5 pb-5 pt-2">
        <div className="min-w-0">
          <h4
            className="
              text-sm
              font-extrabold uppercase tracking-tight
              text-zinc-800 dark:text-zinc-100
              truncate
            "
          >
            {palette.name}
          </h4>

          {/* Tags */}
          <div className="mt-1.5 flex gap-1">
            {palette.tags.slice(0, 1).map((t) => (
              <span
                key={t}
                className="
                  text-[9px]
                  font-extrabold uppercase tracking-widest
                  px-2 py-0.5 rounded-full
                  bg-zinc-100 dark:bg-white/10
                  text-zinc-500 dark:text-zinc-400
                "
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Like Button */}
        <button
          onClick={onToggleLike}
          className={cn(
            `
              w-10 h-10
              rounded-full
              flex items-center justify-center
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400
            `,
            isLiked
              ? "bg-red-100 dark:bg-red-500/20 text-red-500"
              : "text-zinc-300 dark:text-zinc-600 hover:text-red-400"
          )}
        >
          <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>
    </motion.div>
  );
}
