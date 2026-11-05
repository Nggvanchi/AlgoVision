import test from 'node:test'
import assert from 'node:assert/strict'

import { SCREENS, isShown, withFullApp } from './helpers/app-dom.js'

// Thứ bậc heading (người dùng trình đọc màn hình duyệt theo heading): h1 là tên ứng dụng, mỗi màn hình có đúng một h2
// (tiêu đề trang), và cấp không nhảy quá một bậc khi đi xuống. Chỉ tính heading đang hiển thị (không nằm trong [hidden]).
function visibleHeadings(document) {
  return [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .filter(isShown)
    .map((heading) => ({ level: Number(heading.tagName[1]), text: heading.textContent.replace(/\s+/g, ' ').trim() }))
}

const outline = (headings) => headings.map((heading) => `h${heading.level} ${heading.text.slice(0, 30)}`).join(' | ')

function levelJumps(headings) {
  const jumps = []

  headings.forEach((heading, index) => {
    const previous = index === 0 ? 0 : headings[index - 1].level

    if (heading.level - previous > 1) {
      jumps.push(`h${previous || '(đầu)'} → h${heading.level} "${heading.text}"`)
    }
  })

  return jumps
}

// Trả danh sách lỗi của một màn hình (rỗng nếu đúng) để một lần chạy thấy hết mọi màn hình sai, không dừng ở màn hình đầu.
function screenProblems(document, name) {
  const headings = visibleHeadings(document)
  const problems = []

  if (headings.length === 0) {
    return [`${name}: không có heading nào`]
  }

  if (headings[0].level !== 1) {
    problems.push(`${name}: heading đầu tiên phải là h1`)
  }

  const h1Count = headings.filter((heading) => heading.level === 1).length
  const h2Count = headings.filter((heading) => heading.level === 2).length

  if (h1Count !== 1) problems.push(`${name}: cần đúng một h1, đang có ${h1Count}`)
  if (h2Count !== 1) problems.push(`${name}: cần đúng một h2 (tiêu đề trang), đang có ${h2Count}`)

  for (const jump of levelJumps(headings)) {
    problems.push(`${name}: nhảy cấp ${jump}`)
  }

  if (problems.length > 0) {
    problems.push(`    thứ bậc ${name}: ${outline(headings)}`)
  }

  return problems
}

test('mọi màn hình có h1 đầu tiên, đúng một h2 và không nhảy cấp heading', async () => {
  await withFullApp(({ document }) => {
    const problems = []

    for (const screen of SCREENS) {
      screen.open(document)
      problems.push(...screenProblems(document, screen.name))
    }

    assert.deepEqual(problems, [])
  })
})

test('thứ bậc heading vẫn đúng khi chuyển màn hình qua lại (không còn heading của màn hình trước)', async () => {
  await withFullApp(({ document }) => {
    const order = [...SCREENS, ...[...SCREENS].reverse(), ...SCREENS.filter((_, index) => index % 2 === 0)]

    const problems = []

    for (const screen of order) {
      screen.open(document)
      problems.push(...screenProblems(document, `${screen.name} (sau khi chuyển qua lại)`))
    }

    assert.deepEqual(problems, [])
  })
})

test('hàm levelJumps bắt đúng các kiểu nhảy cấp (test âm cho chính bộ kiểm tra)', () => {
  const make = (...levels) => levels.map((level) => ({ level, text: `t${level}` }))

  assert.deepEqual(levelJumps(make(1, 2, 3, 4, 4, 3, 4)), [])
  assert.equal(levelJumps(make(1, 2, 4)).length, 1)
  assert.equal(levelJumps(make(2, 3)).length, 1, 'bắt đầu từ h2 là nhảy từ cấp 0')
  assert.equal(levelJumps(make(1, 2, 2, 4, 4, 6)).length, 2)
})
