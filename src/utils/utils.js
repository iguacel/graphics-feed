
export function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
}

export function formatAuthors(authors, media) {
    let authorBaselineURL = '';

    if (media === 'wp') {
        authorBaselineURL = 'https://www.washingtonpost.com/people/';
    } else if (media === 'nyt') {
        authorBaselineURL = 'https://www.nytimes.com/by/';
    } else if (media === 'reuters') {
        authorBaselineURL = 'https://www.reuters.com/authors/';
    } else {
        console.warn(`Unknown media type: ${media}`);
    }

    if (!authors || authors.length === 0) {
        return 'Unknown';
    }

    const formatAuthorLink = (author) => {
        if (!author || !author.slug) {
            return `<span class="author">Unknown</span>`; // Fallback for missing slug
        }

        const slug = author.slug.startsWith('/') ? author.slug.slice(1) : author.slug;
        return `<a class="author" href="${authorBaselineURL}${slug}" aria-label="Link to author profile" target="_blank" rel="noopener noreferrer">${author.name || 'Unknown'}</a>`;
    };

    if (authors.length === 1) {
        return formatAuthorLink(authors[0]);
    }
    if (authors.length === 2) {
        return `${formatAuthorLink(authors[0])} and ${formatAuthorLink(authors[1])}`;
    }

    const allButLastAuthors = authors.slice(0, -1).map(formatAuthorLink).join(', ');
    const lastAuthor = formatAuthorLink(authors[authors.length - 1]);

    return `${allButLastAuthors} and ${lastAuthor}`;
}
