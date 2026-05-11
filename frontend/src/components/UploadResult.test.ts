import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UploadResult from './UploadResult.vue'
import type { UploadResponse } from '../api'

const RESPONSE: UploadResponse = {
  token: 'abc123',
  downloadPageUrl: '/file/abc123',
  directDownloadUrl: '/d/abc123',
  originalName: 'example.zip',
  sizeBytes: 1024,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  maxDownloads: 200,
}

describe('UploadResult', () => {
  it('renders the absolute URL using window.location.origin', () => {
    const wrapper = mount(UploadResult, { props: { response: RESPONSE } })
    const expectedUrl = `${window.location.origin}/file/abc123`
    expect(wrapper.text()).toContain(expectedUrl)
  })

  it('renders Copy Link, Open link, and Upload another actions', () => {
    const wrapper = mount(UploadResult, { props: { response: RESPONSE } })
    expect(wrapper.text()).toContain('Copy Link')
    expect(wrapper.text()).toContain('Open link in new tab')
    expect(wrapper.text()).toContain('Upload another')
  })

  it('emits "upload-another" when the Upload another button is clicked', async () => {
    const wrapper = mount(UploadResult, { props: { response: RESPONSE } })
    const buttons = wrapper.findAll('button')
    const uploadAnother = buttons.find((b) => b.text() === 'Upload another')
    expect(uploadAnother).toBeDefined()
    await uploadAnother!.trigger('click')
    expect(wrapper.emitted('upload-another')).toHaveLength(1)
  })
})
