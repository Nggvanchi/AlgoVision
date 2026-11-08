import test from 'node:test'
import assert from 'node:assert/strict'
import { readStyle, rootTokens, declarationValues } from './helpers/css-tokens.js'

// Redesign R2: khối token --av-* theo Spec v1.0 mục 2 (docs/design/spec.md dòng 46-65, 111) và --av-nav-active-text.
// Bảng dưới là hợp đồng của Spec; giá trị Spec không đặt tên và chưa dùng ở R2 thì CHƯA khai báo.

const { tokens, duplicates } = rootTokens(readStyle())

const SPEC_TOKENS = {
  '--av-bg': '#0B0B12',
  '--av-sidebar': '#0E0E16',
  '--av-surface-1': '#12121C',
  '--av-surface-2': '#1A1A28',
  '--av-surface-3': '#1E1E2C',
  '--av-border': '#272738',
  '--av-border-strong': '#2E2E44',
  '--av-border-dashed': '#3A3A52',
  '--av-text': '#ECECF4',
  '--av-text-muted': '#A1A1B5',
  '--av-text-subtle': '#8A8AA0',
  '--av-primary': '#7C3AED',
  '--av-primary-hover': '#6D28D9',
  '--av-primary-text': '#A78BFA',
  '--av-primary-line': '#8B5CF6',
  '--av-accent': '#3B82F6',
  '--av-accent-text': '#93C5FD',
  '--av-success': '#34D399',
  '--av-warning': '#FBBF24',
  '--av-danger': '#F87171',
  '--av-focus': '#C4B5FD',
  '--av-nav-active-text': '#DDD6FE',
  // Nền mềm của mục nav đang mở (Spec mục 12): rgba của --av-primary-line, alpha 0,18. Thay --purple-active (R3).
  '--av-nav-active-bg': 'rgba(139, 92, 246, 0.18)',
  '--av-space-1': '4px',
  '--av-space-2': '8px',
  '--av-space-3': '12px',
  '--av-space-4': '16px',
  '--av-space-5': '24px',
  '--av-space-6': '32px',
  '--av-space-7': '48px',
  '--av-space-8': '64px',
  // Bảng cỡ chữ Spec mục 3 (chỉ cỡ px; đậm và line-height do từng luật quyết). Spec không đặt tên token: tên do R2 chọn.
  // Spec ghi khoảng ở 3 dòng, R2 chọn một đầu: Card 16–17 -> 16, Body nhỏ 13.5–14 -> 14, Label nhỏ 11–12 -> 12.
  '--av-fs-display': '40px',
  '--av-fs-hero': '34px',
  '--av-fs-page': '28px',
  '--av-fs-h2': '24px',
  '--av-fs-h3': '18px',
  '--av-fs-card': '16px',
  '--av-fs-body': '15px',
  '--av-fs-body-sm': '14px',
  '--av-fs-caption': '13px',
  '--av-fs-label': '12px',
  '--av-fs-code': '14px',
}

for (const [name, expected] of Object.entries(SPEC_TOKENS)) {
  test(`token ${name} có trong :root và đúng giá trị Spec ${expected}`, () => {
    assert.ok(tokens.has(name), `${name} chưa được khai báo trong :root`)
    assert.equal(tokens.get(name).toLowerCase(), expected.toLowerCase(), `${name} sai giá trị so với Spec`)
  })
}

test('không có token --av-* ngoài danh sách Spec (giá trị Spec không tên chưa dùng thì chưa khai báo)', () => {
  const extra = [...tokens.keys()].filter((name) => name.startsWith('--av-') && !(name in SPEC_TOKENS))
  assert.deepEqual(extra, [], `token --av-* ngoài hợp đồng: ${extra.join(', ')}`)
})

// Áp token cỡ chữ vào nút, input, thẻ CHỈ khi cỡ hiện tại đã bằng token (không đổi diện mạo). [selector, token, cỡ px trước R2]
const FONT_SIZE_APPLIED = [
  ['.algorithm-card h4', '--av-fs-card', '16px'],
  ['.structure-card-title', '--av-fs-card', '16px'],
  ['.array-panel-heading h4', '--av-fs-card', '16px'],
  ['.array-operation-card h4', '--av-fs-card', '16px'],
  ['.primary-button', '--av-fs-label', '12px'],
  ['.control-button', '--av-fs-caption', '13px'],
  ['.back-button', '--av-fs-caption', '13px'],
  ['.stack-operations .array-operation-card label', '--av-fs-caption', '13px'],
  ['.dashboard-card-title', '--av-fs-h3', '18px'],
  ['.dashboard-card-link', '--av-fs-body-sm', '14px'],
  ['.dashboard-card-status', '--av-fs-label', '12px'],
]

// Bỏ qua vì cỡ hiện tại LỆCH token gần nhất: áp sẽ đổi diện mạo, để R3-R6 quyết theo từng màn hình. [selector, cỡ hiện tại, lý do]
const FONT_SIZE_SKIPPED = [
  ['.algorithm-symbol', '20px', 'không có bậc 20 trong Spec (H3 18, H2 24)'],
  ['.structure-card-icon', '20px', 'như trên'],
  ['.stat-card strong', '21px', 'không có bậc 21 trong Spec'],
  ['.complexity-card > span', '11px', 'Spec cho Label nhỏ 11–12; R2 chọn 12 nên 11 lệch'],
  ['.complexity-card p', '11px', 'như trên'],
]

for (const [selector, token, was] of FONT_SIZE_APPLIED) {
  test(`${selector} { font-size } dùng var(${token}) thay cho ${was} (giá trị token y hệt nên không đổi diện mạo)`, () => {
    assert.deepEqual(declarationValues(readStyle(), selector, 'font-size'), [`var(${token})`])
    assert.equal(tokens.get(token), was)
  })
}

test('luật bị bỏ qua khi áp token cỡ chữ vẫn viết px cũ và đúng là lệch mọi token (danh sách không thừa, không thiếu)', () => {
  const pxTokens = new Set([...tokens].filter(([name]) => name.startsWith('--av-fs-')).map(([, value]) => value))

  for (const [selector, size, reason] of FONT_SIZE_SKIPPED) {
    assert.deepEqual(declarationValues(readStyle(), selector, 'font-size'), [size], `${selector} phải còn ${size}`)
    assert.ok(reason.length > 5, 'mỗi mục bỏ qua phải có lý do')
  }

  // 20px, 21px không có token; 11px không có token (Label là 12px): đều lệch nên bỏ qua đúng
  assert.deepEqual(FONT_SIZE_SKIPPED.map(([, size]) => size).filter((size) => pxTokens.has(size)), [])
})

test(':root không khai báo trùng token --av-*', () => {
  assert.deepEqual(duplicates.filter((name) => name.startsWith('--av-')), [])
})
