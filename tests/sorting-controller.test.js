
import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { createFakeScheduler } from './helpers/fake-scheduler.js'
import { BASE_DELAY } from '../src/step-tools.js'
import { generateBubbleSortSteps } from '../src/algorithms/bubbleSort.js'
import { generateSelectionSortSteps } from '../src/algorithms/selectionSort.js'
import { generateInsertionSortSteps } from '../src/algorithms/insertionSort.js'
import { getBarStateClasses } from '../src/sorting-bar-state.js'

const templatePath = new URL(
  '../public/templates/app.html',
  import.meta.url,
)

const template = await readFile(templatePath, 'utf8')

const sortingAlgorithms = [
  { key: 'bubble', name: 'Bubble Sort' },
  { key: 'selection', name: 'Selection Sort' },
  { key: 'insertion', name: 'Insertion Sort' },
]

async function withSortingDom(run, options = {}) {
  const window = new Window()
  const { document } = window

  document.body.innerHTML = template

  const previousDocument = globalThis.document
  const previousWindow = globalThis.window

  globalThis.document = document
  globalThis.window = window

  try {
    const { initSorting } = await import('../src/sorting.js')

    initSorting(options)

    await run({ document, window })
  } finally {
    // Dừng mọi timer còn sống để test lỗi không làm treo tiến trình.
    document.querySelector('#reset-sort')?.click()
    window.happyDOM.close()

    if (previousDocument === undefined) {
      delete globalThis.document
    } else {
      globalThis.document = previousDocument
    }

    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
}

function clickSortingCard(document, algorithm) {
  document
    .querySelector(`.algorithm-card[data-algorithm="${algorithm}"]`)
    .click()
}

function getSelectedSortingCards(document) {
  return [
    ...document.querySelectorAll('.algorithm-card[data-algorithm].selected'),
  ].map((card) => card.dataset.algorithm)
}

test('khởi tạo controller với DOM hợp lệ', async () => {
  await withSortingDom(({ document }) => {
    assert.equal(
      document.querySelector('.algorithm-card.selected')
        ?.dataset.algorithm,
      'bubble',
    )

    assert.equal(
      document.querySelector('#visualizer-title').textContent,
      'Bubble Sort',
    )
  })
})

test('mỗi lần chọn thuật toán sắp xếp chỉ tạo mảng mới đúng một lần', async (t) => {
  await withSortingDom(({ document }) => {
    const arraySize = Number(document.querySelector('#array-size').value)
    const random = t.mock.method(Math, 'random')

    // Click lặp lại nhiều lần: nếu listener bị nhân bản, số lần gọi sẽ tăng dần.
    const clickOrder = ['selection', 'insertion', 'bubble', 'selection', 'selection']

    clickOrder.forEach((algorithm, clickIndex) => {
      random.mock.resetCalls()

      clickSortingCard(document, algorithm)

      assert.equal(
        random.mock.callCount(),
        arraySize,
        `Lần click thứ ${clickIndex + 1} (${algorithm}) phải sinh đúng ${arraySize} phần tử`,
      )
    })
  })
})

test('thẻ thuật toán sắp xếp được chọn khớp với tiêu đề mô phỏng', async () => {
  await withSortingDom(({ document }) => {
    const visualizerTitle = document.querySelector('#visualizer-title')

    for (const { key, name } of [...sortingAlgorithms].reverse()) {
      clickSortingCard(document, key)

      assert.deepEqual(getSelectedSortingCards(document), [key])
      assert.equal(visualizerTitle.textContent, name)
    }
  })
})

function getSortingControls(document) {
  return {
    run: document.querySelector('#run-sort'),
    pause: document.querySelector('#pause-sort'),
    next: document.querySelector('#step-sort'),
    previous: document.querySelector('#previous-step'),
    reset: document.querySelector('#reset-sort'),
    speed: document.querySelector('input[name="sort-speed"][value="4"]'),
    stepCount: document.querySelector('#step-count'),
  }
}

function getTotalSteps(stepCount) {
  return Number(stepCount.textContent.split('/')[1])
}

test('nút Run hiển thị tên thuật toán đang chọn khi chưa chạy', async () => {
  await withSortingDom(({ document }) => {
    const { run } = getSortingControls(document)

    assert.equal(run.textContent, 'Chạy Bubble Sort')

    clickSortingCard(document, 'insertion')
    assert.equal(run.textContent, 'Chạy Insertion Sort')
  })
})

test('Bước tiếp theo từ đầu chuyển sang tạm dừng: Run thành Tiếp tục', async () => {
  await withSortingDom(({ document }) => {
    const controls = getSortingControls(document)

    controls.next.click()

    assert.equal(controls.stepCount.textContent.startsWith('2 / '), true)
    assert.equal(controls.run.textContent, 'Tiếp tục')
    assert.equal(controls.run.disabled, false)
    assert.equal(controls.previous.disabled, false)
    assert.equal(controls.pause.disabled, true)
  })
})

test('Run tự chạy theo scheduler và khóa đúng các nút khi đang chạy', async () => {
  const scheduler = createFakeScheduler()

  await withSortingDom(({ document }) => {
    const controls = getSortingControls(document)

    controls.run.click()

    assert.equal(controls.run.disabled, true)
    assert.equal(controls.next.disabled, true)
    assert.equal(controls.previous.disabled, true)
    assert.equal(controls.pause.disabled, false)
    assert.equal(controls.reset.disabled, false)

    scheduler.advance(650)
    assert.equal(controls.stepCount.textContent.startsWith('2 / '), true)

    controls.pause.click()
    assert.equal(controls.run.textContent, 'Tiếp tục')
    assert.equal(scheduler.pendingCount, 0)
  }, { scheduler })
})

test('chạy hết các bước thì Run thành Chạy lại và chạy lại từ đầu', async () => {
  const scheduler = createFakeScheduler()

  await withSortingDom(({ document }) => {
    const controls = getSortingControls(document)
    const totalSteps = getTotalSteps(controls.stepCount)

    controls.run.click()
    scheduler.advance(650 * totalSteps)

    assert.equal(controls.stepCount.textContent, `${totalSteps} / ${totalSteps}`)
    assert.equal(controls.run.textContent, 'Chạy lại')
    assert.equal(controls.run.disabled, false)
    assert.equal(controls.next.disabled, true)
    assert.equal(controls.previous.disabled, false)
    assert.equal(scheduler.pendingCount, 0)

    controls.run.click()
    assert.equal(controls.stepCount.textContent, `1 / ${totalSteps}`)

    scheduler.advance(650)
    assert.equal(controls.stepCount.textContent, `2 / ${totalSteps}`)
  }, { scheduler })
})

test('đổi tốc độ khi đang chạy không tạo lại timer, áp dụng từ bước sau', async () => {
  const scheduler = createFakeScheduler()

  await withSortingDom(({ document }) => {
    const controls = getSortingControls(document)

    controls.run.click()

    controls.speed.checked = true
    controls.speed.dispatchEvent(
      new document.defaultView.Event('change', { bubbles: true }),
    )

    scheduler.advance(650)
    scheduler.advance(650 / 4)

    assert.equal(controls.stepCount.textContent.startsWith('3 / '), true)
    assert.deepEqual(scheduler.scheduledDelays.slice(0, 3), [650, 650 / 4, 650 / 4])
    assert.equal(scheduler.cancelCount, 0)
  }, { scheduler })
})

test('Đặt lại khi đang chạy dừng timer và quay về bước đầu', async () => {
  const scheduler = createFakeScheduler()

  await withSortingDom(({ document }) => {
    const controls = getSortingControls(document)

    controls.run.click()
    scheduler.advance(650 * 3)
    controls.reset.click()

    assert.equal(controls.stepCount.textContent.startsWith('1 / '), true)
    assert.equal(controls.run.textContent, 'Chạy Bubble Sort')
    assert.equal(controls.previous.disabled, true)
    assert.equal(scheduler.pendingCount, 0)
  }, { scheduler })
})

test('ưu điểm Bubble Sort mô tả đúng cơ chế dừng sớm đã cài đặt', async () => {
  await withSortingDom(({ document }) => {
    clickSortingCard(document, 'bubble')

    const advantages = document.querySelector('#learning-advantages').textContent

    // Code có cờ hasSwapped nên không được viết như một điều kiện giả định.
    assert.doesNotMatch(advantages, /Nếu có cơ chế dừng sớm/)
    assert.match(advantages, /swapped/)
    assert.match(advantages, /O\(n\)/)
  })
})

test('mã giả trên Learning Panel lấy từ cùng nguồn với pseudocodeLine của generator', async () => {
  const { bubbleSortPseudocode } = await import('../src/algorithms/bubbleSort.js')
  const { selectionSortPseudocode } = await import('../src/algorithms/selectionSort.js')
  const { insertionSortPseudocode } = await import('../src/algorithms/insertionSort.js')
  const pseudocodeByAlgorithm = {
    bubble: bubbleSortPseudocode,
    selection: selectionSortPseudocode,
    insertion: insertionSortPseudocode,
  }

  await withSortingDom(({ document }) => {
    for (const { key } of sortingAlgorithms) {
      clickSortingCard(document, key)

      // Mỗi dòng mã giả là một phần tử riêng để tô được theo pseudocodeLine.
      assert.deepEqual(
        [...document.querySelectorAll('#learning-pseudocode .pseudocode-line')].map(
          (line) => line.textContent,
        ),
        pseudocodeByAlgorithm[key],
      )
    }
  })
})

function getActivePseudocodeLines(document) {
  return [...document.querySelectorAll('#learning-pseudocode .pseudocode-line.is-active')].map(
    (line) => ({ line: Number(line.dataset.line), ariaCurrent: line.getAttribute('aria-current') }),
  )
}

test('Sorting tô dòng mã giả theo bước khi bấm Next, Previous và Đặt lại', async (t) => {
  // Mọi giá trị bằng nhau: Bubble Sort chỉ so sánh rồi dừng sớm, các bước hoàn toàn xác định.
  t.mock.method(Math, 'random', () => 0.5)

  await withSortingDom(({ document }) => {
    clickSortingCard(document, 'bubble')

    const size = Number(document.querySelector('#array-size').value)
    const next = document.querySelector('#step-sort')

    assert.deepEqual(getActivePseudocodeLines(document), [], 'bước 0 không tô dòng nào')

    next.click()
    assert.deepEqual(getActivePseudocodeLines(document), [{ line: 4, ariaCurrent: 'step' }])

    for (let i = 1; i < size; i++) next.click()
    assert.deepEqual(getActivePseudocodeLines(document), [{ line: 8, ariaCurrent: 'step' }])

    document.querySelector('#previous-step').click()
    assert.deepEqual(getActivePseudocodeLines(document), [{ line: 4, ariaCurrent: 'step' }])

    document.querySelector('#reset-sort').click()
    assert.deepEqual(getActivePseudocodeLines(document), [])
  })
})

test('Sorting chạy tự động thì dòng được tô đi theo từng tick', async () => {
  const scheduler = createFakeScheduler()

  await withSortingDom(({ document }) => {
    clickSortingCard(document, 'insertion')
    document.querySelector('#run-sort').click()

    scheduler.advance(BASE_DELAY)

    // Bước 1 của Insertion Sort luôn là phép so sánh đầu tiên (dòng 4), bất kể dữ liệu.
    assert.deepEqual(getActivePseudocodeLines(document), [{ line: 4, ariaCurrent: 'step' }])
  }, { scheduler })
})

test('đổi thuật toán Sorting vẽ lại mã giả và bỏ tô dòng cũ', async () => {
  await withSortingDom(({ document }) => {
    clickSortingCard(document, 'bubble')
    document.querySelector('#step-sort').click()
    assert.equal(getActivePseudocodeLines(document).length, 1)

    clickSortingCard(document, 'selection')

    assert.equal(document.querySelectorAll('#learning-pseudocode .pseudocode-line').length, 7)
    assert.deepEqual(getActivePseudocodeLines(document), [])
  })
})

test('chọn thuật toán Sorting không ghi đè bảng Big-O của Searching', async () => {
  await withSortingDom(({ document }) => {
    const searchCells = () =>
      [...document.querySelectorAll('#search-complexity-panel .complexity-card strong')].map(
        (cell) => cell.textContent,
      )
    const before = searchCells()

    for (const { key } of sortingAlgorithms) {
      clickSortingCard(document, key)
    }

    assert.equal(before.length, 4)
    assert.deepEqual(searchCells(), before)
    assert.equal(document.querySelector('#search-complexity-title').textContent, 'LINEAR SEARCH')
  })
})

test('cột đang so sánh trong vùng đã sắp xếp vẫn hiển thị trạng thái so sánh (Insertion Sort)', async () => {
  await withSortingDom(({ document }) => {
    clickSortingCard(document, 'insertion')
    document.querySelector('#step-sort').click()

    // Bước 1: so sánh A[0] với key; A[0] nằm trong vùng đã sắp xếp [0].
    const bar = document.querySelector('.array-bar[data-index="0"]')

    assert.equal(bar.classList.contains('is-comparing'), true)
    // CSS khai báo is-sorted sau is-comparing: có cả hai class thì màu xanh che màu so sánh.
    assert.equal(bar.classList.contains('is-sorted'), false)
  })
})

// --- Nhãn "Đang chèn" của Insertion Sort (R8) ---
// Mảng cố định: mock Math.random theo hàng đợi giá trị rồi phát sự kiện change của ô chọn số phần tử.
function fixSortingArray(t, window, document, values) {
  const select = document.querySelector('#array-size')

  // Ô chọn số phần tử trong giao diện thật chỉ có 8–24. Thêm option 0 và 1 chỉ để khóa nhánh phòng thủ của
  // nhãn với mảng rỗng và mảng một phần tử: đó là trạng thái UI không có thật, không phải luồng người dùng.
  if (![...select.options].some((option) => Number(option.value) === values.length)) {
    const option = document.createElement('option')

    option.value = String(values.length)
    option.textContent = option.value
    select.appendChild(option)
  }

  select.value = String(values.length)

  const queue = [...values]

  // generateArray: floor(random * 91) + 10. Cộng 0,5 để tránh sai số dấu phẩy động.
  t.mock.method(Math, 'random', () => (queue.length > 0 ? (queue.shift() - 10 + 0.5) / 91 : 0.5))
  select.dispatchEvent(new window.Event('change'))
}

// 'hidden': không phải Insertion; 'idle': Insertion nhưng chưa có key (giữ chỗ để bố cục không nhảy); 'shown': đang hiện key.
function keyLabelState(document) {
  const label = document.querySelector('#insertion-key')

  assert.ok(label !== null, 'thiếu phần tử #insertion-key trong template')

  if (label.hidden) return { state: 'hidden', text: '' }
  if (label.classList.contains('is-idle')) return { state: 'idle', text: '' }

  return { state: 'shown', text: document.querySelector('#insertion-key-value').textContent }
}

function barValues(document) {
  return [...document.querySelectorAll('.array-bar .bar-value')].map((value) => value.textContent)
}

function clickStep(document, times = 1) {
  for (let count = 0; count < times; count++) {
    document.querySelector('#step-sort').click()
  }
}

test('Insertion Sort: nhãn "Đang chèn: key" hiện theo từng bước của [85, 47], ẩn ở bước đầu và bước cuối', async (t) => {
  await withSortingDom(({ document, window }) => {
    clickSortingCard(document, 'insertion')
    fixSortingArray(t, window, document, [85, 47])

    // Dò tay: bước 0 khởi tạo, 1 so sánh, 2 dời, 3 chèn, 4 hoàn thành.
    const expected = [
      { state: 'idle', text: '', bars: ['85', '47'] },
      { state: 'shown', text: 'Đang chèn: 47', bars: ['85', '47'] },
      { state: 'shown', text: 'Đang chèn: 47', bars: ['85', '85'] },
      { state: 'shown', text: 'Đang chèn: 47', bars: ['47', '85'] },
      { state: 'idle', text: '', bars: ['47', '85'] },
    ]

    expected.forEach((want, stepIndex) => {
      const got = keyLabelState(document)

      assert.deepEqual(
        { state: got.state, text: got.text, bars: barValues(document) },
        want,
        `bước ${stepIndex}`,
      )

      clickStep(document)
    })
  })
})

test('Insertion Sort: nhãn chỉ nói rằng giá trị đang được giữ riêng, không đổi mảng ở bước Dời (vẫn hiện 85 85)', async (t) => {
  await withSortingDom(({ document, window }) => {
    clickSortingCard(document, 'insertion')
    fixSortingArray(t, window, document, [85, 47])
    clickStep(document, 2)

    assert.deepEqual(barValues(document), ['85', '85'])
    assert.match(
      document.querySelector('#insertion-key').textContent,
      /giữ riêng/,
      'nhãn phải giải thích rằng key đang được giữ riêng',
    )
  })
})

test('Insertion Sort: key trùng giá trị với phần tử khác vẫn hiện đúng key', async (t) => {
  await withSortingDom(({ document, window }) => {
    clickSortingCard(document, 'insertion')
    fixSortingArray(t, window, document, [30, 30])

    // Dò tay: 0 khởi tạo, 1 so sánh 30 với key 30 (dừng vì 30 <= 30), 2 chèn, 3 hoàn thành.
    assert.equal(keyLabelState(document).state, 'idle')
    clickStep(document)
    assert.deepEqual(keyLabelState(document), { state: 'shown', text: 'Đang chèn: 30' })
    clickStep(document)
    assert.deepEqual(keyLabelState(document), { state: 'shown', text: 'Đang chèn: 30' })
    clickStep(document)
    assert.equal(keyLabelState(document).state, 'idle')
  })
})

test('Insertion Sort: mảng 1 phần tử và mảng rỗng không bao giờ hiện nhãn', async (t) => {
  await withSortingDom(({ document, window }) => {
    clickSortingCard(document, 'insertion')

    for (const values of [[7], []]) {
      fixSortingArray(t, window, document, values)

      // Dò tay: chỉ có bước đầu và bước hoàn thành.
      assert.equal(keyLabelState(document).state, 'idle', `[${values}] bước 0`)
      clickStep(document)
      assert.equal(keyLabelState(document).state, 'idle', `[${values}] bước cuối`)
    }
  })
})

test('Insertion Sort: nhãn không rò sau Đặt lại, sau Tạo mảng mới và sau khi đổi thuật toán giữa chừng', async (t) => {
  await withSortingDom(({ document, window }) => {
    clickSortingCard(document, 'insertion')
    fixSortingArray(t, window, document, [85, 47])

    clickStep(document, 2)
    assert.equal(keyLabelState(document).state, 'shown')
    document.querySelector('#reset-sort').click()
    assert.equal(keyLabelState(document).state, 'idle', 'sau Đặt lại')

    clickStep(document, 2)
    assert.equal(keyLabelState(document).state, 'shown')
    document.querySelector('#start-button').click()
    assert.equal(keyLabelState(document).state, 'idle', 'sau Tạo mảng mới')

    clickStep(document, 2)
    assert.equal(keyLabelState(document).state, 'shown')
    clickSortingCard(document, 'bubble')
    assert.equal(keyLabelState(document).state, 'hidden', 'sau khi đổi sang Bubble giữa chừng')
    clickSortingCard(document, 'insertion')
    assert.equal(keyLabelState(document).state, 'idle', 'quay lại Insertion: mảng mới, bước 0')
  })
})

test('Bubble Sort và Selection Sort không bao giờ hiện nhãn "Đang chèn" ở bất kỳ bước nào', async (t) => {
  await withSortingDom(({ document, window }) => {
    for (const algorithm of ['bubble', 'selection']) {
      clickSortingCard(document, algorithm)
      fixSortingArray(t, window, document, [30, 20, 10])

      for (let stepIndex = 0; stepIndex < 8; stepIndex++) {
        assert.equal(keyLabelState(document).state, 'hidden', `${algorithm} bước ${stepIndex}`)
        clickStep(document)
      }
    }
  })
})

// --- Chú giải trạng thái của Sắp xếp (R3) ---
const sortLegendGenerators = {
  bubble: generateBubbleSortSteps,
  selection: generateSelectionSortSteps,
  insertion: generateInsertionSortSteps,
}

const legendInputs = [
  [50, 20, 40, 10, 30],
  [30, 20, 10],
  [5, 2, 8, 1, 3],
  [4, 2, 4, 1, 2],
  [1, 2, 3, 4, 5],
  [9, 8, 7, 6, 5, 4, 3, 2, 1],
]

// Trạng thái cột mà một thuật toán thực sự vẽ: chạy generator rồi hỏi CHÍNH hàm getBarStateClasses mà renderBars dùng,
// không viết lại logic xác định lớp trong test.
function usedBarStates(generateSteps) {
  const used = new Set()

  for (const input of legendInputs) {
    for (const step of generateSteps(input)) {
      step.array.forEach((_, index) => {
        getBarStateClasses(step, index).forEach((name) => used.add(name))
      })
    }
  }

  return used
}

function visibleSortLegend(document) {
  return [...document.querySelectorAll('#sort-legend [data-algorithms]')]
    .filter((item) => !item.hidden)
    .map((item) => ({
      state: item.dataset.state,
      swatch: item.querySelector('.sort-legend-swatch')?.className ?? null,
      text: item.textContent.replace(/\s+/g, ' ').trim(),
    }))
}

const SORT_LEGEND_COMPARE_SWAP = [
  'Đang so sánh (viền dày)',
  'Đã đổi chỗ (viền nét đứt)',
  'Đã sắp xếp (viền kép)',
]
const SORT_LEGEND_INSERTION = [
  'Đang so sánh (viền dày, kể cả cột nằm trong đoạn đã sắp xếp)',
  'Đã sắp xếp (viền kép)',
]

test('chú giải Sắp xếp khớp đúng các trạng thái cột mà từng thuật toán thực sự vẽ (từ generator + getBarStateClasses)', async () => {
  await withSortingDom(({ document }) => {
    for (const { key } of sortingAlgorithms) {
      clickSortingCard(document, key)

      const legend = visibleSortLegend(document)
      const used = [...usedBarStates(sortLegendGenerators[key])].sort()

      assert.deepEqual(
        legend.map((item) => `is-${item.state}`).sort(),
        used,
        `${key}: trạng thái được vẽ so với mục chú giải đang hiện`,
      )

      for (const item of legend) {
        assert.equal(item.swatch, `sort-legend-swatch is-${item.state}`, `${key}: mẫu của mục ${item.state}`)
      }
    }
  })
})

test('chú giải Sắp xếp có chữ và nêu kiểu viền: Bubble và Selection 3 mục, Insertion 2 mục (không có đã đổi chỗ)', async () => {
  await withSortingDom(({ document }) => {
    const textsOf = () => visibleSortLegend(document).map((item) => item.text)

    assert.deepEqual(textsOf(), SORT_LEGEND_COMPARE_SWAP, 'mặc định là Bubble Sort')
    clickSortingCard(document, 'selection')
    assert.deepEqual(textsOf(), SORT_LEGEND_COMPARE_SWAP)
    clickSortingCard(document, 'insertion')
    assert.deepEqual(textsOf(), SORT_LEGEND_INSERTION)
  })
})

test('chú giải Sắp xếp không rò khi đổi thuật toán qua lại nhiều lần', async () => {
  await withSortingDom(({ document }) => {
    const expected = { bubble: SORT_LEGEND_COMPARE_SWAP, selection: SORT_LEGEND_COMPARE_SWAP, insertion: SORT_LEGEND_INSERTION }

    for (const key of ['insertion', 'bubble', 'bubble', 'insertion', 'selection', 'insertion', 'selection', 'bubble']) {
      clickSortingCard(document, key)
      clickStep(document)
      assert.deepEqual(visibleSortLegend(document).map((item) => item.text), expected[key], key)
    }
  })
})

test('chú giải Sắp xếp nằm ngay dưới #array-bars và trước #insertion-key', async () => {
  await withSortingDom(({ document }) => {
    const legend = document.querySelector('#sort-legend')

    assert.ok(legend !== null, 'thiếu #sort-legend')
    assert.equal(document.querySelector('#array-bars').nextElementSibling?.id, 'sort-legend')
    assert.equal(legend.nextElementSibling?.id, 'insertion-key')
  })
})


test('kiến thức Bubble mô tả bất biến, ví dụ và giới hạn của lõi so với trace', async () => {
  await withSortingDom(({ document }) => {
    clickSortingCard(document, 'bubble')
    const normalizeText = (text) => text.replace(/\s+/gu, ' ').trim()
    const description = normalizeText(document.querySelector('#learning-description').textContent)
    const advantages = normalizeText(document.querySelector('#learning-advantages').textContent)
    const disadvantages = normalizeText(document.querySelector('#learning-disadvantages').textContent)

    assert.match(description, /số hữu hạn/iu, 'Nêu miền dữ liệu hữu hạn')
    assert.match(description, /so sánh nhất quán/iu, 'Nêu giả định quan hệ so sánh')
    assert.match(description, /hậu tố[^.;]*đúng vị trí/iu, 'Nêu bất biến hậu tố ở cuối lượt')
    assert.match(description, /mọi phần tử tiền tố\s*(?:≤|<=|không lớn hơn)\s*mọi phần tử hậu tố/iu, 'Nêu quan hệ giữa hai phần')
    assert.match(description, /(?:ban đầu|khởi tạo)[^.;]*rỗng/iu, 'Nêu khởi tạo bất biến')
    assert.match(description, /minh họa|ví dụ/iu, 'Ví dụ phải có nhãn')
    const exampleArrays = [...description.matchAll(/\[[\d,\s]+\]/gu)]
      .map(([array]) => JSON.parse(array))
    assert.deepEqual(exampleArrays, [[5, 2, 4, 1], [2, 4, 1, 5], [2, 1, 4, 5], [1, 2, 4, 5]], 'Ví dụ phải giữ đúng dữ liệu và thứ tự các lượt')
    const passes = generateBubbleSortSteps([5, 2, 4, 1])
      .filter((step) => step.pseudocodeLine === 7 || step.pseudocodeLine === 8)
      .map((step) => step.array)
    assert.deepEqual(passes, [[2, 4, 1, 5], [2, 1, 4, 5], [1, 2, 4, 5]])
    assert.match(advantages, /swapped/iu, 'Giữ giải thích cờ dừng sớm')
    assert.match(advantages, /không (?:swap|đổi chỗ)/iu, 'Nêu lượt không đổi chỗ')
    assert.match(advantages, /dừng sớm/iu, 'Nêu hành vi kết thúc sớm')
    assert.match(advantages, /n\s*(?:≥|>=)\s*2/iu, 'Giới hạn phân tích ở n từ 2')
    assert.match(advantages, /tốt nhất[^.;]*O\(n\)/iu, 'Gắn O(n) với trường hợp tốt nhất')
    assert.match(advantages, /xấu nhất[^.;]*O\(n²\)/iu, 'Gắn O(n²) với trường hợp xấu nhất')
    assert.match(advantages, /(?:swap|đổi chỗ) (?:cặp )?kề/iu, 'Ổn định dựa trên swap kề')
    assert.match(advantages, /chỉ khi\s*>(?!=)/iu, 'Điều kiện swap phải nghiêm ngặt')
    assert.match(advantages, /ổn định[^.;]*lõi|lõi[^.;]*ổn định/iu, 'Giới hạn stability ở lõi')
    assert.match(advantages, /chưa[^.;]*kiểm[^.;]*định danh/iu, 'Không nhận đã kiểm identity sản phẩm')
    assert.match(disadvantages, /O\(1\)[^.;]*lõi|lõi[^.;]*O\(1\)/iu, 'Gắn O(1) phụ với lõi')
    assert.match(disadvantages, /(?:copy|sao chép)[^.;]*O\(n\)/iu, 'Nêu bộ nhớ copy O(n)')
    assert.match(disadvantages, /S\s+(?:snapshot|trạng thái|bước)/iu, 'Nêu số snapshot được lưu')
    assert.match(disadvantages, /O\(n\s*[·*×]\s*S\)/iu, 'Giữ cận bộ nhớ toàn trace')
    assert.match(disadvantages, /average.case[^.;]*chưa[^.;]*nghiệm thu học thuật/iu, 'Không nâng trạng thái average-case')
  })
})

test('nội dung Bubble không rò sang Selection/Insertion và giữ nguyên complexity cards', async () => {
  await withSortingDom(({ document }) => {
    const readKnowledge = () => ['#learning-description', '#learning-advantages', '#learning-disadvantages']
      .map((selector) => document.querySelector(selector).textContent.replace(/\s+/gu, ' ').trim())
    const readComplexities = () => [...document.querySelectorAll('#sorting-section .complexity-card strong')]
      .map((element) => element.textContent)
    const expected = {
      bubble: ['O(n)', 'O(n²)', 'O(n²)', 'O(1)'],
      selection: ['O(n²)', 'O(n²)', 'O(n²)', 'O(1)'],
      insertion: ['O(n)', 'O(n²)', 'O(n²)', 'O(1)'],
    }
    for (const algorithm of ['selection', 'insertion']) {
      clickSortingCard(document, algorithm)
      const original = readKnowledge()
      assert.doesNotMatch(original.join(' '), /swapped/iu, 'Không rò cờ dừng sớm riêng của Bubble')
      assert.doesNotMatch(original.join(' '), /\[5,\s*2,\s*4,\s*1\]/u, 'Không rò ví dụ riêng của Bubble')
      clickSortingCard(document, 'bubble')
      assert.deepEqual(readComplexities(), expected.bubble)
      clickSortingCard(document, algorithm)
      assert.deepEqual(readKnowledge(), original, 'Đổi lại thuật toán phải khôi phục đúng kiến thức riêng')
      assert.deepEqual(readComplexities(), expected[algorithm])
    }
  })
})


// Gắn nhóm tên trường hợp với biểu thức chi phí kế tiếp, không khóa thứ tự/câu văn.
function assertSelectionComparisonComplexities(text) {
  const costs = new Map([['tốt nhất', []], ['xấu nhất', []]])
  let pending = []
  for (const [token] of text.normalize('NFC').matchAll(/tốt\s+nhất|xấu\s+nhất|(?:Θ|O|Ω)\s*\([^)]*\)/giu)) {
    const normalized = token.toLowerCase().replace(/\s+/gu, ' ').trim()
    if (costs.has(normalized)) {
      pending.push(normalized)
    } else {
      for (const name of pending) costs.get(name).push(normalized.replace(/\s/gu, ''))
      pending = []
    }
  }
  assert.equal(pending.length, 0, 'Mọi trường hợp phải có biểu thức chi phí')
  for (const [name, expressions] of costs) {
    assert.ok(expressions.length > 0, 'Thiếu chi phí ' + name)
    assert.ok(expressions.every((cost) => /^θ\(n(?:²|\^2)\)$/u.test(cost)), name + ' phải là Θ(n²) theo comparisons')
  }
}

