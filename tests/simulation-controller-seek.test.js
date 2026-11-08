import test from 'node:test'
import assert from 'node:assert/strict'
import { createSimulationController } from '../src/simulation-controller.js'
import { createFakeScheduler } from './helpers/fake-scheduler.js'
import { generateBubbleSortSteps } from '../src/algorithms/bubbleSort.js'
import { generateSelectionSortSteps } from '../src/algorithms/selectionSort.js'
import { generateInsertionSortSteps } from '../src/algorithms/insertionSort.js'
import { generateLinearSearchSteps } from '../src/algorithms/linearSearch.js'
import { generateBinarySearchSteps } from '../src/algorithms/binarySearch.js'
import { generateBstInsertSteps } from '../src/algorithms/bstInsert.js'
import { generateHashTableInsertSteps } from '../src/algorithms/hashTableInsert.js'
import { generateGraphBfsSteps } from '../src/algorithms/graphBfs.js'
import { generateGraphDfsSteps } from '../src/algorithms/graphDfs.js'
import { buildTree } from '../src/structures/bst.js'
import { createHashTable } from '../src/structures/hashTable.js'
import { buildGraph, listVertices } from '../src/structures/graph.js'

// Bước giả: đối tượng khác nhau theo chỉ số để so sánh bằng định danh.
const makeSteps = (count) => Array.from({ length: count }, (_, index) => ({ index }))

function setup(stepCount = 5) {
  const scheduler = createFakeScheduler()
  const snapshots = []
  const controller = createSimulationController({
    getDelay: () => 100,
    onChange: (snapshot) => snapshots.push(snapshot),
    scheduler,
  })

  controller.load(makeSteps(stepCount))
  snapshots.length = 0

  return { controller, scheduler, snapshots }
}

test('seek tới chỉ số hợp lệ: dừng ở đúng bước, trạng thái paused, một lần onChange', () => {
  const { controller, snapshots } = setup()

  controller.seek(2)

  assert.equal(snapshots.length, 1, 'đúng một lần onChange')
  assert.equal(controller.getSnapshot().stepIndex, 2)
  assert.equal(controller.getSnapshot().state, 'paused')
  assert.equal(controller.getSnapshot().step.index, 2)
})

test('seek kẹp cận dưới và cận trên, kể cả ±Infinity', () => {
  const { controller } = setup()

  controller.seek(3)
  controller.seek(-7)
  assert.equal(controller.getSnapshot().stepIndex, 0, 'âm kẹp về 0')

  controller.seek(99)
  assert.equal(controller.getSnapshot().stepIndex, 4, 'quá lớn kẹp về bước cuối')

  controller.seek(2)
  controller.seek(-Infinity)
  assert.equal(controller.getSnapshot().stepIndex, 0, '-Infinity kẹp về 0')

  controller.seek(Infinity)
  assert.equal(controller.getSnapshot().stepIndex, 4, 'Infinity kẹp về bước cuối')
})

test('seek bước đúng bằng số bước (một đoạn quá cuối) vẫn kẹp về bước cuối, không ra ngoài mảng', () => {
  const { controller } = setup()

  controller.seek(5)

  assert.equal(controller.getSnapshot().stepIndex, 4)
  assert.ok(controller.getSnapshot().step !== undefined, 'vẫn có bước hiện tại')
})

test('seek cắt phần thập phân và nhận chuỗi số', () => {
  const { controller } = setup()

  controller.seek(2.9)
  assert.equal(controller.getSnapshot().stepIndex, 2, '2.9 cắt thành 2')

  controller.seek('3')
  assert.equal(controller.getSnapshot().stepIndex, 3, 'chuỗi "3" đổi thành số 3')
})

test('seek bỏ qua giá trị không phải số: không đổi trạng thái, không gọi onChange', () => {
  const { controller, snapshots } = setup()

  controller.seek(2)
  snapshots.length = 0

  controller.seek(NaN)
  controller.seek(undefined)
  controller.seek('abc')

  assert.equal(snapshots.length, 0)
  assert.equal(controller.getSnapshot().stepIndex, 2)
})

