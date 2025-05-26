<template>
	<div class="min-h-screen">
		<Navbar />
		<main class="pt-16">
			<router-view></router-view>
		</main>
	</div>
</template>

<script setup>
import Navbar from "./components/Navbar.vue";
</script>
