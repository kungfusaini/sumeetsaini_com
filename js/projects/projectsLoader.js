/**
 * Projects Loader - Fetches and displays projects from vulkan API
 * Integrates with the existing popup system
 */

const API_URL = "https://vulkan.sumeetsaini.com/projects/";

let currentSlideIndex = 0;
let currentImages = [];
let currentProject = null;
let allProjects = []; // Store all projects for filtering

// Export function to load projects
export async function loadProjectsContent() {
	// Always show the heading and intro (like other popups)
	const headerHtml = `<h2>Projects</h2>`;

	try {
		const response = await fetch(API_URL);
		const data = await response.json();

		if (!data.success || !data.projects) {
			return (
				headerHtml + '<div class="projects-error">Unable to load projects</div>'
			);
		}

		// Filter out draft projects
		allProjects = data.projects.filter((p) => !p.draft);

		// Render project grid
		const gridHtml = renderProjectGrid(allProjects);

		// Build complete HTML
		const contentHtml =
			headerHtml +
			`<p class="projects-intro">Check out my projects, click to learn more!</p>` +
			gridHtml;

		// Return content
		return { html: contentHtml, projects: allProjects };
	} catch (error) {
		console.error("Error loading projects:", error);
		return (
			headerHtml + '<div class="projects-error">Unable to load projects</div>'
		);
	}
}

function renderProjectGrid(projects) {
	if (projects.length === 0) {
		return '<div class="projects-empty">No projects found</div>';
	}

	const cardsHtml = projects
		.map((project) => renderProjectCard(project))
		.join("");

	return `
		<div class="projects-grid">
			${cardsHtml}
		</div>
	`;
}

function renderProjectCard(project, index) {
	const imageSrc = project.image || "";
	const videoSrc = project.video || "";
	const techTags = project.tech
		? project.tech.map((t) => `<span class="project-tag">${t}</span>`).join("")
		: "";

	// Use video if available, otherwise fall back to image
	const mediaHtml = videoSrc
		? `<video class="project-video" src="${videoSrc}" autoplay loop muted playsinline preload="metadata"></video>`
		: `<img class="project-image" src="${imageSrc}" alt="${project.title}" loading="lazy">`;

	return `
		<article class="project-card" data-slug="${project.slug}">
			<div class="project-media">
				${mediaHtml}
			</div>
			<div class="project-content">
				<h3 class="project-title">${project.title}</h3>
				<p class="project-description">${project.description || ""}</p>
				<div class="project-tags">${techTags}</div>
			</div>
		</article>
	`;
}

function formatDate(dateStr) {
	if (!dateStr) return "";
	const date = new Date(dateStr);
	const options = { year: "numeric", month: "short", day: "numeric" };
	return date.toLocaleDateString("en-GB", options); // DD MMM YYYY format
}

export function attachProjectClickHandlers(container, projects) {
	const cards = container.querySelectorAll(".project-card");
	console.log("Attaching handlers to cards:", cards.length);

	cards.forEach((card) => {
		card.addEventListener("click", () => {
			console.log("Card clicked:", card.dataset.slug);
			const slug = card.dataset.slug;
			const project = projects.find((p) => p.slug === slug);
			if (project) {
				showProjectDetail(container, project);
			}
		});
	});
}

function showProjectDetail(container, project) {
	currentProject = project;
	currentImages = project.images || [project.image].filter(Boolean);
	currentSlideIndex = 0;

	// Capture current container height BEFORE replacing content
	const currentHeight = container.offsetHeight + "px";
	console.log("Captured height:", currentHeight);

	// Get elements to preserve
	const closeButton = container.querySelector("#close-content");
	const heading = container.querySelector("h2");

	// Get the grid and subtitle to fade out
	const grid = container.querySelector(".projects-grid");
	const intro = container.querySelector(".projects-intro");

	// Fade out grid and intro first
	const fadeOutDuration = 300;
	if (grid) {
		grid.style.transition = `opacity ${fadeOutDuration}ms ease-out`;
		grid.style.opacity = "0";
	}
	if (intro) {
		intro.style.transition = `opacity ${fadeOutDuration}ms ease-out`;
		intro.style.opacity = "0";
	}

	// After fade out, replace content
	setTimeout(() => {
		container.innerHTML =
			(closeButton ? closeButton.outerHTML : "") +
			(heading ? heading.outerHTML : "") +
			renderProjectDetail(project);

		// Apply the captured height to maintain popup size
		container.style.height = currentHeight;

		// Initialize carousel
		initializeCarousel(container, project);
		attachBackButtonHandler(container);
	}, fadeOutDuration);
}