test('seek khi chưa có bước nào: không làm gì, không ném lỗi, không gọi onChange', () => {
  const scheduler = createFakeScheduler()
  const snapshots = []
  const controller = createSimulationController({ getDelay: () => 100, onChange: (s) => snapshots.push(s), scheduler })

  controller.load([])
  snapshots.length = 0

  assert.doesNotThrow(() => controller.seek(0))
  assert.doesNotThrow(() => controller.seek(3))
  assert.equal(snapshots.length, 0)
  assert.equal(controller.getSnapshot().state, 'idle')
})

test('đang phát thì seek DỪNG phát: hủy timer, trạng thái paused, một lần onChange', () => {
  const { controller, scheduler, snapshots } = setup()

  controller.run()
  snapshots.length = 0
  const cancelBefore = scheduler.cancelCount

  controller.seek(2)

  assert.equal(controller.getSnapshot().state, 'paused')
  assert.equal(scheduler.pendingCount, 0, 'không còn timer treo')
  assert.equal(scheduler.cancelCount, cancelBefore + 1, 'timer cũ bị hủy đúng một lần')
  assert.equal(snapshots.length, 1)

  scheduler.advance(1000)
  assert.equal(controller.getSnapshot().stepIndex, 2, 'không tự chạy tiếp sau khi nhảy')
  assert.equal(snapshots.length, 1)
})

test('đang phát mà seek đúng chỉ số hiện tại: vẫn dừng phát và notify một lần', () => {
  const { controller, scheduler, snapshots } = setup()

  controller.run()
  snapshots.length = 0

  controller.seek(0)

  assert.equal(controller.getSnapshot().state, 'paused')
  assert.equal(controller.getSnapshot().stepIndex, 0)
  assert.equal(scheduler.pendingCount, 0)
  assert.equal(snapshots.length, 1)
})

test('seek tới bước cuối thì hoàn thành (completed), kể cả khi kẹp từ giá trị quá lớn', () => {
  const { controller, scheduler } = setup()

  controller.run()
  controller.seek(4)

  assert.equal(controller.getSnapshot().state, 'completed')
  assert.equal(scheduler.pendingCount, 0)
  assert.equal(controller.getSnapshot().controls.runMode, 'restart')

  controller.seek(1)
  controller.seek(1000)
  assert.equal(controller.getSnapshot().state, 'completed')
})

test('seek về bước 0 từ idle giữ idle và không notify; từ paused cho paused', () => {
  const { controller, snapshots } = setup()

  controller.seek(0)
  assert.equal(controller.getSnapshot().state, 'idle')
  assert.equal(snapshots.length, 0, 'không đổi gì thì không notify')

  controller.seek(3)
  controller.seek(0)
  assert.equal(controller.getSnapshot().state, 'paused', 'về 0 từ paused: paused (giống Bước trước)')
  assert.equal(controller.getSnapshot().controls.runMode, 'resume')
})

test('seek từ completed về giữa chừng: paused, không còn completed', () => {
  const { controller } = setup()

  controller.seek(4)
  assert.equal(controller.getSnapshot().state, 'completed')

  controller.seek(2)
  assert.equal(controller.getSnapshot().state, 'paused')
  assert.equal(controller.getSnapshot().stepIndex, 2)
})

test('seek từ idle tới giữa chừng: paused; Bước tiếp theo đi tiếp từ đó', () => {
  const { controller } = setup()

  controller.seek(2)
  controller.next()

  assert.equal(controller.getSnapshot().stepIndex, 3)
})

test('seek cùng chỉ số khi không phát: không notify (không đọc lại vùng aria-live)', () => {
  const { controller, snapshots } = setup()

  controller.seek(2)
  snapshots.length = 0

  controller.seek(2)
  controller.seek(2.4)

  assert.equal(snapshots.length, 0)
})

