import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import {
  readStyle, parseStylesheet, rootTokens, rootRawBlock, declarationValues, countVarUses, stripComments, woff2Tags,
} from './helpers/css-tokens.js'
import { contrastRatio, blend, parseHex } from './helpers/contrast.js'

// Redesign Phase 1: token, font tự host, thành phần nền. Mọi giá trị đọc từ src/style.css, không gõ chết lần hai trong test
// (trừ bảng đặc tả token ở đây, là hợp đồng của phase). Phương án A: 18 token cũ giữ nguyên giá trị; token mới tồn tại song song.

const css = readStyle()
const { tokens, duplicates } = rootTokens(css)
const sheet = parseStylesheet(css)
const here = (path) => new URL(path, import.meta.url)
const normalize = (value) => value.replace(/\s+/g, ' ').trim().toLowerCase()

// Giải alias var(--x) về giá trị cuối
function resolve(name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Alias vòng tròn tại ${name}`)
  seen.add(name)
  const value = tokens.get(name)
  if (value === undefined) throw new Error(`Token ${name} không có trong :root`)
  const alias = /^var\((--[a-z0-9-]+)\)$/i.exec(value)
  return alias ? resolve(alias[1], seen) : value
}
// '--av-nav-active-bg' là rgba (nền mềm Spec): tính màu hiện ra khi trộn lên nền sidebar. Còn lại: #hex hoặc token giải ra #hex.
function colorOf(reference) {
  if (reference.startsWith('#')) return reference

  const value = resolve(reference)
  const translucent = /^rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/i.exec(value)
  if (!translucent) return value

  const hex = `#${translucent.slice(1, 4).map((channel) => Number(channel).toString(16).padStart(2, '0')).join('')}`
  return blend(hex, Number(translucent[4]), resolve('--av-sidebar'))
}

// ---------------------------------------------------------------------------------------------------------------------
// Helper tương phản (tests/helpers/contrast.js): helper mới phải có test, kể cả test âm
// ---------------------------------------------------------------------------------------------------------------------

test('contrastRatio: đen/trắng là 21, cùng màu là 1, đối xứng', () => {
  assert.equal(contrastRatio('#000000', '#ffffff').toFixed(2), '21.00')
  assert.equal(contrastRatio('#123456', '#123456').toFixed(2), '1.00')
  assert.equal(contrastRatio('#9b82ff', '#0b0b14'), contrastRatio('#0b0b14', '#9b82ff'))
})

test('contrastRatio: số dò tay độc lập (#777777 trên trắng = 4,48; #767676 = 4,54, ranh giới AA)', () => {
  // Giá trị tham chiếu nổi tiếng của WCAG: #767676 là xám nhạt nhất đạt 4,5:1 trên trắng; #777777 thì chưa.
  assert.equal(contrastRatio('#777777', '#ffffff').toFixed(2), '4.48')
  assert.equal(contrastRatio('#767676', '#ffffff').toFixed(2), '4.54')
})

test('contrastRatio nhận #rgb và không phân biệt hoa thường', () => {
  assert.equal(contrastRatio('#FFF', '#000'), contrastRatio('#ffffff', '#000000'))
})

test('parseHex từ chối màu sai: thiếu #, độ dài lạ, ký tự lạ, alpha 8 chữ số, không phải chuỗi', () => {
  for (const bad of ['ffffff', '#ffff', '#12345g', '#11223344', '', null, 12345]) {
    assert.throws(() => parseHex(bad), TypeError, `phải ném lỗi với ${String(bad)}`)
  }
})

test('blend: 0 giữ nền, 1 giữ màu trước, 0,5 là trung bình làm tròn', () => {
  assert.equal(blend('#ffffff', 0, '#000000'), '#000000')
  assert.equal(blend('#ffffff', 1, '#000000'), '#ffffff')
  assert.equal(blend('#ffffff', 0.5, '#000000'), '#808080')
})

test('blend từ chối alpha ngoài [0, 1]', () => {
  assert.throws(() => blend('#ffffff', 1.5, '#000000'), RangeError)
  assert.throws(() => blend('#ffffff', -0.1, '#000000'), RangeError)
  assert.throws(() => blend('#ffffff', Number.NaN, '#000000'), RangeError)
})

test('woff2Tags từ chối file không phải woff2', () => {
  assert.throws(() => woff2Tags(Buffer.from('không phải font, chỉ là chữ thường mà thôi')), TypeError)
})

test('parser CSS của test: nhận ra :root, @font-face, @import và luật lồng trong @media', () => {
  const sample = `@import url('x.css');
    :root { --a: 1; --a: 2; }
    @font-face { font-family: 'F'; src: url('/f.woff2') format('woff2'); }
    @media (max-width: 1px) { .x, .y { color: red; } }`
  const parsed = parseStylesheet(sample)
  assert.equal(parsed.imports.length, 1)
  assert.equal(parsed.fontFaces.length, 1)
  assert.deepEqual(parsed.rules.at(-1).selectors, ['.x', '.y'])
  assert.equal(parsed.rules.at(-1).media, '@media (max-width: 1px)')
  assert.deepEqual(rootTokens(sample).duplicates, ['--a'])
})

test('countVarUses đếm var(--ten) và không đếm tên khác có chung tiền tố', () => {
  assert.equal(countVarUses('a{color:var(--x)} b{color:var(--x, red)} c{color:var(--x-long)}', '--x'), 2)
})

// ---------------------------------------------------------------------------------------------------------------------
// Hợp đồng token
// ---------------------------------------------------------------------------------------------------------------------

// Redesign R2: token Phase 1/2 thành alias trỏ vào --av-* (nguồn giá trị là khối --av-*, tests/av-tokens.test.js). Test đọc giá trị
// từ CSS: alias phải đúng là var(--av-x) và giải ra đúng giá trị của --av-x.
// R4 gỡ hai alias nút chính (--purple-strong, --purple-pressed): nút chính dùng thẳng --av-primary / --av-primary-hover (test bên dưới).
for (const [name, target] of [['--purple-strong', '--av-primary'], ['--purple-pressed', '--av-primary-hover']]) {
  test(`alias ${name} đã gỡ ở R4: không còn trong :root, không luật nào tham chiếu; ${target} vẫn có`, () => {
    assert.ok(!tokens.has(name), `${name} phải bị gỡ khỏi :root`)
    assert.equal(countVarUses(css, name), 0)
    assert.ok(tokens.has(target))
  })
}

