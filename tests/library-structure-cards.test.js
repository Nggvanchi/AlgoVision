import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { withFullApp } from './helpers/app-dom.js'

// Redesign Phase 4, giai đoạn c: thẻ Cấu trúc dữ liệu dùng cùng khung với thẻ thuật toán nhưng KHÔNG có pill độ khó,
// KHÔNG có hàng Thời gian/Bộ nhớ.
// Các class/thuộc tính cũ (structure-card-title ... nguồn nhãn của sidebar và breadcrumb) phải còn nguyên.
const textOf = (element) => element.textContent.replace(/\s+/g, ' ').trim()
const run = (callback) => withFullApp(callback)

const TARGETS = ['array', 'stack', 'queue', 'linked-list', 'bst', 'hash-table', 'graph']
const card = (document, target) => document.querySelector(`#structure-library button.structure-card[data-structure-target="${target}"]`)

const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8')

test('7 thẻ cấu trúc vẫn đúng thứ tự, vẫn là button.structure-card và giữ bốn class con cũ', async () => {
  await run(({ document }) => {
    const cards = [...document.querySelectorAll('#structure-library .structure-grid > button.structure-card')]

    assert.deepEqual(cards.map((item) => item.dataset.structureTarget), TARGETS)

    for (const item of cards) {
      for (const name of ['icon', 'title', 'description', 'link']) {
        assert.equal(item.querySelectorAll(`.structure-card-${name}`).length, 1, `${item.dataset.structureTarget}: .structure-card-${name}`)
      }
      assert.ok(textOf(item.querySelector('.structure-card-title')).length > 0)
    }
  })
})

test('thẻ cấu trúc không có pill độ khó và không có hàng Thời gian/Bộ nhớ', async () => {
  await run(({ document }) => {
    for (const target of TARGETS) {
      const item = card(document, target)

      assert.ok(item.querySelector('.difficulty') === null, `${target}: không pill độ khó`)
      assert.ok(item.querySelector('.card-footer') === null, `${target}: không .card-footer`)
      assert.ok(item.querySelector('.card-metric') === null, `${target}: không .card-metric`)
      assert.doesNotMatch(textOf(item), /Thời gian|Bộ nhớ/, `${target}: không nhắc Thời gian/Bộ nhớ`)
    }
  })
})

test('mỗi thẻ cấu trúc có .card-status chứa liên kết .structure-card-link (cũng là .card-link)', async () => {
  await run(({ document }) => {
    for (const target of TARGETS) {
      const status = card(document, target).querySelector('.card-status')

      assert.ok(status, `${target}: có .card-status`)
      assert.equal(textOf(status.querySelector('.structure-card-link')), 'Mở trình mô phỏng →', target)
      assert.ok(status.querySelector('.structure-card-link').classList.contains('card-link'), `${target}: dùng chung luật .card-link`)
    }
  })
})

// Luật CSS của thẻ cấu trúc gom chung với thẻ thuật toán (không sao chép): selector của thẻ cấu trúc nằm cùng danh sách với selector thẻ thuật toán.
function selectorListContaining(selector) {
  return [...css.matchAll(/(^|\})\s*([^{}@]+)\{/g)].map((match) => match[2]).find((list) => list.split(',').some((part) => part.trim() === selector))
}

for (const [structure, algorithm] of [
  ['.structure-grid', '.algorithm-grid'],
  ['.structure-card-title', '.algorithm-card h4'],
  ['.structure-card-description', '.algorithm-card > p'],
  ['.structure-card-icon', '.algorithm-symbol'],
]) {
  test(`CSS gom chung: ${structure} nằm cùng danh sách selector với ${algorithm}`, () => {
    const list = selectorListContaining(structure)

    assert.ok(list, `${structure} phải có luật riêng trong style.css`)
    assert.ok(list.split(',').some((part) => part.trim() === algorithm), `${structure} phải gom chung luật với ${algorithm}`)
  })
}

test('CSS gom chung: .structure-card-link không có luật riêng (dùng luật .card-link qua class)', () => {
  assert.equal(selectorListContaining('.structure-card-link'), undefined)
})

test('CSS gom chung: khung button.structure-card nằm cùng danh sách selector với .algorithm-card', () => {
  const list = selectorListContaining('button.structure-card')

  assert.ok(list, 'button.structure-card phải có luật khung trong style.css')
  assert.ok(list.split(',').some((part) => part.trim() === '.algorithm-card'), 'khung thẻ cấu trúc phải gom chung với .algorithm-card')
})

test('CSS: khoảng cách trên của .card-status chỉ áp khi đứng sau .card-footer (thẻ cấu trúc không có footer nên không bị thừa khoảng)', () => {
  assert.ok(selectorListContaining('.card-footer + .card-status'), 'phải có luật .card-footer + .card-status')
  assert.equal(selectorListContaining('.card-status'), '.card-metric,\n.card-status ', 'luật .card-status chung chỉ là phần căn hàng, không mang margin-top')
})

test('CSS: lưới cấu trúc về 1 cột ở <= 700px (cùng điểm gãy với lưới thuật toán)', () => {
  assert.match(css, /@media \(max-width: 700px\) \{\s*\.structure-grid \{\s*grid-template-columns: 1fr;/)
})