test('mỗi lần seek notify đúng một lần dù nhảy xa; các bước bị nhảy qua không bao giờ tới onChange', () => {
  const { controller, snapshots } = setup(10)

  controller.seek(8)

  assert.equal(snapshots.length, 1)
  assert.equal(snapshots[0].stepIndex, 8)
  assert.ok(snapshots.every((snapshot) => snapshot.step.index === 8), 'chỉ bước đích được thông báo')
})

test('seek không đổi danh sách bước: load lại và run sau seek vẫn chạy từ đầu danh sách', () => {
  const { controller } = setup(4)

  controller.seek(3)
  assert.equal(controller.getSnapshot().stepCount, 4)

  controller.reset()
  assert.equal(controller.getSnapshot().stepIndex, 0)
  assert.equal(controller.getSnapshot().stepCount, 4)
  assert.equal(controller.getSnapshot().state, 'idle')
})

test('seek là hàm của đối tượng controller', () => {
  const { controller } = setup()

  assert.equal(typeof controller.seek, 'function')
})

// --- Trên bước THẬT của cả 5 module ---

const graphOf = () => buildGraph(false, 7, [[0, 1], [0, 2], [1, 2], [2, 3], [4, 5]])
const firstVertexId = (graph) => listVertices(graph)[0].id

const REAL_STEPS = {
  'Sắp xếp nổi bọt': () => generateBubbleSortSteps([5, 2, 8, 1, 9]),
  'Sắp xếp chọn': () => generateSelectionSortSteps([5, 2, 8, 1, 9]),
  'Sắp xếp chèn': () => generateInsertionSortSteps([5, 2, 8, 1, 9]),
  'Tìm tuyến tính': () => generateLinearSearchSteps([4, 8, 15, 16, 23], 16),
  'Tìm nhị phân': () => generateBinarySearchSteps([1, 3, 5, 7, 9, 11], 9),
  'BST chèn': () => generateBstInsertSteps(buildTree([50, 30, 70, 20, 40]), 35),
  'Bảng băm chèn': () => generateHashTableInsertSteps(createHashTable(5), 42),
  'Đồ thị BFS': () => {
    const graph = graphOf()
    return generateGraphBfsSteps(graph, firstVertexId(graph), 'list')
  },
  'Đồ thị DFS': () => {
    const graph = graphOf()
    return generateGraphDfsSteps(graph, firstVertexId(graph), 'list')
  },
}

for (const [name, makeRealSteps] of Object.entries(REAL_STEPS)) {
  test(`${name}: seek(k) cho đúng ảnh chụp như bấm Bước tiếp theo k lần, bước bị nhảy qua không tới onChange`, () => {
    const steps = makeRealSteps()
    assert.ok(steps.length >= 3, 'cần đủ bước để nhảy')

    for (let k = 0; k < steps.length; k++) {
      const viaNext = createSimulationController({ getDelay: () => 1, scheduler: createFakeScheduler() })
      viaNext.load(steps)
      for (let i = 0; i < k; i++) viaNext.next()

      const notified = []
      const viaSeek = createSimulationController({
        getDelay: () => 1,
        onChange: (snapshot) => notified.push(snapshot.stepIndex),
        scheduler: createFakeScheduler(),
      })
      viaSeek.load(steps)
      notified.length = 0
      viaSeek.seek(k)

      const expected = viaNext.getSnapshot()
      const actual = viaSeek.getSnapshot()

      assert.ok(actual.step === expected.step, `bước ${k} phải là cùng đối tượng bước`)
      assert.equal(actual.stepIndex, expected.stepIndex)
      assert.equal(actual.stepCount, steps.length)
      assert.equal(actual.state, k === 0 ? 'idle' : expected.state, `trạng thái tại bước ${k}`)
      assert.deepEqual(notified, k === 0 ? [] : [k], `chỉ bước đích ${k} được thông báo`)
    }
  })
}
