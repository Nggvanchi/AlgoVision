import { createSimulationController } from './simulation-controller.js'
import { renderPseudocode, highlightPseudocodeLine } from './pseudocode-view.js'
import { computeTreeLayout, TREE_LAYOUT } from './tree-layout.js'
import {
  buildTree,
  createTree,
  findNodeId,
  getHeight,
  getNodeCount,
  toInorderValues,
} from './structures/bst.js'
import { createBstStepFactory } from './algorithms/bstStep.js'
import { generateBstInsertSteps, bstInsertPseudocode } from './algorithms/bstInsert.js'
import { generateBstSearchSteps, bstSearchPseudocode } from './algorithms/bstSearch.js'
import { generateBstDeleteSteps, bstDeletePseudocode } from './algorithms/bstDelete.js'
import { generateBstTraversalSteps, bstTraversalPseudocode } from './algorithms/bstTraversal.js'
import { generateBstMinMaxSteps, bstMinMaxPseudocode } from './algorithms/bstMinMax.js'
import { generateBstHeightSteps, bstHeightPseudocode } from './algorithms/bstHeight.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

// Giới hạn của giao diện (tầng cấu trúc chỉ yêu cầu số nguyên).
const MAX_NODES = 15
const MIN_VALUE = 1
const MAX_VALUE = 99
const DEFAULT_SPEED = 700

const BALANCED_PRESET = [50, 30, 70, 20, 40, 60, 80]
const DEGENERATE_PRESET = Array.from({ length: MAX_NODES }, (_, index) => index + 1)

const IDLE_MESSAGE = 'Chọn thao tác rồi bấm Thực hiện.'
const RESET_NOTE =
  'Đã tua minh họa về bước đầu. Cây hiện tại vẫn gồm kết quả thao tác trước; thao tác tiếp theo sẽ chạy trên cây đó.'

// Big-O phải khớp generator (xem tests/bst-complexity.test.js).
// Thao tác đi trên một đường từ gốc xuống: O(h), cài bằng vòng lặp nên bộ nhớ phụ O(1).
const PATH_COMPLEXITY = {
  tag: 'O(h)',
  best: 'O(1)',
  balanced: 'O(log n)',
  degenerate: 'O(n)',
  space: 'O(1)',
  spaceNote: 'Cài bằng vòng lặp, chỉ giữ vài biến con trỏ.',
}

// Thao tác phải thăm mọi nút: O(n) với mọi hình dạng cây; đệ quy tốn ngăn xếp O(h).
const FULL_COMPLEXITY = {
  tag: 'O(n)',
  best: 'O(n)',
  balanced: 'O(n)',
  degenerate: 'O(n)',
  space: 'O(h)',
  bestNote: 'Phải thăm mọi nút dù cây có hình dạng nào.',
  spaceNote: 'Ngăn xếp đệ quy sâu bằng chiều cao cây, tức O(n) khi cây suy biến.',
}

const TRAVERSAL_LEARNING = {
  inorder: {
    description:
      'Thăm cây con trái, rồi tới nút, rồi cây con phải. Với BST, Inorder luôn cho dãy giá trị tăng dần.',
    advantages:
      'Lấy được dãy đã sắp xếp từ cây trong O(n); cũng là cách kiểm tra một cây có đúng là BST hay không.',
    disadvantages:
      'Cài bằng đệ quy nên tốn ngăn xếp O(h); cây suy biến rất sâu có thể làm tràn ngăn xếp với dữ liệu lớn.',
  },
  preorder: {
    description:
      'Thăm nút trước, rồi cây con trái, rồi cây con phải. Chèn lại các giá trị theo thứ tự Preorder vào một cây rỗng sẽ dựng lại đúng hình dạng cây ban đầu.',
    advantages: 'Phù hợp để sao chép hoặc lưu lại cấu trúc cây.',
    disadvantages: 'Dãy kết quả không tăng dần; đệ quy tốn ngăn xếp O(h).',
  },
  postorder: {
    description:
      'Thăm cây con trái, cây con phải, rồi mới tới nút. Nút cha luôn được xử lý sau tất cả các con của nó.',
    advantages:
      'Phù hợp khi phải xử lý con trước cha: giải phóng cả cây, tính chiều cao hay kích thước của từng cây con.',
    disadvantages: 'Dãy kết quả không tăng dần; đệ quy tốn ngăn xếp O(h).',
  },
}

