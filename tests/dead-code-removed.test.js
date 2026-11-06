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

// Khối #category-placeholder (khung giới thiệu cũ của thư viện cấu trúc) không route nào bỏ hidden, nên chỉ còn là mã chết.
const navigation = await readFile(new URL('../src/navigation.js', import.meta.url), 'utf8')

test('khối #category-placeholder đã gỡ khỏi template, navigation.js và style.css', () => {
  for (const id of ['category-placeholder', 'placeholder-title', 'placeholder-description', 'placeholder-card-title', 'placeholder-card-description']) {
    assert.ok(!template.includes(`id="${id}"`), `app.html còn phần tử #${id}`)
    assert.ok(!navigation.includes(id), `navigation.js còn nhắc ${id}`)
  }

  assert.ok(!classRule('category-preview').test(css), 'style.css còn luật .category-preview')
  assert.ok(!template.includes('category-preview'), 'app.html còn class category-preview')
})

test('trường description của bảng pages (chỉ dùng để điền khối placeholder) đã gỡ; title vẫn còn cho breadcrumb', () => {
  assert.ok(!/description:/.test(navigation), 'navigation.js còn trường description')
  assert.match(navigation, /title: 'Tổng quan'/)
  assert.match(navigation, /title: 'Cấu trúc dữ liệu'/)
})

// Cùng một selector được khai báo hai lần ở cấp trên cùng: khối sau (cùng độ đặc hiệu) ghi đè khối trước, nên khai báo của
// khối trước cho thuộc tính mà khối sau cũng khai báo là mã chết. Các selector dưới đây từng bị như vậy; không được tái phạm.
function topLevelRules(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = []
  let depth = 0
  let start = 0

  for (let index = 0; index < clean.length; index++) {
    if (clean[index] === '{') depth++
    if (clean[index] === '}') {
      depth--
      if (depth === 0) {
        const rule = clean.slice(start, index + 1)
        const selector = rule.slice(0, rule.indexOf('{')).trim().replace(/\s+/g, ' ')
        const body = rule.slice(rule.indexOf('{') + 1, -1)
        if (!selector.startsWith('@')) rules.push({ selector, properties: body.split(';').map((item) => item.split(':')[0].trim()).filter(Boolean) })
        start = index + 1
      }
    }
  }

  return rules
}

const DUPLICATED_SELECTORS = ['.control-button', '.array-cell', '.array-cell:hover', '.array-cell-index', '.array-operation-card input:focus']

for (const selector of DUPLICATED_SELECTORS) {
  test(`${selector}: không thuộc tính nào bị khai báo hai lần giữa các khối cùng selector`, () => {
    const seen = new Map()
    const repeated = []

    for (const rule of topLevelRules(css).filter((item) => item.selector === selector)) {
      for (const property of rule.properties) {
        if (seen.has(property)) repeated.push(property)
        seen.set(property, true)
      }
    }

    assert.ok(seen.size > 0, `phải tìm thấy luật ${selector}`)
    assert.deepEqual(repeated, [], `${selector} khai báo lại thuộc tính của khối trước`)
  })
}

// Bốn alias chỉ dùng một chỗ, từng kèm giá trị dự phòng lỗi thời. Alias luôn được khai báo trong :root nên giá trị dự phòng
// không bao giờ được dùng tới (chỉ lệch khi alias bị xóa, và khi đó test tokens đỏ).
const FALLBACK_ALIASES = ['--accent-color', '--surface-secondary', '--surface-color', '--panel-bg']

for (const alias of FALLBACK_ALIASES) {
  test(`${alias}: được khai báo trong :root và nơi dùng không còn giá trị dự phòng`, () => {
    assert.match(css, new RegExp(`${alias}:\\s*var\\(`), `:root phải khai báo ${alias}`)
    assert.ok(!css.includes(`var(${alias},`), `còn var(${alias}, <giá trị dự phòng>)`)
    assert.ok(css.includes(`var(${alias})`), `phải còn đúng một nơi dùng var(${alias})`)
  })
}
