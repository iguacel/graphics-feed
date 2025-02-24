import fetch from "node-fetch";
import fs from "fs";
import chalk from "chalk";
import path from "path";
import crypto from "crypto";

const outputFile = "api/scmp/scmp_graphics_feed.json";
const sourceUrl = "https://interactive-static.scmp.com/sheet/graphics/arcade.json";

// SCMP Author mappings
const scmpAuthors = {
    "adolfo": "Adolfo Arranz",
    "pablo": "Pablo Robles",
    "marcelo": "Marcelo Duhalde",
    "marco": "Marco Hernandez",
    "alice": "Alice Tse",
    "julianna": "Julianna Wu",
    "brian": "Brian Wang",
    "kaliz": "Kaliz Lee",
    "henry": "Henry Wong",
    "kuen": "Kuen Lau",
    "joe": "Joe Lo",
    "victor": "Victor Sanjinez",
    "tian": "Yan Jing Tian",
    "rocio": "Rocio Marquez",
    "davies": "Davies Christian Surya",
    "dennis_w": "Dennis Wong",
    "dennis_y": "Dennis Yip",
    "perry": "Perry Tse",
    "han": "Han Huang",
    "darren": "Darren Long",
    "dan": "Dan Bland",
    "yaser": "Yaser Ibrahim",
    "team": "SCMP Graphics Team"
};

/**
 * Generates a short, consistent Base64 ID from a URL.
 */
function generateShortId(url) {
    return crypto.createHash('sha1').update(url).digest('base64url').substring(0, 10);
}

/**
 * Extracts section label from SCMP topics.
 */
function extractLabel(topic) {
    return topic ? `https://www.scmp.com/${topic}/` : null;
}

/**
 * Formats author credits and generates full name slugs.
 */
function formatCredits(creators) {
    return creators
        .filter(Boolean) // Remove null values
        .map(name => {
            const fullName = scmpAuthors[name.toLowerCase()] || name; // Match name or keep original
            return {
                name: fullName,
                slug: fullName.toLowerCase().replace(/\s+/g, '-')
            };
        });
}

/**
 * Converts date from `DD/MM/YYYY` to ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`).
 */
function convertToISODate(dateStr) {
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        console.warn(`⚠️ Invalid or missing date: ${dateStr}`);
        return new Date().toISOString(); // Default to current date if invalid
    }

    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
}

/**
 * Processes SCMP graphics data.
 */
function processSCMPData(data) {
    return data.entries.map(entry => ({
        id: generateShortId(entry.url),
        headline: entry.title || "Untitled",
        url: entry.url,
        label: extractLabel(entry.topic1),
        date: convertToISODate(entry.date), // Convert to ISO format
        description: entry.desc || "No description available",
        credits: formatCredits([entry.creator1, entry.creator2, entry.creator3]),
        img: entry.imageurl || entry.coverimage || "No Image"
    }));
}

/**
 * Fetch SCMP graphics data and save it.
 */
async function fetchSCMPGraphics() {
    console.log(chalk.blue(`📡 Fetching SCMP graphics from ${sourceUrl}...`));

    try {
        const response = await fetch(sourceUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log(chalk.green("✅ SCMP Graphics Retrieved!"));

        const processedGraphics = processSCMPData(data);

        // Save data
        fs.mkdirSync(path.dirname(outputFile), { recursive: true });
        fs.writeFileSync(outputFile, JSON.stringify(processedGraphics, null, 2), "utf8");
        console.log(chalk.green(`✅ File ${outputFile} updated successfully!`));

    } catch (error) {
        console.error(chalk.red("❌ Error fetching data:"), error);
    }
}

// Execute the function
fetchSCMPGraphics();
