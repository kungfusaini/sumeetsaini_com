import * as THREE from "three";
import { FACES } from "../shared/faces.js";
import {
	FACE_CANVAS_HEIGHT,
	FACE_CANVAS_WIDTH,
	FACE_IMG_OFFSET_Y,
	FACE_IMG_SIZE,
	PYRAMID_EDGE,
} from "./config.js";
import {
	createTextSprite,
	getResponsivePyramidSize,
	getResponsiveTextPosMultiplier,
} from "./helpers.js";
import { shapeState } from "./shapeState.js";

export function buildPyramid(loadedTextures, grainCanvas) {
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

		// Draw grain on the color
		ctx.globalCompositeOperation = "overlay";
		ctx.globalAlpha = 1.0;
		ctx.drawImage(grainCanvas, 0, 0, canvas.width, canvas.height);

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
		face.userData = {
			faceIndex: colorIndex,
		};
		group.add(face);

		// Create text sprite for the face
		const textSprite = createTextSprite(FACES[colorIndex].text);
		textSprite.userData = { faceIndex: colorIndex };
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

		// Store text sprite in shapeState for later updates
		shapeState.textSprites[colorIndex] = textSprite;
	});

	return group;
}