test('assertion complexity Selection chấp nhận nhóm/riêng, đảo thứ tự và whitespace', () => {
  for (const text of [
    'tốt nhất và xấu nhất Θ(n²)',
    'xấu nhất và tốt nhất đều Θ(n²)',
    'tốt nhất: Θ(n²); xấu nhất: Θ(n²)',
    'xấu nhất Θ(n²). Tốt nhất cũng Θ(n²)',
    'Tốt  nhất\n và xấu\tnhất: Θ( n ^ 2 )',
  ]) assertSelectionComparisonComplexities(text)
})

test('assertion complexity Selection bác bỏ cận sai hoặc thiếu cho từng trường hợp', () => {
  for (const text of [
    'tốt nhất Θ(n), xấu nhất Θ(n²)',
    'xấu nhất Θ(n²), tốt nhất Θ(n)',
    'tốt nhất Θ(n²), xấu nhất Θ(n)',
    'tốt nhất và xấu nhất O(n²)',
    'tốt nhất O(n), xấu nhất Θ(n²)',
    'tốt nhất Θ(n²)',
  ]) assert.throws(() => assertSelectionComparisonComplexities(text), assert.AssertionError)
})

test('kiến thức Selection nêu tiền tố, minIndex, chi phí và giới hạn stability', async () => {
  await withSortingDom(({ document }) => {
    clickSortingCard(document, 'selection')
    const text = (id) => document.querySelector(id).textContent.replace(/\s+/gu, ' ').trim()
    const description = text('#learning-description')
    const advantages = text('#learning-advantages')
    const disadvantages = text('#learning-disadvantages')
    assert.match(description, /tiền tố[^.;]*đúng vị trí/iu, 'Nêu phần đã hoàn tất')
    assert.match(description, /tiền tố[^.;]*tăng dần/iu, 'Tiền tố phải có thứ tự')
    assert.match(description, /không lớn hơn hậu tố|≤\s*(?:mọi phần tử )?hậu tố/iu, 'Nêu quan hệ giữa hai phần')
    assert.match(description, /(?:ban đầu|khởi tạo)[^.;]*rỗng/iu)
    assert.match(description, /minIndex\s*=\s*i/iu, 'Khởi tạo vị trí nhỏ nhất mỗi lượt')
    assert.match(description, /cập nhật[^.;]*nhỏ hơn/iu, 'Cập nhật khi gặp giá trị nhỏ hơn')
    assert.match(description, /(?:swap|đổi chỗ)[^.;]*minIndex\s*(?:≠|!=)\s*i/iu, 'Không swap khi minIndex vẫn là i')
    assert.match(description, /minh họa|ví dụ/iu)
    const arrays = [...description.matchAll(/\[[\d,\s]+\]/gu)].map(([a]) => JSON.parse(a))
    assert.deepEqual(arrays, [[4, 3, 2, 1], [1, 3, 2, 4], [1, 2, 3, 4], [1, 2, 3, 4]], 'Ví dụ gồm đầu vào và đúng ba lượt')
    const compact = advantages.replace(/\s/gu, '')
    assert.match(compact, /n\(n[−-]1\)\/2/iu, 'Giữ số so sánh chính xác')
    assert.match(compact, /swaps(?:≤|<=)n[−-]1/iu, 'Giữ cận số swap')
    assert.match(compact, /n(?:≥|>=)2/iu)
    assertSelectionComparisonComplexities(advantages)
    assert.match(disadvantages, /lõi[^.;]*O\(1\)|O\(1\)[^.;]*lõi/iu)
    assert.match(disadvantages, /(?:copy|sao chép)[^.;]*O\(n\)/iu)
    assert.match(disadvantages, /S\s+snapshot/iu)
    assert.match(disadvantages, /trace[^.;]*O\(n\s*[·*×]\s*S\)/iu)
    assert.match(disadvantages, /(?:swap|đổi chỗ) không kề/iu)
    assert.match(disadvantages, /có thể[^.;]*phá[^.;]*ổn định/iu)
    assert.match(disadvantages, /chưa[^.;]*kiểm[^.;]*định danh/iu)
    assert.match(disadvantages, /average.case[^.;]*chưa[^.;]*nghiệm thu học thuật/iu)
  })
})

