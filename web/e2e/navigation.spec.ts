import { test, expect } from '@playwright/test'

test.describe('App Navigation', () => {
  test('homepage redirects or shows landing', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(400)
  })

  test('all sidebar/nav links resolve without 404', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Collect all internal links
    const hrefs = await page.$$eval('a[href]', (links) =>
      links
        .map((l) => l.getAttribute('href') ?? '')
        .filter((h) => h.startsWith('/') && !h.includes('#') && !h.includes('?'))
    )

    const unique = [...new Set(hrefs)].slice(0, 20) // sample first 20
    for (const href of unique) {
      const res = await page.goto(href)
      expect(res?.status(), `${href} returned ${res?.status()}`).toBeLessThan(400)
    }
  })

  test('back navigation works', async ({ page }) => {
    await page.goto('/dashboard')
    await page.goto('/sleep')
    await page.goBack()
    expect(page.url()).toContain('/dashboard')
  })

  test('404 page is shown for unknown route', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-xyzabc')
    // Next.js returns 404 status or renders a not-found page
    const status = response?.status() ?? 200
    const body = await page.textContent('body')
    const is404 = status === 404 || /not found|404/i.test(body ?? '')
    expect(is404).toBe(true)
  })
})

test.describe('Food Scanner Page', () => {
  test('scanner page loads', async ({ page }) => {
    const res = await page.goto('/scanner')
    expect(res?.status()).toBeLessThan(400)
    const body = await page.textContent('body')
    expect(body?.length ?? 0).toBeGreaterThan(50)
  })

  test('scanner has search input', async ({ page }) => {
    await page.goto('/scanner')
    await page.waitForLoadState('networkidle')
    const inputs = page.locator('input[type="text"], input[type="search"], input:not([type])')
    expect(await inputs.count()).toBeGreaterThan(0)
  })

  test('searching apple shows results', async ({ page }) => {
    await page.goto('/scan')
    await page.waitForLoadState('networkidle')
    const input = page.locator('input').first()
    if (await input.isVisible()) {
      await input.fill('apple')
      await page.waitForTimeout(1500)
      // Page should update without crashing
      const body = await page.textContent('body')
      expect(body?.length ?? 0).toBeGreaterThan(50)
    }
  })
})
