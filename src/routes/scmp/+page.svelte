<script>
	import List from '$lib/components/List.svelte';
	import Header from '$lib/components/Header.svelte';
</script>

<main>
	<Header
		siteTitle="SCMP graphics feed"
		siteDescription="Articles from <a href='https://www.scmp.com/infographic/' target='_blank' rel='noopener noreferrer'>South China Morning Post</a>"
	/>
	<List
		url="https://raw.githubusercontent.com/iguacel/graphics-feed/main/api/scmp/scmp_graphics_feed.json"
		media="scmp"
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
