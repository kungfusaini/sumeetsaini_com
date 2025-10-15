/* ------------------------------------------------------------------ */
/*  CONFIG                                                            */
/* ------------------------------------------------------------------ */

const PYRAMID_EDGE = 3;
const CAMERA_FOV_BASE = 50;
const CAMERA_Z_BASE = 8;
const CAMERA_Y_BASE = 2;
const BASE_ROT_SPEED = { x: 0.003, y: 0.002 };
const DRAG_SENSITIVITY = 0.008;
const VELOCITY_DAMPING = 0.96;
const IDLE_TIMEOUT_MS = 6000;
const TEXT_CANVAS_WIDTH = 1536;
const TEXT_CANVAS_HEIGHT = 768;
const TEXT_FONT = 'Bold 128px "ProFontIIx", "SF Mono", Monaco, monospace';
const TEXT_SCALE_BASE = { x: 3, y: 1.5, z: 1 };
const FACE_CANVAS_WIDTH = 4096;
const FACE_CANVAS_HEIGHT = 4096;
const FACE_IMG_SIZE = 1500;
const FACE_IMG_OFFSET_Y = -600;
const TEXT_POS_MULTIPLIER_BASE = 1.1;
const PYRAMID_SIZE_MULTIPLIER_BASE = 0.6;
const MOBILE_PYRAMID_SIZE_MULTIPLIER = 1.0;
const FACES = [
	{
		text: "About",
		color: "--black-grey",
		link: "#projects",
		image: "assets/dice_images/book.svg",
	},
	{
		text: "Contact",
		color: "--dark-grey",
		link: "#about",
		image: "assets/dice_images/ball.svg",
	},
	{
		text: "Blog",
		color: "--mid-grey",
		link: "#contact",
		image: "assets/dice_images/quill.svg",
	},
	{
		text: "Now",
		color: "--light-grey",
		link: "#blog",
		image: "assets/dice_images/sun.svg",
	},
];

/* ------------------------------------------------------------------ */

import * as THREE from "three";

const loader = new THREE.TextureLoader();

