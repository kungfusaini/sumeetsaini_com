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

	// Check if we've moved beyond threshold to mark as dragging
	if (distance >= DRAG_THRESHOLD_PX) {
		shapeState.wasDragging = true;
	}

	// Always update rotation when dragging for smooth movement
	// Use quaternion rotation for more consistent behavior
	const dragY = (x - shapeState.lastPointer.x) * DRAG_SENSITIVITY;
	const dragX = (y - shapeState.lastPointer.y) * DRAG_SENSITIVITY;

	// Create rotation quaternions for world-space rotation
	const yawQuaternion = new THREE.Quaternion();
	yawQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), dragY);

	const pitchQuaternion = new THREE.Quaternion();
	pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), dragX);

	// Apply rotations in world space for consistent behavior
	shapeState.pyramid.quaternion.multiplyQuaternions(
		yawQuaternion,
		shapeState.pyramid.quaternion,
	);
	shapeState.pyramid.quaternion.multiplyQuaternions(
		pitchQuaternion,
		shapeState.pyramid.quaternion,
	);

	// Update velocity for smooth deceleration when released
	shapeState.userVel.y = dragY;
	shapeState.userVel.x = dragX;

	shapeState.lastPointer = { x, y };
	shapeState.hasInteracted = true;
	shapeState.autoRotateMultiplier = 0;

	// Don't hide guidance on drag - only on click or popup open
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
			if (shapeState.debugMode) {
				// Disable autorotate when debug mode is on
				shapeState.autoRotateEnabled = false;
				console.log("Debug mode ON");
			} else {
				// Re-enable autorotate when debug mode is off
				shapeState.autoRotateEnabled = true;
				console.log("Debug mode OFF");
			}
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
				// Print current rotation after each input
				const r = shapeState.pyramid.rotation;
				console.log(`x: ${r.x.toFixed(3)}, y: ${r.y.toFixed(3)}, z: ${r.z.toFixed(3)}`);
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
	
	// Filter to only mesh objects (faces), exclude sprites for accurate click detection
	const faceMeshes = shapeState.pyramid.children.filter(
		child => child.isMesh
	);
	const hits = ray.intersectObjects(faceMeshes);

	if (hits.length) {
		const userData = hits[0].object.userData;
		if (userData?.faceIndex !== undefined) {
			// Hide guidance immediately when face is clicked
			if (shapeState.guidanceShown) {
				shapeState.guidanceElement.style.opacity = "0";
				shapeState.guidanceShown = false;
			}
			// Clear guidance timer if it exists
			if (shapeState.guidanceTimer) {
				clearTimeout(shapeState.guidanceTimer);
				shapeState.guidanceTimer = null;
			}
			emit("shape:faceClicked", { faceIndex: userData.faceIndex });
		}
	}
}
