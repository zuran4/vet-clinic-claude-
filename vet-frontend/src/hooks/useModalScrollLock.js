import { useEffect, useRef } from "react";

/**
 * iOS Safari-safe scroll lock για full-screen modals:
 * - Κλειδώνει το body με position:fixed (όχι απλό overflow:hidden — δεν αρκεί
 *   στο iOS, η σελίδα από κάτω παραμένει "pannable" και παρασύρει το modal).
 * - Μπλοκάρει το scroll-chaining: όταν το εσωτερικό scroll φτάσει στο πάνω/κάτω
 *   όριο και συνεχίζεις να σέρνεις, το rubber-band bounce περνάει (chaining)
 *   στο backdrop από κάτω — το preventDefault εδώ το σταματάει.
 *
 * Χρήση:
 *   const scrollRef = useModalScrollLock(isOpen);
 *   <div style={{ touchAction: "none" }}> ... backdrop ...
 *     <div ref={scrollRef} style={{ touchAction: "pan-y", overscrollBehavior: "contain" }} className="overflow-y-auto">
 *
 * lockBody=false: όταν το modal είναι φωλιασμένο μέσα σε άλλο modal που ήδη
 * κλειδώνει το body (π.χ. CustomerPurchasesModal με lockScroll=false πάνω από
 * CustomerProfileModal) — το scroll-chaining fix παραμένει ενεργό, απλά δεν
 * ξαναπειράζει/ξεκλειδώνει το body.
 */
export function useModalScrollLock(isOpen, lockBody = true) {
  const scrollRef = useRef(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    if (!isOpen || !lockBody) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      overflow: style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
    };

    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      style.position = prev.position;
      style.top = prev.top;
      style.left = prev.left;
      style.right = prev.right;
      style.overflow = prev.overflow;
      document.documentElement.style.overflow = prev.htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isOpen) return;

    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const deltaY = e.touches[0].clientY - touchStartY.current;
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

      if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
        e.preventDefault();
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isOpen]);

  return scrollRef;
}
