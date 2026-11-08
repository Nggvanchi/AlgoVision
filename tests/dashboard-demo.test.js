import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { generateBubbleSortSteps } from '../src/algorithms/bubbleSort.js'
import { readStyle, parseStylesheet } from './helpers/css-tokens.js'

// R4: bảng minh họa Bubble Sort ở hero Dashboard là SVG tĩnh trong template. Mọi số trên đó phải KHỚP generateBubbleSortSteps
// (quy tắc sản phẩm: không số giả) và bảng phải gắn nhãn "Minh họa".

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')
const INPUT = [5, 3, 8, 1, 6, 2]
const STEP_NUMBER = 3 // bước hiển thị (đếm từ 1) = chỉ số 2: bước đổi chỗ đầu tiên
const UNIT = 11 // đơn vị chiều cao cột trong SVG: chiều cao = giá trị * 11, đáy ở y = 100
const BASELINE = 100

const steps = generateBubbleSortSteps(INPUT)
const step = steps[STEP_NUMBER - 1]

function withDemo(run) {
  const window = new Window()
  const { document } = window

  try {
    document.body.innerHTML = template
    run(document.querySelector('.dashboard-demo'))
  } finally {
    window.happyDOM.close()
  }
}

test('generator cho bước 3 của [5,3,8,1,6,2] là lần đổi chỗ đầu tiên (nền của số liệu trong bảng minh họa)', () => {
  assert.deepEqual(step.array, [3, 5, 8, 1, 6, 2])
  assert.deepEqual(step.swapped, [0, 1])
})

test('bảng minh họa có trong Dashboard, nằm trong hero', () => {
  withDemo((demo) => {
    assert.ok(demo, 'thiếu figure.dashboard-demo')
    assert.ok(demo.closest('.dashboard-hero') !== null, 'bảng minh họa phải nằm trong .dashboard-hero')
  })
})

test('chú thích bảng ghi "Bubble Sort · Bước 3/<tổng số bước của generator>" và nhãn "Minh họa"', () => {
  withDemo((demo) => {
    assert.match(demo.querySelector('figcaption span').textContent, new RegExp(`^Bubble Sort · Bước ${STEP_NUMBER}/${steps.length}$`))
    assert.equal(demo.querySelector('.dashboard-demo-badge')?.textContent.trim(), 'Minh họa')
  })
})

test('cột: đúng số cột, chiều cao = giá trị * 11, đáy chung y=100, giá trị khớp step.array', () => {
  withDemo((demo) => {
    const bars = [...demo.querySelectorAll('rect.demo-bar')]

    assert.equal(bars.length, step.array.length)

    bars.forEach((bar, index) => {
      const height = Number(bar.getAttribute('height'))

      assert.equal(height, step.array[index] * UNIT, `cột ${index} phải cao ${step.array[index] * UNIT}`)
      assert.equal(Number(bar.getAttribute('y')) + height, BASELINE, `cột ${index} phải có đáy ở y=${BASELINE}`)
    })
  })
})

test('cột đổi chỗ (is-swapped) đúng bằng step.swapped, và có ký hiệu ▣ dưới đúng các cột đó', () => {
  withDemo((demo) => {
    const bars = [...demo.querySelectorAll('rect.demo-bar')]
    const swapped = bars.flatMap((bar, index) => (bar.classList.contains('is-swapped') ? [index] : []))

    assert.deepEqual(swapped, step.swapped)

    const glyphX = [...demo.querySelectorAll('text')].filter((text) => text.textContent === '▣').map((text) => Number(text.getAttribute('x')))
    const swappedCenters = swapped.map((index) => Number(bars[index].getAttribute('x')) + Number(bars[index].getAttribute('width')) / 2)

    assert.deepEqual(glyphX, swappedCenters)
  })
})

test('số ghi trên đầu cột khớp step.array, theo thứ tự', () => {
  withDemo((demo) => {
    const values = [...demo.querySelectorAll('text')].map((text) => text.textContent).filter((text) => /^\d+$/.test(text)).map(Number)

    assert.deepEqual(values, step.array)
  })
})

test('SVG có role="img" và aria-label nêu đúng bước, mảng và các cột vừa đổi chỗ', () => {
  withDemo((demo) => {
    const svg = demo.querySelector('svg')
    const label = svg.getAttribute('aria-label')

    assert.equal(svg.getAttribute('role'), 'img')
    assert.ok(label.includes(`bước ${STEP_NUMBER} trên ${steps.length}`), label)
    assert.ok(label.includes(step.array.join(', ')), label)
    assert.ok(label.startsWith('Minh họa'), label)
  })
})

test('chú giải có đủ ba ký hiệu ■ Đang so sánh, ▣ Đã đổi chỗ, ◆ Đã sắp xếp', () => {
  withDemo((demo) => {
    const legend = demo.querySelector('.dashboard-demo-legend').textContent.replace(/\s+/g, ' ')

    for (const item of ['■ Đang so sánh', '▣ Đã đổi chỗ', '◆ Đã sắp xếp']) assert.ok(legend.includes(item), item)
  })
})

// CSS của hero (happy-dom không tính CSS nên đọc thẳng src/style.css).
const sheet = parseStylesheet(readStyle())

function lastValue(selector, property, media = null) {
  const values = sheet.rules.filter((rule) => rule.media === media && rule.selectors.includes(selector))
    .flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === property).map((declaration) => declaration.value))

  return values.at(-1)
}

test('nút viền "Xem thư viện": viền --border-control, nền trong suốt, cao tối thiểu 44px', () => {
  assert.equal(lastValue('.dashboard-outline-button', 'border-color'), 'var(--border-control)')
  assert.equal(lastValue('.dashboard-outline-button', 'background'), 'transparent')
  assert.equal(lastValue('.dashboard-outline-button', 'min-height'), '44px')
})

test('hero: 2 cột trên desktop, 1 cột <= 900px; bảng minh họa ẩn <= 700px (mobile không có minh họa)', () => {
  assert.match(lastValue('.dashboard-hero', 'grid-template-columns'), /^1\.15fr 1fr$/)
  assert.match(lastValue('.dashboard-hero', 'grid-template-columns', '@media (max-width: 900px)'), /^minmax\(0, 1fr\)$/)
  assert.equal(lastValue('.dashboard-demo', 'display', '@media (max-width: 700px)'), 'none')
})
