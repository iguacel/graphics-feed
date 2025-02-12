import fetch from "node-fetch";
import fs from "fs";
import chalk from "chalk";

const limit = 20; // Number of articles per request
const outputFile = "api/reuters/reuters_graphics_feed.json";

// Reuters API Constants
const collectionId = "TNTERDUKUVEDVKFNDZF57K4SFI";
const baseUrl = "https://www.reuters.com/pf/api/v3/content/fetch/articles-by-collection-alias-or-id-v1";

/**
 * Extracts section label URL from article URL.
 */
function extractLabelUrl(articleUrl) {
    try {
        const urlParts = new URL(articleUrl).pathname.split('/').filter(Boolean);
        return urlParts.length > 0 ? `https://www.reuters.com/${urlParts[0]}/` : null;
    } catch (error) {
        return null;
    }
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
 * Fetch Reuters graphics with pagination.
 */
async function fetchReutersGraphics(offset = 0, results = []) {
    console.log(chalk.blue(`📡 Fetching Reuters graphics (offset: ${offset})...`));

    const queryParams = {
        collection_id: collectionId,
        offset: offset,
        size: limit,
        website: "reuters"
    };

    const url = `${baseUrl}?query=${encodeURIComponent(JSON.stringify(queryParams))}&d=258&mxId=00000000&_website=reuters`;

    try {
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log(chalk.green("✅ Reuters Graphics Retrieved!"));

        const articles = data.result?.articles || [];
        if (articles.length === 0) {
            console.log(chalk.yellow("⚠️ No more articles found."));
            return results;
        }

        const extractedGraphics = articles.map(article => {
            const id = article.id || "No ID";
            const headline = article.title || "Untitled";
            const url = `https://www.reuters.com${article.canonical_url}`;
            const label = extractLabelUrl(url);
            const date = article.published_time || "Unknown date";
            const description = article.description || "No description available";

            const credits = (article.authors || []).map(author => ({
                name: author.name || "Unknown",
                slug: (author.name || "Unknown").toLowerCase().replace(/\s+/g, '-')
            }));

            const img = article.thumbnail?.url || "No Image";

            return { id, headline, url, label, date, description, credits, img };
        });

        results.push(...extractedGraphics);
        console.log(chalk.green(`✅ Retrieved ${extractedGraphics.length} articles.`));

        if (articles.length === limit) {
            return fetchReutersGraphics(offset + limit, results);
        } else {
            console.log(chalk.magenta("🎉 All pages retrieved!"));
            return results;
        }

    } catch (error) {
        console.error(chalk.red("❌ Error fetching data:"), error);
        return results;
    }
}

/**
 * Main function to fetch and save Reuters graphics.
 */
async function main() {
    const existingArticles = readExistingJson(outputFile);
    let allArticles = [...existingArticles];

    const newArticles = await fetchReutersGraphics();
    if (newArticles.length > 0) {
        allArticles = allArticles.concat(newArticles);
    }

    // Remove duplicates based on the 'id' property
    const uniqueArticles = Array.from(new Set(allArticles.map(article => article.id)))
        .map(id => allArticles.find(article => article.id === id));

    // Sort articles by publication date in descending order
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
