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
        // Dừng timer còn sống (nếu có) để test lỗi không làm treo tiến trình.
        document.querySelector('#search-pause')?.click()
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
      },
    }
  } catch (error) {
    window.happyDOM.close()
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

    // Sau lần so sánh cuối: đã đủ n phép so sánh nhưng chưa kết luận (bước riêng của dòng 2).
    assert.equal(
      document.querySelector('#search-comparisons').textContent,
      String(numbers.length),
    )
    assert.equal(document.querySelector('#search-result').textContent, 'Chưa có kết quả.')
    assert.equal(searchNextButton.disabled, false)

    // Bước kết luận "không tìm thấy" (dòng 4) không tăng số phép so sánh.
    searchNextButton.click()

    assert.equal(
      document.querySelector('#search-comparisons').textContent,
      String(numbers.length),
    )

    assert.match(
      document.querySelector('#search-result').textContent,
      /không tìm thấy/i,
    )

    const foundCell = document.querySelector('#search-array .search-cell.is-found')
    assert.ok(foundCell === null, 'Linear Search không tìm thấy mục tiêu thì không ô nào được đánh dấu is-found')
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

    const foundCell = document.querySelector('#search-array .search-cell.is-found')
    assert.ok(foundCell === null, 'Binary Search không tìm thấy mục tiêu thì không ô nào được đánh dấu is-found')

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

    const foundCell = document.querySelector('#search-array .search-cell.is-found')
    assert.ok(foundCell === null, 'Ô mục tiêu để trống thì Next không chạy và không ô nào được đánh dấu is-found')
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

    // Sau lần so sánh duy nhất (dòng 2): chưa kết luận.
    assert.equal(document.querySelector('#search-comparisons').textContent, '1')
    assert.equal(document.querySelector('#search-result').textContent, 'Chưa có kết quả.')
    assert.equal(document.querySelector('#search-next').disabled, false)

    // Bước kết luận "không tìm thấy" không tăng số phép so sánh.
    document.querySelector('#search-next').click()

    assert.equal(document.querySelector('#search-comparisons').textContent, '1')
    assert.equal(document.querySelector('#search-result').textContent, 'Không tìm thấy giá trị.')
    const foundCell = document.querySelector('#search-array .search-cell.is-found')
    assert.ok(foundCell === null, 'Linear Search không tìm thấy thì không ô nào được đánh dấu is-found')
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

    // Sau lần so sánh duy nhất (dòng 7: left = mid + 1): chưa kết luận.
    assert.equal(document.querySelector('#search-comparisons').textContent, '1')
    assert.equal(document.querySelector('#search-result').textContent, 'Chưa có kết quả.')
    assert.equal(document.querySelector('#search-next').disabled, false)

    // Bước kết luận "không tìm thấy" không tăng số phép so sánh.
    document.querySelector('#search-next').click()

    assert.equal(document.querySelector('#search-comparisons').textContent, '1')
    assert.equal(document.querySelector('#search-result').textContent, 'Không tìm thấy giá trị.')
    const foundCell = document.querySelector('#search-array .search-cell.is-found')
    assert.ok(foundCell === null, 'Binary Search không tìm thấy thì không ô nào được đánh dấu is-found')
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
    const foundCell = document.querySelector('#search-array .is-found')
    assert.ok(foundCell === null, 'Reset xóa đánh dấu is-found khỏi ô đã tìm thấy trước đó')
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
    const foundCell = document.querySelector('#search-array .is-found')
    assert.ok(foundCell === null, 'Tạo mảng mới thì mảng mới không có ô nào được đánh dấu is-found')
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

test('Searching vẫn chạy và giữ trạng thái nút khi thay đổi tốc độ trong lúc chạy', async () => {
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

function selectSearchAlgorithm(document, algorithm) {
  const select = document.querySelector('#search-algorithm')

  select.value = algorithm
  select.dispatchEvent(
    new document.defaultView.Event('change', { bubbles: true }),
  )
}

function getSelectedSearchCards(document) {
  return [
    ...document.querySelectorAll('[data-search-algorithm].selected'),
  ].map((card) => card.dataset.searchAlgorithm)
}

test('tiêu đề và Big-O của Searching khớp với thuật toán trong dropdown', async () => {
  const { document, cleanup } = await setupSearching()

  try {
    const title = document.querySelector('#search-title')
    const complexity = document.querySelector('#search-complexity')

    selectSearchAlgorithm(document, 'binary')

    assert.equal(title?.textContent, 'Binary Search')
    assert.equal(complexity?.textContent, 'O(log n)')

    selectSearchAlgorithm(document, 'linear')

    assert.equal(title?.textContent, 'Linear Search')
    assert.equal(complexity?.textContent, 'O(n)')
  } finally {
    cleanup()
  }
})

test('đổi dropdown đồng bộ thẻ thuật toán tìm kiếm được chọn', async () => {
  const { document, cleanup } = await setupSearching()

  try {
    assert.deepEqual(getSelectedSearchCards(document), ['linear'])

    selectSearchAlgorithm(document, 'binary')
    assert.deepEqual(getSelectedSearchCards(document), ['binary'])

    selectSearchAlgorithm(document, 'linear')
    assert.deepEqual(getSelectedSearchCards(document), ['linear'])
  } finally {
    cleanup()
  }
})

function setSearchTarget(document, value, eventType = 'change') {
  const input = document.querySelector('#search-target')

  input.value = value
  input.dispatchEvent(
    new document.defaultView.Event(eventType, { bubbles: true }),
  )
}

function clickNextUntilDisabled(document, maxClicks = 50) {
  const nextButton = document.querySelector('#search-next')

  for (let i = 0; i < maxClicks && !nextButton.disabled; i++) {
    nextButton.click()
  }
}

const SORTED_NUMBERS = [10, 20, 30, 40, 50, 60, 70, 80, 90]

for (const algorithm of ['binary', 'linear']) {
  test(`${algorithm}: mục tiêu được chốt khi sinh bước, đổi giá trị ô nhập không kèm sự kiện không ảnh hưởng`, async () => {
    const { document, cleanup } = await setupSearching({
      initialNumbers: SORTED_NUMBERS,
    })

    try {
      selectSearchAlgorithm(document, algorithm)
      setSearchTarget(document, '80')

      document.querySelector('#search-next').click()

      // Giá trị đổi mà không có sự kiện nào (vd: script/autofill).
      document.querySelector('#search-target').value = '20'
      clickNextUntilDisabled(document)

      const expectedComparisons = algorithm === 'binary' ? '3' : '8'

      assert.equal(
        document.querySelector('#search-message').textContent,
        'Đã tìm thấy 80 tại vị trí 8.',
      )
      assert.equal(
        document.querySelector('#search-result').textContent,
        'Tìm thấy tại vị trí 8.',
      )
      assert.equal(
        document.querySelector('#search-comparisons').textContent,
        expectedComparisons,
      )
    } finally {
      cleanup()
    }
  })

  test(`${algorithm}: gõ mục tiêu mới khi đang tạm dừng đưa mô phỏng về ban đầu`, async () => {
    const { document, cleanup } = await setupSearching({
      initialNumbers: SORTED_NUMBERS,
    })

    try {
      selectSearchAlgorithm(document, algorithm)
      setSearchTarget(document, '80')

      document.querySelector('#search-next').click()
      assert.equal(document.querySelector('#search-comparisons').textContent, '1')
      assert.equal(document.querySelector('#search-previous').disabled, false)

      // Chỉ phát input (người dùng đang gõ, chưa rời ô nhập).
      setSearchTarget(document, '20', 'input')

      assert.equal(document.querySelector('#search-comparisons').textContent, '0')
      assert.equal(document.querySelector('#search-result').textContent, 'Chưa có kết quả.')
      assert.equal(
        document.querySelector('#search-message').textContent,
        'Nhập giá trị cần tìm, sau đó bắt đầu mô phỏng.',
      )
      assert.equal(document.querySelector('#search-previous').disabled, true)
      assert.equal(document.querySelector('#search-next').disabled, false)
      assert.equal(document.querySelector('#search-run').textContent.trim(), 'Chạy tìm kiếm')
    } finally {
      cleanup()
    }
  })

  test(`${algorithm}: gõ mục tiêu mới khi đang chạy dừng timer và về ban đầu`, async () => {
    const scheduler = createFakeScheduler()
    const { document, cleanup } = await setupSearching({
      initialNumbers: SORTED_NUMBERS,
      scheduler,
    })

    try {
      selectSearchAlgorithm(document, algorithm)
      setSearchTarget(document, '80')

      document.querySelector('#search-run').click()
      scheduler.advance(600)
      assert.equal(document.querySelector('#search-comparisons').textContent, '1')

      setSearchTarget(document, '20', 'input')

      assert.equal(scheduler.pendingCount, 0)
      assert.equal(document.querySelector('#search-comparisons').textContent, '0')
      assert.equal(document.querySelector('#search-pause').disabled, true)
      assert.equal(document.querySelector('#search-run').textContent.trim(), 'Chạy tìm kiếm')
    } finally {
      cleanup()
    }
  })

  test(`${algorithm}: sau khi gõ mục tiêu mới, bộ đếm chỉ tính cho mục tiêu mới`, async () => {
    const { document, cleanup } = await setupSearching({
      initialNumbers: SORTED_NUMBERS,
    })

    try {
      selectSearchAlgorithm(document, algorithm)
      setSearchTarget(document, '80')

      document.querySelector('#search-next').click()
      setSearchTarget(document, '20', 'input')
      clickNextUntilDisabled(document)

      assert.equal(
        document.querySelector('#search-message').textContent,
        'Đã tìm thấy 20 tại vị trí 2.',
      )
      assert.equal(document.querySelector('#search-comparisons').textContent, '2')
    } finally {
      cleanup()
    }
  })
}

test('kéo thanh tốc độ liên tục không làm mô phỏng Searching đứng yên', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] })

  const { document, cleanup } = await setupSearching({
    initialNumbers: SORTED_NUMBERS,
  })

  try {
    const speedInput = document.querySelector('#search-speed')

    speedInput.value = '600'
    setSearchTarget(document, '90')
    document.querySelector('#search-run').click()

    // 10 sự kiện input, mỗi sự kiện cách nhau 200ms: tổng 2000ms với tốc độ 600ms.
    for (let i = 0; i < 10; i++) {
      t.mock.timers.tick(200)
      speedInput.dispatchEvent(
        new document.defaultView.Event('input', { bubbles: true }),
      )
    }

    assert.equal(
      document.querySelector('#search-comparisons').textContent,
      '3',
    )
  } finally {
    cleanup()
  }
})

