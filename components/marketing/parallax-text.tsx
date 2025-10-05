"use client";

import { useEffect, useRef, useState } from "react";

export default function ParallaxText({
  children,
  speed = 0.6,
  className = "",
  baseOffset = 0,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  baseOffset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [y, setY] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (!ref.current) return;
      // Use the closest section as the scroll container for progress
      const section = ref.current.closest("section") as HTMLElement | null;
      const container = section ?? ref.current.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const start = rect.top + window.scrollY; // section top absolute
      const height = Math.max(container.offsetHeight, 1);
      const scrollY = window.scrollY;
      const vh = window.innerHeight || 800;

      // Start moving as soon as the section begins to enter the viewport
      const startAt = start - vh * 0.9; // earlier start (when bottom of viewport is ~10% above section top)
      const totalRange = height + vh * 0.9; // normalize so progress ends when section fully leaves
      const progress = Math.min(1, Math.max(0, (scrollY - startAt) / totalRange));

      // Move slower than background after entering the section
      const rangePx = 260; // max travel distance (larger => faster/more motion)
      const offset = progress * rangePx * (1 - speed);

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setY(offset));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ transform: `translateY(${y + baseOffset}px)`, willChange: "transform" }}
    >
      {children}
    </div>
  );
}
