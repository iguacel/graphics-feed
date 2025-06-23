<script>
	import Img from '$lib/components/Img.svelte';
	import ArticleData from '$lib/components/ArticleData.svelte';

	const { data, media } = $props();

</script>

<div class="content">
	<a href={data.url} aria-label="Link to article" target="_blank" rel="noopener noreferrer">
		<Img src={data?.img} alt={data?.description}/>
	</a>

	<ArticleData {data} {media}/>
</div>

<style>
	.content {
		margin: 0 0 2em 0;
	}
</style>