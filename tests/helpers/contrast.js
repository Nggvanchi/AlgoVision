// Tỉ lệ tương phản WCAG 2.x giữa hai màu hex. Dùng cho test token (tests/design-tokens.test.js): giá trị màu luôn đọc từ
// style.css, không gõ chết trong test.

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export function parseHex(value) {
  if (typeof value !== 'string' || !HEX.test(value.trim())) {
    throw new TypeError(`Màu hex không hợp lệ (chỉ nhận #rgb hoặc #rrggbb): ${String(value)}`)
  }

  let digits = value.trim().slice(1)
  if (digits.length === 3) digits = [...digits].map((digit) => digit + digit).join('')

  return [0, 2, 4].map((index) => Number.parseInt(digits.slice(index, index + 2), 16))
}

const toLinear = (channel) => {
  const scaled = channel / 255
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
}

export function luminance(value) {
  const [red, green, blue] = parseHex(value).map(toLinear)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function contrastRatio(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

// Trộn màu nửa trong suốt lên nền (như rgba/color-mix của trình duyệt), trả về #rrggbb.
export function blend(foreground, alpha, background) {
  if (!(alpha >= 0 && alpha <= 1)) throw new RangeError(`alpha phải nằm trong [0, 1]: ${String(alpha)}`)

  const front = parseHex(foreground)
  const back = parseHex(background)

  return '#' + front.map((channel, index) => Math.round(channel * alpha + back[index] * (1 - alpha)).toString(16).padStart(2, '0')).join('')
}