test('Searching có nút Bước trước quay lại bước đã xem', async () => {
  const { document, cleanup } = await setupSearching({
    initialNumbers: SORTED_NUMBERS,
  })

  try {
    const previousButton = document.querySelector('#search-previous')
    const comparisons = document.querySelector('#search-comparisons')

    assert.ok(previousButton, 'thiếu nút #search-previous')
    assert.equal(previousButton.disabled, true)

    selectSearchAlgorithm(document, 'linear')
    setSearchTarget(document, '40')

    document.querySelector('#search-next').click()
    document.querySelector('#search-next').click()
    assert.equal(comparisons.textContent, '2')
    assert.equal(previousButton.disabled, false)

    previousButton.click()
    assert.equal(comparisons.textContent, '1')

    previousButton.click()
    assert.equal(comparisons.textContent, '0')
    assert.equal(previousButton.disabled, true)
  } finally {
    cleanup()
  }
})

test('Bước trước từ kết quả cuối mở lại nút Bước tiếp theo', async () => {
  const { document, cleanup } = await setupSearching({
    initialNumbers: SORTED_NUMBERS,
  })

  try {
    selectSearchAlgorithm(document, 'linear')
    setSearchTarget(document, '10')

    document.querySelector('#search-next').click()
    assert.equal(document.querySelector('#search-next').disabled, true)

    document.querySelector('#search-previous').click()

    assert.equal(document.querySelector('#search-next').disabled, false)
    assert.equal(document.querySelector('#search-result').textContent, 'Chưa có kết quả.')
  } finally {
    cleanup()
  }
})

