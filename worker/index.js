/**
 * Cloudflare Worker entry point used by the production host.
 * Vite emits a client-only application, so every request is served from the
 * static asset binding. Unknown extensionless routes fall back to index.html
 * to preserve client-side navigation if routes are introduced later.
 */
export default {
  async fetch(request, environment) {
    const response = await environment.ASSETS.fetch(request);

    if (response.status !== 404 || request.method !== "GET") {
      return response;
    }

    const url = new URL(request.url);
    const looksLikeClientRoute = !url.pathname.split("/").at(-1)?.includes(".");

    if (!looksLikeClientRoute) {
      return response;
    }

    return environment.ASSETS.fetch(
      new Request(new URL("/index.html", request.url), request),
    );
  },
};
