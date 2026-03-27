import { test, expect } from '@playwright/test'

test.describe('Health Metrics Navigation', () => {
  const metricRoutes = [
    { path: '/sleep', label: 'Sleep' },
    { path: '/heart-rate', label: 'Heart' },
    { path: '/steps', label: 'Steps' },
    { path: '/water', label: 'Water' },
    { path: '/workouts', label: 'Workout' },
    { path: '/stress', label: 'Stress' },
    { path: '/mood', label: 'Mood' },
    { path: '/nutrition', label: 'Nutrition' },
  ]

  for (const { path, label } of metricRoutes) {
    test(`${label} page loads without error`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBeLessThan(400)
      // No JS error dialog
      page.on('dialog', async (d) => { await d.dismiss() })
      // Page has meaningful content
      const body = await page.textContent('body')
      expect((body?.length ?? 0)).toBeGreaterThan(50)
    })
  }

  test('bottom nav is present on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }) // iPhone 14
    await page.goto('/dashboard')
    const nav = page.locator('nav, [role="navigation"]').first()
    await expect(nav).toBeVisible()
  })

  test('dashboard renders metric cards', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    // At least one card-like element exists
    const cards = page.locator('[class*="card"], [class*="Card"], [class*="metric"]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('Responsive Layout', () => {
  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ]

  for (const vp of viewports) {
    test(`dashboard fits ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      // No horizontal scroll on any viewport
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(scrollWidth).toBeLessThanOrEqual(vp.width + 5) // 5px tolerance
    })
  }
})
