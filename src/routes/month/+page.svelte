<script>
	import FeedMonth from '$lib/feedcomponents/FeedMonth.svelte';
	import Header from '$lib/components/Header.svelte';
</script>

<main>
	<Header
		siteTitle="Interactive Journalism"
		siteDescription="Articles from the <a href='https://github.com/sammorrisdesign/interactive-feed' target='_blank' rel='noopener noreferrer'>Interactive Journalism feed</a> published in the last 30 days."
	/>
	<FeedMonth
		url="https://raw.githubusercontent.com/sammorrisdesign/interactive-feed/refs/heads/main/data/all.json"
		media="ia"
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
