import { expect, test } from '@playwright/test'

test.describe('upload flow', () => {
  test('shows progress and result URL after a successful upload', async ({ page }) => {
    await page.goto('/')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'sample.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello world'),
    })

    // Selection state: filename appears in the file row.
    await expect(page.getByText('sample.txt')).toBeVisible()

    await page.getByRole('button', { name: 'Upload' }).click()

    // Progress state appears.
    await expect(page.getByText(/Upload progress: \d+%/)).toBeVisible({ timeout: 5_000 })

    // Success state: result panel is visible.
    await expect(page.getByText('Upload successful!')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /Copy Link|Copied/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Open link in new tab/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload another' })).toBeVisible()
  })
})
