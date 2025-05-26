<template>
	<div class="app">
		<h1>Ma To-Do List</h1>
		<input
			v-model="newTask"
			@keyup.enter="addTask"
			placeholder="Ajouter une tâche"
			class="input"
		/>
		<ul>
			<li v-for="(task, index) in tasks" :key="index">
				<label class="task">
					<input type="checkbox" v-model="task.done" />
					<span :class="{ done: task.done }">{{ task.text }}</span>
				</label>
				<button @click="removeTask(index)">❌</button>
			</li>
		</ul>

		<CesiumViewer />
	</div>
</template>

<script setup>
import { ref } from "vue";
import CesiumViewer from "./components/CesiumViewer.vue";

const newTask = ref("");
const tasks = ref([]);

function addTask() {
	if (newTask.value.trim() !== "") {
		tasks.value.push({ text: newTask.value, done: false });
		newTask.value = "";
	}
}

function removeTask(index) {
	tasks.value.splice(index, 1);
}
</script>

<style scoped>
.app {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	font-family: sans-serif;
	background-color: brown;
}
input[type="text"] {
	width: 100%;
	padding: 0.5rem;
	margin-bottom: 1rem;
}
.input {
	width: 300px;
	padding: 0.5rem;
	border: 1px solid #ccc;
	border-radius: 4px;
}
li {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 0.5rem 0;
}
.task {
	display: flex;
	flex-direction: row;
	gap: 10px;
	width: 300px;
}
.done {
	text-decoration: line-through;
	color: rgb(0, 0, 0);
}
button {
	background: none;
	border: none;
	cursor: pointer;
}
</style>
