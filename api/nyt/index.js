import fetch from "node-fetch";
import fs from "fs";
import * as cheerio from "cheerio";

const limit = 20; // 🔹 Solo 20 resultados
const headersPath = "api/nyt/headers.json";
const resultsFile = "api/nyt/nyt_graphics_full.json";
const maxConcurrentRequests = 5; // 🔹 Limita la concurrencia en fetch

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
async function extractOGImage(articleUrl, square_img) {
    try {
        console.log(`🔍 Fetching OG image from: ${articleUrl}`);

        const response = await fetch(articleUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Referer": "https://www.nytimes.com/",
                "Accept-Language": "en-US,en;q=0.9",
            }
        });

        if (!response.ok) {
            console.error(`❌ Failed to fetch OG image for ${articleUrl} (HTTP ${response.status})`);
            return square_img;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        return $('meta[property="og:image"]').attr("content") ||
            $('meta[property="twitter:image"]').attr("content") ||
            square_img;

    } catch (error) {
        console.error(`❌ Failed to extract OG image for ${articleUrl}:`, error);
        return square_img;
    }
}

/**
 * Fetch NYT graphics and merge with existing data.
 */
async function fetchNYTGraphics() {
    console.log("🚀 Fetching NYT graphics...");

    const url = `https://samizdat-graphql.nytimes.com/graphql/v2?operationName=CollectionsQuery&variables=${encodeURIComponent(JSON.stringify({
        id: "/spotlight/graphics",
        first: limit,
        streamQuery: { sort: "newest" },
        exclusionMode: "HIGHLIGHTS_AND_EMBEDDED",
        isFetchMore: true,
        isTranslatable: true,
        isEspanol: false,
        isHighEnd: false,
        highlightsListUri: "nyt://per/personalized-list/__null__",
        highlightsListFirst: 0,
        hasHighlightsList: false
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
        const articles = data?.data?.legacyCollection?.collectionsPage?.stream?.edges || [];

        if (articles.length === 0) {
            console.log("⚠️ No articles found.");
            return;
        }

        console.log(`✅ Processing ${articles.length} articles...`);

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
            )[0] || null;

            // 🔹 Fetch OG image
            const img = await extractOGImage(url, square_img );

            return { id, headline, url, label, date, credits, description, square_img, img };
        });

        // 🔹 Control de concurrencia con batches
        const batchResults = [];
        for (let i = 0; i < articlePromises.length; i += maxConcurrentRequests) {
            const batch = articlePromises.slice(i, i + maxConcurrentRequests);
            batchResults.push(...(await Promise.allSettled(batch)));
        }

        // 🔹 Filtrar resultados exitosos
        const newResults = batchResults
            .filter(res => res.status === "fulfilled")
            .map(res => res.value);

        // 🔹 Leer datos anteriores
        let existingResults = [];
        try {
            const fileData = fs.readFileSync(resultsFile, "utf8");
            existingResults = JSON.parse(fileData);
        } catch (error) {
            console.warn(`⚠️ No previous data found in ${resultsFile}.`);
        }

        // 🔹 Fusionar y evitar duplicados
        const allResults = [...newResults, ...existingResults]
            .filter((item, index, self) =>
                index === self.findIndex((t) => t.id === item.id)
            );

        // 🔹 Guardar el archivo actualizado
        fs.writeFileSync(resultsFile, JSON.stringify(allResults, null, 2));
        console.log(`💾 Data saved to ${resultsFile}`);

    } catch (error) {
        console.error("❌ Error fetching data:", error);
    }
}

// Run the function
fetchNYTGraphics();