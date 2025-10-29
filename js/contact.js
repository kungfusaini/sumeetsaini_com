/* ---------- contact form handling ---------- */
export function setupContactForm() {
	const contactForm = document.getElementById("contactForm");
	if (!contactForm) return;

	const resultDiv = document.getElementById("result");
	const submitButton = contactForm.querySelector('button[type="submit"]');

	// Helper function to set consistent message styling
	const setMessageStyle = () => {
		resultDiv.style.display = "block";
		resultDiv.style.background = "transparent";
		resultDiv.style.color = "var(--orange)";
		resultDiv.style.border = "none";
		resultDiv.style.fontSize = "0.8rem";
	};

	contactForm.addEventListener("submit", async (e) => {
		e.preventDefault();

		// Show loading state
		submitButton.textContent = "Sending...";
		submitButton.disabled = true;
		setMessageStyle();
		resultDiv.textContent = "Sending message...";

		const body = new URLSearchParams(new FormData(e.target)).toString();

		try {
			const res = await fetch("/vulkan/web_contact", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body,
			});

			const data = await res.json();
			setMessageStyle();

			if (res.ok) {
				// Fade out form and status message together
				const form = e.target;
				const fadeOutDuration = 600; // ms
				
				form.style.transition = `opacity ${fadeOutDuration}ms ease-out`;
				resultDiv.style.transition = `opacity ${fadeOutDuration}ms ease-out`;
				form.style.opacity = "0";
				resultDiv.style.opacity = "0";

				setTimeout(() => {
					// Prepare thank you message while still invisible
					form.style.display = "none";
					resultDiv.textContent = "Thanks for reaching out! Talk soon.";
					resultDiv.style.display = "flex";
					resultDiv.style.justifyContent = "center";
					resultDiv.style.alignItems = "center";
					resultDiv.style.minHeight = "200px";
					
					// Small delay then fade in the thank you message
					setTimeout(() => {
						resultDiv.style.transition = `opacity ${fadeOutDuration}ms ease-in`;
						resultDiv.style.opacity = "1";
					}, 100);
				}, fadeOutDuration);
			} else {
				// Display the actual error message from backend
				let errorMessage = "Error, please try again later";
				if (data.error) {
					errorMessage = `Error: ${data.error}`;
				}
				resultDiv.textContent = errorMessage;
			}
		} catch (err) {
			setMessageStyle();
			resultDiv.textContent = "Error, please try again later";
		} finally {
			submitButton.textContent = "Send Message";
			submitButton.disabled = false;
		}
	});
}
