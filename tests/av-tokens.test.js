import test from 'node:test'
import assert from 'node:assert/strict'
import { readStyle, rootTokens } from './helpers/css-tokens.js'

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
  '--av-space-1': '4px',
  '--av-space-2': '8px',
  '--av-space-3': '12px',
  '--av-space-4': '16px',
  '--av-space-5': '24px',
  '--av-space-6': '32px',
  '--av-space-7': '48px',
  '--av-space-8': '64px',
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

test(':root không khai báo trùng token --av-*', () => {
  assert.deepEqual(duplicates.filter((name) => name.startsWith('--av-')), [])
})
