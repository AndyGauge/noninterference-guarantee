import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true
    }),
    paths: {
      // Deployed at https://andygauge.github.io/noninterference-guarantee/.
      // Override with BASE_PATH at build time if relocating.
      base: dev ? '' : (process.env.BASE_PATH ?? '/noninterference-guarantee')
    },
    prerender: {
      handleHttpError: 'warn'
    }
  }
};

export default config;
