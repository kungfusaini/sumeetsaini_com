import * as THREE from "three";
import { emit } from "../controller/main.js";
import {
	DEBUG_ROTATION_INCREMENT,
	DRAG_SENSITIVITY,
	DRAG_THRESHOLD_PX,
} from "./config.js";
import { clearIdleTimer, startIdleTimer } from "./helpers.js";
import { shapeState } from "./shapeState.js";

export function onPointerDown(x, y) {
	shapeState.dragging = true;
	shapeState.pointerDown = true;
	shapeState.wasDragging = false;
	shapeState.lastPointer = { x, y };
	clearIdleTimer();
	shapeState.autoRotateMultiplier = 0;
	if (shapeState.transitioning) {
		shapeState.transitioning = false;
		if (shapeState.transitionTimer) clearTimeout(shapeState.transitionTimer);
	}
}

export function onPointerMove(x, y) {
	if (!shapeState.dragging) return;

	// Calculate distance from initial pointer down position
	const deltaX = x - shapeState.lastPointer.x;
	const deltaY = y - shapeState.lastPointer.y;
	const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

	// Only consider it dragging if moved beyond threshold
	if (distance >= DRAG_THRESHOLD_PX) {
		shapeState.wasDragging = true;
		shapeState.userVel.y = -(x - shapeState.lastPointer.x) * DRAG_SENSITIVITY;
		shapeState.userVel.x = (y - shapeState.lastPointer.y) * DRAG_SENSITIVITY;
		shapeState.pyramid.rotation.y += shapeState.userVel.y;
		shapeState.pyramid.rotation.x += shapeState.userVel.x;
	}

	shapeState.lastPointer = { x, y };
	shapeState.hasInteracted = true;
	shapeState.autoRotateMultiplier = 0;
}

export function onPointerUp() {
	shapeState.dragging = false;
	shapeState.pointerDown = false;
	// Don't reset wasDragging immediately - let the click handler deal with it
	setTimeout(() => {
		shapeState.wasDragging = false;
	}, 50);
	startIdleTimer();
}

export function onKeyDown(event) {
	if (!shapeState.pyramid) return;
	switch (event.key) {
		case "d":
			shapeState.debugMode = !shapeState.debugMode;
			break;
		default:
			if (shapeState.debugMode) {
				const increment = DEBUG_ROTATION_INCREMENT;
				switch (event.key) {
					case "ArrowLeft":
						shapeState.pyramid.rotation.x -= increment;
						break;
					case "ArrowRight":
						shapeState.pyramid.rotation.x += increment;
						break;
					case "ArrowUp":
						shapeState.pyramid.rotation.y -= increment;
						break;
					case "ArrowDown":
						shapeState.pyramid.rotation.y += increment;
						break;
					case "z":
						shapeState.pyramid.rotation.z += increment;
						break;
					case "x":
						shapeState.pyramid.rotation.z -= increment;
						break;
				}
			}
			break;
	}
}

/* ---------- shape interaction ---------------------------------------- */
export function onShapeClick(ev, container) {
	if (shapeState.wasDragging) {
		return;
	}

	const rect = container.getBoundingClientRect();
	const mouse = new THREE.Vector2(
		((ev.clientX - rect.left) / rect.width) * 2 - 1,
		-((ev.clientY - rect.top) / rect.height) * 2 + 1,
	);
	const ray = new THREE.Raycaster();
	ray.setFromCamera(mouse, shapeState.camera);
	const hits = ray.intersectObjects(shapeState.pyramid.children);

	if (hits.length) {
		const userData = hits[0].object.userData;
		if (userData?.faceIndex !== undefined) {
			emit("shape:faceClicked", { faceIndex: userData.faceIndex });
		}
	}
}
