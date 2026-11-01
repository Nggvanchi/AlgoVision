import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'

import * as pseudocodeView from '../src/pseudocode-view.js'

const { renderPseudocode, highlightPseudocodeLine } = pseudocodeView

const lines = ['for i = 0 to n - 1', '    if A[i] == target', '        return i', 'return -1']

function createCodeElement() {
  const window = new Window()
  const code = window.document.createElement('code')

  window.document.body.appendChild(code)

  return { window, code }
}

function getActiveLines(code) {
  return [...code.querySelectorAll('.pseudocode-line.is-active')].map((line) => Number(line.dataset.line))
}

test('renderPseudocode tạo mỗi dòng một phần tử, giữ nguyên thụt lề, đánh số từ 1', () => {
  const { window, code } = createCodeElement()

  try {
    renderPseudocode(code, lines)

    const lineElements = [...code.querySelectorAll('.pseudocode-line')]

    assert.deepEqual(lineElements.map((line) => line.textContent), lines)
    assert.deepEqual(lineElements.map((line) => line.dataset.line), ['1', '2', '3', '4'])
  } finally {
    window.happyDOM.abort()
  }
})

test('renderPseudocode gán nội dung bằng textContent, không diễn giải HTML', () => {
  const { window, code } = createCodeElement()

  try {
    renderPseudocode(code, ['if A[j] < <b>x</b>'])

    assert.equal(code.querySelector('b'), null)
    assert.equal(code.querySelector('.pseudocode-line').textContent, 'if A[j] < <b>x</b>')
  } finally {
    window.happyDOM.abort()
  }
})

test('highlightPseudocodeLine tô đúng một dòng và gắn aria-current="step"', () => {
  const { window, code } = createCodeElement()

  try {
    renderPseudocode(code, lines)
    highlightPseudocodeLine(code, 2)

    assert.deepEqual(getActiveLines(code), [2])
    assert.equal(code.querySelector('[data-line="2"]').getAttribute('aria-current'), 'step')
    assert.equal(code.querySelectorAll('[aria-current]').length, 1)

    highlightPseudocodeLine(code, 4)

    assert.deepEqual(getActiveLines(code), [4])
    assert.equal(code.querySelector('[data-line="2"]').hasAttribute('aria-current'), false)
  } finally {
    window.happyDOM.abort()
  }
})

test('highlightPseudocodeLine với null bỏ tô mọi dòng', () => {
  const { window, code } = createCodeElement()

  try {
    renderPseudocode(code, lines)
    highlightPseudocodeLine(code, 3)
    highlightPseudocodeLine(code, null)

    assert.deepEqual(getActiveLines(code), [])
    assert.equal(code.querySelectorAll('[aria-current]').length, 0)
  } finally {
    window.happyDOM.abort()
  }
})

test('renderPseudocode vẽ lại thì xóa dòng cũ và không còn dòng nào được tô', () => {
  const { window, code } = createCodeElement()

  try {
    renderPseudocode(code, lines)
    highlightPseudocodeLine(code, 1)
    renderPseudocode(code, ['a', 'b'])

    assert.equal(code.querySelectorAll('.pseudocode-line').length, 2)
    assert.deepEqual(getActiveLines(code), [])
  } finally {
    window.happyDOM.abort()
  }
})
