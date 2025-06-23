<script>
	import Img from '$lib/components/Img.svelte';
	import ArticleData from '$lib/components/ArticleData.svelte';

	const { data } = $props();
</script>

<div class="content">
	<a href={data.url} aria-label="Link to article" target="_blank" rel="noopener noreferrer">
		<p class="media">{data?.media}</p>

		<Img src={data?.img} alt={data?.description} />
	</a>

	<ArticleData {data} />
</div>

<style>
	.content {
		margin: 0 0 2em 0;
		position: relative;
	}

	.media {
		position: absolute;
		top: 0;
		left: 0;
		padding: 5px 10px 5px 5px;
		background: var(--c-bg);
		color: var(--c-fg);
		z-index: 2;
		font-size: 12px;
	}
</style>
