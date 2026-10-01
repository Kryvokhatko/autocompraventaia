import type { APIRequestContext } from "@playwright/test";
import { FavoritesApi } from "./favorites.api";

/**
 * The site's HTTP endpoints, grouped per client, all sharing one request
 * context — so a single instance is either signed in or signed out.
 */
export class SiteApi {
  readonly favorites: FavoritesApi;

  constructor(request: APIRequestContext) {
    this.favorites = new FavoritesApi(request);
  }
}
