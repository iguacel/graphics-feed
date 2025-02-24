import fetch from "node-fetch";
import fs from "fs";
import chalk from "chalk";

const outputFile = "api/bloomberg/bloomberg_graphics_feed.json";
const baseUrl = "https://www.bloomberg.com/lineup-next/api/paginate";
const pageId = "phx-graphics-v2";
const endpoints = ["top_story", "top_stories_2", "archive_story_list"];
const limit = 12; // Number of articles per archive request

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
 * Extracts section label from Bloomberg URLs.
 */
function extractLabelUrl(articleUrl) {
    try {
        const urlParts = new URL(articleUrl, "https://www.bloomberg.com").pathname.split('/').filter(Boolean);
        return urlParts.length > 1 ? `https://www.bloomberg.com/${urlParts[0]}/` : null;
    } catch (error) {
        return null;
    }
}

/**
 * Fetch Bloomberg graphics from a specific endpoint.
 */
async function fetchBloombergData(endpoint, offset = 0, results = []) {
    console.log(chalk.blue(`📡 Fetching Bloomberg ${endpoint} (offset: ${offset})...`));

    const url = `${baseUrl}?id=${endpoint}&page=${pageId}&offset=${offset}&variation=archive&type=lineup_content`;

    try {
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log(chalk.green(`✅ ${endpoint} Retrieved!`));

        const articles = data[endpoint]?.items || [];
        if (articles.length === 0) {
            console.log(chalk.yellow(`⚠️ No more articles found for ${endpoint}.`));
            return results;
        }

        const extractedGraphics = articles.map(article => {
            const id = article.id || "No ID";
            const headline = article.headline || "Untitled";
            const url = `https://www.bloomberg.com${article.url}`;
            const label = extractLabelUrl(url);
            const date = article.publishedAt || "Unknown date";
            const description = article.summary || "No description available";

            const credits = (article.credits || []).map(author => ({
                name: author.name || "Unknown",
                slug: (author.name || "Unknown").toLowerCase().replace(/\s+/g, '-')
            }));

            const img = article.image?.baseUrl || "No Image";

            return { id, headline, url, label, date, description, credits, img };
        });

        results.push(...extractedGraphics);
        console.log(chalk.green(`✅ Retrieved ${extractedGraphics.length} articles from ${endpoint}.`));

        // If it's the archive and reached limit, fetch more pages
        if (endpoint === "archive_story_list" && articles.length === limit) {
            return fetchBloombergData(endpoint, offset + limit, results);
        } else {
            return results;
        }

    } catch (error) {
        console.error(chalk.red(`❌ Error fetching ${endpoint}:`), error);
        return results;
    }
}

/**
 * Main function to fetch and save Bloomberg graphics.
 */
async function main() {
    const existingArticles = readExistingJson(outputFile);
    let allArticles = [...existingArticles];

    let newArticles = [];

    // Fetch data from all three endpoints
    for (const endpoint of endpoints) {
        const articles = await fetchBloombergData(endpoint);
        newArticles = newArticles.concat(articles);
    }

    if (newArticles.length > 0) {
        allArticles = allArticles.concat(newArticles);
    }

    // Remove duplicates based on 'id'
    const uniqueArticles = Array.from(new Set(allArticles.map(article => article.id)))
        .map(id => allArticles.find(article => article.id === id));

    // Sort articles by date (newest first)
    uniqueArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

    const finalJson = JSON.stringify(uniqueArticles, null, 2);

    // Write to file only if there are new articles
    if (uniqueArticles.length > existingArticles.length) {
        fs.writeFileSync(outputFile, finalJson, "utf8");
        console.log(chalk.green(`✅ File ${outputFile} updated successfully!`));
    } else {
        console.log(chalk.gray("📄 No new articles to update."));
    }
}

// Execute the main function
main();
