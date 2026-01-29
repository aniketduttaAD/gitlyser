"use client";

import { useState, useEffect } from "react";
import { LuArrowUp } from "react-icons/lu";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#4f6d6a] text-white shadow-lg transition hover:bg-[#425b59] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#4f6d6a] focus:ring-offset-2"
          aria-label="Scroll to top"
        >
          <LuArrowUp className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </button>
      )}
    </>
  );
}
