import fetch from "node-fetch";
import fs from "fs";
import * as cheerio from "cheerio";

const resultsFile = "api/nyt/nyt_graphics_full.json";
const notFoundFile = "api/nyt/notFound.txt";
const headersPath = "api/nyt/headers.json";
const maxRetries = 3; // 🔹 Maximum retry attempts per image
const retryDelay = 5000; // 🔹 Wait time (5s) between retries

// Load headers from JSON
let headers = {};
try {
    headers = JSON.parse(fs.readFileSync(headersPath, "utf8"));
} catch (error) {
    console.error(`❌ Error loading headers from ${headersPath}:`, error);
    process.exit(1);
}

// Load the existing JSON data
let articles = [];
try {
    articles = JSON.parse(fs.readFileSync(resultsFile, "utf8"));
} catch (error) {
    console.error(`❌ Error loading JSON from ${resultsFile}:`, error);
    process.exit(1);
}

// Filter articles that are missing images
const missingImages = articles.filter(article => !article.img || article.img === "No Image");
console.log(`🔍 Found ${missingImages.length} articles missing images.`);

// If no missing images, exit the script
if (missingImages.length === 0) {
    console.log("✅ No missing images. Exiting.");
    process.exit(0);
}

const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/16.2 Mobile/15E148 Safari/537.36"
];

function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Modify fetch function to include a **randomized** User-Agent
async function fetchOGImage(articleUrl, retries = 0) {
    try {
        console.log(`🔍 Trying to fetch OG image: ${articleUrl} (Attempt ${retries + 1})`);

        const response = await fetch(articleUrl, {
            headers: {
                ...headers,
                "User-Agent": getRandomUserAgent() // 🆕 Randomized User-Agent
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        return $('meta[property="og:image"]').attr("content") ||
            $('meta[property="twitter:image"]').attr("content") ||
            null;

    } catch (error) {
        console.error(`❌ Error fetching OG image for ${articleUrl}: ${error.message}`);

        if (retries < maxRetries) {
            console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return fetchOGImage(articleUrl, retries + 1);
        } else {
            console.log(`❌ Giving up on: ${articleUrl}`);
            return null;
        }
    }
}


// Process articles one by one with a delay
async function processArticles() {
    const notFound = [];

    for (const article of missingImages) {
        const img = await fetchOGImage(article.url);
        if (img) {
            article.img = img;
        } else {
            notFound.push(article.url);
        }

        // Small delay between requests to avoid getting blocked
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Save the updated JSON file
    fs.writeFileSync(resultsFile, JSON.stringify(articles, null, 2));
    console.log(`💾 Updated JSON saved to ${resultsFile}`);

    // Save failed URLs to notFound.txt
    if (notFound.length > 0) {
        fs.writeFileSync(notFoundFile, notFound.join("\n"));
        console.log(`❌ ${notFound.length} images not found. Saved to ${notFoundFile}`);
    } else {
        console.log("✅ All images retrieved successfully!");
    }
}

// Run the script
processArticles();
