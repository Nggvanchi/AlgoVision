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
const colorOf = (reference) => (reference.startsWith('#') ? reference : resolve(reference))

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

const NEW_COLORS = [
  ['--bg', '#0B0B14'], ['--bg-sidebar', '#0E0E19'], ['--surface', '#13131F'], ['--surface-raised', '#1A1A28'],
  ['--text-label', '#8B8FA6'], ['--purple-strong', '#6D55D9'], ['--purple-pressed', '#5B43C7'], ['--purple-soft', '#B9A8FF'],
  ['--purple-tint', '#25213E'], ['--blue', '#60A5FA'], ['--success', '#22C55E'], ['--border-control', '#6B6B87'],
]

for (const [name, value] of NEW_COLORS) {
  test(`token mới ${name} = ${value}`, () => {
    assert.ok(tokens.has(name), `:root phải khai báo ${name}`)
    assert.equal(normalize(tokens.get(name)), value.toLowerCase())
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

test('token cỡ chữ: 12/13/14/16/20/24 và display clamp(30px, 4vw, 44px)', () => {
  const entries = ['--fs-xs', '--fs-sm', '--fs-md', '--fs-base', '--fs-lg', '--fs-xl', '--fs-display'].map((name) => [name, tokens.get(name)])
  assert.deepEqual(entries, [
    ['--fs-xs', '12px'], ['--fs-sm', '13px'], ['--fs-md', '14px'], ['--fs-base', '16px'],
    ['--fs-lg', '20px'], ['--fs-xl', '24px'], ['--fs-display', 'clamp(30px, 4vw, 44px)'],
  ])
})

test('token spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48 (bội số của 4, tên = px / 4)', () => {
  const names = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-8', '--space-10', '--space-12']
  const values = names.map((name) => tokens.get(name))
  assert.deepEqual(values, ['4px', '8px', '12px', '16px', '20px', '24px', '32px', '40px', '48px'])
  names.forEach((name, index) => assert.equal(Number.parseInt(values[index]) / 4, Number(name.split('-').at(-1)), `${name} phải bằng px / 4`))
})

test('token bo góc: 8, 12, 16 và 999px', () => {
  assert.deepEqual(['--radius-sm', '--radius-md', '--radius-lg', '--radius-pill'].map((name) => tokens.get(name)), ['8px', '12px', '16px', '999px'])
})

test('token bóng: --shadow-card và --glow-purple', () => {
  assert.equal(tokens.get('--shadow-card'), '0 8px 24px rgba(0, 0, 0, 0.35)')
  assert.equal(tokens.get('--glow-purple'), '0 0 0 1px rgba(155, 130, 255, 0.35), 0 8px 28px rgba(155, 130, 255, 0.18)')
})

// ---------------------------------------------------------------------------------------------------------------------
// 18 token cũ giữ nguyên (Phương án A) và phân loại trong :root
// ---------------------------------------------------------------------------------------------------------------------

const OLD_VALUES = {
  '--background': '#0c0d12', '--panel': '#12141c', '--panel-hover': '#191b27', '--border': '#292c3a', '--text': '#e8eaf2',
  '--muted': '#9298ad', '--purple': '#9b82ff', '--purple-dark': '#7456e8', '--state-active': '#f6c76a', '--bar-cue': '#0d0f15',
}
const OLD_ALIASES = {
  '--text-muted': 'var(--muted)', '--border-color': 'var(--border)', '--card-background': 'var(--panel)',
  '--text-secondary': 'var(--muted)', '--accent-color': 'var(--purple)', '--surface-secondary': 'var(--panel)',
  '--surface-color': 'var(--panel-hover)', '--panel-bg': 'var(--panel)',
}

test('10 token gốc cũ giữ nguyên đúng giá trị (Phương án A: chưa đổi diện mạo)', () => {
  const actual = Object.fromEntries(Object.keys(OLD_VALUES).map((name) => [name, normalize(tokens.get(name) ?? '(thiếu)')]))
  assert.deepEqual(actual, OLD_VALUES)
})

test('8 alias cũ còn đủ và trỏ đúng token gốc cũ; mọi alias trỏ tới token có thật', () => {
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

  assert.deepEqual(sections[0], [...Object.keys(OLD_VALUES), ...Object.keys(OLD_ALIASES)].sort(), 'nhóm CŨ phải là 18 token cũ')
  assert.deepEqual(sections[1], ['--bg-sidebar', '--font-mono', '--font-ui', '--fs-md', '--fs-sm', '--fs-xs', '--purple-pressed', '--purple-strong', '--purple-tint', '--radius-sm', '--shadow-card', '--sidebar-width', '--sidebar-width-collapsed', '--space-1', '--space-2', '--space-3', '--space-4', '--space-6', '--surface-raised', '--text-label'], 'nhóm MỚI ĐANG DÙNG: 2 token font (Phase 1) và 18 token Phase 2 áp vào sidebar và nút chính')
  assert.deepEqual(sections[2], [...tokens.keys()].filter((name) => !sections[0].includes(name) && !sections[1].includes(name)).sort(),
    'nhóm MỚI CHƯA DÙNG phải là phần còn lại của :root')
  assert.ok(sections[2].length >= 17, `phải có ít nhất 17 token định nghĩa sẵn chưa dùng, thấy ${sections[2].length}`)
})

test('token "CHƯA ĐƯỢC DÙNG" quả thật chưa được luật nào tham chiếu', () => {
  const raw = rootRawBlock(css)
  const unusedNames = [...raw.slice(raw.indexOf('TOKEN MỚI, CHƯA ĐƯỢC DÙNG')).matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1])
  const used = unusedNames.filter((name) => countVarUses(css, name) > 0)

  assert.ok(unusedNames.length >= 17, `phải tìm thấy ít nhất 17 token chưa dùng, thấy ${unusedNames.length}`)
  assert.deepEqual(used, [], 'các token này đã bị áp vào luật; Phase 1 chỉ định nghĩa (gồm --border-control, --blue, --success, cỡ chữ, spacing, bo góc, bóng)')
})

test('token "ĐANG DÙNG" quả thật được ít nhất một luật tham chiếu (Phase 2 áp vào sidebar, ☰ và nút chính)', () => {
  const raw = rootRawBlock(css)
  const from = raw.indexOf('TOKEN MỚI, ĐANG DÙNG')
  const names = [...raw.slice(from, raw.indexOf('TOKEN MỚI, CHƯA ĐƯỢC DÙNG')).matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1])
  const unused = names.filter((name) => countVarUses(css, name) === 0)

  assert.ok(names.length >= 20, `phải tìm thấy 20 token đang dùng, thấy ${names.length}`)
  assert.deepEqual(unused, [], 'token nằm nhóm ĐANG DÙNG nhưng không luật nào tham chiếu: chuyển về nhóm CHƯA ĐƯỢC DÙNG')
})

test('token font "ĐANG DÙNG": --font-ui làm font nền của :root, --font-mono dùng đúng ở 7 chỗ font mã', () => {
  assert.ok(countVarUses(css, '--font-ui') >= 1, '--font-ui phải được dùng (font của :root)')
  assert.equal(countVarUses(css, '--font-mono'), 7, '--font-mono phải được dùng đúng ở 7 chỗ font mã')
})

// ---------------------------------------------------------------------------------------------------------------------
// Tương phản (tính từ giá trị token thật)
// ---------------------------------------------------------------------------------------------------------------------

const PAIRS = [
  ['--text', '--bg', 4.5], ['--text', '--surface', 4.5], ['--text', '--surface-raised', 4.5], ['--text', '--panel', 4.5],
  ['--muted', '--bg', 4.5], ['--muted', '--surface', 4.5], ['--muted', '--surface-raised', 4.5], ['--muted', '--panel', 4.5], ['--muted', '--background', 4.5],
  ['--text-label', '--bg-sidebar', 4.5], ['--text-label', '--surface', 4.5], ['--text-label', '--surface-raised', 4.5],
  ['--purple', '--bg', 4.5], ['--purple', '--surface', 4.5], ['--purple', '--surface-raised', 4.5], ['--purple', '--purple-tint', 4.5],
  ['--purple-soft', '--purple-tint', 4.5], ['--purple-soft', '--surface', 4.5],
  ['#ffffff', '--purple-strong', 4.5], ['#ffffff', '--purple-pressed', 4.5], ['#ffffff', '--purple-dark', 4.5],
  ['--bg', '--purple', 4.5],
  ['--bar-cue', '--purple', 3],
  ['--blue', '--surface', 4.5], ['--state-active', '--surface', 4.5], ['--success', '--surface', 4.5],
  ['--border-control', '--surface', 3], ['--border-control', '--bg', 3], ['--border-control', '--surface-raised', 3],
]

for (const [foreground, background, minimum] of PAIRS) {
  test(`tương phản ${foreground} trên ${background} >= ${minimum}`, () => {
    const ratio = contrastRatio(colorOf(foreground), colorOf(background))
    assert.ok(ratio >= minimum, `${foreground} (${colorOf(foreground)}) trên ${background} (${colorOf(background)}) = ${ratio.toFixed(2)}, cần >= ${minimum}`)
  })
}

test('--purple-tint đúng bằng #9B82FF 16% trên --bg-sidebar (tính, không gõ tay)', () => {
  assert.equal(blend(resolve('--purple'), 0.16, resolve('--bg-sidebar')), normalize(resolve('--purple-tint')))
})

test('cấm chữ trắng trên --purple: tỉ lệ thật dưới 4,5 (vì vậy bị cấm)', () => {
  assert.ok(contrastRatio('#ffffff', resolve('--purple')) < 4.5)
})

// Luật đặt nền tím sáng (#9B82FF) cùng chữ trắng. .dashboard-primary-button từng vi phạm (2,99:1) và đã sửa ở Redesign Phase 2
// (nền --purple-strong); danh sách ngoại lệ giờ rỗng. Danh sách phải khớp chính xác: thêm vi phạm mới làm test đỏ.
const WHITE_ON_PURPLE_KNOWN = []

function whiteOnPurpleRules() {
  const purple = new Set(['var(--purple)', 'var(--accent-color)', resolve('--purple').toLowerCase()])
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

test('không luật mới nào đặt chữ trắng lên nền --purple (ngoại lệ đã biết được liệt kê)', () => {
  const extra = whiteOnPurpleRules().filter((selector) => !WHITE_ON_PURPLE_KNOWN.includes(selector))
  assert.deepEqual(extra, [], 'chữ trắng trên #9B82FF chỉ đạt 2,99:1; dùng --bg hoặc nền --purple-strong')
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
// Gom hex khớp đúng token (12 chỗ, không đổi diện mạo; .brand-icon rời bảng này ở Redesign Phase 2 vì đổi nền sang --purple-strong)
// ---------------------------------------------------------------------------------------------------------------------

const HEX_TO_TOKEN = [
  ['.size-control select', 'color', '#e8eaf2', '--text'],
  ['.speed-control select', 'color', '#e8eaf2', '--text'],
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
  test(`${selector} { ${property} } dùng var(${token}) thay cho ${was}, giá trị token y hệt nên không đổi diện mạo`, () => {
    const values = declarationValues(css, selector, property)

    assert.ok(values.length > 0, `không thấy ${property} trong luật ${selector}`)
    assert.ok(values.every((value) => value.includes(`var(${token})`)), `${selector} ${property} = ${values.join(' | ')} phải dùng var(${token})`)
    assert.ok(values.every((value) => !value.toLowerCase().includes(was)), `${selector} còn hex ${was}`)
    assert.equal(normalize(tokens.get(token)), was, `${token} phải đúng bằng ${was} thì gom mới không đổi màu`)
  })
}

// ---------------------------------------------------------------------------------------------------------------------
// Màu visualization không đổi
// ---------------------------------------------------------------------------------------------------------------------

test('màu trạng thái giữ nguyên: --state-active #f6c76a, --bar-cue #0d0f15', () => {
  assert.equal(normalize(tokens.get('--state-active')), '#f6c76a')
  assert.equal(normalize(tokens.get('--bar-cue')), '#0d0f15')
})

test('#22c55e (trạng thái tìm thấy/đầu hàng đợi) vẫn viết thẳng ở đúng 13 chỗ, chưa bị đổi sang --success', () => {
  const outsideRoot = stripComments(css).replace(rootRawBlock(stripComments(css)), '')
  assert.equal((outsideRoot.match(/#22c55e/gi) ?? []).length, 13)
})

test('#60a5fa (viền focus/hover, nhãn đầu cuối hàng đợi) vẫn viết thẳng ở đúng 4 chỗ, chưa bị đổi sang --blue', () => {
  const outsideRoot = stripComments(css).replace(rootRawBlock(stripComments(css)), '')
  assert.equal((outsideRoot.match(/#60a5fa/gi) ?? []).length, 4)
})
