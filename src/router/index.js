import { createRouter, createWebHistory } from "vue-router";
import DeviceList from "../views/DeviceList.vue";
import DroneFlight from "../views/DroneFlight.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "devices",
			component: DeviceList,
		},
		{
			path: "/drone",
			name: "drone",
			component: DroneFlight,
		},
	],
});

export default router;
