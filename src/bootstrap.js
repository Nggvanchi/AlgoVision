export const TEMPLATE_URL = '/templates/app.html'

const ERROR_TITLE = 'Không thể tải giao diện AlgoVision.'
const ERROR_HINT = 'Kiểm tra kết nối mạng rồi thử lại.'

// Tải template; mọi lỗi (mất mạng, HTTP lỗi, đọc nội dung dở dang) đều thành Error để một chỗ xử lý.
// fetch KHÔNG reject với 404/500 nên phải kiểm response.ok.
async function loadTemplate(fetchImpl) {
  const response = await fetchImpl(TEMPLATE_URL)

  if (!response.ok) {
    throw new Error(`Mã trạng thái HTTP ${response.status}`)
  }

  return response.text()
}

// Màn hình lỗi dựng đúng một lần; các lần thất bại sau chỉ đổi chữ chi tiết, mở khóa nút và trả focus
// (không dựng thêm phần tử, không gắn thêm listener). Mọi chữ gắn bằng textContent.
function createErrorView(root, onRetry) {
  const document = root.ownerDocument

  // Khối bọc căn giữa cả vùng lỗi lẫn nút (CSS .load-error-screen). Nút là anh em của vùng role="alert", không nằm trong nó.
  const screen = document.createElement('div')
  screen.className = 'load-error-screen'

  const container = document.createElement('div')
  container.className = 'load-error'
  container.setAttribute('role', 'alert')

  const title = document.createElement('h2')
  title.textContent = ERROR_TITLE
  const hint = document.createElement('p')
  hint.textContent = ERROR_HINT
  const detail = document.createElement('p')
  detail.className = 'load-error-detail'
  container.append(title, hint, detail)

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'dashboard-primary-button load-error-retry'
  button.textContent = 'Thử lại'
  button.addEventListener('click', onRetry)

  screen.append(container, button)

  return { screen, container, detail, button }
}

// root: phần tử #app. start: khởi động các init* sau khi template đã dựng (main.js truyền bản thật,
// test truyền bản đếm). Chỉ gọi start khi tải thành công, và đúng một lần.
export async function bootApp(root, { fetchImpl = (...args) => fetch(...args), start }) {
  let errorView = null

  async function attempt() {
    if (errorView) errorView.button.disabled = true

    let html
    try {
      html = await loadTemplate(fetchImpl)
    } catch (error) {
      showError(error)
      return
    }

    root.innerHTML = html
    errorView = null
    start()
  }

  function showError(error) {
    if (!errorView) {
      errorView = createErrorView(root, attempt)
      root.replaceChildren(errorView.screen)
    }

    errorView.detail.textContent = error?.message || 'Lỗi không xác định.'
    errorView.button.disabled = false
    errorView.button.focus()
  }

  await attempt()
}
