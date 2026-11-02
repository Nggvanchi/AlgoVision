import { createSimulationController } from './simulation-controller.js'
import { renderPseudocode, highlightPseudocodeLine } from './pseudocode-view.js'
import { computeHashTableLayout, HASH_TABLE_LAYOUT, scrollTargetFor } from './hash-table-layout.js'
import {
  buildHashTable,
  containsKey,
  countEntries,
  countTombstones,
  createHashTable,
  hasEntry,
  loadFactor,
} from './structures/hashTable.js'
import { createHashStepFactory } from './algorithms/hashTableStep.js'
import {
  chainingInsertPseudocode,
  generateHashTableInsertSteps,
  probingInsertPseudocode,
} from './algorithms/hashTableInsert.js'
import {
  chainingSearchPseudocode,
  generateHashTableSearchSteps,
  probingSearchPseudocode,
} from './algorithms/hashTableSearch.js'
import {
  chainingDeletePseudocode,
  generateHashTableDeleteSteps,
  probingDeletePseudocode,
} from './algorithms/hashTableDelete.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

// Giới hạn của giao diện (tầng cấu trúc chỉ yêu cầu khóa nguyên).
const MIN_KEY = 0
const MAX_KEY = 99
const MAX_CHAINING_ENTRIES = 15
const CAPACITIES = [5, 7, 11]
const DEFAULT_CAPACITY = 7
const DEFAULT_SPEED = 700

const SAMPLE_PRESET = { capacity: 7, keys: [15, 8, 22, 3, 11, 30] }
const COLLISION_BUCKET = 3

const IDLE_MESSAGE = 'Chọn thao tác, nhập khóa rồi bấm Thực hiện.'
const RESET_NOTE =
  'Đã tua minh họa về bước đầu. Bảng hiện tại vẫn gồm kết quả thao tác trước; thao tác tiếp theo sẽ chạy trên bảng đó.'

export const strategyNames = {
  chaining: 'chaining',
  probing: 'linear probing',
}

export const hashTableOperations = {
  insert: {
    name: 'Insert',
    pseudocode: { chaining: chainingInsertPseudocode, probing: probingInsertPseudocode },
    generate: generateHashTableInsertSteps,
  },
  search: {
    name: 'Search',
    pseudocode: { chaining: chainingSearchPseudocode, probing: probingSearchPseudocode },
    generate: generateHashTableSearchSteps,
  },
  delete: {
    name: 'Delete',
    pseudocode: { chaining: chainingDeletePseudocode, probing: probingDeletePseudocode },
    generate: generateHashTableDeleteSteps,
  },
}

// Hệ số tải luôn hiển thị 2 chữ số thập phân với dấu phẩy (không phụ thuộc locale của trình duyệt).
export function formatLoadFactor(value) {
  return value.toFixed(2).replace('.', ',')
}

// Khóa 3 + k·m (trong 0–99) đều rơi vào ô 3. Chaining tối đa 15 khóa; probing tối đa m − 1 để còn ô trống.
export function collisionPresetKeys(capacity, strategy) {
  const limit = strategy === 'probing' ? capacity - 1 : MAX_CHAINING_ENTRIES
  const keys = []

  for (let key = COLLISION_BUCKET; key <= MAX_KEY && keys.length < limit; key += capacity) {
    keys.push(key)
  }

  return keys
}

export function formatResult(step) {
  const { key, result, currentBucket } = step

  switch (result) {
    case 'inserted': return `Đã chèn ${key} vào ô ${currentBucket}`
    case 'duplicate': return `${key} đã tồn tại`
    case 'full': return 'Bảng đầy'
    case 'found': return `Tìm thấy ${key} ở ô ${currentBucket}`
    case 'deleted': return `Đã xóa ${key}`
    case 'not-found': return `Không tìm thấy ${key}`
    default: return 'Chưa có'
  }
}

export function describeTable(table) {
  const base = `Bảng băm ${strategyNames[table.strategy]}, m = ${table.capacity}, n = ${countEntries(table)}, `
    + `hệ số tải ${formatLoadFactor(loadFactor(table))}`

  return table.strategy === 'probing' ? `${base}, ${countTombstones(table)} tombstone.` : `${base}.`
}

function createSvgElement(document, name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name)

  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value))
  }

  return element
}

function appendText(document, parent, attributes, text) {
  const element = createSvgElement(document, 'text', attributes)
  element.textContent = text
  parent.appendChild(element)
  return element
}

