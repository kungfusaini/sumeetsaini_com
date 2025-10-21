import { emit, on } from "../controller/main.js";
import { POPUP_FADE_OUT_DURATION_MS } from "./config.js";

export function closeContent() {
	const main = document.querySelector("main");
	document.body.classList.remove("content-mode");
	main.classList.remove("popup-scrollable");

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

	// Check if content overflows and apply scrollable class if needed
	checkContentOverflow();

	// Trigger fade-in in next frame
	requestAnimationFrame(() => {
		document.body.classList.add("content-mode");
	});
}

function checkContentOverflow() {
	const main = document.querySelector("main");
	const isMobile = window.innerWidth <= 600;

	if (isMobile) {
		// Check if content height exceeds available space
		const contentHeight = main.scrollHeight;
		const availableHeight = window.innerHeight * 0.45; // 45vh (since popup starts at 40vh and max-height is calc(100vh - 55vh))

		if (contentHeight > availableHeight) {
			main.classList.add("popup-scrollable");
		} else {
			main.classList.remove("popup-scrollable");
		}
	}
}

/* ---------- event listeners ---------- */
export function initPopupEventListeners() {
	// Listen for controller events
	on("popup:showContent", (data) => {
		showContent(data.contentPath, data.title);
	});

	// Listen for window resize to recheck overflow
	window.addEventListener("resize", () => {
		const main = document.querySelector("main");
		if (main.style.visibility === "visible") {
			checkContentOverflow();
		}
	});
}
