import './style.css'
import { generateBubbleSortSteps } from './algorithms/bubbleSort.js'
import { generateSelectionSortSteps } from './algorithms/selectionSort.js'
import { generateInsertionSortSteps } from './algorithms/insertionSort.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="app-layout">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">A</div>
        <div>
          <h1>AlgoVision</h1>
          <p>Algorithm Visualizer</p>
        </div>
      </div>

      <div class="sidebar-section">
        <p class="section-label">KHÁM PHÁ</p>

        <button class="nav-item active" data-page="sorting">
          <span class="nav-icon">↕</span>
          <span>Sắp xếp</span>
        </button>

        <button class="nav-item" data-page="searching">
          <span class="nav-icon">⌕</span>
          <span>Tìm kiếm</span>
        </button>

        <button class="nav-item" data-page="structures">
          <span class="nav-icon">▤</span>
          <span>Cấu trúc dữ liệu</span>
        </button>
      </div>

      <div class="sidebar-bottom">
        <p>PHIÊN BẢN</p>
        <span>AlgoVision 0.1.0</span>
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <div>
          <p class="breadcrumb">Không gian học tập / <strong>Trực quan hóa</strong></p>
        </div>
        <span class="status-badge">
          <span class="status-dot"></span>
          Đang phát triển
        </span>
      </header>

      <section class="page-heading">
        <p class="eyebrow">HỌC THUẬT TOÁN TRỰC QUAN</p>
        <h2>Hiểu thuật toán qua từng bước.</h2>
        <p class="page-description">
          Quan sát cách dữ liệu thay đổi và khám phá logic phía sau mỗi thuật toán.
        </p>
      </section>

      <section class="algorithm-section">
        <div class="section-heading">
          <div>
            <h3>Thuật toán sắp xếp</h3>
            <p>Chọn một thuật toán để bắt đầu tìm hiểu.</p>
          </div>
          <span class="count-label">03 THUẬT TOÁN</span>
        </div>

        <div class="algorithm-grid">
          <button class="algorithm-card selected" data-algorithm="bubble">
            <div class="card-top">
              <span class="algorithm-symbol">↔</span>
              <span class="difficulty easy">CƠ BẢN</span>
            </div>
            <h4>Bubble Sort</h4>
            <p>So sánh các phần tử liền kề và đổi chỗ khi cần thiết.</p>
            <div class="card-footer">
              <span>Độ phức tạp trung bình</span>
              <code>O(n²)</code>
            </div>
          </button>

          <button class="algorithm-card" data-algorithm="selection">
            <div class="card-top">
              <span class="algorithm-symbol">↓</span>
              <span class="difficulty easy">CƠ BẢN</span>
            </div>
            <h4>Selection Sort</h4>
            <p>Tìm phần tử nhỏ nhất rồi đưa về đúng vị trí.</p>
            <div class="card-footer">
              <span>Độ phức tạp trung bình</span>
              <code>O(n²)</code>
            </div>
          </button>

          <button class="algorithm-card" data-algorithm="insertion">
            <div class="card-top">
              <span class="algorithm-symbol">↳</span>
              <span class="difficulty medium">TRUNG BÌNH</span>
            </div>
            <h4>Insertion Sort</h4>
            <p>Chèn từng phần tử vào vị trí phù hợp trong phần đã sắp xếp.</p>
            <div class="card-footer">
              <span>Độ phức tạp trung bình</span>
              <code>O(n²)</code>
            </div>
          </button>
        </div>
      </section>

      <section class="visualizer-section">
        <div class="section-heading">
          <div>
            <h3>Khu vực mô phỏng</h3>
            <p>Không gian trực quan hóa sẽ được phát triển ở bước tiếp theo.</p>
          </div>
          <span class="visualizer-tag">PREVIEW</span>
        </div>

        <div class="visualizer-placeholder">
          <div class="visualizer-heading">
            <div>
              <h4 id="visualizer-title">Mảng dữ liệu</h4>
              <p id="visualizer-description">
                Tạo mảng ngẫu nhiên để chuẩn bị mô phỏng thuật toán.
              </p>
            </div>
            <span class="array-count" id="array-count">12 phần tử</span>
          </div>

          <div class="array-toolbar">
            <label class="size-control" for="array-size">
              Số phần tử
              <select id="array-size">
                <option value="8">8</option>
                <option value="12" selected>12</option>
                <option value="16">16</option>
                <option value="20">20</option>
                <option value="24">24</option>
              </select>
            </label>

            <button class="primary-button" id="start-button" type="button">
              <span>↻</span>
              Tạo mảng mới
            </button>
          </div>

          <div class="array-bars" id="array-bars" role="img" aria-label="Biểu đồ các giá trị trong mảng"></div>
          
          <div class="simulation-controls">
            <button class="control-button" id="reset-sort" type="button">
              Đặt lại
            </button>

            <button class="control-button" id="previous-step" type="button" disabled>
              ← Bước trước
            </button>

            <button class="control-button" id="step-sort" type="button">
              Bước tiếp theo →
            </button>

            <button class="primary-button" id="run-sort" type="button">
              Chạy Bubble Sort
            </button>

            <button class="control-button" id="pause-sort" type="button" disabled>
              Tạm dừng
            </button>

            <label class="speed-control" for="sort-speed">
              Tốc độ
              <select id="sort-speed">
                <option value="1200">Chậm</option>
                <option value="650" selected>Vừa</option>
                <option value="250">Nhanh</option>
              </select>
            </label>
          </div>

          <div class="simulation-stats">
            <div class="stat-card">
              <span>Số lần so sánh</span>
              <strong id="comparison-count">0</strong>
            </div>

            <div class="stat-card">
              <span>Số lần đổi chỗ</span>
              <strong id="swap-count">0</strong>
            </div>

            <div class="stat-card">
              <span>Tiến trình</span>
              <strong id="step-count">0 / 0</strong>
            </div>
          </div>

          <p class="simulation-message" id="simulation-message" aria-live="polite">
            Sẵn sàng bắt đầu mô phỏng.
          </p>
          
          <div class="complexity-panel">
            <div class="complexity-heading">
              <h4>Phân tích thuật toán</h4>
              <span> BUBBLE SORT </span>
            </div>

            <div class="complexity-grid">
              <div class="complexity-card">
                <span>Trường hợp tốt nhất</span>
                <strong>O(n)</strong>
                <p>Khi mảng đã được sắp xếp và thuật toán dừng sớm.</p>
              </div>

              <div class="complexity-card">
                <span>Trung bình và xấu nhất</span>
                <strong>O(n²)</strong>
                <p>Có thể phải so sánh nhiều cặp phần tử.</p>
              </div>

              <div class="complexity-card">
                <span>Bộ nhớ phụ của thuật toán</span>
                <strong>O(1)</strong>
                <p>Không tính bộ nhớ dùng để lưu lịch sử mô phỏng.</p>
              </div>
            </div>
          </div>

          <div class="array-legend">
            <span><i class="legend-dot"></i> Giá trị trong mảng</span>
            <span id="array-range">Giá trị từ 10 đến 100</span>
          </div>
        </div>

      </section>
       
      <section class="visualizer-section" id="search-section" hidden>
        <div class="section-heading">
          <div>
            <h3>Linear Search</h3>
            <p>Tìm một giá trị bằng cách kiểm tra lần lượt từng phần tử.</p>
          </div>
          <span class="visualizer-tag">O(n)</span>
        </div>

        <div class="visualizer-placeholder">
          <div class="search-toolbar">
            <label for="search-target">Giá trị cần tìm</label>
            <input
              id="search-target"
              type="number"
              min="10"
              max="100"
              value="50"
            />
            <label for="search-algorithm">Thuật toán</label>
            <select id="search-algorithm">
              <option value="linear">Linear Search</option>
              <option value="binary">Binary Search</option>
            </select>
            <button class="primary-button" id="search-new-array" type="button">
              Tạo mảng mới
            </button>
            <button class="primary-button" id="search-compare" type="button">
              So sánh thuật toán
            </button>
          </div>

          <div class="search-speed-control">
            <label for="search-speed">Tốc độ chạy</label>
            <input
              type="range"
              id="search-speed"
              min="100"
              max="1000"
              step="100"
              value="600"
            />
            <span id="search-speed-value">600 ms</span>
          </div>

          <div id="search-comparison" class="search-comparison" hidden>
            <h3>Kết quả so sánh</h3>
            <p id="comparison-array"></p>

            <div class="comparison-grid">
              <div class="comparison-card">
                <h4>Linear Search</h4>
                <p>Số lần so sánh: <strong id="linear-comparisons">0</strong></p>
                <p>Vị trí tìm thấy: <strong id="linear-position">Chưa có</strong></p>
              </div>

              <div class="comparison-card">
                <h4>Binary Search</h4>
                <p>Số lần so sánh: <strong id="binary-comparisons">0</strong></p>
                <p>Vị trí tìm thấy: <strong id="binary-position">Chưa có</strong></p>
              </div>
            </div>

            <p id="comparison-conclusion"></p>
          </div>

          <div class="search-array" id="search-array"></div>
       
          <div class="search-range-panel" id="search-range-panel" hidden>
            <h4>Phạm vi tìm kiếm Binary Search</h4>

            <div class="search-range-stats">
              <div class="search-range-item">
                <span>Left</span>
                <strong id="search-left-value">1</strong>
              </div>

              <div class="search-range-item">
                <span>Mid</span>
                <strong id="search-mid-value">Chưa xác định</strong>
              </div>

              <div class="search-range-item">
                <span>Right</span>
                <strong id="search-right-value">12</strong>
              </div>
            </div>

            <p id="search-range-message" aria-live="polite">
              Nhấn Bước tiếp theo để bắt đầu.
            </p>
          </div>
              
          <div class="search-legend">
            <span>
              <i class="search-legend-dot is-current"></i>
              Đang kiểm tra
            </span>

            <span>
              <i class="search-legend-dot is-eliminated"></i>
              Đã loại bỏ
            </span>

            <span>
              <i class="search-legend-dot is-found"></i>
              Tìm thấy
            </span>
          </div>

          <div class="simulation-controls">
            <button class="control-button" id="search-reset" type="button">
              Đặt lại
            </button>

            <button class="control-button" id="search-next" type="button">
              Bước tiếp theo
            </button>

            <button class="primary-button" id="search-run" type="button">
              Chạy tìm kiếm
            </button>

            <button class="control-button" id="search-pause" type="button" disabled>
              Tạm dừng
            </button>
          </div>

          <p class="simulation-message" id="search-message" aria-live="polite">
            Nhập giá trị rồi bắt đầu tìm kiếm.
          </p>

          <div class="simulation-stats">
            <div class="stat-card">
              <span>Số lần kiểm tra</span>
              <strong id="search-comparisons">0</strong>
            </div>
            <div class="stat-card">
              <span>Vị trí tìm thấy</span>
              <strong id="search-result">Chưa có</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="visualizer-section" id="category-placeholder" hidden>
        <div class="section-heading">
          <div>
            <h3 id="placeholder-title">Cấu trúc dữ liệu</h3>
            <p id="placeholder-description">
              Khám phá cách tổ chức và thao tác với dữ liệu.
            </p>
          </div>
          <span class="visualizer-tag">SẮP RA MẮT</span>
        </div>

        <div class="visualizer-placeholder category-preview">
          <h4 id="placeholder-card-title">Các cấu trúc dữ liệu cơ bản</h4>
          <p id="placeholder-card-description">
            Array, Stack, Queue, Linked List, Tree và Graph sẽ được bổ sung.
          </p>
        </div>
      </section>
      
      <footer class="page-footer">
        <span>AlgoVision · Dự án học tập cá nhân</span>
        <span>Được xây dựng với JavaScript</span>
      </footer>
    </main>
  </div>
