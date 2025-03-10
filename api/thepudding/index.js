import axios from "axios";
import fs from "fs";
import chalk from "chalk";
import { parse } from "csv-parse/sync";

const outputFile = "api/thepudding/thepudding_graphics_feed.json";
const sourceUrl = "https://pudding.cool/assets/data/search.csv";

/**
 * Fetches CSV file and returns parsed JSON.
 */
async function fetchPuddingGraphics() {
    console.log(chalk.blue("📡 Fetching The Pudding CSV data..."));

    try {
        // Fetch CSV content
        const response = await axios.get(sourceUrl, { responseType: "text" });

        // Parse CSV into JSON
        const records = parse(response.data, {
            columns: true,  // Use first row as headers
            skip_empty_lines: true,
            trim: true,
        });

        console.log(chalk.green(`✅ Fetched and parsed ${records.length} records.`));

        return records.map(row => ({
            id: row.slug || "No ID",
            headline: row.hed || "Untitled",
            description: row.dek || "No description available",
            url: `https://pudding.cool/projects/${row.slug}/`,
            date: extractDateFromSlug(row.slug),
            keywords: row.keyword ? row.keyword.split(",").map(k => k.trim()) : [],
            authors: row.author ? row.author.split(",").map(a => a.trim()) : [],
            img: `https://pudding.cool/common/assets/thumbnails/screenshots/${row.slug}.jpg`
        }));
    } catch (error) {
        console.error(chalk.red("❌ Error fetching CSV data:"), error);
        return [];
    }
}

/**
 * Extracts a date from the slug format (YYYY_MM_title).
 */
function extractDateFromSlug(slug) {
    const match = slug.match(/^(\d{4})_(\d{2})/);
    return match ? `${match[1]}-${match[2]}-01` : "Unknown date";  // Defaults to first day of the month
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
 * Main function to fetch, merge, and save data.
 */
async function main() {
    const existingArticles = readExistingJson(outputFile);
    let allArticles = [...existingArticles];

    const newArticles = await fetchPuddingGraphics();
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
