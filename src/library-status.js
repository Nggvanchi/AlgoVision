// Nhãn "Đã mở" / "Chưa mở" trên các thẻ thư viện, đọc từ initProgress. Chỉ nói về chủ đề đã MỞ (không "đã học").
// Chỉ vẽ khi dữ liệu tin được (trống hoặc ok); dữ liệu hỏng, của phiên bản mới hơn hay storage không dùng được thì ẩn nhãn.
import { topicId } from './progress-store.js'

// Thuộc tính data của thẻ -> loại chủ đề (cùng ba thuộc tính navigation.js và progress-init.js dùng).
const KINDS = [['algorithm', 'sorting'], ['searchAlgorithm', 'searching'], ['structureTarget', 'structure']]

export function initLibraryStatus(document, progress) {
  const marks = [...document.querySelectorAll('.card-state')].map((mark) => {
    const { dataset } = mark.closest('button')
    const [key, kind] = KINDS.find(([name]) => name in dataset)

    return { mark, id: topicId(kind, dataset[key]) }
  })

  function render() {
    const { progress: data, status } = progress.readState()
    const trusted = status === 'ok' || status === 'empty'

    for (const { mark, id } of marks) {
      const opened = trusted && id in data.topics

      mark.hidden = !trusted
      mark.textContent = opened ? 'Đã mở' : 'Chưa mở'
      mark.classList.toggle('is-opened', opened)
    }
  }

  progress.subscribe(render)
  render()
}
