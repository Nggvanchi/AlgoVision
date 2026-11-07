import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'

// Canh gác: localStorage chỉ được chạm ở src/progress-init.js; lõi và kho (src/progress-store.js) không DOM, không window;
// mã tiến độ chỉ nói "đã mở" (opened).

const srcDir = new URL('../../src/', import.meta.url)
const files = (await readdir(srcDir, { recursive: true })).filter((name) => name.endsWith('.js'))

test('chỉ src/progress-init.js được nhắc localStorage/sessionStorage; progress-store.js không nhắc document/window', async () => {
  const offenders = []

  for (const name of files) {
    const text = await readFile(new URL(name, srcDir), 'utf8')
    if (/localStorage|sessionStorage/.test(text) && name.replaceAll('\\', '/') !== 'progress-init.js') offenders.push(name)
  }

  assert.deepEqual(offenders, [], 'chỉ progress-init.js (initProgress) được truy cập kho trình duyệt')
  assert.ok(files.includes('progress-init.js'))

  const store = await readFile(new URL('progress-store.js', srcDir), 'utf8')
  assert.ok(!/\b(document|window)\b/.test(store), 'progress-store.js là mã thuần: không được nhắc document hay window')
})

test('src/progress-store.js và src/progress-init.js không dùng chữ completed/hoàn thành (đã mở không phải đã hoàn thành)', async () => {
  for (const name of ['progress-store.js', 'progress-init.js']) {
    const text = await readFile(new URL(name, srcDir), 'utf8')
    assert.ok(!/completed|hoàn thành/i.test(text), `${name}: dùng "opened/đã mở" cho tên trường, comment và thông điệp`)
  }
})

test('src/progress-view.js (giao diện đọc tiến độ) không chạm kho trình duyệt, không storage event, không chữ cấm kể cả trong comment', async () => {
  const view = await readFile(new URL('progress-view.js', srcDir), 'utf8')

  assert.ok(files.includes('progress-view.js'))
  assert.ok(!/localStorage|sessionStorage|\bstorage\b/.test(view), 'dữ liệu chỉ đi qua đối tượng initProgress trả về')
  assert.ok(!/completed|hoàn thành|streak|chuỗi ngày|thời gian học|%/i.test(view), 'chỉ nói "đã mở"; không phần trăm, không streak')
})

test('src/main.js gọi initProgress(document) sau initNavigation(document) (withFullApp không chạy main.js thật)', async () => {
  const main = await readFile(new URL('main.js', srcDir), 'utf8')
  const navigationAt = main.indexOf('initNavigation(document)\n')
  const progressAt = main.indexOf('initProgress(document)\n')

  assert.ok(navigationAt !== -1, 'main.js phải gọi initNavigation(document)')
  assert.ok(progressAt > navigationAt, 'main.js phải gọi initProgress(document) sau initNavigation(document)')
  assert.match(main, /import \{ initProgress \} from '\.\/progress-init\.js'/)
})
