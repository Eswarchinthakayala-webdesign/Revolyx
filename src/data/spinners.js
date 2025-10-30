// src/data/spinners.js
// Exports an array of spinner definitions: id, name, category, componentName, source (string)
// Each spinner component will be defined in components but we keep the data here for list + search.

export const SPINNER_LIST = [
  { id: "dots", name: "Bouncing Dots", category: "Dots", component: "DotsSpinner" },
  { id: "pulse", name: "Pulse", category: "Pulse", component: "PulseSpinner" },
  { id: "border", name: "Border Circle", category: "Circle", component: "BorderCircleSpinner" },
  { id: "dualring", name: "Dual Ring", category: "Ring", component: "DualRingSpinner" },
  { id: "svg-ring", name: "SVG Ring (Stroke)", category: "SVG", component: "SVGRingSpinner" },
  { id: "ellipsis", name: "Ellipsis", category: "Dots", component: "EllipsisSpinner" },
  { id: "grid", name: "Grid Pulse", category: "Grid", component: "GridSpinner" },
  { id: "wave", name: "Wave Bars", category: "Bars", component: "WaveSpinner" },
  { id: "skewcube", name: "Skew Cube", category: "3D", component: "SkewCubeSpinner" },
  { id: "flip", name: "Flip Square", category: "Squares", component: "FlipSpinner" },
  { id: "dashed", name: "Dashed Circle", category: "Circle", component: "DashedCircleSpinner" },
  { id: "hourglass", name: "Hourglass", category: "Classic", component: "HourglassSpinner" },
  { id: "donut", name: "Donut Spinner", category: "Donut", component: "DonutSpinner" },
  { id: "cog", name: "Cog Spinner", category: "Icon", component: "CogSpinner" },
  { id: "diagonal", name: "Diagonal Bars", category: "Bars", component: "DiagonalSpinner" },
  { id: "triangle", name: "Rotating Triangle", category: "Polygon", component: "TriangleSpinner" },
  { id: "bars", name: "Classic Bars", category: "Bars", component: "BarsSpinner" },
  { id: "squares", name: "Rotating Squares", category: "Squares", component: "SquaresSpinner" },
  { id: "ripple", name: "Ripple", category: "Ripple", component: "RippleSpinner" },
  { id: "chase", name: "Spinner Chase", category: "Dots", component: "ChaseSpinner" },
  { id: "circle-fade", name: "Circle Fade", category: "Circle", component: "CircleFadeSpinner" },
  { id: "arc", name: "Arc Spinner", category: "SVG", component: "ArcSpinner" },
  { id: "semicircle", name: "Semi Circle", category: "Circle", component: "SemiCircleSpinner" },
  { id: "grad-svg", name: "Gradient SVG", category: "SVG", component: "GradientSVGSpinner" },
];