const traversal = (order) => ({
  name: order[0].toUpperCase() + order.slice(1),
  needsValue: false,
  complexity: FULL_COMPLEXITY,
  learning: TRAVERSAL_LEARNING[order],
  pseudocode: bstTraversalPseudocode[order],
  generate: (tree) => generateBstTraversalSteps(tree, order),
  formatResult: (step) => `Đã thăm ${step.output.length} nút`,
})

const minMax = (kind) => ({
  name: kind === 'min' ? 'Min' : 'Max',
  needsValue: false,
  complexity: {
    ...PATH_COMPLEXITY,
    bestNote: `Gốc không có con ${kind === 'min' ? 'trái' : 'phải'}.`,
  },
  learning: kind === 'min'
    ? {
      description:
        'Giá trị nhỏ nhất nằm ở nút trái cùng: từ gốc đi sang trái mãi tới khi không còn con trái. Chỉ đi theo con trỏ, không cần so sánh khóa.',
      advantages: 'Chỉ đi trên một đường, không phải xét toàn bộ phần tử như trên mảng chưa sắp xếp.',
      disadvantages: 'Cây lệch trái (chèn dãy giảm dần) buộc phải đi qua cả n nút.',
    }
    : {
      description:
        'Giá trị lớn nhất nằm ở nút phải cùng: từ gốc đi sang phải mãi tới khi không còn con phải. Chỉ đi theo con trỏ, không cần so sánh khóa.',
      advantages: 'Chỉ đi trên một đường, không phải xét toàn bộ phần tử như trên mảng chưa sắp xếp.',
      disadvantages: 'Cây lệch phải (như cây suy biến 1…15) buộc phải đi qua cả n nút.',
    },
  pseudocode: bstMinMaxPseudocode[kind],
  generate: (tree) => generateBstMinMaxSteps(tree, kind),
  formatResult: (step) => (step.result === null ? 'Cây rỗng' : String(step.result)),
})

