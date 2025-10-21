import * as THREE from "three";
import { BASE_ROT_SPEED } from "./config.js";

export const loader = new THREE.TextureLoader();

export const shapeState = {
	// Three.js objects
	scene: null,
	camera: null,
	renderer: null,
	pyramid: null,

	// Animation state
	baseSpeed: { ...BASE_ROT_SPEED },
	userVel: { x: 0, y: 0 },
	autoRotateMultiplier: 0,
	autoRotateEnabled: true,

	// Interaction state
	dragging: false,
	pointerDown: false,
	wasDragging: false,
	lastPointer: { x: 0, y: 0 },
	hasInteracted: false,
	idleTimer: null,

	// Transition state
	transitioning: false,
	transitionTimer: null,
	targetPosition: { x: 0, y: 0, z: 0 },
	targetScale: 1,
	targetRotation: { x: 0, y: 0, z: 0 },
	targetQuaternion: new THREE.Quaternion(),
	transitionType: null, // 'toContent' or 'toCenter'

	// Debug state
	debugMode: false,

	// Selection state
	selectedFace: null,
	textSprites: [],
};
