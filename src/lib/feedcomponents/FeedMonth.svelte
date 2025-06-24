<script>
	import Article from './Article.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { formatDateIso } from '../../utils/utils';
	import { onMount } from 'svelte';

	let { url, media } = $props();

	let articles = $state([]);
	let lastUpdated = $state('');
	let loading = $state(true);
	let lastUpdatedFormatted = $state('');

	function isToday(articleDate, lastUpdatedDate) {
		return articleDate.slice(0, 10) === lastUpdatedDate.slice(0, 10);
	}

	onMount(async () => {
		try {
			const response = await fetch(url);
			const { articles: fetchedArticles, lastUpdated: fetchedUpdated } = await response.json();

			lastUpdated = fetchedUpdated;
			lastUpdatedFormatted = formatDateIso(fetchedUpdated);

			const now = new Date(fetchedUpdated).getTime();
			const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

			articles = fetchedArticles
				.filter((article) => {
					const published = new Date(article.timestamp).getTime();
					return now - published <= THIRTY_DAYS_MS;
				})
				.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // optional: sort by date descending
		} catch (error) {
			console.error('Failed to fetch articles:', error);
		} finally {
			loading = false;
		}
	});
</script>

<p class="lastUpdate">{lastUpdatedFormatted ? lastUpdatedFormatted : ''}</p>

<br />

<section>
	{#if loading}
		<Skeleton />
	{:else if articles.length > 0}
		{#each articles as article}
			<Article
				data={{
					id: 0,
					isToday: isToday(article.timestamp, lastUpdated) ? 'highlight' : '',
					headline: article.headline,
					url: article.url,
					date: article.timestamp,
					credits: [],
					description: '',
					square_img: '',
					img: article.image,
					media: article.publication
				}}
				{media}
			/>
		{/each}
	{:else}
		<p>No hay artículos disponibles.</p>
	{/if}
</section>

<style>
	section {
		display: grid;
		grid-template-columns: 1fr;
		grid-gap: 1em;
		justify-content: center;
		grid-auto-flow: dense;
		margin-bottom: 2em;
	}

	@media (min-width: 600px) {
		section {
			grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		}
	}

	@media (min-width: 900px) {
		section {
			grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		}
	}

	@media (min-width: 1200px) {
		section {
			grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		}
	}

	.lastUpdate {
		opacity: 0.5;
	}
</style>
