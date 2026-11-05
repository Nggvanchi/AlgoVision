import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'

// Namespace import: file này đỏ từng test (không sập cả file) khi bootstrap.js chưa có export.
import * as bootstrap from '../src/bootstrap.js'

const TEMPLATE = '<main id="loaded-marker">Giao diện đã tải</main>'

// Cửa sổ happy-dom chỉ được giải phóng khi close() (abort() không giải phóng DOM): đóng sau mỗi test.
const openWindows = []
afterEach(() => Promise.all(openWindows.splice(0).map((window) => window.happyDOM.close())))

function createRoot() {
  const window = new Window()
  openWindows.push(window)
  const root = window.document.createElement('div')
  root.id = 'app'
  window.document.body.appendChild(root)
  return { document: window.document, root }
}

// Hàng đợi kết quả cho fetch giả: mỗi lần gọi lấy một kết quả; 'reject' | { status } | 'hang' (treo tới khi gọi release).
function createFakeFetch(script) {
  const calls = []
  const pending = []
  const fetchImpl = (url) => {
    calls.push(url)
    const outcome = script[Math.min(calls.length - 1, script.length - 1)]
    if (outcome === 'hang') {
      return new Promise((resolve, reject) => pending.push({ resolve, reject }))
    }
    if (outcome instanceof Error) return Promise.reject(outcome)
    return Promise.resolve(outcome)
  }
  return { fetchImpl, calls, pending }
}

const okResponse = (text = TEMPLATE) => ({ ok: true, status: 200, text: () => Promise.resolve(text) })
const httpError = (status) => ({ ok: false, status, text: () => Promise.resolve('') })

// Xả hết microtask đang chờ mà không dùng timer thật.
async function settle() {
  for (let index = 0; index < 20; index++) await Promise.resolve()
}

function boot(root, script) {
  const fake = createFakeFetch(script)
  let starts = 0
  const done = bootstrap.bootApp(root, { fetchImpl: fake.fetchImpl, start: () => { starts++ } })
  return { ...fake, done, starts: () => starts }
}

const alerts = (root) => root.querySelectorAll('[role="alert"]')
const buttons = (root) => root.querySelectorAll('button')

test('tải thành công: dựng template vào #app và gọi start đúng một lần, không có màn hình lỗi', async () => {
  const { root } = createRoot()
  const run = boot(root, [okResponse()])
  await run.done
  assert.ok(root.querySelector('#loaded-marker') !== null, 'template phải được dựng vào #app')
  assert.ok(alerts(root).length === 0, 'không được có vùng báo lỗi khi tải thành công')
  assert.equal(run.starts(), 1)
  assert.deepEqual(run.calls, ['/templates/app.html'])
})

test('(a) fetch reject (mất mạng): hiện vùng role="alert" có thông báo cố định + chi tiết, có nút Thử lại; không gọi start', async () => {
  const { root } = createRoot()
  const run = boot(root, [new TypeError('Failed to fetch')])
  await run.done
  assert.equal(alerts(root).length, 1, 'phải có đúng một vùng role="alert"')
  assert.ok(root.querySelector('#loaded-marker') === null, 'không được dựng template khi tải lỗi')
  const text = alerts(root)[0].textContent
  assert.match(text, /Không thể tải giao diện AlgoVision/)
  assert.match(text, /Failed to fetch/)
  assert.equal(buttons(root).length, 1)
  assert.equal(buttons(root)[0].textContent.trim(), 'Thử lại')
  assert.equal(buttons(root)[0].type, 'button')
  assert.equal(run.starts(), 0)
})

test('(b) response.ok=false (404): fetch không reject nhưng vẫn ra màn hình lỗi kèm mã trạng thái', async () => {
  const { root } = createRoot()
  const run = boot(root, [httpError(404)])
  await run.done
  assert.equal(alerts(root).length, 1)
  assert.match(alerts(root)[0].textContent, /404/)
  assert.ok(root.querySelector('#loaded-marker') === null, 'trang 404 không được dựng làm giao diện')
  assert.equal(run.starts(), 0)
})

test('(c) response.ok=false (500): ra màn hình lỗi kèm mã 500', async () => {
  const { root } = createRoot()
  const run = boot(root, [httpError(500)])
  await run.done
  assert.equal(alerts(root).length, 1)
  assert.match(alerts(root)[0].textContent, /500/)
  assert.equal(run.starts(), 0)
})

test('(i) response.text() reject cũng ra màn hình lỗi, không sập module', async () => {
  const { root } = createRoot()
  const response = { ok: true, status: 200, text: () => Promise.reject(new Error('Đứt kết nối giữa chừng')) }
  const run = boot(root, [response])
  await run.done
  assert.equal(alerts(root).length, 1)
  assert.match(alerts(root)[0].textContent, /Đứt kết nối giữa chừng/)
  assert.equal(run.starts(), 0)
})

