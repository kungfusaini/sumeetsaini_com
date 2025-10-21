import * as THREE from "three";
import {
	PAUSE_DURATION_MS,
	TRANSITION_SPEED,
	SHAPE_MOVE_TO_CONTENT_SPEED,
	SHAPE_RETURN_TO_CENTER_SPEED,
	VELOCITY_DAMPING,
} from "./config.js";
import {
	getResponsiveCameraY,
	getResponsiveCameraZ,
	getResponsiveFOV,
	getResponsiveLookAtY,
} from "./helpers.js";
import { shapeState } from "./shapeState.js";

export function animate() {
	requestAnimationFrame(animate);
	if (!shapeState.hasInteracted && shapeState.autoRotateEnabled) {
		shapeState.autoRotateMultiplier = Math.min(
			shapeState.autoRotateMultiplier + 0.01,
			1,
		);
		shapeState.pyramid.rotation.x +=
			shapeState.baseSpeed.x * shapeState.autoRotateMultiplier;
		shapeState.pyramid.rotation.y +=
			shapeState.baseSpeed.y * shapeState.autoRotateMultiplier;
	} else if (shapeState.transitioning) {
		// Determine transition speed based on type
		const transitionSpeed =
			shapeState.transitionType === "toContent"
				? SHAPE_MOVE_TO_CONTENT_SPEED
				: shapeState.transitionType === "toCenter"
					? SHAPE_RETURN_TO_CENTER_SPEED
					: TRANSITION_SPEED; // fallback

		shapeState.pyramid.rotation.x = THREE.MathUtils.lerp(
			shapeState.pyramid.rotation.x,
			shapeState.targetRotation.x,
			transitionSpeed,
		);
		shapeState.pyramid.rotation.y = THREE.MathUtils.lerp(
			shapeState.pyramid.rotation.y,
			shapeState.targetRotation.y,
			transitionSpeed,
		);
		shapeState.pyramid.rotation.z = THREE.MathUtils.lerp(
			shapeState.pyramid.rotation.z,
			shapeState.targetRotation.z,
			transitionSpeed,
		);
		shapeState.pyramid.position.x = THREE.MathUtils.lerp(
			shapeState.pyramid.position.x,
			shapeState.targetPosition.x,
			transitionSpeed,
		);
		shapeState.pyramid.position.y = THREE.MathUtils.lerp(
			shapeState.pyramid.position.y,
			shapeState.targetPosition.y,
			transitionSpeed,
		);
		shapeState.pyramid.position.z = THREE.MathUtils.lerp(
			shapeState.pyramid.position.z,
			shapeState.targetPosition.z,
			transitionSpeed,
		);
		shapeState.pyramid.scale.x = THREE.MathUtils.lerp(
			shapeState.pyramid.scale.x,
			shapeState.targetScale,
			transitionSpeed,
		);
		shapeState.pyramid.scale.y = THREE.MathUtils.lerp(
			shapeState.pyramid.scale.y,
			shapeState.targetScale,
			transitionSpeed,
		);
		shapeState.pyramid.scale.z = THREE.MathUtils.lerp(
			shapeState.pyramid.scale.z,
			shapeState.targetScale,
			transitionSpeed,
		);

		// Check completion based on transition type
		let transitionComplete = false;

		// For all transitions, check rotation, position, and scale
		const xClose =
			Math.abs(shapeState.pyramid.rotation.x - shapeState.targetRotation.x) <
			0.01;
		const yClose =
			Math.abs(shapeState.pyramid.rotation.y - shapeState.targetRotation.y) <
			0.01;
		const zClose =
			Math.abs(shapeState.pyramid.rotation.z - shapeState.targetRotation.z) <
			0.01;
		const posXClose =
			Math.abs(shapeState.pyramid.position.x - shapeState.targetPosition.x) <
			0.01;
		const posYClose =
			Math.abs(shapeState.pyramid.position.y - shapeState.targetPosition.y) <
			0.01;
		const posZClose =
			Math.abs(shapeState.pyramid.position.z - shapeState.targetPosition.z) <
			0.01;
		const scaleXClose =
			Math.abs(shapeState.pyramid.scale.x - shapeState.targetScale) < 0.01;
		const scaleYClose =
			Math.abs(shapeState.pyramid.scale.y - shapeState.targetScale) < 0.01;
		const scaleZClose =
			Math.abs(shapeState.pyramid.scale.z - shapeState.targetScale) < 0.01;

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

		if (transitionComplete && !shapeState.transitionTimer) {
			shapeState.transitionTimer = setTimeout(() => {
				shapeState.transitioning = false;
				shapeState.transitionType = null; // Reset transition type
				shapeState.hasInteracted = false;
			}, PAUSE_DURATION_MS);
		}
	} else if (!shapeState.dragging) {
		shapeState.pyramid.rotation.x += shapeState.userVel.x;
		shapeState.pyramid.rotation.y += shapeState.userVel.y;
		shapeState.userVel.x *= VELOCITY_DAMPING;
		shapeState.userVel.y *= VELOCITY_DAMPING;
	}
	shapeState.renderer.render(shapeState.scene, shapeState.camera);
}

/* ---------- resize -------------------------------------------------- */
export function onResize(container) {
	const w = container.clientWidth;
	const h = container.clientHeight;
	shapeState.renderer.setSize(w, h);
	shapeState.camera.aspect = w / h;
	shapeState.camera.fov = getResponsiveFOV(w);
	shapeState.camera.position.z = getResponsiveCameraZ(w);
	shapeState.camera.position.y = getResponsiveCameraY(w);
	const lookAtY = getResponsiveLookAtY(w);
	shapeState.camera.lookAt(0, lookAtY, 0);
	shapeState.camera.updateProjectionMatrix();
}