test('token mới --border-control = #6B6B87 (quyết định 9 và 12: viền điều khiển giữ nguyên, không dùng --av-border-strong)', () => {
  assert.ok(tokens.has('--border-control'), ':root phải khai báo --border-control')
  assert.equal(normalize(tokens.get('--border-control')), '#6b6b87')
})

test('token --av-nav-active-bg là nền mềm Spec: rgba của --av-primary-line với alpha 0,18 (thay --purple-active ở R3)', () => {
  const [red, green, blue] = [1, 3, 5].map((at) => Number.parseInt(tokens.get('--av-primary-line').slice(at, at + 2), 16))
  assert.equal(tokens.get('--av-nav-active-bg'), `rgba(${red}, ${green}, ${blue}, 0.18)`)
})

// Token đã gỡ ở R2 (từng là NEW_COLORS/token chưa dùng): không còn trong :root và không luật nào nhắc.
for (const removed of ['--bg', '--surface', '--purple-soft', '--purple-tint', '--blue', '--success', '--violet', '--bg-sidebar', '--surface-raised', '--text-label', '--purple-hover', '--purple-active']) {
  test(`token ${removed} đã gỡ (R2 hoặc R3): không còn trong :root, không luật nào tham chiếu`, () => {
    assert.ok(!tokens.has(removed), `${removed} phải bị gỡ khỏi :root`)
    assert.equal(countVarUses(css, removed), 0)
  })
}

test('token font: --font-ui bắt đầu bằng Be Vietnam Pro, --font-mono bằng JetBrains Mono, đều có font dự phòng chung', () => {
  const ui = tokens.get('--font-ui') ?? ''
  const mono = tokens.get('--font-mono') ?? ''

  assert.ok(ui.startsWith("'Be Vietnam Pro',"), `--font-ui = ${ui}`)
  assert.ok(ui.includes('system-ui') && ui.endsWith('sans-serif'), `--font-ui = ${ui}`)
  assert.ok(mono.startsWith("'JetBrains Mono',"), `--font-mono = ${mono}`)
  assert.ok(mono.includes('ui-monospace') && mono.endsWith('monospace'), `--font-mono = ${mono}`)
})

// R2 gỡ các token cỡ chữ/spacing/bo góc/bóng chưa dùng; còn lại đúng những token sidebar đang dùng (token cỡ chữ cơ bản khai báo lại ở R2 commit 4).
test('token cỡ chữ đang dùng: 12/13/14; các cỡ chưa dùng (--fs-base/lg/xl/display) đã gỡ', () => {
  const entries = ['--fs-xs', '--fs-sm', '--fs-md'].map((name) => [name, tokens.get(name)])
  assert.deepEqual(entries, [['--fs-xs', '12px'], ['--fs-sm', '13px'], ['--fs-md', '14px']])
  assert.deepEqual(['--fs-base', '--fs-lg', '--fs-xl', '--fs-display'].filter((name) => tokens.has(name)), [])
})

test('token spacing đang dùng: 4, 8, 12, 16, 24 (bội số của 4, tên = px / 4); 5/8/10/12 chưa dùng đã gỡ', () => {
  const names = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-6']
  const values = names.map((name) => tokens.get(name))
  assert.deepEqual(values, ['4px', '8px', '12px', '16px', '24px'])
  names.forEach((name, index) => assert.equal(Number.parseInt(values[index]) / 4, Number(name.split('-').at(-1)), `${name} phải bằng px / 4`))
  assert.deepEqual(['--space-5', '--space-8', '--space-10', '--space-12'].filter((name) => tokens.has(name)), [])
})

test('token bo góc đang dùng: --radius-sm 8px; --radius-md/lg/pill chưa dùng đã gỡ', () => {
  assert.equal(tokens.get('--radius-sm'), '8px')
  assert.deepEqual(['--radius-md', '--radius-lg', '--radius-pill'].filter((name) => tokens.has(name)), [])
})

test('token bóng: --shadow-card còn; --glow-purple chưa dùng đã gỡ', () => {
  assert.equal(tokens.get('--shadow-card'), '0 8px 24px rgba(0, 0, 0, 0.35)')
  assert.ok(!tokens.has('--glow-purple'))
})

// ---------------------------------------------------------------------------------------------------------------------
// 18 token cũ giữ nguyên (Phương án A) và phân loại trong :root
// ---------------------------------------------------------------------------------------------------------------------

// Redesign R2: 7 token cũ thành alias trỏ vào --av-* (đổi diện mạo theo Spec); 2 token giữ giá trị riêng vì Spec không quy định
// (--state-active, --bar-cue). R6b gỡ --purple (canvas chuyển sang --av-primary-text).
const OLD_TO_AV = {
  '--background': '--av-bg', '--panel': '--av-surface-1', '--panel-hover': '--av-surface-2', '--border': '--av-border',
  '--text': '--av-text', '--muted': '--av-text-muted', '--purple-dark': '--av-primary',
}
const OLD_VALUES = { '--state-active': '#f6c76a', '--bar-cue': '#0d0f15' }
const OLD_ALIASES = {
  '--text-muted': 'var(--muted)', '--border-color': 'var(--border)', '--card-background': 'var(--panel)',
  '--text-secondary': 'var(--muted)', '--surface-secondary': 'var(--panel)',
  '--surface-color': 'var(--panel-hover)', '--panel-bg': 'var(--panel)',
}

test('7 token cũ là alias var(--av-*) và giải ra đúng giá trị Spec đọc từ :root', () => {
  for (const [name, target] of Object.entries(OLD_TO_AV)) {
    assert.equal(tokens.get(name), `var(${target})`, `${name} phải là alias của ${target}`)
    assert.equal(normalize(resolve(name)), normalize(tokens.get(target)), `${name} phải giải ra giá trị của ${target}`)
  }
})

