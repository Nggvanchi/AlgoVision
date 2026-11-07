import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'

// Canh gác: hiện không file nào trong src được dùng localStorage hay sessionStorage (không lưu gì trong trình duyệt;
// trạng thái sidebar chỉ nằm trong bộ nhớ của phiên). Nếu Redesign được duyệt nhớ trạng thái thu gọn của sidebar
// (Spec v1.0 mục 7) thì cập nhật test này trong CÙNG PR đó: cho phép đúng một file và nói rõ lý do, không nới lỏng cho cả src.

const srcDir = new URL('../../src/', import.meta.url)
const files = (await readdir(srcDir, { recursive: true })).filter((name) => name.endsWith('.js'))

test('không file nào trong src nhắc localStorage hay sessionStorage', async () => {
  assert.ok(files.length > 0, 'phải quét được các file trong src')

  const offenders = []

  for (const name of files) {
    const text = await readFile(new URL(name, srcDir), 'utf8')
    if (/localStorage|sessionStorage/.test(text)) offenders.push(name)
  }

  assert.deepEqual(offenders, [], 'src không được dùng kho của trình duyệt')
})
