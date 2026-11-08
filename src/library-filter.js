// Thư viện (R5b): ô tìm trong trang + chip phân loại + bộ đếm "Hiển thị N mục" + trạng thái rỗng. CHỈ ở hai trang có thanh tab
// (structures, algorithms); ở mọi nơi khác (Dashboard, Sắp xếp, Tìm kiếm, màn chi tiết) mọi thẻ được hiện lại đầy đủ, vì các thẻ
// này cũng nằm trong thư viện riêng của trang Sắp xếp và Tìm kiếm. Trạng thái chỉ trong bộ nhớ (quy tắc a: không lưu gì vào trình duyệt).
// Dữ liệu lọc là dữ liệu thật của thẻ: data-category trong template, tiêu đề và mô tả hiển thị; không có số liệu thêm.

const PANELS = { structures: '#structure-panel', algorithms: '#algorithm-panel' }

// Bỏ dấu tiếng Việt để "do thi" khớp "Đồ thị", "tim kiem" khớp "Tìm kiếm".
const normalize = (text) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ')

export function initLibraryFilter(document) {
  const root = document.querySelector('.library-filters')
  const input = root.querySelector('.library-search-input')
  const count = root.querySelector('.library-count')
  const empty = document.querySelector('.library-empty')
  const tabs = document.querySelector('.library-tabs')
  const categories = { structures: 'all', algorithms: 'all' }
  let page = null

  const cardText = (card) => normalize([...card.querySelectorAll('h4, p, .structure-card-title, .structure-card-description')].map((part) => part.textContent).join(' '))

  function showAll() {
    document.querySelectorAll('[data-category]').forEach((card) => {
      card.hidden = false
    })
    document.querySelectorAll('.is-filtered-out').forEach((section) => section.classList.remove('is-filtered-out'))
    root.hidden = true
    empty.hidden = true
  }

  function apply() {
    if (!(page in PANELS) || tabs.hidden) return showAll()

    const query = normalize(input.value.trim())
    const category = categories[page]
    let shown = 0

    document.querySelectorAll(`${PANELS[page]} [data-category]`).forEach((card) => {
      card.hidden = !((category === 'all' || card.dataset.category === category) && cardText(card).includes(query))
      shown += card.hidden ? 0 : 1
    })
    document.querySelectorAll(`${PANELS[page]} section`).forEach((section) => {
      section.classList.toggle('is-filtered-out', !section.querySelector('[data-category]:not([hidden])'))
    })

    root.hidden = false
    count.textContent = `Hiển thị ${shown} mục`
    empty.hidden = shown > 0
    root.querySelectorAll('[data-chips]').forEach((group) => {
      group.hidden = group.dataset.chips !== page
    })
    root.querySelectorAll('[data-category-filter]').forEach((chip) => {
      chip.setAttribute('aria-pressed', String(chip.closest('[data-chips]').dataset.chips === page && chip.dataset.categoryFilter === category))
    })
  }

  input.addEventListener('input', apply)

  root.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-category-filter]')

    if (chip === null) return

    categories[page] = chip.dataset.categoryFilter
    apply()
  })

  empty.querySelector('button').addEventListener('click', () => {
    input.value = ''
    categories[page] = 'all'
    apply()
    input.focus()
  })

  document.addEventListener('algovision:viewchange', (event) => {
    page = event.detail.page
    apply()
  })
}
