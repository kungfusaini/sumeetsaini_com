const NAME = "Sumeet Saini";
const TYPE_SPEED = 100;
const CURSOR_PAUSE = 1300;

// Prefetch projects and blog in background for faster popup loading
(function prefetchAPIs() {
	// Prefetch projects from vulkan API
	fetch("https://vulkan.sumeetsaini.com/projects/")
		.then((res) => res.json())
		.then((data) => {
			window._projectsCache = data;
			// Also prefetch all project images in background
			if (data.projects) {
				data.projects.forEach((project) => {
					if (project.image) {
						const img = new Image();
						img.src = project.image;
					}
					if (project.video) {
						// Preload video metadata
						const video = document.createElement("video");
						video.preload = "metadata";
						video.src = project.video;
					}
				});
			}
		})
		.catch(() => {});

	// Prefetch blog posts from arcanecodex
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

function moveToTop(container) {
	cursorEl.classList.add("hide");
	nameEl.classList.add("top");
	setTimeout(() => {
		content.classList.remove("hidden");
		// Fade in the shape container with the original 1s transition
		if (container) {
			container.style.opacity = "1";
		}
	}, 600);
}

// Make function available globally for shape module to call
window.completeIntro = (container) => {
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
