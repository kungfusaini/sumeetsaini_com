import * as THREE from "three";
import { DRAG_SENSITIVITY } from "./config.js";
import { clearIdleTimer, startIdleTimer } from "./helpers.js";
import { state } from "./state.js";

export function onPointerDown(x, y) {
	state.dragging = true;
	state.lastPointer = { x, y };
	clearIdleTimer();
	state.autoRotateMultiplier = 0;
}

export function onPointerMove(x, y) {
	if (!state.dragging) return;
	state.userVel.y = -(x - state.lastPointer.x) * DRAG_SENSITIVITY;
	state.userVel.x = (y - state.lastPointer.y) * DRAG_SENSITIVITY;
	state.pyramid.rotation.y += state.userVel.y;
	state.pyramid.rotation.x += state.userVel.x;
	state.lastPointer = { x, y };
	state.hasInteracted = true;
	state.autoRotateMultiplier = 0;
}

export function onPointerUp() {
	state.dragging = false;
	startIdleTimer();
}

/* ---------- raycast click ------------------------------------------- */
export function onClick(ev, container) {
	const rect = container.getBoundingClientRect();
	const mouse = new THREE.Vector2(
		((ev.clientX - rect.left) / rect.width) * 2 - 1,
		-((ev.clientY - rect.top) / rect.height) * 2 + 1,
	);
	const ray = new THREE.Raycaster();
	ray.setFromCamera(mouse, state.camera);
	const hits = ray.intersectObjects(state.pyramid.children);
	if (hits.length) {
		const faceData = hits[0].object.userData;
		if (faceData) window.location = faceData.url;
	}
}