test('Selection: oracle từng lượt, comparisons và swaps khớp ví dụ, kể cả lượt không swap', () => {
  const steps = generateSelectionSortSteps([4, 3, 2, 1])
  const passes = steps.filter((s) => !s.finished && s.sortedIndices.length > 0 && s.comparing.length === 0)
  assert.deepEqual(passes.map((s) => s.array), [[1, 3, 2, 4], [1, 2, 3, 4], [1, 2, 3, 4]])
  assert.deepEqual(passes.map((s) => s.comparisons), [3, 5, 6])
  assert.deepEqual(passes.map((s) => s.swaps), [1, 2, 2])
  assert.deepEqual(passes.map((s) => s.pseudocodeLine), [7, 7, 6])
  for (const [input, comparisons, swaps] of [[[], 0, 0], [[7], 0, 0], [[1, 2, 3, 4], 6, 0], [[2, 2, 1], 3, 1]]) {
    const result = generateSelectionSortSteps(input)
    assert.deepEqual(result.at(-1).array, [...input].sort((a, b) => a - b))
    assert.equal(result.at(-1).comparisons, comparisons)
    assert.equal(result.at(-1).swaps, swaps)
    assert.equal(result.at(-1).finished, true)
    if (input.length < 2) assert.equal(result.length, 2, 'Mảng 0/1 phần tử chỉ có đầu/cuối')
  }
})

