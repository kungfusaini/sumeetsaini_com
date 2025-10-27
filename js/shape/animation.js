import * as THREE from "three";
import {
	SHAPE_MOVE_TO_CONTENT_SPEED,
	SHAPE_RETURN_TO_CENTER_SPEED,
	TRANSITION_SPEED,
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

		// Use quaternion interpolation for smooth rotation
		const currentQuaternion = new THREE.Quaternion();
		currentQuaternion.copy(shapeState.pyramid.quaternion);

		// Slerp between current and target quaternion
		currentQuaternion.slerp(shapeState.targetQuaternion, transitionSpeed);

		// Apply the interpolated quaternion back to the pyramid
		shapeState.pyramid.quaternion.copy(currentQuaternion);
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

		// For all transitions, check rotation (using quaternion), position, and scale
		const quaternionDistance = shapeState.pyramid.quaternion.angleTo(
			shapeState.targetQuaternion,
		);
		const rotationClose = quaternionDistance < 0.01;
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
			rotationClose &&
			posXClose &&
			posYClose &&
			posZClose &&
			scaleXClose &&
			scaleYClose &&
			scaleZClose;

		if (transitionComplete && !shapeState.transitionTimer) {
			shapeState.transitioning = false;
			shapeState.transitionType = null; // Reset transition type
			shapeState.hasInteracted = false;
			shapeState.autoRotateMultiplier = 0; // Reset auto-rotation to start gradually
		}
	} else if (!shapeState.dragging) {
		// Use quaternion rotation for consistency with dragging
		const yawQuaternion = new THREE.Quaternion();
		yawQuaternion.setFromAxisAngle(
			new THREE.Vector3(0, 1, 0),
			shapeState.userVel.y,
		);

		const pitchQuaternion = new THREE.Quaternion();
		pitchQuaternion.setFromAxisAngle(
			new THREE.Vector3(1, 0, 0),
			shapeState.userVel.x,
		);

		shapeState.pyramid.quaternion.multiplyQuaternions(
			yawQuaternion,
			shapeState.pyramid.quaternion,
		);
		shapeState.pyramid.quaternion.multiplyQuaternions(
			pitchQuaternion,
			shapeState.pyramid.quaternion,
		);

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
