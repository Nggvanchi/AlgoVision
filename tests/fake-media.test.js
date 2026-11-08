import test from 'node:test'
import assert from 'node:assert/strict'

import { createFakeMatchMedia, evaluateQuery, DESKTOP_WIDTH, NARROW_WIDTH } from './helpers/fake-media.js'

// Helper matchMedia giả (R3): tính matches theo bề rộng cho từng query và chỉ báo 'change' cho query đổi kết quả.
test('evaluateQuery: max-width, min-width và "min and max" tính đúng ở biên (767/768 và 1279/1280)', () => {
  assert.equal(evaluateQuery('(max-width: 767px)', 767), true)
  assert.equal(evaluateQuery('(max-width: 767px)', 768), false)
  assert.equal(evaluateQuery('(min-width: 768px)', 767), false)
  assert.equal(evaluateQuery('(min-width: 768px) and (max-width: 1279px)', 768), true)
  assert.equal(evaluateQuery('(min-width: 768px) and (max-width: 1279px)', 1279), true)
  assert.equal(evaluateQuery('(min-width: 768px) and (max-width: 1279px)', 1280), false)
  assert.equal(evaluateQuery('(min-width: 768px) and (max-width: 1279px)', 767), false)
})

test('evaluateQuery ném lỗi với query không hiểu được (không lặng lẽ trả false)', () => {
  assert.throws(() => evaluateQuery('(prefers-reduced-motion: reduce)', 1000), /không hiểu/)
})

test('createFakeMatchMedia: mặc định desktop 1280; true = hẹp 600; số = bề rộng đó', () => {
  assert.equal(createFakeMatchMedia().currentWidth(), DESKTOP_WIDTH)
  assert.equal(createFakeMatchMedia(false).currentWidth(), DESKTOP_WIDTH)
  assert.equal(createFakeMatchMedia(true).currentWidth(), NARROW_WIDTH)
  assert.equal(createFakeMatchMedia(1024).currentWidth(), 1024)
})

test('setWidth chỉ gọi listener của query đổi kết quả; setMatches giữ nghĩa cũ (true = hẹp, false = rộng)', () => {
  const media = createFakeMatchMedia(1280)
  const drawer = media.matchMedia('(max-width: 767px)')
  const rail = media.matchMedia('(min-width: 768px) and (max-width: 1279px)')
  const log = []

  drawer.addEventListener('change', (event) => log.push(['drawer', event.matches]))
  rail.addEventListener('change', (event) => log.push(['rail', event.matches]))

  media.setWidth(1024)
  assert.deepEqual(log, [['rail', true]], 'chỉ rail đổi khi 1280 -> 1024')
  assert.equal(drawer.matches, false)
  assert.equal(rail.matches, true)

  media.setWidth(700)
  assert.deepEqual(log.slice(1), [['drawer', true], ['rail', false]])

  media.setWidth(600)
  assert.equal(log.length, 3, 'không đổi kết quả thì không báo')

  media.setMatches(false)
  assert.equal(media.currentWidth(), DESKTOP_WIDTH)
  assert.equal(drawer.matches, false)
})

test('removeEventListener gỡ listener; listenerCount đếm đúng', () => {
  const media = createFakeMatchMedia(1280)
  const query = media.matchMedia('(max-width: 767px)')
  const listener = () => {}

  query.addEventListener('change', listener)
  assert.equal(media.listenerCount(), 1)
  query.removeEventListener('change', listener)
  assert.equal(media.listenerCount(), 0)
})
