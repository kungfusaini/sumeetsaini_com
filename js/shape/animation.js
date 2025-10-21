import * as THREE from "three";
import { state } from "../shared/state.js";
import {
	CONTENT_CLOSE_TRANSITION_MS,
	PAUSE_DURATION_MS,
	TRANSITION_CLOSENESS_THRESHOLD,
	TRANSITION_SPEED,
	VELOCITY_DAMPING,
} from "./config.js";
import {
	getResponsiveCameraY,
	getResponsiveCameraZ,
	getResponsiveFOV,
	getResponsiveLookAtY,
} from "./helpers.js";

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
		// Check rotation closeness
		const xClose =
			Math.abs(state.pyramid.rotation.x - state.targetRotation.x) <
			TRANSITION_CLOSENESS_THRESHOLD;
		const yClose =
			Math.abs(state.pyramid.rotation.y - state.targetRotation.y) <
			TRANSITION_CLOSENESS_THRESHOLD;
		const zClose =
			Math.abs(state.pyramid.rotation.z - state.targetRotation.z) <
			TRANSITION_CLOSENESS_THRESHOLD;

		// For popup close transitions, use timer-based completion instead of position/scale checks
		if (state.skipPause && state.popupCloseTime > 0) {
			const timeSinceClose = Date.now() - state.popupCloseTime;
			if (timeSinceClose >= CONTENT_CLOSE_TRANSITION_MS) {
				// Configurable transition time
				// Start autorotation with normal ramp-up after popup close
				state.transitioning = false;
				state.hasInteracted = false;
				state.autoRotateMultiplier = 0; // Reset for proper ramp-up
				state.skipPause = false; // Reset flag
				state.popupCloseTime = 0; // Reset timer
			}
		} else {
			// For normal transitions, use position/scale/rotation closeness checks
			const posXClose =
				Math.abs(state.pyramid.position.x - state.targetPosition.x) <
				TRANSITION_CLOSENESS_THRESHOLD;
			const posYClose =
				Math.abs(state.pyramid.position.y - state.targetPosition.y) <
				TRANSITION_CLOSENESS_THRESHOLD;
			const posZClose =
				Math.abs(state.pyramid.position.z - state.targetPosition.z) <
				TRANSITION_CLOSENESS_THRESHOLD;
			const scaleXClose =
				Math.abs(state.pyramid.scale.x - state.targetScale) <
				TRANSITION_CLOSENESS_THRESHOLD;
			const scaleYClose =
				Math.abs(state.pyramid.scale.y - state.targetScale) <
				TRANSITION_CLOSENESS_THRESHOLD;
			const scaleZClose =
				Math.abs(state.pyramid.scale.z - state.targetScale) <
				TRANSITION_CLOSENESS_THRESHOLD;

			// Transition completes when all properties are close to targets
			if (
				xClose &&
				yClose &&
				zClose &&
				posXClose &&
				posYClose &&
				posZClose &&
				scaleXClose &&
				scaleYClose &&
				scaleZClose &&
				!state.transitionTimer
			) {
				// Normal pause for other transitions
				state.transitionTimer = setTimeout(() => {
					state.transitioning = false;
					state.hasInteracted = false;
				}, PAUSE_DURATION_MS);
			}
		}

		// Always lerp position and scale for both transition types
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

		// Check completion based on transition type
		let transitionComplete = false;
		if (state.transitionType === "close") {
			// For close transitions, only check position and scale
			const posXClose =
				Math.abs(state.pyramid.position.x - state.targetPosition.x) < 0.01;
			const posYClose =
				Math.abs(state.pyramid.position.y - state.targetPosition.y) < 0.01;
			const posZClose =
				Math.abs(state.pyramid.position.z - state.targetPosition.z) < 0.01;
			const scaleXClose =
				Math.abs(state.pyramid.scale.x - state.targetScale) < 0.01;
			const scaleYClose =
				Math.abs(state.pyramid.scale.y - state.targetScale) < 0.01;
			const scaleZClose =
				Math.abs(state.pyramid.scale.z - state.targetScale) < 0.01;
			transitionComplete =
				posXClose &&
				posYClose &&
				posZClose &&
				scaleXClose &&
				scaleYClose &&
				scaleZClose;
		} else {
			// For open transitions, check rotation, position, and scale
			const xClose =
				Math.abs(state.pyramid.rotation.x - state.targetRotation.x) < 0.01;
			const yClose =
				Math.abs(state.pyramid.rotation.y - state.targetRotation.y) < 0.01;
			const zClose =
				Math.abs(state.pyramid.rotation.z - state.targetRotation.z) < 0.01;
			const posXClose =
				Math.abs(state.pyramid.position.x - state.targetPosition.x) < 0.01;
			const posYClose =
				Math.abs(state.pyramid.position.y - state.targetPosition.y) < 0.01;
			const posZClose =
				Math.abs(state.pyramid.position.z - state.targetPosition.z) < 0.01;
			const scaleXClose =
				Math.abs(state.pyramid.scale.x - state.targetScale) < 0.01;
			const scaleYClose =
				Math.abs(state.pyramid.scale.y - state.targetScale) < 0.01;
			const scaleZClose =
				Math.abs(state.pyramid.scale.z - state.targetScale) < 0.01;
			transitionComplete =
				xClose &&
				yClose &&
				zClose &&
				posXClose &&
				posYClose &&
				posZClose &&
				scaleXClose &&
				scaleYClose &&
				scaleZClose;
		}

		if (transitionComplete && !state.transitionTimer) {
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
