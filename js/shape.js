/* ------------------------------------------------------------------ */
/*  CONFIG – tweak these, nothing else                                */
/* ------------------------------------------------------------------ */
const PYRAMID_EDGE = 3;
const CAMERA_FOV = 50;
const CAMERA_Z = 8;
const CAMERA_Y = 2;
const BASE_ROT_SPEED = { x: 0.002, y: 0.003 };
const DRAG_SENSITIVITY = 0.008;
const VELOCITY_DAMPING = 0.95;
const IDLE_TIMEOUT_MS = 2000;
const FACES = [
	{ text: "Projects", color: "#ff6b6b", link: "#projects" },
	{ text: "About me", color: "#4ecdc4", link: "#about" },
	{ text: "Contact", color: "#45b7d1", link: "#contact" },
	{ text: "Blog", color: "#f7b731", link: "#blog" },
];
/* ------------------------------------------------------------------ */

import * as THREE from "three";

let scene, camera, renderer, pyramid;
let baseSpeed = { ...BASE_ROT_SPEED };
let userVel = { x: 0, y: 0 };
let dragging = false;
let lastPointer = { x: 0, y: 0 };
let idleTimer = null;
let hasInteracted = false;
let fadeInProgress = false;

/* ---------- helpers ------------------------------------------------- */
const $ = (sel) => document.querySelector(sel);
const clearIdleTimer = () => {
	clearTimeout(idleTimer);
	idleTimer = null;
};
/* ---------- fade in -------------------------------------------------- */
function fadeInPyramid() {
	if (fadeInProgress) return;
	fadeInProgress = true;
	let opacity = 0;
	const fadeDuration = 2000;
	const fadeStep = 16; // ~60fps
	const opacityStep = fadeStep / fadeDuration;

	const fade = () => {
		opacity = Math.min(1, opacity + opacityStep);
		pyramid.children.forEach((face) => {
			face.material.opacity = opacity;
		});
		if (opacity < 1) {
			setTimeout(fade, fadeStep);
		} else {
			fadeInProgress = false;
		}
	};
	fade();
}
const startIdleTimer = () => {
	clearIdleTimer();
	idleTimer = setTimeout(() => {
		hasInteracted = false;
		userVel = { x: 0, y: 0 };
	}, IDLE_TIMEOUT_MS);
};

/* ---------- geometry ------------------------------------------------ */
function buildPyramid() {
	const group = new THREE.Group();
	const geom = new THREE.TetrahedronGeometry(PYRAMID_EDGE);
	FACES.forEach((f) => {
		const mat = new THREE.MeshBasicMaterial({
			color: f.color,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0,
		});
		const face = new THREE.Mesh(geom, mat);
		face.userData = { url: f.link, text: f.text };
		group.add(face);
	});
	return group;
}

/* ---------- interaction --------------------------------------------- */
function onPointerDown(x, y) {
	dragging = true;
	lastPointer = { x, y };
	clearIdleTimer();
}

function onPointerMove(x, y) {
	if (!dragging) return;
	userVel.y = (x - lastPointer.x) * DRAG_SENSITIVITY;
	userVel.x = (y - lastPointer.y) * DRAG_SENSITIVITY;
	pyramid.rotation.y += userVel.y;
	pyramid.rotation.x += userVel.x;
	lastPointer = { x, y };
	hasInteracted = true;
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
	if (hits.length) window.location = hits[0].object.userData.url;
}

/* ---------- resize -------------------------------------------------- */
function onResize(container) {
	const rect = container.getBoundingClientRect();
	const w = rect.width;
	const h = rect.height;
	renderer.setSize(w, h);
	camera.aspect = w / h;
	camera.updateProjectionMatrix();
}

/* ---------- animation loop ------------------------------------------ */
function animate() {
	requestAnimationFrame(animate);
	if (!hasInteracted) {
		pyramid.rotation.x += baseSpeed.x;
		pyramid.rotation.y += baseSpeed.y;
	} else if (!dragging) {
		pyramid.rotation.x += userVel.x;
		pyramid.rotation.y += userVel.y;
		userVel.x *= VELOCITY_DAMPING;
		userVel.y *= VELOCITY_DAMPING;
	}
	renderer.render(scene, camera);
}

/* ---------- init ---------------------------------------------------- */
function init() {
	const container = document.createElement("div");
	container.className = "three-box";
	Object.assign(container.style, {
		width: "100%",
		height: "calc(100vh - 4rem)",
		display: "block",
		position: "relative",
	});

	$("main").prepend(container);

	scene = new THREE.Scene();
	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	container.appendChild(renderer.domElement);

	/* ---- create camera early ---- */
	camera = new THREE.PerspectiveCamera(
		CAMERA_FOV,
		container.clientWidth / container.clientHeight,
		0.1,
		100,
	);
	camera.position.set(0, CAMERA_Y, CAMERA_Z);
	camera.lookAt(0, 0, 0);

	pyramid = buildPyramid();
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
	// Wait for content to be visible before sizing and rendering
	const waitForVisible = () => {
		if (container.offsetWidth > 0 && container.offsetHeight > 0) {
			onResize(container);
			renderer.render(scene, camera);
			fadeInPyramid();
		} else {
			setTimeout(waitForVisible, 50);
		}
	};
	waitForVisible();
	animate();
}

/* ---------- boot ---------------------------------------------------- */
function bootPyramid() {
	if (!$("#name")?.classList.contains("top"))
		return setTimeout(bootPyramid, 100);
	init();
}
bootPyramid();
