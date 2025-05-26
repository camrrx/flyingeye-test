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
import jsonTest from "../assets/jsonTest.json";
import FlightPlayerControls from "./FlightPlayerControls.vue";

const cesiumContainer = ref(null);
let viewer = null;
let droneEntity = null;
let coneEntities = [];
let pointEntities = [];
let pathEntity = null;

const records = jsonTest.flight_records;
const steps = Object.values(records);
const currentStep = ref(0);
const playing = ref(false);
let playInterval = null;

// token Cesium
Cesium.Ion.defaultAccessToken =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjYTkzYzZiNy1hNTI4LTRmNDktYmJhOS00NDI0N2FmM2FkNzciLCJpZCI6MzA1MzI5LCJpYXQiOjE3NDc5MjU3Nzl9.twHztm9rPghKse-wqZjELX4p7R-w1hPQGB1IQqtp8pE";

// Fonction pour créer le cône de vision
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

	//Orientation à partir du heading, pitch, roll du drone
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
	if (droneEntity) viewer.entities.remove(droneEntity);
	droneEntity = null;
}

function updateDronePositionAndCamera(stepIdx) {
	clearDrone();
	clearCone();

	const step = steps[stepIdx];
	if (!step) {
		console.warn("Étape invalide:", stepIdx);
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
			rotation: Cesium.Math.toRadians(step.attitude_head),
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
		step.attitude_head,
		step.attitude_pitch,
		step.attitude_roll
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
	for (const e of pointEntities) viewer.entities.remove(e);
	pointEntities = [];
}

function showStepPoints() {
	clearPoints();
	steps.forEach((step, idx) => {
		pointEntities.push(
			viewer.entities.add({
				position: Cesium.Cartesian3.fromDegrees(
					step.longitude,
					step.latitude,
					step.height || step.altitude || 0
				),
				point: {
					pixelSize: 12,
					color: Cesium.Color.YELLOW,
					outlineColor: Cesium.Color.BLACK,
					outlineWidth: 2,
				},
				label: {
					text: String(idx + 1),
					font: "16px sans-serif",
					fillColor: Cesium.Color.BLACK,
					outlineColor: Cesium.Color.WHITE,
					outlineWidth: 2,
					style: Cesium.LabelStyle.FILL_AND_OUTLINE,
					verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
					pixelOffset: new Cesium.Cartesian2(0, -18),
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
	if (currentStep.value < steps.length - 1) {
		currentStep.value++;
		updateDronePositionAndCamera(currentStep.value);
	}
}
function play() {
	playing.value = true;
	playInterval = setInterval(() => {
		if (currentStep.value < steps.length - 1) {
			currentStep.value++;
			updateDronePositionAndCamera(currentStep.value);
		} else {
			pause();
		}
	}, 800);
}
function pause() {
	playing.value = false;
	if (playInterval) clearInterval(playInterval);
}

onMounted(() => {
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
	// Tracé du chemin
	const path = steps.map(step =>
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
	if (steps.length > 0) {
		updateDronePositionAndCamera(currentStep.value);
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
