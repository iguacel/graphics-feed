import fetch from "node-fetch";
import fs from "fs";
import chalk from "chalk";
import path from "path";

const outputFile = "api/scmp/scmp_graphics_feed.json";
const sourceUrl = "https://interactive-static.scmp.com/sheet/graphics/arcade.json";

/**
 * Extracts section label from SCMP URLs.
 */
function extractLabelUrl(articleUrl) {
    try {
        const urlParts = new URL(articleUrl).pathname.split('/').filter(Boolean);
        return urlParts.length > 1 ? `https://www.scmp.com/${urlParts[0]}/` : null;
    } catch (error) {
        return null;
    }
}

/**
 * Processes SCMP graphics data.
 */
function processSCMPData(data) {
    return data.entries.map(entry => ({
        id: entry.url.split('/').pop(),
        headline: entry.title || "Untitled",
        url: entry.url,
        label: extractLabelUrl(entry.url),
        date: entry.date, // Keep as string
        description: entry.desc || "No description available",
        credits: [
            { name: entry.creator1 || "Unknown" },
            entry.creator2 ? { name: entry.creator2 } : null,
            entry.creator3 ? { name: entry.creator3 } : null
        ].filter(Boolean),
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
