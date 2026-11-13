import { createSimulationController } from './simulation-controller.js'
import { generateLinearSearchSteps, linearSearchPseudocode } from './algorithms/linearSearch.js'
import { generateBinarySearchSteps, binarySearchPseudocode } from './algorithms/binarySearch.js'
import { renderPseudocode, highlightPseudocodeLine } from './pseudocode-view.js'
import { createStepTools } from './step-tools.js'

// Big-O và mô tả phải khớp generator: so sánh được đếm ở mỗi lần xét A[i] hoặc A[mid].
const searchAlgorithmInfo = {
  linear: {
    name: 'Linear Search',
    description: 'Tìm một giá trị bằng cách kiểm tra lần lượt từng phần tử.',
    complexity: 'O(n)',
    best: 'O(1)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
    pseudocode: linearSearchPseudocode,
    learningDescription:
      'Duyệt lần lượt từ A[0] đến A[n - 1] và so sánh từng phần tử với giá trị cần tìm. Thuật toán dừng ngay ở phần tử khớp đầu tiên nên kết quả là vị trí xuất hiện đầu tiên; xét hết mảng mà không khớp thì trả về -1.',
    advantages:
      'Không cần mảng đã sắp xếp và rất dễ cài đặt. Tốt nhất chỉ cần 1 phép so sánh khi giá trị nằm ở đầu mảng. Khi có phần tử trùng, luôn trả về vị trí xuất hiện đầu tiên.',
    disadvantages:
      'Trường hợp trung bình và xấu nhất phải so sánh tới n phần tử, nên chậm với mảng lớn.',
  },
  binary: {
    name: 'Binary Search',
    description: 'Tìm một giá trị bằng cách chia đôi phạm vi tìm kiếm trên mảng đã sắp xếp.',
    complexity: 'O(log n)',
    best: 'O(1)',
    average: 'O(log n)',
    worst: 'O(log n)',
    space: 'O(1)',
    pseudocode: binarySearchPseudocode,
    learningDescription:
      'Chỉ áp dụng cho mảng đã sắp xếp tăng dần. Mỗi bước so sánh A[mid] với giá trị cần tìm rồi bỏ nửa không thể chứa nó, nên phạm vi [left, right] giảm một nửa. Khi left > right, phạm vi rỗng và kết luận không tìm thấy.',
    advantages:
      'Rất nhanh với mảng lớn: tối đa ⌊log₂ n⌋ + 1 phép so sánh. Cài đặt bằng vòng lặp nên chỉ cần bộ nhớ phụ O(1).',
    disadvantages:
      'Bắt buộc mảng đã sắp xếp; chi phí sắp xếp trước (O(n log n)) không tính vào thuật toán. Khi có phần tử trùng, Binary Search có thể trả về bất kỳ vị trí nào khớp, không nhất thiết là vị trí đầu tiên.',
  },
}

