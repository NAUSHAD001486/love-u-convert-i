'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show header at top or when scrolling up
      if (currentScrollY < 10 || currentScrollY < lastScrollY) {
        setIsVisible(true);
      } 
      // Hide header when scrolling down
      else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-[50px] bg-white border-b border-gray-200 shadow-sm transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="text-[#7C3AED] font-semibold text-lg">
          Love U convert
        </div>
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
          All tools
        </Link>
      </div>
    </header>
  );
}
