import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  const { pathname, search, key } = useLocation();
  const navigationType = useNavigationType();

  // Save current scroll position before unmounting or changing location
  useEffect(() => {
    const handleScroll = () => {
      const positions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
      positions[key] = window.scrollY;
      sessionStorage.setItem('scrollPositions', JSON.stringify(positions));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [key]);

  useEffect(() => {
    // If it's a "back" or "forward" navigation (POP), restore scroll position
    if (navigationType === 'POP') {
      const positions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
      const pos = positions[key];
      
      if (pos !== undefined && pos > 0) {
        let attempts = 0;
        const maxAttempts = 200; // Wait longer if needed (up to ~10-15s)
        let lastSuccessfulScroll = 0;
        
        const tryScroll = () => {
          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = document.documentElement.clientHeight;
          
          // Force a scroll attempt to the saved position
          window.scrollTo(0, pos);
          
          const currentPos = window.scrollY;
          const reached = Math.abs(currentPos - pos) < 5;
          const isAtBottom = scrollHeight <= clientHeight + currentPos + 2;

          // If we reached it, we still want to keep trying for a bit
          // because content might still be popping in and causing the scroll position to jump
          if (reached) {
            if (attempts > 60) return; // Keep making sure for ~1s of frames
          }
          
          // Even if we are at bottom, if we haven't reached the target 'pos'
          // it means the page hasn't finished loading its height.
          // We should NOT return early. We should keep trying until maxAttempts.
          
          attempts++;
          if (attempts < maxAttempts) {
            requestAnimationFrame(tryScroll);
          }
        };

        // Delay more reliably to skip initial mount jank
        const timer = setTimeout(() => {
          requestAnimationFrame(tryScroll);
        }, 100);
        
        return () => clearTimeout(timer);
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      // For new navigations (PUSH/REPLACE), always scroll to top
      window.scrollTo(0, 0);
    }
  }, [pathname, search, key, navigationType]);

  return null;
}
