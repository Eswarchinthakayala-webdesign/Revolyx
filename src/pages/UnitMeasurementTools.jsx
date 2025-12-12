// src/pages/UnitMeasurementTools.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  Copy,
  Download,
  Zap,
  Layers,
  Settings,
  Shuffle as Swap,
  Loader2,
  Check,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "../components/theme-provider";
import { showToast } from "../lib/ToastHelper";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
/* ==========================
   Conversion helpers
   ========================== */

// format numbers nicely
function fmt(n) {
  // treat explicit empty as empty (keeps UI tidy)
  if (n === "" || n === null || n === undefined) return "—";

  // If it's already a string like "NaN" or "Error", return it as-is
  // (so error messages or textual results remain visible)
  if (typeof n === "string" && isNaN(Number(n))) return n;

  const num = Number(n);
  if (Number.isNaN(num)) return "—";

  if (!isFinite(num)) return String(num);

  const abs = Math.abs(num);

  // use exponential for very large or very small values
  if (abs >= 1e9 || (abs > 0 && abs < 1e-6)) return num.toExponential(6);

  // otherwise show up to 8 decimal places, trim trailing zeros
  const fixed = num.toFixed(8);
  return fixed.replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
}


// Linear conversion: given map unit -> factor relative to base unit
function linearConverter(unitsMap, baseUnit) {
  // returns function(value, fromUnit) => map unit->value
  return (value, fromUnit) => {
    const results = {};
    if (value === "" || value == null) {
      Object.keys(unitsMap).forEach((u) => (results[u] = ""));
      return results;
    }
    const v = Number(value);
    if (Number.isNaN(v)) {
      Object.keys(unitsMap).forEach((u) => (results[u] = "NaN"));
      return results;
    }
    // convert value to base
    const baseVal = v * (unitsMap[fromUnit] ?? 1);
    Object.entries(unitsMap).forEach(([unit, factor]) => {
      // factor is factor-to-base, so value_in_unit = baseVal / factor
      results[unit] = baseVal / factor;
    });
    return results;
  };
}

// temperature special
function temperatureConverter() {
  return (value, fromUnit) => {
    const units = ["C", "F", "K", "R"]; // Celsius, Fahrenheit, Kelvin, Rankine
    const res = {};
    if (value === "" || value == null) {
      units.forEach((u) => (res[u] = ""));
      return res;
    }
    const v = Number(value);
    if (Number.isNaN(v)) {
      units.forEach((u) => (res[u] = "NaN"));
      return res;
    }
    let C;
    switch (fromUnit) {
      case "C":
        C = v;
        break;
      case "F":
        C = (v - 32) * (5 / 9);
        break;
      case "K":
        C = v - 273.15;
        break;
      case "R":
        C = (v - 491.67) * (5 / 9);
        break;
      default:
        C = v;
    }
    res["C"] = C;
    res["F"] = C * (9 / 5) + 32;
    res["K"] = C + 273.15;
    res["R"] = (C + 273.15) * (9 / 5);
    return res;
  };
}

// pace converter (min/km, min/mi) <-> speed conversions
function paceConverter() {
  // returns a function(value, fromUnit) => { "min/km":..., "min/mi":..., "s/m": ... }
  return (value, fromUnit) => {
    const res = { "min/km": "", "min/mi": "", "s/m": "" };

    if (value === "" || value == null) return res;

    const parsePace = (str) => {
      // Accept numbers (treated as minutes), strings "mm:ss", "m:ss", or decimal minutes "4.5"
      if (typeof str === "number") return Number(str);
      if (typeof str !== "string") return NaN;

      const s = str.trim();
      if (s.includes(":")) {
        // mm:ss or m:ss
        const parts = s.split(":").map((p) => p.trim());
        if (parts.length !== 2) return NaN;
        const mm = Number(parts[0]);
        const ss = Number(parts[1]);
        if (Number.isNaN(mm) || Number.isNaN(ss)) return NaN;
        return mm + ss / 60;
      }
      // try plain number
      const n = Number(s);
      return Number.isNaN(n) ? NaN : n;
    };

    const v = parsePace(value);
    if (Number.isNaN(v)) {
      res["min/km"] = "NaN";
      res["min/mi"] = "NaN";
      res["s/m"] = "NaN";
      return res;
    }

    let minPerKm;
    switch (fromUnit) {
      case "min/km":
        minPerKm = v;
        break;
      case "min/mi":
        // given minutes per mile -> convert to minutes per km by dividing by miles per km
        // 1 mile = 1.609344 km => 1 min/mi = 1 * (1 / 1.609344) min/km? careful:
        // If pace is P (min per mile), then per km = P / 1.609344
        minPerKm = v / 1.609344;
        break;
      case "s/m":
        // v is seconds per metre -> convert to min per km: seconds/m * 1000 = seconds/km -> /60 => minutes/km
        minPerKm = (v * 1000) / 60;
        break;
      default:
        minPerKm = v;
    }

    const minPerMi = minPerKm * 1.609344; // minutes per mile
    const secPerM = (minPerKm * 60) / 1000; // seconds per metre

    res["min/km"] = minPerKm;
    res["min/mi"] = minPerMi;
    res["s/m"] = secPerM;
    return res;
  };
}


// pace <-> speed helper to show speed values
function paceToSpeedMap(paceMinPerKm) {
  if (paceMinPerKm === "" || paceMinPerKm == null) return {};
  const v = Number(paceMinPerKm);
  if (Number.isNaN(v)) return {};
  const mps = 1000 / (v * 60);
  const kmh = mps * 3.6;
  const mph = kmh / 1.609344;
  return { "m/s": mps, "km/h": kmh, "mph": mph };
}

