<script>
	import List from '$lib/components/List.svelte';
	import Header from '$lib/components/Header.svelte';
</script>

<main>
	<Header
		siteTitle="Graphics feed"
		siteDescription="Latest graphics from the past month by <a href='https://www.nytimes.com/spotlight/graphics' target='_blank' rel='noopener noreferrer'>NYT</a>, <a href='https://www.washingtonpost.com/' target='_blank' rel='noopener noreferrer'>WP</a>, <a href='https://www.bloomberg.com/graphics' target='_blank' rel='noopener noreferrer'>Bloomberg</a>, <a href='https://www.reuters.com/graphics/' target='_blank' rel='noopener noreferrer'>Reuters</a> and <a href='https://www.scmp.com/infographic/' target='_blank' rel='noopener noreferrer'>SCMP</a>."
	/>
	<List
		url="https://raw.githubusercontent.com/iguacel/graphics-feed/main/api/merge/graphics_feed.json" media=""
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
