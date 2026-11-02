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

// Big-O phải khớp generator (xem tests/hash-table-complexity.test.js, tests/hash-table-probing-complexity.test.js).
// Chaining: mọi thao tác duyệt đúng một chain, chi phí = độ dài chain (trung bình α = n/m).
const CHAINING_COMPLEXITY = {
  tag: 'O(1 + α)',
  best: 'O(1)',
  average: 'O(1 + α)',
  averageNote:
    'Hàm băm phân tán đều thì mỗi chain dài trung bình α = n/m. Giữ α không vượt một hằng số (bằng rehash khi bảng đầy dần) thì chi phí là O(1).',
  worst: 'O(n)',
  worstNote: 'Mọi khóa rơi vào cùng một ô: chain dài n, phải so sánh lần lượt như danh sách liên kết.',
  space: 'O(m + n)',
  spaceNote: 'm ô đầu chain cộng n phần tử.',
}

// Linear probing: probes = số ô đã dò. Công thức Knuth là số ô dò kỳ vọng.
const KNUTH_FOUND = '½(1 + 1/(1 − α))'
const KNUTH_NOT_FOUND = '½(1 + 1/(1 − α)²)'
const PROBING_COMPLEXITY = {
  tag: 'O(1) trung bình',
  best: 'O(1)',
  averageNote:
    'Số ô dò kỳ vọng theo Knuth, giả định hàm băm đều và chưa có xóa. Khi đã có tombstone, chi phí phụ thuộc số ô không trống, tức (n + tombstone)/m, chứ không chỉ α. α càng gần 1 thì chi phí tăng vọt.',
  worst: 'O(m)',
  worstNote: 'Cụm va chạm dài hoặc nhiều tombstone buộc phải dò cả bảng; tombstone cũng phải dò dù n nhỏ.',
  space: 'O(m)',
  spaceNote: 'Một mảng m ô, n ≤ m, không cần nút phụ.',
}

const complexityFor = {
  chaining: {
    insert: { ...CHAINING_COMPLEXITY, bestNote: 'Ô đích rỗng: không có khóa nào để so sánh.' },
    search: { ...CHAINING_COMPLEXITY, bestNote: 'Khóa nằm ở đầu chain, hoặc ô rỗng.' },
    delete: { ...CHAINING_COMPLEXITY, bestNote: 'Khóa nằm ở đầu chain.' },
  },
  probing: {
    insert: {
      ...PROBING_COMPLEXITY,
      average: `≈ ${KNUTH_NOT_FOUND} ô`,
      bestNote: 'Ô hash(key) đang trống: 1 lần dò.',
    },
    search: {
      ...PROBING_COMPLEXITY,
      average: `Thấy ≈ ${KNUTH_FOUND} ô, không thấy ≈ ${KNUTH_NOT_FOUND} ô`,
      bestNote: 'Ô hash(key) chứa đúng khóa hoặc đang trống: 1 lần dò.',
    },
    delete: {
      ...PROBING_COMPLEXITY,
      average: `≈ ${KNUTH_FOUND} ô (như tìm thấy)`,
      bestNote: 'Ô hash(key) chứa đúng khóa: 1 lần dò.',
    },
  },
}

