/* ---------- contact form handling ---------- */
export function setupContactForm() {
	const contactForm = document.getElementById('contactForm');
	if (!contactForm) return;

	contactForm.addEventListener('submit', async function(e) {
		e.preventDefault();

		const resultDiv = document.getElementById('result');
		const submitButton = e.target.querySelector('button[type="submit"]');
		
		// Show loading state
		submitButton.textContent = 'Sending...';
		submitButton.disabled = true;
		resultDiv.style.display = 'block';
		resultDiv.style.background = 'var(--dark-grey)';
		resultDiv.style.color = 'var(--cream)';
		resultDiv.style.border = '1px solid var(--orange)';
		resultDiv.textContent = 'Sending message...';

		const body = new URLSearchParams(new FormData(e.target)).toString();

		try {
			const res = await fetch('/vulkan/web_contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body
			});

			const text = await res.text();
			
			if (res.ok) {
				resultDiv.style.background = 'rgba(214, 93, 3, 0.2)';
				resultDiv.style.color = 'var(--cream)';
				resultDiv.style.border = '1px solid var(--orange)';
				resultDiv.textContent = '✅ Message sent successfully!';
				e.target.reset();
			} else {
				resultDiv.style.background = 'rgba(251, 241, 199, 0.1)';
				resultDiv.style.color = 'var(--cream)';
				resultDiv.style.border = '1px solid var(--cream)';
				resultDiv.textContent = '❌ Error, please try again later';
			}
		} catch (err) {
			resultDiv.style.background = 'rgba(251, 241, 199, 0.1)';
			resultDiv.style.color = 'var(--cream)';
			resultDiv.style.border = '1px solid var(--cream)';
			resultDiv.textContent = '❌ Error, please try again later';
		} finally {
			submitButton.textContent = 'Send Message';
			submitButton.disabled = false;
		}
	});
}