export const bstOperations = {
  insert: {
    name: 'Insert',
    needsValue: true,
    complexity: { ...PATH_COMPLEXITY, bestNote: 'Cây rỗng, gốc trùng x, hoặc nhánh cần đi của gốc đang trống.' },
    learning: {
      description:
        'Bắt đầu từ gốc, so sánh x với nút đang xét: nhỏ hơn thì sang trái, lớn hơn thì sang phải, tới khi gặp chỗ trống thì gắn nút mới vào đó. Gặp giá trị bằng x thì dừng vì cây không chứa giá trị trùng. Số phép so sánh bằng số nút từ gốc tới cha của nút mới.',
      advantages:
        'Không phải dịch chuyển phần tử như chèn vào mảng đã sắp xếp; cây luôn giữ thứ tự nên Inorder cho dãy tăng dần.',
      disadvantages:
        'Thứ tự chèn quyết định hình dạng cây: chèn dãy đã sắp xếp tạo cây suy biến và mỗi lần chèn tốn O(n). BST thường không tự cân bằng (AVL, Red-Black thì có).',
    },
    pseudocode: bstInsertPseudocode,
    generate: generateBstInsertSteps,
    formatResult: (step) => (step.result === 'inserted'
      ? `Đã chèn ${step.value}`
      : `${step.value} đã tồn tại`),
  },
  search: {
    name: 'Search',
    needsValue: true,
    complexity: { ...PATH_COMPLEXITY, bestNote: 'Giá trị cần tìm nằm ngay ở gốc.' },
    learning: {
      description:
        'Mỗi lần so sánh loại bỏ cả một cây con: bằng thì tìm thấy, nhỏ hơn đi trái, lớn hơn đi phải. Đi tới chỗ trống (null) nghĩa là cây không có x.',
      advantages:
        'Cây cân bằng chỉ cần khoảng log₂ n phép so sánh như Binary Search, nhưng vẫn chèn và xóa nhanh, khác với mảng đã sắp xếp.',
      disadvantages: 'Trên cây suy biến, tìm kiếm trở thành duyệt tuần tự O(n).',
    },
    pseudocode: bstSearchPseudocode,
    generate: generateBstSearchSteps,
    formatResult: (step) => (step.result === 'found'
      ? `Tìm thấy ${step.value}`
      : `Không tìm thấy ${step.value}`),
  },
  delete: {
    name: 'Delete',
    needsValue: true,
    complexity: { ...PATH_COMPLEXITY, bestNote: 'x nằm ở gốc và gốc có tối đa một con.' },
    learning: {
      description:
        'Tìm nút z chứa x rồi xử lý ba trường hợp. Lá: gỡ z đi. Một con: nối con đó lên thay chỗ z. Hai con: tìm successor (nút nhỏ nhất của cây con phải), chép giá trị successor vào z, rồi gỡ successor; nút này không có con trái nên rơi vào trường hợp lá hoặc một con.',
      advantages: 'Giữ đúng tính chất BST mà chỉ thay đổi cấu trúc quanh một đường từ gốc xuống.',
      disadvantages:
        'Trường hợp hai con phải đi thêm một đoạn xuống cây con phải để tìm successor; tổng chi phí vẫn O(h), nhưng xóa nhiều lần có thể làm cây lệch dần.',
    },
    pseudocode: bstDeletePseudocode,
    generate: generateBstDeleteSteps,
    formatResult: (step) => (step.result === 'deleted'
      ? `Đã xóa ${step.value}`
      : `Không tìm thấy ${step.value}`),
  },
  inorder: traversal('inorder'),
  preorder: traversal('preorder'),
  postorder: traversal('postorder'),
  min: minMax('min'),
  max: minMax('max'),
  height: {
    name: 'Height',
    needsValue: false,
    complexity: FULL_COMPLEXITY,
    learning: {
      description:
        'Chiều cao là số cạnh trên đường dài nhất từ gốc xuống lá. Quy ước: cây rỗng là −1, cây một nút là 0. Tính theo hậu tự: biết chiều cao hai con thì chiều cao nút = 1 + max(trái, phải).',
      advantages: 'Cho biết ngay chi phí O(h) của Search, Insert và Delete trên cây hiện tại.',
      disadvantages:
        'Phải thăm mọi nút nên tốn O(n); nếu cần dùng thường xuyên thì nên lưu sẵn chiều cao trong mỗi nút (như cây AVL).',
    },
    pseudocode: bstHeightPseudocode,
    generate: generateBstHeightSteps,
    formatResult: (step) => String(step.result),
  },
}

const TRAVERSAL_OPERATIONS = new Set(['inorder', 'preorder', 'postorder'])

function createSvgElement(document, name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name)

  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value))
  }

  return element
}

