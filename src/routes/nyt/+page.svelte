<script>
	import List from '$lib/components/List.svelte';
	import Header from '$lib/components/Header.svelte';
</script>

<main>
	<Header
		siteTitle="NYT graphics feed"
		siteDescription="Articles from The New York Times Graphics team"
	/>
	<List
		url="https://raw.githubusercontent.com/iguacel/graphics-feed/main/api/nyt/nyt_graphics_feed.json" media="nyt"
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
