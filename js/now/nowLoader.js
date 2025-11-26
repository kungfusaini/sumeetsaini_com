// Now page loader - automatically loads the most recent month from content/now/

export async function loadNowContent() {
	try {
		// Get list of HTML files in content/now/
		const files = await getNowFiles();

		if (files.length === 0) {
			return "<h2>Now</h2><p>No now page content found.</p>";
		}

		// Find the most recent file
		const latestFile = getLatestFile(files);

		// Load the content
		const response = await fetch(`content/now/${latestFile}`);
		if (!response.ok) {
			throw new Error(`Failed to load ${latestFile}`);
		}

		const content = await response.text();

		// Wrap with h2 for consistency with other pages
		return `<h2>Now</h2>${content}`;
	} catch (error) {
		console.error("Error loading now content:", error);
		return "<h2>Now</h2><p>Could not load now page content.</p>";
	}
}

async function getNowFiles() {
	try {
		// Since we can't directly list directory contents in browser,
		// we'll check for common month files
		const currentYear = new Date().getFullYear();
		const files = [];

		// Check for files from current year and previous year
		for (let year = currentYear; year >= currentYear - 1; year--) {
			for (let month = 12; month >= 1; month--) {
				const monthStr = month.toString().padStart(2, "0");
				const filename = `${monthStr}-${year}.html`;

				try {
					const response = await fetch(`content/now/${filename}`, {
						method: "HEAD",
					});
					if (response.ok) {
						files.push(filename);
					}
				} catch {
					// File doesn't exist, continue
				}
			}
		}

		return files;
	} catch (error) {
		console.error("Error getting now files:", error);
		return [];
	}
}

function getLatestFile(files) {
	if (files.length === 0) return null;

	// Parse filenames and find the most recent
	let latestFile = files[0];
	let latestDate = parseDateFromFilename(latestFile);

	for (let i = 1; i < files.length; i++) {
		const currentDate = parseDateFromFilename(files[i]);
		if (currentDate > latestDate) {
			latestDate = currentDate;
			latestFile = files[i];
		}
	}

	return latestFile;
}

function parseDateFromFilename(filename) {
	// Extract month and year from "mm-yyyy.html" format
	const match = filename.match(/^(\d{2})-(\d{4})\.html$/);
	if (!match) return new Date(0); // Return epoch date for invalid format

	const [, monthStr, yearStr] = match;
	const month = parseInt(monthStr, 10) - 1; // JS months are 0-indexed
	const year = parseInt(yearStr, 10);

	return new Date(year, month, 1);
}
