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

  if (!isDrawerRoute) {
    return null;
  }

  return (
    <div className="absolute top-0 left-0 right-0 lg:static lg:h-full">
      <div className="flex-1 w-full h-full lg:min-w-[400px] lg:w-[400px] rounded-[24px] p-8 mr-6 mb-4 bg-[#F5F5F7] max-h-[calc(100vh-155px)] overflow-y-auto relative">
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
        {children}
      </div>
    </div>
  );
}
