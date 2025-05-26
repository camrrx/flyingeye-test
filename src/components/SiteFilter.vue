<template>
	<div class="mb-6">
		<h2 class="text-lg font-semibold text-gray-700 mb-3">Filtrer par site</h2>
		<div class="flex flex-wrap gap-2">
			<button
				v-for="site in sites"
				:key="site.id"
				@click="toggleSite(site.id)"
				class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
				:class="
					selectedSites.includes(site.id)
						? 'bg-[#2D5C88] text-white'
						: 'bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white'
				"
			>
				{{ site.name }}
			</button>
		</div>
	</div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
	sites: {
		type: Array,
		required: true,
	},
	modelValue: {
		type: Array,
		required: true,
	},
});

const emit = defineEmits(["update:modelValue"]);

const selectedSites = ref(props.modelValue);

const toggleSite = siteId => {
	const index = selectedSites.value.indexOf(siteId);
	if (index === -1) {
		selectedSites.value.push(siteId);
	} else {
		selectedSites.value.splice(index, 1);
	}
	emit("update:modelValue", selectedSites.value);
};

watch(
	() => props.modelValue,
	newValue => {
		selectedSites.value = newValue;
	}
);
</script>
