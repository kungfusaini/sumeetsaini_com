import * as THREE from "three";
import { DRAG_SENSITIVITY, FACES } from "./config.js";
import { clearIdleTimer, startIdleTimer } from "./helpers.js";
import { state } from "./state.js";

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
	state.wasDragging = true;
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
export function closeContent() {
	state.contentVisible = false;
	state.targetPosition = { x: 0, y: 0, z: 0 };
	state.targetScale = 1;
	// Preserve current rotation - don't change it during close transition
	state.targetRotation = {
		x: state.pyramid.rotation.x,
		y: state.pyramid.rotation.y,
		z: state.pyramid.rotation.z,
	};
	state.hasInteracted = true; // Force transition branch instead of autorotation branch
	state.transitioning = true;
	const main = document.querySelector("main");
	main.style.display = "none";
	main.style.opacity = "0";
	main.innerHTML = "";
}

export function onClick(ev, container) {
	if (state.wasDragging) {
		state.wasDragging = false;
		return;
	}
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
			state.transitioning = true;
			state.hasInteracted = true; // Stop autorotate immediately
			state.targetRotation = { ...faceConfig.rotation };
			// Set target position based on screen size
			const isMobile = window.innerWidth <= 600;
			state.targetPosition = isMobile
				? { x: 0, y: 1, z: 0 } // Up on mobile
				: { x: -3.5, y: 0, z: 0 }; // Left on desktop
			if (state.transitionTimer) clearTimeout(state.transitionTimer);
			state.autoRotateMultiplier = 0;
			state.contentVisible = true;
			state.targetScale = 0.7;
			// Show and populate content
			const main = document.querySelector("main");
			main.style.display = "block";
			main.style.opacity = "1";
			main.innerHTML = `
 				<button id="close-content" style="position: absolute; top: 1rem; right: 1rem; background: var(--dark-grey); color: var(--cream); border: none; padding: 0.5rem; cursor: pointer;">×</button>
 				${faceConfig.content || "<p>No content available.</p>"}
 			`;
			startIdleTimer(); // Start timer to reset hasInteracted for autorotation
		}
	}
}
