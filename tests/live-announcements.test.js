import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { readFile } from 'node:fs/promises'
import { initLibraryFilter } from '../src/library-filter.js'
import { createFakeScheduler } from './helpers/fake-scheduler.js'
import { initNavigation } from '../src/navigation.js'

const template = await readFile(new URL('../public/templates/app.html', import.meta.url), 'utf8')

test('R7c Library: nhập dồn chỉ giữ một timer, quay lại không lộ announcement cũ', () => {
  const window = new Window()
  const { document } = window
  const scheduler = createFakeScheduler()
  try {
    document.body.innerHTML = template
    initNavigation(document)
    initLibraryFilter(document, { scheduler })
    const $ = (selector) => document.querySelector(selector)
    const go = (page) => $(`.nav-item[data-page="${page}"]`).click()
    const type = (value) => {
      $('.library-search-input').value = value
      $('.library-search-input').dispatchEvent(new window.Event('input'))
    }
    go('structures')
    for (const value of ['d', 'do', 'do t', 'do thi']) {
      type(value)
      assert.equal(scheduler.pendingCount, 1, 'nhập dồn chỉ giữ timer cuối')
      scheduler.advance(30)
    }
    scheduler.advance(275)
    assert.equal(scheduler.pendingCount, 0)
    assert.equal($('.library-announcement').textContent, 'Hiển thị 1 mục')
    type('khong ton tai')
    go('dashboard')
    assert.equal(scheduler.pendingCount, 0, 'điều hướng thật hủy debounce')
    assert.equal($('.library-announcement').textContent, '', 'rời Library xóa announcement cũ')
    scheduler.advance(500)
    go('structures')
    assert.equal($('.library-filters').hidden, false)
    assert.equal($('.library-count').textContent, 'Hiển thị 0 mục')
    const onReturn = $('.library-announcement').textContent
    assert.equal(scheduler.pendingCount, 1)
    scheduler.advance(275)
    assert.equal($('.library-announcement').textContent, 'Hiển thị 0 mục')
    assert.equal(scheduler.pendingCount, 0)
    assert.equal(onReturn, '', 'quay lại chờ debounce mới, không giữ announcement cũ')
  } finally { window.happyDOM.close() }
})

test('Library: lọc tức thời, debounce riêng live, bỏ trùng và hủy khi rời màn', () => {
  const window = new Window()
  const { document } = window
  const scheduler = createFakeScheduler()
  try {
    document.body.innerHTML = template
    const $ = (selector) => document.querySelector(selector)
    $('.library-tabs').hidden = false
    initLibraryFilter(document, { scheduler })
    const navigate = (page) => document.dispatchEvent(new window.CustomEvent('algovision:viewchange', { detail: { page } }))
    const type = (value) => {
      $('.library-search-input').value = value
      $('.library-search-input').dispatchEvent(new window.Event('input'))
    }
    navigate('structures')
    $('.library-search-input').focus()
    type('do')
    scheduler.advance(200)
    type('do thi')
    assert.equal($('.library-count').textContent, 'Hiển thị 1 mục', 'số lượng đổi ngay')
    scheduler.advance(274)
    assert.equal($('.library-announcement').textContent, '', 'chưa đủ debounce')
    scheduler.advance(1)
    assert.equal($('.library-announcement').textContent, 'Hiển thị 1 mục')
    const observer = new window.MutationObserver(() => {})
    observer.observe($('.library-announcement'), { childList: true, subtree: true, characterData: true })
    type('Đồ thị')
    scheduler.advance(275)
    assert.equal(observer.takeRecords().length, 0, 'không ghi lại thông điệp trùng')
    observer.disconnect()
    type('khong ton tai')
    navigate('dashboard')
    assert.equal(scheduler.pendingCount, 0, 'rời màn hủy thông báo chờ')
    scheduler.advance(500)
    assert.equal($('.library-announcement').textContent, '', 'không giữ hoặc phát kết quả cũ muộn')
    assert.ok(document.activeElement === $('.library-search-input'), 'không đổi focus bằng mã')
  } finally { window.happyDOM.close() }
})

test('Queue: chỉ status là live region, vùng vẽ vẫn có tên và focus bàn phím', () => {
  const window = new Window()
  try {
    window.document.body.innerHTML = template
    const visualizer = window.document.querySelector('#queue-visualizer')
    assert.ok(!visualizer.hasAttribute('aria-live'), 'vùng vẽ không đọc lại cả Queue')
    assert.equal(visualizer.getAttribute('role'), 'group')
    assert.equal(visualizer.getAttribute('tabindex'), '0')
    assert.equal(window.document.querySelector('#queue-status').getAttribute('role'), 'status')
  } finally { window.happyDOM.close() }
})
