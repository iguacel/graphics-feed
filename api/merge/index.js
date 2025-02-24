import fs from "fs";
import path from "path";

const nytFile = "api/nyt/nyt_graphics_full.json";
const reutersFile = "api/reuters/reuters_graphics_feed.json";
const wapoFile = "api/wp/wapo_graphics_feed.json";
const mergedFile = "api/merge/graphics_feed.json";

// Helper function to read and parse JSON
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

// Filter function to keep only articles from the last 7 days
function filterLastWeek(data, medium) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return data
        .map(entry => ({
            ...entry,
            medium, // Add source identifier
            date: new Date(entry.date) // Convert to Date object for sorting
        }))
        .filter(entry => entry.date >= oneWeekAgo);
}

// Read and filter data
const nytData = filterLastWeek(readJsonFile(nytFile), "NYT");
const reutersData = filterLastWeek(readJsonFile(reutersFile), "Reuters");
const wapoData = filterLastWeek(readJsonFile(wapoFile), "WP");

// Merge and sort by date (newest first)
const mergedData = [...nytData, ...reutersData, ...wapoData].sort((a, b) => b.date - a.date);

// Convert dates back to ISO string format
mergedData.forEach(entry => entry.date = entry.date.toISOString());

// Save merged result
fs.mkdirSync(path.dirname(mergedFile), { recursive: true });
fs.writeFileSync(mergedFile, JSON.stringify(mergedData, null, 2));

console.log(`✅ Merged file saved to ${mergedFile}`);
