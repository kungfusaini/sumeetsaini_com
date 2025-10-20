import * as THREE from "three";
import { animate, onResize } from "./animation.js";
import {
	FACES,
	GRAIN_INTENSITY_FACE,
	GRAIN_SIZE_FACE,
	INITIAL_PYRAMID_ROTATION,
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
	closeContent,
	onClick,
	onPointerDown,
	onPointerMove,
	onPointerUp,
} from "./interaction.js";
import { loader, state } from "./state.js";

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

	state.scene = new THREE.Scene();
	state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	container.appendChild(state.renderer.domElement);

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
	state.camera = new THREE.PerspectiveCamera(
		fov,
		container.clientWidth / container.clientHeight,
		0.1,
		100,
	);
	state.camera.position.set(0, cameraY, cameraZ);
	state.camera.lookAt(0, lookAtY, 0);

	// Load textures asynchronously
	const texturePromises = FACES.map(
		(face) =>
			new Promise((resolve, reject) => {
				loader.load(face.image, resolve, undefined, reject);
			}),
	);
	const loadedTextures = await Promise.all(texturePromises);

	state.pyramid = buildPyramid(loadedTextures, grainCanvas);
	state.pyramid.rotation.set(
		INITIAL_PYRAMID_ROTATION.x,
		INITIAL_PYRAMID_ROTATION.y,
		INITIAL_PYRAMID_ROTATION.z,
	);
	state.scene.add(state.pyramid);

	/* ---- events ---- */
	container.addEventListener("mousedown", (e) =>
		onPointerDown(e.clientX, e.clientY),
	);
	window.addEventListener("mousemove", (e) =>
		onPointerMove(e.clientX, e.clientY),
	);
	window.addEventListener("mouseup", onPointerUp);

	container.addEventListener("touchstart", (e) =>
		onPointerDown(e.touches[0].clientX, e.touches[0].clientY),
	);
	window.addEventListener("touchmove", (e) =>
		onPointerMove(e.touches[0].clientX, e.touches[0].clientY),
	);
	window.addEventListener("touchend", onPointerUp);

	container.addEventListener("click", (e) => onClick(e, container));
	document.addEventListener("click", (e) => {
		if (e.target.id === "close-content") {
			closeContent();
		}
	});
	window.addEventListener("resize", () => onResize(container));

	/* ---- first frame ---- */
	// Wait for content to be visible and intro text to finish moving before fading in
	const waitForVisible = () => {
		if (container.offsetWidth > 0 && container.offsetHeight > 0) {
			onResize(container);
			state.renderer.render(state.scene, state.camera);
			// Check if intro text has finished moving
			if ($("#name")?.classList.contains("top")) {
				setTimeout(() => {
					container.style.opacity = "1";
				}, 100);
			} else {
				setTimeout(waitForVisible, 50);
			}
		} else {
			setTimeout(waitForVisible, 50);
		}
	};
	waitForVisible();
	animate();
}

/* ---------- boot ---------------------------------------------------- */
export function bootPyramid() {
	init();
}
