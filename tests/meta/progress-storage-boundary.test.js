import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'

// Canh gác: localStorage chỉ được chạm ở src/progress-store.js, và mã tiến độ chỉ nói "đã mở" (opened).

const srcDir = new URL('../../src/', import.meta.url)
const files = (await readdir(srcDir, { recursive: true })).filter((name) => name.endsWith('.js'))

test('chỉ src/progress-store.js được nhắc localStorage/sessionStorage trong src/', async () => {
  const offenders = []

  for (const name of files) {
    const text = await readFile(new URL(name, srcDir), 'utf8')
    if (/localStorage|sessionStorage/.test(text) && name.replaceAll('\\', '/') !== 'progress-store.js') offenders.push(name)
  }

  assert.deepEqual(offenders, [], 'chỉ progress-store.js (initProgress) được truy cập kho trình duyệt')
  assert.ok(files.includes('progress-store.js'))
})

test('src/progress-store.js không dùng chữ completed/hoàn thành (đã mở không phải đã hoàn thành)', async () => {
  const text = await readFile(new URL('progress-store.js', srcDir), 'utf8')
  assert.ok(!/completed|hoàn thành/i.test(text), 'dùng "opened/đã mở" cho tên trường, comment và thông điệp')
})

test('src/main.js gọi initProgress(document) sau initNavigation(document) (withFullApp không chạy main.js thật)', async () => {
  const main = await readFile(new URL('main.js', srcDir), 'utf8')
  const navigationAt = main.indexOf('initNavigation(document)\n')
  const progressAt = main.indexOf('initProgress(document)\n')

  assert.ok(navigationAt !== -1, 'main.js phải gọi initNavigation(document)')
  assert.ok(progressAt > navigationAt, 'main.js phải gọi initProgress(document) sau initNavigation(document)')
  assert.match(main, /import \{ initProgress \} from '\.\/progress-store\.js'/)
})