// Ô đầu của hàng: chaining hiện "∅" khi chain rỗng; probing hiện "—" (trống) hoặc "DEL" (tombstone).
function cellContent(table, index) {
  if (table.strategy === 'probing') {
    const { kind } = table.cells[index]
    if (kind === 'tombstone') return { label: 'DEL', kind }
    return { label: kind === 'empty' ? '—' : '', kind }
  }

  return { label: table.buckets[index].length === 0 ? '∅' : '', kind: 'bucket' }
}

function renderRow(document, svg, step, bucket, probed) {
  const { CELL_WIDTH, CELL_HEIGHT } = HASH_TABLE_LAYOUT
  const { index } = bucket
  const row = createSvgElement(document, 'g', { class: 'hash-row', 'data-bucket': index })
  const isCurrent = step.currentBucket === index
  const { label, kind } = cellContent(step.table, index)

  if (isCurrent) row.classList.add('is-current')
  if (probed.has(index)) row.classList.add('is-probed')

  // Ô đang xét có thêm ký hiệu ▶, không chỉ đổi màu.
  appendText(document, row, { class: 'hash-row-marker', x: 2, y: bucket.centerY, dy: '0.35em' }, isCurrent ? '▶' : '')
  appendText(
    document,
    row,
    { class: 'hash-row-index', x: bucket.x - 6, y: bucket.centerY, dy: '0.35em', 'text-anchor': 'end' },
    `[${index}]`,
  )

  const cell = createSvgElement(document, 'rect', {
    class: `hash-cell is-${kind}`,
    x: bucket.x,
    y: bucket.y,
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    rx: 6,
  })
  row.appendChild(cell)

  if (kind === 'tombstone') {
    row.appendChild(createSvgElement(document, 'rect', {
      class: 'hash-cell-hatch',
      x: bucket.x,
      y: bucket.y,
      width: CELL_WIDTH,
      height: CELL_HEIGHT,
      rx: 6,
      fill: 'url(#hash-tombstone-hatch)',
    }))
  }

  appendText(
    document,
    row,
    { class: 'hash-cell-label', x: bucket.centerX, y: bucket.centerY, dy: '0.35em', 'text-anchor': 'middle' },
    label,
  )

  svg.appendChild(row)
}

function renderEntry(document, svg, step, id, position, key, pathIds) {
  const { CELL_WIDTH, CELL_HEIGHT } = HASH_TABLE_LAYOUT
  const x = position.centerX - CELL_WIDTH / 2
  const y = position.centerY - CELL_HEIGHT / 2
  const group = createSvgElement(document, 'g', {
    class: 'hash-entry',
    'data-id': id,
    'data-key': key,
    'data-bucket': position.bucketIndex,
  })

  if (pathIds.has(id)) group.classList.add('is-path')
  if (id === step.currentEntryId) group.classList.add('is-current')

  // Tìm thấy / vừa chèn: vòng kép (thêm một khung ngoài), không chỉ đổi màu.
  if (id === step.foundEntryId || id === step.insertedEntryId) {
    group.classList.add('is-found')
    group.appendChild(createSvgElement(document, 'rect', {
      class: 'hash-entry-ring',
      x: x - 4,
      y: y - 4,
      width: CELL_WIDTH + 8,
      height: CELL_HEIGHT + 8,
      rx: 9,
    }))
  }

  group.appendChild(createSvgElement(document, 'rect', {
    class: 'hash-entry-box', x, y, width: CELL_WIDTH, height: CELL_HEIGHT, rx: 6,
  }))
  appendText(
    document,
    group,
    { class: 'hash-entry-label', x: position.centerX, y: position.centerY, dy: '0.35em', 'text-anchor': 'middle' },
    String(key),
  )

  svg.appendChild(group)
}

function renderChainLinks(document, svg, table, layout) {
  const { CELL_WIDTH, LINK_GAP } = HASH_TABLE_LAYOUT

  table.buckets.forEach((bucket, index) => {
    bucket.forEach((entry) => {
      const { centerX, centerY } = layout.entries[entry.id]
      const x2 = centerX - CELL_WIDTH / 2
      svg.appendChild(createSvgElement(document, 'line', {
        class: 'hash-link',
        x1: x2 - LINK_GAP,
        y1: centerY,
        x2,
        y2: centerY,
        'data-bucket': index,
      }))
    })
  })
}

