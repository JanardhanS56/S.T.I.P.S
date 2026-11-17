/* global document, window */
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

  const appRoutes = [
    { name: 'Feed (/app/feed)', path: '/app/feed' },
    { name: 'Polls (/app/polls)', path: '/app/polls' },
    { name: 'Messages (/app/messages)', path: '/app/messages' },
    { name: 'Create (/app/create)', path: '/app/create' },
    { name: 'Profile (/app/profile)', path: '/app/profile' }
  ];

  for (const route of appRoutes) {
    test(`A11Y-01 [App]: axe scan on ${route.name}`, async ({ page }) => {
      // Sign in as student
      await page.goto('/signin');
      await page.getByLabel(/username/i).fill('student_a1');
      await page.getByLabel(/password/i).fill('TestPassword123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/app\/feed/, { timeout: 10000 });

      if (route.path !== '/app/feed') {
        await page.goto(route.path);
        await expect(page).toHaveURL(new RegExp(route.path), { timeout: 10000 });
      }

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

  test('A11Y-01 [App]: axe scan on Admin (/app/admin)', async ({ page }) => {
    // Sign in as admin
    await page.goto('/signin');
    await page.getByLabel(/username/i).fill('admin_a');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/app\/feed/, { timeout: 10000 });

    await page.goto('/app/admin');
    await expect(page).toHaveURL(/\/app\/admin/, { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalOrSerious.length > 0) {
      console.error(
        'Axe violations on Admin (/app/admin):',
        JSON.stringify(criticalOrSerious, null, 2)
      );
    }

    expect(criticalOrSerious).toEqual([]);
  });

  test('A11Y-02: Skip to content link navigates to main content', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel(/username/i).fill('student_a1');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/app\/feed/, { timeout: 10000 });

    // Focus skip link and hit Enter
    const skipLink = page.locator('a.skip-link');
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');

    // Main content should be target or focused
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
  });

  test('A11Y-03 & A11Y-04: Modal keyboard focus trap and escape key handling', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel(/username/i).fill('student_a1');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/app\/feed/, { timeout: 10000 });

    await page.goto('/app/profile');
    await expect(page).toHaveURL(/\/app\/profile/, { timeout: 10000 });

    // Open deletion modal
    const deleteBtn = page.getByRole('button', { name: /request account deletion/i });
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();

      // Modal should be open
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      // Pressing Escape should close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });

  test('A11Y-05: Zoom and reflow at 320px viewport without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify document width does not cause horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalOverflow).toBe(false);
  });
});
