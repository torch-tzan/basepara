import { useState, useEffect, useRef, useCallback } from "react";

interface UseScrollVisibilityOptions {
  threshold?: number; // Minimum scroll distance before triggering hide/show
  bottomOffset?: number; // Distance from bottom to trigger show
  initialVisible?: boolean;
}

export const useScrollVisibility = (options: UseScrollVisibilityOptions = {}) => {
  const { threshold = 10, bottomOffset = 100, initialVisible = true } = options;
  const [isVisible, setIsVisible] = useState(initialVisible);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDiff = currentScrollY - lastScrollY.current;
        
        // Check if near bottom of page
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const isNearBottom = currentScrollY + clientHeight >= scrollHeight - bottomOffset;

        // Always show when near bottom
        if (isNearBottom) {
          setIsVisible(true);
          lastScrollY.current = currentScrollY;
          ticking.current = false;
          return;
        }

        // Only trigger if scroll distance exceeds threshold
        if (Math.abs(scrollDiff) > threshold) {
          if (scrollDiff > 0 && currentScrollY > 60) {
            // Scrolling down - hide
            setIsVisible(false);
          } else if (scrollDiff < 0) {
            // Scrolling up - show
            setIsVisible(true);
          }
          lastScrollY.current = currentScrollY;
        }

        // Always show when at top
        if (currentScrollY <= 10) {
          setIsVisible(true);
        }

        ticking.current = false;
      });
      ticking.current = true;
    }
  }, [threshold, bottomOffset]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return { isVisible };
};
