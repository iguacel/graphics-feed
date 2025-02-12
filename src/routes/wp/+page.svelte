<script>
	import List from '$lib/components/List.svelte';
	import Header from '$lib/components/Header.svelte';
</script>

<main>
	<Header
		siteTitle="WP graphics feed"
		siteDescription="Graphics, visualizations and maps from <a href='https://www.washingtonpost.com/' target='_blank' rel='noopener noreferrer'>The Washington Post</a>"
	/>
	<List
		url="https://raw.githubusercontent.com/iguacel/graphics-feed/main/api/wp/wapo_graphics_feed.json"
		media="wp"
	/>
</main>

<style>
	main {
		margin: 0 auto;
		color: var(--c-fg);
		padding: 1em;
		max-width: 1600px;
	}

	@media (min-width: 800px) {
		main {
			padding: 2em;
		}
	}

	@media (min-width: 1200px) {
		main {
			padding: 4em;
		}
	}
</style>