test('Searching chạy hết thì nút Run thành Chạy lại và chạy lại từ đầu', async () => {
  const scheduler = createFakeScheduler()
  const { document, cleanup } = await setupSearching({
    initialNumbers: SORTED_NUMBERS,
    scheduler,
  })

  try {
    const runButton = document.querySelector('#search-run')
    const comparisons = document.querySelector('#search-comparisons')

    selectSearchAlgorithm(document, 'linear')
    setSearchTarget(document, '30')

    runButton.click()
    scheduler.advance(600 * 3)

    assert.equal(comparisons.textContent, '3')
    assert.equal(runButton.textContent.trim(), 'Chạy lại')
    assert.equal(runButton.disabled, false)
    assert.equal(scheduler.pendingCount, 0)

    runButton.click()
    assert.equal(comparisons.textContent, '0')

    scheduler.advance(600)
    assert.equal(comparisons.textContent, '1')
  } finally {
    cleanup()
  }
})

// --- Learning Panel của Searching ---

function getSearchComplexity(document) {
  return ['best', 'average', 'worst', 'space'].map(
    (name) => document.querySelector(`#search-complexity-${name}`).textContent,
  )
}

function getSearchPseudocodeLines(document) {
  return [...document.querySelectorAll('#search-learning-pseudocode .pseudocode-line')].map(
    (line) => line.textContent,
  )
}

