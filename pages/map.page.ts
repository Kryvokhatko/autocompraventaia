import type { Locator, Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export class MapPage extends BasePage {
  readonly navbar: NavbarComponent;
  // Confirmed live: this is a Leaflet map. `.leaflet-container` is the
  // actual visible map div — the generic `[class*="map"]` guess matched 13
  // internal Leaflet panes (leaflet-map-pane, leaflet-tile-pane, etc.),
  // several of which are hidden, so `.first()` was flaky/wrong.
  readonly mapContainer: Locator;
  // Leaflet marker icons carry `leaflet-marker-icon`; excludes their
  // `leaflet-marker-shadow` siblings so the count reflects actual markers.
  readonly markers: Locator;

  constructor(page: Page) {
    super(page, "MapPage");
    this.navbar = new NavbarComponent(page);
    this.mapContainer = page.locator(".leaflet-container");
    this.markers = page.locator(".leaflet-marker-icon");
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to interactive map", { locale });
    await this.page.goto(`/map?_locale=${locale}`);
  }

  async markerCount(): Promise<number> {
    return this.markers.count();
  }
}
