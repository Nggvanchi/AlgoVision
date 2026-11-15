// Chỉ đổi khả năng hiển thị; các controller tiếp tục cập nhật nguyên node trong pane ẩn.
export function initLearningPanels(root) {
  for (const panel of root.querySelectorAll('.visualizer-panel')) {
    const select = panel.querySelector('[data-learning-select]')
    const panes = panel.querySelectorAll('[data-learning-pane]')
    select.addEventListener('change', () => {
      for (const pane of panes) {
        pane.hidden = pane.dataset.learningPane !== select.value
      }
    })
  }
}
