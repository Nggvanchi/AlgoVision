import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

const templatePath = new URL(
  '../public/templates/app.html',
  import.meta.url,
)

const template = await readFile(templatePath, 'utf8')

async function setupSearching(options = {}) {
  const window = new Window()
  const { document } = window

  document.body.innerHTML = template

  const previousDocument = globalThis.document
  const previousWindow = globalThis.window

  globalThis.document = document
  globalThis.window = window

  try {
    const { initSearching } = await import('../src/searching.js')

    initSearching(options)

    return {
      window,
      document,
      cleanup() {
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
      },
    }
  } catch (error) {
    window.happyDOM.abort()
    globalThis.document = previousDocument
    globalThis.window = previousWindow
    throw error
  }
}

test('khởi tạo Searching với 12 phần tử', async () => {
  const app = await setupSearching()

  try {
    const { document } = app
    const cells = document.querySelectorAll('#search-array .search-cell')

    assert.equal(cells.length, 12)
    assert.equal(document.querySelector('#search-comparisons').textContent, '0')
    assert.equal(document.querySelector('#search-next').disabled, false)
    assert.equal(document.querySelector('#search-run').disabled, false)
  } finally {
    app.cleanup()
  }
})

test('Linear Search tìm thấy phần tử ở đầu mảng', async () => {
  const app = await setupSearching()

  try {
    const { document, window } = app

    const algorithm = document.querySelector('#search-algorithm')
    algorithm.value = 'linear'
    algorithm.dispatchEvent(new window.Event('change'))

    const firstCell = document.querySelector('#search-array .search-cell')
    const target = firstCell.textContent

    const targetInput = document.querySelector('#search-target')
    targetInput.value = target
    targetInput.dispatchEvent(new window.Event('change'))

    document.querySelector('#search-next').click()

    assert.equal(document.querySelector('#search-comparisons').textContent, '1')
    assert.equal(document.querySelector('#search-result').textContent, 'Tìm thấy tại vị trí 1.')

    const foundCell = document.querySelector('#search-array .search-cell.is-found')

    assert.ok(foundCell)
    assert.equal(foundCell.textContent, target)
  } finally {
    app.cleanup()
  }
})

test('Đặt lại đưa trạng thái tìm kiếm về ban đầu', async () => {
  const app = await setupSearching()

  try {
    const { document, window } = app

    const firstCell = document.querySelector('#search-array .search-cell')
    const targetInput = document.querySelector('#search-target')

    targetInput.value = firstCell.textContent
    targetInput.dispatchEvent(new window.Event('change'))

    document.querySelector('#search-next').click()

    assert.equal(document.querySelector('#search-comparisons').textContent, '1')

    document.querySelector('#search-reset').click()

    assert.equal(document.querySelector('#search-comparisons').textContent, '0')
    assert.equal(document.querySelector('#search-result').textContent, 'Chưa có kết quả.')
    assert.equal(document.querySelector('#search-next').disabled, false)
  } finally {
    app.cleanup()
  }
})

test('Binary Search tìm thấy phần tử ở giữa mảng đã sắp xếp', async () => {
  const app = await setupSearching()

  try {
    const { document, window } = app

    const algorithm = document.querySelector('#search-algorithm')
    algorithm.value = 'binary'
    algorithm.dispatchEvent(new window.Event('change'))

    const cells = document.querySelectorAll('#search-array .search-cell')
    const middleIndex = Math.floor((cells.length - 1) / 2)
    const target = cells[middleIndex].textContent

    const targetInput = document.querySelector('#search-target')
    targetInput.value = target
    targetInput.dispatchEvent(new window.Event('change'))

    document.querySelector('#search-next').click()

    assert.equal(document.querySelector('#search-comparisons').textContent, '1')
    assert.equal(
    document.querySelector('#search-result').textContent,
    `Tìm thấy tại vị trí ${middleIndex + 1}.`,)

    const foundCell = document.querySelector('#search-array .search-cell.is-found')

    assert.ok(foundCell)
    assert.equal(foundCell.textContent, target)
  } finally {
    app.cleanup()
  }
})

