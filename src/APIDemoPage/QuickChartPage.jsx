// src/pages/QuickChartPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ImageIcon,
  ExternalLink,
  Download,
  Loader2,
  Code,
  Copy as CopyIcon,
  BarChart2,
  Palette,
  Settings,
  FileText,
  Zap,
  X,
  Menu,
  RefreshCcw,
  Check,
  Grid,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

/* ---------- QuickChart endpoint ---------- */
const QUICKCHART_ENDPOINT = "https://quickchart.io/chart";





/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}
function pickRandom(arr) {
 
  return arr;
}

/* ---------- Component ---------- */
export default function QuickChartPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

 function getGradientFillHelper(direction = "horizontal", colors = []) {
  return function gradientFill(context) {
    const chart = context.chart;
    const { ctx, chartArea } = chart;

    // Chart not fully initialized
    if (!chartArea) return null;

    const { left, right, top, bottom } = chartArea;

    // Horizontal gradient (left → right)
    let gradient;

    if (direction === "horizontal") {
      gradient = ctx.createLinearGradient(left, 0, right, 0);

    // Vertical gradient (top → bottom)
    } else if (direction === "vertical") {
      gradient = ctx.createLinearGradient(0, top, 0, bottom);

    // Diagonal gradient (top-left → bottom-right)
    } else if (direction === "diagonal") {
      gradient = ctx.createLinearGradient(left, top, right, bottom);

    } else {
      // Fallback: horizontal
      gradient = ctx.createLinearGradient(left, 0, right, 0);
    }

    // Evenly distribute color stops
    const step = 1 / (colors.length - 1);

    colors.forEach((color, index) => {
      gradient.addColorStop(index * step, color);
    });

    return gradient;
  };
}


    /* ---------- PRESETS (examples; replace/add your full 50+ list) ---------- */
  const PRESETS = [
{
    id: "default-bar",
    name: "Default Bar",
    description: "Simple bar chart (Votes)",
    tags: ["bar", "category"],
    color: "amber",
    config: {
      type: "bar",
      data: { labels: ["Red", "Blue", "Yellow", "Green", "Purple"], datasets: [{ label: "Votes", data: [12, 19, 3, 5, 2] }] },
      options: { plugins: { legend: { display: true } }, responsive: true, maintainAspectRatio: false }
    },
    width: 900,
    height: 420,
    format: "png",
  },
  {
    id: "line-sales",
    name: "Sales Line",
    description: "Monthly sales trend",
    tags: ["line", "trend"],
    color: "blue",
    config: {
      type: "line",
      data: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], datasets: [{ label: "Revenue", data: [1200, 1900, 3000, 5000, 2300, 4200], fill: false }] },
      options: { plugins: { legend: { display: true } }, responsive: true }
    },
    width: 1200,
    height: 640,
    format: "png",
  },
  {
    id: "pie-market",
    name: "Market Share Pie",
    description: "Market share example",
    tags: ["pie", "donut"],
    color: "violet",
    config: {
      type: "pie",
      data: { labels: ["Chrome", "Safari", "Firefox", "Edge"], datasets: [{ data: [62, 19, 10, 9] }] },
      options: { plugins: { legend: { position: "right" } } }
    },
    width: 1000,
    height: 520,
    format: "png",
  },
  {
    id: "line-legend-left",
    name: "Line - Legend Left",
    description: "Legend at the left",
    tags: ["line", "layout"],
    color: "teal",
    config: {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        datasets: [{ label: "Dataset", data: [92, 32, 74, -98, 84, 45, -21], borderWidth: 1 }]
      },
      options: { plugins: { legend: { position: "left" }, title: { display: true, text: "Legend Position: left" } }, responsive: true }
    },
    width: 1000,
    height: 520,
    format: "png",
  },
  {
  id: "bar-basic",
  name: "Bar - Basic",
  description: "Basic bar chart with two datasets",
  tags: ["bar", "multi-dataset"],
  color: "rose",

  config: {
    type: "bar",
    data: {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "Dataset 1",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          borderWidth: 1,
          data: [-31, -70, -30, -33, -9, 14, -41],
        },
        {
          label: "Dataset 2",
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgb(54, 162, 235)",
          borderWidth: 1,
          data: [73, 41, 29, 61, -65, 59, 38],
        },
      ],
    },

    options: {
      plugins: {
        title: {
          display: true,
          text: "Bar Chart",
        },
        datalabels: {
          anchor: "center",
          align: "center",
          color: "#666",
          font: {
            weight: "normal",
          },
        },
      },
      responsive: true,
    },
  },

  width: 1000,
  height: 520,
  format: "png",
}
,
{
  id: "horizontal-bar-default",
  name: "Horizontal Bar - Default",
  description: "Standard horizontal bar chart",
  tags: ["bar", "horizontal", "layout"],
  color: "rose",

  config: {
    type: "horizontalBar",

    data: {
      labels: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July"
      ],

      datasets: [
        {
          label: "Dataset 1",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          borderWidth: 1,
          data: [-32, 62, 64, 41, -31, -32, 87]
        },
        {
          label: "Dataset 2",
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgb(54, 162, 235)",
          data: [9, -100, -13, 64, -57, 26, 20]
        }
      ]
    },

    options: {
      elements: {
        rectangle: { borderWidth: 2 }
      },
      responsive: true,

      plugins: {
        legend: { position: "right" },
        title: {
          display: true,
          text: "Chart.js Horizontal Bar Chart"
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}

,
{
  id: "bar-stacked-1",
  name: "Bar - Stacked 1",
  description: "Stacked bar chart with multiple datasets",
  tags: ["bar", "stacked", "layout"],
  color: "purple",
  config: {
    type: "bar",
    data: {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "Dataset 1",
          backgroundColor: "rgb(255, 99, 132)",
          data: [52, -93, -25, -67, 51, -97, 9],
        },
        {
          label: "Dataset 2",
          backgroundColor: "rgb(54, 162, 235)",
          data: [17, 13, -38, 89, -10, 75, -52],
        },
        {
          label: "Dataset 3",
          backgroundColor: "rgb(75, 192, 192)",
          data: [-84, 33, 80, 75, -83, -34, -50],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: "Chart.js Bar Chart - Stacked",
      },
      scales: {
        xAxes: [
          {
            stacked: true,
          },
        ],
        yAxes: [
          {
            stacked: true,
          },
        ],
      },
      responsive: true,
    },
  },
  width: 1000,
  height: 520,
  format: "png",
}
,
{
  id: "bar-stacked-2",
  name: "Bar - Stacked 2",
  description: "Stacked bar chart with multiple datasets",
  tags: ["bar", "stacked", "layout"],
  color: "blue",
  config: {
    type: "bar",
    data: {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "Dataset 1",
          backgroundColor: "rgb(255, 99, 132)",
          stack: "Stack 0",
          data: [3, -12, -31, 82, -33, 12, -67],
        },
        {
          label: "Dataset 2",
          backgroundColor: "rgb(54, 162, 235)",
          stack: "Stack 0",
          data: [79, 83, 39, 7, 65, 83, 34],
        },
        {
          label: "Dataset 3",
          backgroundColor: "rgb(75, 192, 192)",
          stack: "Stack 1",
          data: [40, -51, 45, 93, -80, -79, -93],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: "Chart.js Bar Chart - Stacked",
      },
      tooltips: {
        mode: "index",
        intersect: false,
      },
      responsive: true,
      scales: {
        xAxes: [
          {
            stacked: true,
          },
        ],
        yAxes: [
          {
            stacked: true,
          },
        ],
      },
    },
  },
  width: 1000,
  height: 520,
  format: "png",
}
,
{
  id: "bar-range-dual",
  name: "Bar - Range Dual Dataset",
  description: "Bar chart with range values (min/max) for two datasets",
  tags: ["bar", "range", "compare"],
  color: "purple",
  config: {
    type: "bar",
    data: {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "Dataset 1",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          borderWidth: 1,
          data: [
            [-66, -49],
            [55, 12],
            [47, -44],
            [-50, 31],
            [-93, 33],
            [-12, -9],
            [-58, -1],
          ],
        },
        {
          label: "Dataset 2",
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgb(54, 162, 235)",
          borderWidth: 1,
          data: [
            [92, -37],
            [-51, 91],
            [-23, -79],
            [74, 69],
            [-2, -77],
            [-79, 63],
            [-79, 18],
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Chart.js Bar Chart",
        },
      },
    },
  },
  width: 1000,
  height: 520,
  format: "png",
}
,
{
  id: "bar-basic-rounded",
  name: "Bar - Rounded Bars",
  description: "Basic bar chart with rounded bars and two datasets",
  tags: ["bar", "rounded", "layout"],
  color: "blue",

  config: {
    type: "bar",
    data: {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "Dataset 1",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          borderWidth: 1,
          data: [-31, -70, -30, -33, -9, 14, -41]
        },
        {
          label: "Dataset 2",
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgb(54, 162, 235)",
          borderWidth: 1,
          data: [73, 41, 29, 61, -65, 59, 38]
        }
      ]
    },

    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top"
        },
        title: {
          display: true,
          text: "Chart.js Bar Chart"
        },
        roundedBars: true
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "bar-hidden-axes",
  name: "Bar - Hidden Axes",
  description: "Bar chart with hidden axes and grid",
  tags: ["bar", "minimal", "layout"],
  color: "purple",

  config: {
    type: "bar",
    data: {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [
        {
          label: 'Dataset 1',
          data: [-31, 70, -30, 33, -9, 14, -41],
        }
      ],
    },

    options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          display: false,
          grid: { display: false }
        },
        y: {
          display: false,
          grid: { display: false }
        },
      },
      responsive: true,
    },
  },

  width: 1000,
  height: 520,
  format: "png",
}
,{
  id: "combo-bar-line",
  name: "Combo Bar + Line",
  description: "Bar chart with overlaid line dataset",
  tags: ["bar", "line", "combo", "mixed"],
  color: "purple",

  config: {
    type: "bar",
    data: {
      labels: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July"
      ],
      datasets: [
        {
          type: "line",
          label: "Dataset 1",
          borderColor: "rgb(54, 162, 235)",
          borderWidth: 2,
          fill: false,
          data: [-33, 26, 29, 89, -41, 70, -84]
        },
        {
          type: "bar",
          label: "Dataset 2",
          backgroundColor: "rgb(255, 99, 132)",
          data: [-42, 73, -69, -94, -81, 18, 87],
          borderColor: "white",
          borderWidth: 2
        },
        {
          type: "bar",
          label: "Dataset 3",
          backgroundColor: "rgb(75, 192, 192)",
          data: [93, 60, -15, 77, -59, 82, -44]
        }
      ]
    },

    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Chart.js Combo Bar Line Chart"
        },
        tooltip: {
          mode: "index",
          intersect: true
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "bar-stacked-total-labels",
  name: "Bar - Stacked Total Labels",
  description: "Stacked bar chart with total labels displayed on top dataset",
  tags: ["bar", "stacked", "datalabels", "totals"],
  color: "purple",

  config: {
    type: "bar",

    data: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        {
          label: "Users",
          data: [50, 60, 70, 180],
          datalabels: {
            display: false // hide labels for this dataset
          },
          backgroundColor: "rgba(75, 192, 192, 0.6)"
        },
        {
          label: "Revenue",
          data: [100, 200, 300, 400],
          datalabels: {
            align: "top",
            anchor: "end",
            color: "#000",
            backgroundColor: "pink",
            borderColor: "#000",
            borderWidth: 1,

            formatter: (value, ctx) => {
              const index = ctx.dataIndex;

              // sum values from ALL datasets for the matching index
              const total = ctx.chart.data.datasets.reduce((acc, ds) => {
                return acc + (ds.data[index] || 0);
              }, 0);

              return total.toLocaleString("en-US");
            },

            display: true
          },
          backgroundColor: "rgba(255, 99, 132, 0.6)"
        }
      ]
    },

    options: {
      plugins: {
        legend: { display: false }
      },

      scales: {
        yAxes: [
          {
            stacked: true,
            ticks: {
              beginAtZero: true,
              max: 800
            }
          }
        ],
        xAxes: [
          {
            stacked: true
          }
        ]
      },

      responsive: true
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "horizontal-bar-currency",
  name: "Horizontal Bar – Currency",
  description: "Horizontal bar chart with datalabels showing $ values",
  tags: ["bar", "horizontal", "layout"],
  color: "gold",

  config: {
    type: "horizontalBar",
    data: {
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      datasets: [
        {
          label: "Values",
          data: [37, 11, 11, 7, 6, 5, 5, 4, 3, 2],
          backgroundColor: "gold",
        },
      ],
    },

    options: {
      scales: {
        xAxes: [
          {
            gridLines: {
              display: true,
              drawOnChartArea: false,
              tickMarkLength: 8,
              zeroLineWidth: 1,
              zeroLineColor: "black",
              color: isDark?"white":"black",
            },
            ticks: {
              fontColor: isDark?"white":"black",
              beginAtZero: true,
            },
          },
        ],
        yAxes: [
          {
            display: true,
            position: "left",
            gridLines: {
              display: true,
              drawOnChartArea: false,
              tickMarkLength: 8,
              color: "black",
            },
            ticks: {
              fontColor: isDark?"white":"black"
            },
          },
        ],
      },

      legend: {
        display: false,
      },

      plugins: {
        datalabels: {
          anchor: "end",
          align: "end",
          color: isDark?"white":"black",
          formatter: function (value) {
            return "$" + value;
          },
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
    },
  },

  width: 1000,
  height: 520,
  format: "png",
}
,
{
  id: "line-multi-basic",
  name: "Line - Multi Dataset",
  description: "Two line datasets with title",
  tags: ["line", "multi", "basic"],
  color: "blue",

  config: {
    type: "line",
    data: {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "My First dataset",
          backgroundColor: "rgb(255, 99, 132)",
          borderColor: "rgb(255, 99, 132)",
          data: [93, -29, -17, -8, 73, 98, 40],
          fill: false
        },
        {
          label: "My Second dataset",
          fill: false,
          backgroundColor: "rgb(54, 162, 235)",
          borderColor: "rgb(54, 162, 235)",
          data: [20, 85, -79, 93, 27, -81, -22]
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "Chart.js Line Chart"
      },
      responsive: true
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "line-multi-axis",
  name: "Line - Multi Axis",
  description: "Two line datasets using separate y-axes",
  tags: ["line", "multi", "axis"],
  color: "purple",

  config: {
    type: "line",
    data: {
      labels: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July"
      ],
      datasets: [
        {
          label: "My First dataset",
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgb(255, 99, 132)",
          fill: false,
          data: [-58, -87, 70, 98, -38, 88, 70],
          yAxisID: "y"
        },
        {
          label: "My Second dataset",
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgb(54, 162, 235)",
          fill: false,
          data: [-79, 43, -57, 75, 20, -3, -95],
          yAxisID: "y1"
        }
      ]
    },

    options: {
      stacked: false,
      title: {
        display: true,
        text: "Chart.js Line Chart - Multi Axis"
      },
      scales: {
        yAxes: [
          {
            id: "y",
            type: "linear",
            display: true,
            position: "left"
          },
          {
            id: "y1",
            type: "linear",
            display: true,
            position: "right",
            gridLines: {
              drawOnChartArea: false
            }
          }
        ]
      },
      responsive: true
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,{
  id: "line-stepped",
  name: "Line - Stepped",
  description: "Stepped line chart",
  tags: ["line", "stepped"],
  color: "orange",

  config: {
    type: "line",
    data: {
      labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"],
      datasets: [
        {
          label: "Data",
          steppedLine: true,
          data: [72, 81, -25, -44, -68, -42],
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgb(255, 99, 132)",
          fill: false
        }
      ]
    },

    options: {
      responsive: true,
      title: {
        display: true,
        text: "Stepped line"
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "line-mixed-styles",
  name: "Line - Mixed Styles",
  description: "Line chart with unfilled, dashed, and filled datasets",
  tags: ["line", "multi-style", "layout"],
  color: "blue",

  config: {
    type: "line",
    data: {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "Unfilled",
          fill: false,
          backgroundColor: "rgb(54, 162, 235)",
          borderColor: "rgb(54, 162, 235)",
          data: [-73, 40, -4, 27, 26, 53, -12]
        },
        {
          label: "Dashed",
          fill: false,
          backgroundColor: "rgb(75, 192, 192)",
          borderColor: "rgb(75, 192, 192)",
          borderDash: [5, 5],
          data: [99, -40, 93, -56, 0, 25, 45]
        },
        {
          label: "Filled",
          backgroundColor: "rgb(255, 99, 132)",
          borderColor: "rgb(255, 99, 132)",
          data: [56, 68, 84, 11, -96, -56, -51],
          fill: true
        }
      ]
    },

    options: {
      title: {
        display: true,
        text: "Chart.js Line Chart"
      },
      scales: {
        xAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Month"
            }
          }
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Value"
            }
          }
        ]
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,{
  id: "line-point-style-circle",
  name: "Line - Point Style Circle",
  description: "Line chart with large circular points and no connecting line",
  tags: ["line", "points", "style"],
  color: "rose",

  config: {
    type: "line",
    data: {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "My First dataset",
          backgroundColor: "rgb(255, 99, 132)",
          borderColor: "rgb(255, 99, 132)",
          data: [10, 23, 5, 99, 67, 43, 0],
          fill: false,
          pointRadius: 10,
          showLine: false
        }
      ]
    },

    options: {
      title: {
        display: true,
        text: "Point Style: circle"
      },
      legend: {
        display: false
      },
      elements: {
        point: {
          pointStyle: "circle"
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,{
  id: "line-point-triangle",
  name: "Line - Triangle Points",
  description: "Line chart using triangle-shaped points with no connecting line",
  tags: ["line", "points", "triangle"],
  color: "rose",

  config: {
    type: "line",
    data: {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "My First dataset",
          backgroundColor: "rgb(255, 99, 132)",
          borderColor: "rgb(255, 99, 132)",
          data: [10, 23, 5, 99, 67, 43, 0],
          fill: false,
          pointRadius: 10,
          pointHoverRadius: 15,
          showLine: false
        }
      ]
    },

    options: {
      responsive: true,
      title: {
        display: true,
        text: "Point Style: triangle"
      },
      legend: {
        display: false
      },
      elements: {
        point: {
          pointStyle: "triangle"
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,{
  id: "line-point-style-star",
  name: "Line - Star Points",
  description: "Line chart with star-shaped points and no connecting line",
  tags: ["line", "points", "style"],
  color: "pink",

  config: {
    type: "line",
    data: {
      labels: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July"
      ],
      datasets: [
        {
          label: "My First dataset",
          backgroundColor: "rgb(255, 99, 132)",
          borderColor: "rgb(255, 99, 132)",
          data: [10, 23, 5, 99, 67, 43, 0],
          fill: false,
          pointRadius: 10,
          pointHoverRadius: 15,
          showLine: false
        }
      ]
    },

    options: {
      responsive: true,
      title: {
        display: true,
        text: "Point Style: star"
      },
      legend: {
        display: false
      },
      elements: {
        point: {
          pointStyle: "star"
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,{
  id: "line-point-sizes",
  name: "Line - Different Point Sizes",
  description: "Line chart with varying point sizes, hover radius, and hit radius",
  tags: ["line", "points", "styling"],
  color: "purple",

  config: {
    type: "line",
    data: {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "dataset - big points",
          data: [-15, -80, 79, -11, -5, 33, -57],
          backgroundColor: "rgb(255, 99, 132)",
          borderColor: "rgb(255, 99, 132)",
          fill: false,
          borderDash: [5, 5],
          pointRadius: 15,
          pointHoverRadius: 10
        },
        {
          label: "dataset - individual point sizes",
          data: [-86, 59, -70, -40, 40, 33, 16],
          backgroundColor: "rgb(54, 162, 235)",
          borderColor: "rgb(54, 162, 235)",
          fill: false,
          borderDash: [5, 5],
          pointRadius: [2, 4, 6, 18, 0, 12, 20]
        },
        {
          label: "dataset - large pointHoverRadius",
          data: [59, -65, -33, 0, -79, 95, -53],
          backgroundColor: "rgb(75, 192, 192)",
          borderColor: "rgb(75, 192, 192)",
          fill: false,
          pointHoverRadius: 30
        },
        {
          label: "dataset - large pointHitRadius",
          data: [73, 83, -19, 74, 16, -12, 8],
          backgroundColor: "rgb(255, 205, 86)",
          borderColor: "rgb(255, 205, 86)",
          fill: false,
          pointHitRadius: 20
        }
      ]
    },

    options: {
      legend: {
        position: "bottom"
      },
      title: {
        display: true,
        text: "Chart.js Line Chart - Different point sizes"
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "sparkline-basic",
  name: "Sparkline - Basic",
  description: "Minimal sparkline chart with a single dataset",
  tags: ["sparkline", "minimal", "line"],
  color: "purple",

  config: {
    type: "sparkline",
    data: {
      datasets: [
        {
          data: [140, 60, 274, 370, 199]
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      elements: {
        line: { borderWidth: 2 },
        point: { radius: 0 }
      }
    }
  },

  width: 400,
  height: 120,
  format: "png"
}
,
{
  id: "line-gap-fill-dashed",
  name: "Line - Gap Fill + Dynamic Dash",
  description: "Line chart with span gaps, dynamic segment dash, and area fill",
  tags: ["line", "advanced", "gaps", "segment"],
  color: "rose",

  config: {
    type: "line",
    data: {
      labels: ["Q1", "Q2", "Q3", "Q4", "Q5"],
      datasets: [
        {
          label: "Users",
          data: [50, 30, null, 70, 180],
          spanGaps: true,
          fill: "-1",
          segment: {
            borderDash: (ctx) =>
              ctx.p0.skip || ctx.p1.skip ? [6, 6] : undefined
          },
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.2)"
        },
        {
          label: "Revenue",
          data: [100, 200, 350, null, 50],
          spanGaps: true,
          lineTension: 0.3,
          fill: "-1",
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgba(54, 162, 235, 0.2)"
        }
      ]
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "scatter-lines-two-datasets",
  name: "Scatter - Dual Line",
  description: "Scatter plot with two datasets, each drawn as a line",
  tags: ["scatter", "line", "xy"],
  color: "purple",

  config: {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Data 1",
          showLine: true,
          lineTension: 0,
          borderWidth: 2,
          borderColor: "blue",
          data: [
            { x: 20, y: 75 },
            { x: 30, y: -53 },
            { x: 40, y: 31 },
            { x: 50, y: 6 }
          ]
        },
        {
          label: "Data 2",
          showLine: true,
          fill: false,
          lineTension: 0,
          borderWidth: 4,
          borderColor: "red",
          data: [
            { x: 20, y: -59 },
            { x: 60, y: -68 },
            { x: 65, y: -43 },
            { x: 75, y: 9 }
          ]
        }
      ]
    },

    options: {
      title: {
        display: true,
        text: "Scatter Line Chart"
      },
      scales: {
        xAxes: [
          {
            type: "linear",
            position: "bottom",
            scaleLabel: {
              display: true,
              labelString: "X Value"
            }
          }
        ],
        yAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: "Y Value"
            }
          }
        ]
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "line-smoothed-data",
  name: "Line - Smoothed Data",
  description: "Line chart comparing raw data with exponential smoothing",
  tags: ["line", "smoothing", "analytics"],
  color: "purple",

  config: {
    type: "line",

    data: {
      labels: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],

      datasets: [
        {
          label: "Smoothed Data",
          data: (function exponentialSmoothing(data, alpha) {
            let smoothedData = [data[0]];
            for (let i = 1; i < data.length; i++) {
              let previousPoint = smoothedData[i - 1];
              let currentPoint = data[i];
              let smoothedPoint =
                alpha * currentPoint + (1 - alpha) * previousPoint;
              smoothedData.push(smoothedPoint);
            }
            return smoothedData;
          })([10, 12, 13, 15, 14, 13, 15, 17, 18, 17], 0.5),
          borderColor: "rgb(153, 102, 255)",
          backgroundColor: "rgba(153,102,255,0.3)",
          fill: true
        },

        {
          label: "Raw Data",
          data: [10, 12, 13, 15, 14, 13, 15, 17, 18, 17],
          borderColor: "rgb(255, 159, 64)",
          backgroundColor: "rgba(255,159,64,0.3)",
          fill: false
        }
      ]
    },

    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Raw vs Smoothed Line Chart"
        },
        legend: {
          position: "top"
        }
      },
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "line-fill-false",
  name: "Line - Fill False",
  description: "Single dataset with fill disabled",
  tags: ["line", "minimal", "no-fill"],
  color: "rose",

  config: {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      datasets: [
        {
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          data: [6.06, 82.2, -22.11, 21.53, -21.47, 73.61, -53.75, -60.32],
          label: "Dataset",
          fill: false
        }
      ]
    },

    options: {
      scales: {
        xAxes: [
          {
            ticks: {
              autoSkip: false,
              maxRotation: 0
            }
          }
        ]
      },
      title: {
        text: "fill: false",
        display: true
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "line-fill-origin",
  name: "Line - Fill Origin",
  description: "Line chart filling from the origin",
  tags: ["line", "fill", "origin"],
  color: "rose",

  config: {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      datasets: [
        {
          label: "Dataset",
          data: [6.06, 82.2, -22.11, 21.53, -21.47, 73.61, -53.75, -60.32],
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          fill: "origin"
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "fill: origin"
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "line-fill-start",
  name: "Line - Fill Start",
  description: "Line chart filling from the starting boundary",
  tags: ["line", "fill", "start"],
  color: "pink",

  config: {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      datasets: [
        {
          label: "Dataset",
          data: [6.06, 82.2, -22.11, 21.53, -21.47, 73.61, -53.75, -60.32],
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          fill: "start"
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "fill: start"
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "line-fill-end",
  name: "Line - Fill End",
  description: "Line chart with fill set to 'end'",
  tags: ["line", "fill"],
  color: "rose",

  config: {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      datasets: [
        {
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          data: [6.06, 82.2, -22.11, 21.53, -21.47, 73.61, -53.75, -60.32],
          label: "Dataset",
          fill: "end"
        }
      ]
    },
    options: {
      scales: {
        xAxes: [
          {
            ticks: {
              autoSkip: false,
              maxRotation: 0
            }
          }
        ]
      },
      title: {
        text: "fill: end",
        display: true
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "line-fill-start-stack",
  name: "Line - Fill Start Stack",
  description: "Multiple datasets with stacked fill and custom fill behavior",
  tags: ["line", "fill", "stacked"],
  color: "green",

  config: {
    type: "line",
    data: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        {
          label: "Revenue",
          data: [10, 10, 10, 10],
          fill: "start",
          borderWidth: 0,
          pointRadius: 0,
          borderColor: "rgba(0, 255, 0, 0.2)",
          backgroundColor: "rgba(0, 255, 0, 0.2)"
        },
        {
          label: "Data",
          data: [
            56.5, 58.5, 52.5, 49.5, 53.5, 49.5, 52, 48.5, 57, 58, 52, 52.5, 50.5,
            51
          ],
          fill: "-1"
        }
      ]
    },

    options: {
      scales: {
        yAxes: [
          {
            stacked: true,
            ticks: {
              min: -10
            }
          }
        ]
      },
      legend: {
        display: false
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "line-custom-target-fill",
  name: "Line - Custom Target Fill",
  description: "Line chart with fill relative to a target value",
  tags: ["line", "fill", "advanced"],
  color: "red",

  config: {
    type: "line",
    data: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        {
          label: "Data",
          data: [6.06, 82.2, -22.11, 21.53],
          lineTension: 0.4,
          borderColor: "#ff3333",
          backgroundColor: "#ffcccc",
          fill: {
            target: {
              value: 30
            },
            above: "transparent",
            below: "#ffcccc"
          }
        }
      ]
    },

    options: {}
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "line-stacked-area",
  name: "Line - Stacked Area",
  description: "Stacked area line chart with four datasets",
  tags: ["line", "stacked", "area", "multi-dataset"],
  color: "purple",

  config: {
    type: "line",
    data: {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "My First dataset",
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, .5)",
          data: [57, 90, 11, -15, 37, -37, -27]
        },
        {
          label: "My Second dataset",
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgba(54, 162, 235, .5)",
          data: [71, -36, -94, 78, 98, 65, -61]
        },
        {
          label: "My Third dataset",
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, .5)",
          data: [48, -64, -61, 98, 0, -39, -70]
        },
        {
          label: "My Fourth dataset",
          borderColor: "rgb(255, 205, 86)",
          backgroundColor: "rgba(255, 205, 86, .5)",
          data: [-58, 88, 29, 44, 3, 78, -9]
        }
      ]
    },

    options: {
      responsive: true,

      title: {
        display: true,
        text: "Chart.js Line Chart - Stacked Area"
      },

      tooltips: {
        mode: "index"
      },

      hover: {
        mode: "index"
      },

      scales: {
        xAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: "Month"
            }
          }
        ],
        yAxes: [
          {
            stacked: true,
            scaleLabel: {
              display: true,
              labelString: "Value"
            }
          }
        ]
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "radar-multi-fill",
  name: "Radar - Multi Fill",
  description: "Radar chart with multiple datasets and mixed fill styles",
  tags: ["radar", "multi-style"],
  color: "purple",

  config: {
    type: "radar",
    data: {
      labels: [
        "January", "February", "March", "April",
        "May", "June", "July", "August"
      ],
      datasets: [
        {
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          data: [15.09, 15.67, 12.5, 12.77, 13.62, 13.68, 13.93, 15.95],
          label: "D0"
        },
        {
          backgroundColor: "rgba(255, 159, 64, 0.5)",
          borderColor: "rgb(255, 159, 64)",
          data: [24.55, 28.91, 21.81, 23.27, 26.98, 26.05, 25.39, 24.92],
          label: "D1",
          fill: "-1"
        },
        {
          backgroundColor: "rgba(255, 205, 86, 0.5)",
          borderColor: "rgb(255, 205, 86)",
          data: [36.35, 43.93, 32.54, 33.54, 42.82, 39.34, 35.84, 33.5],
          label: "D2",
          fill: 1
        },
        {
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgb(75, 192, 192)",
          data: [47.7, 58.92, 44.45, 49.08, 53.39, 51.85, 48.4, 49.36],
          label: "D3",
          fill: false
        },
        {
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgb(54, 162, 235)",
          data: [60.73, 71.97, 53.96, 57.22, 65.09, 62.06, 56.91, 60.52],
          label: "D4",
          fill: "-1"
        },
        {
          backgroundColor: "rgba(153, 102, 255, 0.5)",
          borderColor: "rgb(153, 102, 255)",
          data: [73.33, 80.78, 68.05, 68.59, 76.79, 77.24, 66.08, 72.37],
          label: "D5",
          fill: "-1"
        }
      ]
    },
    options: {
      spanGaps: false,
      elements: {
        line: {
          tension: 0.000001
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,{
  id: "scatter-quadrants",
  name: "Scatter - Quadrants",
  description: "Scatter chart with quadrant annotations and labels",
  tags: ["scatter", "annotation", "quadrant"],
  color: "orange",

  config: {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Data",
          data: [
            { x: -1, y: 10 },
            { x: -15, y: -30 },
            { x: -50, y: 25 },
            { x: -50, y: -75 },
            { x: 50, y: -75 }
          ],
          backgroundColor: "red"
        },
        {
          label: "Multicolor Data",
          data: [
            { x: -10, y: 10 },
            { x: -75, y: -60 },
            { x: -25, y: 25 },
            { x: -25, y: -40 },
            { x: 50, y: 75 }
          ],
          backgroundColor: ["green", "blue", "red", "yellow", "orange"]
        }
      ]
    },

    options: {
      scales: {
        x: {
          min: -100,
          max: 100,
          grid: { drawBorder: false }
        },
        y: {
          min: -100,
          max: 100,
          grid: { drawBorder: false }
        }
      },

      plugins: {
        annotation: {
          annotations: {
            Q1: {
              type: "box",
              xMin: 0,
              xMax: 100,
              yMin: 0,
              yMax: 100,
              backgroundColor: "rgba(255, 99, 132, 0.25)",
              borderColor: "transparent"
            },
            Q2: {
              type: "box",
              xMin: 0,
              xMax: -100,
              yMin: 0,
              yMax: 100,
              backgroundColor: "rgba(99, 255, 132, 0.25)",
              borderColor: "transparent"
            },
            Q3: {
              type: "box",
              xMin: 0,
              xMax: -100,
              yMin: 0,
              yMax: -100,
              backgroundColor: "rgba(99, 132, 255, 0.25)",
              borderColor: "transparent"
            },
            Q4: {
              type: "box",
              xMin: 0,
              xMax: 100,
              yMin: 0,
              yMax: -100,
              backgroundColor: "rgba(132, 255, 255, 0.25)",
              borderColor: "transparent"
            },

            Label1: { type: "label", xValue: 50, yValue: 90, content: ["Quadrant 1"] },
            Label2: { type: "label", xValue: -50, yValue: 90, content: ["Quadrant 2"] },
            Label3: { type: "label", xValue: -50, yValue: -90, content: ["Quadrant 3"] },
            Label4: { type: "label", xValue: 50, yValue: -90, content: ["Quadrant 4"] }
          }
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "bubble-basic",
  name: "Bubble - Basic",
  description: "Bubble chart with two datasets",
  tags: ["bubble", "scatter"],
  color: "pink",

  config: {
    type: "bubble",
    data: {
      datasets: [
        {
          label: "My First dataset",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          borderWidth: 1,
          data: [
            { x: 62, y: 94, r: 9.8 },
            { x: -62, y: -34, r: 7.4 },
            { x: 8, y: 60, r: 1.8 },
            { x: -44, y: 59, r: 9.4 },
            { x: 64, y: 46, r: 6.8 },
            { x: 16, y: -95, r: 10.8 },
            { x: 95, y: -80, r: 1.8 }
          ]
        },
        {
          label: "My Second dataset",
          backgroundColor: "rgba(255, 159, 64, 0.5)",
          borderColor: "rgb(255, 159, 64)",
          borderWidth: 1,
          data: [
            { x: -15, y: -28, r: 14.8 },
            { x: -31, y: -53, r: 11 },
            { x: -70, y: -74, r: 14 },
            { x: -48, y: -6, r: 7 },
            { x: -82, y: 34, r: 13.6 },
            { x: -89, y: -71, r: 16.8 },
            { x: 15, y: -38, r: 0.2 }
          ]
        }
      ]
    },

    options: {
      title: {
        display: true,
        text: "Chart.js Bubble Chart"
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "scatter-basic",
  name: "Scatter - Basic",
  description: "Simple scatter chart with two datasets",
  tags: ["scatter", "points", "basic"],
  color: "pink",

  config: {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "My First dataset",
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          data: [
            { x: -49, y: 40 },
            { x: -59, y: -67 },
            { x: 84, y: -31 },
            { x: -92, y: -50 },
            { x: -21, y: -39 },
            { x: -79, y: 56 },
            { x: -25, y: 81 }
          ]
        },
        {
          label: "My Second dataset",
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          data: [
            { x: 82, y: 32 },
            { x: -88, y: -59 },
            { x: 17, y: 99 },
            { x: -84, y: 12 },
            { x: -76, y: 91 },
            { x: -98, y: 71 },
            { x: -51, y: -31 }
          ]
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "Chart.js Scatter Chart"
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "doughnut-basic",
  name: "Doughnut - Basic Colors",
  description: "Standard doughnut chart with basic labels",
  tags: ["doughnut", "pie", "basic"],
  color: "orange",

  config: {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: [94, 25, 72, 70, 14],
          backgroundColor: [
            "rgb(255, 99, 132)",
            "rgb(255, 159, 64)",
            "rgb(255, 205, 86)",
            "rgb(75, 192, 192)",
            "rgb(54, 162, 235)"
          ],
          label: "Dataset 1"
        }
      ],
      labels: ["Red", "Orange", "Yellow", "Green", "Blue"]
    },
    options: {
      title: {
        display: true,
        text: "Chart.js Doughnut Chart"
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "doughnut-half-meter",
  name: "Doughnut - Half Meter",
  description: "Half doughnut gauge chart with center labels",
  tags: ["doughnut", "gauge", "half", "meter"],
  color: "green",

  config: {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: [24, 25, 26],
          backgroundColor: ["green", "yellow", "red"],
          label: "Dataset 1",
          borderWidth: 10
        }
      ],
      labels: ["A", "B", "C"]
    },

    options: {
      circumference: Math.PI,
      rotation: Math.PI,
      cutoutPercentage: 75,
      layout: { padding: 40 },

      legend: { display: false },

      plugins: {
        datalabels: {
          color: "#000",
          anchor: "end",
          align: "end",
          formatter: (val) => val + "%",
          font: { size: 25, weight: "bold" }
        },

        doughnutlabel: {
          labels: [
            { text: "\nYou are at", font: { size: 20 } },
            { text: "\n24%", color: "#000", font: { size: 40, weight: "bold" } }
          ]
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "doughnut-multi-ring",
  name: "Doughnut - Multi Ring",
  description: "Two layered doughnut chart with category + subcategory rings",
  tags: ["doughnut", "multi", "ring", "nested"],
  color: "purple",

  config: {
    type: "doughnut",
    data: {
      datasets: [
        // Subcategories
        {
          label: "Dataset: Subcategory",
          labels: [
            "Car Hire","Fuel","8c/km road tax","Flights","Taxi",
            "Unknown","River Surfing","Kayaking","Luge","Shopping",
            "Eat Out","Insurance","Unknown","Phone","Does not balance",
            "Camping Site","Holiday Park","Yoga Matts","Chemist",
            "Car Gas","Intenational Transaction Fees"
          ],
          data: [
            1798,690,103,1709,177,7,512,306,141,416,240,448,
            128,120,0,87,84,18,12,11,0
          ],
          backgroundColor: [
            "hsl(52.5,100%,50%)","hsl(52.5,100%,76%)","hsl(52.5,100%,90%)",
            "hsl(190,100%,50%)","hsl(190,100%,86%)","hsl(190,100%,90%)",
            "hsl(327.5,100%,50%)","hsl(327.5,100%,72%)","hsl(327.5,100%,90%)",
            "hsl(105,100%,50%)","hsl(105,100%,90%)","hsl(242.5,100%,50%)",
            "hsl(20,100%,50%)","hsl(20,100%,52%)","hsl(20,100%,90%)",
            "hsl(157.5,100%,50%)","hsl(157.5,100%,80%)","hsl(295,100%,50%)",
            "hsl(295,100%,80%)","hsl(295,100%,85%)","hsl(72.5,100%,50%)"
          ]
        },

        // Categories outer ring
        {
          label: "Dataset: Category",
          labels: [
            "Car","Airport","Adventure","Food","Insurance",
            "Misc","Accommodation","Equipment",
            "International Transaction Fees"
          ],
          data: [2591,1893,959,656,448,248,171,41,0],
          backgroundColor: [
            "hsl(52.5,100%,50%)","hsl(190,100%,50%)","hsl(327.5,100%,50%)",
            "hsl(105,100%,50%)","hsl(242.5,100%,50%)","hsl(20,100%,50%)",
            "hsl(157.5,100%,50%)","hsl(295,100%,50%)","hsl(72.5,100%,50%)"
          ]
        }
      ]
    },

    options: {
      cutoutPercentage: 38,

      animation: { animateRotate: true },

      plugins: {
        doughnutlabel: {
          labels: [
            { text: "$7,007", font: { size: 20 }, },
            { text: "Total Cost" }
          ]
        },

        datalabels: {
          formatter: (val, ctx) => {
            if (val < 100) return "";
            const label = ctx.chart.data.datasets[ctx.datasetIndex].labels[ctx.dataIndex];
            const formattedVal = Intl.NumberFormat("en-US").format(val);
            return `${label} $${formattedVal}`;
          },
          color: isDark?"white":"black",
          font: { size: 6 },
          rotation: (ctx) => {
            const valuesBefore = ctx.dataset.data
              .slice(0, ctx.dataIndex)
              .reduce((a, b) => a + b, 0);

            const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);

            let rotation =
              ((valuesBefore + ctx.dataset.data[ctx.dataIndex] / 2) / sum) *
                360 +
              90;

            if (rotation > 90 && rotation < 270) {
              rotation += 180;
            }

            return rotation;
          }
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "doughnut-basic",
  name: "Doughnut - Basic",
  description: "Simple two-slice doughnut chart with cutout",
  tags: ["doughnut", "simple"],
  color: "cyan",

  config: {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: [55, 45],
          backgroundColor: ["rgb(173 225 232)", "rgb(33 170 184)"],
          borderWidth: 0
        }
      ]
    },
    options: {
      cutoutPercentage: 80,
      legend: { display: false },
      plugins: {
        datalabels: { display: false }
      }
    }
  },

  width: 800,
  height: 500,
  format: "png"
}
,
{
  id: "pie-basic",
  name: "Pie - Basic",
  description: "Simple pie chart with 5 categories",
  tags: ["pie", "basic"],
  color: "pink",

  config: {
    type: "pie",
    data: {
      datasets: [
        {
          data: [84, 28, 57, 19, 97],
          backgroundColor: [
            "rgb(255, 99, 132)",
            "rgb(255, 159, 64)",
            "rgb(255, 205, 86)",
            "rgb(75, 192, 192)",
            "rgb(54, 162, 235)"
          ],
          label: "Dataset 1"
        }
      ],
      labels: ["Red", "Orange", "Yellow", "Green", "Blue"]
    }
  },

  width: 800,
  height: 500,
  format: "png"
}
,
{
  id: "pie-outlabeled",
  name: "Pie - Outlabeled",
  description: "Pie chart with outlabels for each slice",
  tags: ["pie", "labels"],
  color: "purple",

  config: {
    type: "outlabeledPie",
    data: {
      labels: ["ONE", "TWO", "THREE", "FOUR", "FIVE"],
      datasets: [
        {
          backgroundColor: [
            "#FF3784",
            "#36A2EB",
            "#4BC0C0",
            "#F77825",
            "#9966FF"
          ],
          data: [1, 2, 3, 4, 5]
        }
      ]
    },
    options: {
      plugins: {
        legend: false,
        outlabels: {
          text: "%l %p",
          color: "white",
          stretch: 35,
          font: {
            resizable: true,
            minSize: 12,
            maxSize: 18
          }
        }
      }
    }
  },

  width: 900,
  height: 520,
  format: "png"
}
,
{
  id: "polar-area-basic",
  name: "Polar Area - Basic",
  description: "Standard polar area chart",
  tags: ["polar", "area"],
  color: "green",

  config: {
    type: "polarArea",
    data: {
      datasets: [
        {
          data: [3, 56, 61, 78, 83],
          backgroundColor: [
            "rgba(255, 99, 132, 0.5)",
            "rgba(255, 159, 64, 0.5)",
            "rgba(255, 205, 86, 0.5)",
            "rgba(75, 192, 192, 0.5)",
            "rgba(54, 162, 235, 0.5)"
          ],
          label: "My dataset"
        }
      ],
      labels: ["Red", "Orange", "Yellow", "Green", "Blue"]
    },
    options: {
      legend: { position: "right" },
      title: {
        display: true,
        text: "Chart.js Polar Area Chart"
      }
    }
  },

  width: 900,
  height: 520,
  format: "png"
}
,{
  id: "radar-basic",
  name: "Radar - Basic",
  description: "Radar chart with two datasets",
  tags: ["radar", "comparison"],
  color: "red",

  config: {
    type: "radar",
    data: {
      labels: [
        ["Eating", "Dinner"],
        ["Drinking", "Water"],
        "Sleeping",
        ["Designing", "Graphics"],
        "Coding",
        "Cycling",
        "Running"
      ],
      datasets: [
        {
          label: "My First dataset",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgb(255, 99, 132)",
          pointBackgroundColor: "rgb(255, 99, 132)",
          data: [26, 9, 42, 23, 42, 26, 10]
        },
        {
          label: "My Second dataset",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgb(54, 162, 235)",
          pointBackgroundColor: "rgb(54, 162, 235)",
          data: [6, 98, 27, 58, 52, 39, 35]
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "Chart.js Radar Chart"
      }
    }
  },

  width: 900,
  height: 520,
  format: "png"
}
,
{
  id: "doughnut-half-label",
  name: "Doughnut - Half + Labels",
  description: "Semi-doughnut with center text labels",
  tags: ["doughnut", "half", "labels"],
  color: "orange",

  config: {
    type: "doughnut",
    data: {
      datasets: [
        {
          label: "foo",
          data: [12, 88],
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(0, 0, 0, 0.1)"
          ],
          textcolor: ["#000555", "#555555"],
          borderWidth: 0
        }
      ]
    },
    options: {
      rotation: Math.PI,
      circumference: Math.PI,
      cutoutPercentage: 75,
      plugins: {
        datalabels: { display: false },
        doughnutlabel: {
          labels: [
            {
              text: "\nEmail Open Rate",
              color: "#aaa",
              font: { size: "25" }
            },
            {
              text: "\n12%",
              font: { size: "40" }
            }
          ]
        }
      }
    }
  },

  width: 900,
  height: 520,
  format: "png"
}
,
  {
    id: "radial-gauge",
    name: "Radial Gauge",
    description: "Radial gauge with gradient fill",
    tags: ["gauge", "radial"],
    color: "green",
    config: {
      type: "radialGauge",
      data: {
        datasets: [
          {
            data: [80],
            backgroundColor: getGradientFillHelper("horizontal", ["red", "blue"]),
          },
        ],
      },
      options: {
        domain: [0, 100],
        trackColor: "#f0f8ff",
        centerPercentage: 90,
        centerArea: {
          text: (val) => val + "%",
        },
      },
    },
    width: 1000,
    height: 520,
    format: "png",
  },

  /* ---------------------------------------------------
     2. Speedometer Gauge
  --------------------------------------------------- */
  {
    id: "speedometer",
    name: "Speedometer Gauge",
    description: "Traditional gauge with sections and needle",
    tags: ["gauge", "speedometer"],
    color: "green",
    config: {
      type: "gauge",
      data: {
        labels: ["Normal", "Warning", "Critical"],
        datasets: [
          {
            data: [20, 40, 60],
            value: 50,
            minValue: 0,
            backgroundColor: ["green", "orange", "red"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        legend: { display: false },
        title: {
          display: true,
          text: "Speedometer",
        },
        needle: {
          radiusPercentage: 1,
          widthPercentage: 1,
          lengthPercentage: 60,
          color: "#000",
        },
        valueLabel: {
          fontSize: 32,
          backgroundColor: "transparent",
          color: "#000",
          formatter: (value) => value + " mph",
          bottomMarginPercentage: 10,
        },
        plugins: {
          datalabels: {
            display: "auto",
            formatter: (value, context) =>
              context.chart.data.labels[context.dataIndex],
            color: "#fff",
          },
        },
      },
    },
    width: 1000,
    height: 520,
    format: "png",
  },

  /* ---------------------------------------------------
     3. Progress Bar
  --------------------------------------------------- */
  {
    id: "progress-bar",
    name: "Progress Bar",
    description: "Single-value horizontal bar",
    tags: ["bar", "progress"],
    color: "green",
    config: {
      type: "progressBar",
      data: {
        datasets: [{ data: [50] }],
      },
    },
    width: 1000,
    height: 520,
    format: "png",
  },

  /* ---------------------------------------------------
     4. Waterfall / Range Bar
  --------------------------------------------------- */
  {
    id: "range-bar",
    name: "Range Bar",
    description: "Bars with ranges for value fluctuation",
    tags: ["bar", "range"],
    color: "green",
    config: {
      type: "bar",
      data: {
        labels: [
          "Project Budget",
          "Iteration 1",
          "Iteration 2",
          "Iteration 3",
          "Iteration 4",
        ],
        datasets: [
          {
            data: [750, [500, 750], [360, 500], [200, 360], 200],
            backgroundColor: [
              "rgb(255, 0, 0)",
              "rgba(255, 0, 0, 0.8)",
              "rgba(255, 0, 0, 0.6)",
              "rgba(255, 0, 0, 0.4)",
              "rgba(255, 0, 0, 0.2)",
            ],
            categoryPercentage: 1,
            barPercentage: 0.98,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { beginAtZero: true } },
        },
      },
    },
    width: 1000,
    height: 520,
    format: "png",
  },

  /* ---------------------------------------------------
     5. Score Bar With Labels
  --------------------------------------------------- */
  {
    id: "score-bar",
    name: "Score Indicator Bar",
    description: "Gradient bar with score annotations",
    tags: ["bar", "score"],
    color: "green",
    config: {
      type: "bar",
      data: {
        labels: ["Q1"],
        datasets: [
          {
            label: "Users",
            data: [100],
            backgroundColor: getGradientFillHelper("horizontal", [
              "green",
              "yellow",
              "orange",
              "red",
            ]),
          },
        ],
      },
      options: {
        indexAxis: "y",
        layout: { padding: 40 },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        plugins: {
          legend: { display: false },
          annotation: {
            clip: false,
            annotations: {
              low: {
                type: "label",
                xValue: 4,
                content: ["Low"],
                font: { size: 18, weight: "bold" },
              },
              medium: {
                type: "label",
                xValue: 50,
                content: ["Medium"],
                font: { size: 18, weight: "bold" },
              },
              high: {
                type: "label",
                xValue: 95,
                content: ["High"],
                font: { size: 18, weight: "bold" },
              },
              arrow: {
                type: "point",
                pointStyle: "triangle",
                backgroundColor: "#000",
                radius: 15,
                xValue: 75,
                yAdjust: 65,
              },
              label1: {
                type: "label",
                xValue: 75,
                yAdjust: 95,
                content: ["Your score", "75%"],
                font: { size: 18, weight: "bold" },
              },
            },
          },
        },
      },
    },
    width: 1000,
    height: 520,
    format: "png",
  },

  /* ---------------------------------------------------
     6. Stacked Horizontal Bar (Indicator)
  --------------------------------------------------- */
  {
    id: "stacked-bar-indicator",
    name: "Stacked Indicator Bar",
    description: "Stacked bar with pointer annotation",
    tags: ["bar", "stacked"],
    color: "green",
    config: {
      type: "bar",
      data: {
        labels: [""],
        datasets: Array.from({ length: 10 }).map((_, i) => ({
          label: `Dataset ${i + 1}`,
          data: [10],
          backgroundColor: i < 5 ? "#ccc" : "#88bde4",
          borderColor: "black",
          borderWidth: 1,
          borderSkipped: false,
        })),
      },
      options: {
        indexAxis: "y",
        layout: { padding: 50 },
        scales: {
          x: { stacked: true, ticks: { stepSize: 10 }, grid: { display: false } },
          y: { stacked: true, display: false },
        },
        plugins: {
          legend: { display: false },
          annotation: {
            clip: false,
            annotations: {
              arrow: {
                type: "point",
                pointStyle: "triangle",
                backgroundColor: "#f00",
                radius: 15,
                xValue: 75,
                yAdjust: 35,
                rotation: 180,
              },
            },
          },
        },
      },
    },
    width: 1000,
    height: 520,
    format: "png",
  },

  /* ---------------------------------------------------
     7. Stacked Bar + Vertical Line + Label
  --------------------------------------------------- */
  {
    id: "stacked-bar-marker",
    name: "Stacked Marker Bar",
    description: "Stacked bar with vertical line annotation",
    tags: ["bar", "marker"],
    color: "green",
    config: {
      type: "bar",
      data: {
        labels: [""],
        datasets: [
          ...[1, 1, 1, 1, 1].map(() => ({
            label: "Part",
            data: [10],
            backgroundColor: "#f00",
          })),
          ...[1, 1, 1].map(() => ({
            label: "Part",
            data: [10],
            backgroundColor: "#ff0",
          })),
          ...[1, 1].map(() => ({
            label: "Part",
            data: [10],
            backgroundColor: "#0f0",
          })),
        ],
      },
      options: {
        indexAxis: "y",
        layout: { padding: 40 },
        scales: {
          x: {
            stacked: true,
            ticks: { display: true, stepSize: 10 },
            grid: { display: false },
          },
          y: { stacked: true, display: false },
        },
        plugins: {
          legend: { display: false },
          annotation: {
            clip: false,
            annotations: {
              arrow: {
                type: "point",
                pointStyle: "triangle",
                backgroundColor: "#000",
                radius: 7,
                xValue: 75,
                yAdjust: 25,
                rotation: 180,
              },
              label1: {
                type: "label",
                xValue: 75,
                yAdjust: 10,
                content: ["Your position"],
                font: { size: 12, weight: "bold" },
              },
              verticalLine: {
                type: "line",
                xMin: 75,
                xMax: 75,
                borderColor: "#000",
                borderWidth: 1,
                borderDash: [4, 4],
              },
            },
          },
        },
      },
    },
    width: 1000,
    height: 520,
    format: "png",
  },

  {
  id: "bar-budget-iterations",
  name: "Bar – Budget Iterations",
  description: "Bar chart showing project budget burn across iterations",
  tags: ["bar", "budget", "progress"],
  color: "red",

  config: {
    type: "bar",
    data: {
      labels: [
        "Project Budget",
        "Iteration 1",
        "Iteration 2",
        "Iteration 3",
        "Iteration 4"
      ],
      datasets: [
        {
          data: [750, [500, 750], [360, 500], [200, 360], 200],
          backgroundColor: [
            "rgb(255, 0, 0)",
            "rgba(255, 0, 0, 0.8)",
            "rgba(255, 0, 0, 0.6)",
            "rgba(255, 0, 0, 0.4)",
            "rgba(255, 0, 0, 0.2)"
          ],
          categoryPercentage: 1,
          barPercentage: 0.98
        }
      ]
    },

    options: {
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          ticks: {
            beginAtZero: true
          }
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "bar-background-image",
  name: "Bar - Background Image",
  description: "Bar chart with background image, custom grid and font colors",
  tags: ["bar", "image", "background"],
  color: "blue",

  config: {
    type: "bar",
    data: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        {
          label: "Users",
          data: [50, 60, 70, 180]
        },
        {
          label: "Revenue",
          data: [100, 200, 300, 400]
        }
      ]
    },

    options: {
      legend: {
        labels: { fontColor: "#fff" }
      },

      scales: {
        xAxes: [
          {
            ticks: {
              fontColor: "#fff"
            }
          }
        ],
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              fontColor: "#fff"
            },
            gridLines: {
              color: "#aaa"
            }
          }
        ]
      },

      plugins: {
        backgroundImageUrl:
          "https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569__340.jpg"
      }
    }
  },

  width: 1200,
  height: 600,
  format: "png"
}
,
{
  id: "radial-gauge-basic",
  name: "Radial Gauge - Basic",
  description: "Simple radial gauge with center text and background image",
  tags: ["gauge", "radial"],
  color: "purple",

  config: {
    type: "radialGauge",
    data: {
      datasets: [
        {
          data: [50],
          backgroundColor: "rgb(0,13,30)"
        }
      ]
    },
    options: {
      centerArea: {
        fontSize: 25,
        fontColor: "red",
        fontWeight: "bold"
      },
      plugins: {
        backgroundImageUrl:
          "https://pyxis.nymag.com/v1/imgs/dc5/011/2ea57ca9a7a5d9518b2f3cd94ccdde218f-25-emoji-subpoena.rsocial.w1200.jpg"
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "line-annotation",
  name: "Line - With Annotations",
  description: "Line chart with vertical line & box annotations, plus datalabels",
  tags: ["line", "annotation", "datalabels"],
  color: "green",

  config: {
    type: "line",
    data: {
      labels: [1, 2, 3, 4, 5],
      datasets: [
        {
          label: "Rainfall",
          data: [200, 90, 120, 400, 500],
          fill: false,
          borderColor: "green",
          backgroundColor: "green"
        }
      ]
    },
    options: {
      annotation: {
        annotations: [
          {
            type: "line",
            mode: "vertical",
            scaleID: "x-axis-0",
            value: 2,
            borderColor: "red",
            borderWidth: 4,
            label: {
              enabled: true,
              content: "Something changed"
            }
          },
          {
            type: "box",
            xScaleID: "x-axis-0",
            yScaleID: "y-axis-0",
            xMin: 3,
            xMax: 5,
            backgroundColor: "rgba(200,200,200,0.2)",
            borderColor: "#ccc"
          }
        ]
      },
      plugins: {
        datalabels: {
          display: true,
          align: "bottom",
          backgroundColor: "#ccc",
          borderRadius: 3
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "bar-tick-format",
  name: "Bar - Tick Formatting",
  description: "Custom tick formatting with currency styling",
  tags: ["bar", "ticks", "formatting"],
  color: "orange",

  config: {
    type: "bar",
    data: {
      labels: [
        "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
      ],
      datasets: [
        {
          data: [
            1500, 1700, 1300, 1800,
            1400, 100, 700, 1800,
            1000, 1000, 200, 1800
          ]
        }
      ]
    },
    options: {
      plugins: {
        tickFormat: {
          prefix: "$",
          minimumFractionDigits: 2,
          useGrouping: true
        }
      },
      legend: { display: false },
      title: { display: true, text: "Custom tick mark formats" }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "bar-stacked-annotation",
  name: "Bar - Stacked With Annotation",
  description: "Stacked bar chart with horizontal annotation + arrow head",
  tags: ["bar", "stacked", "annotation"],
  color: "red",

  config: {
    type: "bar",
    data: {
      labels: ["", ""],
      datasets: [
        {
          label: "1",
          backgroundColor: "rgba(255,0,0,0.3)",
          data: [5]
        },
        {
          label: "2",
          backgroundColor: "rgba(0,255,0,0.3)",
          data: [5]
        },
        {
          label: "3",
          backgroundColor: "rgba(0,0,255,0.3)",
          data: [5]
        }
      ]
    },
    options: {
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      },
      plugins: {
        annotation: {
          annotations: [
            {
              type: "line",
              mode: "horizontal",
              yMin: 10,
              yMax: 10,
              xMin: 0.35,
              xMax: 2,
              borderColor: "red",
              label: {
                enabled: true,
                color: "black",
                backgroundColor: "transparent",
                content: "Look over here",
                position: "center",
                padding: { bottom: 15 }
              },
              arrowHeads: {
                start: { enabled: true }
              }
            }
          ]
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "bar-error-bars",
  name: "Bar - Error Bars",
  description: "Bar chart with plus/minus error bars on each value",
  tags: ["bar", "error-bars"],
  color: "blue",

  config: {
    type: "bar",
    data: {
      labels: ["January", "February", "March", "April"],
      datasets: [
        {
          label: "Dataset 1",
          data: [56, 33, 78, 54],
          errorBars: {
            January: { plus: 10, minus: 5 },
            February: { plus: 15, minus: 3 },
            March: { plus: 15, minus: 14 },
            April: { plus: 25, minus: 4 }
          }
        },
        {
          label: "Dataset 2",
          data: [100, 77, 33, 45],
          errorBars: {
            January: { plus: 5, minus: 34 },
            February: { plus: 5, minus: 24 },
            March: { plus: 10, minus: 4 },
            April: { plus: 15, minus: 20 }
          }
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "Error Bars"
      },
      plugins: {
        chartJsPluginErrorBars: {
          color: "#aaa"
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "line-dogs-cats",
  name: "Line – Dogs vs Cats",
  description: "Comparison of dogs and cats over months",
  tags: ["line", "animals", "comparison"],
  color: "red",

  config: {
    type: "line",
    data: {
      labels: ["January", "February", "March", "April", "May"],
      datasets: [
        {
          label: "Dogs",
          data: [5, 6, 7, 8, 9],
          fill: false,
          borderColor: "red"
        },
        {
          label: "Cats",
          data: [6, 6, 5, 9, 9],
          fill: false,
          borderColor: "green"
        }
      ]
    },

    options: {
      legend: {
        position: "bottom",
        labels: {
          fontSize: 20,
          fontStyle: "bold"
        }
      },
      title: {
        display: true,
        text: "Dogs v Cats",
        fontSize: 28
      },
      scales: {
        yAxes: [
          {
            ticks: {
              suggestedMax: 10,
              beginAtZero: true,
              fontFamily: "Mono",
              fontSize: 6
            }
          }
        ],
        xAxes: [
          {
            ticks: {
              fontFamily: "Serif",
              fontStyle: "italic",
              fontSize: 8
            }
          }
        ]
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "bar-users-top-labels",
  name: "Bar – Users With Top Labels",
  description: "Bar chart showing users per quarter with datalabels above bars",
  tags: ["bar", "datalabels"],
  color: "blue",

  config: {
    type: "bar",
    data: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        {
          label: "Users (thousands)",
          data: [50, 60, 70, 180],
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgb(54, 162, 235)",
          borderWidth: 1
        }
      ]
    },

    options: {
      plugins: {
        datalabels: {
          anchor: "end",
          align: "top",
          color: "#fff",
          backgroundColor: "rgba(34, 139, 34, 0.6)",
          borderColor: "rgba(34, 139, 34, 1.0)",
          borderWidth: 1,
          borderRadius: 5,
          formatter: (value) => value + "k"
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}

,
{
  id: "bar-users-centered-labels",
  name: "Bar – Users With Center Labels",
  description: "Bar chart with centered bold datalabels",
  tags: ["bar", "datalabels"],
  color: "green",

  config: {
    type: "bar",
    data: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        {
          label: "Users",
          data: [50, 60, 70, 180],
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgb(54, 162, 235)",
          borderWidth: 1
        }
      ]
    },

    options: {
      plugins: {
        datalabels: {
          anchor: "center",
          align: "center",
          color: "#fff",
          font: {
            weight: "bold"
          }
        }
      }
    }
  },

  width: 1000,
  height: 520,
  format: "png"
}
,
{
  id: "log-line",
  name: "Logarithmic Line Chart",
  description: "Line chart with logarithmic Y-axis",
  tags: ["line", "logarithmic"],
  color: "red",
  width: 1000,
  height: 520,
  format: "png",
  config: {
    type: "line",
    data: {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "My First dataset",
          backgroundColor: "rgb(255, 99, 132)",
          borderColor: "rgb(255, 99, 132)",
          fill: false,
          data: [800000, 90, 800, 400000, 900000, 50000, 600],
        },
        {
          label: "My Second dataset",
          backgroundColor: "rgb(54, 162, 235)",
          borderColor: "rgb(54, 162, 235)",
          fill: false,
          data: [1000000, 70, 400, 30000, 80000, 700000, 500],
        },
      ],
    },
    options: {
      responsive: true,
      title: { display: true, text: "Chart.js Line Chart - Logarithmic" },
      scales: { yAxes: [{ display: true, type: "logarithmic" }] },
    },
  },
}
,
{
  id: "scatter-log",
  name: "Frequency Scatter Log Chart",
  description: "Scatter chart with logarithmic X-axis",
  tags: ["scatter", "logarithmic"],
  color: "blue",
  width: 1000,
  height: 520,
  format: "png",
  config: {
    type: "scatter",
    data: {
      datasets: [
        {
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          label: "V(node2)",
          data: [
            { x: 6.31, y: -0.6339 }, { x: 7.94, y: -0.9659 },
            { x: 10, y: -1.445 }, { x: 12.6, y: -2.11 },
            { x: 15.8, y: -2.992 }, { x: 20, y: -4.102 },
            { x: 25.1, y: -5.429 }, { x: 31.6, y: -6.944 },
            { x: 39.8, y: -8.607 }, { x: 50.1, y: -10.38 },
            { x: 63.1, y: -12.23 }, { x: 79.4, y: -14.13 },
            { x: 100, y: -16.07 }, { x: 126, y: -18.03 },
            { x: 158, y: -20 }, { x: 200, y: -21.99 },
            { x: 251, y: -23.98 }, { x: 316, y: -25.97 },
            { x: 398, y: -27.97 }, { x: 501, y: -29.96 },
            { x: 631, y: -31.96 }, { x: 794, y: -33.96 },
            { x: 1000, y: -35.96 },
          ],
        },
      ],
    },
    options: {
      title: { display: true, text: "Chart.js Scatter Chart - Logarithmic X-Axis" },
      scales: {
        xAxes: [
          {
            type: "logarithmic",
            position: "bottom",
            scaleLabel: { labelString: "Frequency", display: true },
          },
        ],
        yAxes: [
          {
            type: "linear",
            scaleLabel: { labelString: "Voltage", display: true },
          },
        ],
      },
    },
  },
}
,
{
  id: "time-point-line",
  name: "Time-Based Point Line Chart",
  description: "Line chart with Date and ISO string x-values",
  tags: ["line", "time"],
  color: "purple",
  width: 1000,
  height: 520,
  format: "png",
  config: {
    type: "line",
    data: {
      datasets: [
        {
          label: "Dataset with string point data",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          fill: false,
          data: [
            { x: "2020-06-14T09:15:34-07:00", y: 75 },
            { x: "2020-06-16T09:15:34-07:00", y: -53 },
            { x: "2020-06-18T09:15:34-07:00", y: 31 },
            { x: "2020-06-19T09:15:34-07:00", y: 6 },
          ],
        },
        {
          label: "Dataset with date object point data",
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgb(54, 162, 235)",
          fill: false,
          data: [
            { x: new Date("2020-06-14T16:15:34.829Z"), y: -59 },
            { x: new Date("2020-06-16T16:15:34.829Z"), y: 9 },
            { x: new Date("2020-06-18T16:15:34.829Z"), y: -68 },
            { x: new Date("2020-06-19T16:15:34.829Z"), y: -43 },
          ],
        },
      ],
    },
    options: {
      responsive: true,
      title: { display: true, text: "Chart.js Time Point Data" },
      scales: {
        xAxes: [
          {
            type: "time",
            display: true,
            scaleLabel: { display: true, labelString: "Date" },
            ticks: { major: { enabled: true } },
          },
        ],
        yAxes: [
          { display: true, scaleLabel: { display: true, labelString: "value" } },
        ],
      },
    },
  },
}
,
{
  id: "mixed-time-line",
  name: "Mixed Time Line Chart",
  description: "Multiple datasets using time labels and mixed point objects",
  tags: ["line", "time"],
  color: "green",
  width: 1000,
  height: 520,
  format: "png",
  config: {
    type: "line",
    data: {
      labels: [
        new Date("2020-06-14T16:08:20.288Z"),
        new Date("2020-06-15T16:08:20.288Z"),
        new Date("2020-06-16T16:08:20.289Z"),
        new Date("2020-06-17T16:08:20.289Z"),
        new Date("2020-06-18T16:08:20.289Z"),
        new Date("2020-06-19T16:08:20.289Z"),
        new Date("2020-06-20T16:08:20.289Z"),
      ],
      datasets: [
        {
          label: "My First dataset",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          fill: false,
          data: [38, -19, 35, -2, 77, 78, -93],
        },
        {
          label: "My Second dataset",
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgb(54, 162, 235)",
          fill: false,
          data: [18, -7, 49, 86, 63, -92, -35],
        },
        {
          label: "Dataset with point data",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgb(75, 192, 192)",
          fill: false,
          data: [
            { x: "06/14/2020 09:08", y: -29 },
            { x: "06/19/2020 09:08", y: -34 },
            { x: "06/21/2020 09:08", y: -62 },
            { x: "06/29/2020 09:08", y: 1 },
          ],
        },
      ],
    },
    options: {
      title: { text: "Chart.js Time Scale" },
      scales: {
        xAxes: [
          {
            type: "time",
            time: { parser: "MM/DD/YYYY HH:mm" },
            scaleLabel: { display: true, labelString: "Date" },
          },
        ],
        yAxes: [
          { scaleLabel: { display: true, labelString: "value" } },
        ],
      },
    },
  },
}
,
{
  id: "combo-time",
  name: "Combo Time Bar-Line Chart",
  description: "Bars + line mixed chart with time axis",
  tags: ["combo", "bar", "line", "time"],
  color: "orange",
  width: 1000,
  height: 520,
  format: "png",
  config: {
    type: "bar",
    data: {
      labels: [
        new Date(2020, 5, 14),
        new Date(2020, 5, 15),
        new Date(2020, 5, 16),
        new Date(2020, 5, 17),
        new Date(2020, 5, 18),
        new Date(2020, 5, 19),
        new Date(2020, 5, 20),
      ],
      datasets: [
        {
          type: "bar",
          label: "Dataset 1",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgb(255, 99, 132)",
          data: [-1, 44, -51, -2, 75, 62, 43],
        },
        {
          type: "bar",
          label: "Dataset 2",
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgb(54, 162, 235)",
          data: [5, 68, 19, -57, -79, 37, -24],
        },
        {
          type: "line",
          label: "Dataset 3",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgb(75, 192, 192)",
          fill: false,
          data: [-35, 33, -49, 2, 68, 35, -16],
        },
      ],
    },
    options: {
      title: { text: "Chart.js Combo Time Scale" },
      scales: {
        xAxes: [
          { type: "time", offset: true, time: { unit: "day" } },
        ],
      },
    },
  },
}
,
{
  id: "gantt-chart",
  name: "Gantt Timeline Chart",
  description: "Horizontal bar with date-range segments",
  tags: ["bar", "time", "gantt"],
  color: "yellow",
  width: 1000,
  height: 520,
  format: "png",
  config: {
    type: "horizontalBar",
    data: {
      labels: ["Part 1", "Part 2", "Part 3", "Part 4", "Part 5", "Part 6"],
      datasets: [
        {
          data: [
            [new Date("2021-02-01"), new Date("2021-05-01")],
            [new Date("2021-05-10"), new Date("2021-07-01")],
            [new Date("2021-04-20"), new Date("2021-11-31")],
            [new Date("2021-08-01"), new Date("2021-09-01")],
            [new Date("2021-02-10"), new Date("2021-07-01")],
            [new Date("2021-07-20"), new Date("2021-11-31")],
          ],
          backgroundColor: [
            "rgb(255, 99, 132, 1.0)",
            "rgba(255, 99, 132, 1.0)",
            "rgba(255, 206, 86, 1.0)",
            "rgba(255, 206, 86, 1.0)",
            "rgba(255, 206, 86, 0.2)",
            undefined,
          ],
        },
      ],
    },
    options: {
      legend: { display: false },
      annotation: {
        annotations: [
          {
            type: "line",
            mode: "vertical",
            scaleID: "x-axis-0",
            value: new Date("2021-10-30"),
            borderColor: "red",
            borderWidth: 1,
            label: {
              enabled: true,
              content: "Deadline",
              position: "top",
            },
          },
        ],
      },
      scales: {
        xAxes: [
          {
            position: "top",
            type: "time",
            time: { unit: "month" },
            ticks: {
              min: new Date("2021-01-01"),
              max: new Date("2022-01-01"),
            },
          },
        ],
      },
    },
  },
}

,
{
  id: "styled-multi-line",
  name: "Styled Multi-Line Chart",
  description: "Unfilled, dashed, and filled datasets",
  tags: ["line", "style"],
  color: "pink",
  width: 1000,
  height: 520,
  format: "png",
  config: {
    type: "line",
    data: {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "Unfilled",
          fill: false,
          backgroundColor: "rgb(54, 162, 235)",
          borderColor: "rgb(54, 162, 235)",
          data: [-73, 40, -4, 27, 26, 53, -12],
        },
        {
          label: "Dashed",
          fill: false,
          borderDash: [5, 5],
          backgroundColor: "rgb(75, 192, 192)",
          borderColor: "rgb(75, 192, 192)",
          data: [99, -40, 93, -56, 0, 25, 45],
        },
        {
          label: "Filled",
          fill: true,
          backgroundColor: "rgb(255, 99, 132)",
          borderColor: "rgb(255, 99, 132)",
          data: [56, 68, 84, 11, -96, -56, -51],
        },
      ],
    },
    options: {
      title: { display: true, text: "Chart.js Line Chart" },
      scales: {
        xAxes: [{ scaleLabel: { display: true, labelString: "Month" } }],
        yAxes: [{ scaleLabel: { display: true, labelString: "Value" } }],
      },
    },
  },
}
,
{
  id: "line-legend-left",
  name: "Legend Left Line Chart",
  description: "Line chart with left-positioned legend",
  tags: ["line", "legend"],
  color: "teal",
  width: 1000,
  height: 520,
  format: "png",
  config: {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      datasets: [
        {
          label: "Dataset",
          data: [92, 32, 74, -98, 84, 45, -21],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "left" },
        title: { display: true, text: "Legend Position: left" },
      },
    },
  },
}
,




  // additional presets...
];

  // editor / generation state
  const [presetId, setPresetId] = useState(PRESETS[0]?.id || "");
  const [chartConfigText, setChartConfigText] = useState(prettyJSON(PRESETS[0]?.config || {}));
  const [width, setWidth] = useState(PRESETS[0]?.width || 900);
  const [height, setHeight] = useState(PRESETS[0]?.height || 420);
  const [format, setFormat] = useState(PRESETS[0]?.format || "png");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [loading, setLoading] = useState(false);

  const [chartBlobUrl, setChartBlobUrl] = useState(null);
  const [rawRequest, setRawRequest] = useState(null);
  const [rawResponseInfo, setRawResponseInfo] = useState(null);

  // sidebar
  const [sidebarPresets, setSidebarPresets] = useState(() => pickRandom(PRESETS, PRESETS.length));
  const [sheetOpen, setSheetOpen] = useState(false);

  // copy animations
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // raw toggle & dialog
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const editorRef = useRef(null);
  const blobRef = useRef(null);
  const copyTimerRef = useRef(null);

  

  useEffect(() => {
    // initial load: apply first preset (no auto-generate) and create sidebar
    if (PRESETS.length > 0) {
      const first = PRESETS[0];
      applyPresetFromPanel(first, { generate: false });
    }
    setSidebarPresets(pickRandom(PRESETS, 10));

    return () => {
      if (blobRef.current) {
        try { URL.revokeObjectURL(blobRef.current); } catch {}
      }
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Build request body expected by QuickChart */
  function buildRequestBody({ chartConfig, width, height, format, backgroundColor }) {
    const payload = {
      chart: chartConfig,
      width: width || 800,
      height: height || 400,
      format: format || "png",
    };
    if (backgroundColor) payload.backgroundColor = backgroundColor;
    return payload;
  }

  /**
   * generateChart
   * - If overrides are provided (chartConfig, w, h, fmt, bg) they will be used directly,
   *   which avoids race conditions when generating immediately after setting state.
   */
  async function generateChart(e, overrides = null) {
    if (e && e.preventDefault) e.preventDefault();

    // choose source: overrides or current state
    let chartConfig, w, h, fmt, bg;
    if (overrides && overrides.chartConfig) {
      chartConfig = overrides.chartConfig;
      w = overrides.w ?? overrides.width ?? width;
      h = overrides.h ?? overrides.height ?? height;
      fmt = overrides.fmt ?? overrides.format ?? format;
      bg = overrides.bg ?? overrides.backgroundColor ?? backgroundColor;
    } else {
      try {
        chartConfig = JSON.parse(chartConfigText);
      } catch (err) {
        showToast("error", "Chart config JSON is invalid. Fix syntax and try again.");
        return;
      }
      w = width;
      h = height;
      fmt = format;
      bg = backgroundColor;
    }

    const bodyPayload = buildRequestBody({ chartConfig, width: Number(w) || 800, height: Number(h) || 400, format: fmt || "png", backgroundColor: bg || undefined });

    setRawRequest(bodyPayload);
    setLoading(true);
    setShowRaw(false);

    // cleanup old blob
    if (blobRef.current) {
      try { URL.revokeObjectURL(blobRef.current); } catch {}
      blobRef.current = null;
      setChartBlobUrl(null);
    }

    try {
      const res = await fetch(QUICKCHART_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const txt = await res.text();
        setRawResponseInfo({ status: res.status, statusText: res.statusText, body: txt });
        showToast("error", `QuickChart returned ${res.status}`);
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      blobRef.current = url;
      setChartBlobUrl(url);
      setRawResponseInfo({ status: res.status, statusText: res.statusText, size: blob.size, type: blob.type });
      // open preview dialog for UX
      setDialogOpen(true);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to generate chart");
    } finally {
      setLoading(false);
    }
  }

  function downloadChart() {
    if (!chartBlobUrl) return showToast("info", "No chart to download");
    const a = document.createElement("a");
    a.href = chartBlobUrl;
    a.download = `chart.${format || "png"}`;
    a.click();
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(QUICKCHART_ENDPOINT);
    setCopiedEndpoint(true);
    showToast("success", "Endpoint copied");
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedEndpoint(false), 1400);
  }

  async function copyResponse() {
    if (!rawResponseInfo) return showToast("info", "No response metadata to copy");
    navigator.clipboard.writeText(prettyJSON(rawResponseInfo));
    setCopiedResponse(true);
    showToast("success", "Response info copied");
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedResponse(false), 1400);
  }

  /**
   * onPresetClick
   * - update editor & controls state immediately
   * - call generateChart with the preset config payload (override) to avoid race
   */
  function onPresetClick(preset) {
    if (!preset) return;
    setPresetId(preset.id);
    setChartConfigText(prettyJSON(preset.config));
    setWidth(preset.width || 900);
    setHeight(preset.height || 420);
    setFormat(preset.format || "png");
    setBackgroundColor("");
    // Use override payload to generate immediately (no race)
    generateChart(null, { chartConfig: preset.config, w: preset.width, h: preset.height, fmt: preset.format, bg: "" });
  }

  /* sidebar shuffle / refresh */
  function refreshSidebar() {
    setSidebarPresets(pickRandom(PRESETS, 10));
    showToast("success", "Sidebar refreshed");
  }

  /* apply preset without generating (used by right panel) */
  function applyPresetFromPanel(preset, { generate = true } = {}) {
    if (!preset) return;
    setPresetId(preset.id);
    setChartConfigText(prettyJSON(preset.config));
    setWidth(preset.width || 900);
    setHeight(preset.height || 420);
    setFormat(preset.format || "png");
    setBackgroundColor("");
    setChartBlobUrl(null);
    setRawRequest(null);
    setRawResponseInfo(null);
    showToast("success", `Loaded preset: ${preset.name}`);
    if (generate) {
      // generate using overrides to avoid race
      generateChart(null, { chartConfig: preset.config, w: preset.width, h: preset.height, fmt: preset.format, bg: "" });
    }
  }

  /* UI helpers for badge color */
function badgeClass(color) {
  const map = {
    amber:
      "backdrop-blur-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300",
    blue:
      "backdrop-blur-md bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300",
    violet:
      "backdrop-blur-md bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300",
    teal:
      "backdrop-blur-md bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300",
    gray:
      "backdrop-blur-md bg-zinc-500/10 border border-zinc-500/20 text-zinc-700 dark:text-zinc-300",
    rose:
      "backdrop-blur-md bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300",
    purple:
      "backdrop-blur-md bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300",
  };

  return  map.amber;
}


  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 lg:p-8 max-w-9xl mx-auto", isDark ? "text-white" : "text-zinc-950")}>
      {/* Header */}
      <header className="flex items-start flex-wrap md:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="cursor-pointer"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px]">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart2 />
                    <div>
                      <div className="font-semibold">Presets</div>
                      <div className="text-xs opacity-60">Quick pick</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={refreshSidebar} className="cursor-pointer"><RefreshCcw /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setSheetOpen(false)} className="cursor-pointer"><X /></Button>
                  </div>
                </div>
                <Separator />
                <ScrollArea className="h-[70vh] p-3">
                  <div className="space-y-2">
                    {sidebarPresets.map((p) => (
                      <div key={p.id} onClick={() => { onPresetClick(p); setSheetOpen(false); }} className="p-3 rounded-lg border hover:shadow flex items-start gap-3 cursor-pointer">
                        
                        <div className="flex-1">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs opacity-60">{p.description}</div>
                          <div className="mt-2 flex gap-2">
                            {(p.tags || []).slice(0,2).map((t) => <span key={t} className={clsx("text-[11px] px-2 py-0.5 rounded-full border", badgeClass(p.color))}>{t}</span>)}
                          </div>
                        </div>
                      </div>
                    ))}
                   
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center bg-white/90 dark:bg-zinc-800 shadow-sm")}>
            <BarChart2 />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">QuickChart Studio</h1>
            <div className="text-xs opacity-60">Generate Chart images from Chart.js configs — preview, tweak, download.</div>
          </div>
        </div>

        {/* Desktop quick controls */}
        <div className="flex items-center gap-3">
          <div className={clsx("flex items-center gap-2 rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <BarChart2 className="opacity-60" />
            <Select value={presetId} onValueChange={(v) => {
              const p = PRESETS.find(x => x.id === v);
              if (p) onPresetClick(p);
            }}>
              <SelectTrigger className="w-[220px] cursor-pointer bg-transparent border-0 shadow-none focus:ring-0">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((p) => (
                  <SelectItem className="cursor-pointer" key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar (desktop) */}
        <aside className="hidden lg:block lg:col-span-3">
          <Card className="rounded-2xl p-3 dark:bg-black bg-white">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Tag /> Presets</span>
                <div className="text-xs opacity-60">{sidebarPresets.length}</div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[70vh]">
                <div className="space-y-3">
                  {sidebarPresets.map((p) => (
                    <motion.div whileHover={{ scale: 1.01 }} key={p.id} className="p-3 rounded-lg border hover:shadow cursor-pointer flex items-start gap-3" onClick={() => onPresetClick(p)}>
                    
                      <div className="flex-1">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs opacity-60">{p.description}</div>
                        <div className="mt-2 flex gap-2">
                            {(p.tags || []).slice(0,2).map((t) => <span key={t} className={clsx("text-[11px] px-2 py-0.5 rounded-full border", badgeClass(p.color))}>{t}</span>)}
                          </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              
            </CardContent>
          </Card>
        </aside>

        {/* Center: preview */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className={clsx("p-5 flex flex-wrap gap-3 items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <div className="text-lg font-semibold flex items-center gap-2"><BarChart2 /> Preview</div>
                <div className="text-xs opacity-60">Click a preset to auto-generate — large preview centered for focus.</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="cursor-pointer" onClick={() => generateChart()}>{loading ? <Loader2 className="animate-spin" /> : <Zap />} Generate</Button>
                <AnimatePresence>
                  {chartBlobUrl && (
                    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                      <Button variant="outline" className="cursor-pointer" onClick={() => downloadChart()}><Download /> Download</Button>
                      <motion.button onClick={copyEndpoint} className="p-2 rounded-md cursor-pointer" initial={{ scale: 1 }} animate={{ scale: copiedEndpoint ? 0.96 : 1 }}>
                        {copiedEndpoint ? <Check className="text-green-500" /> : <ExternalLink />}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <CardContent>
              <div className="flex flex-col items-stretch gap-4">
                <div className="rounded-lg border overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center" style={{ minHeight: 360 }}>
                  {loading ? (
                    <div className="text-center">
                      <Loader2 className="animate-spin mx-auto" />
                      <div className="text-xs opacity-60 mt-2">Generating chart...</div>
                    </div>
                  ) : chartBlobUrl ? (
                    <img src={chartBlobUrl} alt="Generated chart" className="max-w-full max-h-full object-contain cursor-pointer" onClick={() => setDialogOpen(true)} />
                  ) : (
                    <div className="text-center p-6">
                      <div className="text-sm font-medium">No chart generated yet</div>
                      <div className="text-xs opacity-60 mt-2">Click a preset on the left or press Generate to produce an image.</div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border">
                    <div className="text-xs opacity-60">Size</div>
                    <div className="font-medium">{width} × {height}px</div>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <div className="text-xs opacity-60">Format</div>
                    <div className="font-medium">{format}</div>
                  </div>
                </div>

                <AnimatePresence>
                  {showRaw && rawRequest && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-3 rounded-md border">
                      <div className="text-xs opacity-60 mb-2">Request payload</div>
                      <pre className="text-xs overflow-auto" style={{ maxHeight: 200 }}>{prettyJSON(rawRequest)}</pre>
                      <Separator className="my-3" />
                      <div className="text-xs opacity-60 mb-2">Response</div>
                      <pre className="text-xs overflow-auto" style={{ maxHeight: 120 }}>{prettyJSON(rawResponseInfo)}</pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Right: editor / dev panel */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-3 space-y-4", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2"><FileText /> Editor</div>
              <div className="text-xs opacity-60">Chart.js JSON • tweak & generate</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="cursor-pointer" onClick={() => setShowRaw(s => !s)}>{showRaw ? "Hide" : "Raw"}</Button>
              <Button variant="ghost" className="cursor-pointer" onClick={() => setSidebarPresets(pickRandom(PRESETS, 10))}><RefreshCcw /></Button>
            </div>
          </div>

          <div>
            <div className="text-xs opacity-60 mb-2">Chart config</div>
            <textarea ref={editorRef} value={chartConfigText} onChange={(e) => setChartConfigText(e.target.value)} rows={18} className={clsx("w-full p-3 rounded-md font-mono text-sm resize-vertical outline-none", isDark ? "bg-zinc-900 text-zinc-200" : "bg-zinc-50 text-zinc-900")} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs opacity-60">Width (px)</div>
              <Input value={width} onChange={(e) => setWidth(Number(e.target.value || 0))} className="mt-1" />
            </div>
            <div>
              <div className="text-xs opacity-60">Height (px)</div>
              <Input value={height} onChange={(e) => setHeight(Number(e.target.value || 0))} className="mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1">
              <div className="text-xs opacity-60">Format</div>
              <Select value={format} onValueChange={(v) => setFormat(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">png</SelectItem>
                  <SelectItem value="svg">svg</SelectItem>
                  <SelectItem value="webp">webp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <div className="text-xs opacity-60">Background</div>
              <Input placeholder="#ffffff or transparent" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <Button variant="outline" className="cursor-pointer" onClick={() => generateChart()}>{loading ? <Loader2 className="animate-spin" /> : <Zap />} Generate</Button>

            <motion.button onClick={copyEndpoint} className="w-full p-2 rounded-md border flex items-center justify-center gap-2 cursor-pointer" initial={{ scale: 1 }} animate={{ scale: copiedEndpoint ? 0.96 : 1 }}>
              {copiedEndpoint ? <Check className="text-green-500" /> : <CopyIcon />} Copy endpoint
            </motion.button>

            <motion.button onClick={copyResponse} className="w-full p-2 rounded-md border flex items-center justify-center gap-2 cursor-pointer" initial={{ scale: 1 }} animate={{ scale: copiedResponse ? 0.96 : 1 }}>
              {copiedResponse ? <Check className="text-green-500" /> : <CopyIcon />} Copy response
            </motion.button>

            <Button variant="ghost" className="cursor-pointer" onClick={() => setDialogOpen(true)}><ImageIcon /> Open preview dialog</Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick tips</div>
            <div className="text-xs opacity-70">
              • Use Chart.js v3 config. <br />
              • Click a preset to auto-generate. <br />
              • Click preview to open large dialog. <br />
              • For SVG use format "svg".
            </div>
          </div>
        </aside>
      </main>

      {/* Dialog: Chart preview */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-5xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Chart Preview</DialogTitle>
          </DialogHeader>
          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {chartBlobUrl ? (
              <img src={chartBlobUrl} alt="chart preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            ) : (
              <div className="text-xs opacity-60">No chart generated yet</div>
            )}
          </div>
          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Generated by QuickChart</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => downloadChart()}><Download /> Download</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
