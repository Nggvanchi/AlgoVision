import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'

// Canh gác: mã chết đã gỡ ở PR chore/bundle-headroom không được quay lại.
// Mỗi mục có hai vế: (1) luật CSS không còn trong style.css; (2) class không được dùng ở template hoặc src/*.js
// (nếu có người dùng lại class thì phải viết lại luật CSS của chính nó, không khôi phục luật cũ).

const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8')
const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')
const srcDir = new URL('../src/', import.meta.url)
const source = (await Promise.all(
  (await readdir(srcDir, { recursive: true })).filter((name) => name.endsWith('.js')).map((name) => readFile(new URL(name, srcDir), 'utf8')),
)).join('\n')

const classRule = (name) => new RegExp(`\\.${name}(?![\\w-])`)

// Các class của tab/danh mục học tập kiểu cũ, chấm giữ chỗ của thẻ cấu trúc và thẻ cấu trúc bị khóa: không phần tử nào mang chúng.
const DEAD_CLASSES = ['learning-tabs', 'learning-tab', 'learning-category', 'placeholder-icon', 'structure-card-disabled']

for (const name of DEAD_CLASSES) {
  test(`class .${name}: không còn luật CSS và không phần tử nào dùng`, () => {
    assert.ok(!classRule(name).test(css), `style.css còn luật cho .${name}`)
    assert.ok(!new RegExp(`class="[^"]*\\b${name}\\b`).test(template), `app.html còn phần tử mang class ${name}`)
    assert.ok(!source.includes(name), `src/*.js còn nhắc ${name}`)
  })
}

test('.learning-heading p vẫn còn luật riêng (chỉ bỏ vế .learning-category p trong luật chung)', () => {
  assert.match(css, /\.learning-heading p\s*\{/)
})
