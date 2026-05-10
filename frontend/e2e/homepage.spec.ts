import { expect, test } from '@playwright/test'

test.describe('homepage', () => {
  test('renders the title and drop zone', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Temporary File Drop' })).toBeVisible()
    await expect(page.getByText('Drop file here or click to choose')).toBeVisible()
  })

  test('renders every spec stat label after stats load', async ({ page }) => {
    await page.goto('/')
    // Wait for the loading state to disappear.
    await expect(page.getByText('Loading stats')).toBeHidden({ timeout: 5_000 })

    const expectedLabels = [
      'Total uploads',
      'Total downloads',
      'Active files',
      'Storage used',
      'Uploads today',
      'Downloads today',
      'Monthly transfer',
    ]
    for (const label of expectedLabels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }
  })
})
