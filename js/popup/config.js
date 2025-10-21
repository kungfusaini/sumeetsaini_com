// Popup-specific configuration (content display, transitions)
export const POPUP_FADE_IN_DURATION_MS = 3000;
export const POPUP_FADE_OUT_DURATION_MS = 300;

// Set CSS variables for popup fade durations
document.documentElement.style.setProperty(
	"--popup-fade-in-duration",
	`${POPUP_FADE_IN_DURATION_MS}ms`,
);
document.documentElement.style.setProperty(
	"--popup-fade-out-duration",
	`${POPUP_FADE_OUT_DURATION_MS}ms`,
);
