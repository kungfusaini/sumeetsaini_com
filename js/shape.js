/* ===== CONFIG – change only these ===== */
const FACES = [
	{ text: "Projects", color: "#ff6b6b", link: "#projects" },
	{ text: "About me", color: "#4ecdc4", link: "#about" },
	{ text: "Contact", color: "#45b7d1", link: "#contact" },
];
const PRISM_HEIGHT = 4; // rem
const PRISM_RADIUS = 5; // rem
const ROTATE_SPEED = 1; // 1 = normal, <1 slower, >1 faster
const FONT = "var(--font-mono, monospace)";
/* ====================================== */

const scene = document.createElement("div");
scene.className = "prism-scene";
scene.innerHTML = `
  <div class="prism">
    ${FACES.map(
			(f, i) => `
      <a class="face" href="${f.link}" style="
        --bg:${f.color};
        --index:${i};
        --total:${FACES.length};
        height:${PRISM_HEIGHT}rem;
        width:${2 * PRISM_RADIUS}rem;">
        <span>${f.text}</span>
      </a>`,
		).join("")}
  </div>`;

/* ---- pure CSS 3-D prism ---- */
const style = document.createElement("style");
style.textContent = `
.prism-scene{
  perspective:1000px;
  display:flex;
  align-items:center;
  justify-content:center;
  min-height:50vh;
  touch-action:none;   /* stop scroll while dragging */
}
.prism{
  position:relative;
  transform-style:preserve-3d;
  width:${2 * PRISM_RADIUS}rem;
  height:${PRISM_HEIGHT}rem;
  transition:transform .1s linear;
  cursor:grab;
}
.prism.dragging{ cursor:grabbing; }
.face{
  position:absolute;
  display:flex;
  align-items:center;
  justify-content:center;
  background:var(--bg);
  opacity:.9;
  color:#fff;
  font-family:${FONT};
  font-size:clamp(1rem, 3vw, 1.4rem);
  text-decoration:none;
  transform-origin:center center;
  transform:rotateY(calc(360deg / var(--total) * var(--index)))
           translateZ(${PRISM_RADIUS}rem);
}
`;
document.head.appendChild(style);

/* ---- mouse / touch rotation ---- */
function attachDrag() {
	const prism = scene.querySelector(".prism");
	let baseX = 0,
		baseY = 0,
		rotX = 0,
		rotY = 0,
		dragging = false;

	const start = (e) => {
		dragging = true;
		prism.classList.add("dragging");
		baseX = e.touches ? e.touches[0].clientX : e.clientX;
		baseY = e.touches ? e.touches[0].clientY : e.clientY;
		e.preventDefault();
	};
	const move = (e) => {
		if (!dragging) return;
		const x = (e.touches ? e.touches[0].clientX : e.clientX) - baseX;
		const y = (e.touches ? e.touches[0].clientY : e.clientY) - baseY;
		rotY += x * ROTATE_SPEED;
		rotX -= y * ROTATE_SPEED;
		prism.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
		baseX = e.touches ? e.touches[0].clientX : e.clientX;
		baseY = e.touches ? e.touches[0].clientY : e.clientY;
	};
	const end = () => {
		dragging = false;
		prism.classList.remove("dragging");
	};

	/* mouse */
	prism.addEventListener("mousedown", start);
	window.addEventListener("mousemove", move);
	window.addEventListener("mouseup", end);
	/* touch */
	prism.addEventListener("touchstart", start);
	window.addEventListener("touchmove", move);
	window.addEventListener("touchend", end);
}

function bootPrism() {
	const name = document.getElementById("name");
	if (!name || !name.classList.contains("top")) {
		// not ready yet
		setTimeout(bootPrism, 100);
		return;
	}
	document.querySelector("main").prepend(scene);
	attachDrag();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", bootPrism);
} else {
	// already loaded (e.g. live-reload)
	bootPrism();
}
