import { emit, on } from "../controller/main.js";
import { POPUP_FADE_OUT_DURATION_MS } from "./config.js";
import { setupContactForm } from "../contact.js";

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

	// Check if this is a content switch (content already visible)
	const isSwitching =
		main.style.visibility === "visible" && main.innerHTML !== "";

	if (isSwitching) {
		// Fade out current content first
		await fadeOutCurrentContent();
	}

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

	// Set up contact form handler if contact content is loaded
	if (contentPath.includes('contact.html')) {
		setupContactForm();
	}

	// Trigger fade-in in next frame
	requestAnimationFrame(() => {
		if (!isSwitching) {
			document.body.classList.add("content-mode");
		}
		// Start animations after content mode is active
		const animationDelay = parseInt(
			getComputedStyle(document.documentElement).getPropertyValue(
				"--content-animation-delay",
			),
			10,
		);
		setTimeout(
			() => {
				animateContent();
			},
			isSwitching ? 0 : animationDelay,
		);
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

/* ---------- content animations ---------- */
function fadeOutCurrentContent() {
	return new Promise((resolve) => {
		const main = document.querySelector("main");
		const allContent = Array.from(main.children).filter(
			(child) => child.id !== "close-content",
		);

		if (allContent.length === 0) {
			resolve();
			return;
		}

		const fadeDuration = getComputedStyle(
			document.documentElement,
		).getPropertyValue("--content-switch-fade-duration");

		allContent.forEach((element) => {
			element.style.transition = `opacity ${fadeDuration} ease-out`;
			element.style.opacity = "0";
		});

		setTimeout(() => {
			resolve();
		}, parseFloat(fadeDuration) * 1000);
	});
}

function animateContent() {
	const main = document.querySelector("main");
	const heading = main.querySelector("h2");
	const otherElements = Array.from(main.children).filter(
		(child) => child !== heading && child.id !== "close-content",
	);

	if (heading) {
		// Apply typewriter effect to heading
		const text = heading.textContent;
		heading.textContent = "";
		heading.style.opacity = "1";

		let idx = 0;
		const typeSpeed = parseInt(
			getComputedStyle(document.documentElement).getPropertyValue(
				"--content-typewriter-speed",
			),
			10,
		);
		const typeInterval = setInterval(() => {
			heading.textContent += text[idx++];
			if (idx === text.length) {
				clearInterval(typeInterval);
				// Add delay before fade-in starts
				const fadeStartDelay = parseInt(
					getComputedStyle(document.documentElement).getPropertyValue(
						"--content-fade-start-delay",
					),
					10,
				);
				setTimeout(() => {
					fadeInElements(otherElements);
				}, fadeStartDelay);
			}
		}, typeSpeed);
	} else {
		// If no heading, just fade in all elements
		fadeInElements(otherElements);
	}
}

function fadeInElements(elements) {
	const fadeDuration = getComputedStyle(
		document.documentElement,
	).getPropertyValue("--content-fade-duration");
	const staggerDelay = parseInt(
		getComputedStyle(document.documentElement).getPropertyValue(
			"--content-fade-stagger",
		),
		10,
	);

	elements.forEach((element, index) => {
		element.style.opacity = "0";
		element.style.transition = `opacity ${fadeDuration} ease-in-out`;

		setTimeout(() => {
			element.style.opacity = "1";
		}, index * staggerDelay); // Stagger the fade-ins
	});
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