// roman converter
function numberToRoman(num) {
  if (typeof num !== "number") num = Number(num);
  if (!Number.isFinite(num) || num <= 0 || num >= 4000) return "Out of range";
  const romans = [
    ["M", 1000],
    ["CM", 900],
    ["D", 500],
    ["CD", 400],
    ["C", 100],
    ["XC", 90],
    ["L", 50],
    ["XL", 40],
    ["X", 10],
    ["IX", 9],
    ["V", 5],
    ["IV", 4],
    ["I", 1],
  ];
  let res = "";
  let n = num;
  for (const [r, v] of romans) {
    while (n >= v) {
      res += r;
      n -= v;
    }
  }
  return res;
}
function romanToNumber(str) {
  if (!str || typeof str !== "string") return NaN;
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  let i = 0;
  const s = str.toUpperCase().trim();
  while (i < s.length) {
    const current = map[s[i]];
    const next = map[s[i + 1]];
    if (!current) return NaN;
    if (next && next > current) {
      total += next - current;
      i += 2;
    } else {
      total += current;
      i += 1;
    }
  }
  return total;
}

/* ==========================
   Units registry & converters
   ========================== */

const CONVERTERS = {
"Length Converter": {
  id: "length",
  // factor = multiplier to convert unit -> base (meters)
  units: {
    m: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    "µm": 1e-6,      // micrometer (micro)
    "nm": 1e-9,      // nanometer
    in: 0.0254,      // inch
    ft: 0.3048,      // foot
    yd: 0.9144,      // yard
    mi: 1609.344,    // mile
    ly: 9.4607e15,   // light-year (approx meters)
  },
  // optional human-readable names used in selects & preview
  unitNames: {
    m: "Meter",
    km: "Kilometer",
    cm: "Centimeter",
    mm: "Millimeter",
    "µm": "Micrometer",
    nm: "Nanometer",
    in: "Inch",
    ft: "Foot",
    yd: "Yard",
    mi: "Mile",
    ly: "Light-year",
  },
  fn: null, // linear (linear function will be attached automatically elsewhere in the file)
  base: "m",
},


"Area Converter": {
  id: "area",

  // factors convert the unit → base unit (m²)
  units: {
    "m²": 1,                         // square meter
    "km²": 1e6,                       // square kilometer
    "mm²": 1e-6,                      // square millimeter
    "µm²": 1e-12,                     // square micrometer
    "mi²": 2_589_988.110336,          // square mile
    "yd²": 0.83612736,                // square yard
    "ft²": 0.09290304,                // square foot
    "in²": 0.00064516,                // square inch
    "ha": 10000,                      // hectare
    "acre": 4046.8564224,             // acre
  },

  // human-readable names for UI dropdown & preview panel
  unitNames: {
    "m²": "Square Meter",
    "km²": "Square Kilometer",
    "mm²": "Square Millimeter",
    "µm²": "Square Micrometer",
    "mi²": "Square Mile",
    "yd²": "Square Yard",
    "ft²": "Square Foot",
    "in²": "Square Inch",
    "ha": "Hectare",
    "acre": "Acre",
  },

  fn: null, // linear conversion
  base: "m²",
},

"Weight Converter": {
  id: "weight",
  // factor = multiplier to convert unit -> base (kilograms)
  units: {
    kg: 1,                   // Kilogram (base)
    g: 0.001,                // Gram
    mg: 0.000001,            // Milligram
    lb: 0.45359237,          // Pound
    oz: 0.028349523125,      // Ounce
    ct: 0.0002,              // Carat (1 ct = 0.2 g = 0.0002 kg)
    t: 1000,                 // Metric tonne (tonne, metric ton)
  },
  // human friendly names shown in dropdowns & preview
  unitNames: {
    kg: "Kilogram",
    g: "Gram",
    mg: "Milligram",
    lb: "Pound",
    oz: "Ounce",
    ct: "Carat",
    t: "Metric tonne",
  },
  fn: null,
  base: "kg",
},
"Volume Converter": {
  id: "volume",
  // factors are multiplier to convert unit -> base (m³)
  units: {
    "m³": 1,
    L: 0.001,                       // litre
    mL: 0.000001,                   // milliliter
    gal: 0.003785411784,            // US liquid gallon
    qt: 0.000946352946,             // US liquid quart (gallon / 4)
    pint: 0.000473176473,           // US liquid pint (quart / 2)
    cup: 0.0002365882365,           // US customary cup (236.5882365 mL)
    "fl oz": 0.0000295735295625,    // US fluid ounce (29.5735295625 mL)
    tbsp: 0.00001478676478125,      // US tablespoon (14.78676478125 mL)
    tsp: 0.00000492892159375,       // US teaspoon (4.92892159375 mL)
    "ft³": 0.028316846592
  },
  unitNames: {
    "m³": "Cubic meter",
    L: "Litre",
    mL: "Millilitre",
    gal: "US gallon (liquid)",
    qt: "US quart",
    pint: "US pint",
    cup: "US cup",
    "fl oz": "US fluid ounce",
    tbsp: "US tablespoon",
    tsp: "US teaspoon",
    "ft³": "Cubic foot"
  },
  fn: null,
  base: "m³",
},

"Temperature Converter": {
  id: "temperature",
  units: {
    C: 1,   // Celsius
    F: 1,   // Fahrenheit
    K: 1,   // Kelvin
    R: 1,   // Rankine
  },
  unitNames: {
    C: "Celsius",
    F: "Fahrenheit",
    K: "Kelvin",
    R: "Rankine",
  },
  fn: temperatureConverter(), // ← use your existing nonlinear fn
  base: "C",
},

"Time Converter": {
  id: "time",
  // factor = multiplier to convert unit -> base (seconds)
  units: {
    ns: 1e-9,           // nanosecond
    "µs": 1e-6,         // microsecond (µs). Use "us" if you prefer ASCII
    ms: 1e-3,           // millisecond
    s: 1,               // second (base)
    min: 60,            // minute
    hr: 3600,           // hour
    day: 86400,         // day
    week: 604800,       // week (7 days)
    month: 2629800,     // average month (30.44 days)
    year: 31557600,     // average year (365.25 days)
  },
  // human-readable names for dropdowns / preview
  unitNames: {
    ns: "Nanosecond",
    "µs": "Microsecond",
    ms: "Millisecond",
    s: "Second",
    min: "Minute",
    hr: "Hour",
    day: "Day",
    week: "Week",
    month: "Month (avg)",
    year: "Year (avg)",
  },
  fn: null,
  base: "s",
},

"Digital Converter": {
  id: "digital",
  // factor = multiplier to convert unit -> base (bits)
  units: {
    bit: 1,                                     // bit
    B: 8,                                       // byte = 8 bits
    KB: 8 * 1024,                               // kilobyte (binary KB = 1024 bytes)
    MB: 8 * 1024 ** 2,                          // megabyte
    GB: 8 * 1024 ** 3,                          // gigabyte
    TB: 8 * 1024 ** 4,                          // terabyte
    PB: 8 * 1024 ** 5,                          // petabyte
    EB: 8 * 1024 ** 6,                          // exabyte
    ZB: 8 * 1024 ** 7,                          // zettabyte
    YB: 8 * 1024 ** 8,                          // yottabyte
  },
  // human friendly names (used in dropdowns / preview)
  unitNames: {
    bit: "bit",
    B: "Byte",
    KB: "Kilobyte (KB, 1024 B)",
    MB: "Megabyte (MB, 1024 KB)",
    GB: "Gigabyte (GB, 1024 MB)",
    TB: "Terabyte (TB, 1024 GB)",
    PB: "Petabyte (PB, 1024 TB)",
    EB: "Exabyte (EB, 1024 PB)",
    ZB: "Zettabyte (ZB, 1024 EB)",
    YB: "Yottabyte (YB, 1024 ZB)",
  },
  fn: null,
  base: "bit",
},
"Parts Per Converter": {
  id: "pp",
  units: {
    "%": 1 / 100,        // percent
    ppm: 1 / 1e6,        // parts per million
    ppb: 1 / 1e9,        // parts per billion
    ppt: 1 / 1e12,       // parts per trillion
    ppq: 1 / 1e15,       // parts per quadrillion
  },
  unitNames: {
    "%": "Percent",
    ppm: "Parts Per Million",
    ppb: "Parts Per Billion",
    ppt: "Parts Per Trillion",
    ppq: "Parts Per Quadrillion",
  },
  fn: null, // linear conversion
  base: "%",
},

"Speed Converter": {
  id: "speed",
  // conversion factors = multiplier to convert from unit → base (m/s)
  units: {
    "m/s": 1,                        // meter per second
    "km/h": 0.2777777777777778,      // kilometer per hour
    mph: 0.44704,                    // mile per hour
    knot: 0.5144444444444445,        // nautical mile per hour
    "ft/h": 0.00008466666666666667,  // foot per hour
    "ft/min": 0.00508,               // foot per minute
    "ft/s": 0.3048,                  // foot per second
  },

  // human-readable full names for UI
  unitNames: {
    "m/s": "Meter per second",
    "km/h": "Kilometer per hour",
    mph: "Miles per hour",
    knot: "Knot (nautical mile per hour)",
    "ft/h": "Foot per hour",
    "ft/min": "Foot per minute",
    "ft/s": "Foot per second",
  },

  fn: null, 
  base: "m/s",
},
"Pace Converter": {
  id: "pace",
  // keys: min/km, min/mi, s/m (seconds per meter)
  units: { "min/km": 1, "min/mi": 1, "s/m": 1 },
  // friendly names shown in the select & preview
  unitNames: {
    "min/km": "Minute per kilometer",
    "min/mi": "Minute per mile",
    "s/m": "Second per meter",
  },
  fn: paceConverter(),
  base: "min/km",
},

"Pressure Converter": {
  id: "pressure",

  // Conversion factors to the base unit (Pascal)
  units: {
    Pa: 1,                   // Pascal
    kPa: 1_000,              // Kilopascal
    MPa: 1_000_000,          // Megapascal
    hPa: 100,                // Hectopascal
    bar: 100_000,            // Bar
    torr: 133.3223684211,    // Torr (mmHg)
    psi: 6894.757293168,     // Pound per square inch
    ksi: 6_894_757.293168,   // Kilopound per square inch
  },

  // Human readable names for UI dropdown & preview
  unitNames: {
    Pa: "Pascal",
    kPa: "Kilopascal",
    MPa: "Megapascal",
    hPa: "Hectopascal",
    bar: "Bar",
    torr: "Torr (mmHg)",
    psi: "Pound per Square Inch",
    ksi: "Kilopound per Square Inch",
  },

  fn: null,  // Linear converter
  base: "Pa",
},
"Current Converter": {
  id: "current",
  // factors are multipliers to convert unit -> base (Amperes)
  units: {
    A: 1,           // Ampere
    kA: 1000,       // Kiloampere
    mA: 0.001,      // Milliampere
    "µA": 1e-6,     // Microampere (mu symbol)
  },
  // optional full names for UI (used in selects and preview)
  unitNames: {
    A: "Ampere",
    kA: "Kiloampere",
    mA: "Milliampere",
    "µA": "Microampere",
  },
  fn: null,
  base: "A",
},

"Voltage Converter": {
  id: "voltage",

  // unit → base conversion (base = volt)
  units: {
    V: 1,        // Volt
    mV: 0.001,   // Millivolt
    kV: 1000,    // Kilovolt
  },

  // Human-readable names used in dropdowns and preview cards
  unitNames: {
    V: "Volt",
    mV: "Millivolt",
    kV: "Kilovolt",
  },

  fn: null,  // linear conversion
  base: "V", // base unit = Volt
},

"Power Converter": {
  id: "power",
  units: {
    W: 1,                 // watt
    kW: 1_000,            // kilowatt
    MW: 1_000_000,        // megawatt
    GW: 1_000_000_000,    // gigawatt
    hp: 745.69987158227,  // horsepower (mechanical)
  },
  unitNames: {
    W: "Watt",
    kW: "Kilowatt",
    MW: "Megawatt",
    GW: "Gigawatt",
    hp: "Horsepower",
  },
  fn: null,
  base: "W",
},

"Reactive Power Converter": {
  id: "reactive_power",
  // factors are multiples of 1 VAR (volt-ampere reactive)
  units: {
    "mVAR": 1e-3,     // millivolt-ampere reactive
    "VAR": 1,         // volt-ampere reactive (base)
    "kVAR": 1e3,      // kilovolt-ampere reactive
    "MVAR": 1e6,      // megavolt-ampere reactive
    "GVAR": 1e9       // gigavolt-ampere reactive
  },
  unitNames: {
    "mVAR": "Millivolt-ampere reactive",
    "VAR": "Volt-ampere reactive",
    "kVAR": "Kilovolt-ampere reactive",
    "MVAR": "Megavolt-ampere reactive",
    "GVAR": "Gigavolt-ampere reactive"
  },
  fn: null,
  base: "VAR"
},

"Apparent Power Converter": {
  id: "apparent_power",
  // base unit: VA (volt-ampere)
  units: {
    VA: 1,
    mVA: 1e-3,     // milli volt-ampere
    kVA: 1e3,      // kilo volt-ampere
    MVA: 1e6,      // mega volt-ampere
    GVA: 1e9,      // giga volt-ampere
  },
  unitNames: {
    VA: "Volt-ampere",
    mVA: "Milli volt-ampere",
    kVA: "Kilo volt-ampere",
    MVA: "Mega volt-ampere",
    GVA: "Giga volt-ampere",
  },
  fn: null,
  base: "VA",
},
"Energy Converter": {
  id: "energy",
  // base unit: Joule (J)
  units: {
    J: 1,                    // Joule
    kJ: 1e3,                 // kilojoule
    Wh: 3600,                // watt-hour = 3600 J
    mWh: 3.6,                // milliwatt-hour = 0.001 * 3600 = 3.6 J
    kWh: 3.6e6,              // kilowatt-hour = 1000 * 3600
    MWh: 3.6e9,              // megawatt-hour
    GWh: 3.6e12,             // gigawatt-hour
  },
  unitNames: {
    J: "Joule",
    kJ: "Kilojoule",
    Wh: "Watt-hour",
    mWh: "Milliwatt-hour",
    kWh: "Kilowatt-hour",
    MWh: "Megawatt-hour",
    GWh: "Gigawatt-hour",
  },
  fn: null,
  base: "J",
},

"Reactive Energy Converter": {
  id: "reactive_energy",
  // base unit: VARh (volt-ampere reactive hour)
  units: {
    VARh: 1,       // Volt-Ampere Reactive hour
    mVARh: 1e-3,   // milli VARh
    kVARh: 1e3,    // kilo VARh
    MVARh: 1e6,    // mega VARh
    GVARh: 1e9,    // giga VARh
  },
  unitNames: {
    VARh: "Volt-Ampere Reactive-hour",
    mVARh: "Milli VAR-hour",
    kVARh: "Kilo VAR-hour",
    MVARh: "Mega VAR-hour",
    GVARh: "Giga VAR-hour",
  },
  fn: null,
  base: "VARh",
},

"Volumetric Flow Rate Converter": {
  id: "flow",
  units: {
    "km³/s": 1e9,           // cubic kilometers per second
    "m³/s": 1,              // cubic meters per second
    "dm³/s": 0.001,         // cubic decimeters per second = liter
    "cm³/s": 1e-6,          // cubic centimeters per second
    "mm³/s": 1e-9,          // cubic millimeters per second
    "in³/s": 0.000016387064, // cubic inches per second
    "ft³/s": 0.028316846592, // cubic feet per second
    "gal_US/s": 0.003785411784, // US liquid gallons per second
    "gal_Imp/s": 0.00454609,    // Imperial gallons per second
    "L/s": 0.001,            // liters per second
    "mi³/s": 4.168e9,        // cubic miles per second (approx in m³)
    "acre-ft/s": 1233.48,    // acre-feet per second
    "bushel_US/s": 0.03523907,
    "bushel_Imp/s": 0.03636872,
    "km³/min": 1e9 / 60,
    "m³/min": 1 / 60,
    "dm³/min": 0.001 / 60,
    "cm³/min": 1e-6 / 60,
    "mm³/min": 1e-9 / 60,
    "in³/min": 0.000016387064 / 60,
    "ft³/min": 0.028316846592 / 60,
    "gal_US/min": 0.003785411784 / 60,
    "gal_Imp/min": 0.00454609 / 60,
    "L/min": 0.001 / 60,
    "mi³/min": 4.168e9 / 60,
    "acre-ft/min": 1233.48 / 60,
    "bushel_US/min": 0.03523907 / 60,
    "bushel_Imp/min": 0.03636872 / 60,
  },
  unitNames: {
    "km³/s": "Cubic kilometers per second",
    "m³/s": "Cubic meters per second",
    "dm³/s": "Cubic decimeters per second",
    "cm³/s": "Cubic centimeters per second",
    "mm³/s": "Cubic millimeters per second",
    "in³/s": "Cubic inches per second",
    "ft³/s": "Cubic feet per second",
    "gal_US/s": "Gallons per second (US)",
    "gal_Imp/s": "Gallons per second (Imperial)",
    "L/s": "Liters per second",
    "mi³/s": "Cubic miles per second",
    "acre-ft/s": "Acre-feet per second",
    "bushel_US/s": "Bushels per second (US)",
    "bushel_Imp/s": "Bushels per second (Imperial)",
    "km³/min": "Cubic kilometers per minute",
    "m³/min": "Cubic meters per minute",
    "dm³/min": "Cubic decimeters per minute",
    "cm³/min": "Cubic centimeters per minute",
    "mm³/min": "Cubic millimeters per minute",
    "in³/min": "Cubic inches per minute",
    "ft³/min": "Cubic feet per minute",
    "gal_US/min": "Gallons per minute (US)",
    "gal_Imp/min": "Gallons per minute (Imperial)",
    "L/min": "Liters per minute",
    "mi³/min": "Cubic miles per minute",
    "acre-ft/min": "Acre-feet per minute",
    "bushel_US/min": "Bushels per minute (US)",
    "bushel_Imp/min": "Bushels per minute (Imperial)",
  },
  fn: null, // linear function will be attached automatically
  base: "m³/s",
},

"Illuminance Converter": {
  id: "illuminance",
  // factor-to-base = multiply unit value to get lux
  units: {
    "µlx": 1e-6,           // microlux
    "mlx": 1e-3,           // millilux
    lx: 1,                 // lux
    "klx": 1000,           // kilolux
    "lm/m²": 1,            // lumen per square meter (alias to lux)
    "lm/cm²": 10000,       // lumen per square centimeter = 10^4 lux
    fc: 10.76391041671,    // foot-candle
    ph: 10000,             // phot = 10,000 lux
    nox: 1,                // nox = 1 lux
  },
  unitNames: {
    "µlx": "Microlux",
    "mlx": "Millilux",
    lx: "Lux",
    "klx": "Kilolux",
    "lm/m²": "Lumen per square meter",
    "lm/cm²": "Lumen per square centimeter",
    fc: "Foot-candle",
    ph: "Phot",
    nox: "Nox",
  },
  fn: null,   // linear function will be attached automatically elsewhere
  base: "lx",
},

"Frequency Converter": {
  id: "frequency",
  units: {
    mHz: 0.001,
    Hz: 1,
    kHz: 1000,
    MHz: 1e6,
    GHz: 1e9,
    THz: 1e12,
    rpm: 1 / 60, // rotations per minute -> Hz
    "deg/s": 1 / 360, // degrees per second -> Hz
    "rad/s": 1 / (2 * Math.PI), // radians per second -> Hz
  },
  unitNames: {
    mHz: "Millihertz",
    Hz: "Hertz",
    kHz: "Kilohertz",
    MHz: "Megahertz",
    GHz: "Gigahertz",
    THz: "Terahertz",
    rpm: "Rotation per minute",
    "deg/s": "Degree per second",
    "rad/s": "Radian per second",
  },
  fn: null,
  base: "Hz",
},
"Angle Converter": {
  id: "angle",
  units: {
    rad: 1,
    deg: Math.PI / 180,
    min: Math.PI / (180 * 60),
    sec: Math.PI / (180 * 3600),
    sign: Math.PI / 30,       // 1/12 of full circle
    octant: Math.PI / 4,      // 1/8
    sextant: Math.PI / 3,     // 1/6
    quadrant: Math.PI / 2,    // 1/4
    rev: 2 * Math.PI,         // 1 revolution
    gon: Math.PI / 200,       // 1 grad
    mil: 2 * Math.PI / 6400,  // NATO mil
  },
  unitNames: {
    rad: "Radian",
    deg: "Degree",
    min: "Arc Minute",
    sec: "Arc Second",
    sign: "Sign",
    octant: "Octant",
    sextant: "Sextant",
    quadrant: "Quadrant",
    rev: "Revolution",
    gon: "Gon",
    mil: "Mil",
  },
  fn: null,
  base: "rad",
},

"Currency Converter": {
  id: "currency",
  units: {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    INR: 83.5,
    AUD: 1.45,
    CAD: 1.36,
    JPY: 154,
    BGN: 1.8,
    BRL: 5.2,
    CHF: 0.91,
    CNY: 6.95,
    CZK: 22.0,
    DKK: 6.85,
    HKD: 7.85,
    HRK: 7.0,
    HUF: 385.0,
    IDR: 15600,
    ILS: 3.6,
    KRW: 1350,
    LTL: 3.2,
    LVL: 0.62,
    MXN: 17.1,
    MYR: 4.7,
    NOK: 10.3,
    NZD: 1.55,
    PHP: 55.0,
    PLN: 4.3,
    RON: 4.5,
    RUB: 77.0,
    SEK: 10.8,
    SGD: 1.35,
    THB: 36.5,
    TRY: 27.5,
    ZAR: 18.2,
  },
  unitNames: {
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "Pound Sterling",
    INR: "Indian Rupee",
    AUD: "Australian Dollar",
    CAD: "Canadian Dollar",
    JPY: "Japanese Yen",
    BGN: "Bulgarian Lev",
    BRL: "Brazilian Real",
    CHF: "Swiss Franc",
    CNY: "Chinese Yuan Renminbi",
    CZK: "Czech Koruna",
    DKK: "Danish Krone",
    HKD: "Hong Kong Dollar",
    HRK: "Croatian Kuna",
    HUF: "Hungarian Forint",
    IDR: "Indonesian Rupiah",
    ILS: "Israeli Shekel",
    KRW: "South Korean Won",
    LTL: "Lithuanian Litas",
    LVL: "Latvian Lats",
    MXN: "Mexican Peso",
    MYR: "Malaysian Ringgit",
    NOK: "Norwegian Krone",
    NZD: "New Zealand Dollar",
    PHP: "Philippine Peso",
    PLN: "Polish Zloty",
    RON: "Romanian Leu",
    RUB: "Russian Rouble",
    SEK: "Swedish Krona",
    SGD: "Singapore Dollar",
    THB: "Thai Baht",
    TRY: "Turkish Lira",
    ZAR: "South African Rand",
  },
  fn: null,
  base: "USD",
},

"Torque Converter": {
  id: "torque",
  units: {
    "dy·cm": 1e-7,         // dyne-centimeter
    "kgf·m": 9.80665,      // kilogram-force meter
    "N·m": 1,              // newton-meter
    "lbf·ft": 1.3558179483314004, // pound-force foot
    "lbf·in": 0.1129848290276167, // pound-force inch
  },
  unitNames: {
    "dy·cm": "Dyne-centimeter",
    "kgf·m": "Kilogram-force meter",
    "N·m": "Newton-meter",
    "lbf·ft": "Pound-force foot",
    "lbf·in": "Pound-force inch",
  },
  fn: null, // linear
  base: "N·m",
},
"Charge Converter": {
  id: "charge",
  units: {
    C: 1,               // coulomb
    MC: 1e6,            // megacoulomb
    kC: 1e3,            // kilocoulomb
    mC: 1e-3,           // millicoulomb
    "µC": 1e-6,         // microcoulomb
    nC: 1e-9,           // nanocoulomb
    pC: 1e-12,          // picocoulomb
    abC: 10,            // abcoulomb (1 abC = 10 C)
    EMU: 10,            // EMU of charge (same as abC)
    stC: 3.33564e-10,   // statcoulomb
    ESU: 3.33564e-10,   // ESU of charge
    Fr: 3.33564e-10,    // franklin
    "A*h": 3600,        // ampere-hour
    "A*min": 60,        // ampere-minute
    "A*s": 1,           // ampere-second
    Faraday: 96485.33212, // Faraday (C) based on carbon-12
    e: 1.602176634e-19, // elementary charge
  },
  unitNames: {
    C: "Coulomb",
    MC: "Megacoulomb",
    kC: "Kilocoulomb",
    mC: "Millicoulomb",
    "µC": "Microcoulomb",
    nC: "Nanocoulomb",
    pC: "Picocoulomb",
    abC: "Abcoulomb",
    EMU: "EMU of charge",
    stC: "Statcoulomb",
    ESU: "ESU of charge",
    Fr: "Franklin",
    "A*h": "Ampere-hour",
    "A*min": "Ampere-minute",
    "A*s": "Ampere-second",
    Faraday: "Faraday",
    e: "Elementary charge",
  },
  fn: null, // linear
  base: "C",
},


  "Number to Roman Numerals": {
    id: "num2roman",
    units: null,
    fn: null,
  },

  "Roman Numerals to Number": {
    id: "roman2num",
    units: null,
    fn: null,
  },
};

