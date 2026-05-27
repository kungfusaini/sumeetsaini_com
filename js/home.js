const NAME = "Sumeet Saini";
const TYPE_SPEED = 100;
const CURSOR_PAUSE = 1300;

// Prefetch projects and blog data in background for faster popup loading
// (Only fetches metadata — images/videos load on demand when user opens a project)
(function prefetchAPIs() {
	fetch("https://vulkan.sumeetsaini.com/projects/")
		.then((res) => res.json())
		.then((data) => {
			window._projectsCache = data;
		})
		.catch(() => {});

	fetch("https://arcanecodex.dev/index.json")
		.then((res) => res.json())
		.then((data) => {
			window._blogCache = data;
		})
		.catch(() => {});
})();

const nameEl = document.getElementById("name");
const textEl = nameEl.querySelector(".text");
const cursorEl = nameEl.querySelector(".cursor");
const content = document.getElementById("content");

// Prevent page scrolling
document.body.style.overflow = "hidden";
document.documentElement.style.overflow = "hidden";

// Track when typing is complete
let typingComplete = false;

// TYPEWRITER
let idx = 0;
const typeInterval = setInterval(() => {
	textEl.textContent += NAME[idx++];
	if (idx === NAME.length) {
		clearInterval(typeInterval);
		typingComplete = true;
	}
}, TYPE_SPEED);

// Snap typewriter to its final state (used when switching to simple mode early)
window.completeTypewriterNow = () => {
	clearInterval(typeInterval);
	textEl.textContent = NAME;
	typingComplete = true;
	cursorEl.classList.add("hide");
	nameEl.classList.add("top");
};

function moveToTop(container) {
	cursorEl.classList.add("hide");

	// Safari iOS: fade out → move → fade in (bypasses position animation bugs)
	const isSafariIOS =
		(/iPhone|iPad|iPod/.test(navigator.userAgent) ||
			(navigator.userAgent.includes("Mac") && "ontouchend" in document)) &&
		!/Chrome|Android/.test(navigator.userAgent);

	if (isSafariIOS) {
		// Fade out at current center position
		nameEl.style.transition = "opacity 0.3s ease";
		nameEl.style.opacity = "0";

		setTimeout(() => {
			// Move to final position while hidden
			nameEl.style.transition = "none";
			nameEl.style.left = window.innerWidth <= 600 ? "1rem" : "2rem";
			nameEl.style.top = window.innerWidth <= 600 ? "1rem" : "1.2rem";
			nameEl.style.transform = "none";
			nameEl.style.fontSize = window.innerWidth <= 600 ? "1.2rem" : "";

			// Fade in at final position (sync with shape)
			requestAnimationFrame(() => {
				nameEl.style.transition = "opacity 0.3s ease";
				nameEl.style.opacity = "1";
			});

			setTimeout(() => {
				nameEl.style.transition = "";
				content.classList.remove("hidden");
				if (container) container.style.opacity = "1";
				document.documentElement.classList.add("intro-done");
			}, 300);
		}, 300);
		return;
	}

	// Standard browsers: use CSS transition
	nameEl.classList.add("top");
	setTimeout(() => {
		content.classList.remove("hidden");
		if (container) {
			container.style.opacity = "1";
		}
		document.documentElement.classList.add("intro-done");
	}, 600);
}

// Make function available globally for shape module to call
window.completeIntro = (container) => {
	window._introComplete = true;
	clearTimeout(window._slowTimer);
	document.documentElement.classList.remove('slow-connection');
	// If the user already switched to simple mode while 3D was loading,
	// the name is already in its final state — don't replay the intro.
	if (document.documentElement.classList.contains('simple-mode')) {
		if (container) container.style.opacity = "1";
		return;
	}
	// Only proceed if typing is complete
	if (typingComplete) {
		moveToTop(container);
	} else {
		// If typing isn't complete, wait for it
		const checkTyping = setInterval(() => {
			if (typingComplete) {
				clearInterval(checkTyping);
				moveToTop(container);
			}
		}, 50);
	}
};
