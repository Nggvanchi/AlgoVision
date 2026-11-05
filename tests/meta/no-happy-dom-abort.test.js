// Canh gác: cửa sổ happy-dom phải được dọn bằng window.happyDOM.close(), không bằng abort().
// abort() chỉ hủy tác vụ đang chờ, không giải phóng DOM: mỗi cửa sổ nạp app.html bị giữ lại khoảng 11 MB,
// nên RSS tăng theo số test và file controller lớn tràn heap ở 512 MB dù xanh.
// Quét mọi file .js trong tests/ (kể cả tests/helpers/), bỏ qua dòng chú thích.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const testsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const thisFile = fileURLToPath(import.meta.url)
const abortCall = /\bhappyDOM\s*\??\.\s*abort\s*\(/

export function findHappyDomAborts(source) {
  return source
    .split('\n')
    .map((line, index) => ({ line: index + 1, text: line.trim() }))
    .filter(({ text }) => !text.startsWith('//') && !text.startsWith('*') && abortCall.test(text))
    .map(({ line }) => line)
}

test('bộ quét nhận ra lời gọi abort() và bỏ qua close(), chú thích', () => {
  const forbidden = [
    'window.happyDOM.abort()',
    '  await window.happyDOM.abort()',
    'win.happyDOM?.abort()',
    'window.happyDOM .abort ()',
  ]
  const allowed = [
    'window.happyDOM.close()',
    '// abort() không giải phóng DOM, dùng window.happyDOM.close()',
    '// window.happyDOM.abort() là cách cũ',
    ' * window.happyDOM.abort() trong khối chú thích',
    'controller.abort()',
  ]
  for (const snippet of forbidden) assert.equal(findHappyDomAborts(snippet).length, 1, `phải bắt: ${snippet}`)
  for (const snippet of allowed) assert.equal(findHappyDomAborts(snippet).length, 0, `không được bắt: ${snippet}`)
  assert.deepEqual(findHappyDomAborts('a()\nwindow.happyDOM.abort()\nb()'), [2], 'số dòng phải đếm từ 1')
})

test('không file nào trong tests/ dọn cửa sổ happy-dom bằng abort()', () => {
  const files = fs
    .readdirSync(testsDir, { recursive: true })
    .map((entry) => path.join(testsDir, String(entry)))
    .filter((file) => /\.m?js$/.test(file) && file !== thisFile)
  const violations = []
  for (const file of files) {
    for (const line of findHappyDomAborts(fs.readFileSync(file, 'utf8'))) {
      violations.push(`${path.relative(testsDir, file).split(path.sep).join('/')}:${line}`)
    }
  }
  assert.ok(
    violations.length === 0,
    `Dùng window.happyDOM.close() thay cho abort() (abort() không giải phóng DOM):\n${violations.join('\n')}`,
  )
})
