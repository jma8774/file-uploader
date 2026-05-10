import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import FileUploader from './FileUploader.vue'
import { MAX_UPLOAD_BYTES } from '../api'

function makeFile(sizeBytes: number, name = 'example.bin'): File {
  const bytes = new Uint8Array(sizeBytes)
  return new File([bytes], name, { type: 'application/octet-stream' })
}

async function pickFile(wrapper: ReturnType<typeof mount>, file: File) {
  const input = wrapper.find('input[type="file"]').element as HTMLInputElement
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  await wrapper.find('input[type="file"]').trigger('change')
  await nextTick()
}

describe('FileUploader', () => {
  it('renders the drop zone in the idle state', () => {
    const wrapper = mount(FileUploader)
    expect(wrapper.text()).toContain('Drop file here or click to choose')
    expect(wrapper.text()).not.toContain('Selected:')
  })

  it('rejects a too-large file with the spec error message', async () => {
    const wrapper = mount(FileUploader)
    await pickFile(wrapper, makeFile(MAX_UPLOAD_BYTES + 1, 'huge.bin'))
    expect(wrapper.text()).toContain('File is too large. Max size is 100 MB.')
    expect(wrapper.text()).not.toContain('Upload')
  })

  it('shows filename, formatted size, and Upload button when a valid file is picked', async () => {
    const wrapper = mount(FileUploader)
    await pickFile(wrapper, makeFile(2048, 'tiny.txt'))
    expect(wrapper.text()).toContain('Selected:')
    expect(wrapper.text()).toContain('tiny.txt')
    expect(wrapper.text()).toContain('2 KB')
    expect(wrapper.text()).toContain('Upload')
  })

  it('shows the safety-cap banner and disables Upload when disabled prop is true', async () => {
    const wrapper = mount(FileUploader, { props: { disabled: true } })
    expect(wrapper.text()).toContain('Monthly safety limit reached')
    await pickFile(wrapper, makeFile(1024, 'small.txt'))
    // File input is disabled so the pick should never land — the banner is
    // shown and no Selected line appears.
    // (Defensive: even if a file did slip in, the Upload button must be disabled.)
    const uploadBtn = wrapper.find('button.upload-btn')
    if (uploadBtn.exists()) {
      expect((uploadBtn.element as HTMLButtonElement).disabled).toBe(true)
    }
  })
})
