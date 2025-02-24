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

		if (value === 'light') {
			document.documentElement.dataset.theme = 'light';
		} else if (value === 'dark') {
			document.documentElement.dataset.theme = 'dark';
		} else {
			document.documentElement.removeAttribute('data-theme');
		}
	}
</script>

<button class="theme-toggle" on:click={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
	<span class="contrast-icon"></span>
</button>

<style>
/* Position the button at the top right */
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
	z-index: 1;
}

/* Contrast icon: A sphere split into two halves */
.contrast-icon {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: linear-gradient(to right, black 50%, white 50%);
	border: 2px solid var(--icon-border-color);
}

/* Light Mode: Black border */
:root {
	--icon-border-color: black;
}

/* Dark Mode: White border */
:root[data-theme='dark'] {
	--icon-border-color: white;
}
</style>
