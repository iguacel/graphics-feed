import axios from "axios";
import fs from "fs";
import chalk from "chalk";
import { parse } from "csv-parse/sync";

const outputFile = "api/thepudding/thepudding_graphics_feed.json";
const sourceUrl = "https://pudding.cool/assets/data/search.csv";

/**
 * Formats author names into "credits" array.
 */
function formatCredits(authors) {
    return authors.split(",").map(name => ({
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/\s+/g, "-")
    }));
}

/**
 * Extracts a date from the slug format (YYYY_MM_title).
 * Uses today's date for new articles, defaults to first day of the month.
 */
function extractDateFromSlug(slug, existingDates = {}) {
    const match = slug.match(/^(\d{4})_(\d{2})/);
    if (!match) return "Unknown date";

    const year = match[1];
    const month = match[2];

    // If article exists, keep its original date
    if (existingDates[slug]) {
        return existingDates[slug];
    }

    // Otherwise, use today's date
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

/**
 * Reads existing JSON data if available.
 */
function readExistingJson(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, "utf8");
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(chalk.red(`❌ Error reading existing JSON file: ${error}`));
    }
    return [];
}

/**
 * Fetch The Pudding graphics data from CSV.
 */
async function fetchPuddingGraphics(existingDates) {
    console.log(chalk.blue("📡 Fetching The Pudding CSV data..."));

    try {
        // Fetch CSV content
        const response = await axios.get(sourceUrl, { responseType: "text" });

        // Parse CSV into JSON
        const records = parse(response.data, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        console.log(chalk.green(`✅ Fetched and parsed ${records.length} records.`));

        return records.map(row => ({
            id: row.slug || "No ID",
            headline: row.hed || "Untitled",
            description: row.dek || "No description available",
            url: `https://pudding.cool/projects/${row.slug}/`,
            date: extractDateFromSlug(row.slug, existingDates),
            keywords: row.keyword ? row.keyword.split(",").map(k => k.trim()) : [],
            credits: row.author ? formatCredits(row.author) : [],
            img: `https://pudding.cool/common/assets/thumbnails/screenshots/${row.slug}.jpg`
        }));
    } catch (error) {
        console.error(chalk.red("❌ Error fetching CSV data:"), error);
        return [];
    }
}

/**
 * Main function to fetch, merge, and save data.
 */
async function main() {
    const existingArticles = readExistingJson(outputFile);
    let allArticles = [...existingArticles];

    // Create a lookup for existing dates by slug
    const existingDates = {};
    existingArticles.forEach(article => {
        existingDates[article.id] = article.date;
    });

    // Fetch new articles
    const newArticles = await fetchPuddingGraphics(existingDates);
    if (newArticles.length > 0) {
        allArticles = allArticles.concat(newArticles);
    }

    // Remove duplicates based on 'id'
    const uniqueArticles = Array.from(new Set(allArticles.map(article => article.id)))
        .map(id => allArticles.find(article => article.id === id));

    // Sort articles by publication date in descending order
    uniqueArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

    const finalJson = JSON.stringify(uniqueArticles, null, 2);

    // Write to file only if new articles are added
    if (uniqueArticles.length > existingArticles.length) {
        fs.writeFileSync(outputFile, finalJson, "utf8");
        console.log(chalk.green(`✅ File ${outputFile} updated successfully!`));
    } else {
        console.log(chalk.gray("📄 No new articles to update."));
    }
}

// Execute the main function
main();
