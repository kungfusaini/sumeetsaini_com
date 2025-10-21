import { closeContent, onPopupClick } from "./interaction.js";

export function initPopup(container) {
	// Add click event listener for popup interactions
	container.addEventListener("click", (e) => onPopupClick(e, container));

	// Add close button event listener
	document.addEventListener("click", (e) => {
		if (e.target.id === "close-content") {
			closeContent();
		}
	});
}

export { closeContent };
