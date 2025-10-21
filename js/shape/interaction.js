import { state } from "../shared/state.js";
import {
	DEBUG_ROTATION_INCREMENT,
	DRAG_SENSITIVITY,
	DRAG_THRESHOLD_PX,
} from "./config.js";
import { clearIdleTimer, startIdleTimer } from "./helpers.js";

export function onPointerDown(x, y) {
	state.dragging = true;
	state.pointerDown = true;
	state.wasDragging = false;
	state.lastPointer = { x, y };
	clearIdleTimer();
	state.autoRotateMultiplier = 0;
	if (state.transitioning) {
		state.transitioning = false;
		if (state.transitionTimer) clearTimeout(state.transitionTimer);
	}
}

export function onPointerMove(x, y) {
	if (!state.dragging) return;

	// Calculate distance from initial pointer down position
	const deltaX = x - state.lastPointer.x;
	const deltaY = y - state.lastPointer.y;
	const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

	// Only consider it dragging if moved beyond threshold
	if (distance >= DRAG_THRESHOLD_PX) {
		state.wasDragging = true;
		state.userVel.y = -(x - state.lastPointer.x) * DRAG_SENSITIVITY;
		state.userVel.x = (y - state.lastPointer.y) * DRAG_SENSITIVITY;
		state.pyramid.rotation.y += state.userVel.y;
		state.pyramid.rotation.x += state.userVel.x;
	}

	state.lastPointer = { x, y };
	state.hasInteracted = true;
	state.autoRotateMultiplier = 0;
}

export function onPointerUp() {
	state.dragging = false;
	state.pointerDown = false;
	startIdleTimer();
}

export function onKeyDown(event) {
	if (!state.pyramid) return;
	switch (event.key) {
		case "d":
			state.debugMode = !state.debugMode;
			console.log("Debug mode:", state.debugMode ? "enabled" : "disabled");
			break;
		default:
			if (state.debugMode) {
				const increment = DEBUG_ROTATION_INCREMENT; // small increment for precision
				switch (event.key) {
					case "ArrowLeft":
						state.pyramid.rotation.x -= increment;
						break;
					case "ArrowRight":
						state.pyramid.rotation.x += increment;
						break;
					case "ArrowUp":
						state.pyramid.rotation.y -= increment;
						break;
					case "ArrowDown":
						state.pyramid.rotation.y += increment;
						break;
					case "z":
						state.pyramid.rotation.z += increment;
						break;
					case "x":
						state.pyramid.rotation.z -= increment;
						break;
				}
			}
			break;
	}
}

/* ---------- shape interaction ---------------------------------------- */
export function onShapeClick(_ev, _container) {
	// This function will be called by the popup module
	// The actual click handling is now in popup/interaction.js
	// This is kept for compatibility but can be removed if not needed
}
