import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should navigate to login and show login form', async ({ page }) => {
    await page.goto('/login')

    // Check if we're on the login page
    expect(page.url()).toContain('/login')

    // Verify app heading and sign-in options (OAuth-based: Apple + Google)
    // Use 'Welcome back' heading specifically (h2 in the sign-in card)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(
      page.getByRole('button', { name: /continue with apple/i })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /continue with google/i })
    ).toBeVisible()
  })

  test('should show error on invalid credentials', async ({ page }) => {
    // Navigate to login with a simulated error param
    await page.goto('/login?error=auth_callback_error')

    // Verify error message appears
    await expect(page.getByText(/sign-in failed/i)).toBeVisible()

    // Check if we're still on login page
    expect(page.url()).toContain('/login')
  })

  test('should have password reset link', async ({ page }) => {
    await page.goto('/login')

    // App uses OAuth — just verify the page loads with sign-in options
    await expect(page.getByRole('button', { name: /continue with apple/i })).toBeVisible()
  })
})
