export const PYRAMID_EDGE = 3;
export const CAMERA_FOV_BASE = 50;
export const CAMERA_Z_BASE = 8;
export const CAMERA_Y_BASE = 2;
export const BASE_ROT_SPEED = { x: 0.002, y: 0.002 };
export const DRAG_SENSITIVITY = 0.01;
export const VELOCITY_DAMPING = 0.95;
export const IDLE_TIMEOUT_MS = 6000;
export const TEXT_CANVAS_WIDTH = 1536;
export const TEXT_CANVAS_HEIGHT = 768;
export const TEXT_FONT =
	'Bold 128px "ProFontIIx", "SF Mono", Monaco, monospace';
export const TEXT_SCALE_BASE = { x: 3, y: 1.5, z: 1 };
export const FACE_CANVAS_WIDTH = 4096;
export const FACE_CANVAS_HEIGHT = 4096;
export const FACE_IMG_SIZE = 1500;
export const FACE_IMG_OFFSET_Y = -600;
export const TEXT_POS_MULTIPLIER_BASE = 1.1;
export const PYRAMID_SIZE_MULTIPLIER_BASE = 0.6;
export const MOBILE_PYRAMID_SIZE_MULTIPLIER = 1.0;
export const GRAIN_INTENSITY_FACE = 0.15;
export const GRAIN_SIZE_FACE = 10;
export const INITIAL_PYRAMID_ROTATION = { x: -4.2, y: -0.378, z: 0.0 };
export const TRANSITION_SPEED = 0.05;
export const PAUSE_DURATION_MS = 3000;
export const POPUP_CLOSE_TRANSITION_MS = 1000;
export const TRANSITION_CLOSENESS_THRESHOLD = 0.01;
export const DEBUG_ROTATION_INCREMENT = 0.05;
export const MOBILE_BREAKPOINT = 600;
export const POPUP_POSITION_DESKTOP = { x: -3.5, y: 0, z: 0 };
export const POPUP_POSITION_MOBILE = { x: 0, y: 1, z: 0 };
export const POPUP_SCALE = 0.7;
export const POPUP_FADE_DURATION_MS = 500;
export const DRAG_THRESHOLD_PX = 3; // Minimum pixels to consider it a drag
export const FACES = [
	{
		text: "About",
		color: "--black-grey",
		link: "#projects",
		image: "assets/dice_images/book.svg",
		rotation: { x: -4, y: 0.8, z: 0 },
		content:
			"<h2>About</h2><p>This is the about section. More content here.</p>",
	},
	{
		text: "Contact",
		color: "--dark-grey",
		link: "#about",
		image: "assets/dice_images/ball.svg",
		rotation: { x: 2.48, y: 8.65, z: -4.7 },
		content: "<h2>Contact</h2><p>Get in touch via email or social media.</p>",
	},
	{
		text: "Blog",
		color: "--mid-grey",
		link: "#contact",
		image: "assets/dice_images/quill.svg",
		rotation: { x: -2.34, y: -3.14, z: 2.35 },
		content: "<h2>Blog</h2><p>Read my latest posts on tech and life.</p>",
	},
	{
		text: "Now",
		color: "--light-grey",
		link: "#blog",
		image: "assets/dice_images/sun.svg",
		rotation: { x: 0.89, y: 9.415, z: -2.4 },
		content: "<h2>Now</h2><p>What I'm up to currently.</p>",
	},
];
