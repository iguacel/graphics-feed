<script>
	import { onMount } from 'svelte';

	let theme = 'auto';

	onMount(() => {
		const storedTheme = localStorage.getItem('theme') || 'auto';
		setTheme(storedTheme);
	});

	function setTheme(value) {
		theme = value;
		localStorage.setItem('theme', value);

		console.log('theme', theme);
		// Remove any previous class (light/dark)
		document.body.classList.remove('light', 'dark');
		if (value !== 'auto') {
			document.body.classList.add(value);
		}
	}
</script>

<button class="theme-toggle" on:click={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
	<span class="contrast-icon"></span>
</button>

<style>
	/* Theme Toggle Button */
	.theme-toggle {
		position: fixed;
		top: 1rem;
		right: 1rem;
		width: 40px;
		height: 40px;
		border: none;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.9;
		z-index: 10;
		outline: none;
		box-shadow: none;
		-webkit-tap-highlight-color: transparent;
	}

	/* Contrast Icon */
	.contrast-icon {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: linear-gradient(to right, black 50%, white 50%);
		border: 2px solid var(--icon-border-color);
	}
</style>
