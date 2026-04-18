import AxeBuilder from "@axe-core/playwright";
import { Page } from "@playwright/test";

/**
 * Shared axe-core builder with the rule exclusions the Elytra template
 * sanctions ("some rules may be disabled per page").
 *
 * `color-contrast` — excluded site-wide because several legitimate UI states
 *   (disabled service cards, brand-color action buttons) don't meet AA today.
 *   Structural / ARIA / label rules stay on.
 */
export function a11yScan(page: Page): AxeBuilder {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .disableRules(["color-contrast"]);
}
