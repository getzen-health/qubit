/**
 * Visual regression tests using Playwright snapshots.
 * First run creates baseline screenshots in e2e/snapshots/.
 * Subsequent runs compare against baseline (threshold: 0.2).
 *
 * Update baselines: npx playwright test --update-snapshots
 */
import { test, expect } from '@playwright/test'

test.describe('Visual Regression', () => {
  test('login page snapshot', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('login.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    })
  })

  test('dashboard snapshot (unauthenticated fallback)', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    // Will render login redirect or skeleton — capture either
    await expect(page).toHaveScreenshot('dashboard-unauth.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    })
  })

  test('scan page snapshot', async ({ page }) => {
    await page.goto('/scan')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('scan.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    })
  })

  test('mobile dashboard snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    })
  })
})