test('2 token cũ không có tương ứng trong Spec giữ nguyên giá trị (màu "đang xét", cue ngoài màu)', () => {
  const actual = Object.fromEntries(Object.keys(OLD_VALUES).map((name) => [name, normalize(tokens.get(name) ?? '(thiếu)')]))
  assert.deepEqual(actual, OLD_VALUES)
})

// Alias tạm: mỗi alias có chú thích "tạm, gỡ ở R<n>" ngay trên dòng khai báo; số alias chỉ được GIẢM khi một PR gỡ chúng.
const ALL_TEMPORARY = [
  '--background', '--panel', '--panel-hover', '--border', '--text', '--muted', '--text-muted', '--purple-dark',
  '--border-color', '--card-background', '--text-secondary', '--surface-secondary', '--surface-color', '--panel-bg',
]

test('mỗi alias tạm có chú thích "tạm, gỡ ở R3..R6" và danh sách alias khớp đúng (gỡ alias nào thì sửa danh sách cùng PR)', () => {
  const raw = rootRawBlock(css)
  const tagged = [...raw.matchAll(/(--[a-z0-9-]+)\s*:[^;]*;\s*\/\*\s*tạm, gỡ ở R([0-9])/g)].map((match) => [match[1], Number(match[2])])

  assert.deepEqual(tagged.map(([name]) => name).sort(), [...ALL_TEMPORARY].sort(), 'danh sách token có chú thích "tạm, gỡ ở R?" phải khớp danh sách alias')
  assert.ok(tagged.every(([, release]) => release >= 4 && release <= 7), 'alias còn lại chỉ được hẹn gỡ ở R4..R7 (R3 đã gỡ nhóm sidebar)')
  assert.equal(tagged.length, 14, '14 alias tạm sau R6b (R4 gỡ --purple-strong, --purple-pressed; R6a gỡ --accent-color vì thanh trượt cũ đã bỏ; R6b gỡ --purple vì canvas chuyển sang --av-primary-text)')
  assert.ok(!tagged.some(([name]) => name === '--purple'), '--purple đã gỡ ở R6b')
})

test('7 alias cũ còn đủ và trỏ đúng token gốc cũ; mọi alias trỏ tới token có thật', () => {
  const actual = Object.fromEntries(Object.keys(OLD_ALIASES).map((name) => [name, tokens.get(name) ?? '(thiếu)']))
  assert.deepEqual(actual, OLD_ALIASES)

  for (const [name, value] of tokens) {
    const alias = /^var\((--[a-z0-9-]+)\)$/i.exec(value)
    if (alias) assert.ok(tokens.has(alias[1]), `${name} trỏ tới ${alias[1]} không tồn tại trong :root`)
    if (alias) assert.doesNotThrow(() => resolve(name), `${name} không được tạo vòng alias`)
  }
})

test(':root không khai báo trùng token nào', () => {
  assert.deepEqual(duplicates, [])
})

test('comment trong :root chia token thành CŨ / MỚI ĐANG DÙNG / MỚI CHƯA ĐƯỢC DÙNG và mỗi token nằm đúng nhóm', () => {
  const raw = rootRawBlock(css)
  const markers = ['TOKEN CŨ', 'TOKEN MỚI, ĐANG DÙNG', 'TOKEN MỚI, CHƯA ĐƯỢC DÙNG']
  const at = markers.map((marker) => raw.indexOf(marker))

  assert.ok(at.every((index) => index !== -1), `thiếu comment phân loại, vị trí tìm thấy: ${at.join(', ')}`)
  assert.ok(at[0] < at[1] && at[1] < at[2], 'thứ tự nhóm phải là cũ, mới đang dùng, mới chưa dùng')

  const namesIn = (from, to) => [...raw.slice(from, to).matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]).sort()
  const sections = [namesIn(at[0], at[1]), namesIn(at[1], at[2]), namesIn(at[2], raw.length)]

  assert.deepEqual(sections[0], [...Object.keys(OLD_TO_AV), ...Object.keys(OLD_VALUES), ...Object.keys(OLD_ALIASES)].sort(), 'nhóm CŨ phải là 18 token cũ (alias tạm hoặc giữ giá trị riêng)')
  assert.deepEqual(sections[1], ['--border-control', '--font-mono', '--font-ui', '--fs-md', '--fs-sm', '--fs-xs', '--radius-sm', '--shadow-card', '--sidebar-width', '--sidebar-width-collapsed', '--space-1', '--space-2', '--space-3', '--space-4', '--space-6'], 'nhóm MỚI ĐANG DÙNG sau R3: 2 token font, token cỡ chữ/spacing/bo góc/bóng/bề rộng của sidebar và 2 token nút chính (R3 gỡ 5 alias sidebar)')
  assert.deepEqual(sections[2], [...tokens.keys()].filter((name) => !name.startsWith('--av-') && !sections[0].includes(name) && !sections[1].includes(name)).sort(),
    'nhóm MỚI CHƯA DÙNG phải là phần còn lại của :root (trừ khối --av-* đứng riêng trước nhóm CŨ, tests/av-tokens.test.js canh gác)')
  assert.ok(raw.indexOf('TOKEN --av-*') !== -1 && raw.indexOf('TOKEN --av-*') < at[0], 'khối TOKEN --av-* phải đứng trước nhóm CŨ')
  assert.deepEqual(sections[2], [], 'nhóm CHƯA DÙNG rỗng sau R4: --border-control được nút viền của hero dùng (quyết định 9 và 12)')
})

test('token "CHƯA ĐƯỢC DÙNG" quả thật chưa được luật nào tham chiếu', () => {
  const raw = rootRawBlock(css)
  const unusedNames = [...raw.slice(raw.indexOf('TOKEN MỚI, CHƯA ĐƯỢC DÙNG')).matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1])
  const used = unusedNames.filter((name) => countVarUses(css, name) > 0)

  assert.deepEqual(unusedNames, [], 'nhóm CHƯA DÙNG rỗng sau R4 (--border-control đã chuyển sang ĐANG DÙNG)')
  assert.deepEqual(used, [], 'token trong nhóm CHƯA DÙNG đã bị áp vào luật: chuyển sang nhóm ĐANG DÙNG')
})

