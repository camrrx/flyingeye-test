<template>
	<div class="w-full h-full relative">
		<div ref="cesiumContainer" class="w-full h-full"></div>
		<div class="absolute bottom-0 left-0 right-0 z-10">
			<FlightPlayerControls
				:step="currentStep"
				:maxStep="steps.length - 1"
				:playing="playing"
				@prev="prevStep"
				@next="nextStep"
				@play="play"
				@pause="pause"
			/>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import FlightPlayerControls from "./FlightPlayerControls.vue";

const cesiumContainer = ref(null);
let viewer = null;
let droneEntity = null;
let coneEntities = [];
let pointEntities = [];
let pathEntity = null;

let records = null;
const steps = ref([]);

const currentStep = ref(0);
const playing = ref(false);
let playInterval = null;

Cesium.Ion.defaultAccessToken = import.meta.env.CESIUM_TOKEN;

const createVisionCone = (
	position,
	heading,
	pitch,
	roll,
	length = 150,
	fov = 60
) => {
	const positionCartesian = Cesium.Cartesian3.fromDegrees(
		position.longitude,
		position.latitude,
		position.altitude
	);

	const hpr = new Cesium.HeadingPitchRoll(
		Cesium.Math.toRadians(heading),
		Cesium.Math.toRadians(pitch),
		Cesium.Math.toRadians(roll)
	);
	const orientation = Cesium.Transforms.headingPitchRollQuaternion(
		positionCartesian,
		hpr
	);

	// Angle de champ de vision (en radians)
	const fovRad = Cesium.Math.toRadians(fov);
	const halfFovH = fovRad / 2.0;
	const halfFovV = fovRad / 2.0;

	const localConePoints = [
		// Top-Right (+Y, +Z)
		new Cesium.Cartesian3(
			length,
			length * Math.tan(halfFovV),
			length * Math.tan(halfFovH)
		),
		// Top-Left (+Y, -Z)
		new Cesium.Cartesian3(
			length,
			length * Math.tan(halfFovV),
			-length * Math.tan(halfFovH)
		),
		// Bottom-Left (-Y, -Z)
		new Cesium.Cartesian3(
			length,
			-length * Math.tan(halfFovV),
			-length * Math.tan(halfFovH)
		),
		// Bottom-Right (-Y, +Z)
		new Cesium.Cartesian3(
			length,
			-length * Math.tan(halfFovV),
			length * Math.tan(halfFovH)
		),
	];

	// Transformer les points locaux en coordonnées monde en utilisant l'orientation du drone
	const worldConePoints = localConePoints.map(localPoint => {
		const modelMatrix = Cesium.Matrix4.fromRotationTranslation(
			Cesium.Matrix3.fromQuaternion(orientation),
			positionCartesian
		);
		return Cesium.Matrix4.multiplyByPoint(
			modelMatrix,
			localPoint,
			new Cesium.Cartesian3()
		);
	});

	// Dessiner les 4 arêtes du cône
	for (const conePoint of worldConePoints) {
		coneEntities.push(
			viewer.entities.add({
				polyline: {
					positions: [positionCartesian, conePoint],
					width: 2,
					material: Cesium.Color.LIME,
				},
			})
		);
	}

	// Dessiner le contour de la base
	coneEntities.push(
		viewer.entities.add({
			polyline: {
				positions: [...worldConePoints, worldConePoints[0]],
				width: 2,
				material: Cesium.Color.LIME,
			},
		})
	);

	coneEntities.push(
		viewer.entities.add({
			polygon: {
				hierarchy: new Cesium.PolygonHierarchy([
					positionCartesian,
					...worldConePoints,
				]),
				material: Cesium.Color.WHITE.withAlpha(0.1),
			},
		})
	);
};

function clearCone() {
	for (const e of coneEntities) {
		if (viewer && !viewer.isDestroyed()) {
			viewer.entities.remove(e);
		}
	}
	coneEntities = [];
}

function clearDrone() {
	if (droneEntity) {
		if (viewer && !viewer.isDestroyed()) {
			viewer.entities.remove(droneEntity);
		}
	}
	droneEntity = null;
}

