// src/components/spinners/AllSpinners.jsx
import React from "react";

/* Each spinner accepts props: size (number px) and color (string) and className */
export const DotsSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`revdots ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }}>
    <span></span><span></span><span></span>
  </div>
);

export const PulseSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-pulse ${className}`} style={{ width: size, height: size, borderRadius: "50%", background: color, ["--spinner-size"]: `${size}px` }} />
);

export const BorderCircleSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-border ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }} />
);

export const DualRingSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-dualring ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }} />
);

export const SVGRingSpinner = ({ size = 48, color = "white", className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 50 50" style={{ ["--spinner-size"]: `${size}px` }}>
    <circle cx="25" cy="25" r="20" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 94.2" fill="none">
      <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export const EllipsisSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-ellipsis ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }}>
    <span></span><span></span><span></span><span></span>
  </div>
);

export const GridSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-grid ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }}>
    <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
  </div>
);

export const WaveSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-wave ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }}>
    <div style={{height:"30%"}}></div><div style={{height:"45%"}}></div><div style={{height:"60%"}}></div><div style={{height:"45%"}}></div><div style={{height:"30%"}}></div>
  </div>
);

export const SkewCubeSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-skew ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }}>
    <div className="cube" />
  </div>
);

export const FlipSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-flip ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }}>
    <div className="sq" />
  </div>
);

export const DashedCircleSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-dashed ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }} />
);

export const HourglassSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div style={{ width: size, height: size, display: "grid", placeItems: "center" }} className={className}>
    <svg width={size*0.6} height={size*0.6} viewBox="0 0 24 24" fill="none" stroke={color}><path d="M6 2v6a6 6 0 0 0 12 0V2M6 22v-6a6 6 0 0 1 12 0v6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite"/></path></svg>
  </div>
);

export const DonutSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-donut ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }} />
);

export const CogSpinner = ({ size = 48, color = "white", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ ["--spinner-size"]: `${size}px` }}>
    <g transform="translate(12,12)"><g><path d="M0-8a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" fill="none" stroke={color} strokeWidth="1.8" /><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1.2s" repeatCount="indefinite" /></g></g>
  </svg>
);

export const DiagonalSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-diagonal ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }}>
    <div></div><div></div><div></div><div></div>
  </div>
);

export const TriangleSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-triangle ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }}>
    <svg width={size} height={size} viewBox="0 0 100 100"><polygon points="50,10 90,85 10,85" fill="none" stroke={color} strokeWidth="6"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="0.9s" repeatCount="indefinite" /></polygon></svg>
  </div>
);

export const BarsSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-bars ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }}>
    <div></div><div></div><div></div><div></div>
  </div>
);

export const SquaresSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-squares ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }}>
    <div></div><div></div><div></div><div></div>
  </div>
);

export const RippleSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-ripple ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }} />
);

export const ChaseSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-chase ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }}>
    <span></span><span></span><span></span><span></span><span></span><span></span>
  </div>
);

export const CircleFadeSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-circlefade ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }}>
    <div></div><div></div><div></div>
  </div>
);

export const SemiCircleSpinner = ({ size = 48, color = "white", className = "" }) => (
  <div className={`rev-semicircle ${className}`} style={{ color, ["--spinner-size"]: `${size}px` }} />
);

export const ArcSpinner = ({ size = 48, color = "white", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ ["--spinner-size"]: `${size}px` }}>
    <path d="M50 10 a40 40 0 1 1 -0.1 0" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1s" repeatCount="indefinite"/>
    </path>
  </svg>
);

export const GradientSVGSpinner = ({ size = 48, color = "white", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ ["--spinner-size"]: `${size}px` }}>
    <defs>
      <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="32" stroke="url(#g1)" strokeWidth="8" strokeLinecap="round" fill="none">
      <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1s" repeatCount="indefinite" />
    </circle>
  </svg>
);
