import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Every route change should open the new page from the very top.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // CSS has smooth scrolling enabled; force an instant jump here.
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  }, [pathname]);

  return null;
};

export default ScrollToTop;
