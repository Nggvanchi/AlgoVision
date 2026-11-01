
import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'

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

async function withSortingDom(run) {
  const window = new Window()
  const { document } = window

  document.body.innerHTML = template

  const previousDocument = globalThis.document
  const previousWindow = globalThis.window

  globalThis.document = document
  globalThis.window = window

  try {
    const { initSorting } = await import('../src/sorting.js')

    initSorting()

    await run({ document, window })
  } finally {
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