/* attach linear functions where fn is null and units exist */
Object.entries(CONVERTERS).forEach(([k, def]) => {
  if (def.units && !def.fn && def.id !== "pace") {
    def.fn = linearConverter(def.units, def.base);
  }
});

/* ==========================
   Component
   ========================== */

export default function UnitMeasurementTools() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const converterKeys = Object.keys(CONVERTERS);
  const defaultTool = "Length Converter";

  const [copied, setCopied] = React.useState(false);



  const [selectedTool, setSelectedTool] = useState(() => {
    const q = searchParams.get("tool");
    return q && converterKeys.includes(q) ? q : defaultTool;
  });

  const [inputValue, setInputValue] = useState(() => {
    const v = searchParams.get("value");
    return v != null ? v : "";
  });

  // from unit & to unit (if applicable)
  const currentDef = useMemo(() => CONVERTERS[selectedTool], [selectedTool]);

  const defaultFrom = useMemo(() => {
    if (!currentDef) return "";
    if (currentDef.units) return Object.keys(currentDef.units)[0];
    return "";
  }, [currentDef]);

  const [fromUnit, setFromUnit] = useState(() => {
    const u = searchParams.get("from");
    if (u) return u;
    return defaultFrom;
  });

  const [toUnit, setToUnit] = useState(() => {
    const u = searchParams.get("to");
    return u || "";
  });

  // currency rates editable
  const [currencyRates, setCurrencyRates] = useState(() => {
    const rates = CONVERTERS["Currency Converter"].units;
    // attempt to read from URL param 'rates' as JSON (optional)
    const rParam = searchParams.get("rates");
    if (rParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(rParam));
        return { ...rates, ...parsed };
      } catch {
        return { ...rates };
      }
    }
    return { ...rates };
  });

  // history (recent conversions)
  const [history, setHistory] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const resultRef = useRef(null);

  // ensure fromUnit exists for the selected tool
  useEffect(() => {
    const def = CONVERTERS[selectedTool];
    if (def?.units) {
      const units = Object.keys(def.units);
      if (!units.includes(fromUnit)) {
        setFromUnit(units[0]);
      }
      if (!toUnit || !units.includes(toUnit)) {
        setToUnit(units[1] || units[0]);
      }
    } else {
      setFromUnit("");
      setToUnit("");
    }
    // push tool to URL
    try {
      const p = new URLSearchParams(window.location.search);
      p.set("tool", selectedTool);
      setSearchParams(p);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool]);

  // sync input/value/from unit into URL query
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (inputValue === "" || inputValue == null) p.delete("value");
      else p.set("value", inputValue);
      if (fromUnit) p.set("from", fromUnit);
      if (toUnit) p.set("to", toUnit);
      setSearchParams(p);
    } catch {}
  }, [inputValue, fromUnit, toUnit, setSearchParams]);

  // compute results map
  const computeResults = useCallback(
    (toolKey, value, from) => {
      const def = CONVERTERS[toolKey];
      if (!def) return {};
      if (toolKey === "Number to Roman Numerals") {
        if (value === "" || value == null) return { roman: "" };
        const n = Number(value);
        return { roman: numberToRoman(n) };
      }
      if (toolKey === "Roman Numerals to Number") {
        if (!value) return { number: "" };
        return { number: romanToNumber(value) };
      }
      if (toolKey === "Pace Converter" || def.id === "pace") {
        // handled by paceConverter
        return def.fn(value, from || Object.keys(def.units)[0]);
      }
      if (toolKey === "Temperature Converter" || def.id === "temperature") {
        return def.fn(value, from || "C");
      }
      if (toolKey === "Currency Converter") {
        // value is in from currency, convert to all using currencyRates
        const rates = currencyRates;
        const res = {};
        if (value === "" || value == null) {
          Object.keys(rates).forEach((u) => (res[u] = ""));
          return res;
        }
        const v = Number(value);
        if (Number.isNaN(v)) {
          Object.keys(rates).forEach((u) => (res[u] = "NaN"));
          return res;
        }
        // convert to USD first (base is USD)
        const fromRate = rates[from] ?? 1;
        // interpret rates as 1 USD = X foreign? earlier I stored as factor relative to USD: unit value = USD * rate
        // To convert from 'from' to USD: usd = value / rate_from
        const usd = v / fromRate;
        Object.entries(rates).forEach(([u, r]) => {
          res[u] = usd * r;
        });
        return res;
      }
      if (def.fn) {
        return def.fn(value, from || Object.keys(def.units)[0]);
      }
      return {};
    },
    [currencyRates]
  );

  const results = useMemo(() => computeResults(selectedTool, inputValue, fromUnit), [
    selectedTool,
    inputValue,
    fromUnit,
    computeResults,
  ]);

  // convenience: also compute pace->speed for showing remaining
  const paceSpeedMap = useMemo(() => {
    if (selectedTool === "Pace Converter") {
      const paceVal = results["min/km"] ?? inputValue;
      return paceToSpeedMap(paceVal);
    }
    return {};
  }, [selectedTool, results, inputValue]);

  // copy result
  const handleCopy = useCallback(
    (text) => {
      try {
        navigator.clipboard.writeText(String(text || ""));
        showToast("success","Copied");
      } catch {
        showToast("fail","Copy failed");
      }
    },
    []
  );

    const handleClick = () => {
    handleCopy(fmt(val))             // your custom copy logic
    setCopied(true);       // show tick

    setTimeout(() => {
      setCopied(false);    // reset after 1.4 sec
    }, 1400);
  };

  // swap units
  const swapUnits = useCallback(() => {
    setFromUnit((prev) => {
      const old = prev;
      setToUnit(old);
      return toUnit || old;
    });
  }, [toUnit]);

  // run conversion and add to history on demand
  const runAndStore = useCallback(() => {
    const snapshot = {
      tool: selectedTool,
      value: inputValue,
      from: fromUnit,
      timestamp: Date.now(),
      resultPreview: results,
    };
    setHistory((h) => [snapshot, ...h].slice(0, 30));
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
  }, [selectedTool, inputValue, fromUnit, results]);

  // ______________________________________________________________________
  // Render helpers
  // ______________________________________________________________________