test('--border-control được nút viền .dashboard-outline-button dùng (chỗ dùng đầu tiên, R4)', () => {
  assert.ok(countVarUses(css, '--border-control') >= 1)
})

test('token "ĐANG DÙNG" quả thật được ít nhất một luật tham chiếu (Phase 2 áp vào sidebar, ☰ và nút chính)', () => {
  const raw = rootRawBlock(css)
  const from = raw.indexOf('TOKEN MỚI, ĐANG DÙNG')
  const names = [...raw.slice(from, raw.indexOf('TOKEN MỚI, CHƯA ĐƯỢC DÙNG')).matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1])
  const unused = names.filter((name) => countVarUses(css, name) === 0)

  assert.ok(names.length >= 14, `phải tìm thấy 14 token đang dùng (sau R4 gỡ 2 alias nút chính), thấy ${names.length}`)
  assert.deepEqual(unused, [], 'token nằm nhóm ĐANG DÙNG nhưng không luật nào tham chiếu: chuyển về nhóm CHƯA ĐƯỢC DÙNG')
})

test('token font "ĐANG DÙNG": --font-ui làm font nền của :root, --font-mono dùng đúng ở 10 chỗ font mã', () => {
  assert.ok(countVarUses(css, '--font-ui') >= 1, '--font-ui phải được dùng (font của :root)')
  assert.equal(countVarUses(css, '--font-mono'), 10, '--font-mono phải được dùng đúng ở 10 chỗ font mã (R5c thêm ký hiệu độ khó .difficulty-symbol theo Spec mục 6 "ký hiệu mono"; R4 thêm số trên cột của bảng minh họa .dashboard-demo-text; thêm .card-metric code của thẻ thư viện, trước đây code trong thẻ rơi về monospace mặc định)')
})

// ---------------------------------------------------------------------------------------------------------------------
// Tương phản (tính từ giá trị token thật)
// ---------------------------------------------------------------------------------------------------------------------

const PAIRS = [
  ['--text', '--av-bg', 4.5], ['--text', '--av-surface-1', 4.5], ['--text', '--av-surface-2', 4.5], ['--text', '--panel', 4.5],
  ['--muted', '--av-bg', 4.5], ['--muted', '--av-surface-1', 4.5], ['--muted', '--av-surface-2', 4.5], ['--muted', '--panel', 4.5], ['--muted', '--background', 4.5],
  ['--av-text-subtle', '--av-sidebar', 4.5], ['--av-text-subtle', '--av-surface-1', 4.5], ['--av-text-subtle', '--av-surface-2', 4.5],
  ['--av-primary-text', '--av-bg', 4.5], ['--av-primary-text', '--av-surface-2', 4.5], ['--av-primary-text', '--av-nav-active-bg', 4.5],
  ['--av-nav-active-text', '--av-nav-active-bg', 4.5], ['--av-primary-text', '--av-surface-1', 4.5],
  ['#ffffff', '--av-primary', 4.5], ['#ffffff', '--av-primary-hover', 4.5], ['#ffffff', '--purple-dark', 4.5],
  ['--av-bg', '--av-primary-text', 4.5],
  ['--bar-cue', '--av-primary-text', 3],
  ['--av-accent-text', '--av-surface-1', 4.5], ['--state-active', '--av-surface-1', 4.5], ['--av-success', '--av-surface-1', 4.5],
  ['--border-control', '--av-surface-1', 3], ['--border-control', '--av-bg', 3], ['--border-control', '--av-surface-2', 3],
  ['--av-nav-active-text', '--av-nav-active-bg', 9.9], ['--av-primary-text', '--av-nav-active-bg', 3], ['--av-primary-text', '--av-sidebar', 4.5],
  ['--av-primary-text', '--av-surface-1', 4.5], ['--av-primary-line', '--av-sidebar', 3], ['--av-primary-line', '--av-bg', 3],
  ['--av-focus', '--av-bg', 3], ['--av-focus', '--av-surface-1', 3],
]

for (const [foreground, background, minimum] of PAIRS) {
  test(`tương phản ${foreground} trên ${background} >= ${minimum}`, () => {
    const ratio = contrastRatio(colorOf(foreground), colorOf(background))
    assert.ok(ratio >= minimum, `${foreground} (${colorOf(foreground)}) trên ${background} (${colorOf(background)}) = ${ratio.toFixed(2)}, cần >= ${minimum}`)
  })
}

test('pill active hiện ra đúng bằng --av-primary-line 18% trên --av-sidebar (tính, không gõ tay)', () => {
  assert.equal(colorOf('--av-nav-active-bg'), blend(resolve('--av-primary-line'), 0.18, resolve('--av-sidebar')))
})

test('--av-primary-line chỉ cho icon, viền, chữ lớn: chữ nhỏ trên --av-surface-1 chỉ 4,39:1 và chữ trắng trên nó chỉ 4,23:1 (cả hai dưới 4,5, vì vậy bị cấm)', () => {
  assert.ok(contrastRatio(resolve('--av-primary-line'), resolve('--av-surface-1')) < 4.5)
  assert.ok(contrastRatio('#ffffff', resolve('--av-primary-line')) < 4.5)
  assert.ok(contrastRatio(resolve('--av-primary-line'), resolve('--av-surface-1')) >= 4.3, 'số đo đã ghi trong báo cáo R2a: 4,39')
})

test('không luật nào dùng --av-primary-line làm màu chữ (color)', () => {
  const bad = sheet.rules
    .filter((rule) => rule.declarations.some((declaration) => declaration.property === 'color' && declaration.value.includes('var(--av-primary-line)')))
    .flatMap((rule) => rule.selectors)

  assert.deepEqual(bad, [])
})

test('cấm chữ trắng trên --av-primary-text (màu canvas và cột): tỉ lệ thật dưới 4,5 (vì vậy bị cấm)', () => {
  assert.ok(contrastRatio('#ffffff', resolve('--av-primary-text')) < 4.5)
})