function renderProjectDetail(project) {
	// Get sumeetsaini text only
	const sumeetsainiText =
		project.text?.sumeetsaini || "No description available.";

	return `
		<div class="project-detail">
			<button class="project-back-btn">← Back to Projects</button>
			
			<div class="project-carousel">
				<div class="carousel-wrapper">
					<button class="carousel-btn carousel-prev">❮</button>
					<div class="carousel-images">
						${currentImages
							.map(
								(img, idx) => `
							<img 
								class="carousel-image ${idx === 0 ? "active" : ""}" 
								src="${img}" 
								alt="${project.title} - Image ${idx + 1}"
								data-index="${idx}"
							>
						`,
							)
							.join("")}
					</div>
					<button class="carousel-btn carousel-next">❯</button>
				</div>
				<div class="carousel-counter">
					<span class="carousel-current">1</span> / <span class="carousel-total">${currentImages.length}</span>
				</div>
			</div>

			<div class="project-info">
				<h3 class="project-info-title">${project.title}</h3>
				<div class="project-meta">
					<time class="project-info-date">${formatDate(project.date)}</time>
					${
						project.link
							? `
						<a href="${project.link}" target="_blank" rel="noopener" class="project-link">
							View Live Site →
						</a>
					`
							: ""
					}
				</div>
				<div class="project-tags project-info-tags">
					${
						project.tech
							? project.tech
									.map((t) => `<span class="project-tag">${t}</span>`)
									.join("")
							: ""
					}
				</div>
				<div class="project-text">
					${formatText(sumeetsainiText)}
				</div>
			</div>
		</div>
	`;
}

function formatText(text) {
	if (!text) return "";
	// Convert newlines to paragraphs
	const paragraphs = text.split("\n\n").filter((p) => p.trim());
	return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
}

function initializeCarousel(container, project) {
	const images = container.querySelectorAll(".carousel-image");
	const prevBtn = container.querySelector(".carousel-prev");
	const nextBtn = container.querySelector(".carousel-next");
	const currentEl = container.querySelector(".carousel-current");
	const totalEl = container.querySelector(".carousel-total");

	if (!images.length) return;

	totalEl.textContent = images.length;

	function showImage(index) {
		images.forEach((img, idx) => {
			img.classList.toggle("active", idx === index);
		});
		currentEl.textContent = index + 1;
		currentSlideIndex = index;
	}

	prevBtn.addEventListener("click", () => {
		const newIndex =
			currentSlideIndex > 0 ? currentSlideIndex - 1 : images.length - 1;
		showImage(newIndex);
	});

	nextBtn.addEventListener("click", () => {
		const newIndex =
			currentSlideIndex < images.length - 1 ? currentSlideIndex + 1 : 0;
		showImage(newIndex);
	});

	// Keyboard navigation
	document.addEventListener("keydown", handleCarouselKeydown);
}

function handleCarouselKeydown(e) {
	const detailView = document.querySelector(".project-detail");
	if (!detailView) {
		document.removeEventListener("keydown", handleCarouselKeydown);
		return;
	}

	if (e.key === "ArrowLeft") {
		const prevBtn = detailView.querySelector(".carousel-prev");
		prevBtn?.click();
	} else if (e.key === "ArrowRight") {
		const nextBtn = detailView.querySelector(".carousel-next");
		nextBtn?.click();
	} else if (e.key === "Escape") {
		const backBtn = detailView.querySelector(".project-back-btn");
		backBtn?.click();
	}
}

function attachBackButtonHandler(container) {
	const backBtn = container.querySelector(".project-back-btn");
	if (backBtn) {
		backBtn.addEventListener("click", async () => {
			document.removeEventListener("keydown", handleCarouselKeydown);

			// Fade out detail view
			const detail = container.querySelector(".project-detail");
			if (detail) {
				// Override animation and delay to trigger fade-out immediately
				detail.style.animation = "projectDetailFadeOut 0.5s ease forwards";
				detail.style.animationDelay = "0s";

				const children = detail.querySelectorAll("*");
				children.forEach((child) => {
					child.style.animation = "projectDetailFadeOut 0.5s ease forwards";
					child.style.animationDelay = "0s";
				});
			}

			// Wait for animation to complete
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Get elements to preserve
			const closeButton = container.querySelector("#close-content");
			const heading = container.querySelector("h2");

			const result = await loadProjectsContent();
			// Handle both string and object return types
			const contentHtml =
				typeof result === "object" && result.html ? result.html : result;
			const projects =
				typeof result === "object" && result.projects ? result.projects : null;

			// Get the new heading from content to remove it (we'll use the old one)
			const tempDiv = document.createElement("div");
			tempDiv.innerHTML = contentHtml;
			const newHeading = tempDiv.querySelector("h2");
			if (newHeading) {
				newHeading.remove();
			}

			// Rebuild HTML with preserved heading
			const newContent = tempDiv.innerHTML;
			container.innerHTML =
				(closeButton ? closeButton.outerHTML : "") +
				(heading ? heading.outerHTML : "") +
				newContent;

			// Remove fixed height so popup can resize naturally
			container.style.height = "";

			// Animate the content back in
			setTimeout(() => {
				const intro = container.querySelector(".projects-intro");
				if (intro) {
					intro.style.transition = "opacity 0.6s ease-in-out";
					intro.style.opacity = "1";
				}

				setTimeout(() => {
					const grid = container.querySelector(".projects-grid");
					if (grid) {
						grid.style.transition = "opacity 0.6s ease-in-out";
						grid.style.opacity = "1";
					}

					// Attach click handlers after visible
					if (projects) {
						setTimeout(() => {
							attachProjectClickHandlers(container, projects);
						}, 800);
					}
				}, 300);
			}, 0); // No typewriter delay when coming back from detail
		});
	}
}
