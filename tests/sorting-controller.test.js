
import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { createFakeScheduler } from './helpers/fake-scheduler.js'

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
    window.happyDOM.abort()

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
    speed: document.querySelector('#sort-speed'),
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

    controls.speed.value = '250'
    controls.speed.dispatchEvent(
      new document.defaultView.Event('change', { bubbles: true }),
    )

    scheduler.advance(650)
    scheduler.advance(250)

    assert.equal(controls.stepCount.textContent.startsWith('3 / '), true)
    assert.deepEqual(scheduler.scheduledDelays.slice(0, 3), [650, 250, 250])
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

    const speed = Number(document.querySelector('#sort-speed').value)

    scheduler.advance(speed)

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
