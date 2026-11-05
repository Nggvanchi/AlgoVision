// Lớp trạng thái của một cột ở trang Sắp xếp: hàm thuần, không đụng DOM.
// renderBars (src/sorting.js) và test chú giải dùng chung hàm này để chú giải luôn khớp với những gì được vẽ.
//
// Trạng thái hành động ưu tiên hơn trạng thái nền: Insertion Sort so sánh A[j] ngay trong vùng đã sắp xếp,
// nếu thêm is-sorted thì màu xanh che mất màu so sánh. is-swapped đứng sau is-comparing trong CSS nên cột
// vừa so sánh vừa đổi chỗ hiện là đã đổi chỗ.
export function getBarStateClasses(step, index) {
  const isComparing = step.comparing.includes(index)
  const isSwapped = step.swapped.includes(index)
  const classes = []

  if (isComparing) {
    classes.push('is-comparing')
  }

  if (isSwapped) {
    classes.push('is-swapped')
  }

  if (step.sortedIndices.includes(index) && !isComparing && !isSwapped) {
    classes.push('is-sorted')
  }

  return classes
}