export function initSearching(options = {}) {
  const searchTitle = document.querySelector('#search-title')
  const searchDescription = document.querySelector('#search-description')
  const searchComplexity = document.querySelector('#search-complexity')
  const searchLegendItems = document.querySelectorAll('#search-legend [data-algorithms]')
  const searchAlgorithmCards = document.querySelectorAll('[data-search-algorithm]')
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
  const stepToolsRoot = document.querySelector('#search-section [data-step-tools]')
  const searchResult = document.querySelector('#search-result')
  const searchTargetValue = document.querySelector('#search-target-value')
  const searchCurrentValue = document.querySelector('#search-current-value')
  const searchNextButton = document.querySelector('#search-next')
  const searchPreviousButton = document.querySelector('#search-previous')
  const searchRunButton = document.querySelector('#search-run')
  const searchPauseButton = document.querySelector('#search-pause')
  const searchNewArrayButton = document.querySelector('#search-new-array')
  const searchResetButton = document.querySelector('#search-reset')
  const searchCompareButton = document.querySelector('#search-compare')
  const searchComparison = document.querySelector('#search-comparison')
  const comparisonArray = document.querySelector('#comparison-array')
  const linearComparisons = document.querySelector('#linear-comparisons')
  const linearPosition = document.querySelector('#linear-position')
  const binaryComparisons = document.querySelector('#binary-comparisons')
  const binaryPosition = document.querySelector('#binary-position')
  const comparisonConclusion = document.querySelector('#comparison-conclusion')
  const complexityTitle = document.querySelector('#search-complexity-title')
  const complexityCells = {
    best: document.querySelector('#search-complexity-best'),
    average: document.querySelector('#search-complexity-average'),
    worst: document.querySelector('#search-complexity-worst'),
    space: document.querySelector('#search-complexity-space'),
  }
  const learningDescription = document.querySelector('#search-learning-description')
  const learningPseudocode = document.querySelector('#search-learning-pseudocode')
  const learningAdvantages = document.querySelector('#search-learning-advantages')
  const learningDisadvantages = document.querySelector('#search-learning-disadvantages')

  const requiredElements = [
    searchArrayElement,
    searchTargetInput,
    searchAlgorithmSelect,
    searchMessage,
    searchComparisons,
    stepToolsRoot,
    searchNextButton,
    searchPreviousButton,
    searchRunButton,
    searchPauseButton,
  ]

  if (requiredElements.some((element) => !element)) {
    console.error(
      'Không thể khởi tạo tìm kiếm: thiếu phần tử HTML cần thiết.',
    )
    return
  }


  const stepTools = createStepTools(stepToolsRoot, { seek: (index) => simulation.seek(index) })
  const IDLE_MESSAGE = 'Nhập giá trị cần tìm, sau đó bắt đầu mô phỏng.'
  const stepGenerators = {
    linear: generateLinearSearchSteps,
    binary: generateBinarySearchSteps,
  }

  const initialNumbers = options.initialNumbers

  let searchNumbers = Array.isArray(initialNumbers)
    ? [...initialNumbers]
    : []

  const simulation = createSimulationController({
    getDelay: stepTools.getDelay, // đọc tốc độ ở mỗi tick nên đổi tốc độ không tạo lại timer
    onChange: renderSearch,
    scheduler: options.scheduler,
  })

  function isBinarySearch() {
    return searchAlgorithmSelect.value === 'binary'
  }

  function getTarget() {
    const value = searchTargetInput.value.trim()

    if (value === '') {
      return null
    }

    const target = Number(value)

    return Number.isFinite(target) ? target : null
  }

  function getRunLabel(runMode) {
    if (runMode === 'resume') return 'Tiếp tục'
    if (runMode === 'restart') return 'Chạy lại'

    return 'Chạy tìm kiếm'
  }

  // Trạng thái hiển thị khi chưa sinh bước (chưa chốt mục tiêu).
  function createIdleStep() {
    return {
      index: 0,
      mid: -1,
      left: 0,
      right: searchNumbers.length - 1,
      comparisons: 0,
      foundIndex: -1,
      finished: false,
      target: null,
      currentIndex: null,
      currentValue: null,
      pseudocodeLine: null,
      message: IDLE_MESSAGE,
    }
  }

  function renderAlgorithmInfo() {
    const algorithm = isBinarySearch() ? 'binary' : 'linear'
    const info = searchAlgorithmInfo[algorithm]

    if (searchTitle) searchTitle.textContent = info.name
    if (searchDescription) searchDescription.textContent = info.description
    if (searchComplexity) searchComplexity.textContent = info.complexity

    searchAlgorithmCards.forEach((card) => {
      card.classList.toggle('selected', card.dataset.searchAlgorithm === algorithm)
    })

    renderLegend(algorithm)
    renderLearningPanel(info)
  }

  // Chú giải chỉ liệt kê trạng thái ô mà thuật toán đang chọn thực sự dùng (xem getCellClass).
  function renderLegend(algorithm) {
    searchLegendItems.forEach((item) => {
      item.hidden = !item.dataset.algorithms.split(' ').includes(algorithm)
    })
  }

  function renderLearningPanel(info) {
    if (complexityTitle) complexityTitle.textContent = info.name.toUpperCase()

    Object.entries(complexityCells).forEach(([name, cell]) => {
      if (cell) cell.textContent = info[name]
    })

    if (learningDescription) learningDescription.textContent = info.learningDescription
    if (learningAdvantages) learningAdvantages.textContent = info.advantages
    if (learningDisadvantages) learningDisadvantages.textContent = info.disadvantages
    if (learningPseudocode) renderPseudocode(learningPseudocode, info.pseudocode)
  }

  function renderSearchRange(step) {
    if (!searchRangePanel) {
      return
    }

    const binary = isBinarySearch()
    searchRangePanel.hidden = !binary

    if (!binary) {
      return
    }

    const hasRange = step.left <= step.right

    if (searchLeftValue) {
      searchLeftValue.textContent = hasRange ? String(step.left + 1) : '—'
    }

    if (searchMidValue) {
      searchMidValue.textContent =
        step.mid >= 0 ? String(step.mid + 1) : 'Chưa xác định'
    }

    if (searchRightValue) {
      searchRightValue.textContent = hasRange ? String(step.right + 1) : '—'
    }

    if (!searchRangeMessage) {
      return
    }

    if (step.finished && step.foundIndex !== -1) {
      searchRangeMessage.textContent =
        `Đã tìm thấy giá trị tại vị trí ${step.foundIndex + 1}.`
    } else if (step.finished) {
      searchRangeMessage.textContent =
        'Đã hết phạm vi tìm kiếm. Không tìm thấy giá trị cần tìm.'
    } else if (step.mid === -1) {
      searchRangeMessage.textContent =
        'Chưa kiểm tra phần tử nào. Nhấn Bước tiếp theo để bắt đầu.'
    } else {
      searchRangeMessage.textContent =
        `Đang xét phần tử ở vị trí ${step.mid + 1}.`
    }
  }

  function getCellClass(step, index, binary) {
    if (index === step.foundIndex) return 'is-found'
    if (!step.finished && binary && index === step.mid) return 'is-current'
    if (!step.finished && !binary && index === step.index) return 'is-current'
    if (binary && (index < step.left || index > step.right)) return 'is-eliminated'
    if (!binary && index < step.index) return 'is-checked'
    if (!binary && step.finished && step.foundIndex === -1) return 'is-checked'

    return null
  }

  // Ký hiệu ngoài màu: ▶ ở ô đang kiểm tra, ✓ ở ô tìm thấy (cùng bộ ký hiệu với BST, Hash Table, Graph).
  // Glyph nằm ở data-marker và được CSS vẽ bằng ::before: textContent của ô vẫn đúng là giá trị (test và chép văn bản không dính ▶/✓).
  const CELL_MARKERS = { 'is-current': '▶', 'is-found': '✓' }

  function createCellMarker(symbol) {
    const marker = document.createElement('span')

    marker.className = 'search-cell-marker'
    marker.setAttribute('aria-hidden', 'true')
    marker.dataset.marker = symbol

    return marker
  }

  function renderSearchArray(step) {
    searchArrayElement.innerHTML = ''

    const binary = isBinarySearch()

    searchNumbers.forEach((number, index) => {
      const cell = document.createElement('div')
      const cellClass = getCellClass(step, index, binary)

      cell.className = 'search-cell'
      cell.textContent = String(number)

      if (cellClass) {
        cell.classList.add(cellClass)
      }

      if (CELL_MARKERS[cellClass]) {
        cell.appendChild(createCellMarker(CELL_MARKERS[cellClass]))
      }

      searchArrayElement.appendChild(cell)
    })
  }

  function renderSearchResult(step) {
    if (!searchResult) {
      return
    }

    if (!step.finished) {
      searchResult.textContent = 'Chưa có kết quả.'
    } else if (step.foundIndex !== -1) {
      searchResult.textContent = `Tìm thấy tại vị trí ${step.foundIndex + 1}.`
    } else {
      searchResult.textContent = 'Không tìm thấy giá trị.'
    }
  }

  // Đọc từ dữ liệu bước (target đã chốt), không đọc lại ô nhập.
  function renderStepValues(step) {
    if (searchTargetValue) {
      searchTargetValue.textContent = step.target === null ? '—' : String(step.target)
    }

    if (searchCurrentValue) {
      searchCurrentValue.textContent =
        step.currentIndex === null
          ? '—'
          : `${step.currentValue} (vị trí ${step.currentIndex + 1})`
    }
  }

  function renderSearch({ state, step = createIdleStep(), stepIndex, stepCount, controls }) {
    stepTools.sync({ stepIndex, stepCount })
    renderSearchArray(step)
    renderSearchRange(step)
    renderSearchResult(step)
    renderStepValues(step)

    if (learningPseudocode) {
      highlightPseudocodeLine(learningPseudocode, step.pseudocodeLine)
    }

    searchComparisons.textContent = String(step.comparisons)
    // Autoplay vẫn vẽ từng bước; chỉ thao tác thủ công và kết luận được đọc.
    searchMessage.setAttribute('aria-live', state === 'running' ? 'off' : 'polite')
    if (searchMessage.textContent !== step.message) searchMessage.textContent = step.message

    searchRunButton.textContent = getRunLabel(controls.runMode)
    searchRunButton.disabled = !controls.run
    searchPauseButton.disabled = !controls.pause
    searchNextButton.disabled = !controls.next
    searchPreviousButton.disabled = !controls.previous
  }

  // Bỏ các bước cũ; lần Next/Run tiếp theo sẽ đọc lại mục tiêu.
  function resetSearch() {
    simulation.load([])
  }

  function createSearchArray() {
    if (Array.isArray(initialNumbers)) {
      searchNumbers = [...initialNumbers]
    } else {
      searchNumbers = Array.from({ length: 12 }, () =>
        Math.floor(Math.random() * 91) + 10,
      )
    }

    if (isBinarySearch()) {
      searchNumbers.sort((a, b) => a - b)
    }

    resetSearch()
  }

  // Chốt mục tiêu một lần khi sinh bước; trả về false nếu mục tiêu không hợp lệ.
  function prepareSteps() {
    if (simulation.getSnapshot().stepCount > 0) {
      return true
    }

    const target = getTarget()

    if (target === null) {
      return false
    }

    const generateSteps = stepGenerators[isBinarySearch() ? 'binary' : 'linear']
    simulation.load(generateSteps(searchNumbers, target))

    return true
  }

  function showNextSearchStep() {
    if (!prepareSteps()) {
      searchMessage.textContent = 'Vui lòng nhập một giá trị số hợp lệ.'
      return
    }

    simulation.next()
  }

  function runSearchAnimation() {
    if (!prepareSteps()) {
      searchMessage.textContent =
        'Vui lòng nhập một giá trị số hợp lệ trước khi tìm kiếm.'
      return
    }

    simulation.run()
  }

  function compareSearchAlgorithms() {
    const target = getTarget()

    if (target === null) {
      searchMessage.textContent =
        'Vui lòng nhập một giá trị số hợp lệ trước khi so sánh.'
      return
    }

    const sortedNumbers = [...searchNumbers].sort((a, b) => a - b)

    let linearCount = 0
    let linearIndex = -1

    for (let i = 0; i < searchNumbers.length; i++) {
      linearCount++

      if (searchNumbers[i] === target) {
        linearIndex = i
        break
      }
    }

    let binaryCount = 0
    let binaryIndex = -1
    let left = 0
    let right = sortedNumbers.length - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      binaryCount++

      if (sortedNumbers[mid] === target) {
        binaryIndex = mid
        break
      }

      if (sortedNumbers[mid] < target) {
        left = mid + 1
      } else {
        right = mid - 1
      }
    }

    if (comparisonArray) {
      comparisonArray.innerHTML = ''

      sortedNumbers.forEach((number) => {
        const cell = document.createElement('div')
        cell.className = 'search-cell'
        cell.textContent = String(number)
        comparisonArray.appendChild(cell)
      })
    }

    if (linearComparisons) {
      linearComparisons.textContent = String(linearCount)
    }

    if (linearPosition) {
      linearPosition.textContent =
        linearIndex === -1
          ? 'Không tìm thấy'
          : `Vị trí ${linearIndex + 1} trong mảng gốc`
    }

    if (binaryComparisons) {
      binaryComparisons.textContent = String(binaryCount)
    }

    if (binaryPosition) {
      binaryPosition.textContent =
        binaryIndex === -1
          ? 'Không tìm thấy'
          : `Vị trí ${binaryIndex + 1} trong mảng đã sắp xếp`
    }

    if (comparisonConclusion) {
      if (linearIndex === -1 && binaryIndex === -1) {
        comparisonConclusion.textContent =
          'Cả hai thuật toán đều không tìm thấy giá trị cần tìm.'
      } else if (linearCount < binaryCount) {
        comparisonConclusion.textContent =
          'Linear Search sử dụng ít phép so sánh hơn trong lần thử này.'
      } else if (binaryCount < linearCount) {
        comparisonConclusion.textContent =
          'Binary Search sử dụng ít phép so sánh hơn trong lần thử này.'
      } else {
        comparisonConclusion.textContent =
          'Hai thuật toán sử dụng số phép so sánh bằng nhau trong lần thử này.'
      }
    }

  }

  searchNextButton.addEventListener('click', showNextSearchStep)
  searchPreviousButton.addEventListener('click', simulation.previous)
  searchRunButton.addEventListener('click', runSearchAnimation)
  searchPauseButton.addEventListener('click', simulation.pause)

  searchNewArrayButton?.addEventListener('click', createSearchArray)

  searchResetButton?.addEventListener('click', resetSearch)

  // Ô mục tiêu luôn khớp với mô phỏng: gõ (input) hay rời ô (change) đều về ban đầu.
  // Các bước đã sinh vẫn giữ target đã chốt nên không phụ thuộc vào ô nhập.
  searchTargetInput.addEventListener('input', resetSearch)
  searchTargetInput.addEventListener('change', resetSearch)

  // Rời màn hình mô phỏng thì tạm dừng (giữ nguyên bước hiện tại).
  document.addEventListener('algovision:viewchange', () => {
    if (searchArrayElement.closest('[hidden]')) {
      simulation.pause()
    }
  })

  searchAlgorithmSelect.addEventListener('change', () => {
    renderAlgorithmInfo()
    createSearchArray()
  })

  if (searchCompareButton && searchComparison) {
    searchComparison.hidden = true
    searchCompareButton.setAttribute('aria-expanded', 'false')

    searchCompareButton.addEventListener('click', () => {
      if (!searchComparison.hidden) {
        searchComparison.hidden = true
        searchCompareButton.setAttribute('aria-expanded', 'false')
        return
      }

      compareSearchAlgorithms()

      const target = getTarget()

      if (target === null) {
        return
      }

      searchComparison.hidden = false
      searchCompareButton.setAttribute('aria-expanded', 'true')
    })
  }

  renderAlgorithmInfo()
  createSearchArray()
}
