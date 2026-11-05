
import { generateBubbleSortSteps, bubbleSortPseudocode } from './algorithms/bubbleSort.js'
import { generateSelectionSortSteps, selectionSortPseudocode } from './algorithms/selectionSort.js'
import { generateInsertionSortSteps, insertionSortPseudocode } from './algorithms/insertionSort.js'
import { createSimulationController } from './simulation-controller.js'
import { renderPseudocode, highlightPseudocodeLine } from './pseudocode-view.js'
import { getBarStateClasses } from './sorting-bar-state.js'

export function initSorting(options = {}) {
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
  const startButton = document.querySelector('#start-button')

  const comparisonCount = document.querySelector('#comparison-count')
  const swapCount = document.querySelector('#swap-count')
  const shiftCount = document.querySelector('#shift-count')
  const stepCount = document.querySelector('#step-count')
  const simulationMessage = document.querySelector('#simulation-message')
  // Nhãn chỉ dành cho Insertion Sort nên không nằm trong requiredElements:
  // thiếu nhãn không được làm hỏng Bubble và Selection (renderInsertionKey bỏ qua khi null).
  const insertionKeyLabel = document.querySelector('#insertion-key')
  const insertionKeyValue = document.querySelector('#insertion-key-value')
  // Chú giải trạng thái cột: mỗi mục khai báo thuật toán dùng nó trong data-algorithms (như chú giải Tìm kiếm).
  const sortLegendItems = document.querySelectorAll('#sort-legend [data-algorithms]')

  const algorithmCards = document.querySelectorAll('.algorithm-card[data-algorithm]')
  // Searching cũng có bảng Big-O cùng class: chỉ tìm trong section của Sorting.
  const sortingSection = arrayBars?.closest('.visualizer-section') ?? document
  const complexityTitle = sortingSection.querySelector('.complexity-heading span')
  const complexityCards = sortingSection.querySelectorAll('.complexity-card strong')
  
  const learningDescription = document.querySelector('#learning-description')
  const learningPseudocode = document.querySelector('#learning-pseudocode')
  const learningAdvantages = document.querySelector('#learning-advantages')
  const learningDisadvantages = document.querySelector('#learning-disadvantages')


  const requiredElements = [
    arrayBars,
    arraySize,
    arrayCount,
    visualizerTitle,
    visualizerDescription,
    runButton,
    pauseButton,
    stepButton,
    resetButton,
    previousButton,
    speedControl,
    comparisonCount,
    swapCount,
    shiftCount,
    stepCount,
    simulationMessage,
    startButton,
    complexityTitle,
    learningDescription,
    learningPseudocode,
    learningAdvantages,
    learningDisadvantages,
  ]

  if (requiredElements.some((element) => !element)) {
    console.error('Không thể khởi tạo mô phỏng sắp xếp: thiếu phần tử HTML.')
    return
  }

  const algorithmConfig = {
    bubble: {
      name: 'Bubble Sort',
      generateSteps: generateBubbleSortSteps,
      description: 'So sánh các phần tử liền kề và đổi chỗ khi cần thiết.',
      best: 'O(n)',
      average: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      learningDescription:
        'So sánh hai phần tử liền kề và đổi chỗ nếu chúng sai thứ tự. Sau mỗi lượt, phần tử lớn nhất chưa được sắp xếp sẽ được đưa về cuối mảng.',
      pseudocode: bubbleSortPseudocode,
      advantages:
        'Dễ hiểu, dễ triển khai và ổn định vì chỉ đổi chỗ khi A[j] > A[j + 1]. Nhờ cờ swapped, thuật toán dừng sớm khi một lượt không có lần đổi chỗ nào, nên chỉ cần O(n) với mảng đã sắp xếp.',
      disadvantages:
        'Có thể cần nhiều phép so sánh và đổi chỗ khi dữ liệu lớn. Độ phức tạp trung bình và xấu nhất là O(n²).',
    },

    selection: {
      name: 'Selection Sort',
      generateSteps: generateSelectionSortSteps,
      description: 'Tìm phần tử nhỏ nhất trong đoạn chưa sắp xếp.',
      best: 'O(n²)',
      average: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      learningDescription:
        'Chia mảng thành phần đã sắp xếp và chưa sắp xếp. Mỗi lượt tìm phần tử nhỏ nhất trong phần chưa sắp xếp rồi đổi chỗ với phần tử đầu tiên của phần đó.',
      pseudocode: selectionSortPseudocode,
      advantages:
        'Dễ triển khai và thực hiện tối đa n - 1 lần đổi chỗ trong cách cài đặt thông thường.',
      disadvantages:
        'Vẫn cần O(n²) phép so sánh ngay cả khi mảng đã được sắp xếp. Cách cài đặt thông thường không phải thuật toán sắp xếp ổn định.',
    },

    insertion: {
      name: 'Insertion Sort',
      generateSteps: generateInsertionSortSteps,
      description: 'Chèn từng phần tử vào vị trí phù hợp trong đoạn đã sắp xếp.',
      best: 'O(n)',
      average: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      learningDescription:
        'Duy trì một đoạn đầu mảng đã được sắp xếp. Lấy phần tử tiếp theo, dịch các phần tử lớn hơn sang phải rồi chèn phần tử đó vào vị trí phù hợp.',
      pseudocode: insertionSortPseudocode,
      advantages:
        'Hiệu quả với mảng nhỏ hoặc gần như đã được sắp xếp. Trong cách cài đặt thông thường, thuật toán có tính ổn định.',
      disadvantages:
        'Trong trường hợp trung bình và xấu nhất, thời gian thực hiện là O(n²) do phải dịch chuyển nhiều phần tử.',
    },
  }

  const DEFAULT_SPEED = 650

  let numbers = []
  let selectedAlgorithm = 'bubble'

  const simulation = createSimulationController({
    getDelay: getAnimationDelay,
    onChange: renderSimulation,
    scheduler: options.scheduler,
  })

  // Đọc tốc độ ở mỗi tick nên đổi tốc độ không cần tạo lại timer.
  function getAnimationDelay() {
    const speed = Number(speedControl.value)

    return Number.isFinite(speed) && speed > 0 ? speed : DEFAULT_SPEED
  }

  function getRunLabel(runMode) {
    if (runMode === 'resume') return 'Tiếp tục'
    if (runMode === 'restart') return 'Chạy lại'

    return `Chạy ${algorithmConfig[selectedAlgorithm].name}`
  }

  function generateArray(size) {
    const result = []

    for (let i = 0; i < size; i++) {
      result.push(Math.floor(Math.random() * 91) + 10)
    }

    return result
  }

  function renderBars(currentStep) {
    arrayBars.innerHTML = ''

    currentStep.array.forEach((number, index) => {
      const bar = document.createElement('div')
      const value = document.createElement('span')

      bar.className = 'array-bar'
      bar.style.height = `${number}%`
      bar.dataset.index = index

      bar.classList.add(...getBarStateClasses(currentStep, index))

      value.className = 'bar-value'
      value.textContent = number

      bar.appendChild(value)
      arrayBars.appendChild(bar)
    })
  }

  // Chỉ bước của Insertion Sort có trường key (null ở bước đầu và bước cuối), nên trạng thái nhãn suy ra
  // hoàn toàn từ bước đang hiển thị: không có biến trạng thái riêng để rò sau Đặt lại hay đổi thuật toán.
  // Insertion không có key: giữ chỗ (is-idle, visibility: hidden) để bố cục không nhảy giữa các bước.
  function renderInsertionKey(currentStep) {
    if (!insertionKeyLabel || !insertionKeyValue) {
      return
    }

    const isInsertion = 'key' in currentStep
    const hasKey = isInsertion && currentStep.key !== null

    insertionKeyLabel.hidden = !isInsertion
    insertionKeyLabel.classList.toggle('is-idle', !hasKey)
    insertionKeyValue.textContent = hasKey ? `Đang chèn: ${currentStep.key}` : ''
  }

  function renderSimulation({ step, stepIndex, stepCount: totalSteps, controls }) {
    if (!step) {
      return
    }

    renderBars(step)
    renderInsertionKey(step)
    highlightPseudocodeLine(learningPseudocode, step.pseudocodeLine)

    comparisonCount.textContent = step.comparisons
    swapCount.textContent = step.swaps
    shiftCount.textContent = step.shifts ?? 0
    stepCount.textContent = `${stepIndex + 1} / ${totalSteps}`
    simulationMessage.textContent = step.message
    arrayCount.textContent = `${numbers.length} phần tử`

    runButton.textContent = getRunLabel(controls.runMode)
    runButton.disabled = !controls.run
    pauseButton.disabled = !controls.pause
    stepButton.disabled = !controls.next
    previousButton.disabled = !controls.previous
    resetButton.disabled = !controls.reset
  }

  function createNewArray() {
    numbers = generateArray(Number(arraySize.value))
    simulation.load(algorithmConfig[selectedAlgorithm].generateSteps(numbers))
  }

  function selectAlgorithm(algorithm) {
    if (!algorithmConfig[algorithm]) {
      return
    }

    selectedAlgorithm = algorithm

    algorithmCards.forEach((card) => {
      card.classList.toggle('selected', card.dataset.algorithm === algorithm)
    })

    const config = algorithmConfig[selectedAlgorithm]

    visualizerTitle.textContent = config.name
    visualizerDescription.textContent = config.description

    learningDescription.textContent = config.learningDescription
    renderPseudocode(learningPseudocode, config.pseudocode)
    learningAdvantages.textContent = config.advantages
    learningDisadvantages.textContent = config.disadvantages

    complexityTitle.textContent = config.name.toUpperCase()

    sortLegendItems.forEach((item) => {
      item.hidden = !item.dataset.algorithms.split(' ').includes(algorithm)
    })

    if (complexityCards.length >= 4) {
      complexityCards[0].textContent = config.best
      complexityCards[1].textContent = config.average
      complexityCards[2].textContent = config.worst
      complexityCards[3].textContent = config.space
    }

    createNewArray()
  }

  algorithmCards.forEach((card) => {
    card.addEventListener('click', () => {
      selectAlgorithm(card.dataset.algorithm)
    })
  })

  runButton.addEventListener('click', simulation.run)
  pauseButton.addEventListener('click', simulation.pause)
  stepButton.addEventListener('click', simulation.next)
  previousButton.addEventListener('click', simulation.previous)
  resetButton.addEventListener('click', simulation.reset)

  startButton.addEventListener('click', createNewArray)
  arraySize.addEventListener('change', createNewArray)

  // Rời màn hình mô phỏng thì tạm dừng (giữ nguyên bước hiện tại).
  document.addEventListener('algovision:viewchange', () => {
    if (arrayBars.closest('[hidden]')) {
      simulation.pause()
    }
  })

  selectAlgorithm(selectedAlgorithm)
}
