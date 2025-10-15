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

// TYPEWRITER
let idx = 0;
const typeInterval = setInterval(() => {
	textEl.textContent += NAME[idx++];
	if (idx === NAME.length) {
		clearInterval(typeInterval);
		setTimeout(moveToTop, CURSOR_PAUSE);
	}
}, TYPE_SPEED);

function moveToTop() {
	cursorEl.classList.add("hide");
	nameEl.classList.add("top");
	setTimeout(() => content.classList.remove("hidden"), 600);
}
