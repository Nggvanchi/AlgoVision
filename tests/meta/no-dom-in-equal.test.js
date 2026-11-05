// Canh gác quy tắc trong .claude/rules/tests.md: không truyền kết quả truy vấn DOM vào
// assert.equal/strictEqual/notEqual/notStrictEqual/deepEqual/deepStrictEqual.
// Khi test đỏ, Node in cả phần tử happy-dom nên tràn heap hoặc treo và mất thông điệp lỗi.
// Dùng assert.ok(<biểu thức> === null, '<mô tả>') thay thế.
//
// Giới hạn: chỉ bắt khi tham số KẾT THÚC bằng lời gọi truy vấn (ví dụ `ui.$('#x')`).
// Biến đã gán phần tử (`const cell = ...; assert.equal(cell, null)`) không bắt được bằng quét tĩnh.
// Ngoại lệ có chủ ý: thêm chú thích `allow-dom-equal` trên cùng dòng với lời gọi assert.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Cập nhật danh sách khi thêm helper trả về phần tử DOM.
// Hạn chế đã biết: không có `row`, vì row(...) ở graph-bfs-view.test.js và graph-dfs-view.test.js trả về mảng
// (thêm vào thì báo nhầm 6 chỗ); row(...) trả về phần tử ở hash-table-controller và graph-controller nên không được quét.
const DOM_QUERY_NAMES = ['querySelector', 'getElementById', 'closest', '$', 'nodeByValue', 'entryByKey', 'vertexByLabel']
const EQUALITY_ASSERTS = ['equal', 'strictEqual', 'notEqual', 'notStrictEqual', 'deepEqual', 'deepStrictEqual']

const testsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const thisFile = fileURLToPath(import.meta.url)

// Tách các tham số cấp cao nhất của một lời gọi, bắt đầu ngay sau dấu '('.
function splitTopLevelArgs(source, start) {
  const args = []
  let depth = 0
  let quote = null
  let current = ''
  for (let i = start; i < source.length; i++) {
    const char = source[i]
    if (quote) {
      current += char
      if (char === '\\') {
        current += source[++i] ?? ''
      } else if (char === quote) {
        quote = null
      }
      continue
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char
      current += char
    } else if ('([{'.includes(char)) {
      depth++
      current += char
    } else if (')]}'.includes(char)) {
      if (depth === 0) {
        args.push(current)
        return args
      }
      depth--
      current += char
    } else if (char === ',' && depth === 0) {
      args.push(current)
      current = ''
    } else {
      current += char
    }
  }
  return args
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const endsWithDomQuery = new RegExp(
  `(?:^|[.\\s])(?:${DOM_QUERY_NAMES.map(escapeRegExp).join('|')})\\s*\\((?:[^()]|\\([^()]*\\))*\\)\\s*$`,
)
const assertCall = new RegExp(`\\bassert\\.(${EQUALITY_ASSERTS.join('|')})\\s*\\(`, 'g')

export function findDomEqualityAsserts(source) {
  const hits = []
  for (const match of source.matchAll(assertCall)) {
    const lineStart = source.lastIndexOf('\n', match.index) + 1
    const lineEnd = source.indexOf('\n', match.index)
    const line = source.slice(lineStart, lineEnd === -1 ? undefined : lineEnd)
    if (line.includes('allow-dom-equal')) continue
    const [first = '', second = ''] = splitTopLevelArgs(source, match.index + match[0].length)
    if (endsWithDomQuery.test(first.trim()) || endsWithDomQuery.test(second.trim())) {
      hits.push({ line: source.slice(0, match.index).split('\n').length, call: match[1] })
    }
  }
  return hits
}

test('bộ quét nhận ra dạng cấm và bỏ qua dạng an toàn', () => {
  const forbidden = [
    "assert.equal(document.querySelector('#a .b'), null)",
    "assert.equal(\n  document.querySelector('#a'),\n  null,\n)",
    "assert.equal(ui.$('#graph-svg .edge[marker-end]'), null, 'thông điệp')",
    'assert.strictEqual(ui.nodeByValue(45), null)',
    'assert.notEqual(null, ui.entryByKey(29))',
    "assert.notEqual(ui.vertexByLabel('A'), null)",
  ]
  const allowed = [
    "assert.equal(document.querySelector('#a').textContent, '1')",
    "assert.equal(ui.$('#next').disabled, true)",
    "assert.ok(document.querySelector('#a') === null, 'không có ô')",
    "assert.equal(foundCell === null, true)",
    "assert.equal(ui.text('#count'), '7')",
    "assert.equal(document.querySelector('#a'), null) // allow-dom-equal: lý do",
  ]
  for (const snippet of forbidden) assert.equal(findDomEqualityAsserts(snippet).length, 1, `phải bắt: ${snippet}`)
  for (const snippet of allowed) assert.equal(findDomEqualityAsserts(snippet).length, 0, `không được bắt: ${snippet}`)
})

test('không file test nào truyền truy vấn DOM vào assert.equal và họ hàng', () => {
  const files = fs
    .readdirSync(testsDir, { recursive: true })
    .map((entry) => path.join(testsDir, String(entry)))
    .filter((file) => /\.test\.m?js$/.test(file) && file !== thisFile)
  const violations = []
  for (const file of files) {
    for (const hit of findDomEqualityAsserts(fs.readFileSync(file, 'utf8'))) {
      violations.push(`${path.relative(testsDir, file)}:${hit.line} assert.${hit.call}`)
    }
  }
  assert.ok(
    violations.length === 0,
    `Dùng assert.ok(<biểu thức> === null, '<mô tả>') thay cho:\n${violations.join('\n')}`,
  )
})
