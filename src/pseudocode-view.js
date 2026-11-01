// Hiển thị mã giả theo từng dòng và tô dòng ứng với bước mô phỏng hiện tại.
// Dùng chung cho Sorting và Searching; số dòng đếm từ 1 giống step.pseudocodeLine.

export function renderPseudocode(codeElement, lines) {
  const lineElements = lines.map((line, index) => {
    const lineElement = codeElement.ownerDocument.createElement('span')

    lineElement.className = 'pseudocode-line'
    lineElement.dataset.line = String(index + 1)
    lineElement.textContent = line

    return lineElement
  })

  codeElement.replaceChildren(...lineElements)
}

// lineNumber = null: bước không ứng với dòng nào (bước đầu, bước hoàn thành).
export function highlightPseudocodeLine(codeElement, lineNumber) {
  codeElement.querySelectorAll('.pseudocode-line').forEach((lineElement) => {
    const isActive = Number(lineElement.dataset.line) === lineNumber

    lineElement.classList.toggle('is-active', isActive)

    if (isActive) {
      lineElement.setAttribute('aria-current', 'step')
    } else {
      lineElement.removeAttribute('aria-current')
    }
  })
}
