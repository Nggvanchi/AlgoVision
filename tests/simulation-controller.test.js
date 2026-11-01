import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createSimulationController,
  getControlState,
} from '../src/simulation-controller.js'
import { createFakeScheduler } from './helpers/fake-scheduler.js'

const STEPS = ['s0', 's1', 's2', 's3']

function setup({ delay = 100, steps = STEPS } = {}) {
  const scheduler = createFakeScheduler()
  const changes = []
  const settings = { delay }

  const controller = createSimulationController({
    getDelay: () => settings.delay,
    onChange: (snapshot) => changes.push(snapshot),
    scheduler,
  })

  controller.load(steps)

  return { controller, scheduler, changes, settings }
}

test('bảng trạng thái nút khớp đặc tả', () => {
  assert.deepEqual(getControlState('idle', 0), {
    run: true, runMode: 'start', pause: false, next: true, previous: false, reset: true,
  })
  assert.deepEqual(getControlState('running', 2), {
    run: false, runMode: null, pause: true, next: false, previous: false, reset: true,
  })
  assert.deepEqual(getControlState('paused', 0), {
    run: true, runMode: 'resume', pause: false, next: true, previous: false, reset: true,
  })
  assert.deepEqual(getControlState('paused', 2), {
    run: true, runMode: 'resume', pause: false, next: true, previous: true, reset: true,
  })
  assert.deepEqual(getControlState('completed', 3), {
    run: true, runMode: 'restart', pause: false, next: false, previous: true, reset: true,
  })
})

test('load đưa controller về idle ở bước đầu', () => {
  const { controller, changes } = setup()
  const snapshot = controller.getSnapshot()

  assert.equal(snapshot.state, 'idle')
  assert.equal(snapshot.stepIndex, 0)
  assert.equal(snapshot.stepCount, 4)
  assert.equal(snapshot.step, 's0')
  assert.equal(changes.length, 1)
})

test('Next từ idle chuyển sang paused và cho phép Bước trước', () => {
  const { controller } = setup()

  controller.next()

  const snapshot = controller.getSnapshot()
  assert.equal(snapshot.state, 'paused')
  assert.equal(snapshot.stepIndex, 1)
  assert.equal(snapshot.controls.previous, true)
})

test('Next tới bước cuối chuyển sang completed', () => {
  const { controller } = setup()

  controller.next()
  controller.next()
  controller.next()

  assert.equal(controller.getSnapshot().state, 'completed')
  assert.equal(controller.getSnapshot().stepIndex, 3)

  controller.next()
  assert.equal(controller.getSnapshot().stepIndex, 3)
})

test('Run tự chạy từng bước theo getDelay và dừng khi hoàn thành', () => {
  const { controller, scheduler } = setup({ delay: 100 })

  controller.run()
  assert.equal(controller.getSnapshot().state, 'running')
  assert.equal(controller.getSnapshot().stepIndex, 0)

  scheduler.advance(99)
  assert.equal(controller.getSnapshot().stepIndex, 0)

  scheduler.advance(1)
  assert.equal(controller.getSnapshot().stepIndex, 1)

  scheduler.advance(200)
  assert.equal(controller.getSnapshot().stepIndex, 3)
  assert.equal(controller.getSnapshot().state, 'completed')
  assert.equal(scheduler.pendingCount, 0)
})

test('đổi tốc độ khi đang chạy không tạo lại timer, áp dụng từ tick sau', () => {
  const { controller, scheduler, settings } = setup({ delay: 100 })

  controller.run()
  settings.delay = 300

  scheduler.advance(100)
  assert.equal(controller.getSnapshot().stepIndex, 1)

  scheduler.advance(299)
  assert.equal(controller.getSnapshot().stepIndex, 1)

  scheduler.advance(1)
  assert.equal(controller.getSnapshot().stepIndex, 2)

  assert.deepEqual(scheduler.scheduledDelays, [100, 300, 300])
  assert.equal(scheduler.cancelCount, 0)
})

