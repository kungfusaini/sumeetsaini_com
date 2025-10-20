import * as THREE from "three";
import {
	PAUSE_DURATION_MS,
	TRANSITION_SPEED,
	VELOCITY_DAMPING,
} from "./config.js";
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
	} else if (state.transitioning) {
		state.pyramid.rotation.x = THREE.MathUtils.lerp(
			state.pyramid.rotation.x,
			state.targetRotation.x,
			TRANSITION_SPEED,
		);
		state.pyramid.rotation.y = THREE.MathUtils.lerp(
			state.pyramid.rotation.y,
			state.targetRotation.y,
			TRANSITION_SPEED,
		);
		state.pyramid.rotation.z = THREE.MathUtils.lerp(
			state.pyramid.rotation.z,
			state.targetRotation.z,
			TRANSITION_SPEED,
		);
		state.pyramid.position.x = THREE.MathUtils.lerp(
			state.pyramid.position.x,
			state.targetPosition.x,
			TRANSITION_SPEED,
		);
		state.pyramid.position.y = THREE.MathUtils.lerp(
			state.pyramid.position.y,
			state.targetPosition.y,
			TRANSITION_SPEED,
		);
		state.pyramid.position.z = THREE.MathUtils.lerp(
			state.pyramid.position.z,
			state.targetPosition.z,
			TRANSITION_SPEED,
		);
		state.pyramid.scale.x = THREE.MathUtils.lerp(
			state.pyramid.scale.x,
			state.targetScale,
			TRANSITION_SPEED,
		);
		state.pyramid.scale.y = THREE.MathUtils.lerp(
			state.pyramid.scale.y,
			state.targetScale,
			TRANSITION_SPEED,
		);
		state.pyramid.scale.z = THREE.MathUtils.lerp(
			state.pyramid.scale.z,
			state.targetScale,
			TRANSITION_SPEED,
		);
		const xClose =
			Math.abs(state.pyramid.rotation.x - state.targetRotation.x) < 0.01;
		const yClose =
			Math.abs(state.pyramid.rotation.y - state.targetRotation.y) < 0.01;
		const zClose =
			Math.abs(state.pyramid.rotation.z - state.targetRotation.z) < 0.01;
		if (xClose && yClose && zClose && !state.transitionTimer) {
			state.transitionTimer = setTimeout(() => {
				state.transitioning = false;
				state.hasInteracted = false;
			}, PAUSE_DURATION_MS);
		}
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