function updateDronePositionAndCamera(stepIdx) {
	clearDrone();
	clearCone();

	const step = steps.value[stepIdx];
	if (!step) {
		return;
	}

	const position = Cesium.Cartesian3.fromDegrees(
		step.longitude,
		step.latitude,
		step.height || step.altitude || 0
	);

	droneEntity = viewer.entities.add({
		position: position,
		billboard: {
			image: "/drone.png",
			width: 100,
			height: 100,
			rotation:
				step.attitude_head !== undefined
					? Cesium.Math.toRadians(step.attitude_head)
					: 0,
			disableDepthTestDistance: Infinity,
		},
		label: {
			text: String(stepIdx + 1),
			font: "12px sans-serif",
			verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
			pixelOffset: new Cesium.Cartesian2(0, -18),
			disableDepthTestDistance: Infinity,
		},
	});

	createVisionCone(
		{
			longitude: step.longitude,
			latitude: step.latitude,
			altitude: step.height || step.altitude || 0,
		},
		step.attitude_head !== undefined ? step.attitude_head : 0,
		step.attitude_pitch !== undefined ? step.attitude_pitch : 0,
		step.attitude_roll !== undefined ? step.attitude_roll : 0
	);

	// Centrer la caméra sur la nouvelle position du drone
	viewer.camera.flyTo({
		destination: Cesium.Cartesian3.fromDegrees(
			step.longitude,
			step.latitude,
			step.height + 500 || step.altitude + 500 || 0
		),
		duration: 1.0,
	});
}

function clearPoints() {
	for (const e of pointEntities) {
		if (viewer && !viewer.isDestroyed()) {
			viewer.entities.remove(e);
		}
	}
	pointEntities = [];
}

function showStepPoints() {
	clearPoints();
	steps.value.forEach((step, idx) => {
		pointEntities.push(
			viewer.entities.add({
				position: Cesium.Cartesian3.fromDegrees(
					step.longitude,
					step.latitude,
					step.height || step.altitude || 0
				),
				point: {
					pixelSize: 8,
					color: Cesium.Color.YELLOW,
					outlineColor: Cesium.Color.BLACK,
					outlineWidth: 1,
				},
				label: {
					text: String(idx + 1),
					font: "14px sans-serif",
					fillColor: Cesium.Color.BLACK,
					outlineColor: Cesium.Color.WHITE,
					outlineWidth: 2,
					verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
					pixelOffset: new Cesium.Cartesian2(4, -10),
					disableDepthTestDistance: Infinity,
				},
			})
		);
	});
}

function prevStep() {
	if (currentStep.value > 0) {
		currentStep.value--;
		updateDronePositionAndCamera(currentStep.value);
	}
}
function nextStep() {
	if (currentStep.value < steps.value.length - 1) {
		currentStep.value++;
		updateDronePositionAndCamera(currentStep.value);
	}
}
function play() {
	if (playing.value) return;

	playing.value = true;
	if (currentStep.value === steps.value.length - 1) {
		currentStep.value = 0;
	}
	updateDronePositionAndCamera(currentStep.value);

	playInterval = setInterval(() => {
		if (currentStep.value < steps.value.length - 1) {
			currentStep.value++;
			updateDronePositionAndCamera(currentStep.value);
		} else {
			pause();
		}
	}, 800);
}

function pause() {
	playing.value = false;
	if (playInterval) {
		clearInterval(playInterval);
	}
	playInterval = null;
}

onMounted(async () => {
	try {
		const response = await fetch("../../public/jsonTest.json");
		if (!response.ok) {
			throw new Error(`Erreur chargement JSON: ${response.statusText}`);
		}
		const jsonData = await response.json();
		records = jsonData.flight_records;

		if (!records || typeof records !== "object") {
			console.error("Error");
			return;
		}

		steps.value = Object.values(records);

		if (steps.value.length === 0) {
			console.warn("Aucune donnée d'étape trouvée dans le JSON.");
			return;
		}

		viewer = new Cesium.Viewer(cesiumContainer.value, {
			terrainProvider: new Cesium.EllipsoidTerrainProvider(),
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

		const path = steps.value.map(step =>
			Cesium.Cartesian3.fromDegrees(
				step.longitude,
				step.latitude,
				step.height || step.altitude || 0
			)
		);
		pathEntity = viewer.entities.add({
			polyline: {
				positions: path,
				width: 3,
				material: Cesium.Color.GREEN,
			},
		});

		showStepPoints();
		updateDronePositionAndCamera(currentStep.value);
	} catch (error) {
		console.error(
			"Erreur lors du chargement ou du traitement des données du vol:",
			error
		);
	}
});

onUnmounted(() => {
	if (viewer) {
		viewer.entities.removeAll();
		viewer.destroy();
		viewer = null;
	}
	pause();
});
</script>
