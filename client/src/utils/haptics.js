/**
 * SeaBite Haptics Utility
 * Provides subtle physical feedback for mobile interactions.
 */
export const triggerHaptic = (type = "medium") => {
  if (typeof window === "undefined" || !window.navigator.vibrate) return;

  switch (type) {
    case "heavy":
      window.navigator.vibrate([20, 10, 20]);
      break;
    case "medium":
      window.navigator.vibrate(15);
      break;
    case "soft":
      window.navigator.vibrate(8);
      break;
    default:
      window.navigator.vibrate(10);
  }
};

export default triggerHaptic;
