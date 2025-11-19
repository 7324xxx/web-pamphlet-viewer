import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import ssrPlugin from 'vite-ssr-components/plugin';

export default defineConfig({
	plugins: [
		cloudflare(),
		//@ts-ignore
		ssrPlugin(),
		tailwindcss(),
		viteStaticCopy({
			targets: [
				{
					src: '../wasm/pkg/*',
					dest: 'wasm',
				},
			],
		}),
	],
	resolve: {
		alias: {
			shared: path.resolve(__dirname, '../shared/src'),
			'/wasm': path.resolve(__dirname, '../wasm/pkg'),
		},
	},
	build: {
		rollupOptions: {
			external: ['/wasm/tile_wasm.js'],
		},
	},
});
