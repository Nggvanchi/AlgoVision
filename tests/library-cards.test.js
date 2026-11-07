import test from 'node:test'
import assert from 'node:assert/strict'

import { Window } from 'happy-dom'

import { template, withFullApp } from './helpers/app-dom.js'
import { memoryStorage } from './helpers/memory-storage.js'

// Redesign Phase 4 (Thư viện), thẻ thuật toán Sắp xếp và Tìm kiếm: pill độ khó (nhãn cũ), tên (h4), mô tả, hàng "Thời gian (xấu nhất)"
// và "Bộ nhớ", đoạn "Trực quan hóa →". Hai hàng độ phức tạp đặt tĩnh trong app.html nên phải khớp
// nguồn thật: bảng Learning Panel (do sorting.js / searching.js điền khi chọn thuật toán), được đối chiếu ở các test dưới đây.
const textOf = (element) => element.textContent.replace(/\s+/g, ' ').trim()
const run = (callback) => withFullApp(callback, { storage: memoryStorage() })
const goTo = (document, page) => document.querySelector(`.nav-item[data-page="${page}"]`).click()

const SORTING = [
  { name: 'bubble', title: 'Bubble Sort', difficulty: 'CƠ BẢN' },
  { name: 'selection', title: 'Selection Sort', difficulty: 'CƠ BẢN' },
  { name: 'insertion', title: 'Insertion Sort', difficulty: 'TRUNG BÌNH' },
]
const SEARCHING = [
  { name: 'linear', title: 'Linear Search', difficulty: 'CƠ BẢN' },
  { name: 'binary', title: 'Binary Search', difficulty: 'TRUNG BÌNH' },
]

const sortingCard = (document, name) => document.querySelector(`.algorithm-card[data-algorithm="${name}"]`)
const searchCard = (document, name) => document.querySelector(`[data-search-algorithm="${name}"]`)

function metrics(card) {
  return [...card.querySelectorAll('.card-footer .card-metric')].map((row) => ({
    label: textOf(row.querySelector('span')),
    value: textOf(row.querySelector('code')),
  }))
}

const CARDS = [
  ...SORTING.map((item) => ({ ...item, kind: 'sắp xếp', find: sortingCard })),
  ...SEARCHING.map((item) => ({ ...item, kind: 'tìm kiếm', find: searchCard })),
]

for (const item of CARDS) {
  test(`thẻ ${item.kind} ${item.title}: nút <button>, pill độ khó giữ nhãn cũ, h4 là tên, có mô tả và biểu tượng`, async () => {
    await run(({ document }) => {
      const card = item.find(document, item.name)

      assert.ok(card !== null, `phải có thẻ ${item.name}`)
      assert.equal(card.tagName, 'BUTTON')
      assert.equal(card.getAttribute('type'), 'button')
      assert.equal(textOf(card.querySelector('h4')), item.title, 'h4 là nguồn nhãn cho breadcrumb, tiêu đề và Tiến độ')
      assert.ok(card.querySelector('.card-top .algorithm-symbol') !== null, 'biểu tượng thuật toán nằm trong .card-top')
      assert.equal(textOf(card.querySelector('.card-top .difficulty')), item.difficulty, 'nhãn độ khó giữ nguyên')
      assert.ok(textOf(card.querySelector(':scope > p')).length > 20, 'có đoạn mô tả')
    })
  })

  test(`thẻ ${item.kind} ${item.title}: hai hàng "Thời gian (xấu nhất)" và "Bộ nhớ" theo đúng thứ tự, thay cho "Độ phức tạp trung bình"`, async () => {
    await run(({ document }) => {
      const card = item.find(document, item.name)
      const rows = metrics(card)

      assert.deepEqual(rows.map((row) => row.label), ['Thời gian (xấu nhất)', 'Bộ nhớ'])
      assert.ok(rows.every((row) => /^O\(.+\)$/.test(row.value)), `giá trị phải có dạng O(...): ${JSON.stringify(rows)}`)
      assert.ok(!textOf(card).includes('Độ phức tạp trung bình'), 'nhãn cũ đã được thay')
    })
  })

  test(`thẻ ${item.kind} ${item.title}: có đoạn "Trực quan hóa →"`, async () => {
    await run(({ document }) => {
      const card = item.find(document, item.name)

      assert.equal(textOf(card.querySelector('.card-link')), 'Trực quan hóa →')
    })
  })
}

test('hai hàng độ phức tạp của thẻ Sắp xếp khớp bảng Learning Panel (xấu nhất = thẻ thứ ba, bộ nhớ = thẻ thứ tư) của cùng thuật toán', async () => {
  await run(({ document }) => {
    for (const { name } of SORTING) {
      const expected = metrics(sortingCard(document, name)).map((row) => row.value)

      goTo(document, 'sorting')
      sortingCard(document, name).click()

      const cells = [...document.querySelectorAll('#sorting-section .complexity-card strong')].map(textOf)

      assert.deepEqual([cells[2], cells[3]], expected, `${name}: thẻ thư viện phải khớp bảng độ phức tạp (xấu nhất, bộ nhớ)`)
    }
  })
})

test('hai hàng độ phức tạp của thẻ Tìm kiếm khớp bảng Learning Panel của cùng thuật toán', async () => {
  await run(({ document }) => {
    for (const { name } of SEARCHING) {
      const expected = metrics(searchCard(document, name)).map((row) => row.value)

      goTo(document, 'searching')
      searchCard(document, name).click()

      const actual = [textOf(document.querySelector('#search-complexity-worst')), textOf(document.querySelector('#search-complexity-space'))]

      assert.deepEqual(actual, expected, `${name}: thẻ thư viện phải khớp bảng độ phức tạp (xấu nhất, bộ nhớ)`)
    }
  })
})

test('xấu nhất của Binary Search khác Linear Search (guard chống sao chép nhầm giá trị giữa các thẻ)', async () => {
  await run(({ document }) => {
    const linear = metrics(searchCard(document, 'linear'))[0].value
    const binary = metrics(searchCard(document, 'binary'))[0].value

    assert.ok(linear !== binary, `Linear (${linear}) và Binary (${binary}) có xấu nhất khác nhau`)
  })
})

test('mỗi thư viện có đúng một thẻ .selected như cũ: Bubble Sort ở Sắp xếp, Linear Search ở Tìm kiếm', async () => {
  await run(({ document }) => {
    assert.deepEqual(
      [...document.querySelectorAll('#sorting-algorithm-library .algorithm-card.selected')].map((card) => card.dataset.algorithm),
      ['bubble'],
    )
    assert.deepEqual(
      [...document.querySelectorAll('#search-algorithm-library .algorithm-card.selected')].map((card) => card.dataset.searchAlgorithm),
      ['linear'],
    )
  })
})

test('mỗi thư viện giữ đúng số thẻ: 3 thẻ Sắp xếp, 2 thẻ Tìm kiếm', async () => {
  await run(({ document }) => {
    assert.equal(document.querySelectorAll('#search-algorithm-library .algorithm-card').length, 2)
    assert.equal(document.querySelectorAll('#sorting-algorithm-library .algorithm-card').length, 3)
  })
})

test('template tĩnh (chưa chạy JS): Bubble Sort là thẻ .selected, nên trang vẫn đúng trước khi JS khởi tạo', () => {
  const window = new Window()

  try {
    window.document.body.innerHTML = template

    assert.ok(window.document.querySelector('.algorithm-card[data-algorithm="bubble"]').classList.contains('selected'), 'Bubble Sort có .selected trong template')
  } finally {
    window.happyDOM.close()
  }
})
