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

	// Square-based pyramid with taller triangles
	const baseY = -size;
	const apexHeight = size * 1.8;
	const apexY = baseY + apexHeight;

	// Offset so the centroid is at (0,0,0) for proper rotation
	const centroidOffset = 0.6 * size;
	const vertices = [
		new THREE.Vector3(size, baseY + centroidOffset, size),      // 0: front-right
		new THREE.Vector3(size, baseY + centroidOffset, -size),     // 1: back-right
		new THREE.Vector3(-size, baseY + centroidOffset, -size),    // 2: back-left
		new THREE.Vector3(-size, baseY + centroidOffset, size),      // 3: front-left
		new THREE.Vector3(0, apexY + centroidOffset, 0),            // 4: apex
	];

	// Face definitions
	// 4 triangular side faces + 1 square base
	// Rotation is the initial rotation in degrees - e.g., 180 = 180 degrees
	// Size is the image size in pixels (uses FACE_IMG_SIZE from config if not specified)
	// OffsetY adjusts vertical position of image (uses FACE_IMG_OFFSET_Y from config if not specified)
	const faceDefs = [
		{ indices: [4, 3, 0], colorIndex: 0, isTriangle: true, rotation: -80 },   // Front face (About)
		{ indices: [4, 0, 1], colorIndex: 1, isTriangle: true, rotation: -67 },   // Right face (Contact)
		{ indices: [4, 1, 2], colorIndex: 2, isTriangle: true, rotation: -67 },   // Back face (Blog)
		{ indices: [4, 2, 3], colorIndex: 3, isTriangle: true, rotation: -67, size: 1900 },   // Left face (Now) - larger image
		{ indices: [0, 3, 2, 1], colorIndex: 4, isTriangle: false, rotation: -90, size: 2200, offsetY: 0 }, // Base (Projects) - larger image
	];

	faceDefs.forEach(({ indices, colorIndex, isTriangle, rotation: faceRotation, size: faceSize, offsetY: faceOffsetY }) => {
		const geom = new THREE.BufferGeometry();
		let positions;
		let uvs;
		
		// Variables for triangle UV calculation (used later for image positioning)
		let triP0, triP1, triP2, triMinX, triMaxX, triMinY, triMaxY, triRangeX, triRangeY;

		if (isTriangle) {
			// Triangle face - calculate UVs based on actual vertex positions
			const v0 = vertices[indices[0]];
			const v1 = vertices[indices[1]];
			const v2 = vertices[indices[2]];

			positions = new Float32Array([
				v0.x, v0.y, v0.z,
				v1.x, v1.y, v1.z,
				v2.x, v2.y, v2.z,
			]);

			// Create a local 2D coordinate system on the triangle plane
			// Use the base edge (v0-v1) as the X axis
			const edge = new THREE.Vector3().subVectors(v1, v0);
			const edgeLength = edge.length();
			const xAxis = edge.normalize();
			
			// Get the normal of the triangle
			const v0ToV2 = new THREE.Vector3().subVectors(v2, v0);
			const normal = new THREE.Vector3().crossVectors(edge, v0ToV2).normalize();
			
			// Y axis is perpendicular to X and normal
			const yAxis = new THREE.Vector3().crossVectors(normal, xAxis).normalize();
			
			// Project all vertices onto this 2D plane (relative to v0)
			triP0 = new THREE.Vector2(0, 0);
			triP1 = new THREE.Vector2(edgeLength, 0);
			triP2 = new THREE.Vector2(
				v0ToV2.dot(xAxis),
				v0ToV2.dot(yAxis)
			);
			
			// Normalize UVs to 0-1 range
			triMinX = Math.min(triP0.x, triP1.x, triP2.x);
			triMaxX = Math.max(triP0.x, triP1.x, triP2.x);
			triMinY = Math.min(triP0.y, triP1.y, triP2.y);
			triMaxY = Math.max(triP0.y, triP1.y, triP2.y);
			triRangeX = triMaxX - triMinX || 1;
			triRangeY = triMaxY - triMinY || 1;
			
			// Flip Y so top of triangle (apex) is V=0, bottom is V=1
			uvs = new Float32Array([
				(triP0.x - triMinX) / triRangeX, 1 - (triP0.y - triMinY) / triRangeY,
				(triP1.x - triMinX) / triRangeX, 1 - (triP1.y - triMinY) / triRangeY,
				(triP2.x - triMinX) / triRangeX, 1 - (triP2.y - triMinY) / triRangeY,
			]);
		} else {
			// Square face (base)
			positions = new Float32Array([
				vertices[indices[0]].x,
				vertices[indices[0]].y,
				vertices[indices[0]].z,
				vertices[indices[1]].x,
				vertices[indices[1]].y,
				vertices[indices[1]].z,
				vertices[indices[2]].x,
				vertices[indices[2]].y,
				vertices[indices[2]].z,
				vertices[indices[3]].x,
				vertices[indices[3]].y,
				vertices[indices[3]].z,
			]);
			// UV coordinates for square
			uvs = new Float32Array([1, 1, 0, 1, 0, 0, 1, 0]);
		}

		geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

		// For square faces, we need to define triangles using an index buffer
		if (!isTriangle) {
			const indicesArray = new Uint16Array([0, 1, 2, 0, 2, 3]);
			geom.setIndex(new THREE.BufferAttribute(indicesArray, 1));
		}

		geom.computeVertexNormals();

		// Create composite texture - use triangular aspect ratio for triangle faces
		const canvas = document.createElement("canvas");
		let canvasWidth, canvasHeight;
		
		if (isTriangle) {
			// Triangle face: use aspect ratio matching the triangular geometry
			// Base = 2*size, Height = size*1.8, Aspect ratio ≈ 1.11
			const aspectRatio = (2 * size) / (size * 1.8);
			canvasHeight = FACE_CANVAS_HEIGHT;
			canvasWidth = Math.round(canvasHeight * aspectRatio);
		} else {
			// Square face: use square canvas
			canvasWidth = FACE_CANVAS_WIDTH;
			canvasHeight = FACE_CANVAS_HEIGHT;
		}
		
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		const ctx = canvas.getContext("2d");

		// Fill with unified face color (all faces same color for dynamic lighting)
		const colorValue = getComputedStyle(document.documentElement)
			.getPropertyValue("--mid-grey")
			.trim();
		ctx.fillStyle = colorValue;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw grain on the color
		ctx.globalCompositeOperation = "overlay";
		ctx.globalAlpha = 1.0;
		ctx.drawImage(grainCanvas, 0, 0, canvas.width, canvas.height);

		// Draw image on top with multiply blend for better color integration
		const img = loadedTextures[colorIndex].image;
		const imgSize = faceSize || FACE_IMG_SIZE;
		const imgOffsetY = faceOffsetY !== undefined ? faceOffsetY : FACE_IMG_OFFSET_Y;
		
		let imgX, imgY;
		
		if (isTriangle) {
			// Calculate centroid of triangle in UV space (normalized 0-1)
			// UV coordinates after normalization
			const u0 = (triP0.x - triMinX) / triRangeX;
			const v0 = 1 - (triP0.y - triMinY) / triRangeY;
			const u1 = (triP1.x - triMinX) / triRangeX;
			const v1 = 1 - (triP1.y - triMinY) / triRangeY;
			const u2 = (triP2.x - triMinX) / triRangeX;
			const v2 = 1 - (triP2.y - triMinY) / triRangeY;
			
			// Centroid in UV space
			const centroidU = (u0 + u1 + u2) / 3;
			const centroidV = (v0 + v1 + v2) / 3;
			
			// Convert UV centroid to pixel coordinates on the canvas
			// Centroid should be at center of image
			imgX = centroidU * canvas.width - imgSize / 2;
			imgY = centroidV * canvas.height - imgSize / 2;
			
			// Adjust for offset
			imgY += imgOffsetY;
		} else {
			// Square face: center on canvas
			imgX = (canvas.width - imgSize) / 2;
			imgY = (canvas.height - imgSize) / 2 + imgOffsetY;
		}
		
		ctx.globalCompositeOperation = "multiply";
		ctx.globalAlpha = 1.0;

		// Draw image with face-specific rotation (convert degrees to radians)
		const centerX = imgX + imgSize / 2;
		const centerY = imgY + imgSize / 2;
		ctx.save();
		ctx.translate(centerX, centerY);
		ctx.rotate((faceRotation * Math.PI) / 180);
		ctx.drawImage(img, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
		ctx.restore();

		const texture = new THREE.CanvasTexture(canvas);
		texture.minFilter = THREE.LinearMipmapLinearFilter;
		texture.magFilter = THREE.LinearFilter;

		const mat = new THREE.MeshLambertMaterial({
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

		// Calculate center of the face for text positioning
		const center = new THREE.Vector3();
		if (isTriangle) {
			// For triangle: centroid of 3 vertices
			const v0 = vertices[indices[0]];
			const v1 = vertices[indices[1]];
			const v2 = vertices[indices[2]];
			center
				.add(v0)
				.add(v1)
				.add(v2)
				.multiplyScalar(1 / 3);
		} else {
			// For square: center of base
			center.add(vertices[indices[0]]);
			center.add(vertices[indices[1]]);
			center.add(vertices[indices[2]]);
			center.add(vertices[indices[3]]);
			center.divideScalar(4);
		}

		const textPosMultiplier = getResponsiveTextPosMultiplier(window.innerWidth);
		// Use smaller multiplier for base face (Projects) since it's already lower
		const finalMultiplier = colorIndex === 4 ? textPosMultiplier * 0.85 : textPosMultiplier;
		center.normalize().multiplyScalar(size * finalMultiplier);
		textSprite.position.copy(center);
		group.add(textSprite);

		// Store text sprite in shapeState for later updates
		shapeState.textSprites[colorIndex] = textSprite;
	});

	return group;
}
