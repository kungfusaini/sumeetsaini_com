import {
	CONTENT_POSITION_DESKTOP,
	CONTENT_POSITION_MOBILE,
	CONTENT_SCALE,
	MOBILE_BREAKPOINT,
} from "../shape/config.js";
import { FACES } from "../shared/faces.js";

// Controller-specific state
const controllerState = {
	contentVisible: false,
	currentFace: null,
};

/* ---------- event system ---------- */
const eventListeners = new Map();

export function on(event, callback) {
	if (!eventListeners.has(event)) {
		eventListeners.set(event, []);
	}
	eventListeners.get(event).push(callback);
}

export function emit(event, data) {
	if (eventListeners.has(event)) {
		eventListeners.get(event).forEach((callback) => {
			callback(data);
		});
	}
}

/* ---------- controller logic ---------- */
export function handleFaceClick(faceIndex) {
	const face = FACES[faceIndex];
	if (!face) {
		console.error("Face not found for index:", faceIndex);
		return;
	}

	emit("shape:moveToPosition", {
		rotation: face.rotation,
		position:
			window.innerWidth <= MOBILE_BREAKPOINT
				? CONTENT_POSITION_MOBILE
				: CONTENT_POSITION_DESKTOP,
		scale: CONTENT_SCALE,
	});

	emit("popup:showContent", {
		contentPath: face.contentPath,
		title: face.text,
	});

	controllerState.contentVisible = true;
	controllerState.currentFace = faceIndex;
}

export function handlePopupClose() {
	// Tell shape to reset to center
	emit("shape:resetPosition");

	// Update controller state
	controllerState.contentVisible = false;
	controllerState.currentFace = null;

	// Tell shape to handle popup close timing
	emit("shape:handlePopupClose");
}

/* ---------- initialization ---------- */
export function initController() {
	// Listen for face clicks from shape
	on("shape:faceClicked", (data) => {
		handleFaceClick(data.faceIndex);
	});

	// Listen for popup close events
	on("popup:closed", () => {
		handlePopupClose();
	});
}
