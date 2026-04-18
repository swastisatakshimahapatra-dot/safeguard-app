import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// ✅ Stores scroll positions for each route
const scrollPositions = {};

const ScrollManager = () => {
  const location = useLocation();
  const navigationType = useNavigationType(); // ✅ "PUSH" | "POP" | "REPLACE"
  const prevPathRef = useRef(null);

  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevPathRef.current;

    // ✅ Save scroll position of the page we're LEAVING
    if (prevPath && prevPath !== currentPath) {
      scrollPositions[prevPath] = window.scrollY;
    }

    if (navigationType === "POP") {
      // ✅ Browser back/forward button OR navigate(-1)
      // Restore saved scroll position
      const savedY = scrollPositions[currentPath];
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedY !== undefined ? savedY : 0,
          behavior: "instant",
        });
      });
    } else if (navigationType === "PUSH" || navigationType === "REPLACE") {
      // ✅ New page navigation — always scroll to top
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    // ✅ Update prev path
    prevPathRef.current = currentPath;
  }, [location.pathname, navigationType]);

  return null;
};

export default ScrollManager;
