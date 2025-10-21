import * as THREE from "three";
import {
	CAMERA_FOV_BASE,
	CAMERA_Y_BASE,
	CAMERA_Z_BASE,
	IDLE_TIMEOUT_MS,
	MOBILE_PYRAMID_SIZE_MULTIPLIER,
	PYRAMID_SIZE_MULTIPLIER_BASE,
	TEXT_CANVAS_HEIGHT,
	TEXT_CANVAS_WIDTH,
	TEXT_FONT,
	TEXT_POS_MULTIPLIER_BASE,
	TEXT_SCALE_BASE,
} from "./config.js";
import { shapeState } from "./shapeState.js";

// Shaders for blending grain texture with face texture
export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  uniform sampler2D faceTexture;
  uniform sampler2D grainTexture;
  varying vec2 vUv;
  void main() {
    vec4 faceColor = texture2D(faceTexture, vUv);
    vec4 grainColor = texture2D(grainTexture, vUv);
    gl_FragColor = faceColor + abs(grainColor) * 0.5; // Additive blend to avoid darkening
  }
`;

export const $ = (sel) => document.querySelector(sel);
export const clearIdleTimer = () => {
	clearTimeout(shapeState.idleTimer);
	shapeState.idleTimer = null;
};
export const startIdleTimer = () => {
	clearIdleTimer();
	shapeState.idleTimer = setTimeout(() => {
		shapeState.hasInteracted = false;
		shapeState.userVel = { x: 0, y: 0 };
	}, IDLE_TIMEOUT_MS);
};

export const addGrainToCanvas = (canvas, intensity = 0.1, grainSize = 4) => {
	const ctx = canvas.getContext("2d");
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	for (let y = 0; y < canvas.height; y += grainSize) {
		for (let x = 0; x < canvas.width; x += grainSize) {
			const noise = (Math.random() - 0.5) * intensity * 255;
			for (let dy = 0; dy < grainSize && y + dy < canvas.height; dy++) {
				for (let dx = 0; dx < grainSize && x + dx < canvas.width; dx++) {
					const i = ((y + dy) * canvas.width + (x + dx)) * 4;
					data[i] += noise; // Red
					data[i + 1] += noise; // Green
					data[i + 2] += noise; // Blue
					// Alpha unchanged
				}
			}
		}
	}
	ctx.putImageData(imageData, 0, 0);
};

export const getResponsiveCameraZ = (width) => {
	if (width <= 768) return CAMERA_Z_BASE * 1.5; // Mobile: farther back
	if (width <= 1200) return CAMERA_Z_BASE * 1.2; // Tablet: slightly back
	return CAMERA_Z_BASE; // Desktop: default
};
export const getResponsiveCameraY = (width) => {
	if (width <= 768) return CAMERA_Y_BASE * 2.5; // Mobile: higher up
	if (width <= 1200) return CAMERA_Y_BASE * 1.5; // Tablet: slightly higher
	return CAMERA_Y_BASE; // Desktop: default
};
export const getResponsiveLookAtY = (width) => {
	if (width <= 768) return -1; // Mobile: look down to bring shape up
	return 0; // Desktop: center
};
export const getResponsiveFOV = (width) => {
	if (width <= 768) return 60; // Mobile: wider FOV to see more horizontally
	return CAMERA_FOV_BASE; // Desktop: default
};
export const getResponsivePyramidSize = (width) => {
	if (width <= 768)
		return PYRAMID_SIZE_MULTIPLIER_BASE * MOBILE_PYRAMID_SIZE_MULTIPLIER; // Mobile: smaller to fit narrow viewport
	if (width <= 1200) return PYRAMID_SIZE_MULTIPLIER_BASE * 0.85; // Tablet: slightly smaller
	return PYRAMID_SIZE_MULTIPLIER_BASE; // Desktop: default
};
export const getResponsiveTextScale = (width) => {
	if (width <= 768)
		return {
			x: TEXT_SCALE_BASE.x * 1.0,
			y: TEXT_SCALE_BASE.y * 1.0,
			z: TEXT_SCALE_BASE.z * 1.0,
		};
	if (width <= 1200)
		return {
			x: TEXT_SCALE_BASE.x * 0.85,
			y: TEXT_SCALE_BASE.y * 0.85,
			z: TEXT_SCALE_BASE.z * 0.85,
		};
	return TEXT_SCALE_BASE;
};
export const getResponsiveTextPosMultiplier = (width) => {
	if (width <= 768) return TEXT_POS_MULTIPLIER_BASE * 1.0; // Adjusted for smaller pyramid
	if (width <= 1200) return TEXT_POS_MULTIPLIER_BASE * 0.9;
	return TEXT_POS_MULTIPLIER_BASE;
};

export function createTextSprite(text, isSelected = false) {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	canvas.width = TEXT_CANVAS_WIDTH;
	canvas.height = TEXT_CANVAS_HEIGHT;

	context.font = TEXT_FONT;
	context.textAlign = "center";
	context.textBaseline = "middle";

	// Get colors from CSS variables
	const normalColor =
		getComputedStyle(document.documentElement)
			.getPropertyValue("--label-color-normal")
			.trim() || "white";
	const selectedColor =
		getComputedStyle(document.documentElement)
			.getPropertyValue("--label-color-selected")
			.trim() || "#d65d03";

	// Draw text
	const x = canvas.width / 2;
	const y = canvas.height / 2;

	if (isSelected) {
		// Get outline settings from CSS
		const outlineColor =
			getComputedStyle(document.documentElement)
				.getPropertyValue("--label-outline-color")
				.trim() || "black";
		const outlineWidth =
			getComputedStyle(document.documentElement)
				.getPropertyValue("--label-outline-width")
				.trim() || "3px";

		// Draw outline first
		context.strokeStyle = outlineColor;
		context.lineWidth = parseInt(outlineWidth, 10);
		context.strokeText(text, x, y);

		// Then draw selected text on top
		context.fillStyle = selectedColor;
		context.fillText(text, x, y);
	} else {
		context.fillStyle = normalColor;
		context.fillText(text, x, y);
	}

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.needsUpdate = true;
	const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
	const sprite = new THREE.Sprite(spriteMaterial);
	const textScale = getResponsiveTextScale(window.innerWidth);

	// Get scale multipliers from CSS variables
	const normalScale =
		parseFloat(
			getComputedStyle(document.documentElement)
				.getPropertyValue("--label-scale-normal")
				.trim(),
		) || 1;
	const selectedScale =
		parseFloat(
			getComputedStyle(document.documentElement)
				.getPropertyValue("--label-scale-selected")
				.trim(),
		) || 1.5;

	const scaleMultiplier = isSelected ? selectedScale : normalScale;
	sprite.scale.set(
		textScale.x * scaleMultiplier,
		textScale.y * scaleMultiplier,
		textScale.z * scaleMultiplier,
	);

	return sprite;
}

export function updateTextSprite(sprite, text, isSelected = false) {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	canvas.width = TEXT_CANVAS_WIDTH;
	canvas.height = TEXT_CANVAS_HEIGHT;

	context.font = TEXT_FONT;
	context.textAlign = "center";
	context.textBaseline = "middle";

	// Get colors from CSS variables
	const normalColor =
		getComputedStyle(document.documentElement)
			.getPropertyValue("--label-color-normal")
			.trim() || "white";
	const selectedColor =
		getComputedStyle(document.documentElement)
			.getPropertyValue("--label-color-selected")
			.trim() || "#d65d03";

	// Draw text
	const x = canvas.width / 2;
	const y = canvas.height / 2;

	if (isSelected) {
		// Get outline settings from CSS
		const outlineColor =
			getComputedStyle(document.documentElement)
				.getPropertyValue("--label-outline-color")
				.trim() || "black";
		const outlineWidth =
			getComputedStyle(document.documentElement)
				.getPropertyValue("--label-outline-width")
				.trim() || "3px";

		// Draw outline first
		context.strokeStyle = outlineColor;
		context.lineWidth = parseInt(outlineWidth, 10);
		context.strokeText(text, x, y);

		// Then draw selected text on top
		context.fillStyle = selectedColor;
		context.fillText(text, x, y);
	} else {
		context.fillStyle = normalColor;
		context.fillText(text, x, y);
	}

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.needsUpdate = true;
	sprite.material.map = texture;
	sprite.material.needsUpdate = true;

	const textScale = getResponsiveTextScale(window.innerWidth);

	// Get scale multipliers from CSS variables
	const normalScale =
		parseFloat(
			getComputedStyle(document.documentElement)
				.getPropertyValue("--label-scale-normal")
				.trim(),
		) || 1;
	const selectedScale =
		parseFloat(
			getComputedStyle(document.documentElement)
				.getPropertyValue("--label-scale-selected")
				.trim(),
		) || 1.5;

	const scaleMultiplier = isSelected ? selectedScale : normalScale;
	sprite.scale.set(
		textScale.x * scaleMultiplier,
		textScale.y * scaleMultiplier,
		textScale.z * scaleMultiplier,
	);
}
