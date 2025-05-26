<template>
	<div class="overflow-x-auto w-full">
		<table class="min-w-full bg-white">
			<thead>
				<tr class="bg-gray-100">
					<th
						class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
					>
						Nom de l'appareil
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
					>
						Site
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				<tr v-for="device in devices" :key="device.id" class="hover:bg-gray-50">
					<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
						{{ device.dev_name }}
					</td>
					<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
						{{ device.sit_name }}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script setup>
defineProps({
	devices: {
		type: Array,
		required: true,
	},
});
</script>
