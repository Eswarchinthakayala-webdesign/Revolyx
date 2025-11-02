import React, { useEffect, useRef } from "react";

export function Meteors({ number = 30 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    for (let i = 0; i < number; i++) {
      const meteor = document.createElement("div");
      meteor.className =
        "meteor absolute w-[2px] h-[100px] rounded-full opacity-70 " +
        "bg-gradient-to-t from-transparent to-black/80 dark:to-white/90";
      meteor.style.left = `${Math.random() * 100}%`;
      meteor.style.top = `${Math.random() * 100}%`;
      meteor.style.animation = `meteor-fall ${1 + Math.random() * 2}s linear infinite`;
      meteor.style.animationDelay = `${Math.random() * 3}s`;
      container.appendChild(meteor);
    }

    return () => {
      container.innerHTML = "";
    };
  }, [number]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
    />
  );
}
