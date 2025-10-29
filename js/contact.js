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
				resultDiv.textContent = "Message sent successfully!";
				e.target.reset();
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