test('(d) lần 1 thất bại, bấm "Thử lại", lần 2 thành công: dựng app, bỏ màn hình lỗi, start đúng một lần', async () => {
  const { root } = createRoot()
  const run = boot(root, [new TypeError('Failed to fetch'), okResponse()])
  await run.done
  buttons(root)[0].click()
  await settle()
  assert.equal(run.calls.length, 2)
  assert.ok(root.querySelector('#loaded-marker') !== null, 'template phải được dựng sau khi thử lại thành công')
  assert.equal(alerts(root).length, 0, 'màn hình lỗi phải biến mất')
  assert.equal(buttons(root).length, 0)
  assert.equal(run.starts(), 1)
})

test('(e) thử lại vẫn thất bại: giữ đúng một vùng lỗi và một nút, mỗi lần bấm chỉ gọi fetch một lần, rồi thành công thì start một lần', async () => {
  const { root } = createRoot()
  const run = boot(root, [new TypeError('lỗi 1'), httpError(503), new TypeError('lỗi 3'), okResponse()])
  await run.done
  const button = buttons(root)[0]

  button.click()
  await settle()
  assert.equal(run.calls.length, 2, 'một lần bấm = một lần fetch')
  assert.equal(alerts(root).length, 1)
  assert.equal(buttons(root).length, 1)
  assert.ok(buttons(root)[0] === button, 'phải dùng lại cùng một nút, không dựng nút mới')
  assert.match(alerts(root)[0].textContent, /503/)
  assert.ok(!/lỗi 1/.test(alerts(root)[0].textContent), 'chi tiết lỗi cũ phải được thay, không cộng dồn')

  button.click()
  await settle()
  assert.equal(run.calls.length, 3, 'listener không được nhân đôi: lần bấm thứ hai vẫn chỉ gọi fetch một lần')
  assert.equal(alerts(root).length, 1)
  assert.equal(buttons(root).length, 1)

  button.click()
  await settle()
  assert.equal(run.calls.length, 4)
  assert.equal(run.starts(), 1)
  assert.equal(alerts(root).length, 0)
})

test('(f) vùng lỗi có role="alert", nút là <button> focus được bằng bàn phím và nhận focus khi hiện lỗi', async () => {
  const { document, root } = createRoot()
  const run = boot(root, [httpError(404)])
  await run.done
  const button = buttons(root)[0]
  assert.equal(alerts(root)[0].getAttribute('role'), 'alert')
  assert.equal(button.tagName, 'BUTTON')
  assert.ok(button.getAttribute('tabindex') === null || Number(button.getAttribute('tabindex')) >= 0, 'nút không được bị loại khỏi thứ tự Tab')
  assert.ok(!button.disabled, 'nút phải dùng được')
  assert.ok(document.activeElement === button, 'nút phải nhận focus để bấm Enter/Space ngay')
})

test('(g) thông báo gắn bằng textContent: chuỗi giống HTML trong lỗi không sinh phần tử', async () => {
  const { root } = createRoot()
  const run = boot(root, [new Error('<img src=x onerror="alert(1)"><b>đậm</b>')])
  await run.done
  assert.ok(root.querySelector('img') === null, 'không được có thẻ img sinh từ thông báo lỗi')
  assert.ok(root.querySelector('b') === null, 'không được có thẻ b sinh từ thông báo lỗi')
  assert.ok(alerts(root)[0].textContent.includes('<img src=x onerror="alert(1)"><b>đậm</b>'), 'chuỗi phải hiện nguyên văn như chữ')
})

test('(h) bấm "Thử lại" hai lần khi fetch đang treo: fetch chỉ gọi thêm đúng một lần; thất bại thì nút mở khóa và nhận lại focus', async () => {
  const { document, root } = createRoot()
  const run = boot(root, [new TypeError('lỗi đầu'), 'hang'])
  await run.done
  const button = buttons(root)[0]

  button.click()
  await settle()
  assert.ok(button.disabled, 'nút phải bị khóa trong lúc đang tải lại')
  button.click()
  button.click()
  await settle()
  assert.equal(run.calls.length, 2, 'lần bấm thừa khi đang treo không được gọi fetch thêm')

  run.pending[0].reject(new TypeError('vẫn lỗi'))
  await settle()
  assert.ok(!button.disabled, 'thất bại xong phải mở khóa nút')
  assert.ok(document.activeElement === button, 'thất bại xong nút phải nhận lại focus')
  assert.match(alerts(root)[0].textContent, /vẫn lỗi/)
  assert.equal(alerts(root).length, 1)
  assert.equal(buttons(root).length, 1)
})

test('(j) start ném lỗi: lỗi ném ra bình thường, không hiện màn hình "Thử lại", không retry, start gọi đúng một lần', async () => {
  const { root } = createRoot()
  const fake = createFakeFetch([okResponse()])
  let starts = 0
  await assert.rejects(
    bootstrap.bootApp(root, {
      fetchImpl: fake.fetchImpl,
      start: () => {
        starts++
        throw new Error('init hỏng')
      },
    }),
    /init hỏng/,
  )
  assert.equal(starts, 1, 'start chỉ được gọi một lần, không tự thử lại')
  assert.equal(fake.calls.length, 1, 'không được fetch lại vì lỗi của start')
  assert.equal(alerts(root).length, 0, 'lỗi của start không phải lỗi tải: không hiện vùng role="alert"')
  assert.equal(buttons(root).length, 0, 'không có nút "Thử lại" cho lỗi của start')
})