test('Selection: controller giữ counters, minIndex, prefix và pseudocode khớp snapshot', async (t) => {
  await withSortingDom(({ document, window }) => {
    clickSortingCard(document, 'selection')
    // Dữ liệu kiểm thử co giãn từ ví dụ; bốn phần tử là fixture, UI thật chỉ cho chọn 8–24.
    fixSortingArray(t, window, document, [40, 30, 20, 10])
    const steps = generateSelectionSortSteps([40, 30, 20, 10])
    assert.ok(steps.some((s) => s.pseudocodeLine === 5), 'Có nhánh cập nhật minIndex')
    assert.ok(steps.some((s) => s.pseudocodeLine === 6), 'Có nhánh không swap')
    for (const [index, step] of steps.entries()) {
      if (index > 0) clickStep(document)
      assert.deepEqual(barValues(document).map(Number), step.array)
      assert.equal(Number(document.querySelector('#comparison-count').textContent), step.comparisons)
      assert.equal(Number(document.querySelector('#swap-count').textContent), step.swaps)
      assert.deepEqual(getActivePseudocodeLines(document), step.pseudocodeLine === null ? [] : [{ line: step.pseudocodeLine, ariaCurrent: 'step' }])
      const bars = [...document.querySelectorAll('#array-bars .array-bar')]
      assert.deepEqual(bars.filter((b) => b.classList.contains('is-comparing')).map((b) => Number(b.dataset.index)), step.comparing)
      assert.deepEqual(bars.filter((b) => b.classList.contains('is-swapped')).map((b) => Number(b.dataset.index)), step.swapped)
      assert.deepEqual(bars.filter((b) => b.classList.contains('is-sorted')).map((b) => Number(b.dataset.index)), step.sortedIndices.filter((i) => !step.comparing.includes(i) && !step.swapped.includes(i)))
    }
    assert.equal(document.querySelector('#step-sort').disabled, true)
    assert.equal(document.querySelector('#run-sort').textContent, 'Chạy lại')
    document.querySelector('#reset-sort').click()
    assert.deepEqual(barValues(document), ['40', '30', '20', '10'])
    assert.equal(Number(document.querySelector('#comparison-count').textContent), 0)
    assert.deepEqual(getActivePseudocodeLines(document), [])
  })
})

test('kiến thức Selection không rò sang Bubble/Insertion, cards và nội dung cũ giữ nguyên', async () => {
  await withSortingDom(({ document }) => {
    const read = () => ['#learning-description', '#learning-advantages', '#learning-disadvantages'].map((s) => document.querySelector(s).textContent)
    const cards = () => [...document.querySelectorAll('#sorting-section .complexity-card strong')].map((e) => e.textContent)
    const expected = { bubble: ['O(n)', 'O(n²)', 'O(n²)', 'O(1)'], selection: ['O(n²)', 'O(n²)', 'O(n²)', 'O(1)'], insertion: ['O(n)', 'O(n²)', 'O(n²)', 'O(1)'] }
    for (const algorithm of ['bubble', 'insertion']) {
      clickSortingCard(document, algorithm)
      const original = read()
      clickSortingCard(document, 'selection')
      assert.deepEqual(cards(), expected.selection)
      assert.match(read().join(' '), /minIndex/iu)
      clickSortingCard(document, algorithm)
      assert.deepEqual(read(), original)
      assert.deepEqual(cards(), expected[algorithm])
      assert.doesNotMatch(read().join(' '), /minIndex|\[4,\s*3,\s*2,\s*1\]/iu)
    }
  })
})