// Luật đặt nền tím sáng (#9B82FF) cùng chữ trắng. .dashboard-primary-button từng vi phạm (2,99:1) và đã sửa ở Redesign Phase 2
// (nền --av-primary từ R4); danh sách ngoại lệ giờ rỗng. Danh sách phải khớp chính xác: thêm vi phạm mới làm test đỏ.
const WHITE_ON_PURPLE_KNOWN = []

function whiteOnPurpleRules() {
  const purple = new Set(['var(--av-primary-line)', 'var(--av-primary-text)', resolve('--av-primary-text').toLowerCase(), '#9b82ff'])
  const white = new Set(['#fff', '#ffffff', 'white'])

  return sheet.rules
    .filter((rule) => {
      const background = rule.declarations.find((declaration) => /^background(-color)?$/.test(declaration.property))
      const color = rule.declarations.find((declaration) => declaration.property === 'color')
      return background && color && purple.has(background.value.toLowerCase()) && white.has(color.value.toLowerCase())
    })
    .flatMap((rule) => rule.selectors)
    .sort()
}

test('không luật mới nào đặt chữ trắng lên nền tím sáng (--av-primary-text; ngoại lệ đã biết được liệt kê)', () => {
  const extra = whiteOnPurpleRules().filter((selector) => !WHITE_ON_PURPLE_KNOWN.includes(selector))
  assert.deepEqual(extra, [], 'chữ trắng trên #9B82FF chỉ đạt 2,99:1; dùng --bg hoặc nền --av-primary')
})

test('mỗi ngoại lệ chữ trắng trên tím còn đúng là vi phạm (sửa xong thì phải xóa khỏi danh sách)', () => {
  assert.deepEqual(whiteOnPurpleRules(), WHITE_ON_PURPLE_KNOWN)
})

// ---------------------------------------------------------------------------------------------------------------------
// Font tự host
// ---------------------------------------------------------------------------------------------------------------------

const FONT_DIR = here('../public/fonts/')
const SUBSET_SIGNATURE = { latin: 'U+0000-00FF', vietnamese: 'U+1EA0-1EF9' }

const EXPECTED_FACES = [
  ...['latin', 'vietnamese'].flatMap((subset) => ['400', '500', '600', '700'].map((weight) => ({
    family: 'Be Vietnam Pro', subset, weight, file: `be-vietnam-pro-${subset}-${weight}.woff2`, variable: false,
  }))),
  ...['latin', 'vietnamese'].map((subset) => ({
    family: 'JetBrains Mono', subset, weight: '400 800', file: `jetbrains-mono-${subset}-variable.woff2`, variable: true,
  })),
]

const fontFaces = sheet.fontFaces.map((declarations) => Object.fromEntries(declarations.map(({ property, value }) => [property, value])))
const unquote = (value) => value.replace(/^['"]|['"]$/g, '')

test('style.css không còn @import nào (đặc biệt không @import url(http...) tới Google Fonts)', () => {
  assert.deepEqual(sheet.imports, [])
  assert.ok(!/@import/i.test(stripComments(css)))
})

test('không file nguồn nào nhắc fonts.googleapis.com hay fonts.gstatic.com (CSS, index.html, template, JS)', () => {
  const files = [here('../src/style.css'), here('../index.html'), here('../public/templates/app.html'),
    ...readdirSync(here('../src/'), { recursive: true }).filter((name) => name.endsWith('.js')).map((name) => here(`../src/${name}`))]
  const offenders = files.filter((file) => /fonts\.(googleapis|gstatic)\.com/.test(readFileSync(file, 'utf8'))).map((file) => file.pathname.split('/').slice(-2).join('/'))

  assert.deepEqual(offenders, [])
})

test('có đúng 10 @font-face: 8 Be Vietnam Pro tĩnh + 2 JetBrains Mono biến thiên', () => {
  assert.equal(fontFaces.length, 10)
})

for (const expected of EXPECTED_FACES) {
  test(`@font-face ${expected.family} ${expected.subset} ${expected.weight}: khai báo đủ và trỏ file thật ${expected.file}`, () => {
    const face = fontFaces.find((candidate) => unquote(candidate['font-family'] ?? '') === expected.family
      && candidate['font-weight'] === expected.weight && (candidate['unicode-range'] ?? '').includes(SUBSET_SIGNATURE[expected.subset]))

    assert.ok(face, `thiếu @font-face cho ${expected.family} ${expected.subset} ${expected.weight}`)
    assert.equal(face['font-style'], 'normal')
    assert.equal(face['font-display'], 'swap', 'phải có font-display: swap')
    assert.equal(face.src, `url('/fonts/${expected.file}') format('woff2')`, 'src phải là đúng một file woff2 trong /fonts/')

    const path = new URL(expected.file, FONT_DIR)
    assert.ok(existsSync(path), `public/fonts/${expected.file} phải tồn tại`)

    const tags = woff2Tags(readFileSync(path))
    assert.equal(tags.includes('fvar'), expected.variable, expected.variable ? 'file đặt tên variable phải là font biến thiên (có bảng fvar)' : 'font tĩnh không được có fvar')
  })
}

test('subset vietnamese phủ ắ ặ ộ ư ơ đ (unicode-range của @font-face vietnamese)', () => {
  const inRange = (range, codePoint) => range.split(',').some((part) => {
    const [from, to = from] = part.trim().replace(/^U\+/i, '').split('-U+').join('-').split('-')
    return codePoint >= Number.parseInt(from, 16) && codePoint <= Number.parseInt(to, 16)
  })
  const face = fontFaces.find((candidate) => (candidate['unicode-range'] ?? '').includes(SUBSET_SIGNATURE.vietnamese))

  assert.ok(face, 'thiếu @font-face vietnamese')
  for (const character of 'ắặộươđ') {
    assert.ok(inRange(face['unicode-range'], character.codePointAt(0)), `unicode-range vietnamese thiếu ${character}`)
  }
})

test('mọi font-weight số dùng trong CSS (400, 500, 600, 700) đều có face Be Vietnam Pro tương ứng', () => {
  const used = [...new Set([...stripComments(css).matchAll(/font-weight:\s*(\d{3})\b/g)].map((match) => match[1]))].sort()
  const available = new Set(EXPECTED_FACES.filter((face) => face.family === 'Be Vietnam Pro').map((face) => face.weight))
  const missing = used.filter((weight) => !available.has(weight))

  assert.deepEqual(missing, [], 'trọng lượng dùng trong CSS mà không có @font-face (trình duyệt sẽ chọn gần nhất)')
})

test('public/fonts có đúng 10 woff2 + 2 file OFL, không file thừa; tổng woff2 <= 175 kB', () => {
  assert.ok(existsSync(FONT_DIR), 'thư mục public/fonts phải tồn tại')

  const names = readdirSync(FONT_DIR).sort()
  assert.deepEqual(names, [...EXPECTED_FACES.map((face) => face.file), 'OFL-BeVietnamPro.txt', 'OFL-JetBrainsMono.txt'].sort())

  const total = names.filter((name) => name.endsWith('.woff2')).reduce((sum, name) => sum + statSync(new URL(name, FONT_DIR)).size, 0)
  assert.ok(total <= 175000, `tổng woff2 ${total} B vượt ngưỡng 175000 B`)
})

for (const [file, family] of [['OFL-BeVietnamPro.txt', 'Be Vietnam Pro'], ['OFL-JetBrainsMono.txt', 'JetBrains Mono']]) {
  test(`${file} là giấy phép SIL Open Font License và nhắc đúng tên font ${family}`, () => {
    const path = new URL(file, FONT_DIR)
    assert.ok(existsSync(path), `thiếu public/fonts/${file}`)

    const text = readFileSync(path, 'utf8')
    assert.match(text, /SIL OPEN FONT LICENSE/i)
    assert.ok(text.includes(family), `giấy phép phải nhắc "${family}"`)
  })
}

const indexHtml = readFileSync(here('../index.html'), 'utf8')
const preloads = [...indexHtml.matchAll(/<link\b[^>]*\brel="preload"[^>]*>/gi)].map((match) => match[0])

test('index.html có đúng một <link rel="preload"> font: as=font, type=font/woff2, crossorigin', () => {
  assert.equal(preloads.length, 1)
  assert.match(preloads[0], /\bas="font"/)
  assert.match(preloads[0], /\btype="font\/woff2"/)
  assert.match(preloads[0], /\bcrossorigin\b/)
})

test('preload trỏ tới một file có thật mà một @font-face khai báo', () => {
  const href = /\bhref="([^"]+)"/.exec(preloads[0] ?? '')?.[1]

  assert.ok(href, 'preload phải có href')
  assert.ok(href.startsWith('/fonts/'), `href ${href} phải bắt đầu bằng /fonts/`)
  assert.ok(existsSync(new URL(href.replace('/fonts/', ''), FONT_DIR)), `${href} không có trong public/fonts`)
  assert.ok(fontFaces.some((face) => (face.src ?? '').includes(`'${href}'`)), `không @font-face nào dùng ${href}`)
})

