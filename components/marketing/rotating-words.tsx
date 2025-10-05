"use client";

import { useEffect, useMemo, useState } from "react";

interface RotatingWordsProps {
  words: string[];
  intervalMs?: number;
  className?: string;
}

export default function RotatingWords({ words, intervalMs = 2000, className }: RotatingWordsProps) {
  const safeWords = useMemo(() => (words && words.length > 0 ? words : [""]), [words]);
  const [index, setIndex] = useState(0);
  const longest = useMemo(
    () => safeWords.reduce((a, b) => (b.length > a.length ? b : a), safeWords[0] || ""),
    [safeWords],
  );

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % safeWords.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, safeWords.length]);

  return (
    <span
      className={`inline-block align-baseline transition-all duration-500 ${className || ""}`}
      style={{ minWidth: `${Math.max(longest.length, 1)}ch` }}
    >
      {safeWords.map((w, i) => (
        <span
          key={`${w}-${i}`}
          aria-hidden={i !== index}
          className={`absolute will-change-transform ${i === index ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"} transition-all duration-500`}
        >
          <span className="bg-gradient-to-r from-[#68D391] via-[#60A5FA] to-[#A78BFA] bg-clip-text text-transparent">
            {w}
          </span>
        </span>
      ))}
      {/* Reserve space to prevent layout shift */}
      <span className="invisible whitespace-nowrap">{longest}</span>
    </span>
  );
}