test('Learning Panel Searching hiển thị lý thuyết và Big-O của Linear Search', async () => {
  const { linearSearchPseudocode } = await import('../src/algorithms/linearSearch.js')
  const { window, document, cleanup } = await setupSearching()

  try {
    selectSearchAlgorithm(document, 'linear')

    assert.equal(document.querySelector('#search-complexity-title').textContent, 'LINEAR SEARCH')
    assert.deepEqual(getSearchComplexity(document), ['O(1)', 'O(n)', 'O(n)', 'O(1)'])
    assert.deepEqual(getSearchPseudocodeLines(document), linearSearchPseudocode)
    assert.match(document.querySelector('#search-learning-description').textContent, /xuất hiện đầu tiên/)
    assert.match(document.querySelector('#search-learning-advantages').textContent, /không cần mảng đã sắp xếp/i)
    assert.notEqual(document.querySelector('#search-learning-disadvantages').textContent, '')
  } finally {
    cleanup()
  }
})

test('Learning Panel Searching hiển thị lý thuyết và Big-O của Binary Search', async () => {
  const { binarySearchPseudocode } = await import('../src/algorithms/binarySearch.js')
  const { window, document, cleanup } = await setupSearching()

  try {
    selectSearchAlgorithm(document, 'binary')

    assert.equal(document.querySelector('#search-complexity-title').textContent, 'BINARY SEARCH')
    assert.deepEqual(getSearchComplexity(document), ['O(1)', 'O(log n)', 'O(log n)', 'O(1)'])
    assert.deepEqual(getSearchPseudocodeLines(document), binarySearchPseudocode)
    assert.match(document.querySelector('#search-learning-description').textContent, /đã sắp xếp/)
    // Có phần tử trùng thì Binary Search có thể trả về bất kỳ vị trí khớp nào.
    assert.match(document.querySelector('#search-learning-disadvantages').textContent, /bất kỳ vị trí/)
    assert.match(document.querySelector('#search-learning-advantages').textContent, /⌊log₂ n⌋ \+ 1/)
  } finally {
    cleanup()
  }
})

test('đổi lại Linear Search thì Learning Panel quay về nội dung Linear', async () => {
  const { window, document, cleanup } = await setupSearching()

  try {
    selectSearchAlgorithm(document, 'binary')
    selectSearchAlgorithm(document, 'linear')

    assert.equal(document.querySelector('#search-complexity-title').textContent, 'LINEAR SEARCH')
    assert.equal(getSearchPseudocodeLines(document).length, 4)
  } finally {
    cleanup()
  }
})

// --- Searching: tô mã giả và hiển thị mục tiêu / giá trị đang xét từ dữ liệu bước ---

function getSearchActiveLines(document) {
  return [...document.querySelectorAll('#search-learning-pseudocode .pseudocode-line.is-active')].map(
    (line) => ({ line: Number(line.dataset.line), ariaCurrent: line.getAttribute('aria-current') }),
  )
}

function getSearchStepInfo(document) {
  return {
    target: document.querySelector('#search-target-value').textContent,
    current: document.querySelector('#search-current-value').textContent,
  }
}

