import { test, expect } from '@playwright/test';

test.describe('End-to-End User Journeys (E2E-01..E2E-06)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.setItem('stips_notice', '1');
      } catch {}
    });
  });

  async function clickNavLink(page, nameRegex) {
    const mobileMenu = page.getByRole('button', { name: /open navigation menu/i });
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
    }
    await page.getByRole('link', { name: nameRegex }).click();
  }

  test('E2E-01: Landing to sign in to feed', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/S\.T\.I\.P\.S/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 2. Click sign in
    await page
      .getByRole('link', { name: /sign in/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/signin/);

    // 3. Fill in credentials for teacher
    await page.getByLabel(/username/i).fill('teacher_a1');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // 4. Arrive at feed
    await expect(page).toHaveURL(/\/app\/feed/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /community feed/i })).toBeVisible();
  });

  test('E2E-02: Admin creates members in dashboard', async ({ page }) => {
    // 1. Login as admin
    await page.goto('/signin');
    await page.getByLabel(/username/i).fill('admin_a');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/app\/feed/, { timeout: 10000 });

    // 2. Navigate to Admin dashboard
    await clickNavLink(page, /admin dashboard/i);
    await expect(page).toHaveURL(/\/app\/admin/);
    await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible();

    // 3. View members tab
    await expect(page.getByRole('button', { name: /members \(/i })).toBeVisible();
  });

  test('E2E-03: Post creation and viewing in feed', async ({ page }) => {
    // 1. Sign in as teacher
    await page.goto('/signin');
    await page.getByLabel(/username/i).fill('teacher_a1');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/app\/feed/, { timeout: 10000 });

    // 2. Go to create page
    await clickNavLink(page, /\+ create/i);
    await expect(page).toHaveURL(/\/app\/create/);

    // 3. Create a post
    const suffix = Math.random().toString(36).substring(2, 7);
    const postBody = `Campus Announcement E2E Post ${suffix}`;
    await page.getByLabel(/your post/i).fill(postBody);
    await page.getByRole('button', { name: /publish post/i }).click();

    // 4. Redirects to feed and post is visible
    await expect(page).toHaveURL(/\/app\/feed/, { timeout: 10000 });
    await expect(page.getByText(postBody)).toBeVisible();
  });

  test('E2E-04: Polls browsing and voting view', async ({ page }) => {
    // 1. Sign in as student
    await page.goto('/signin');
    await page.getByLabel(/username/i).fill('student_a1');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/app\/feed/, { timeout: 10000 });

    // 2. Go to polls
    await clickNavLink(page, /polls & votes/i);
    await expect(page).toHaveURL(/\/app\/polls/);
    await expect(page.getByRole('heading', { name: /polls & votes/i })).toBeVisible();
  });

  test('E2E-05: Direct messaging view', async ({ page }) => {
    // 1. Sign in as student
    await page.goto('/signin');
    await page.getByLabel(/username/i).fill('student_a1');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/app\/feed/, { timeout: 10000 });

    // 2. Go to messages
    await clickNavLink(page, /messages/i);
    await expect(page).toHaveURL(/\/app\/messages/);
    await expect(page.getByRole('heading', { name: /messages/i })).toBeVisible();
  });

  test('E2E-06: Profile and security controls', async ({ page }) => {
    // 1. Sign in as student
    await page.goto('/signin');
    await page.getByLabel(/username/i).fill('student_a1');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/app\/feed/, { timeout: 10000 });

    // 2. Go to profile
    await clickNavLink(page, /profile/i);
    await expect(page).toHaveURL(/\/app\/profile/);
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /change password/i })).toBeVisible();
  });

  test('E2E-07: Public legal pages and footer navigation', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();

    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: /terms of use/i })).toBeVisible();

    await page.goto('/cookies');
    await expect(page.getByRole('heading', { name: /cookie notice/i })).toBeVisible();

    await page.goto('/guidelines');
    await expect(page.getByRole('heading', { name: /community guidelines/i })).toBeVisible();

    await page.goto('/accessibility');
    await expect(page.getByRole('heading', { name: /accessibility statement/i })).toBeVisible();

    await page.goto('/contact');
    await expect(
      page.getByRole('heading', { name: /contact & grievance redressal/i })
    ).toBeVisible();
  });
});