test('.gitattributes đánh dấu *.woff2 là binary', () => {
  assert.match(readFileSync(here('../.gitattributes'), 'utf8'), /^\*\.woff2\s+binary\s*$/m)
})

test('ngoại lệ khoảng trắng cuối dòng chỉ áp cho hai file OFL (văn bản giấy phép gốc có khoảng trắng cuối), không nới luật chung', () => {
  const attributes = readFileSync(here('../.gitattributes'), 'utf8').split('\n').filter((line) => /whitespace/.test(line))
  assert.deepEqual(attributes, ['public/fonts/OFL-*.txt -whitespace'])

  const editorconfig = readFileSync(here('../.editorconfig'), 'utf8')
  const sections = [...editorconfig.matchAll(/^\[([^\]]+)\]\s*$([^[]*)/gm)].map((match) => ({ glob: match[1], body: match[2] }))
  const relaxed = sections.filter((section) => /trim_trailing_whitespace\s*=\s*false/.test(section.body)).map((section) => section.glob).sort()

  assert.deepEqual(relaxed, ['*.md', 'public/fonts/OFL-*.txt'])
  assert.equal(sections.find((section) => section.glob === '*')?.body.match(/trim_trailing_whitespace\s*=\s*(\w+)/)?.[1], 'true', 'luật chung [*] vẫn phải bật trim_trailing_whitespace')
})

test('hai file OFL dùng LF, không BOM và dòng 21 giữ nguyên khoảng trắng cuối của bản gốc', () => {
  for (const file of ['OFL-BeVietnamPro.txt', 'OFL-JetBrainsMono.txt']) {
    const bytes = readFileSync(new URL(file, FONT_DIR))
    assert.ok(!bytes.includes(13), `${file}: không được có CR`)
    assert.notDeepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf], `${file}: không được có BOM`)
    assert.equal(bytes.toString('utf8').split('\n').length - 1, 93, `${file}: giữ nguyên 93 dòng`)
    assert.ok(bytes.toString('utf8').split('\n')[20].endsWith('embedded, '), `${file}: dòng 21 phải giữ khoảng trắng cuối của văn bản OFL gốc`)
  }
})

// ---------------------------------------------------------------------------------------------------------------------
// Font mã: mọi font-family đi qua token
// ---------------------------------------------------------------------------------------------------------------------

test('mọi font-family ngoài định nghĩa token là var(--font-ui), var(--font-mono) hoặc inherit', () => {
  const values = sheet.rules.flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === 'font-family').map((declaration) => declaration.value))
  const bad = values.filter((value) => !['var(--font-ui)', 'var(--font-mono)', 'inherit'].includes(value))

  assert.deepEqual(bad, [], 'còn font-family viết tay')
})

test('chỉ định nghĩa --font-mono nhắc ui-monospace; không còn Consolas hay Courier New nơi nào', () => {
  const code = stripComments(css)

  assert.equal((code.match(/ui-monospace/g) ?? []).length, 1, 'ui-monospace chỉ được xuất hiện trong --font-mono')
  assert.ok(!/consolas|courier/i.test(code))
})