`

const algorithmNames = {
  bubble: 'Bubble Sort',
  selection: 'Selection Sort',
  insertion: 'Insertion Sort',
}

const algorithmSection = document.querySelector('.algorithm-section')
const searchSection = document.querySelector('#search-section')
const visualizerSection = document.querySelector('.visualizer-section')
const categoryPlaceholder = document.querySelector('#category-placeholder')

const placeholderTitle = document.querySelector('#placeholder-title')
const placeholderDescription = document.querySelector('#placeholder-description')
const placeholderCardTitle = document.querySelector('#placeholder-card-title')
const placeholderCardDescription = document.querySelector(
  '#placeholder-card-description',
)

const pages = {
  sorting: {
    title: 'Thuật toán sắp xếp',
    description: 'Chọn một thuật toán để bắt đầu tìm hiểu.',
  },
  searching: {
    title: 'Thuật toán tìm kiếm',
    description: 'Tìm hiểu cách xác định vị trí của một giá trị trong dữ liệu.',
    cardTitle: 'Linear Search và Binary Search',
    cardDescription:
      'Phần tiếp theo sẽ bổ sung mô phỏng tìm kiếm từng bước, đánh dấu phần tử đang kiểm tra và hiển thị kết quả tìm thấy.',
  },
  structures: {
    title: 'Cấu trúc dữ liệu',
    description: 'Khám phá cách tổ chức, lưu trữ và thao tác với dữ liệu.',
    cardTitle: 'Array, Stack, Queue, Linked List, Tree và Graph',
    cardDescription:
      'Các cấu trúc dữ liệu sẽ được bổ sung theo từng giai đoạn, kèm thao tác thêm, xóa, tìm kiếm và hình minh họa trực quan.',
  },
}

document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((navItem) => {
      navItem.classList.toggle('active', navItem === item)
    })

    const page = pages[item.dataset.page]
    if (!page) return

    const isSortingPage = item.dataset.page === 'sorting'
    const isSearchingPage = item.dataset.page === 'searching'
    const isStructuresPage = item.dataset.page === 'structures'

    algorithmSection.hidden = !isSortingPage
    visualizerSection.hidden = !isSortingPage
    searchSection.hidden = !isSearchingPage
    categoryPlaceholder.hidden = !isStructuresPage

    if (isStructuresPage) {
      placeholderTitle.textContent = page.title
      placeholderDescription.textContent = page.description
      placeholderCardTitle.textContent = page.cardTitle
      placeholderCardDescription.textContent = page.cardDescription
    }
  })
})

const searchArrayElement = document.querySelector('#search-array')
const searchRangePanel = document.querySelector('#search-range-panel')
const searchLeftValue = document.querySelector('#search-left-value')
const searchMidValue = document.querySelector('#search-mid-value')
const searchRightValue = document.querySelector('#search-right-value')
const searchRangeMessage = document.querySelector('#search-range-message')
const searchTargetInput = document.querySelector('#search-target')
const searchAlgorithmSelect = document.querySelector('#search-algorithm')
const searchMessage = document.querySelector('#search-message')
const searchComparisons = document.querySelector('#search-comparisons')
const searchSpeedInput = document.querySelector('#search-speed')
const searchSpeedValue = document.querySelector('#search-speed-value')
const searchResult = document.querySelector('#search-result')
const searchNextButton = document.querySelector('#search-next')
const searchRunButton = document.querySelector('#search-run')
const searchPauseButton = document.querySelector('#search-pause')
const searchCompareButton = document.querySelector('#search-compare')
const searchComparison = document.querySelector('#search-comparison')
const comparisonArray = document.querySelector('#comparison-array')
const linearComparisons = document.querySelector('#linear-comparisons')
const linearPosition = document.querySelector('#linear-position')
const binaryComparisons = document.querySelector('#binary-comparisons')
const binaryPosition = document.querySelector('#binary-position')
const comparisonConclusion = document.querySelector('#comparison-conclusion')

searchSpeedInput.addEventListener('input', () => {
  searchSpeedValue.textContent = `${searchSpeedInput.value} ms`

  if (searchTimer !== null) {
    stopSearchAnimation()
    runSearchAnimation()
  }
})


let searchNumbers = []
let searchIndex = 0
let searchCount = 0
let searchFinished = false
let searchTimer = null
let searchPaused = false
let searchLeft = 0
let searchRight = -1
let searchMid = -1
let searchFoundIndex = -1

function createSearchArray() {
  stopSearchAnimation()

  searchNumbers = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 91) + 10,
  )

  if (searchAlgorithmSelect.value === 'binary') {
    searchNumbers.sort((a, b) => a - b)
  }

  resetSearch()
}

function renderSearchArray() {
  searchArrayElement.innerHTML = ''

  const isBinarySearch = searchAlgorithmSelect.value === 'binary'

  searchNumbers.forEach((number, index) => {
    const cell = document.createElement('div')
    cell.className = 'search-cell'
    cell.textContent = number

    if (index === searchFoundIndex) {
      cell.classList.add('is-found')
    } else if (!searchFinished && isBinarySearch && index === searchMid) {
      cell.classList.add('is-current')
    } else if (!searchFinished && !isBinarySearch && index === searchIndex) {
      cell.classList.add('is-current')
    } else if (isBinarySearch && searchFoundIndex === -1) {
      if (searchLeft > searchRight || index < searchLeft || index > searchRight) {
        cell.classList.add('is-eliminated')
      }
    } else if (!isBinarySearch && searchFoundIndex === -1 && index < searchIndex) {
      cell.classList.add('is-eliminated')
    }

    searchArrayElement.appendChild(cell)
  })

  searchComparisons.textContent = searchCount
  searchNextButton.disabled = searchFinished
  searchRunButton.disabled = searchFinished
  renderSearchRange()
}

function renderSearchRange() {
  const isBinarySearch = searchAlgorithmSelect.value === 'binary'

  searchRangePanel.hidden = !isBinarySearch

  if (!isBinarySearch) {
    return
  }

  searchLeftValue.textContent =
    searchLeft <= searchRight ? String(searchLeft + 1) : '—'

  searchMidValue.textContent =
    searchMid >= 0 ? String(searchMid + 1) : 'Chưa xác định'

  searchRightValue.textContent =
    searchLeft <= searchRight ? String(searchRight + 1) : '—'

  if (searchFinished && searchFoundIndex !== -1) {
    searchRangeMessage.textContent =
      `Đã tìm thấy giá trị tại vị trí ${searchFoundIndex + 1}.`
  } else if (searchFinished) {
    searchRangeMessage.textContent =
      'Phạm vi tìm kiếm đã hết. Không tìm thấy giá trị cần tìm.'
  } else if (searchMid === -1) {
    searchRangeMessage.textContent =
      'Chưa kiểm tra phần tử nào. Nhấn Bước tiếp theo để bắt đầu.'
  } else {
    searchRangeMessage.textContent =
      `Đang xét vị trí ${searchMid + 1}. ` +
      `Phạm vi tìm kiếm hiện tại từ vị trí ${searchLeft + 1} ` +
      `đến vị trí ${searchRight + 1}.`
  }
}

function resetSearch() {
  stopSearchAnimation()
  searchPaused = false
  searchPauseButton.disabled = true
  searchPauseButton.textContent = 'Tạm dừng'

  searchIndex = 0
  searchCount = 0
  searchFinished = false

  searchLeft = 0
  searchRight = searchNumbers.length - 1
  searchMid = -1
  searchFoundIndex = -1

  searchResult.textContent = 'Chưa có'
  searchMessage.textContent =
    'Sẵn sàng tìm kiếm. Nhấn Bước tiếp theo để bắt đầu.'

  renderSearchArray()
}

function stopSearchAnimation() {
  if (searchTimer !== null) {
    clearInterval(searchTimer)
    searchTimer = null
  }
}

function toggleSearchPause() {
  if (searchFinished) return

  if (searchTimer !== null) {
    stopSearchAnimation()
    searchPaused = true
    searchPauseButton.textContent = 'Tiếp tục'
    return
  }

  if (searchPaused) {
    runSearchAnimation()
  }
}

function searchNextStep() {
  if (searchFinished) return

  const target = Number(searchTargetInput.value)

  if (
    searchTargetInput.value.trim() === '' ||
    !Number.isFinite(target)
  ) {
    searchMessage.textContent = 'Vui lòng nhập giá trị cần tìm.'
    return
  }

  const isBinarySearch = searchAlgorithmSelect.value === 'binary'

  if (isBinarySearch) {
    if (searchLeft > searchRight) {
      searchFinished = true
      searchResult.textContent = 'Không tìm thấy'
      searchMessage.textContent =
        `Không tìm thấy giá trị ${target} trong mảng.`

      stopSearchAnimation()
      renderSearchArray()
      return
    }

    searchMid = Math.floor((searchLeft + searchRight) / 2)
    searchCount++

    const currentValue = searchNumbers[searchMid]

    if (currentValue === target) {
      searchFinished = true
      searchFoundIndex = searchMid
      searchResult.textContent = String(searchMid + 1)
      searchMessage.textContent =
        `Đã tìm thấy ${target} tại vị trí ${searchMid + 1} (đếm từ 1).`

      stopSearchAnimation()
      renderSearchArray()
      return
    }

    if (currentValue < target) {
      searchMessage.textContent =
        `Đang kiểm tra vị trí ${searchMid + 1}: ${currentValue}. ` +
        `${currentValue} nhỏ hơn ${target}, tiếp tục tìm ở nửa bên phải.`

      searchLeft = searchMid + 1
    } else {
      searchMessage.textContent =
        `Đang kiểm tra vị trí ${searchMid + 1}: ${currentValue}. ` +
        `${currentValue} lớn hơn ${target}, tiếp tục tìm ở nửa bên trái.`

      searchRight = searchMid - 1
    }

    renderSearchArray()
    return
  }

  if (searchIndex >= searchNumbers.length) {
    searchFinished = true
    searchMessage.textContent =
      `Không tìm thấy giá trị ${target} trong mảng.`
    searchResult.textContent = 'Không tìm thấy'

    stopSearchAnimation()
    renderSearchArray()
    return
  }

  searchCount++

  const currentValue = searchNumbers[searchIndex]

  if (currentValue === target) {
    searchFinished = true
    searchFoundIndex = searchIndex
    searchResult.textContent = String(searchIndex + 1)
    searchMessage.textContent =
      `Đã tìm thấy ${target} tại vị trí ${searchIndex + 1} (đếm từ 1).`

    stopSearchAnimation()
    renderSearchArray()
    return
  }

  searchMessage.textContent =
    `Đang kiểm tra vị trí ${searchIndex + 1}: ${currentValue}. Chưa tìm thấy.`

  searchIndex++
  renderSearchArray()
}

function runSearchAnimation() {
  if (searchFinished || searchTimer !== null) return

  searchPaused = false
  searchPauseButton.textContent = 'Tạm dừng'
  searchPauseButton.disabled = false

  const speed = Number(searchSpeedInput.value)

  searchTimer = setInterval(() => {
    searchNextStep()

    if (searchFinished) {
      stopSearchAnimation()
      searchPaused = false
      searchPauseButton.disabled = true
      searchPauseButton.textContent = 'Tạm dừng'
    }
  }, speed)
}

function compareSearchAlgorithms() {
  const targetText = searchTargetInput.value.trim()
  const target = Number(targetText)

  if (targetText === '' || !Number.isFinite(target)) {
    searchMessage.textContent = 'Vui lòng nhập giá trị cần tìm hợp lệ.'
    return
  }

  stopSearchAnimation()

  const sortedNumbers = [...searchNumbers].sort((a, b) => a - b)

  let linearCount = 0
  let linearFoundIndex = -1

  for (let i = 0; i < sortedNumbers.length; i++) {
    linearCount++

    if (sortedNumbers[i] === target) {
      linearFoundIndex = i
      break
    }
  }

  let binaryCount = 0
  let binaryFoundIndex = -1
  let left = 0
  let right = sortedNumbers.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    binaryCount++

    if (sortedNumbers[mid] === target) {
      binaryFoundIndex = mid
      break
    }

    if (sortedNumbers[mid] < target) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  comparisonArray.textContent = `Mảng đã sắp xếp (đánh số vị trí từ 1): ${sortedNumbers.join(', ')}`

  linearComparisons.textContent = linearCount
  binaryComparisons.textContent = binaryCount

  linearPosition.textContent =
    linearFoundIndex === -1
      ? 'Không tìm thấy'
      : String(linearFoundIndex + 1)

  binaryPosition.textContent =
    binaryFoundIndex === -1
      ? 'Không tìm thấy'
      : String(binaryFoundIndex + 1)

  const difference = linearCount - binaryCount

  if (difference > 0) {
    comparisonConclusion.textContent =
      `Binary Search thực hiện ít hơn ${difference} lần so sánh trong lần thử này.`
  } else if (difference < 0) {
    comparisonConclusion.textContent =
      `Linear Search thực hiện ít hơn ${Math.abs(difference)} lần so sánh trong lần thử này.`
  } else {
    comparisonConclusion.textContent =
      'Hai thuật toán thực hiện cùng số lần so sánh trong lần thử này.'
  }

  searchComparison.hidden = false
}

document.querySelector('#search-new-array').addEventListener('click', createSearchArray)
document.querySelector('#search-reset').addEventListener('click', resetSearch)

searchNextButton.addEventListener('click', searchNextStep)
searchRunButton.addEventListener('click', runSearchAnimation)
searchPauseButton.addEventListener('click', toggleSearchPause)

searchCompareButton.addEventListener('click', () => {
  if (searchComparison.hidden) {
    compareSearchAlgorithms()
    searchComparison.hidden = false
    searchCompareButton.textContent = 'Ẩn bảng so sánh'
  } else {
    searchComparison.hidden = true
    searchCompareButton.textContent = 'So sánh thuật toán'
  }
})

searchTargetInput.addEventListener('change', resetSearch)
searchAlgorithmSelect.addEventListener('change', createSearchArray)

createSearchArray()

const arrayBars = document.querySelector('#array-bars')
const arraySize = document.querySelector('#array-size')
const arrayCount = document.querySelector('#array-count')
const visualizerTitle = document.querySelector('#visualizer-title')
const visualizerDescription = document.querySelector('#visualizer-description')

const runButton = document.querySelector('#run-sort')
const pauseButton = document.querySelector('#pause-sort')
const stepButton = document.querySelector('#step-sort')
const resetButton = document.querySelector('#reset-sort')
const previousButton = document.querySelector('#previous-step')
const speedControl = document.querySelector('#sort-speed')

const comparisonCount = document.querySelector('#comparison-count')
const swapCount = document.querySelector('#swap-count')
const stepCount = document.querySelector('#step-count')
const simulationMessage = document.querySelector('#simulation-message')

let numbers = []
let steps = []
let currentStepIndex = 0
let animationTimer = null
let isPlaying = false
let animationSpeed = 650
let selectedAlgorithm = 'bubble'

const algorithmConfig = {
  bubble: {
    name: 'Bubble Sort',
    generateSteps: generateBubbleSortSteps,
    description: 'So sánh các phần tử liền kề và đổi chỗ khi cần thiết.',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  selection: {
    name: 'Selection Sort',
    generateSteps: generateSelectionSortSteps,
    description: 'Tìm phần tử nhỏ nhất trong đoạn chưa sắp xếp.',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  insertion: {
    name: 'Insertion Sort',
    generateSteps: generateInsertionSortSteps,
    description: 'Chèn từng phần tử vào vị trí phù hợp trong đoạn đã sắp xếp.',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
}

function selectAlgorithm(algorithm) {
  if (!algorithmConfig[algorithm]) {
    return
  }

  selectedAlgorithm = algorithm

  document.querySelectorAll('.algorithm-card').forEach((card) => {
    card.classList.toggle(
      'selected',
      card.dataset.algorithm === selectedAlgorithm,
    )
  })

  const config = algorithmConfig[selectedAlgorithm]
  visualizerTitle.textContent = config.name
  visualizerDescription.textContent = config.description
  runButton.textContent = `Chạy ${config.name}`

  const complexityTitle = document.querySelector('.complexity-heading span')
  const complexityCards = document.querySelectorAll('.complexity-card strong')

  complexityTitle.textContent = config.name.toUpperCase()

  complexityCards[0].textContent = config.best
  complexityCards[1].textContent = config.average
  complexityCards[2].textContent = config.space

  createNewArray()
}

document.querySelectorAll('.algorithm-card').forEach((card) => {
  card.addEventListener('click', () => {
    selectAlgorithm(card.dataset.algorithm)
  })
})

function generateArray(size) {
  const result = []

  for (let i = 0; i < size; i++) {
    result.push(Math.floor(Math.random() * 91) + 10)
  }

  return result
}

function renderArray() {
  const currentStep = steps[currentStepIndex]

  if (!currentStep) {
    return
  }

  arrayBars.innerHTML = ''

  currentStep.array.forEach((number, index) => {
    const bar = document.createElement('div')
    const value = document.createElement('span')

    bar.className = 'array-bar'
    bar.style.height = `${number}%`
    bar.dataset.index = index

    if (currentStep.comparing.includes(index)) {
      bar.classList.add('is-comparing')
    }

    if (currentStep.swapped.includes(index)) {
      bar.classList.add('is-swapped')
    }

    if (currentStep.sortedIndices.includes(index)) {
      bar.classList.add('is-sorted')
    }

    value.className = 'bar-value'
    value.textContent = number

    bar.appendChild(value)
    arrayBars.appendChild(bar)
  })

  comparisonCount.textContent = currentStep.comparisons
  swapCount.textContent = currentStep.swaps
  stepCount.textContent = `${currentStepIndex + 1} / ${steps.length}`
  simulationMessage.textContent = currentStep.message
  arrayCount.textContent = `${numbers.length} phần tử`

  runButton.disabled = isPlaying || Boolean(currentStep.finished)
  pauseButton.disabled = !isPlaying
  stepButton.disabled = isPlaying || Boolean(currentStep.finished)
  previousButton.disabled = isPlaying || currentStepIndex === 0
}

function stopAnimation() {
  if (animationTimer !== null) {
    clearInterval(animationTimer)
    animationTimer = null
  }

  isPlaying = false
}

function createNewArray() {
  stopAnimation()

  numbers = generateArray(Number(arraySize.value))
  steps = algorithmConfig[selectedAlgorithm].generateSteps(numbers)
  currentStepIndex = 0

  visualizerTitle.textContent = 'Mảng dữ liệu'
  visualizerDescription.textContent =
    'Chọn Chạy Bubble Sort hoặc Bước tiếp theo để quan sát thuật toán.'

  renderArray()
}

function showNextStep() {
  if (currentStepIndex >= steps.length - 1) {
    stopAnimation()
    renderArray()
    return
  }

  currentStepIndex++
  renderArray()

  if (steps[currentStepIndex].finished) {
    stopAnimation()
    renderArray()
  }
}

function startAnimation() {
  if (isPlaying) {
    return
  }

  if (steps[currentStepIndex]?.finished) {
    return
  }

  isPlaying = true
  renderArray()

  animationTimer = setInterval(() => {
  showNextStep()
  }, animationSpeed)
}

function resetSimulation() {
  stopAnimation()
  currentStepIndex = 0
  renderArray()
}

runButton.addEventListener('click', startAnimation)

pauseButton.addEventListener('click', () => {
  stopAnimation()
  renderArray()
})

stepButton.addEventListener('click', showNextStep)

resetButton.addEventListener('click', resetSimulation)

previousButton.addEventListener('click', () => {
  if (isPlaying || currentStepIndex === 0) {
    return
  }

  currentStepIndex--
  renderArray()
})

speedControl.addEventListener('change', () => {
  animationSpeed = Number(speedControl.value)

  if (isPlaying) {
    clearInterval(animationTimer)

    animationTimer = setInterval(() => {
      showNextStep()
    }, animationSpeed)
  }
})

document.querySelector('#start-button').addEventListener('click', createNewArray)
arraySize.addEventListener('change', createNewArray)

createNewArray()

