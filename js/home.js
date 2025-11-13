const NAME = "Sumeet Saini";
const TYPE_SPEED = 100;
const CURSOR_PAUSE = 1300;

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
window.completeIntro = function(container) {
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