test('Tạo mảng mới vẫn giữ 12 phần tử và đặt lại bộ đếm', async () => {
  const app = await setupSearching()

  try {
    const { document } = app

    const firstCell = document.querySelector('#search-array .search-cell')
    const targetInput = document.querySelector('#search-target')

    targetInput.value = firstCell.textContent
    targetInput.dispatchEvent(new app.window.Event('change'))
    document.querySelector('#search-next').click()

    document.querySelector('#search-new-array').click()

    assert.equal(
      document.querySelectorAll('#search-array .search-cell').length,
      12,
    )
    assert.equal(document.querySelector('#search-comparisons').textContent, '0')
    assert.equal(document.querySelector('#search-result').textContent, 'Chưa có kết quả.')
  } finally {
    app.cleanup()
  }
})

test('Linear Search không tìm thấy mục tiêu', async () => {
  const { window, document, cleanup } = await setupSearching()

  try {
    const searchAlgorithm = document.querySelector('#search-algorithm')
    const searchTarget = document.querySelector('#search-target')
    const searchNextButton = document.querySelector('#search-next')
    const searchArray = document.querySelector('#search-array')

    searchAlgorithm.value = 'linear'
    searchAlgorithm.dispatchEvent(new window.Event('change', { bubbles: true }))

    const numbers = [...searchArray.querySelectorAll('.search-cell')]
      .map((cell) => Number(cell.textContent))

    const target = Math.max(...numbers) + 1

    searchTarget.value = String(target)
    searchTarget.dispatchEvent(new window.Event('change', { bubbles: true }))

    for (let i = 0; i < numbers.length; i += 1) {
      searchNextButton.click()
    }

    assert.equal(
      document.querySelector('#search-comparisons').textContent,
      String(numbers.length),
    )

    assert.match(
      document.querySelector('#search-result').textContent,
      /không tìm thấy/i,
    )

    assert.equal(
      document.querySelector('#search-array .search-cell.is-found'),
      null,
    )
  } finally {
    cleanup()
  }
})

test('Binary Search không tìm thấy mục tiêu', async () => {
  const { window, document, cleanup } = await setupSearching()

  try {
    const searchAlgorithm = document.querySelector('#search-algorithm')
    const searchTarget = document.querySelector('#search-target')
    const searchNextButton = document.querySelector('#search-next')
    const searchArray = document.querySelector('#search-array')

    searchAlgorithm.value = 'binary'
    searchAlgorithm.dispatchEvent(new window.Event('change', { bubbles: true }))

    const numbers = [...searchArray.querySelectorAll('.search-cell')]
      .map((cell) => Number(cell.textContent))

    const target = Math.max(...numbers) + 1

    searchTarget.value = String(target)
    searchTarget.dispatchEvent(new window.Event('change', { bubbles: true }))

    for (let i = 0; i < numbers.length; i += 1) {
      searchNextButton.click()
    }

    assert.match(
      document.querySelector('#search-result').textContent,
      /không tìm thấy/i,
    )

    assert.equal(
      document.querySelector('#search-array .search-cell.is-found'),
      null,
    )

    assert.equal(
      document.querySelector('#search-next').disabled,
      true,
    )
  } finally {
    cleanup()
  }
})

test('Linear Search trả về vị trí xuất hiện đầu tiên khi có phần tử trùng lặp', async () => {
  const numbers = [20, 30, 20, 40, 20, 50]
  const { window, document, cleanup } = await setupSearching({
    initialNumbers: numbers,
  })

  try {
    const searchAlgorithm = document.querySelector('#search-algorithm')
    const searchTarget = document.querySelector('#search-target')
    const searchNextButton = document.querySelector('#search-next')

    searchAlgorithm.value = 'linear'
    searchAlgorithm.dispatchEvent(new window.Event('change', { bubbles: true }))

    searchTarget.value = '20'
    searchTarget.dispatchEvent(new window.Event('change', { bubbles: true }))

    searchNextButton.click()

    assert.equal(
      document.querySelector('#search-result').textContent,
      'Tìm thấy tại vị trí 1.',
    )

    assert.equal(
      document.querySelector('#search-comparisons').textContent,
      '1',
    )

    const foundCell = document.querySelector(
      '#search-array .search-cell.is-found',
    )

    assert.ok(foundCell)
    assert.equal(foundCell.textContent, '20')
  } finally {
    cleanup()
  }
})

