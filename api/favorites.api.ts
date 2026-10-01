import type { APIRequestContext, APIResponse } from "@playwright/test";

/**
 * GET /api/favorites/count — the endpoint behind the navbar favorites badge.
 *   signed in  → 200 application/json {"count": <number>}
 *   signed out → 302 to /login by default; 401 "Authentication required"
 *                (served as text/html) when the request sends
 *                Accept: application/json
 */
export class FavoritesApi {
  constructor(private readonly request: APIRequestContext) {}

  /** Never follows redirects: a redirect to the login page is a result to
   * assert, not something to follow. */
  count(options: { acceptJson?: boolean } = {}): Promise<APIResponse> {
    return this.request.get("/api/favorites/count", {
      maxRedirects: 0,
      headers: options.acceptJson ? { Accept: "application/json" } : undefined,
    });
  }
}
