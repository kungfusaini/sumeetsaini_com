import * as THREE from "three";
import { BASE_ROT_SPEED } from "./config.js";

export const loader = new THREE.TextureLoader();

export const state = {
	scene: null,
	camera: null,
	renderer: null,
	pyramid: null,
	baseSpeed: { ...BASE_ROT_SPEED },
	userVel: { x: 0, y: 0 },
	dragging: false,
	lastPointer: { x: 0, y: 0 },
	idleTimer: null,
	hasInteracted: false,
	autoRotateMultiplier: 0,
	autoRotateEnabled: true,
	debugMode: false,
	transitionTimer: null,
};