test('luôn có tối đa một timer: Run lặp lại khi đang chạy không tạo thêm', () => {
  const { controller, scheduler } = setup()

  controller.run()
  controller.run()
  controller.run()

  assert.equal(scheduler.pendingCount, 1)
})

test('Pause dừng timer, Run tiếp tục từ bước hiện tại', () => {
  const { controller, scheduler } = setup({ delay: 100 })

  controller.run()
  scheduler.advance(100)
  controller.pause()

  assert.equal(controller.getSnapshot().state, 'paused')
  assert.equal(controller.getSnapshot().controls.runMode, 'resume')
  assert.equal(scheduler.pendingCount, 0)

  scheduler.advance(1000)
  assert.equal(controller.getSnapshot().stepIndex, 1)

  controller.run()
  scheduler.advance(100)
  assert.equal(controller.getSnapshot().stepIndex, 2)
})

test('Pause khi không chạy không làm gì', () => {
  const { controller } = setup()

  controller.pause()

  assert.equal(controller.getSnapshot().state, 'idle')
})

test('Run sau khi hoàn thành chạy lại từ đầu', () => {
  const { controller, scheduler } = setup({ delay: 100 })

  controller.run()
  scheduler.advance(300)
  assert.equal(controller.getSnapshot().state, 'completed')
  assert.equal(controller.getSnapshot().controls.runMode, 'restart')

  controller.run()
  assert.equal(controller.getSnapshot().state, 'running')
  assert.equal(controller.getSnapshot().stepIndex, 0)

  scheduler.advance(100)
  assert.equal(controller.getSnapshot().stepIndex, 1)
})

test('Bước trước từ completed quay lại bước trước đó ở trạng thái paused', () => {
  const { controller } = setup()

  controller.next()
  controller.next()
  controller.next()
  controller.previous()

  assert.equal(controller.getSnapshot().state, 'paused')
  assert.equal(controller.getSnapshot().stepIndex, 2)
})

test('Bước trước bị bỏ qua khi đang chạy hoặc ở bước đầu', () => {
  const { controller } = setup()

  controller.previous()
  assert.equal(controller.getSnapshot().stepIndex, 0)

  controller.next()
  controller.run()
  controller.previous()

  assert.equal(controller.getSnapshot().state, 'running')
  assert.equal(controller.getSnapshot().stepIndex, 1)
})

test('Next bị bỏ qua khi đang chạy', () => {
  const { controller } = setup()

  controller.run()
  controller.next()

  assert.equal(controller.getSnapshot().stepIndex, 0)
})

test('Reset khi đang chạy dừng timer và về idle ở bước đầu', () => {
  const { controller, scheduler } = setup({ delay: 100 })

  controller.run()
  scheduler.advance(200)
  controller.reset()

  assert.equal(controller.getSnapshot().state, 'idle')
  assert.equal(controller.getSnapshot().stepIndex, 0)
  assert.equal(scheduler.pendingCount, 0)
})

test('load khi đang chạy dừng timer cũ', () => {
  const { controller, scheduler } = setup()

  controller.run()
  controller.load(['a', 'b'])

  assert.equal(scheduler.pendingCount, 0)
  assert.equal(controller.getSnapshot().state, 'idle')
  assert.equal(controller.getSnapshot().step, 'a')
})

test('không có bước nào thì Run và Next không làm gì', () => {
  const { controller, scheduler } = setup({ steps: [] })

  controller.run()
  controller.next()

  const snapshot = controller.getSnapshot()
  assert.equal(snapshot.state, 'idle')
  assert.equal(snapshot.step, undefined)
  assert.equal(scheduler.pendingCount, 0)
})

test('onChange nhận snapshot sau mỗi thay đổi', () => {
  const { controller, changes } = setup()

  controller.next()

  assert.equal(changes.at(-1).stepIndex, 1)
  assert.equal(changes.at(-1).state, 'paused')
})
