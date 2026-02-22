export const PYRAMID_EDGE = 3;
export const CAMERA_FOV_BASE = 50;
export const CAMERA_Z_BASE = 8;
export const CAMERA_Y_BASE = 2;
export const BASE_ROT_SPEED = { x: 0.002, y: 0.001 };
export const DRAG_SENSITIVITY = 0.01;
export const VELOCITY_DAMPING = 0.95;
export const IDLE_TIMEOUT_MS = 3000;
export const TEXT_CANVAS_WIDTH = 1536;
export const TEXT_CANVAS_HEIGHT = 768;
export const TEXT_FONT =
	'Bold 128px "ProFontIIx", "SF Mono", Monaco, monospace';
export const TEXT_SCALE_BASE = { x: 3, y: 1.5, z: 1 };
export const FACE_CANVAS_WIDTH = 4096;
export const FACE_CANVAS_HEIGHT = 4096;
export const FACE_IMG_SIZE = 1700;
export const FACE_IMG_OFFSET_Y = -1400;
export const TEXT_POS_MULTIPLIER_BASE = 1.1;
export const PYRAMID_SIZE_MULTIPLIER_BASE = 0.6;
export const MOBILE_PYRAMID_SIZE_MULTIPLIER = 1.0;
export const GRAIN_INTENSITY_FACE = 0.15;
export const GRAIN_SIZE_FACE = 10;
export const INITIAL_PYRAMID_ROTATION = { x: -0.106, y: 0.809, z: -0.651 };
export const TRANSITION_SPEED = 0.05;
export const SHAPE_MOVE_TO_CONTENT_SPEED = 0.08;
export const SHAPE_RETURN_TO_CENTER_SPEED = 0.035;

export const DEBUG_ROTATION_INCREMENT = 0.05;
export const DRAG_THRESHOLD_PX = 3; // Minimum pixels to consider it a drag

// Shape interaction and content display positioning (shape-related)
export const CONTENT_CLOSE_TRANSITION_MS = 1000;
export const CONTENT_POSITION_DESKTOP = { x: -3.5, y: 0, z: 0 };
export const CONTENT_POSITION_MOBILE = { x: 0, y: 3.5, z: 0 };
export const CONTENT_SCALE = 0.7;
export const MOBILE_BREAKPOINT = 600;
export const GUIDANCE_DELAY_MS = 5000;
