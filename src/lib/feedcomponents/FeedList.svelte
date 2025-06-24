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
		if (!articleDate || !lastUpdatedDate) return false;
		return articleDate.slice(0, 10) === lastUpdatedDate.slice(0, 10);
	}

	onMount(async () => {
		try {
			const response = await fetch(url);
			const { articles: fetchedArticles, lastUpdated: fetchedUpdated } = await response.json();

			lastUpdated = fetchedUpdated;
			lastUpdatedFormatted = formatDateIso(fetchedUpdated);

			articles = fetchedArticles;
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
