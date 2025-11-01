// src/components/animations/pixelblast/pixelplase.jsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "postprocessing"; // works with v7+
import "./pixelblast.css";

const PixelBlast = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let renderer, scene, camera, composer, animationFrameId;
    const container = containerRef.current;

    // Create canvas
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    // Try to get WebGL2, fallback to WebGL1
    let gl = canvas.getContext("webgl2");
    if (!gl) {
      console.warn("WebGL2 not supported, falling back to WebGL1.");
      gl = canvas.getContext("webgl");
    }

    if (!gl) {
      alert("Your device does not support WebGL.");
      return;
    }

    // Create renderer
    renderer = new THREE.WebGLRenderer({
      canvas,
      context: gl,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 1);

    // Create scene
    scene = new THREE.Scene();

    // Create camera
    camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    scene.add(camera);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1.2);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Pixel particle system
    const geometry = new THREE.BufferGeometry();
    const numParticles = 2000;
    const positions = new Float32Array(numParticles * 3);

    for (let i = 0; i < numParticles * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Safe postprocessing setup
    try {
      composer = new EffectComposer(renderer);
    } catch (e) {
      console.warn("Postprocessing not initialized:", e.message);
      composer = null;
    }

    // Detect mobile
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    // Animation loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      particles.rotation.x += 0.002;
      particles.rotation.y += 0.004;

      // Mobile performance adjustment
      if (isMobile) {
        particles.rotation.x += 0.001;
        particles.rotation.y += 0.002;
      }

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (composer) composer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      container.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pixel-blast-container"
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    />
  );
};

export default PixelBlast;
