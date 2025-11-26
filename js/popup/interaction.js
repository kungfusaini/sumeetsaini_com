import { emit, on } from "../controller/main.js";
import { POPUP_FADE_OUT_DURATION_MS } from "./config.js";
import { setupContactForm, getContactState } from "../contact.js";

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
		let content;

		// Check if this is the now loader
		if (contentPath.includes("nowLoader.js")) {
			// Import and use the now loader
			const { loadNowContent } = await import("../now/nowLoader.js");
			content = await loadNowContent();
		} else {
			// Regular HTML file
			const response = await fetch(contentPath);
			if (!response.ok) {
				throw new Error(`Failed to load content: ${contentPath}`);
			}
			content = await response.text();
		}

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
	if (contentPath.includes("contact.html")) {
		setupContactForm();

		// Check if form was previously submitted and restore thank you message
		const contactState = getContactState();
		if (contactState.hasSubmitted && contactState.submissionData) {
			const contactForm = document.getElementById("contactForm");
			const resultDiv = document.getElementById("result");
			const submitButton = contactForm
				? contactForm.querySelector('button[type="submit"]')
				: null;

			if (contactForm && resultDiv && submitButton) {
				// Hide the form and prepare thank you message for animation
				contactForm.style.display = "none";
				resultDiv.textContent = contactState.submissionData.message;
				resultDiv.style.display = "flex";
				resultDiv.style.justifyContent = "center";
				resultDiv.style.alignItems = "center";
				resultDiv.style.minHeight = "200px";
				resultDiv.style.background = "transparent";
				resultDiv.style.color = "var(--orange)";
				resultDiv.style.border = "none";
				resultDiv.style.fontSize = "0.8rem";
				resultDiv.style.opacity = "0"; // Start invisible for fade-in

				// Keep button in submitted state
				submitButton.textContent = "Message Sent";
				submitButton.disabled = true;
				submitButton.style.background = "var(--dark-grey)";
				submitButton.style.color = "var(--grey)";
				submitButton.style.cursor = "not-allowed";
				submitButton.onmouseover = null;
				submitButton.onmouseout = null;
			}
		} else {
			// Ensure form starts with opacity 0 for animation system if not submitted
			const contactForm = document.getElementById("contactForm");
			if (contactForm) {
				contactForm.style.opacity = "0";
			}
		}
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

		// Set up now page selector if present
		if (contentPath.includes("nowLoader.js")) {
			setupNowSelector();
		}
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

				// Fade in now selector immediately after typewriter completes
				const selectorContainer = document.querySelector(".now-selector");
				if (selectorContainer) {
					selectorContainer.classList.add("loaded");
				}

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

/* ---------- now page selector ---------- */
async function setupNowSelector() {
	const yearSelector = document.getElementById("year-selector");
	const monthSelector = document.getElementById("month-selector");
	const selectorContainer = document.querySelector(".now-selector");

	if (!yearSelector || !monthSelector || !selectorContainer) return;

	// Don't auto-fade in selector here - let animateContent handle timing

	// Import now loader functions
	const { getAvailableMonths } = await import("../now/nowLoader.js");

	// Year selector change handler
	yearSelector.addEventListener("change", async () => {
		const selectedYear = parseInt(yearSelector.value);
		const availableMonths = getAvailableMonths(selectedYear);

		// Update month selector options
		const monthNames = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];

		const newMonthOptions = monthNames
			.map((name, index) => {
				const monthValue = (index + 1).toString().padStart(2, "0");
				const isAvailable = availableMonths.includes(monthValue);
				return `<option value="${monthValue}" ${!isAvailable ? "disabled" : ""}>${name} ▼</option>`;
			})
			.join("");

		monthSelector.innerHTML = newMonthOptions;

		// Select first available month
		if (availableMonths.length > 0) {
			monthSelector.value = availableMonths[0];
			await switchNowContent();
		}
	});

	// Month selector change handler
	monthSelector.addEventListener("change", switchNowContent);
}

async function switchNowContent() {
	const yearSelector = document.getElementById("year-selector");
	const monthSelector = document.getElementById("month-selector");

	if (!yearSelector || !monthSelector) return;

	const year = parseInt(yearSelector.value);
	const month = parseInt(monthSelector.value);

	// Import now loader function (only when needed)
	const { loadNowContentByMonth } = await import("../now/nowLoader.js");

	// Fade out current content (except selector and heading)
	const main = document.querySelector("main");
	const selectorContainer = document.querySelector(".now-selector");
	const heading = main.querySelector("h2");
	const contentElements = Array.from(main.children).filter(
		(child) =>
			child !== selectorContainer &&
			child !== heading &&
			child.id !== "close-content",
	);

	// Fade out content
	contentElements.forEach((element) => {
		element.style.transition = "opacity 0.2s ease-out";
		element.style.opacity = "0";
	});

	// Wait for fade out, then load new content ONLY when selected
	setTimeout(async () => {
		try {
			// Load content ONLY when user selects it
			const newContent = await loadNowContentByMonth(month, year);

			// Create temporary container for new content
			const tempDiv = document.createElement("div");
			tempDiv.innerHTML = newContent;

			// Remove old content elements
			contentElements.forEach((element) => element.remove());

			// Add new content after selector
			selectorContainer.insertAdjacentHTML("afterend", newContent);

			// Fade in new content
			const newElements = Array.from(main.children).filter(
				(child) =>
					child !== selectorContainer &&
					child !== heading &&
					child.id !== "close-content",
			);

			newElements.forEach((element, index) => {
				element.style.opacity = "0";
				element.style.transition = "opacity 0.3s ease-in";
				setTimeout(() => {
					element.style.opacity = "1";
				}, index * 50);
			});

			// Recheck content overflow
			checkContentOverflow();
		} catch (error) {
			console.error("Error switching now content:", error);
		}
	}, 200);
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
