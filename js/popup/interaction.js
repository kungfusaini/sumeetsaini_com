import { emit, on } from "../controller/main.js";
import {
	POPUP_FADE_IN_DURATION_MS,
	POPUP_FADE_OUT_DURATION_MS,
} from "./config.js";

export function closeContent() {
	const main = document.querySelector("main");
	document.body.classList.remove("content-mode");

	// Wait for fade-out transition to complete
	setTimeout(() => {
		main.style.visibility = "hidden";
		main.innerHTML = "";
	}, POPUP_FADE_OUT_DURATION_MS);
	emit("popup:closed");
}

export async function showContent(contentPath, title) {
	const main = document.querySelector("main");
	const closeButton =
		'<button id="close-content" style="position: absolute; top: 1rem; right: 1rem; background: var(--dark-grey); color: var(--cream); border: none; padding: 0.5rem; cursor: pointer;">×</button>';

	try {
		const response = await fetch(contentPath);
		if (!response.ok) {
			throw new Error(`Failed to load content: ${contentPath}`);
		}
		const content = await response.text();
		main.innerHTML = closeButton + content;
	} catch (error) {
		console.error("Error loading content:", error);
		main.innerHTML = `${closeButton}<h2>${title}</h2><p>Content could not be loaded.</p>`;
	}

	// Ensure popup is ready for transition
	main.style.visibility = "visible";

	// Trigger fade-in in next frame
	requestAnimationFrame(() => {
		document.body.classList.add("content-mode");
	});
}

/* ---------- event listeners ---------- */
export function initPopupEventListeners() {
	// Listen for controller events
	on("popup:showContent", (data) => {
		showContent(data.contentPath, data.title);
	});
}
