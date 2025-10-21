import { emit, on } from "../controller/main.js";
import { POPUP_FADE_DURATION_MS } from "./config.js";

export function closeContent() {
	const main = document.querySelector("main");
	document.body.classList.remove("content-mode");
	setTimeout(() => {
		main.style.display = "none";
		main.innerHTML = "";
	}, POPUP_FADE_DURATION_MS);
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

	main.style.display = "block";
	setTimeout(() => {
		document.body.classList.add("content-mode");
	}, 10);
}

/* ---------- event listeners ---------- */
export function initPopupEventListeners() {
	// Listen for controller events
	on("popup:showContent", (data) => {
		showContent(data.contentPath, data.title);
	});
}
