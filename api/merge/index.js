import fs from "fs";
import path from "path";

const sources = [
    { file: "api/nyt/nyt_graphics_full.json", medium: "NYT" },
    { file: "api/reuters/reuters_graphics_feed.json", medium: "Reuters" },
    { file: "api/wp/wapo_graphics_feed.json", medium: "WP" },
    { file: "api/bloomberg/bloomberg_graphics_feed.json", medium: "Bloomberg" },
    { file: "api/scmp/scmp_graphics_feed.json", medium: "SCMP" },
    { file: "api/thepudding/thepudding_graphics_feed.json", medium: "Pudding" }
];

const mergedFile = "api/merge/graphics_feed.json";

/**
 * Reads and parses a JSON file.
 */
function readJsonFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Warning: File not found - ${filePath}`);
        return [];
    }
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
        console.error(`❌ Error reading file ${filePath}:`, error);
        return [];
    }
}

/**
 * Filters articles from the last month.
 */
function filterLastMonth(data, medium) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return data
        .map(entry => ({
            ...entry,
            medium, // Add source identifier
            date: new Date(entry.date) // Convert to Date object for sorting
        }))
        .filter(entry => entry.date >= oneMonthAgo);
}

// Read, filter, and merge data from all sources
let mergedData = sources.flatMap(({ file, medium }) => filterLastMonth(readJsonFile(file), medium));

// Sort by date (newest first)
mergedData.sort((a, b) => b.date - a.date);

// Convert dates back to ISO string format
mergedData.forEach(entry => entry.date = entry.date.toISOString());

// Save the merged result
fs.mkdirSync(path.dirname(mergedFile), { recursive: true });
fs.writeFileSync(mergedFile, JSON.stringify(mergedData, null, 2));

console.log(`✅ Merged file saved to ${mergedFile}`);
