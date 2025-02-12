import fs from 'fs';
import fetch from 'node-fetch';
import chalk from 'chalk';
import authors from './authors.json' assert { type: 'json' };

const currentDate = new Date().toISOString();
const limit = 10; 
const outputFile = 'api/wp/wapo_graphics_feed.json';

console.log(chalk.blue('🚀 Starting script...'));

// Build and encode URLs
const urls = authors.map(({ slug }) =>
    encodeURI(
        `https://www.washingtonpost.com/prism/api/author-feed?_website=washpost&query={"slug":"${slug}","from":"2014","to":"${currentDate}","limit":${limit}}`
    )
);

// Function to fetch author data from a URL
async function getAuthorData(url) {
    try {
        console.log(chalk.yellow(`📡 Fetching data from: ${url}`));
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
				'Accept': 'application/json'
			}
		});
		
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.items.map((item) => ({
            id: item._id,
            headline: item.headlines.basic,
            description: item.description.basic,
            url: item.canonical_url,
            credits: item.credits.by.map((d) => ({ name: d.name, slug: d.slug })),
            date: item.first_publish_date,
            img:
                item.additional_properties.lead_art?.additional_properties?.thumbnailResizeUrl ||
                item.additional_properties.lead_art?.additional_properties?.originalUrl ||
                item.additional_properties.lead_art?.url,
            label: {
                text: item.label_display?.basic?.headline_prefix,
                url: item.label_display?.basic?.url
            }
        }));
    } catch (error) {
        console.error(chalk.red(`❌ Error fetching data from ${url}:`), error);
        return [];
    }
}

// Function to read existing JSON file if it exists
function readExistingJson(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(chalk.red(`❌ Error reading existing JSON file: ${error}`));
    }
    return [];
}

// Main function to get data from all authors, merge and sort articles by publication date, and write the resulting JSON to a file
async function main() {
    const existingArticles = readExistingJson(outputFile);
    let allArticles = [...existingArticles];

    for (const url of urls) {
        const authorData = await getAuthorData(url);

        if (authorData.length > 0) {
            allArticles = allArticles.concat(authorData);
        }
    }

    // Remove duplicates based on the 'id' property
    const uniqueArticles = Array.from(new Set(allArticles.map((article) => article.id)))
        .map((id) => allArticles.find((article) => article.id === id));

    // Sort articles by publication date in descending order
    uniqueArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Compose the final JSON
    const finalJson = JSON.stringify(uniqueArticles, null, 2);

    // Write the JSON to a file only if new articles were added
    if (uniqueArticles.length > existingArticles.length) {
        fs.writeFile(outputFile, finalJson, 'utf8', (err) => {
            if (err) {
                console.error(chalk.red('❌ Error writing file:'), err);
            } else {
                console.log(chalk.green(`✅ File ${outputFile} updated successfully!`));
            }
        });
    } else {
        console.log(chalk.gray('📄 No new articles to update.'));
    }
}

// Execute the main function
main();
