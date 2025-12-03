// Blog fetcher - loads latest posts from Arcane Codex

const BLOG_API_URL =
	window.location.hostname === "localhost"
		? "http://arcanecodex.localhost/index.json"
		: "https://arcanecodex.dev/index.json";

export async function fetchBlogPosts() {
	try {
		const response = await fetch(BLOG_API_URL);
		if (!response.ok) {
			throw new Error("Failed to fetch blog posts");
		}
		return await response.json();
	} catch (error) {
		console.error("Error fetching blog posts:", error);
		return [];
	}
}

export function categorizePosts(posts) {
	// Filter to only include actual blog posts (not pages like About)
	const blogPosts = posts.filter(
		(post) => post.permalink && post.permalink.includes("/posts/"),
	);

	const techPosts = blogPosts.filter(
		(post) => post.categories && post.categories.includes("Tech"),
	);

	const nonTechPosts = blogPosts.filter(
		(post) => !post.categories || !post.categories.includes("Tech"),
	);

	techPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
	nonTechPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

	return {
		latestTech: techPosts[0] || null,
		latestNonTech: nonTechPosts[0] || null,
	};
}

function normalizePermalink(permalink) {
	if (!permalink) return "";

	const isLocalDev = window.location.hostname === "localhost";

	// If we're on localhost, keep localhost URLs
	if (isLocalDev && permalink.includes("localhost:1313")) {
		// Just add protocol if missing
		if (permalink.startsWith("//")) {
			return "http:" + permalink;
		}
		return permalink;
	}

	// If we're on production, convert localhost URLs to production
	if (!isLocalDev && permalink.includes("localhost:1313")) {
		return permalink.replace(
			/^(https?:)?\/\/localhost:1313/,
			"https://arcanecodex.dev",
		);
	}

	// Handle protocol-relative URLs
	if (permalink.startsWith("//")) {
		return "https:" + permalink;
	}

	return permalink;
}

function formatDate(dateString) {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function stripHTMLTags(html) {
	return html.replace(/<[^>]*>/g, "");
}

export function createBlogCardHTML(post) {
	if (!post) {
		return "<p>No posts available yet.</p>";
	}

	const date = formatDate(post.date);
	const category =
		post.categories && post.categories.length > 0
			? post.categories[0]
			: "Uncategorized";

	const excerpt = post.summary
		? stripHTMLTags(post.summary).substring(0, 150) + "..."
		: "Read more about this topic.";

	const permalink = normalizePermalink(post.permalink);
	const readingTime = post.readingTime ? ` • ${post.readingTime} min read` : "";

	return `
    <div class="blog-card" onclick="window.open('${permalink}', '_blank', 'noopener')">
      <h5>
        <a href="${permalink}" target="_blank" rel="noopener">
          ${post.title}
        </a>
      </h5>
      <p><em>${date} • ${category}${readingTime}</em></p>
      <p>${excerpt} <a href="${permalink}" target="_blank" rel="noopener">Read more →</a></p>
    </div>
  `;
}

export async function loadBlogContent() {
	try {
		const posts = await fetchBlogPosts();
		const { latestTech, latestNonTech } = categorizePosts(posts);

		if (posts.length === 0) {
			return "<h2>Blog</h2><p>No blog posts found.</p>";
		}

		const techHTML = createBlogCardHTML(latestTech);
		const nonTechHTML = createBlogCardHTML(latestNonTech);

		return `
      <h2>Blog</h2>
      <p> My blog
        <a href="https://arcanecodex.dev" target="_blank" rel="noopener">
<img src="/assets/link_icons/arcanecodex.svg" alt="Arcane Codex" class="link-icon">
          Arcane Codex
        </a> is where I write about my projects, thoughts and experiences. Check out some of my latest posts.
      </p>

      <section class="blog-section">
        <h4>Something Technical:</h4>
        ${techHTML}
      </section>

      <section class="blog-section">
        <h4>Something Not:</h4>
        ${nonTechHTML}
      </section>

    `;
	} catch (error) {
		console.error("Error loading blog content:", error);
		return "<h2>Blog Highlights</h2><p>Could not load blog posts.</p>";
	}
}