// Vẽ cây của một bước vào SVG. Id không có trong tree.nodes (nếu có) bị bỏ qua, không tô.
export function renderBstTree(svg, step) {
  const document = svg.ownerDocument
  const { tree } = step
  const exists = (id) => id !== null && id !== undefined && Object.hasOwn(tree.nodes, id)
  const pathIds = new Set((step.pathIds ?? []).filter(exists))
  const { positions, width, height } = computeTreeLayout(tree)
  const radius = TREE_LAYOUT.NODE_RADIUS

  svg.replaceChildren()
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)

  const isOnPath = (id) => pathIds.has(id) || id === step.currentId

  for (const node of Object.values(tree.nodes)) {
    for (const childId of [node.left, node.right]) {
      if (!exists(childId)) continue

      const edge = createSvgElement(document, 'line', {
        x1: positions[node.id].x,
        y1: positions[node.id].y,
        x2: positions[childId].x,
        y2: positions[childId].y,
        class: 'bst-edge',
      })

      if (pathIds.has(node.id) && isOnPath(childId)) {
        edge.classList.add('is-path')
      }

      svg.appendChild(edge)
    }
  }

  for (const node of Object.values(tree.nodes)) {
    const { x, y } = positions[node.id]
    const group = createSvgElement(document, 'g', {
      class: 'bst-node',
      transform: `translate(${x} ${y})`,
      'data-id': node.id,
      'data-value': node.value,
    })

    if (pathIds.has(node.id)) group.classList.add('is-path')
    if (node.id === step.currentId) group.classList.add('is-current')
    if (node.id === step.successorId) group.classList.add('is-successor')

    if (node.id === step.foundId) {
      group.classList.add('is-found')
      group.appendChild(createSvgElement(document, 'circle', { r: radius + 4, class: 'bst-node-ring' }))
    }

    group.appendChild(createSvgElement(document, 'circle', { r: radius, class: 'bst-node-circle' }))

    const label = createSvgElement(document, 'text', { class: 'bst-node-label', 'text-anchor': 'middle', dy: '0.35em' })
    label.textContent = String(node.value)
    group.appendChild(label)

    if (Object.hasOwn(step.heights ?? {}, node.id)) {
      const heightLabel = createSvgElement(document, 'text', {
        class: 'bst-node-height',
        'text-anchor': 'middle',
        y: radius + 12,
      })
      heightLabel.textContent = `h=${step.heights[node.id]}`
      group.appendChild(heightLabel)
    }

    svg.appendChild(group)
  }

  return { positions, width, height }
}

