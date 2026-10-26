
import { generateBubbleSortSteps } from './algorithms/bubbleSort.js'
import { generateSelectionSortSteps } from './algorithms/selectionSort.js'
import { generateInsertionSortSteps } from './algorithms/insertionSort.js'

export function initSorting() {
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

  const algorithmCards = document.querySelectorAll('.algorithm-card')
  const complexityTitle = document.querySelector('.complexity-heading span')
  const complexityCards = document.querySelectorAll('.complexity-card strong')

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

  let numbers = []
  let steps = []
  let currentStepIndex = 0
  let animationTimer = null
  let simulationState = 'ready'
  let animationSpeed = Number(speedControl.value) || 650
  let selectedAlgorithm = 'bubble'

  function stopAnimation(nextState = 'paused') {
    if (animationTimer !== null) {
      clearInterval(animationTimer)
      animationTimer = null
    }

    simulationState = nextState
  }

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
    shiftCount.textContent = currentStep.shifts ?? 0
    stepCount.textContent = `${currentStepIndex + 1} / ${steps.length}`
    simulationMessage.textContent = currentStep.message
    arrayCount.textContent = `${numbers.length} phần tử`

    const isRunning = simulationState === 'running'
    const isCompleted =
      simulationState === 'completed' || Boolean(currentStep.finished)

    runButton.disabled = isRunning || isCompleted
    pauseButton.disabled = !isRunning
    stepButton.disabled = isRunning || isCompleted
    previousButton.disabled = isRunning || currentStepIndex === 0
  }

  function createNewArray() {
    stopAnimation('ready')

    numbers = generateArray(Number(arraySize.value))
    steps = algorithmConfig[selectedAlgorithm].generateSteps(numbers)
    currentStepIndex = 0

    renderArray()
  }

  function showNextStep() {
    if (simulationState === 'running' && animationTimer === null) {
      return
    }

    if (currentStepIndex >= steps.length - 1) {
      stopAnimation('completed')
      renderArray()
      return
    }

    currentStepIndex++

    if (steps[currentStepIndex].finished) {
      stopAnimation('completed')
    }

    renderArray()
  }

  function startAnimation() {
    if (
      simulationState === 'running' ||
      simulationState === 'completed' ||
      steps.length === 0
    ) {
      return
    }

    simulationState = 'running'
    renderArray()

    animationTimer = setInterval(() => {
      showNextStep()
    }, animationSpeed)
  }

  function resetSimulation() {
    stopAnimation('ready')
    currentStepIndex = 0
    renderArray()
  }

  function selectAlgorithm(algorithm) {
    if (!algorithmConfig[algorithm]) {
      return
    }

    selectedAlgorithm = algorithm

    algorithmCards.forEach((card) => {
      card.classList.toggle(
        'selected',
        card.dataset.algorithm === selectedAlgorithm,
      )
    })

    const config = algorithmConfig[selectedAlgorithm]

    visualizerTitle.textContent = config.name
    visualizerDescription.textContent = config.description
    runButton.textContent = `Chạy ${config.name}`

    complexityTitle.textContent = config.name.toUpperCase()

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

  runButton.addEventListener('click', startAnimation)

  pauseButton.addEventListener('click', () => {
    if (simulationState !== 'running') {
      return
    }

    stopAnimation('paused')
    renderArray()
  })

  stepButton.addEventListener('click', () => {
    if (simulationState === 'running' || simulationState === 'completed') {
      return
    }

    showNextStep()
  })

  resetButton.addEventListener('click', resetSimulation)

  previousButton.addEventListener('click', () => {
    if (
      simulationState === 'running' ||
      currentStepIndex === 0
    ) {
      return
    }

    if (simulationState === 'completed') {
      simulationState = 'paused'
    }

    currentStepIndex--
    renderArray()
  })

  speedControl.addEventListener('change', () => {
    const newSpeed = Number(speedControl.value)

    if (!Number.isFinite(newSpeed) || newSpeed <= 0) {
      return
    }

    animationSpeed = newSpeed

    if (simulationState === 'running') {
      if (animationTimer !== null) {
        clearInterval(animationTimer)
      }

      animationTimer = setInterval(() => {
        showNextStep()
      }, animationSpeed)
    }
  })

  startButton.addEventListener('click', createNewArray)
  arraySize.addEventListener('change', createNewArray)

  selectAlgorithm(selectedAlgorithm)
}
