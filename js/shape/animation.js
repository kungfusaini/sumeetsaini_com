import { VELOCITY_DAMPING } from "./config.js";
import {
	getResponsiveCameraY,
	getResponsiveCameraZ,
	getResponsiveFOV,
	getResponsiveLookAtY,
} from "./helpers.js";
import { state } from "./state.js";

export function animate() {
	requestAnimationFrame(animate);
	if (!state.hasInteracted && state.autoRotateEnabled) {
		state.autoRotateMultiplier = Math.min(state.autoRotateMultiplier + 0.01, 1);
		state.pyramid.rotation.x += state.baseSpeed.x * state.autoRotateMultiplier;
		state.pyramid.rotation.y += state.baseSpeed.y * state.autoRotateMultiplier;
	} else if (!state.dragging) {
		state.pyramid.rotation.x += state.userVel.x;
		state.pyramid.rotation.y += state.userVel.y;
		state.userVel.x *= VELOCITY_DAMPING;
		state.userVel.y *= VELOCITY_DAMPING;
	}
	if (state.debugMode) {
		console.log(
			"Pyramid Position:",
			state.pyramid.position.x.toFixed(3),
			state.pyramid.position.y.toFixed(3),
			state.pyramid.position.z.toFixed(3),
		);
		console.log(
			"Pyramid Rotation:",
			state.pyramid.rotation.x.toFixed(3),
			state.pyramid.rotation.y.toFixed(3),
			state.pyramid.rotation.z.toFixed(3),
		);
		console.log(
			"User Velocity:",
			state.userVel.x.toFixed(3),
			state.userVel.y.toFixed(3),
		);
	}
	state.renderer.render(state.scene, state.camera);
}

/* ---------- resize -------------------------------------------------- */
export function onResize(container) {
	const w = container.clientWidth;
	const h = container.clientHeight;
	state.renderer.setSize(w, h);
	state.camera.aspect = w / h;
	state.camera.fov = getResponsiveFOV(w);
	state.camera.position.z = getResponsiveCameraZ(w);
	state.camera.position.y = getResponsiveCameraY(w);
	const lookAtY = getResponsiveLookAtY(w);
	state.camera.lookAt(0, lookAtY, 0);
	state.camera.updateProjectionMatrix();
}
