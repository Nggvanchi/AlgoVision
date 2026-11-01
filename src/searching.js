import { createSimulationController } from './simulation-controller.js'
import { generateLinearSearchSteps } from './algorithms/linearSearch.js'
import { generateBinarySearchSteps } from './algorithms/binarySearch.js'

const searchAlgorithmInfo = {
  linear: {
    name: 'Linear Search',
    description: 'Tìm một giá trị bằng cách kiểm tra lần lượt từng phần tử.',
    complexity: 'O(n)',
  },
  binary: {
    name: 'Binary Search',
    description: 'Tìm một giá trị bằng cách chia đôi phạm vi tìm kiếm trên mảng đã sắp xếp.',
    complexity: 'O(log n)',
  },
}

export function initSearching(options = {}) {
  const searchTitle = document.querySelector('#search-title')
  const searchDescription = document.querySelector('#search-description')
  const searchComplexity = document.querySelector('#search-complexity')
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
  const searchSpeedInput = document.querySelector('#search-speed')
  const searchSpeedValue = document.querySelector('#search-speed-value')
  const searchResult = document.querySelector('#search-result')
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

  const requiredElements = [
    searchArrayElement,
    searchTargetInput,
    searchAlgorithmSelect,
    searchMessage,
    searchComparisons,
    searchSpeedInput,
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


  const DEFAULT_SPEED = 600
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
    getDelay: getSearchDelay,
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

  // Đọc tốc độ ở mỗi tick nên kéo thanh tốc độ không tạo lại timer.
  function getSearchDelay() {
    const speed = Number(searchSpeedInput.value)

    return Number.isFinite(speed) && speed > 0 ? speed : DEFAULT_SPEED
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

  function renderSearch({ step = createIdleStep(), controls }) {
    renderSearchArray(step)
    renderSearchRange(step)
    renderSearchResult(step)

    searchComparisons.textContent = String(step.comparisons)
    searchMessage.textContent = step.message

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

  searchSpeedInput.addEventListener('input', () => {
    if (searchSpeedValue) {
      searchSpeedValue.textContent = `${searchSpeedInput.value} ms`
    }
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

  if (searchSpeedValue) {
    searchSpeedValue.textContent = `${searchSpeedInput.value} ms`
  }

  renderAlgorithmInfo()
  createSearchArray()
}
