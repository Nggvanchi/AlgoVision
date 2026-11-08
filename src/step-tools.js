// Thanh bước dùng chung cho các visualizer có controller: nhãn "Bước x/y", thanh trượt bước và nhóm tốc độ.
// Markup nằm trong template (khối [data-step-tools]); module chỉ gọi sync(snapshot) trong hàm vẽ và dùng getDelay.

export const BASE_DELAY = 650

const stepText = (index, count) => `Bước ${count === 0 ? 0 : index + 1}/${count}`

export function createStepTools(root, { seek }) {
  const slider = root.querySelector('[data-step-slider]')
  const label = root.querySelector('[data-step-label]')
  const radios = [...root.querySelectorAll('input[type="radio"]')]

  function show(index, count) {
    const text = stepText(index, count)

    label.textContent = text
    slider.setAttribute('aria-valuetext', text)
  }

  // Kéo: chỉ cập nhật chữ "Bước x/y". seek chỉ gọi khi thả (change) để vùng aria-live của module đọc đúng một lần.
  slider.addEventListener('input', () => show(Number(slider.value), Number(slider.max) + 1))
  slider.addEventListener('change', () => seek(Number(slider.value)))

  return {
    sync({ stepIndex, stepCount }) {
      slider.max = String(Math.max(stepCount - 1, 0))
      slider.value = String(stepIndex)
      slider.disabled = stepCount === 0
      show(stepIndex, stepCount)
    },

    getDelay() {
      const factor = Number(radios.find((radio) => radio.checked)?.value) || 1

      return BASE_DELAY / factor
    },
  }
}
