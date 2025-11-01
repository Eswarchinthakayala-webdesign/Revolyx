// src/components/animations/Plasma.jsx
import React, { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 0.5, 0.2];
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
};

// (vertex & fragment shaders unchanged — using #version 300 es, requires WebGL2)
const vertex = `#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCustomColor;
uniform float uUseCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseInteractive;
out vec4 fragColor;

/* --- mainImage body (unchanged) --- */
void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;
  
  vec2 mouseOffset = (uMouse - center) * 0.0002;
  C += mouseOffset * length(C - center) * step(0.5, uMouseInteractive);
  
  float i, d, z, T = iTime * uSpeed * uDirection;
  vec3 O, p, S;

  for (vec2 r = iResolution.xy, Q; ++i < 60.; O += o.w/d*o.xyz) {
    p = z*normalize(vec3(C-.5*r,r.y)); 
    p.z -= 4.; 
    S = p;
    d = p.y-T;
    
    p.x += .4*(1.+p.y)*sin(d + p.x*0.1)*cos(.34*d + p.x*0.05); 
    Q = p.xz *= mat2(cos(p.y+vec4(0,11,33,0)-T)); 
    z+= d = abs(sqrt(length(Q*Q)) - .25*(5.+S.y))/3.+8e-4; 
    o = 1.+sin(S.y+p.z*.5+S.z-length(S-p)+vec4(2,1,0,8));
  }
  
  o.xyz = tanh(O/1e4);
}

bool finite1(float x){ return !(isnan(x) || isinf(x)); }
vec3 sanitize(vec3 c){
  return vec3(
    finite1(c.r) ? c.r : 0.0,
    finite1(c.g) ? c.g : 0.0,
    finite1(c.b) ? c.b : 0.0
  );
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = sanitize(o.rgb);
  
  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 customColor = intensity * uCustomColor;
  vec3 finalColor = mix(rgb, customColor, step(0.5, uUseCustomColor));
  
  float alpha = length(rgb) * uOpacity;
  fragColor = vec4(finalColor, alpha);
}
`;

export const Plasma = ({
  color = "#ffffff",
  speed = 1,
  direction = "forward",
  scale = 1,
  opacity = 1,
  mouseInteractive = true,
  style,
}) => {
  const containerRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Ensure container has visible size. If parent doesn't set height,
    // fallback to viewport height so canvas isn't zero-sized.
    if (!container.style.height) {
      container.style.minHeight = "100vh";
    }
    container.style.position = container.style.position || "relative";

    const useCustomColor = color ? 1.0 : 0.0;
    const customColorRgb = color ? hexToRgb(color) : [1, 1, 1];
    const directionMultiplier = direction === "reverse" ? -1.0 : 1.0;

    // Request WebGL2 context. If not present, bail early (this shader uses #version 300 es).
    let renderer;
    try {
      // Try WebGL2 by creating Renderer with webgl:2
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch (err) {
      console.error("Failed to create WebGL2 renderer (no WebGL2):", err);
      // Fallback: try webgl1 (will not work with #version 300 es shader)
      try {
        renderer = new Renderer({
          webgl: 1,
          alpha: true,
          antialias: false,
          dpr: Math.min(window.devicePixelRatio || 1, 2),
        });
        console.warn("Fell back to WebGL1 renderer. Shader (300 es) may fail.");
      } catch (err2) {
        console.error("No WebGL support available:", err2);
        return;
      }
    }

    const gl = renderer.gl;
    const canvas = gl.canvas;

    // Make sure canvas is visible inside container
    canvas.style.display = "block";
    canvas.style.position = "absolute";
    canvas.style.inset = "0"; // shorthand for top:0; left:0; right:0; bottom:0;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.background = "transparent";
    canvas.style.zIndex = "0"; // ensure it's not behind page backgrounds
    container.appendChild(canvas);

    // Create geometry/program
    const geometry = new Triangle(gl);

    let program;
    try {
      program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          iTime: { value: 0 },
          iResolution: { value: new Float32Array([1, 1]) },
          uCustomColor: { value: new Float32Array(customColorRgb) },
          uUseCustomColor: { value: useCustomColor },
          uSpeed: { value: speed * 0.4 },
          uDirection: { value: directionMultiplier },
          uScale: { value: scale },
          uOpacity: { value: opacity },
          uMouse: { value: new Float32Array([0, 0]) },
          uMouseInteractive: { value: mouseInteractive ? 1.0 : 0.0 },
        },
      });
    } catch (progErr) {
      console.error("Shader Program creation failed — shader compile/link error:", progErr);
      // Clean up renderer & exit gracefully
      try {
        if (renderer && typeof renderer.gl.getExtension === "function") {
          const loseExt = renderer.gl.getExtension("WEBGL_lose_context");
          if (loseExt) loseExt.loseContext();
        }
      } catch (e) {}
      return;
    }

    const mesh = new Mesh(gl, { geometry, program });

    // Mouse handler (pixel coords)
    const handleMouseMove = (e) => {
      if (!mouseInteractive) return;
      const rect = container.getBoundingClientRect();
      mousePos.current.x = e.clientX - rect.left;
      mousePos.current.y = e.clientY - rect.top;
      const mu = program.uniforms.uMouse.value;
      mu[0] = mousePos.current.x;
      mu[1] = mousePos.current.y;
    };

    if (mouseInteractive) container.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Resize helper
    const setSize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height);
      const res = program.uniforms.iResolution.value;
      // writing drawingBuffer size is the most reliable for shaders
      res[0] = gl.drawingBufferWidth;
      res[1] = gl.drawingBufferHeight;
    };

    const ro = new ResizeObserver(setSize);
    ro.observe(container);
    setSize();

    // Animation loop
    let raf = 0;
    const t0 = performance.now();
    const loop = (t) => {
      let timeValue = (t - t0) * 0.001;
      if (direction === "pingpong") {
        const cycle = Math.sin(timeValue * 0.5) * directionMultiplier;
        program.uniforms.uDirection.value = cycle;
      } else {
        program.uniforms.uDirection.value = directionMultiplier;
      }
      program.uniforms.iTime.value = timeValue;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // CLEANUP
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (mouseInteractive) container.removeEventListener("mousemove", handleMouseMove);

      // Best-effort resource disposal (ogl API may vary by version)
      try {
        // remove canvas
        if (canvas && canvas.parentElement === container) container.removeChild(canvas);
      } catch (err) {
        console.warn("Canvas removal failed:", err);
      }

      try {
        // dispose program if method exists
        if (program && typeof program.dispose === "function") program.dispose();
        if (program && typeof program.delete === "function") program.delete();
      } catch (err) {
        // ignore
      }
      try {
        if (geometry && typeof geometry.dispose === "function") geometry.dispose();
      } catch (err) {}

      try {
        if (renderer && typeof renderer.dispose === "function") renderer.dispose();
        // try to lose context
        if (renderer && renderer.gl) {
          const loseExt = renderer.gl.getExtension("WEBGL_lose_context");
          if (loseExt) loseExt.loseContext();
        }
      } catch (err) {
        console.warn("Renderer cleanup error:", err);
      }
    };
  }, [color, speed, direction, scale, opacity, mouseInteractive]);

  // ensure container will have at-least viewport height by default (prevent 0-height)
  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden"
      style={{ minHeight: "100vh", position: "relative", ...style }}
    />
  );
};

export default Plasma;