const UnitsSelector = ({ def, value, onChange }) => {
  if (!def?.units) return null;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full cursor-pointer">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="h-50 overflow-y-auto no-scrollbar">
        {Object.keys(def.units).map((u) => (
          <SelectItem className="cursor-pointer" key={u} value={u}>
            <div className="flex flex-col">
              
              {def.unitNames?.[u] ? (
                <span className="text-xs opacity-70">{def.unitNames[u]}</span>
              ) : null}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};


// modern / futuristic ResultsGrid
const ResultsGrid = ({ def, results }) => {
  if (!def) return null;

  // special cases
  if (selectedTool === "Number to Roman Numerals") {
    return (
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Roman Numeral</div>
        <div className="rounded-xl p-4 bg-gradient-to-tr from-emerald-50/40 to-zinc-50/10 dark:from-emerald-900/30 dark:to-zinc-900/10 border border-transparent">
          <div className="rounded-lg px-4 py-6 bg-white/70 dark:bg-zinc-900/60 shadow-sm text-center text-2xl font-semibold">{results.roman || "—"}</div>
        </div>
      </div>
    );
  }

  if (selectedTool === "Roman Numerals to Number") {
    return (
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Number</div>
        <div className="rounded-xl p-4 bg-gradient-to-tr from-amber-50/40 to-rose-50/10 dark:from-amber-900/30 dark:to-rose-900/10 border border-transparent">
          <div className="rounded-lg px-4 py-6 bg-white/70 dark:bg-zinc-900/60 shadow-sm text-center text-2xl font-semibold">{results.number ?? "—"}</div>
        </div>
      </div>
    );
  }

  if (!def.units) {
    return <div className="text-sm opacity-70">No units defined for this tool.</div>;
  }

  // grid layout with futuristic card styling
  return (
    <div className="grid grid-cols-1 gap-2">
      {Object.keys(def.units).map((u) => {
        const val = results?.[u];
        const fromFull = def.unitNames?.[fromUnit] || fromUnit || fromUnit;
        const toFull = def.unitNames?.[u] || u;
        const label = `${fromFull} → ${toFull}`;

        return (
          <motion.div
            key={u}
           
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative rounded-2xl"
          >
            {/* gradient border */}
            <div className="rounded-2xl cursor-pointer hover:bg-zinc-600/30  bg-gradient-to-r from-zinc-500/30 via-zinc-400/20 to-emerald-400/15 dark:from-zinc-400/15 dark:via-zinc-700/10 dark:to-emerald-700/10">
              {/* inner glass card */}
              <div className="rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm p-4 flex sm:flex-row flex-col items-start  justify-between gap-4 shadow-md">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-3">
                    <div className="text-lg font-semibold">{u}</div>
                    {def.unitNames?.[u] && <div className="text-xs opacity-70">{def.unitNames[u]}</div>}
                  </div>
                  <Badge className="text-xs backdrop-blur-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300  mt-2">{label}</Badge>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="font-mono font-semibold text-right text-lg">{fmt(val)}</div>
       
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};


  // center preview: show remaining values and highlight selected toUnit if provided
  const CenterPreview = () => {
    const def = currentDef;
    const val = results?.[toUnit];
    return (
      <div className="space-y-4">
        <Card className="shadow-md dark:bg-black/80 bg-white/80">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{selectedTool}</CardTitle>
            <Badge className="backdrop-blur-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">{def?.units ? "Client-side" : "Utility"}</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1  gap-4">
              {/* Left: input summary */}
<div>
  <div className="text-xs opacity-70 mb-1">Preview</div>

  <div
    className="
      border p-3
      rounded-2xl  hover:bg-zinc-600/30  bg-gradient-to-r from-zinc-200/80 via-zinc-100 to-zinc-100/50 dark:from-zinc-400/15 dark:via-zinc-700/10 dark:to-emerald-700/10
      flex flex-col sm:flex-row
        items-center
      justify-center sm:justify-between gap-3
    "
  >
    {/* Input Badge */}
    <div
      className="
        flex items-center gap-2
  
        px-3 py-1.5
      "
    >
      <span className="text-sm font-semibold">{fmt(inputValue)}</span>
      <span className="text-xs opacity-80">{fromUnit}</span>
    </div>

    {/* → Divider Arrow on mobile */}
    <div className="sm:hidden w-full flex justify-center text-xs opacity-50">
      <ArrowDown/>
    </div>

    {/* Output Preview Box */}
    <Badge
      className="
        flex items-center gap-3
        w-full sm:w-auto
        backdrop-blur-md
        bg-emerald-500/10
        border border-emerald-500/20
        text-emerald-700 dark:text-emerald-300
        justify-center sm:justify-end
      "
    >
      <div className="flex items-center gap-1 text-right">
        <span className="text-sm font-semibold ">
          {fmt(val)}
        </span>
        <span className="text-xs opacity-70">{toUnit}</span>
      </div>
    </Badge>
  </div>
</div>


              {/* Middle: full results */}
              <div className="md:col-span-2">
                <div className="text-xs opacity-70">All conversions</div>
                <div className="rounded border p-4 mt-2">
                  <ResultsGrid def={def} results={results} />
                </div>

                {/* If pace -> show speed equivalents */}
                {selectedTool === "Pace Converter" && Object.keys(paceSpeedMap).length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs opacity-70">Equivalent speeds</div>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {Object.entries(paceSpeedMap).map(([k, v]) => (
                        <div key={k} className="rounded border p-3 bg-white/60 dark:bg-zinc-900/60">
                          <div className="text-xs opacity-70">{k}</div>
                          <div className="font-mono font-semibold mt-1">{fmt(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Currency editor */}
                {selectedTool === "Currency Converter" && (
                  <div className="mt-4">
                    <div className="text-xs opacity-70">Edit sample currency rates (relative to USD)</div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.keys(currencyRates).map((u) => (
                        <div key={u} className="flex items-center gap-2">
                          <div className="text-xs w-14">{u}</div>
                          <Input value={currencyRates[u]} onChange={(e) => setCurrencyRates((s) => ({ ...s, [u]: Number(e.target.value) || 0 }))} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs opacity-70">These are sample rates stored in client memory — use a live rates API in production.</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>


      </div>
    );
  };

  /* ==========================
     Page Render
     ========================== */

  return (
    <div className="min-h-screen max-w-8xl overflow-hidden mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">
           Unit Measurement Tools
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Length • Area • Weight • Volume • Temperature • and many more</p>
          </div>

        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* left controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Controls</span>
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">Converters</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Pick converter</Label>
                <Select value={selectedTool} onValueChange={(v) => setSelectedTool(v)}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="h-60">
                    {converterKeys.map((k) => (
                      <SelectItem className="cursor-pointer" key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Separator />

                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter value to convert"
                    className="mt-1"
                  />
                </div>

                {currentDef?.units && (
                  <>
                    <div>
                      <Label className="text-xs">From unit</Label>
                      <UnitsSelector def={currentDef} value={fromUnit} onChange={setFromUnit} />
                    </div>

                    <div>
                      <Label className="text-xs">Focus unit (optional)</Label>
                      <UnitsSelector def={currentDef} value={toUnit} onChange={setToUnit} />
                    </div>

                  </>
                )}

                {/* special controls */}
                {selectedTool === "Number to Roman Numerals" && (
                  <div className="text-xs opacity-70">Enter an integer between 1 and 3999</div>
                )}
                {selectedTool === "Roman Numerals to Number" && (
                  <div className="text-xs opacity-70">Enter a roman numeral (I, IV, X, ...)</div>
                )}

                <Separator />

                <div className="text-xs opacity-70">Tip: Results update instantly as you type</div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* center preview */}
        <main className="lg:col-span-6">
          <CenterPreview />
        </main>

        {/* right debug */}
        <aside className="lg:col-span-3">
          <div className="space-y-4 ">
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="opacity-70">Selected</span>
                    <span className="font-medium">{selectedTool}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="opacity-70">From unit</span>
                    <span className="font-medium">{fromUnit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="opacity-70">Input value</span>
                    <span className="font-medium">{fmt(inputValue)}</span>
                  </div>
                  <Separator />
                  <div className="text-xs opacity-70">
                    This page performs conversions locally in the browser. For currency conversions you can edit the sample rates above. For production integrate a live FX API.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => handleCopy(JSON.stringify(results, null, 2))}>
                    Copy all results
                  </Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => {
                    // download results
                    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `conversion-${selectedTool.replace(/\s+/g, "-")}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>
                    <Download className="w-4 h-4 mr-2" /> Export JSON
                  </Button>
               
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Unit Measurement Tools — Notes</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              This page runs client-side conversions for a broad set of units. It mirrors the visual design and theme used in your AIToolsPage. Currency rates are sample values editable in the UI.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button className="cursor-pointer" onClick={() => setDialogOpen(false)}>Close</Button>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}
