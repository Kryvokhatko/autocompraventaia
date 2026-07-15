import { test as base } from "@playwright/test";
import { HomePage } from "../pages/home.page";
import { LoginPage } from "../pages/login.page";
import { RegisterPage } from "../pages/register.page";
import { PaymentsPage } from "../pages/payments.page";
import { StatsPage } from "../pages/stats.page";
import { BelowMarketPage } from "../pages/below-market.page";
import { OffersPage } from "../pages/offers.page";
import { MapPage } from "../pages/map.page";
import { TopSalesPage } from "../pages/top-sales.page";
import { NotificationsPage } from "../pages/notifications.page";
import { FavoritesPage } from "../pages/favorites.page";

/**
 * Wires Page Objects into tests, so spec files only ever talk to Page
 * Objects — never construct them inline or touch `page` locators directly.
 */
type PageFixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  paymentsPage: PaymentsPage;
  statsPage: StatsPage;
  belowMarketPage: BelowMarketPage;
  offersPage: OffersPage;
  mapPage: MapPage;
  topSalesPage: TopSalesPage;
  notificationsPage: NotificationsPage;
  favoritesPage: FavoritesPage;
};

export const test = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  paymentsPage: async ({ page }, use) => {
    await use(new PaymentsPage(page));
  },
  statsPage: async ({ page }, use) => {
    await use(new StatsPage(page));
  },
  belowMarketPage: async ({ page }, use) => {
    await use(new BelowMarketPage(page));
  },
  offersPage: async ({ page }, use) => {
    await use(new OffersPage(page));
  },
  mapPage: async ({ page }, use) => {
    await use(new MapPage(page));
  },
  topSalesPage: async ({ page }, use) => {
    await use(new TopSalesPage(page));
  },
  notificationsPage: async ({ page }, use) => {
    await use(new NotificationsPage(page));
  },
  favoritesPage: async ({ page }, use) => {
    await use(new FavoritesPage(page));
  },
});

export { expect } from "@playwright/test";
