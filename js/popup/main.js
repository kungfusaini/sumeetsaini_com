import { closeContent, initPopupEventListeners } from "./interaction.js";

export function initPopup(_container) {
	initPopupEventListeners();
	document.addEventListener("click", (e) => {
		if (e.target.id === "close-content") {
			closeContent();
		}
	});
}

export { closeContent };
