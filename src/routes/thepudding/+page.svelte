<script>
	import List from '$lib/components/List.svelte';
	import Header from '$lib/components/Header.svelte';
</script>

<main>
	<Header
		siteTitle="The Pudding feed"
		siteDescription="<a href='https://www.https://pudding.cool/' target='_blank' rel='noopener noreferrer'>Pudding.cool</a> explains ideas with visual essays"
	/>
	<List
		url="https://raw.githubusercontent.com/iguacel/graphics-feed/main/api/thepudding/thepudding_graphics_feed.json"
		media="Pudding"
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
