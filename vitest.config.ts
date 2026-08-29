import { configDefaults, defineConfig } from "vitest/config";

// Shadows vite.config.ts, which loads the Cloudflare and TanStack Start plugins
// a unit test does not need. .local holds cached action repos with their own tests.
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, ".local/**"] },
});