test('Binary Search tìm thấy mục tiêu khi có phần tử trùng lặp', async () => {
  const numbers = [20, 30, 20, 40, 20, 50]
  const { window, document, cleanup } = await setupSearching({
    initialNumbers: numbers,
  })

  try {
    const searchAlgorithm = document.querySelector('#search-algorithm')
    const searchTarget = document.querySelector('#search-target')
    const searchNextButton = document.querySelector('#search-next')

    searchAlgorithm.value = 'binary'
    searchAlgorithm.dispatchEvent(new window.Event('change', { bubbles: true }))

    searchTarget.value = '20'
    searchTarget.dispatchEvent(new window.Event('change', { bubbles: true }))

    for (let i = 0; i < numbers.length; i += 1) {
      if (document.querySelector('#search-next').disabled) {
        break
      }

      searchNextButton.click()
    }

    const sortedNumbers = [...numbers].sort((a, b) => a - b)
    const foundIndex = sortedNumbers.indexOf(20)

    assert.match(
      document.querySelector('#search-result').textContent,
      /Tìm thấy tại vị trí \d+\./,
    )

    assert.ok(
      Number(document.querySelector('#search-comparisons').textContent) > 0,
    )

    const foundCell = document.querySelector(
      '#search-array .search-cell.is-found',
    )

    assert.ok(foundCell)
    assert.equal(foundCell.textContent, '20')
  } finally {
    cleanup()
  }
})

test('Searching không chạy bước tiếp theo khi ô mục tiêu để trống', async () => {
  const { window, document, cleanup } = await setupSearching()

  try {
    const searchTarget = document.querySelector('#search-target')
    const searchNextButton = document.querySelector('#search-next')
    const searchMessage = document.querySelector('#search-message')
    const searchComparisons = document.querySelector('#search-comparisons')
    const searchResult = document.querySelector('#search-result')

    searchTarget.value = ''
    searchTarget.dispatchEvent(
      new window.Event('change', { bubbles: true }),
    )

    searchNextButton.click()

    assert.equal(
      searchMessage.textContent,
      'Vui lòng nhập một giá trị số hợp lệ.',
    )

    assert.equal(searchComparisons.textContent, '0')
    assert.equal(searchResult.textContent, 'Chưa có kết quả.')
    assert.equal(searchNextButton.disabled, false)

    assert.equal(
      document.querySelector('#search-array .search-cell.is-found'),
      null,
    )
  } finally {
    cleanup()
  }
})

test('Searching không chạy tự động khi ô mục tiêu để trống', async () => {
  const { window, document, cleanup } = await setupSearching()

  try {
    const searchTarget = document.querySelector('#search-target')
    const searchRunButton = document.querySelector('#search-run')
    const searchMessage = document.querySelector('#search-message')
    const searchComparisons = document.querySelector('#search-comparisons')

    searchTarget.value = ''
    searchTarget.dispatchEvent(
      new window.Event('change', { bubbles: true }),
    )

    searchRunButton.click()

    assert.equal(
      searchMessage.textContent,
      'Vui lòng nhập một giá trị số hợp lệ trước khi tìm kiếm.',
    )

    assert.equal(searchComparisons.textContent, '0')
    assert.equal(searchRunButton.disabled, false)
    assert.equal(document.querySelector('#search-pause').disabled, true)
  } finally {
    cleanup()
  }
})

test('Linear Search tìm thấy mục tiêu trong mảng một phần tử', async () => {
  const { window, document, cleanup } = await setupSearching({
    initialNumbers: [42],
  })

  try {
    const searchAlgorithm = document.querySelector('#search-algorithm')
    const searchTarget = document.querySelector('#search-target')

    searchAlgorithm.value = 'linear'
    searchAlgorithm.dispatchEvent(new window.Event('change', { bubbles: true }))

    searchTarget.value = '42'
    searchTarget.dispatchEvent(new window.Event('change', { bubbles: true }))

    document.querySelector('#search-next').click()

    assert.equal(document.querySelectorAll('#search-array .search-cell').length, 1)
    assert.equal(document.querySelector('#search-comparisons').textContent, '1')
    assert.equal(document.querySelector('#search-result').textContent, 'Tìm thấy tại vị trí 1.')
    assert.equal(document.querySelector('#search-array .search-cell.is-found').textContent, '42')
    assert.equal(document.querySelector('#search-next').disabled, true)
  } finally {
    cleanup()
  }
})

