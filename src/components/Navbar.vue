<template>
	<nav class="fixed top-0 left-0 right-0 bg-[#2D5C88] p-4 z-50">
		<div class="flex gap-4">
			<router-link
				to="/"
				class="text-white px-4 py-2 rounded hover:bg-blue-400 transition-colors"
				:class="{ 'bg-blue-400': $route.path === '/' }"
			>
				Liste des appareils
			</router-link>
			<router-link
				to="/drone"
				class="text-white px-4 py-2 rounded hover:bg-blue-400 transition-colors"
				:class="{ 'bg-blue-400': $route.path === '/drone' }"
			>
				Vol drone
			</router-link>
		</div>
	</nav>
</template>

<script setup>
// Le composant est vide car il ne contient que la navigation
</script>
