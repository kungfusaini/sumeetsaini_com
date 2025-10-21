import * as THREE from "three";
import {
	CONTENT_POSITION_DESKTOP,
	CONTENT_POSITION_MOBILE,
	CONTENT_SCALE,
	FACES,
	MOBILE_BREAKPOINT,
} from "../shape/config.js";
import { startIdleTimer } from "../shape/helpers.js";
import { state } from "../shared/state.js";
import { POPUP_FADE_DURATION_MS } from "./config.js";

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
	state.skipPause = true; // Skip pause for immediate autorotation after popup close
	state.popupCloseTime = Date.now(); // Record when popup was closed
	state.transitioning = true;
	const main = document.querySelector("main");
	document.body.classList.remove("content-mode"); // Trigger fade out
	setTimeout(() => {
		main.style.display = "none";
		main.innerHTML = "";
	}, POPUP_FADE_DURATION_MS);
}

export function handleFaceClick(faceIndex) {
	const faceConfig = FACES[faceIndex];
	state.transitioning = true;
	state.hasInteracted = true; // Stop autorotate immediately
	state.skipPause = false; // Reset flag for normal transition completion
	state.targetRotation = { ...faceConfig.rotation };
	// Set target position based on screen size
	const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
	state.targetPosition = isMobile
		? CONTENT_POSITION_MOBILE // Up on mobile
		: CONTENT_POSITION_DESKTOP; // Left on desktop
	if (state.transitionTimer) clearTimeout(state.transitionTimer);
	state.autoRotateMultiplier = 0;
	state.contentVisible = true;
	state.targetScale = CONTENT_SCALE;
	// Show and populate content
	const main = document.querySelector("main");
	main.style.display = "block";
	main.innerHTML = `
			<button id="close-content" style="position: absolute; top: 1rem; right: 1rem; background: var(--dark-grey); color: var(--cream); border: none; padding: 0.5rem; cursor: pointer;">×</button>
			${faceConfig.content || "<p>No content available.</p>"}
		`;
	// Trigger fade in after content is rendered
	requestAnimationFrame(() => {
		document.body.classList.add("content-mode");
	});
	startIdleTimer(); // Start timer to reset hasInteracted for autorotation
}

export function onPopupClick(ev, container) {
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
			handleFaceClick(faceIndex);
		}
	}
}