test(':root dùng var(--font-ui) làm font nền', () => {
  const root = sheet.rules.find((rule) => rule.selectors.length === 1 && rule.selectors[0] === ':root')
  assert.equal(root.declarations.find((declaration) => declaration.property === 'font-family')?.value, 'var(--font-ui)')
})

// ---------------------------------------------------------------------------------------------------------------------
// Gom hex vào token (12 chỗ). Từ R2 các token này là alias của --av-*, nên màu hiển thị đổi theo Spec (không còn y hệt hex cũ)
// ---------------------------------------------------------------------------------------------------------------------

const HEX_TO_TOKEN = [
  ['.size-control select', 'color', '#e8eaf2', '--text'],
  ['.complexity-heading h4', 'color', '#e8eaf2', '--text'],
  ['.visualizer-heading p', 'color', '#9298ad', '--muted'],
  ['.stat-card span', 'color', '#9298ad', '--muted'],
  ['.complexity-card > span', 'color', '#9298ad', '--muted'],
  ['.complexity-card p', 'color', '#9298ad', '--muted'],
  ['.card-footer', 'border-top', '#292c3a', '--border'],
  ['.stat-card', 'border', '#292c3a', '--border'],
  ['.complexity-card', 'border', '#292c3a', '--border'],
  ['.stack-visualizer', 'background', '#0c0d12', '--background'],
  ['.algorithm-card.selected', 'background', '#12141c', '--panel'],
]

for (const [selector, property, was, token] of HEX_TO_TOKEN) {
  test(`${selector} { ${property} } dùng var(${token}) thay cho ${was}; token là alias của ${OLD_TO_AV[token]} (R2: màu đổi theo Spec)`, () => {
    const values = declarationValues(css, selector, property)

    assert.ok(values.length > 0, `không thấy ${property} trong luật ${selector}`)
    assert.ok(values.every((value) => value.includes(`var(${token})`)), `${selector} ${property} = ${values.join(' | ')} phải dùng var(${token})`)
    assert.ok(values.every((value) => !value.toLowerCase().includes(was)), `${selector} còn hex ${was}`)
    assert.equal(tokens.get(token), `var(${OLD_TO_AV[token]})`, `${token} phải là alias của ${OLD_TO_AV[token]}`)
    assert.equal(normalize(resolve(token)), normalize(tokens.get(OLD_TO_AV[token])), `${token} phải giải ra giá trị Spec của ${OLD_TO_AV[token]}`)
  })
}

// ---------------------------------------------------------------------------------------------------------------------
// Màu visualization không đổi
// ---------------------------------------------------------------------------------------------------------------------

test('màu trạng thái giữ nguyên: --state-active #f6c76a, --bar-cue #0d0f15', () => {
  assert.equal(normalize(tokens.get('--state-active')), '#f6c76a')
  assert.equal(normalize(tokens.get('--bar-cue')), '#0d0f15')
})

