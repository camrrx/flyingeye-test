import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import cesium from "vite-plugin-cesium";

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), vueDevTools(), cesium()],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	server: {
		port: 4000,
		proxy: {
			"/api": {
				target: "https://test.hub.dev.flyingeye.fr/",
				changeOrigin: true,
				secure: false,
				rewrite: path => path.replace(/^\/api/, "/api"),
			},
		},
	},
});
