import { FocusEvent } from "react";

/**
 * Prevents the browser from scrolling the page when an input inside
 * a bottom sheet / drawer receives focus (keyboard opening).
 */
export const preventScrollOnFocus = (e: FocusEvent<HTMLElement>) => {
  const target = e.currentTarget;
  // Override scrollIntoView on the element to prevent browser auto-scroll
  const original = target.scrollIntoView.bind(target);
  target.scrollIntoView = () => {};
  // Restore after browser has finished its focus-scroll logic
  setTimeout(() => {
    target.scrollIntoView = original;
  }, 100);
};
