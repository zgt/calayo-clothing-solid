import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { vite as vidstack } from 'vidstack/plugins';

export default defineConfig({
  vite: {
    plugins: [tailwindcss(), vidstack()]
  }
});
