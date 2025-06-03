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
 * Defaults to first day of the month if new.
 */
function extractDateFromSlug(slug, existingDates = {}) {
    const match = slug.match(/^(\d{4})_(\d{2})/);
    if (!match) {
        // fallback a fecha muy antigua para evitar errores y dejarlo al final del merge
        return "2000-01-01";
    }

    const year = match[1];
    const month = match[2];

    if (existingDates[slug]) {
        return existingDates[slug];
    }

    return `${year}-${month}-01`;
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
        const response = await axios.get(sourceUrl, { responseType: "text" });

        const records = parse(response.data, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        console.log(chalk.green(`✅ Fetched and parsed ${records.length} records.`));

        return records.map(row => {
            // ✅ Build new URL structure from slug
            let url = "https://pudding.cool/";
            const match = row.slug.match(/^(\d{4})_(\d{2})_(.+)$/);
            if (match) {
                const [, year, month, articleSlug] = match;
                url = `https://pudding.cool/${year}/${month}/${articleSlug}/`;
            }

            return {
                id: row.slug || "No ID",
                headline: row.hed || "Untitled",
                description: row.dek || "No description available",
                url,
                date: extractDateFromSlug(row.slug, existingDates),
                keywords: row.keyword ? row.keyword.split(",").map(k => k.trim()) : [],
                credits: row.author ? formatCredits(row.author) : [],
                img: `https://pudding.cool/common/assets/thumbnails/screenshots/${row.slug}.jpg`
            };
        });
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

    // Sort articles by date (descending)
    uniqueArticles.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return isNaN(dateB - dateA) ? 0 : dateB - dateA;
    });

    const finalJson = JSON.stringify(uniqueArticles, null, 2);

    // Write to file
    try {
        if (uniqueArticles.length > existingArticles.length) {
            fs.writeFileSync(outputFile, finalJson, "utf8");
            console.log(chalk.green(`✅ File ${outputFile} updated successfully!`));
        } else {
            console.log(chalk.gray("📄 No new articles to update."));
        }
    } catch (err) {
        console.error(chalk.red(`❌ Failed to write output file: ${err.message}`));
    }
}

// Run
main();
