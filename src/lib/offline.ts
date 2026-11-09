export function refuseOfflineRegistration(
  host: string,
  production: boolean,
  framed: boolean,
  search: string,
) {
  const hostname = host.toLowerCase();
  const label = hostname.split(".")[0] ?? "";
  const lovableSuffix = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(hostname);
  return (
    !production ||
    framed ||
    new URLSearchParams(search).get("sw") === "off" ||
    (lovableSuffix &&
      (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label) ||
        /^project--.+-dev$/.test(label))) ||
    /(^|\.)(lovableproject\.com|lovableproject-dev\.com|beta\.lovable\.dev)$/.test(hostname)
  );
}

// The only app-shell registrar. Called after hydration; never in preview or dev.
export async function setupOffline() {
  if (!("serviceWorker" in navigator)) return;
  const refused = refuseOfflineRegistration(
    window.location.hostname,
    import.meta.env.PROD,
    window.self !== window.top,
    window.location.search,
  );
  if (refused) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((r) =>
          [r.active, r.waiting, r.installing].some(
            (w) =>
              w &&
              new URL(w.scriptURL).origin === window.location.origin &&
              new URL(w.scriptURL).pathname === "/sw.js",
          ),
        )
        .map((r) => r.unregister()),
    );
    return;
  }
  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
}
