export const ANIMATION_TIMINGS = {
  INITIAL_DELAY: 2000,      // 0-2s: Cursor enters and appears
  HOVER_DURATION: 2000,     // 2-4s: Hover over option B
  CLICK_DELAY: 1000,        // 4-5s: Click + select
  INCORRECT_PAUSE: 3000,    // 5-8s: Show incorrect state
  MOVE_TO_BUTTON: 2000,     // 8-10s: Move to explanation button
  BUTTON_CLICK: 1000,       // 10-11s: Click explanation button
  DROPDOWN_EXPAND: 1000,    // 11-12s: Expand dropdown
  READING_TIME: 5000,       // 12-17s: Read explanation
  DROPDOWN_CLOSE: 1000,     // 17-18s: Close dropdown
  RESET_TRANSITION: 1000,   // 18-19s: Reset
  TOTAL_CYCLE: 19000
}

// Desktop cursor paths (relative to container, in pixels)
// Note: These are fallback values - actual positions are calculated dynamically using refs
export const CURSOR_PATHS = {
  START: { x: 50, y: 50 },
  OPTION_B: { x: 400, y: 380 },           // Wrong answer (١٤)
  EXPLANATION_BUTTON: { x: 550, y: 60 }   // Explanation button in header
}

// Mobile cursor paths (for screens < 640px)
export const CURSOR_PATHS_MOBILE = {
  START: { x: 30, y: 30 },
  OPTION_B: { x: 180, y: 320 },
  EXPLANATION_BUTTON: { x: 280, y: 40 }
}

/**
 * Get cursor paths based on device type
 */
export const getResponsiveCursorPath = (isMobile: boolean) =>
  isMobile ? CURSOR_PATHS_MOBILE : CURSOR_PATHS
