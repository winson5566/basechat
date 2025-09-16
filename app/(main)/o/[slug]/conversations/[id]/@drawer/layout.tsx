"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DrawerLayoutProps {
  children: React.ReactNode;
}

export default function DrawerLayout({ children }: DrawerLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Check if we're on a drawer route
  const isDrawerRoute = pathname.includes("/details/");

  useEffect(() => {
    if (isDrawerRoute) {
      setIsAnimating(true);
      // Small delay to ensure smooth animation
      const timer = setTimeout(() => {
        setIsOpen(true);
        setIsAnimating(false);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [isDrawerRoute]);

  const handleClose = () => {
    setIsAnimating(true);
    setIsOpen(false);
    // Navigate back after animation
    setTimeout(() => {
      router.back();
      setIsAnimating(false);
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isDrawerRoute) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? "opacity-50" : "opacity-0"
        } ${isAnimating ? "pointer-events-auto" : isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        onClick={handleBackdropClick}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close drawer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Drawer content */}
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