export function initBst(document, options = {}) {
  const $ = (selector) => document.querySelector(selector)

  const section = $('#bst-section')
  const operationSelect = $('#bst-operation')
  const valueInput = $('#bst-value')
  const applyButton = $('#bst-apply')
  const inputError = $('#bst-input-error')
  const balancedButton = $('#bst-preset-balanced')
  const degenerateButton = $('#bst-preset-degenerate')
  const clearButton = $('#bst-clear')
  const speedInput = $('#bst-speed')
  const speedValue = $('#bst-speed-value')
  const treeFrame = $('#bst-tree-frame')
  const treeSvg = $('#bst-tree')
  const emptyMessage = $('#bst-empty')
  const outputRow = $('#bst-output-row')
  const outputValue = $('#bst-output')
  const resetButton = $('#bst-reset')
  const previousButton = $('#bst-previous')
  const nextButton = $('#bst-next')
  const runButton = $('#bst-run')
  const pauseButton = $('#bst-pause')
  const message = $('#bst-message')
  const status = $('#bst-status')
  const nodeCount = $('#bst-node-count')
  const heightValue = $('#bst-height')
  const currentValue = $('#bst-current-value')
  const comparisons = $('#bst-comparisons')
  const resultValue = $('#bst-result')
  const pseudocodeTitle = $('#bst-pseudocode-title')
  const pseudocodeCode = $('#bst-pseudocode')
  const complexityTag = $('#bst-complexity')
  const complexityTitle = $('#bst-complexity-title')
  const complexityCells = {
    best: $('#bst-complexity-best'),
    balanced: $('#bst-complexity-balanced'),
    degenerate: $('#bst-complexity-degenerate'),
    space: $('#bst-complexity-space'),
    bestNote: $('#bst-complexity-best-note'),
    spaceNote: $('#bst-complexity-space-note'),
  }
  const learningCells = {
    description: $('#bst-learning-description'),
    advantages: $('#bst-learning-advantages'),
    disadvantages: $('#bst-learning-disadvantages'),
  }

  const requiredElements = [
    section, operationSelect, valueInput, applyButton, treeSvg,
    resetButton, previousButton, nextButton, runButton, pauseButton, message,
  ]

  if (requiredElements.some((element) => !element)) {
    console.error('Không thể khởi tạo BST: thiếu phần tử HTML cần thiết.')
    return
  }

  // Cây đã chốt: kết quả của thao tác gần nhất, được chốt ngay khi sinh bước.
  let committedTree = buildTree(BALANCED_PRESET)
  let idleMessage = IDLE_MESSAGE
  let renderedOperation = null

  const simulation = createSimulationController({
    getDelay: () => Number(speedInput?.value) || DEFAULT_SPEED,
    onChange: render,
    scheduler: options.scheduler,
  })

  function getSelectedOperation() {
    return bstOperations[operationSelect.value] ? operationSelect.value : 'insert'
  }

  function createIdleStep() {
    return createBstStepFactory(getSelectedOperation(), null)({
      tree: committedTree,
      message: idleMessage,
    })
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

  // Mã giả, Big-O và lý thuyết chỉ vẽ lại khi đổi thao tác; mỗi bước chỉ đổi dòng được tô.
  function renderOperationInfo(operationName, line) {
    if (renderedOperation !== operationName) {
      const operation = bstOperations[operationName]

      renderPseudocode(pseudocodeCode, operation.pseudocode)
      if (pseudocodeTitle) pseudocodeTitle.textContent = `Mã giả: ${operation.name}`
      if (complexityTag) complexityTag.textContent = operation.complexity.tag
      if (complexityTitle) complexityTitle.textContent = operation.name.toUpperCase()
      fillText(complexityCells, operation.complexity)
      fillText(learningCells, operation.learning)
      renderedOperation = operationName
    }

    highlightPseudocodeLine(pseudocodeCode, line)
  }

  function renderTree(step) {
    const n = getNodeCount(step.tree)
    const h = getHeight(step.tree)
    const { positions } = renderBstTree(treeSvg, step)

    if (emptyMessage) emptyMessage.hidden = n > 0
    if (nodeCount) nodeCount.textContent = String(n)
    if (heightValue) heightValue.textContent = String(h)

    treeSvg.setAttribute(
      'aria-label',
      n === 0
        ? 'Cây BST rỗng: 0 nút, chiều cao -1.'
        : `Cây BST ${n} nút, chiều cao ${h}. Inorder: ${toInorderValues(step.tree).join(', ')}.`,
    )

    // Cây rộng hơn khung thì cuộn ngang để nút đang xét nằm giữa khung.
    const focus = positions[step.currentId]
    if (focus && treeFrame && treeFrame.scrollWidth > treeFrame.clientWidth) {
      treeFrame.scrollLeft = Math.max(0, focus.x - treeFrame.clientWidth / 2)
    }
  }

  function renderStats(step) {
    const operation = bstOperations[step.operation]
    const current = step.tree.nodes[step.currentId]

    if (currentValue) currentValue.textContent = current ? String(current.value) : '—'
    if (comparisons) comparisons.textContent = String(step.comparisons)
    if (resultValue) resultValue.textContent = step.finished ? operation.formatResult(step) : 'Chưa có'

    const isTraversal = TRAVERSAL_OPERATIONS.has(step.operation)
    if (outputRow) outputRow.hidden = !isTraversal
    if (outputValue) outputValue.textContent = step.output.length > 0 ? step.output.join(', ') : '—'
  }

  function renderControls({ state, stepCount, controls }) {
    const hasSteps = stepCount > 0
    const isRunning = state === 'running'

    runButton.textContent = getRunLabel(controls.runMode)
    runButton.disabled = !hasSteps || !controls.run
    pauseButton.disabled = !controls.pause
    nextButton.disabled = !hasSteps || !controls.next
    previousButton.disabled = !controls.previous

    // Đang chạy thì khóa thao tác: không đổi cây giữa chừng minh họa.
    for (const element of [applyButton, operationSelect, balancedButton, degenerateButton, clearButton]) {
      if (element) element.disabled = isRunning
    }
    valueInput.disabled = isRunning || !bstOperations[getSelectedOperation()].needsValue
  }

  function render(snapshot) {
    const step = snapshot.step ?? createIdleStep()

    renderTree(step)
    renderStats(step)
    renderOperationInfo(step.operation, step.pseudocodeLine)
    message.textContent = step.message
    renderControls(snapshot)
  }

  function showInputError(text) {
    if (inputError) {
      inputError.textContent = text
      inputError.hidden = text === ''
    }
    valueInput.setAttribute('aria-invalid', text === '' ? 'false' : 'true')
  }

  function clearStatus() {
    if (status) status.textContent = ''
  }

  // Trả về giá trị hợp lệ hoặc null (đã báo lỗi).
  function readValue(operation) {
    const raw = valueInput.value.trim()
    const value = Number(raw)

    if (raw === '' || !Number.isInteger(value) || value < MIN_VALUE || value > MAX_VALUE) {
      showInputError(`Giá trị phải là số nguyên từ ${MIN_VALUE} đến ${MAX_VALUE}.`)
      return null
    }

    // Kiểm tra trùng trước: giá trị đã có thì vẫn minh họa (kết quả "đã tồn tại") dù cây đầy.
    const isNewValue = findNodeId(committedTree, value) === null
    if (operation === 'insert' && isNewValue && getNodeCount(committedTree) >= MAX_NODES) {
      showInputError(`Cây đã đủ ${MAX_NODES} nút: hãy xóa bớt trước khi chèn giá trị mới.`)
      return null
    }

    return value
  }

  function applyOperation() {
    if (simulation.getSnapshot().state === 'running') return

    const operationName = getSelectedOperation()
    const operation = bstOperations[operationName]
    let value = null

    if (operation.needsValue) {
      value = readValue(operationName)
      if (value === null) return
    }

    showInputError('')
    clearStatus()

    const steps = operation.generate(committedTree, value)
    committedTree = steps.at(-1).tree
    simulation.load(steps)
  }

  function loadTree(tree, text) {
    committedTree = tree
    idleMessage = text
    showInputError('')
    clearStatus()
    simulation.load([])
  }

  function resetIllustration() {
    const hasSteps = simulation.getSnapshot().stepCount > 0
    simulation.reset()

    if (hasSteps && status) {
      status.textContent = RESET_NOTE
    }
  }

  applyButton.addEventListener('click', applyOperation)
  nextButton.addEventListener('click', simulation.next)
  previousButton.addEventListener('click', simulation.previous)
  runButton.addEventListener('click', simulation.run)
  pauseButton.addEventListener('click', simulation.pause)
  resetButton.addEventListener('click', resetIllustration)

  // Đổi thao tác thì bỏ minh họa cũ (cây đã chốt không mất), hiển thị mã giả của thao tác mới.
  operationSelect.addEventListener('change', () => {
    idleMessage = IDLE_MESSAGE
    showInputError('')
    clearStatus()
    simulation.load([])
  })

  balancedButton?.addEventListener('click', () => {
    loadTree(buildTree(BALANCED_PRESET), 'Đã nạp cây mẫu cân bằng 7 nút (h = 2).')
  })

  degenerateButton?.addEventListener('click', () => {
    loadTree(
      buildTree(DEGENERATE_PRESET),
      'Đã nạp cây suy biến: chèn 1, 2, …, 15 theo thứ tự tăng dần nên mọi nút chỉ có con phải (h = n − 1 = 14).',
    )
  })

  clearButton?.addEventListener('click', () => {
    loadTree(createTree(), 'Đã xóa toàn bộ cây. Hãy chèn giá trị đầu tiên.')
  })

  speedInput?.addEventListener('input', () => {
    if (speedValue) speedValue.textContent = `${speedInput.value} ms`
  })

  // Rời màn hình mô phỏng thì tạm dừng (giữ nguyên bước hiện tại).
  document.addEventListener('algovision:viewchange', () => {
    if (treeSvg.closest('[hidden]')) {
      simulation.pause()
    }
  })

  render(simulation.getSnapshot())
}
