<script>
	import { base } from '$app/paths';
	import NYT from '$lib/components/NYT.svelte';
	import WP from '$lib/components/WP.svelte';

</script>

<main>
	<div class="grid">
		<a href="{base}/wp" class="placeholder">
			<WP/>
		</a>
		<a href="{base}/nyt" class="placeholder">
			<NYT/>
		</a>
		<a href="{base}/reuters" class="placeholder">
			<h1>Reuters</h1>
		</a>
		<a href="{base}/bloomberg" class="placeholder">
			<h1>Bloomberg</h1>
		</a>
	</div>
</main>

<style>
	main {
		margin: 0 auto;
		color: var(--c-fg);
		padding: 1em;
		max-width: 1600px;
		height: 100vh;
		display: flex;
	}

	.grid {
		display: grid;
		grid-template-rows: repat(4, 1fr);
		gap: 1em;
		align-items: center;
		width: 100%;
		height: 1;
	}

	h1 {
		font-family: 'Tiny5', serif;
		font-size: 4.5rem;
		opacity: 0.8;
		text-align: center;
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
