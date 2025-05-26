<template>
	<div ref="cesiumContainer" class="cesium-container"></div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Viewer, Ion } from "cesium";

const cesiumContainer = ref(null);

onMounted(() => {
	// Configuration du token Cesium Ion
	Ion.defaultAccessToken =
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjYTkzYzZiNy1hNTI4LTRmNDktYmJhOS00NDI0N2FmM2FkNzciLCJpZCI6MzA1MzI5LCJpYXQiOjE3NDc5MjU3Nzl9.twHztm9rPghKse-wqZjELX4p7R-w1hPQGB1IQqtp8pE";

	// Configuration du viewer Cesium
	const viewer = new Viewer(cesiumContainer.value, {
		animation: false,
		baseLayerPicker: false,
		fullscreenButton: false,
		vrButton: false,
		geocoder: false,
		homeButton: false,
		infoBox: false,
		sceneModePicker: false,
		selectionIndicator: false,
		timeline: false,
		navigationHelpButton: false,
		navigationInstructionsInitiallyVisible: false,
	});

	// Suppression du logo Cesium
	viewer.cesiumWidget.creditContainer.style.display = "none";
});
</script>

<style scoped>
.cesium-container {
	width: 100%;
	height: 80vh;
	position: relative;
}
</style>
