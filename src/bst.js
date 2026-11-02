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

const traversal = (order) => ({
  name: order[0].toUpperCase() + order.slice(1),
  needsValue: false,
  pseudocode: bstTraversalPseudocode[order],
  generate: (tree) => generateBstTraversalSteps(tree, order),
  formatResult: (step) => `Đã thăm ${step.output.length} nút`,
})

const minMax = (kind) => ({
  name: kind === 'min' ? 'Min' : 'Max',
  needsValue: false,
  pseudocode: bstMinMaxPseudocode[kind],
  generate: (tree) => generateBstMinMaxSteps(tree, kind),
  formatResult: (step) => (step.result === null ? 'Cây rỗng' : String(step.result)),
})

export const bstOperations = {
  insert: {
    name: 'Insert',
    needsValue: true,
    pseudocode: bstInsertPseudocode,
    generate: generateBstInsertSteps,
    formatResult: (step) => (step.result === 'inserted'
      ? `Đã chèn ${step.value}`
      : `${step.value} đã tồn tại`),
  },
  search: {
    name: 'Search',
    needsValue: true,
    pseudocode: bstSearchPseudocode,
    generate: generateBstSearchSteps,
    formatResult: (step) => (step.result === 'found'
      ? `Tìm thấy ${step.value}`
      : `Không tìm thấy ${step.value}`),
  },
  delete: {
    name: 'Delete',
    needsValue: true,
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
  let renderedPseudocodeOperation = null

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

  function renderPseudocodePanel(operation, line) {
    if (renderedPseudocodeOperation !== operation) {
      renderPseudocode(pseudocodeCode, bstOperations[operation].pseudocode)
      if (pseudocodeTitle) {
        pseudocodeTitle.textContent = `Mã giả: ${bstOperations[operation].name}`
      }
      renderedPseudocodeOperation = operation
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
    renderPseudocodePanel(step.operation, step.pseudocodeLine)
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
