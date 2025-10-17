import * as THREE from "three";
import { DRAG_SENSITIVITY, FACES } from "./config.js";
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

export function onKeyDown(event) {
	if (!state.pyramid) return;
	switch (event.key) {
		case "d":
			state.debugMode = !state.debugMode;
			console.log("Debug mode:", state.debugMode ? "enabled" : "disabled");
			break;
		default:
			if (state.debugMode) {
				const increment = 0.05; // small increment for precision
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
		const object = hits[0].object;
		const userData = object.userData;
		if (userData && userData.faceIndex !== undefined) {
			const faceIndex = userData.faceIndex;
			const faceConfig = FACES[faceIndex];
			if (faceConfig.rotation) {
				state.pyramid.rotation.set(
					faceConfig.rotation.x,
					faceConfig.rotation.y,
					faceConfig.rotation.z,
				);
			}
			if (userData.url) {
				window.location = userData.url;
			}
			startIdleTimer(); // Start timer to reset hasInteracted for autorotation
		}
	}
}