function lockTarget(document, value) {
  const input = document.querySelector('#search-target')

  input.value = value
  input.dispatchEvent(new document.defaultView.Event('change', { bubbles: true }))
}

const nineNumbers = [10, 20, 30, 40, 50, 60, 70, 80, 90]

test('Linear Search tô dòng mã giả và hiển thị giá trị đang xét theo từng bước', async () => {
  const { document, cleanup } = await setupSearching({ initialNumbers: nineNumbers })

  try {
    selectSearchAlgorithm(document, 'linear')
    lockTarget(document, '95')

    const next = document.querySelector('#search-next')

    assert.deepEqual(getSearchActiveLines(document), [])
    assert.deepEqual(getSearchStepInfo(document), { target: '—', current: '—' })

    next.click()
    assert.deepEqual(getSearchActiveLines(document), [{ line: 2, ariaCurrent: 'step' }])
    assert.deepEqual(getSearchStepInfo(document), { target: '95', current: '10 (vị trí 1)' })

    for (let i = 1; i < nineNumbers.length; i++) next.click()
    assert.deepEqual(getSearchActiveLines(document), [{ line: 2, ariaCurrent: 'step' }])
    assert.deepEqual(getSearchStepInfo(document), { target: '95', current: '90 (vị trí 9)' })

    next.click()
    assert.deepEqual(getSearchActiveLines(document), [{ line: 4, ariaCurrent: 'step' }])
    assert.deepEqual(getSearchStepInfo(document), { target: '95', current: '—' })

    document.querySelector('#search-previous').click()
    assert.deepEqual(getSearchActiveLines(document), [{ line: 2, ariaCurrent: 'step' }])
  } finally {
    cleanup()
  }
})

test('Binary Search [42] tìm 99 tô dòng 7 rồi dòng 10', async () => {
  const { document, cleanup } = await setupSearching({ initialNumbers: [42] })

  try {
    selectSearchAlgorithm(document, 'binary')
    lockTarget(document, '99')

    const next = document.querySelector('#search-next')

    next.click()
    assert.deepEqual(getSearchActiveLines(document), [{ line: 7, ariaCurrent: 'step' }])
    assert.deepEqual(getSearchStepInfo(document), { target: '99', current: '42 (vị trí 1)' })

    next.click()
    assert.deepEqual(getSearchActiveLines(document), [{ line: 10, ariaCurrent: 'step' }])
  } finally {
    cleanup()
  }
})

test('gõ mục tiêu mới hoặc Đặt lại thì bỏ tô mã giả và xóa mục tiêu đã chốt', async () => {
  const { document, cleanup } = await setupSearching({ initialNumbers: nineNumbers })

  try {
    selectSearchAlgorithm(document, 'linear')
    lockTarget(document, '30')
    document.querySelector('#search-next').click()
    assert.equal(getSearchActiveLines(document).length, 1)

    const input = document.querySelector('#search-target')
    input.value = '3'
    input.dispatchEvent(new document.defaultView.Event('input', { bubbles: true }))

    assert.deepEqual(getSearchActiveLines(document), [])
    assert.deepEqual(getSearchStepInfo(document), { target: '—', current: '—' })

    lockTarget(document, '30')
    document.querySelector('#search-next').click()
    document.querySelector('#search-reset').click()

    assert.deepEqual(getSearchActiveLines(document), [])
    assert.deepEqual(getSearchStepInfo(document), { target: '—', current: '—' })
  } finally {
    cleanup()
  }
})

test('Searching chạy tự động thì dòng được tô đi theo từng tick', async () => {
  const scheduler = createFakeScheduler()
  const { document, cleanup } = await setupSearching({ initialNumbers: nineNumbers, scheduler })

  try {
    selectSearchAlgorithm(document, 'binary')
    lockTarget(document, '20')
    document.querySelector('#search-run').click()

    const speed = Number(document.querySelector('#search-speed').value)

    scheduler.advance(speed)
    assert.deepEqual(getSearchActiveLines(document), [{ line: 9, ariaCurrent: 'step' }])

    scheduler.advance(speed)
    assert.deepEqual(getSearchActiveLines(document), [{ line: 5, ariaCurrent: 'step' }])
    assert.deepEqual(getSearchStepInfo(document), { target: '20', current: '20 (vị trí 2)' })
  } finally {
    cleanup()
  }
})

