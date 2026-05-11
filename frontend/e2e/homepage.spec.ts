import { expect, test } from '@playwright/test'

test.describe('homepage', () => {
  test('renders the hero, header, and drop zone', async ({ page }) => {
    await page.goto('/')
    // App header logo
    await expect(page.getByRole('link', { name: /FileDrop/ })).toBeVisible()
    // Hero headline (split across lines)
    await expect(page.getByRole('heading', { name: /Upload a file/ })).toBeVisible()
    await expect(page.getByText('temporary link.')).toBeVisible()
    // Drop zone copy
    await expect(page.getByText('Drag & drop your file here')).toBeVisible()
    await expect(page.getByText('click to browse')).toBeVisible()
  })

  test('renders every spec stat label after stats load', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Loading stats')).toBeHidden({ timeout: 5_000 })

    const expectedLabels = [
      'Total uploads',
      'Total downloads',
      'Active files',
      'Storage used',
      'Monthly transfer',
    ]
    for (const label of expectedLabels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }
    // "today" subtexts on the totals cards
    await expect(page.getByText(/\d+ today/).first()).toBeVisible()
  })
})
