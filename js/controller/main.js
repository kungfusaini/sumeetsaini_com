import * as THREE from "three";
import {
	CONTENT_POSITION_DESKTOP,
	CONTENT_POSITION_MOBILE,
	CONTENT_SCALE,
	INITIAL_PYRAMID_ROTATION,
	MOBILE_BREAKPOINT,
} from "../shape/config.js";
import { updateTextSprite } from "../shape/helpers.js";
import { shapeState } from "../shape/shapeState.js";
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

	// Reset previously selected face if any (and it's different from current selection)
	if (
		controllerState.currentFace !== null &&
		controllerState.currentFace !== faceIndex &&
		shapeState.textSprites[controllerState.currentFace]
	) {
		const prevFace = FACES[controllerState.currentFace];
		updateTextSprite(
			shapeState.textSprites[controllerState.currentFace],
			prevFace.text,
			false,
		);
	}

	// Update text sprite for selected face
	if (shapeState.textSprites[faceIndex]) {
		updateTextSprite(shapeState.textSprites[faceIndex], face.text, true);
	}

	// Convert Euler rotation to quaternion for smooth interpolation
	const targetEuler = new THREE.Euler(
		face.rotation.x,
		face.rotation.y,
		face.rotation.z,
	);
	const targetQuaternion = new THREE.Quaternion();
	targetQuaternion.setFromEuler(targetEuler);

	emit("shape:moveToPosition", {
		rotation: face.rotation,
		quaternion: targetQuaternion,
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
	shapeState.selectedFace = faceIndex;
}

export function handlePopupClose() {
	// Reset text sprite for previously selected face
	if (
		controllerState.currentFace !== null &&
		shapeState.textSprites[controllerState.currentFace]
	) {
		const prevFace = FACES[controllerState.currentFace];
		updateTextSprite(
			shapeState.textSprites[controllerState.currentFace],
			prevFace.text,
			false,
		);
	}

	// Tell shape to reset to center
	const resetEuler = new THREE.Euler(
		INITIAL_PYRAMID_ROTATION.x,
		INITIAL_PYRAMID_ROTATION.y,
		INITIAL_PYRAMID_ROTATION.z,
	);
	const resetQuaternion = new THREE.Quaternion();
	resetQuaternion.setFromEuler(resetEuler);

	emit("shape:resetPosition", {
		quaternion: resetQuaternion,
	});

	// Update controller state
	controllerState.contentVisible = false;
	controllerState.currentFace = null;
	shapeState.selectedFace = null;

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
