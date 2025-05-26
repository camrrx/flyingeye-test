<template>
	<div
		class="container mx-auto px-4 py-8 flex flex-col w-screen justify-center items-center"
	>
		<h1 class="text-3xl font-bold text-[#2D5C88] mb-6">Liste des appareils</h1>

		<SiteFilter :sites="sites" v-model="selectedSites" />

		<div v-if="loading" class="flex justify-center items-center h-32">
			<div
				class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
			></div>
		</div>

		<div
			v-else-if="error"
			class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
		>
			{{ error }}
		</div>

		<DeviceTable v-else :devices="filteredDevices" />
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import SiteFilter from "../components/SiteFilter.vue";
import DeviceTable from "../components/DeviceTable.vue";

const devices = ref([]);
const selectedSites = ref([]);
const loading = ref(false);
const error = ref(null);

const API_URL = "/api/device";
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

// Récupérer la liste des sites uniques à partir des appareils
const sites = computed(() => {
	const uniqueSites = new Map();
	devices.value.forEach(device => {
		if (device.sit_id && device.sit_name) {
			uniqueSites.set(device.sit_id, {
				id: device.sit_id,
				name: device.sit_name,
			});
		}
	});
	return Array.from(uniqueSites.values());
});

// Filtrer les appareils en fonction des sites sélectionnés
const filteredDevices = computed(() => {
	if (selectedSites.value.length === 0) {
		return devices.value;
	}
	return devices.value.filter(device =>
		selectedSites.value.includes(device.sit_id)
	);
});

const fetchDevices = async () => {
	loading.value = true;
	error.value = null;

	try {
		const response = await fetch(`${API_URL}?ConId=1`, {
			headers: {
				Authorization: `Bearer ${API_TOKEN}`,
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();

		// Vérifier si data est un tableau ou si les données sont dans une propriété
		const devicesData = Array.isArray(data)
			? data
			: data.devices || data.data || [];

		if (!Array.isArray(devicesData)) {
			throw new Error(
				"Format de données invalide: la réponse n'est pas un tableau"
			);
		}

		devices.value = devicesData.map(device => ({
			id: device.id,
			dev_name: device.dev_name,
			sit_id: device.sit_id,
			sit_name: device.sit_name,
		}));
	} catch (err) {
		console.error("Erreur détaillée:", err);
		error.value =
			err.message || "Une erreur est survenue lors du chargement des appareils";
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	fetchDevices();
});
</script>
