import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audits (A11Y-01..A11Y-06)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.setItem('stips_notice', '1');
      } catch {}
    });
  });

  const publicRoutes = [
    { name: 'Landing (/)', path: '/' },
    { name: 'Sign In (/signin)', path: '/signin' },
    { name: 'Privacy (/privacy)', path: '/privacy' },
    { name: 'Terms (/terms)', path: '/terms' },
    { name: 'Cookies (/cookies)', path: '/cookies' },
    { name: 'Guidelines (/guidelines)', path: '/guidelines' },
    { name: 'Accessibility (/accessibility)', path: '/accessibility' },
    { name: 'Contact (/contact)', path: '/contact' }
  ];

  for (const route of publicRoutes) {
    test(`A11Y-01 [Public]: axe scan on ${route.name}`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalOrSerious = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      if (criticalOrSerious.length > 0) {
        console.error(
          `Axe violations on ${route.name}:`,
          JSON.stringify(criticalOrSerious, null, 2)
        );
      }

      expect(criticalOrSerious).toEqual([]);
    });
  }
});
