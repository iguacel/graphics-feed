import fetch from "node-fetch";
import fs from "fs";
import * as cheerio from "cheerio";

const limit = 99;
const results = [];
const headersPath = "api/nyt/headers.json";
const resultsFile = "api/nyt/nyt_graphics_full.json";
const maxConcurrentRequests = 5;  // 🔹 Limita la concurrencia en fetch

let headers = {};
try {
    headers = JSON.parse(fs.readFileSync(headersPath, "utf8"));
} catch (error) {
    console.error(`❌ Error loading headers from ${headersPath}:`, error);
    process.exit(1);
}

/**
 * Extracts section label URL from article URL.
 */
function extractLabelUrl(articleUrl) {
    try {
        const urlParts = new URL(articleUrl).pathname.split('/').filter(Boolean);
        return urlParts.length > 3 && /^\d{4}$/.test(urlParts[0]) ?
            `https://www.nytimes.com/${urlParts[3]}/` :
            `https://www.nytimes.com/${urlParts[0]}/`;
    } catch (error) {
        return null;
    }
}

/**
 * Extracts og:image from article HTML using cheerio.
 */
async function extractOGImage(articleUrl) {
    try {
        console.log(`🔍 Fetching OG image from: ${articleUrl}`);

        const response = await fetch(articleUrl, { headers });

        if (!response.ok) {
            console.error(`❌ Failed to fetch OG image for ${articleUrl} (HTTP ${response.status})`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        return $('meta[property="og:image"]').attr("content") ||
            $('meta[property="twitter:image"]').attr("content") ||
            null;

    } catch (error) {
        console.error(`❌ Failed to extract OG image for ${articleUrl}:`, error);
        return null;
    }
}

/**
 * Fetch NYT graphics with pagination using a loop.
 */
async function fetchNYTGraphics() {
    console.log("🚀 Fetching NYT graphics...");
    await fetchNYTGraphicsLoop(null);
    console.log(`📁 Data saved to ${resultsFile}`);
}

/**
 * Fetch NYT graphics with pagination, handling concurrency.
 */
async function fetchNYTGraphicsLoop(cursor) {
    while (true) {
        console.log(`🔵 Fetching NYT graphics (cursor: ${cursor || "first page"})...`);

        const url = `https://samizdat-graphql.nytimes.com/graphql/v2?operationName=CollectionsQuery&variables=${encodeURIComponent(JSON.stringify({
            id: "/spotlight/graphics",
            first: limit,
            streamQuery: { sort: "newest" },
            isFetchMore: true,
            isTranslatable: true,
            isEspanol: false,
            isHighEnd: false,
            highlightsListUri: "nyt://per/personalized-list/__null__",
            highlightsListFirst: 0,
            hasHighlightsList: false,
            cursor: cursor
        }))}&extensions=${encodeURIComponent(JSON.stringify({
            persistedQuery: {
                version: 1,
                sha256Hash: "59179c714425c37ddde7d9cb1b0c52ffb0933c44cf463ac6c1607905f33013c8"
            }
        }))}`;

        try {
            const response = await fetch(url, { method: "GET", headers });

            if (!response.ok) throw new Error(`❌ HTTP error! Status: ${response.status}`);

            const data = await response.json();
            let articles = data?.data?.legacyCollection?.collectionsPage?.stream?.edges || [];
            cursor = data?.data?.legacyCollection?.collectionsPage?.stream?.pageInfo?.endCursor || null;

            if (articles.length === 0) {
                console.log("⚠️ No more articles found.");
                break;
            }

            // 🔹 **Filtrar artículos de COVID antes de procesarlos**
            articles = articles.filter(edge => !edge.node?.url?.includes("covid-cases.html"));

            console.log(`✅ Processing ${articles.length} articles (after filtering COVID cases)...`);

            // 🔹 **Process articles with concurrency**
            const articlePromises = articles.map(async (edge) => {
                const id = edge.node?.id || "No ID";
                const headline = edge.node?.headline?.default || "Untitled";
                const url = edge.node?.url || "No URL";
                const label = extractLabelUrl(edge.node?.url || "");
                const date = edge.node?.firstPublished || "Unknown date";

                const credits = edge.node.bylines?.flatMap(byline =>
                    byline.creators?.map(creator => {
                        const name = creator.displayName || "Unknown";
                        const urlParts = creator.url ? creator.url.split("/by/") : [];
                        const slug = urlParts.length > 1 ? urlParts[1] : name.toLowerCase().replace(/\s+/g, '-');
                        return { name, slug };
                    }) || []
                ) || [];

                const description = edge.node?.summary || "No description available";

                const square_img = edge.node?.promotionalMedia?.crops?.flatMap(crop =>
                    crop.renditions?.map(r => r.url) || []
                )[0] || "No Image";

                // 🔹 Fetch OG image
                const img = await extractOGImage(url);

                return { id, headline, url, label, date, credits, description, square_img, img };
            });

            // 🔹 Control de concurrencia con batches
            const batchResults = [];
            for (let i = 0; i < articlePromises.length; i += maxConcurrentRequests) {
                const batch = articlePromises.slice(i, i + maxConcurrentRequests);
                batchResults.push(...(await Promise.allSettled(batch)));
            }

            // 🔹 Filtrar resultados exitosos
            const successfulResults = batchResults
                .filter(res => res.status === "fulfilled")
                .map(res => res.value);

            results.push(...successfulResults);

            // 🔹 Guardar progresivamente los datos en JSON
            fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
            console.log(`💾 Progress saved to ${resultsFile}`);

            // If no next page, break loop
            if (!cursor) break;

            // 🔹 Add delay between pagination requests
            console.log("⏳ Waiting before next page...");
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3s delay

        } catch (error) {
            console.error("❌ Error fetching data:", error);
            break;
        }
    }
}

// Run the function
fetchNYTGraphics();
