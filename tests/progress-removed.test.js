import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { basename } from 'node:path'

// Canh gác: Tiến độ học tập và nhãn Đã mở / Chưa mở đã gỡ theo Spec v1.0 (mục 16 và 17) không được quay lại.
// CHỈ cấm các định danh cũ cụ thể, KHÔNG cấm tiền tố "progress-" chung: thanh bước của Visualizer (Spec mục 10) có thể dùng tên tương tự
// cho tiến trình của thuật toán đang mô phỏng, đó không phải tiến độ học.
// Nếu thật sự cần dùng lại một định danh dưới đây cho việc khác thì đổi tên định danh, không nới lỏng test.

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8')
const srcDir = new URL('../src/', import.meta.url)
const srcFiles = (await readdir(srcDir, { recursive: true })).filter((name) => name.endsWith('.js'))
const sources = await Promise.all(srcFiles.map(async (name) => ({ name, text: await readFile(new URL(name, srcDir), 'utf8') })))

const FORBIDDEN_IDENTIFIERS = [
  'progress-section', 'data-page="progress"', 'icon-progress', 'dashboard-progress',
  'card-state', 'is-opened', 'library-status', 'algovision:progress',
]
const REMOVED_MODULES = ['progress-store', 'progress-init', 'progress-summary', 'progress-view', 'dashboard-progress', 'library-status']
const REMOVED_FILES = ['dashboard-progress.js', 'library-status.js']

test('canh gác quét được dữ liệu thật (không rỗng nên không thể xanh một cách vô nghĩa)', () => {
  assert.ok(template.includes('id="dashboard-section"'), 'phải đọc được template thật')
  assert.ok(css.includes('.dashboard-section'), 'phải đọc được style.css thật')
  assert.ok(sources.some(({ name }) => name === 'navigation.js') && sources.some(({ name }) => name === 'main.js'), 'phải quét được src/navigation.js và src/main.js')
})

for (const identifier of FORBIDDEN_IDENTIFIERS) {
  test(`định danh cũ "${identifier}" không còn trong template, style.css và src/**/*.js`, () => {
    assert.ok(!template.includes(identifier), `app.html còn "${identifier}"`)
    assert.ok(!css.includes(identifier), `style.css còn "${identifier}"`)

    const offenders = sources.filter(({ text }) => text.includes(identifier)).map(({ name }) => name)

    assert.deepEqual(offenders, [], `src còn nhắc "${identifier}"`)
  })
}

for (const moduleName of REMOVED_MODULES) {
  test(`không file nào trong src import ./${moduleName}`, () => {
    // from './x.js' | import './x.js' (không có from) | import('./x.js')
    const pattern = new RegExp(`(from\\s+|import\\s*\\(?\\s*)['"]\\./${moduleName}(\\.js)?['"]`)
    const offenders = sources.filter(({ text }) => pattern.test(text)).map(({ name }) => name)

    assert.deepEqual(offenders, [], `src còn import ./${moduleName}`)
  })
}

test('không còn file src/progress-*.js, src/dashboard-progress.js, src/library-status.js', () => {
  const names = srcFiles.map((name) => basename(name))

  assert.deepEqual(names.filter((name) => /^progress-.*\.js$/.test(name)), [], 'còn file src/progress-*.js')

  for (const file of REMOVED_FILES) assert.ok(!names.includes(file), `còn file src/${file}`)
})
