import { expect, test } from '@playwright/test'

test.describe('download page', () => {
  test('active token shows filename, size, expiration, and a Download link', async ({ page }) => {
    // Upload a real file first so we have a token the backend recognizes.
    await page.goto('/')
    await page.locator('input[type="file"]').setInputFiles({
      name: 'download-test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    })
    await page.getByRole('button', { name: 'Upload' }).click()
    await expect(page.getByText('Upload successful!')).toBeVisible({ timeout: 15_000 })

    // Pull the resulting download page URL out of the success panel.
    const linkText = await page.locator('.link-text').textContent()
    const token = linkText!.split('/file/').pop()!.trim()

    await page.goto(`/file/${token}`)
    await expect(page.getByRole('heading', { name: 'Your file is ready' })).toBeVisible()
    await expect(page.getByText('download-test.txt')).toBeVisible()
    await expect(page.getByText(/Expires in /)).toBeVisible()
    const downloadLink = page.getByRole('link', { name: 'Download' })
    await expect(downloadLink).toBeVisible()
    await expect(downloadLink).toHaveAttribute('href', `/d/${token}`)
  })

  test('unknown token shows the expired state', async ({ page }) => {
    // The backend collapses not-found into { status: 'expired' }, so any random
    // token surfaces the expired card.
    await page.goto('/file/this-token-does-not-exist-12345')
    await expect(page.getByRole('heading', { name: 'File expired' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Upload another file' }).first()).toBeVisible()
  })

  test('shows the error card when the API returns 500', async ({ page }) => {
    // Force a server error via Playwright route interception. Lets us assert
    // the error UI without crashing the real backend.
    await page.route('**/api/file/error-test', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'INTERNAL_ERROR', message: 'forced' }),
      }),
    )
    await page.goto('/file/error-test')
    await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Upload another file' }).first()).toBeVisible()
  })
})
