import * as THREE from "three";
import { initController, on } from "../controller/main.js";
import { initPopup } from "../popup/main.js";
import { FACES } from "../shared/faces.js";
import { animate, onResize } from "./animation.js";
import {
	GRAIN_INTENSITY_FACE,
	GRAIN_SIZE_FACE,
	INITIAL_PYRAMID_ROTATION,
	GUIDANCE_DELAY_MS,
} from "./config.js";
import { buildPyramid } from "./geometry.js";
import {
	$,
	addGrainToCanvas,
	getResponsiveCameraY,
	getResponsiveCameraZ,
	getResponsiveFOV,
	getResponsiveLookAtY,
} from "./helpers.js";
import {
	onPointerDown,
	onPointerMove,
	onPointerUp,
	onShapeClick,
	onKeyDown,
} from "./interaction.js";
import { loader, shapeState } from "./shapeState.js";

/* ---------- init ---------------------------------------------------- */
export async function init() {
	const container = document.createElement("div");
	container.className = "three-box";
	Object.assign(container.style, {
		width: "100%",
		height: "calc(100vh - 4rem)",
		display: "block",
		position: "relative",
		opacity: "0",
		transition: "opacity 1s ease-in-out",
	});

	document.body.insertBefore(container, $("main"));

	// Create guidance element
	const guidanceElement = document.createElement("div");
	guidanceElement.className = "shape-guidance";
	guidanceElement.innerHTML = `
		<span class="guidance-drag">drag</span>
		<span class="guidance-click">click</span>
	`;
	guidanceElement.style.opacity = "0";
	container.appendChild(guidanceElement);
	shapeState.guidanceElement = guidanceElement;

	shapeState.scene = new THREE.Scene();
	shapeState.renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
	});
	container.appendChild(shapeState.renderer.domElement);

	// Create static grain texture
	const grainCanvas = document.createElement("canvas");
	grainCanvas.width = 512;
	grainCanvas.height = 512;
	const ctx = grainCanvas.getContext("2d");
	ctx.fillStyle = "gray";
	ctx.fillRect(0, 0, 512, 512);
	addGrainToCanvas(grainCanvas, GRAIN_INTENSITY_FACE, GRAIN_SIZE_FACE);

	/* ---- create camera early ---- */
	const cameraZ = getResponsiveCameraZ(window.innerWidth);
	const cameraY = getResponsiveCameraY(window.innerWidth);
	const lookAtY = getResponsiveLookAtY(window.innerWidth);
	const fov = getResponsiveFOV(window.innerWidth);
	shapeState.camera = new THREE.PerspectiveCamera(
		fov,
		container.clientWidth / container.clientHeight,
		0.1,
		100,
	);
	shapeState.camera.position.set(0, cameraY, cameraZ);
	shapeState.camera.lookAt(0, lookAtY, 0);

	// Load textures asynchronously
	const texturePromises = FACES.map(
		(face) =>
			new Promise((resolve, reject) => {
				loader.load(face.image, resolve, undefined, reject);
			}),
	);
	const loadedTextures = await Promise.all(texturePromises);

	shapeState.pyramid = buildPyramid(loadedTextures, grainCanvas);
	shapeState.pyramid.rotation.set(
		INITIAL_PYRAMID_ROTATION.x,
		INITIAL_PYRAMID_ROTATION.y,
		INITIAL_PYRAMID_ROTATION.z,
	);
	shapeState.scene.add(shapeState.pyramid);

	// Signal that shape is loaded and trigger intro completion
	window.completeIntro(container);

	// Start guidance timer - show after configured delay if no popup opened
	shapeState.guidanceTimer = setTimeout(() => {
		if (!shapeState.hasOpenedPopup) {
			showGuidance();
		}
	}, GUIDANCE_DELAY_MS);

	/* ---- events ---- */
	container.addEventListener("mousedown", (e) =>
		onPointerDown(e.clientX, e.clientY),
	);
	window.addEventListener("mousemove", (e) =>
		onPointerMove(e.clientX, e.clientY),
	);
	window.addEventListener("mouseup", onPointerUp);
	window.addEventListener("keydown", onKeyDown);

	container.addEventListener("touchstart", (e) =>
		onPointerDown(e.touches[0].clientX, e.touches[0].clientY),
	);
	window.addEventListener("touchmove", (e) =>
		onPointerMove(e.touches[0].clientX, e.touches[0].clientY),
	);
	window.addEventListener("touchend", onPointerUp);

	// Add click event listener for shape interactions
	container.addEventListener("click", (e) => onShapeClick(e, container));

	// Initialize controller and popup system
	initController();
	initPopup(container);

	// Listen for controller events
	on("shape:moveToPosition", (data) => {
		shapeState.targetRotation = { ...data.rotation };
		shapeState.targetQuaternion.copy(data.quaternion);
		shapeState.targetPosition = { ...data.position };
		shapeState.targetScale = data.scale;
		shapeState.transitioning = true;
		shapeState.transitionType = "toContent";
		shapeState.hasInteracted = true;
	});

	on("shape:resetPosition", (data) => {
		shapeState.targetQuaternion.copy(data.quaternion);
		shapeState.targetPosition = { x: 0, y: 0, z: 0 };
		shapeState.targetScale = 1;
		shapeState.transitioning = true;
		shapeState.transitionType = "toCenter";
		shapeState.hasInteracted = true;
	});

	on("shape:handlePopupClose", () => {
		// Timer logic removed - transition completes based on position only
	});

	on("popup:showContent", () => {
		shapeState.hasOpenedPopup = true;
		hideGuidance();
		if (shapeState.guidanceTimer) {
			clearTimeout(shapeState.guidanceTimer);
			shapeState.guidanceTimer = null;
		}
	});

	window.addEventListener("resize", () => onResize(container));

	/* ---- first frame ---- */
	// Initial render setup
	const setupFirstFrame = () => {
		if (container.offsetWidth > 0 && container.offsetHeight > 0) {
			onResize(container);
			shapeState.renderer.render(shapeState.scene, shapeState.camera);
		} else {
			setTimeout(setupFirstFrame, 50);
		}
	};
	setupFirstFrame();
	animate();
}

/* ---------- guidance functions ------------------------------------ */
function showGuidance() {
	if (shapeState.guidanceElement) {
		shapeState.guidanceElement.style.opacity = "1";
		shapeState.guidanceShown = true;
	}
}

function hideGuidance() {
	if (shapeState.guidanceElement && shapeState.guidanceShown) {
		shapeState.guidanceElement.style.opacity = "0";
		shapeState.guidanceShown = false;
	}
}

/* ---------- boot ---------------------------------------------------- */
export function bootPyramid() {
	init();
}
