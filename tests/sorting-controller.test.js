
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
