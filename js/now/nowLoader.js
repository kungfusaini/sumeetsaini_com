// Now page loader - automatically loads the most recent month from content/now/

// Static list of available months - update this when adding new files
const AVAILABLE_MONTHS = [
	{ month: 10, year: 2025, filename: "10-2025.html" },
	{ month: 11, year: 2025, filename: "11-2025.html" },
	// Add new months here as they're created
];

export async function loadNowContent() {
	try {
		if (AVAILABLE_MONTHS.length === 0) {
			return "<h2>Now</h2><p>No now page content found.</p>";
		}

		// Find the most recent entry from static list
		const latestEntry = AVAILABLE_MONTHS.reduce((latest, current) => {
			const latestDate = new Date(latest.year, latest.month - 1);
			const currentDate = new Date(current.year, current.month - 1);
			return currentDate > latestDate ? current : latest;
		});

		// Load ONLY the most recent content immediately
		const content = await loadNowContentByMonth(
			latestEntry.month,
			latestEntry.year,
		);

		// Generate selector HTML using static list (no HTTP requests)
		const selectorHTML = generateSelectorHTML(
			latestEntry.month,
			latestEntry.year,
		);

		// Wrap with h2 and selector for consistency with other pages
		return `<h2>Now</h2>${selectorHTML}${content}`;
	} catch (error) {
		console.error("Error loading now content:", error);
		return "<h2>Now</h2><p>Could not load now page content.</p>";
	}
}

export async function loadNowContentByMonth(month, year) {
	try {
		const monthStr = month.toString().padStart(2, "0");
		const filename = `${monthStr}-${year}.html`;

		const response = await fetch(`content/now/${filename}`);
		if (!response.ok) {
			throw new Error(`Failed to load ${filename}`);
		}

		return await response.text();
	} catch (error) {
		console.error("Error loading month content:", error);
		return `<p>Content for ${getMonthName(month)} ${year} not found.</p>`;
	}
}

export function generateSelectorHTML(selectedMonth, selectedYear) {
	try {
		const availableYears = getAvailableYears();
		const availableMonths = getAvailableMonths(selectedYear);

		const yearOptions = availableYears
			.map(
				(year) =>
					`<option value="${year}" ${year == selectedYear ? "selected" : ""}>${year}</option>`,
			)
			.join("");

		const monthNames = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];

		const monthOptions = monthNames
			.map((name, index) => {
				const monthValue = (index + 1).toString().padStart(2, "0");
				const isAvailable = availableMonths.includes(monthValue);
				const isSelected = index + 1 === selectedMonth;
				return `<option value="${monthValue}" ${isSelected ? "selected" : ""} ${!isAvailable ? "disabled" : ""}>${name}</option>`;
			})
			.join("");

		return `
			<div class="now-selector">
				<select id="year-selector">
					${yearOptions}
				</select>
				<select id="month-selector">
					${monthOptions}
				</select>
			</div>
		`;
	} catch (error) {
		console.error("Error generating selector:", error);
		return "";
	}
}

export function getAvailableYears() {
	const years = new Set();

	AVAILABLE_MONTHS.forEach((entry) => {
		years.add(entry.year);
	});

	return Array.from(years).sort((a, b) => b - a); // Sort descending
}

export function getAvailableMonths(year) {
	const months = new Set();

	AVAILABLE_MONTHS.forEach((entry) => {
		if (entry.year === year) {
			months.add(entry.month.toString().padStart(2, "0"));
		}
	});

	return Array.from(months).sort();
}

// Helper function to get month name
export function getMonthName(month) {
	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	return monthNames[month - 1] || "Unknown";
}