test('Linear Search không tìm thấy mục tiêu trong mảng một phần tử', async () => {
  const { window, document, cleanup } = await setupSearching({
    initialNumbers: [42],
  })

  try {
    const searchAlgorithm = document.querySelector('#search-algorithm')
    const searchTarget = document.querySelector('#search-target')

    searchAlgorithm.value = 'linear'
    searchAlgorithm.dispatchEvent(new window.Event('change', { bubbles: true }))

    searchTarget.value = '99'
    searchTarget.dispatchEvent(new window.Event('change', { bubbles: true }))

    document.querySelector('#search-next').click()

    assert.equal(document.querySelector('#search-comparisons').textContent, '1')
    assert.equal(document.querySelector('#search-result').textContent, 'Không tìm thấy giá trị.')
    assert.equal(document.querySelector('#search-array .search-cell.is-found'), null)
    assert.equal(document.querySelector('#search-next').disabled, true)
  } finally {
    cleanup()
  }
})

test('Binary Search tìm thấy mục tiêu trong mảng một phần tử', async () => {
  const { window, document, cleanup } = await setupSearching({
    initialNumbers: [42],
  })

  try {
    const searchAlgorithm = document.querySelector('#search-algorithm')
    const searchTarget = document.querySelector('#search-target')

    searchAlgorithm.value = 'binary'
    searchAlgorithm.dispatchEvent(new window.Event('change', { bubbles: true }))

    searchTarget.value = '42'
    searchTarget.dispatchEvent(new window.Event('change', { bubbles: true }))

    document.querySelector('#search-next').click()

    assert.equal(document.querySelectorAll('#search-array .search-cell').length, 1)
    assert.equal(document.querySelector('#search-comparisons').textContent, '1')
    assert.equal(document.querySelector('#search-result').textContent, 'Tìm thấy tại vị trí 1.')
    assert.equal(document.querySelector('#search-array .search-cell.is-found').textContent, '42')
    assert.equal(document.querySelector('#search-next').disabled, true)
  } finally {
    cleanup()
  }
})

test('Binary Search không tìm thấy mục tiêu trong mảng một phần tử', async () => {
  const { window, document, cleanup } = await setupSearching({
    initialNumbers: [42],
  })

  try {
    const searchAlgorithm = document.querySelector('#search-algorithm')
    const searchTarget = document.querySelector('#search-target')

    searchAlgorithm.value = 'binary'
    searchAlgorithm.dispatchEvent(new window.Event('change', { bubbles: true }))

    searchTarget.value = '99'
    searchTarget.dispatchEvent(new window.Event('change', { bubbles: true }))

    document.querySelector('#search-next').click()

    assert.equal(document.querySelector('#search-comparisons').textContent, '1')
    assert.equal(document.querySelector('#search-result').textContent, 'Không tìm thấy giá trị.')
    assert.equal(document.querySelector('#search-array .search-cell.is-found'), null)
    assert.equal(document.querySelector('#search-next').disabled, true)
  } finally {
    cleanup()
  }
})

test('chuyển sang Binary Search sẽ sắp xếp lại mảng và reset trạng thái', async () => {
  const { window, document, cleanup } = await setupSearching({
    initialNumbers: [40, 10, 30, 20],
  })

  try {
    const algorithmSelect = document.querySelector('#search-algorithm')
    const targetInput = document.querySelector('#search-target')
    const nextButton = document.querySelector('#search-next')
    const comparisons = document.querySelector('#search-comparisons')
    const result = document.querySelector('#search-result')

    const getNumbers = () =>
      [...document.querySelectorAll('#search-array .search-cell')]
        .map((cell) => Number(cell.textContent))

    assert.deepEqual(getNumbers(), [40, 10, 30, 20])

    targetInput.value = '40'
    targetInput.dispatchEvent(
      new window.Event('change', { bubbles: true }),
    )

    nextButton.click()

    assert.equal(comparisons.textContent, '1')
    assert.equal(result.textContent, 'Tìm thấy tại vị trí 1.')

    algorithmSelect.value = 'binary'
    algorithmSelect.dispatchEvent(
      new window.Event('change', { bubbles: true }),
    )

    assert.deepEqual(getNumbers(), [10, 20, 30, 40])
    assert.equal(comparisons.textContent, '0')
    assert.equal(result.textContent, 'Chưa có kết quả.')
    assert.equal(nextButton.disabled, false)
  } finally {
    cleanup()
  }
})

