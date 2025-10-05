"use client";

import { useState } from "react";

export interface FAQItem {
  q: string;
  a: string;
}

export default function FAQ({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="w-full max-w-4xl">
      {items.map((item, idx) => (
        <div key={idx} className="border-b border-white/10">
          <button
            className="w-full text-left py-5 flex items-center justify-between hover:text-white/90"
            onClick={() => setOpen((o) => (o === idx ? null : idx))}
            aria-expanded={open === idx}
          >
            <span className="text-lg md:text-xl">{item.q}</span>
            <span className="ml-4 text-white/50">{open === idx ? "–" : "+"}</span>
          </button>
          {open === idx && <div className="pb-6 text-white/70 leading-relaxed text-base md:text-lg">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}