let scene, camera, renderer, pyramid;
const baseSpeed = { ...BASE_ROT_SPEED };
let userVel = { x: 0, y: 0 };
let dragging = false;
let lastPointer = { x: 0, y: 0 };
let idleTimer = null;
let hasInteracted = false;
let autoRotateMultiplier = 0;
/* ---------- helpers ------------------------------------------------- */
const $ = (sel) => document.querySelector(sel);
const clearIdleTimer = () => {
	clearTimeout(idleTimer);
	idleTimer = null;
};
const startIdleTimer = () => {
	clearIdleTimer();
	idleTimer = setTimeout(() => {
		hasInteracted = false;
		userVel = { x: 0, y: 0 };
	}, IDLE_TIMEOUT_MS);
};
const getResponsiveCameraZ = (width) => {
	if (width <= 768) return CAMERA_Z_BASE * 1.5; // Mobile: farther back
	if (width <= 1200) return CAMERA_Z_BASE * 1.2; // Tablet: slightly back
	return CAMERA_Z_BASE; // Desktop: default
};
const getResponsiveCameraY = (width) => {
	if (width <= 768) return CAMERA_Y_BASE * 2.5; // Mobile: higher up
	if (width <= 1200) return CAMERA_Y_BASE * 1.5; // Tablet: slightly higher
	return CAMERA_Y_BASE; // Desktop: default
};
const getResponsiveLookAtY = (width) => {
	if (width <= 768) return -1; // Mobile: look down to bring shape up
	return 0; // Desktop: center
};
const getResponsiveFOV = (width) => {
	if (width <= 768) return 60; // Mobile: wider FOV to see more horizontally
	return CAMERA_FOV_BASE; // Desktop: default
};
const getResponsivePyramidSize = (width) => {
	if (width <= 768)
		return PYRAMID_SIZE_MULTIPLIER_BASE * MOBILE_PYRAMID_SIZE_MULTIPLIER; // Mobile: smaller to fit narrow viewport
	if (width <= 1200) return PYRAMID_SIZE_MULTIPLIER_BASE * 0.85; // Tablet: slightly smaller
	return PYRAMID_SIZE_MULTIPLIER_BASE; // Desktop: default
};
const getResponsiveTextScale = (width) => {
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
const getResponsiveTextPosMultiplier = (width) => {
	if (width <= 768) return TEXT_POS_MULTIPLIER_BASE * 1.0; // Adjusted for smaller pyramid
	if (width <= 1200) return TEXT_POS_MULTIPLIER_BASE * 0.9;
	return TEXT_POS_MULTIPLIER_BASE;
};

function createTextSprite(text) {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	canvas.width = TEXT_CANVAS_WIDTH;
	canvas.height = TEXT_CANVAS_HEIGHT;

	context.font = TEXT_FONT;
	context.fillStyle = "white";
	context.textAlign = "center";
	context.textBaseline = "middle";

	// Draw text
	const x = canvas.width / 2;
	const y = canvas.height / 2;
	context.fillText(text, x, y);

	const texture = new THREE.CanvasTexture(canvas);
	const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
	const sprite = new THREE.Sprite(spriteMaterial);
	const textScale = getResponsiveTextScale(window.innerWidth);
	sprite.scale.set(textScale.x, textScale.y, textScale.z);

	return sprite;
}

/* ---------- geometry ------------------------------------------------ */
function buildPyramid(loadedTextures) {
	const group = new THREE.Group();
	const size = PYRAMID_EDGE * getResponsivePyramidSize(window.innerWidth);

	// Tetrahedron vertices (scaled to match TetrahedronGeometry radius)
	const vertices = [
		new THREE.Vector3(size, size, size),
		new THREE.Vector3(size, -size, -size),
		new THREE.Vector3(-size, size, -size),
		new THREE.Vector3(-size, -size, size),
	];

	// Face definitions with correct vertex order for outward normals
	const faceDefs = [
		{ indices: [0, 2, 1], colorIndex: 0 }, // Projects
		{ indices: [0, 1, 3], colorIndex: 1 }, // About me
		{ indices: [0, 3, 2], colorIndex: 2 }, // Contact
		{ indices: [1, 2, 3], colorIndex: 3 }, // Blog
	];

	faceDefs.forEach(({ indices, colorIndex }) => {
		const geom = new THREE.BufferGeometry();
		const positions = new Float32Array([
			vertices[indices[0]].x,
			vertices[indices[0]].y,
			vertices[indices[0]].z,
			vertices[indices[1]].x,
			vertices[indices[1]].y,
			vertices[indices[1]].z,
			vertices[indices[2]].x,
			vertices[indices[2]].y,
			vertices[indices[2]].z,
		]);
		geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

		// Add UV coordinates for texture mapping (flipped vertically to correct orientation)
		const uvs = new Float32Array([
			0,
			1, // bottom left flipped
			1,
			1, // bottom right flipped
			0.5,
			0, // top middle flipped
		]);
		geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

		geom.computeVertexNormals();

		// Create composite texture
		const canvas = document.createElement("canvas");
		canvas.width = FACE_CANVAS_WIDTH;
		canvas.height = FACE_CANVAS_HEIGHT;
		const ctx = canvas.getContext("2d");

		// Fill with face color from CSS variable
		const colorValue = getComputedStyle(document.documentElement)
			.getPropertyValue(FACES[colorIndex].color)
			.trim();
		ctx.fillStyle = colorValue;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw image on top with multiply blend for better color integration
		const img = loadedTextures[colorIndex].image;
		const imgSize = FACE_IMG_SIZE;
		const x = (canvas.width - imgSize) / 2;
		const y = (canvas.height - imgSize) / 2 + FACE_IMG_OFFSET_Y;
		ctx.globalCompositeOperation = "multiply";
		ctx.globalAlpha = 1.0; // Full opacity since multiply handles blending

		// Rotate image 180 degrees around its center
		const centerX = x + imgSize / 2;
		const centerY = y + imgSize / 2;
		ctx.save();
		ctx.translate(centerX, centerY);
		ctx.rotate(Math.PI); // 180 degrees
		ctx.drawImage(img, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
		ctx.restore();

		const texture = new THREE.CanvasTexture(canvas);
		texture.minFilter = THREE.LinearMipmapLinearFilter;
		texture.magFilter = THREE.LinearFilter;

		const mat = new THREE.MeshBasicMaterial({
			map: texture,
			side: THREE.DoubleSide,
		});

		const face = new THREE.Mesh(geom, mat);
		face.renderOrder = colorIndex;
		face.userData = {
			url: FACES[colorIndex].link,
			text: FACES[colorIndex].text,
			faceIndex: colorIndex,
		};
		group.add(face);

		// Create text sprite for the face
		const textSprite = createTextSprite(FACES[colorIndex].text);
		// Position text at the center of the face
		const center = new THREE.Vector3();
		center.add(vertices[indices[0]]);
		center.add(vertices[indices[1]]);
		center.add(vertices[indices[2]]);
		center.divideScalar(3);
		const textPosMultiplier = getResponsiveTextPosMultiplier(window.innerWidth);
		center.normalize().multiplyScalar(size * textPosMultiplier);
		textSprite.position.copy(center);
		group.add(textSprite);
	});

	return group;
}

/* ---------- interaction --------------------------------------------- */
function onPointerDown(x, y) {
	dragging = true;
	lastPointer = { x, y };
	clearIdleTimer();
	autoRotateMultiplier = 0;
}

function onPointerMove(x, y) {
	if (!dragging) return;
	userVel.y = -(x - lastPointer.x) * DRAG_SENSITIVITY;
	userVel.x = (y - lastPointer.y) * DRAG_SENSITIVITY;
	pyramid.rotation.y += userVel.y;
	pyramid.rotation.x += userVel.x;
	lastPointer = { x, y };
	hasInteracted = true;
	autoRotateMultiplier = 0;
}

function onPointerUp() {
	dragging = false;
	startIdleTimer();
}

/* ---------- raycast click ------------------------------------------- */
function onClick(ev, container) {
	const rect = container.getBoundingClientRect();
	const mouse = new THREE.Vector2(
		((ev.clientX - rect.left) / rect.width) * 2 - 1,
		-((ev.clientY - rect.top) / rect.height) * 2 + 1,
	);
	const ray = new THREE.Raycaster();
	ray.setFromCamera(mouse, camera);
	const hits = ray.intersectObjects(pyramid.children);
	if (hits.length) {
		const faceData = hits[0].object.userData;
		if (faceData) window.location = faceData.url;
	}
}

/* ---------- resize -------------------------------------------------- */
function onResize(container) {
	const w = container.clientWidth;
	const h = container.clientHeight;
	renderer.setSize(w, h);
	camera.aspect = w / h;
	camera.fov = getResponsiveFOV(w);
	camera.position.z = getResponsiveCameraZ(w);
	camera.position.y = getResponsiveCameraY(w);
	const lookAtY = getResponsiveLookAtY(w);
	camera.lookAt(0, lookAtY, 0);
	camera.updateProjectionMatrix();
}

/* ---------- animation loop ------------------------------------------ */
function animate() {
	requestAnimationFrame(animate);
	if (!hasInteracted) {
		autoRotateMultiplier = Math.min(autoRotateMultiplier + 0.01, 1);
		pyramid.rotation.x += baseSpeed.x * autoRotateMultiplier;
		pyramid.rotation.y += baseSpeed.y * autoRotateMultiplier;
	} else if (!dragging) {
		pyramid.rotation.x += userVel.x;
		pyramid.rotation.y += userVel.y;
		userVel.x *= VELOCITY_DAMPING;
		userVel.y *= VELOCITY_DAMPING;
	}
	renderer.render(scene, camera);
}

/* ---------- init ---------------------------------------------------- */
async function init() {
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

	$("main").prepend(container);

	scene = new THREE.Scene();
	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	container.appendChild(renderer.domElement);

	/* ---- create camera early ---- */
	const cameraZ = getResponsiveCameraZ(window.innerWidth);
	const cameraY = getResponsiveCameraY(window.innerWidth);
	const lookAtY = getResponsiveLookAtY(window.innerWidth);
	const fov = getResponsiveFOV(window.innerWidth);
	camera = new THREE.PerspectiveCamera(
		fov,
		container.clientWidth / container.clientHeight,
		0.1,
		100,
	);
	camera.position.set(0, cameraY, cameraZ);
	camera.lookAt(0, lookAtY, 0);

	// Load textures asynchronously
	const texturePromises = FACES.map(
		(face) =>
			new Promise((resolve, reject) => {
				loader.load(face.image, resolve, undefined, reject);
			}),
	);
	const loadedTextures = await Promise.all(texturePromises);

	pyramid = buildPyramid(loadedTextures);
	scene.add(pyramid);

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
	window.addEventListener("resize", () => onResize(container));

	/* ---- first frame ---- */
	// Wait for content to be visible and intro text to finish moving before fading in
	const waitForVisible = () => {
		if (container.offsetWidth > 0 && container.offsetHeight > 0) {
			onResize(container);
			renderer.render(scene, camera);
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
function bootPyramid() {
	init();
}
bootPyramid();