test('Searching bắt đầu chạy và tạm dừng đúng trạng thái nút', async () => {
  const { document, cleanup } = await setupSearching({
    initialNumbers: [10, 20, 30, 40],
  })

  try {
    const targetInput = document.querySelector('#search-target')
    const runButton = document.querySelector('#search-run')
    const pauseButton = document.querySelector('#search-pause')
    const nextButton = document.querySelector('#search-next')
    const comparisons = document.querySelector('#search-comparisons')

    targetInput.value = '40'
    targetInput.dispatchEvent(
      new document.defaultView.Event('change', {
        bubbles: true,
      }),
    )

    runButton.click()

    assert.equal(runButton.disabled, true)
    assert.equal(nextButton.disabled, true)
    assert.equal(pauseButton.disabled, false)

    pauseButton.click()

    assert.equal(runButton.disabled, false)
    assert.equal(nextButton.disabled, false)
    assert.equal(pauseButton.disabled, true)
    assert.equal(comparisons.textContent, '0')
  } finally {
    cleanup()
  }
})

test('Searching có thể tiếp tục chạy sau khi tạm dừng', async () => {
  const { document, cleanup } = await setupSearching({
    initialNumbers: [10, 20, 30, 40],
  })

  try {
    const targetInput = document.querySelector('#search-target')
    const runButton = document.querySelector('#search-run')
    const pauseButton = document.querySelector('#search-pause')
    const nextButton = document.querySelector('#search-next')

    targetInput.value = '40'
    targetInput.dispatchEvent(
      new document.defaultView.Event('change', {
        bubbles: true,
      }),
    )

    runButton.click()
    pauseButton.click()

    assert.equal(pauseButton.disabled, true)
    assert.equal(runButton.disabled, false)

    runButton.click()

    assert.equal(runButton.disabled, true)
    assert.equal(nextButton.disabled, true)
    assert.equal(pauseButton.disabled, false)

    pauseButton.click()

    assert.equal(pauseButton.disabled, true)
    assert.equal(runButton.disabled, false)
  } finally {
    cleanup()
  }
})


test('Reset giữ nguyên mảng và xóa trạng thái tìm kiếm', async () => {
  const { document, cleanup } = await setupSearching({
    initialNumbers: [10, 20, 30, 40],
  })

  try {
    const targetInput = document.querySelector('#search-target')
    const resetButton = document.querySelector('#search-reset')
    const nextButton = document.querySelector('#search-next')
    const comparisons = document.querySelector('#search-comparisons')
    const result = document.querySelector('#search-result')

    const getNumbers = () =>
      [...document.querySelectorAll('#search-array .search-cell')]
        .map((cell) => Number(cell.textContent))

    targetInput.value = '10'
    targetInput.dispatchEvent(
      new document.defaultView.Event('change', { bubbles: true }),
    )

    nextButton.click()

    assert.equal(comparisons.textContent, '1')
    assert.equal(result.textContent, 'Tìm thấy tại vị trí 1.')

    resetButton.click()

    assert.deepEqual(getNumbers(), [10, 20, 30, 40])
    assert.equal(comparisons.textContent, '0')
    assert.equal(result.textContent, 'Chưa có kết quả.')
    assert.equal(nextButton.disabled, false)
    assert.equal(
      document.querySelector('#search-array .is-found'),
      null,
    )
  } finally {
    cleanup()
  }
})

