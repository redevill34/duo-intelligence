// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

const pwa = VitePWA({
  strategies: "generateSW",
  filename: "sw.js",
  outDir: "dist/client",
  injectRegister: null,
  registerType: "autoUpdate",
  manifest: false,
  devOptions: { enabled: false },
  workbox: {
    globDirectory: "dist/client",
    globPatterns: [
      "assets/**/*.{js,css,woff,woff2}",
      "icons/*.png",
      "favicon.ico",
      "manifest.webmanifest",
      "_shell.html",
    ],
    navigateFallback: null,
    cleanupOutdatedCaches: true,
    // Only the anonymous build-time shell is cached, never actual route responses.
    runtimeCaching: [
      {
        urlPattern: ({ request, url }) =>
          request.mode === "navigate" &&
          url.origin === self.location.origin &&
          !url.pathname.startsWith("/~oauth") &&
          [
            "/",
            "/parametres",
            "/taches",
            "/calendrier",
            "/memoire",
            "/conversations",
            "/assistant",
            "/projets",
            "/documents",
          ].includes(url.pathname),
        handler: "NetworkFirst",
        options: {
          cacheName: "duo-navigation-no-store",
          networkTimeoutSeconds: 3,
          cacheableResponse: { statuses: [0] },
          precacheFallback: { fallbackURL: "/_shell.html" },
        },
      },
    ],
  },
});

export default defineConfig({
  plugins: [
    pwa,
    {
      name: "duo-offline-after-prerender",
      apply: "build",
      buildApp: {
        order: "post",
        async handler() {
          // TanStack writes its anonymous shell after the client bundle closes.
          const plugin = pwa.find((p) => p.name === "vite-plugin-pwa");
          await plugin?.api?.generateSW();
        },
      },
    },
  ],
  tanstackStart: {
    spa: { enabled: true, prerender: { outputPath: "/_shell.html" } },
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
