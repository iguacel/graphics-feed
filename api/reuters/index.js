import puppeteer from "puppeteer";
import fs from "fs";
import chalk from "chalk";

const limit = 20;
const outputFile = "api/reuters/reuters_graphics_feed.json";
const collectionId = "TNTERDUKUVEDVKFNDZF57K4SFI";
const baseUrl = "https://www.reuters.com/pf/api/v3/content/fetch/articles-by-collection-alias-or-id-v1";

async function fetchReutersGraphics(offset = 0, results = []) {
    console.log(chalk.blue(`📡 Fetching Reuters graphics (offset: ${offset})...`));

    const queryParams = {
        collection_id: collectionId,
        offset: offset,
        requestId: Math.floor(offset / limit) + 1,
        size: limit,
        website: "reuters"
    };

    const url = `${baseUrl}?query=${encodeURIComponent(JSON.stringify(queryParams))}&d=266&mxId=00000000&_website=reuters`;

    console.log(chalk.blue(`🔗 URL: ${url}`));

    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        
        const page = await browser.newPage();

        // Set headers to simulate a real browser
        await page.setExtraHTTPHeaders({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
            "Referer": "https://www.reuters.com/graphics/"
        });

        // Navigate to the API URL (bypasses Datadome)
        await page.goto(url, { waitUntil: "networkidle0" });

        // Extract JSON response
        const jsonResponse = await page.evaluate(() => JSON.parse(document.body.innerText));

        await browser.close();
        console.log(chalk.green("✅ Reuters Graphics Retrieved!"));

        const articles = jsonResponse.result?.articles || [];
        
        if (articles.length === 0) {
            console.log(chalk.yellow("⚠️ No more articles found."));
            return results;
        }

        const extractedGraphics = articles.map(article => ({
            id: article.id || "No ID",
            headline: article.title || "Untitled",
            url: `https://www.reuters.com${article.canonical_url}`,
            date: article.published_time || "Unknown date",
            description: article.description || "No description available",
            img: article.thumbnail?.url || "No Image"
        }));

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

async function main() {
    const existingArticles = fs.existsSync(outputFile) ? JSON.parse(fs.readFileSync(outputFile, "utf8")) : [];
    let allArticles = [...existingArticles];

    const newArticles = await fetchReutersGraphics();
    if (newArticles.length > 0) {
        allArticles = allArticles.concat(newArticles);
    }

    const uniqueArticles = Array.from(new Set(allArticles.map(article => article.id)))
        .map(id => allArticles.find(article => article.id === id));

    uniqueArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

    const finalJson = JSON.stringify(uniqueArticles, null, 2);

    if (uniqueArticles.length > existingArticles.length) {
        fs.writeFileSync(outputFile, finalJson, "utf8");
        console.log(chalk.green(`✅ File ${outputFile} updated successfully!`));
    } else {
        console.log(chalk.gray("📄 No new articles to update."));
    }
}

main();
