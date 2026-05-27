#!/usr/bin/env node
// Regenerates the no-JS fallback sections inside index.html from live sources:
//   - content/now/*.html  → now section + radios + per-month CSS
//   - vulkan.sumeetsaini.com/projects/  → projects accordion
//   - arcanecodex.dev/index.json  → recent blog posts
//
// Run with: npm run build-fallback

import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INDEX_PATH = join(ROOT, "index.html");
const NOW_DIR = join(ROOT, "content", "now");

const PROJECTS_URL = "https://vulkan.sumeetsaini.com/projects/";
const BLOG_URL = "https://arcanecodex.dev/index.json";

const MONTH_NAMES = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun",
	"Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function escapeHtml(s) {
	return String(s ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// ---------- NOW ----------
async function buildNow() {
	const files = (await readdir(NOW_DIR)).filter((f) => /^\d{2}-\d{4}\.html$/.test(f));
	const entries = await Promise.all(
		files.map(async (filename) => {
			const [mm, yyyy] = filename.replace(".html", "").split("-").map(Number);
			const content = await readFile(join(NOW_DIR, filename), "utf8");
			return { month: mm, year: yyyy, content: content.trimEnd() };
		}),
	);
	// Sort chronologically (oldest → newest), matches existing fallback order.
	entries.sort((a, b) => (a.year - b.year) || (a.month - b.month));

	const latest = entries[entries.length - 1];
	const id = (e) => `sel-now-${e.year}-${String(e.month).padStart(2, "0")}`;
	const contentId = (e) => `now-${e.year}-${String(e.month).padStart(2, "0")}`;

	const radios = entries
		.map((e) => {
			const checked = e === latest ? " checked" : "";
			return `      <input type="radio" name="now-month" id="${id(e)}" class="now-month-selector"${checked}>`;
		})
		.join("\n");

	// Per-month CSS — one block for active-label color, one for content display.
	const labelRules = entries
		.map((e) => `    #fallback-content:has(#${id(e)}:checked) .now-month-nav label[for="${id(e)}"]`)
		.join(",\n");
	const contentRules = entries
		.map((e) => `    #fallback-content:has(#${id(e)}:checked) #${contentId(e)}`)
		.join(",\n");
	const css = `${labelRules} {
      color: var(--cream);
    }
${contentRules} {
      display: block;
    }`;

	const monthDivs = entries
		.map((e) => {
			const label = `${MONTH_SHORT[e.month - 1]} ${e.year}`;
			return `<div id="${contentId(e)}" class="now-month-content">
<p class="now-date">${label}</p>
${e.content}
</div>`;
		})
		.join("\n\n");

	const navLabels = entries
		.map((e) => `<label for="${id(e)}">${MONTH_SHORT[e.month - 1]} ${e.year}</label>`)
		.join("\n");
	const nav = `<div class="now-month-nav">\n${navLabels}\n</div>`;

	const section = `${monthDivs}\n\n${nav}`;

	return { radios, css, section };
}

// ---------- PROJECTS ----------
async function buildProjects() {
	const res = await fetch(PROJECTS_URL);
	if (!res.ok) throw new Error(`Projects API ${res.status}`);
	const data = await res.json();
	const projects = (data.projects || []).filter((p) => !p.draft);

	return projects
		.map((p) => {
			const title = escapeHtml(p.title);
			const tech = (p.tech || []).map((t) => `<code>${escapeHtml(t)}</code>`).join(" ");
			// Prefer site-specific copy if present, fall back to short description.
			const longText = p.text?.sumeetsaini || p.description || "";
			// Strip markdown-ish stuff lightly: keep the first paragraph.
			const desc = escapeHtml(longText.split(/\n\s*\n/)[0].trim());
			const link = p.link
				? `<p><a href="${escapeHtml(p.link)}" target="_blank" rel="noopener">Visit Project &rarr;</a></p>`
				: "";
			return `<details>
  <summary><strong>${title}</strong>${tech ? " " + tech : ""}</summary>
  <p>${desc}</p>${link ? "\n  " + link : ""}
</details>`;
		})
		.join("\n");
}

// ---------- BLOG ----------
async function buildBlog() {
	const res = await fetch(BLOG_URL);
	if (!res.ok) throw new Error(`Blog API ${res.status}`);
	const posts = await res.json();
	// Sort newest first.
	posts.sort((a, b) => new Date(b.date) - new Date(a.date));

	const items = posts
		.map((p) => {
			const d = new Date(p.date);
			const dateLabel = `${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
			const href = p.permalink || p.url;
			return `<li><a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(p.title)}</a> &mdash; ${dateLabel}</li>`;
		})
		.join("\n");

	return `<ul>\n${items}\n</ul>`;
}

// ---------- replace markers ----------
function replaceBlock(src, marker, replacement) {
	const open = marker.openHtml ?? `<!-- BEGIN:${marker.name} -->`;
	const close = marker.closeHtml ?? `<!-- END:${marker.name} -->`;
	const re = new RegExp(
		`${escapeRegex(open)}[\\s\\S]*?${escapeRegex(close)}`,
		"m",
	);
	if (!re.test(src)) {
		throw new Error(`Marker pair not found for: ${marker.name}`);
	}
	return src.replace(re, `${open}\n${replacement}\n${close}`);
}

function escapeRegex(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- main ----------
async function main() {
	const [now, projects, blog] = await Promise.all([
		buildNow(),
		buildProjects(),
		buildBlog(),
	]);

	let html = await readFile(INDEX_PATH, "utf8");

	html = replaceBlock(html, { name: "fallback-now-css", openHtml: "/* BEGIN:fallback-now-css */", closeHtml: "/* END:fallback-now-css */" }, now.css);
	html = replaceBlock(html, { name: "fallback-now-radios" }, now.radios);
	html = replaceBlock(html, { name: "fallback-now-section" }, now.section);
	html = replaceBlock(html, { name: "fallback-projects" }, projects);
	html = replaceBlock(html, { name: "fallback-blog" }, blog);

	await writeFile(INDEX_PATH, html);
	console.log(`✓ Rebuilt fallback in index.html`);
	console.log(`  now:      ${(await readdir(NOW_DIR)).filter((f) => /^\d{2}-\d{4}\.html$/.test(f)).length} months`);
	console.log(`  projects: ${(projects.match(/<details>/g) || []).length} entries`);
	console.log(`  blog:     ${(blog.match(/<li>/g) || []).length} posts`);
}

main().catch((err) => {
	console.error("build-fallback failed:", err);
	process.exit(1);
});