// Vẽ bảng của một bước vào SVG. Id phần tử hoặc chỉ số ô không có trong bảng của bước bị bỏ qua, không tô.
export function renderHashTable(svg, step) {
  const document = svg.ownerDocument
  const { table } = step
  const layout = computeHashTableLayout(table)
  const pathIds = new Set((step.pathEntryIds ?? []).filter((id) => hasEntry(table, id)))
  const probed = new Set(step.probedBuckets ?? [])

  svg.replaceChildren()
  svg.setAttribute('width', String(layout.width))
  svg.setAttribute('height', String(layout.height))
  svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`)

  const defs = createSvgElement(document, 'defs')
  const hatch = createSvgElement(document, 'pattern', {
    id: 'hash-tombstone-hatch',
    width: 6,
    height: 6,
    patternUnits: 'userSpaceOnUse',
    patternTransform: 'rotate(45)',
  })
  hatch.appendChild(createSvgElement(document, 'line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'hash-hatch-line' }))
  defs.appendChild(hatch)
  svg.appendChild(defs)

  layout.buckets.forEach((bucket) => renderRow(document, svg, step, bucket, probed))

  if (table.strategy === 'chaining') {
    renderChainLinks(document, svg, table, layout)
    table.buckets.forEach((bucket) => {
      bucket.forEach((entry) => renderEntry(document, svg, step, entry.id, layout.entries[entry.id], entry.key, pathIds))
    })
  } else {
    table.cells.forEach((cell) => {
      if (cell.kind === 'occupied') {
        renderEntry(document, svg, step, cell.id, layout.entries[cell.id], cell.key, pathIds)
      }
    })
  }

  return layout
}

export function initHashTable(document, options = {}) {
  const $ = (selector) => document.querySelector(selector)

  const section = $('#hash-table-section')
  const strategySelect = $('#hash-table-strategy')
  const capacitySelect = $('#hash-table-capacity')
  const operationSelect = $('#hash-table-operation')
  const keyInput = $('#hash-table-key')
  const applyButton = $('#hash-table-apply')
  const inputError = $('#hash-table-input-error')
  const sampleButton = $('#hash-table-preset-sample')
  const collisionButton = $('#hash-table-preset-collision')
  const clearButton = $('#hash-table-clear')
  const speedInput = $('#hash-table-speed')
  const speedValue = $('#hash-table-speed-value')
  const frame = $('#hash-table-frame')
  const svg = $('#hash-table-svg')
  const resetButton = $('#hash-table-reset')
  const previousButton = $('#hash-table-previous')
  const nextButton = $('#hash-table-next')
  const runButton = $('#hash-table-run')
  const pauseButton = $('#hash-table-pause')
  const message = $('#hash-table-message')
  const status = $('#hash-table-status')
  const pseudocodeTitle = $('#hash-table-pseudocode-title')
  const pseudocodeCode = $('#hash-table-pseudocode')
  const stats = {
    entryCount: $('#hash-table-entry-count'),
    capacity: $('#hash-table-capacity-value'),
    loadFactor: $('#hash-table-load-factor'),
    tombstones: $('#hash-table-tombstone-count'),
    currentBucket: $('#hash-table-current-bucket'),
    comparisons: $('#hash-table-comparisons'),
    probes: $('#hash-table-probes'),
    result: $('#hash-table-result'),
  }
  const probingOnlyCards = [$('#hash-table-probes-card'), $('#hash-table-tombstone-card')]

  const requiredElements = [
    section, strategySelect, capacitySelect, operationSelect, keyInput, applyButton, svg,
    resetButton, previousButton, nextButton, runButton, pauseButton, message,
  ]

  if (requiredElements.some((element) => !element)) {
    console.error('Không thể khởi tạo Hash Table: thiếu phần tử HTML cần thiết.')
    return
  }

  // Bảng đã chốt: kết quả của thao tác gần nhất, được chốt ngay khi sinh bước.
  let committedTable = buildHashTable(SAMPLE_PRESET.capacity, SAMPLE_PRESET.keys, 'chaining')
  let idleMessage = IDLE_MESSAGE
  let renderedPseudocode = null

  strategySelect.value = committedTable.strategy
  capacitySelect.value = String(committedTable.capacity)

  const simulation = createSimulationController({
    getDelay: () => Number(speedInput?.value) || DEFAULT_SPEED,
    onChange: render,
    scheduler: options.scheduler,
  })

  const isRunning = () => simulation.getSnapshot().state === 'running'

  function getSelectedOperation() {
    return hashTableOperations[operationSelect.value] ? operationSelect.value : 'insert'
  }

  function getSelectedStrategy() {
    return Object.hasOwn(strategyNames, strategySelect.value) ? strategySelect.value : 'chaining'
  }

  function getSelectedCapacity() {
    const capacity = Number(capacitySelect.value)
    return CAPACITIES.includes(capacity) ? capacity : DEFAULT_CAPACITY
  }

  function createIdleStep() {
    return createHashStepFactory(getSelectedOperation(), null)({ table: committedTable, message: idleMessage })
  }

  function getRunLabel(runMode) {
    if (runMode === 'resume') return 'Tiếp tục'
    if (runMode === 'restart') return 'Chạy lại'
    return 'Chạy minh họa'
  }

  // Mã giả chỉ vẽ lại khi đổi thao tác hoặc chiến lược; mỗi bước chỉ đổi dòng được tô.
  function renderPseudocodePanel(step) {
    const { strategy } = step.table
    const operation = hashTableOperations[step.operation]
    const pseudocodeKey = `${strategy}:${step.operation}`

    if (renderedPseudocode !== pseudocodeKey) {
      renderPseudocode(pseudocodeCode, operation.pseudocode[strategy])
      if (pseudocodeTitle) pseudocodeTitle.textContent = `Mã giả: ${operation.name} (${strategyNames[strategy]})`
      renderedPseudocode = pseudocodeKey
    }

    highlightPseudocodeLine(pseudocodeCode, step.pseudocodeLine)
  }

  // Bảng rộng/cao hơn khung thì cuộn để phần tử hoặc ô đang xét nằm giữa khung.
  function scrollToFocus(layout, step) {
    const target = scrollTargetFor(layout, step)
    if (!target || !frame) return

    if (frame.scrollWidth > frame.clientWidth) {
      frame.scrollLeft = Math.max(0, target.x - frame.clientWidth / 2)
    }
    if (frame.scrollHeight > frame.clientHeight) {
      frame.scrollTop = Math.max(0, target.y - frame.clientHeight / 2)
    }
  }

  function setText(element, text) {
    if (element) element.textContent = text
  }

  // Mọi số liệu đọc từ bảng của BƯỚC ĐANG HIỂN THỊ, không từ bảng đã chốt.
  function renderStats(step) {
    const { table } = step
    const isProbing = table.strategy === 'probing'

    setText(stats.entryCount, String(countEntries(table)))
    setText(stats.capacity, String(table.capacity))
    setText(stats.loadFactor, formatLoadFactor(loadFactor(table)))
    setText(stats.tombstones, String(countTombstones(table)))
    setText(stats.currentBucket, step.currentBucket === null ? '—' : String(step.currentBucket))
    setText(stats.comparisons, String(step.comparisons))
    setText(stats.probes, String(step.probes))
    setText(stats.result, step.finished ? formatResult(step) : 'Chưa có')

    probingOnlyCards.forEach((card) => {
      if (card) card.hidden = !isProbing
    })
  }

  function renderControls({ stepCount, controls }) {
    const hasSteps = stepCount > 0
    const running = isRunning()

    runButton.textContent = getRunLabel(controls.runMode)
    runButton.disabled = !hasSteps || !controls.run
    pauseButton.disabled = !controls.pause
    nextButton.disabled = !hasSteps || !controls.next
    previousButton.disabled = !controls.previous

    // Đang chạy thì khóa mọi thứ có thể đổi bảng giữa chừng minh họa.
    const lockable = [
      applyButton, operationSelect, keyInput, strategySelect, capacitySelect,
      sampleButton, collisionButton, clearButton,
    ]
    for (const element of lockable) {
      if (element) element.disabled = running
    }
  }

  function render(snapshot) {
    const step = snapshot.step ?? createIdleStep()
    const layout = renderHashTable(svg, step)

    svg.setAttribute('aria-label', describeTable(step.table))
    scrollToFocus(layout, step)
    renderStats(step)
    renderPseudocodePanel(step)
    message.textContent = step.message
    renderControls(snapshot)
  }

  function showInputError(text) {
    if (inputError) {
      inputError.textContent = text
      inputError.hidden = text === ''
    }
    keyInput.setAttribute('aria-invalid', text === '' ? 'false' : 'true')
  }

  function setStatus(text) {
    setText(status, text)
  }

  // Trả về khóa hợp lệ hoặc null (đã báo lỗi).
  function readKey(operationName) {
    const raw = keyInput.value.trim()
    const key = Number(raw)

    if (raw === '' || !Number.isInteger(key) || key < MIN_KEY || key > MAX_KEY) {
      showInputError(`Khóa phải là số nguyên từ ${MIN_KEY} đến ${MAX_KEY}.`)
      return null
    }

    // Kiểm tra trùng trước: khóa đã có thì vẫn minh họa (kết quả "đã tồn tại") dù đã đủ phần tử.
    // Probing không chặn ở đây: generator tự minh họa "bảng đầy" (còn tombstone thì vẫn chèn được).
    const isChainingFull = committedTable.strategy === 'chaining'
      && countEntries(committedTable) >= MAX_CHAINING_ENTRIES
    if (operationName === 'insert' && isChainingFull && !containsKey(committedTable, key)) {
      showInputError(`Bảng đã đủ ${MAX_CHAINING_ENTRIES} phần tử: hãy xóa bớt trước khi chèn khóa mới.`)
      return null
    }

    return key
  }

  function applyOperation() {
    if (isRunning()) return

    const operationName = getSelectedOperation()
    const key = readKey(operationName)
    if (key === null) return

    showInputError('')
    setStatus('')

    const steps = hashTableOperations[operationName].generate(committedTable, key)
    committedTable = steps.at(-1).table
    simulation.load(steps)
  }

  function loadTable(table, text, statusText = '') {
    committedTable = table
    idleMessage = text
    strategySelect.value = table.strategy
    capacitySelect.value = String(table.capacity)
    showInputError('')
    setStatus(statusText)
    simulation.load([])
  }

  // Đổi m hoặc chiến lược: chưa minh họa rehash nên tạo bảng rỗng mới.
  function recreateEmptyTable() {
    if (isRunning()) return

    const table = createHashTable(getSelectedCapacity(), getSelectedStrategy())
    loadTable(
      table,
      'Bảng đang rỗng. Hãy chèn khóa đầu tiên hoặc chọn một bảng mẫu.',
      `Đã tạo bảng rỗng mới: ${strategyNames[table.strategy]}, m = ${table.capacity}.`,
    )
  }

  function resetIllustration() {
    const hasSteps = simulation.getSnapshot().stepCount > 0
    simulation.reset()

    if (hasSteps) setStatus(RESET_NOTE)
  }

  applyButton.addEventListener('click', applyOperation)
  nextButton.addEventListener('click', simulation.next)
  previousButton.addEventListener('click', simulation.previous)
  runButton.addEventListener('click', simulation.run)
  pauseButton.addEventListener('click', simulation.pause)
  resetButton.addEventListener('click', resetIllustration)
  strategySelect.addEventListener('change', recreateEmptyTable)
  capacitySelect.addEventListener('change', recreateEmptyTable)

  // Đổi thao tác thì bỏ minh họa cũ (bảng đã chốt không mất), hiển thị mã giả của thao tác mới.
  operationSelect.addEventListener('change', () => {
    if (isRunning()) return
    idleMessage = IDLE_MESSAGE
    showInputError('')
    setStatus('')
    simulation.load([])
  })

  sampleButton?.addEventListener('click', () => {
    if (isRunning()) return
    const { capacity, keys } = SAMPLE_PRESET
    loadTable(
      buildHashTable(capacity, keys, getSelectedStrategy()),
      `Đã nạp bảng mẫu m = ${capacity}: ${keys.join(', ')}. Ba khóa 15, 8, 22 cùng rơi vào ô 1.`,
    )
  })

  collisionButton?.addEventListener('click', () => {
    if (isRunning()) return
    const capacity = getSelectedCapacity()
    const strategy = getSelectedStrategy()
    const keys = collisionPresetKeys(capacity, strategy)
    loadTable(
      buildHashTable(capacity, keys, strategy),
      `Đã nạp ${keys.length} khóa ${keys[0]}, ${keys[1]}, … (dạng 3 + k·${capacity}): mọi khóa có cùng hash ${COLLISION_BUCKET}.`,
    )
  })

  clearButton?.addEventListener('click', () => {
    if (isRunning()) return
    loadTable(
      createHashTable(getSelectedCapacity(), getSelectedStrategy()),
      'Đã xóa toàn bộ bảng. Hãy chèn khóa đầu tiên.',
    )
  })

  speedInput?.addEventListener('input', () => {
    if (speedValue) speedValue.textContent = `${speedInput.value} ms`
  })

  // Rời màn hình mô phỏng thì tạm dừng (giữ nguyên bước hiện tại).
  document.addEventListener('algovision:viewchange', () => {
    if (svg.closest('[hidden]')) {
      simulation.pause()
    }
  })

  render(simulation.getSnapshot())
}