const learningFor = {
  chaining: {
    insert: {
      description:
        'Tính i = key mod m rồi duyệt chain của ô i để kiểm tra trùng. Không có khóa bằng key thì nối key vào cuối chain. Số phép so sánh bằng độ dài chain của ô i.',
      advantages: 'Bảng không bao giờ "đầy": chain dài thêm được, α có thể vượt 1.',
      disadvantages:
        'Vì phải kiểm tra trùng nên tốn cả chain; chỉ khi không cần kiểm tra trùng mới chèn đầu chain trong O(1). Chain dài khi hàm băm phân tán kém.',
    },
    search: {
      description:
        'Tính i = key mod m, rồi so key với từng phần tử trong chain của ô i. Hết chain mà không thấy thì kết luận không có, không cần xét ô khác.',
      advantages: 'Chỉ xét một ô; khóa ở ô khác không ảnh hưởng tới chi phí.',
      disadvantages: 'Mọi khóa cùng một ô thì tìm kiếm thành tuần tự O(n); duyệt chain cũng kém thân thiện với bộ nhớ đệm.',
    },
    delete: {
      description:
        'Tìm phần tử mang key trong chain của ô i rồi gỡ nó khỏi chain. Các phần tử khác giữ nguyên vị trí.',
      advantages: 'Xóa thật sự, không để lại dấu vết: tìm kiếm sau đó không bị chậm đi.',
      disadvantages: 'Vẫn phải tìm trước khi xóa nên chi phí bằng chi phí tìm kiếm.',
    },
  },
  probing: {
    insert: {
      description:
        'Dò lần lượt ô (i + j) mod m. Gặp tombstone thì ghi nhớ ô đầu tiên làm vị trí chèn nhưng vẫn dò tiếp để kiểm tra trùng; gặp ô trống thì dừng. Chỉ báo "bảng đầy" khi đã dò đủ m ô, không có ô trống, không có tombstone và khóa chưa tồn tại.',
      advantages: 'Mọi khóa nằm ngay trong mảng, không cần cấp phát nút; dò ô liền kề thân thiện với bộ nhớ đệm.',
      disadvantages:
        'Va chạm tạo thành cụm (primary clustering): khóa mới rơi vào cụm làm cụm dài thêm. Tối đa m khóa.',
    },
    search: {
      description:
        'Dò từ ô key mod m sang phải (vòng lại đầu bảng). Ô trống nghĩa là key chưa từng được đặt xa hơn nên dừng; tombstone thì bỏ qua và dò tiếp; dò đủ m ô thì dừng.',
      advantages: 'Bảng thưa thì thường chỉ cần một vài lần dò.',
      disadvantages: 'Bảng gần đầy hoặc nhiều tombstone thì phải dò rất xa, xấu nhất là cả m ô.',
    },
    delete: {
      description:
        'Tìm ô chứa key rồi thay bằng tombstone, không đặt về trống. Nếu đặt về trống, chuỗi dò của các khóa từng bị đẩy qua ô này sẽ bị cắt: tìm kiếm dừng ở ô trống và báo nhầm "không tìm thấy".',
      advantages: 'Giữ đúng mọi chuỗi dò mà không phải di chuyển khóa khác.',
      disadvantages:
        'Tombstone vẫn chiếm chỗ trên đường dò nên tìm kiếm chậm dần; cần dọn bằng cách rehash (chưa minh họa ở đây).',
    },
  },
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
  const complexityTag = $('#hash-table-complexity')
  const complexityTitle = $('#hash-table-complexity-title')
  const complexityLive = $('#hash-table-complexity-live')
  const complexityCells = {
    best: $('#hash-table-complexity-best'),
    bestNote: $('#hash-table-complexity-best-note'),
    average: $('#hash-table-complexity-average'),
    averageNote: $('#hash-table-complexity-average-note'),
    worst: $('#hash-table-complexity-worst'),
    worstNote: $('#hash-table-complexity-worst-note'),
    space: $('#hash-table-complexity-space'),
    spaceNote: $('#hash-table-complexity-space-note'),
  }
  const learningCells = {
    description: $('#hash-table-learning-description'),
    advantages: $('#hash-table-learning-advantages'),
    disadvantages: $('#hash-table-learning-disadvantages'),
  }

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
  let renderedInfo = null

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

  function fillText(cells, values) {
    for (const [key, element] of Object.entries(cells)) {
      if (element) element.textContent = values[key] ?? ''
    }
  }

  // Mã giả, Big-O và lý thuyết chỉ vẽ lại khi đổi thao tác hoặc chiến lược; mỗi bước chỉ đổi dòng được tô.
  function renderOperationInfo(step) {
    const { strategy } = step.table
    const operation = hashTableOperations[step.operation]
    const infoKey = `${strategy}:${step.operation}`

    if (renderedInfo !== infoKey) {
      const complexity = complexityFor[strategy][step.operation]

      renderPseudocode(pseudocodeCode, operation.pseudocode[strategy])
      setText(pseudocodeTitle, `Mã giả: ${operation.name} (${strategyNames[strategy]})`)
      setText(complexityTag, complexity.tag)
      setText(complexityTitle, `${operation.name} · ${strategyNames[strategy]}`.toUpperCase())
      fillText(complexityCells, complexity)
      fillText(learningCells, learningFor[strategy][step.operation])
      renderedInfo = infoKey
    }

    highlightPseudocodeLine(pseudocodeCode, step.pseudocodeLine)
  }

  // Số liệu của Learning Panel cũng đọc từ bảng của bước đang hiển thị.
  function describeLiveLoad(table) {
    const n = countEntries(table)
    const base = `Bảng đang hiển thị: n = ${n}, m = ${table.capacity}, α = ${formatLoadFactor(loadFactor(table))}`

    if (table.strategy !== 'probing') return `${base}.`

    const tombstones = countTombstones(table)
    return `${base}, tombstone = ${tombstones}, (n + tombstone)/m = ${formatLoadFactor((n + tombstones) / table.capacity)}.`
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
    setText(complexityLive, describeLiveLoad(table))

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
    renderOperationInfo(step)
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