test('Tạo mảng mới đặt lại bộ đếm và kết quả tìm kiếm', async () => {
  const { document, cleanup } = await setupSearching()

  try {
    const targetInput = document.querySelector('#search-target')
    const newArrayButton = document.querySelector('#search-new-array')
    const nextButton = document.querySelector('#search-next')
    const comparisons = document.querySelector('#search-comparisons')
    const result = document.querySelector('#search-result')

    const firstCell = document.querySelector('#search-array .search-cell')

    targetInput.value = firstCell.textContent
    targetInput.dispatchEvent(
      new document.defaultView.Event('change', { bubbles: true }),
    )

    nextButton.click()

    assert.equal(comparisons.textContent, '1')
    assert.equal(result.textContent, 'Tìm thấy tại vị trí 1.')

    newArrayButton.click()

    assert.equal(
      document.querySelectorAll('#search-array .search-cell').length,
      12,
    )
    assert.equal(comparisons.textContent, '0')
    assert.equal(result.textContent, 'Chưa có kết quả.')
    assert.equal(nextButton.disabled, false)
    assert.equal(
      document.querySelector('#search-array .is-found'),
      null,
    )
  } finally {
    cleanup()
  }
})

test('Searching cập nhật nhãn khi thay đổi tốc độ', async () => {
  const { document, cleanup } = await setupSearching()

  try {
    const speedInput = document.querySelector('#search-speed')
    const speedValue = document.querySelector('#search-speed-value')

    speedInput.value = '200'
    speedInput.dispatchEvent(
      new document.defaultView.Event('input', { bubbles: true }),
    )

    assert.equal(speedValue.textContent, '200 ms')
  } finally {
    cleanup()
  }
})

test('Searching khởi động lại khi thay đổi tốc độ trong lúc chạy', async () => {
  const { document, cleanup } = await setupSearching({
    initialNumbers: [10, 20, 30, 40],
  })

  try {
    const targetInput = document.querySelector('#search-target')
    const speedInput = document.querySelector('#search-speed')
    const runButton = document.querySelector('#search-run')
    const pauseButton = document.querySelector('#search-pause')
    const nextButton = document.querySelector('#search-next')

    targetInput.value = '40'
    targetInput.dispatchEvent(
      new document.defaultView.Event('change', { bubbles: true }),
    )

    runButton.click()

    assert.equal(runButton.disabled, true)
    assert.equal(pauseButton.disabled, false)

    speedInput.value = '200'
    speedInput.dispatchEvent(
      new document.defaultView.Event('input', { bubbles: true }),
    )

    assert.equal(runButton.disabled, true)
    assert.equal(nextButton.disabled, true)
    assert.equal(pauseButton.disabled, false)

    pauseButton.click()

    assert.equal(runButton.disabled, false)
    assert.equal(nextButton.disabled, false)
    assert.equal(pauseButton.disabled, true)
  } finally {
    cleanup()
  }
})

test('Searching không thực hiện bước tiếp theo khi mục tiêu không phải số', async () => {
  const { document, cleanup } = await setupSearching({
    initialNumbers: [10, 20, 30, 40],
  })

  try {
    const targetInput = document.querySelector('#search-target')
    const nextButton = document.querySelector('#search-next')
    const comparisons = document.querySelector('#search-comparisons')
    const message = document.querySelector('#search-message')

    targetInput.value = 'abc'
    targetInput.dispatchEvent(
      new document.defaultView.Event('change', { bubbles: true }),
    )

    nextButton.click()

    assert.equal(comparisons.textContent, '0')
    assert.equal(
      message.textContent,
      'Vui lòng nhập một giá trị số hợp lệ.',
    )
    assert.equal(nextButton.disabled, false)
  } finally {
    cleanup()
  }
})

test('Searching không chạy tự động khi mục tiêu là Infinity', async () => {
  const { document, cleanup } = await setupSearching({
    initialNumbers: [10, 20, 30, 40],
  })

  try {
    const targetInput = document.querySelector('#search-target')
    const runButton = document.querySelector('#search-run')
    const pauseButton = document.querySelector('#search-pause')
    const comparisons = document.querySelector('#search-comparisons')
    const message = document.querySelector('#search-message')

    targetInput.value = 'Infinity'
    targetInput.dispatchEvent(
      new document.defaultView.Event('change', { bubbles: true }),
    )

    runButton.click()

    assert.equal(comparisons.textContent, '0')
    assert.equal(
      message.textContent,
      'Vui lòng nhập một giá trị số hợp lệ trước khi tìm kiếm.',
    )
    assert.equal(runButton.disabled, false)
    assert.equal(pauseButton.disabled, true)
  } finally {
    cleanup()
  }
})