// Chú giải màu của Tìm kiếm phải theo thuật toán đang chọn: Linear dùng is-checked (không bao giờ is-eliminated),
// Binary dùng is-eliminated (không bao giờ is-checked). Các mục bị ẩn bằng thuộc tính hidden.
const LEGEND_LINEAR = ['Đang kiểm tra', 'Đã kiểm tra', 'Tìm thấy']
const LEGEND_BINARY = ['Đang kiểm tra', 'Đã loại bỏ', 'Tìm thấy']

const visibleLegend = (document) => [...document.querySelectorAll('#search-legend [data-algorithms]')]
  .filter((item) => !item.hidden)
  .map((item) => item.textContent.replace(/\s+/g, ' ').trim())

function chooseAlgorithm(app, algorithm) {
  const select = app.document.querySelector('#search-algorithm')
  select.value = algorithm
  select.dispatchEvent(new app.window.Event('change'))
}

test('chú giải Tìm kiếm: Linear hiện 3 mục (không có "Đã loại bỏ"), Binary hiện 3 mục (không có "Đã kiểm tra")', async () => {
  const app = await setupSearching()

  try {
    assert.deepEqual(visibleLegend(app.document), LEGEND_LINEAR, 'mặc định là Linear Search')
    chooseAlgorithm(app, 'binary')
    assert.deepEqual(visibleLegend(app.document), LEGEND_BINARY)
    chooseAlgorithm(app, 'linear')
    assert.deepEqual(visibleLegend(app.document), LEGEND_LINEAR)
  } finally {
    app.cleanup()
  }
})

test('chú giải Tìm kiếm không rò trạng thái khi chuyển qua lại Linear và Binary nhiều lần (kể cả giữa lúc đang chạy)', async () => {
  const app = await setupSearching()

  try {
    const { document, window } = app
    const expected = { linear: LEGEND_LINEAR, binary: LEGEND_BINARY }
    const sequence = ['binary', 'linear', 'linear', 'binary', 'binary', 'linear', 'binary', 'linear']

    for (const [index, algorithm] of sequence.entries()) {
      chooseAlgorithm(app, algorithm)
      assert.deepEqual(visibleLegend(document), expected[algorithm], `lần chuyển ${index + 1} sang ${algorithm}`)

      if (index % 2 === 0) {
        const targetInput = document.querySelector('#search-target')
        targetInput.value = document.querySelector('#search-array .search-cell').textContent
        targetInput.dispatchEvent(new window.Event('change'))
        document.querySelector('#search-next').click()
        assert.deepEqual(visibleLegend(document), expected[algorithm], `sau khi chạy một bước (${algorithm})`)
      }
    }
  } finally {
    app.cleanup()
  }
})

test('chú giải Tìm kiếm khớp đúng các trạng thái ô mà từng thuật toán thực sự dùng (đối chiếu từ lần chạy thật)', async () => {
  const stateOf = { 'Đang kiểm tra': 'is-current', 'Đã kiểm tra': 'is-checked', 'Đã loại bỏ': 'is-eliminated', 'Tìm thấy': 'is-found' }

  for (const algorithm of ['linear', 'binary']) {
    const app = await setupSearching()

    try {
      const { document, window } = app
      chooseAlgorithm(app, algorithm)
      const values = [...document.querySelectorAll('#search-array .search-cell')].map((cell) => cell.textContent)
      const used = new Set()

      for (const target of [values[0], values[values.length - 1], values[Math.floor(values.length / 2)], '5']) {
        const targetInput = document.querySelector('#search-target')
        targetInput.value = target
        targetInput.dispatchEvent(new window.Event('change'))
        document.querySelector('#search-reset').click()

        for (let step = 0; step < 30; step++) {
          document.querySelector('#search-next').click()
          for (const cell of document.querySelectorAll('#search-array .search-cell')) {
            for (const name of cell.classList) if (name.startsWith('is-')) used.add(name)
          }
        }
      }

      const legendStates = visibleLegend(document).map((label) => stateOf[label])
      assert.deepEqual([...used].sort(), [...legendStates].sort(), `${algorithm}: trạng thái ô đã dùng so với chú giải đang hiện`)
    } finally {
      app.cleanup()
    }
  }
})
