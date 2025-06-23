<script>
	import Article from '$lib/components/Article.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { onMount } from 'svelte';

	let { url, media } = $props();

	let articles = $state();
	let lastUpdate = $state();
	let loading = $state(true);

	onMount(async () => {
		try {
			articles = await fetch(url).then((res) => res.json());
		} catch (error) {
			console.error('Failed to fetch articles:', error);
		} finally {
			loading = false;
			articles = articles.articles;
			lastUpdate = articles.lastUpdate;
		}
	});
</script>

<section>
	{#if loading}
		<Skeleton />
	{:else if articles && articles.length > 0}
		{#each articles as article}
			<Article data={{
				id: 0,
				
			}} media={media}/>
		{/each}
	{:else}
		<p>No articles available</p>
	{/if}
</section>

<style>
	section {
		display: grid;
		grid-template-columns: 1fr;
		grid-gap: 1em;
		justify-content: center;
		grid-auto-flow: dense;
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
</style>
