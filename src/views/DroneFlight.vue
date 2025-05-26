<template>
	<div class="py-8 w-screen flex flex-col items-center">
		<h1 class="text-3xl font-bold text-[#2D5C88] mb-6">
			Visualisation du vol du drone
		</h1>

		<div class="h-[70vh] rounded-lg">
			<CesiumMap />
		</div>
	</div>
</template>

<script setup>
import CesiumMap from "../components/CesiumMap.vue";
</script>
