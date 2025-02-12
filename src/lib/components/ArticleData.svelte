<script>
	import { formatDate, formatAuthors } from '../../utils/utils';
	const { data, media } = $props();
</script>

<div class="article-data">
	<a href={data.url} aria-label="Link to article" target="_blank" rel="noopener noreferrer">

        <p class="date">{formatDate(data.date)}</p>
		<h3 class="headline">{data.headline}</h3>
		<!-- <p class="description">{data.description}</p> -->
	</a>

	{#if data.credits && data.credits.length > 0}
		<p class="authors">
			By {@html formatAuthors(data.credits, media)}
		</p>
	{/if}
</div>

<style>
    .date {
        margin: 0.5em 0 0.5em 0;
		font-size: 70%;
		text-transform: uppercase;
	}

	.headline {
		font-size: 1.1rem;
        margin: 0.5em 0 0.5em 0;
		font-weight: 600;
	}

	/* .description {
		font-size: 90%;
	} */
	
	.authors {
		font-size: 80%;
		margin: 1em 0 0 0;
		opacity: 0.7;
	}
</style>
