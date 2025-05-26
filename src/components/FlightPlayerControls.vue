<template>
	<div class="flex items-center gap-4 justify-center py-4">
		<button
			@click="$emit('prev')"
			:disabled="step === 0"
			class="w-10 h-10 flex items-center justify-center bg-[#2D5C88] text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-400"
		>
			<ChevronLeftIcon class="w-6 h-6" />
		</button>
		<button
			v-if="!playing"
			@click="$emit('play')"
			class="w-10 h-10 flex items-center justify-center bg-[#2D5C88] text-white rounded-full hover:bg-blue-500"
		>
			<PlayIcon class="w-6 h-6" />
		</button>
		<button
			v-else
			@click="$emit('pause')"
			class="w-10 h-10 flex items-center justify-center bg-[#2D5C88] text-white rounded-full hover:bg-blue-500"
		>
			<PauseIcon class="w-6 h-6" />
		</button>
		<button
			@click="$emit('next')"
			:disabled="step === maxStep"
			class="w-10 h-10 flex items-center justify-center bg-[#2D5C88] text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-400"
		>
			<ChevronRightIcon class="w-6 h-6" />
		</button>
		<span class="ml-4 text-sm text-white"
			>Étape {{ step + 1 }} / {{ maxStep + 1 }}</span
		>
	</div>
</template>

<script setup>
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	PlayIcon,
	PauseIcon,
} from "@heroicons/vue/24/solid";

defineProps({
	step: Number,
	maxStep: Number,
	playing: Boolean,
});
</script>
