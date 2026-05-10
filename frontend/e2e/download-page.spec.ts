import { expect, test } from '@playwright/test'

test.describe('download page', () => {
  test('active token shows filename, size, expiration, and a Download link', async ({ page }) => {
    await page.goto('/file/abc123')
    await expect(page.getByRole('heading', { name: 'Your file is ready' })).toBeVisible()
    await expect(page.getByText('example.zip')).toBeVisible()
    await expect(page.getByText(/Expires in /)).toBeVisible()
    const downloadLink = page.getByRole('link', { name: 'Download' })
    await expect(downloadLink).toBeVisible()
    await expect(downloadLink).toHaveAttribute('href', '/d/abc123')
  })

  test('expired sentinel token shows the expired state', async ({ page }) => {
    await page.goto('/file/expired-test')
    await expect(page.getByRole('heading', { name: 'File expired' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Upload another file' })).toBeVisible()
  })

  test('error sentinel token shows the generic error state', async ({ page }) => {
    await page.goto('/file/error-test')
    await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Upload another file' })).toBeVisible()
  })
})
