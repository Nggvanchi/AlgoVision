import './style.css'
import { generateBubbleSortSteps } from './algorithms/bubbleSort.js'
import { generateSelectionSortSteps } from './algorithms/selectionSort.js'
import { generateInsertionSortSteps } from './algorithms/insertionSort.js'

const app = document.querySelector('#app')

async function loadAppTemplate() {
  const response = await fetch('/templates/app.html')

  if (!response.ok) {
    throw new Error(`Không thể tải giao diện: $DIL0`)
  }

  app.innerHTML = await response.text()
}

await loadAppTemplate()

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