test('#22c55e (trạng thái tìm thấy/đầu hàng đợi) vẫn viết thẳng ở đúng 13 chỗ (Spec không quy định màu trạng thái visualizer, giữ đến R6)', () => {
  const outsideRoot = stripComments(css).replace(rootRawBlock(stripComments(css)), '')
  assert.equal((outsideRoot.match(/#22c55e/gi) ?? []).length, 13)
})

// Từ 4 xuống 2 ở PR chore/bundle-headroom: hai chỗ bị gỡ là khai báo chết (border-color của .array-cell:hover và .array-operation-card input:focus)
// bị khối sau ghi đè bằng var(--purple), nên màu hiển thị không đổi. Hai chỗ còn lại (viền và nhãn của hàng đợi) vẫn viết thẳng.
test('#60a5fa (viền, nhãn đầu cuối hàng đợi) vẫn viết thẳng ở đúng 2 chỗ (#60a5fa là màu icon nhỏ của Spec, chưa có token tên)', () => {
  const outsideRoot = stripComments(css).replace(rootRawBlock(stripComments(css)), '')
  assert.equal((outsideRoot.match(/#60a5fa/gi) ?? []).length, 2)
})

// ---------------------------------------------------------------------------------------------------------------------
// Redesign R2: vai trò của --purple cũ (31 chỗ: 7 chữ gồm alias, 8 viền/nền hover, 3 focus, 13 canvas)
// ---------------------------------------------------------------------------------------------------------------------

test('vòng focus theo Spec: mọi outline của :focus-visible/:focus là 2px solid var(--av-focus) với offset 2px (mục nav: offset -2px trong vùng cuộn)', () => {
  const focusRules = sheet.rules.filter((rule) => rule.selectors.some((selector) => /:focus(-visible)?$/.test(selector)))
  const outlines = focusRules.flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === 'outline' && declaration.value !== 'none').map((declaration) => [rule.selectors.join(', '), declaration.value]))

  assert.ok(outlines.length >= 4, `phải có ít nhất 4 luật vòng focus, thấy ${outlines.length}`)
  assert.deepEqual(outlines.filter(([, value]) => value !== '2px solid var(--av-focus)'), [], 'vòng focus phải là 2px solid var(--av-focus)')

  for (const rule of focusRules) {
    const offset = rule.declarations.find((declaration) => declaration.property === 'outline-offset')
    if (!offset) continue
    // Offset -2px (vòng nằm trong): mục nav (vùng cuộn) và summary của accordion (R6b: hộp rộng hết khung, offset dương bị cắt bởi viền khung).
    const expected = rule.selectors.every((selector) => /^(\.nav-(sub)?item|\.panel-accordion > summary):focus-visible$/.test(selector)) ? '-2px' : '2px'
    assert.equal(offset.value, expected, `${rule.selectors.join(', ')}: outline-offset`)
  }
})

test('luật :focus-visible chung (select, input, textarea, [tabindex], pre và vùng cuộn Chrome cho focus như #array-visualizer) dùng đúng vòng 2px solid var(--av-focus), offset 2px', () => {
  const generic = sheet.rules.find((rule) => rule.media === null && rule.selectors.length === 1 && rule.selectors[0] === ':focus-visible')

  assert.ok(generic, 'thiếu luật :focus-visible chung: phần tử không có luật riêng rơi về vòng mặc định auto gần đen của trình duyệt')
  assert.equal(generic.declarations.find((declaration) => declaration.property === 'outline')?.value, '2px solid var(--av-focus)')
  assert.equal(generic.declarations.find((declaration) => declaration.property === 'outline-offset')?.value, '2px')
})

test('luật focus-visible chung đứng TRƯỚC `.main-content:focus` và `.array-operation-card input` để hai luật bỏ vòng này (cùng độ ưu tiên) thắng theo thứ tự', () => {
  const selectorsInOrder = sheet.rules.filter((rule) => rule.media === null).map((rule) => rule.selectors.join(', '))
  const at = (selector) => selectorsInOrder.findIndex((text) => text === selector || text.split(', ').includes(selector))
  const generic = at(':focus-visible')

  assert.ok(generic !== -1)
  assert.ok(generic < at('.main-content:focus'), 'luật chung phải trước .main-content:focus (outline: none cho vùng nội dung được focus bằng chương trình)')
  assert.ok(generic < at('.array-operation-card input'), 'luật chung phải trước .array-operation-card input (outline: none + glow, để R7 quyết)')
  assert.deepEqual(declarationValues(css, '.array-operation-card input', 'outline'), ['none'], 'ô nhập Mảng giữ outline: none + glow cho tới R7')
})

test('13 chỗ canvas BST/Hash/Graph từng dùng --purple nay dùng var(--av-primary-text) (R6b); --purple không còn', () => {
  const canvas = sheet.rules.flatMap((rule) => rule.declarations.filter((declaration) => declaration.value.includes('var(--av-primary-text)') && rule.selectors.some((selector) => /^\.(bst|hash|graph)-/.test(selector))).map(() => rule.selectors.join(', ')))

  assert.equal(canvas.length, 13, 'đúng 13 khai báo canvas dùng var(--av-primary-text)')
  assert.equal(sheet.rules.filter((rule) => rule.declarations.some((declaration) => declaration.value.includes('var(--purple)'))).length, 0)
})

// ---------------------------------------------------------------------------------------------------------------------
// Redesign R2 commit 3: không viết cứng hex trùng hẳn màu Spec ngoài :root
// ---------------------------------------------------------------------------------------------------------------------

// Giá trị Spec đã đặt tên token: đọc từ :root (khối --av-*), không gõ lại.
const NAMED_SPEC_COLORS = new Map([...tokens].filter(([name, value]) => /^--av-/.test(name) && /^#[0-9a-f]{6}$/i.test(value)).map(([name, value]) => [value.toLowerCase(), name]))

// Ngoại lệ: hex trùng giá trị Spec nhưng Spec KHÔNG đặt tên token (R2 chưa khai báo), nên chưa thể thay. Mỗi mục có lý do; khi R3-R6
// khai báo token tương ứng thì chuyển luật sang token và xóa mục khỏi danh sách (test mục cuối bắt mục thừa).
const SPEC_HEX_EXCEPTIONS = [
  ['#stack-status.is-error', '#fca5a5', 'danger-text của Spec chưa có token (R2 không khai báo giá trị Spec không tên)'],
  ['#linked-list-status[data-type="error"]', '#fca5a5', 'danger-text của Spec chưa có token'],
  ['.bst-error', '#fca5a5', 'danger-text của Spec chưa có token'],
  ['.queue-cell.is-rear', '#60a5fa', 'accent-icon của Spec chưa có token'],
  ['.queue-rear-label', '#60a5fa', 'accent-icon của Spec chưa có token'],
]

function specHexOutsideRoot() {
  const found = []

  for (const rule of sheet.rules) {
    if (rule.selectors.length === 1 && rule.selectors[0] === ':root') continue
    for (const declaration of rule.declarations) {
      for (const match of declaration.value.matchAll(/#[0-9a-f]{6}\b/gi)) {
        if (NAMED_SPEC_COLORS.has(match[0].toLowerCase())) found.push([rule.selectors.join(', '), match[0].toLowerCase(), declaration.property])
      }
    }
  }

  return found
}

test('không còn hex viết cứng trùng hẳn màu Spec đã có token (ngoài :root)', () => {
  const offenders = specHexOutsideRoot().map(([selector, hex, property]) => `${selector} { ${property}: ${hex} } nên dùng var(${NAMED_SPEC_COLORS.get(hex)})`)
  assert.deepEqual(offenders, [])
})

test('hex trùng giá trị Spec chưa có token chỉ nằm ở danh sách ngoại lệ có lý do (mỗi mục vẫn còn đúng, không thừa)', () => {
  const unnamed = ['#fca5a5', '#60a5fa']
  const actual = sheet.rules
    .filter((rule) => !(rule.selectors.length === 1 && rule.selectors[0] === ':root'))
    .flatMap((rule) => rule.declarations.flatMap((declaration) => [...declaration.value.matchAll(/#[0-9a-f]{6}\b/gi)].map((match) => [rule.selectors.join(', '), match[0].toLowerCase()])))
    .filter(([, hex]) => unnamed.includes(hex))
    .sort()

  assert.deepEqual(actual, SPEC_HEX_EXCEPTIONS.map(([selector, hex]) => [selector, hex]).sort())
  assert.ok(SPEC_HEX_EXCEPTIONS.every(([, , reason]) => reason.length > 10), 'mỗi ngoại lệ phải có lý do')
})

test('glow focus của ô nhập Mảng dùng rgba của --av-primary-line với alpha 0,15, không còn hex 8 chữ số #9b82ff26', () => {
  const [red, green, blue] = [1, 3, 5].map((at) => Number.parseInt(tokens.get('--av-primary-line').slice(at, at + 2), 16))

  assert.deepEqual(declarationValues(css, '.array-operation-card input:focus', 'box-shadow'), [`0 0 0 3px rgba(${red}, ${green}, ${blue}, 0.15)`])
})
