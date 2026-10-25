
export function initSearching() {
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

  const requiredElements = [
    searchArrayElement,
    searchTargetInput,
    searchAlgorithmSelect,
    searchMessage,
    searchComparisons,
    searchSpeedInput,
    searchNextButton,
    searchRunButton,
    searchPauseButton,
  ]

  if (requiredElements.some((element) => !element)) {
    console.error(
      'Không thể khởi tạo tìm kiếm: thiếu phần tử HTML cần thiết.',
    )
    return
  }

  let searchNumbers = []
  let searchIndex = 0
  let searchCount = 0
  let searchFinished = false
  let searchTimer = null
  let searchLeft = 0
  let searchRight = -1
  let searchMid = -1
  let searchFoundIndex = -1

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

  function stopSearchAnimation() {
    if (searchTimer !== null) {
      clearInterval(searchTimer)
      searchTimer = null
    }

    searchPauseButton.disabled = true
  }

  function renderSearchRange() {
    if (!searchRangePanel) {
      return
    }

    const binary = isBinarySearch()
    searchRangePanel.hidden = !binary

    if (!binary) {
      return
    }

    if (searchLeftValue) {
      searchLeftValue.textContent =
        searchLeft <= searchRight ? String(searchLeft + 1) : '—'
    }

    if (searchMidValue) {
      searchMidValue.textContent =
        searchMid >= 0 ? String(searchMid + 1) : 'Chưa xác định'
    }

    if (searchRightValue) {
      searchRightValue.textContent =
        searchLeft <= searchRight ? String(searchRight + 1) : '—'
    }

    if (!searchRangeMessage) {
      return
    }

    if (searchFinished && searchFoundIndex !== -1) {
      searchRangeMessage.textContent =
        `Đã tìm thấy giá trị tại vị trí ${searchFoundIndex + 1}.`
    } else if (searchFinished) {
      searchRangeMessage.textContent =
        'Đã hết phạm vi tìm kiếm. Không tìm thấy giá trị cần tìm.'
    } else if (searchMid === -1) {
      searchRangeMessage.textContent =
        'Chưa kiểm tra phần tử nào. Nhấn Bước tiếp theo để bắt đầu.'
    } else {
      searchRangeMessage.textContent =
        `Đang xét phần tử ở vị trí ${searchMid + 1}.`
    }
  }

  function renderSearchArray() {
    searchArrayElement.innerHTML = ''

    const binary = isBinarySearch()

    searchNumbers.forEach((number, index) => {
      const cell = document.createElement('div')
      cell.className = 'search-cell'
      cell.textContent = String(number)

      if (index === searchFoundIndex) {
        cell.classList.add('is-found')
      } else if (
        !searchFinished &&
        binary &&
        index === searchMid
      ) {
        cell.classList.add('is-current')
      } else if (
        !searchFinished &&
        !binary &&
        index === searchIndex
      ) {
        cell.classList.add('is-current')
      } else if (
        binary &&
        (index < searchLeft || index > searchRight)
      ) {
        cell.classList.add('is-eliminated')
      } else if (!binary && index < searchIndex) {
        cell.classList.add('is-eliminated')
      }

      searchArrayElement.appendChild(cell)
    })

    searchComparisons.textContent = String(searchCount)

    const isRunning = searchTimer !== null

    searchNextButton.disabled = searchFinished || isRunning
    searchRunButton.disabled = searchFinished || isRunning
    searchPauseButton.disabled = !isRunning

    renderSearchRange()
  }

  function renderSearchMessage() {
    if (searchFinished) {
      if (searchFoundIndex !== -1) {
        searchMessage.textContent =
          `Đã tìm thấy ${getTarget()} tại vị trí ${searchFoundIndex + 1}.`
      } else {
        searchMessage.textContent =
          `Không tìm thấy ${getTarget()} trong mảng.`
      }
    }

    if (searchResult) {
      searchResult.textContent = searchFinished
        ? searchFoundIndex !== -1
          ? `Tìm thấy tại vị trí ${searchFoundIndex + 1}.`
          : 'Không tìm thấy giá trị.'
        : 'Chưa có kết quả.'
    }
  }

  function resetSearch() {
    stopSearchAnimation()

    searchIndex = 0
    searchCount = 0
    searchFinished = false
    searchLeft = 0
    searchRight = searchNumbers.length - 1
    searchMid = -1
    searchFoundIndex = -1

    searchMessage.textContent =
      'Nhập giá trị cần tìm, sau đó bắt đầu mô phỏng.'

    if (searchResult) {
      searchResult.textContent = 'Chưa có kết quả.'
    }

    renderSearchArray()
  }

  function createSearchArray() {
    stopSearchAnimation()

    searchNumbers = Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 91) + 10,
    )

    if (isBinarySearch()) {
      searchNumbers.sort((a, b) => a - b)
    }

    resetSearch()
  }

  function finishSearch(foundIndex = -1) {
    searchFoundIndex = foundIndex
    searchFinished = true

    stopSearchAnimation()
    renderSearchArray()
    renderSearchMessage()
  }

  function showNextSearchStep() {
    if (searchFinished) {
      stopSearchAnimation()
      return
    }

    const target = getTarget()

    if (target === null) {
      stopSearchAnimation()
      searchMessage.textContent =
        'Vui lòng nhập một giá trị số hợp lệ.'
      return
    }

    if (searchNumbers.length === 0) {
      finishSearch()
      return
    }

    if (isBinarySearch()) {
      if (searchLeft > searchRight) {
        finishSearch()
        return
      }

      searchMid = Math.floor((searchLeft + searchRight) / 2)

      const currentValue = searchNumbers[searchMid]
      searchCount++

      if (currentValue === target) {
        finishSearch(searchMid)
        return
      }

      if (currentValue < target) {
        searchMessage.textContent =
          `${currentValue} nhỏ hơn ${target}. Tiếp tục tìm ở nửa bên phải.`

        searchLeft = searchMid + 1
      } else {
        searchMessage.textContent =
          `${currentValue} lớn hơn ${target}. Tiếp tục tìm ở nửa bên trái.`

        searchRight = searchMid - 1
      }

      if (searchLeft > searchRight) {
        finishSearch()
        return
      }
    } else {
      if (searchIndex >= searchNumbers.length) {
        finishSearch()
        return
      }

      const currentValue = searchNumbers[searchIndex]
      searchCount++

      if (currentValue === target) {
        finishSearch(searchIndex)
        return
      }

      searchMessage.textContent =
        `${currentValue} khác ${target}. Chuyển sang phần tử tiếp theo.`

      searchIndex++

      if (searchIndex >= searchNumbers.length) {
        finishSearch()
        return
      }
    }

    renderSearchArray()
  }

  function runSearchAnimation() {
    if (searchFinished || searchTimer !== null) {
      return
    }

    if (getTarget() === null) {
      searchMessage.textContent =
        'Vui lòng nhập một giá trị số hợp lệ trước khi tìm kiếm.'
      return
    }

    searchPauseButton.disabled = false

    searchTimer = setInterval(() => {
      showNextSearchStep()
    }, Number(searchSpeedInput.value))

    renderSearchArray()
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

  searchRunButton.addEventListener('click', runSearchAnimation)

  searchPauseButton.addEventListener('click', () => {
    stopSearchAnimation()
    renderSearchArray()
  })

  searchTargetInput.addEventListener('change', resetSearch)

  searchAlgorithmSelect.addEventListener('change', createSearchArray)

  searchSpeedInput.addEventListener('input', () => {
    if (searchSpeedValue) {
      searchSpeedValue.textContent = `${searchSpeedInput.value} ms`
    }

    if (searchTimer !== null) {
      stopSearchAnimation()
      runSearchAnimation()
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

  createSearchArray()
}
