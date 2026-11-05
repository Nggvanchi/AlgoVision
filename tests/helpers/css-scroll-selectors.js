// Tìm mọi selector mà một luật CSS cho phép cuộn (overflow, overflow-x, overflow-y có giá trị auto hoặc scroll).
// Parser tối giản cho CSS phẳng của dự án (luật, @media/@supports lồng một cấp, @keyframes/@font-face bị bỏ qua).
// Cấu trúc lạ (ngoặc không cân bằng, at-rule chưa hỗ trợ) ném lỗi rõ ràng thay vì bỏ qua im lặng.

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

function findMatchingBrace(css, openIndex) {
  let depth = 0

  for (let index = openIndex; index < css.length; index++) {
    if (css[index] === '{') depth++
    if (css[index] === '}') {
      depth--
      if (depth === 0) return index
    }
  }

  throw new Error(`CSS không cân bằng: thiếu dấu } cho khối mở ở ký tự ${openIndex}: "${css.slice(openIndex, openIndex + 60).replace(/\s+/g, ' ')}"`)
}

const NESTED_AT_RULES = new Set(['media', 'supports', 'layer', 'container'])
const IGNORED_AT_RULES = new Set(['keyframes', '-webkit-keyframes', 'font-face', 'property', 'page'])

function parseRules(css, rules = []) {
  let position = 0

  while (position < css.length) {
    const open = css.indexOf('{', position)
    const semicolon = css.indexOf(';', position)

    if (open === -1) {
      if (css.slice(position).includes('}')) {
        throw new Error(`CSS không cân bằng: dấu } thừa gần "${css.slice(position, position + 60).replace(/\s+/g, ' ').trim()}"`)
      }

      break
    }

    // Câu lệnh không có khối (@import, @charset) kết thúc bằng dấu chấm phẩy trước dấu {.
    if (semicolon !== -1 && semicolon < open && css.slice(position, semicolon).trim().startsWith('@')) {
      position = semicolon + 1
      continue
    }

    const prelude = css.slice(position, open).trim()
    const close = findMatchingBrace(css, open)
    const body = css.slice(open + 1, close)

    if (prelude.includes('}')) {
      throw new Error(`CSS không cân bằng: dấu } thừa trước "${prelude.slice(0, 60)}"`)
    }

    if (prelude.startsWith('@')) {
      const name = prelude.slice(1).split(/[\s(]/)[0].toLowerCase()

      if (NESTED_AT_RULES.has(name)) {
        parseRules(body, rules)
      } else if (!IGNORED_AT_RULES.has(name)) {
        throw new Error(`CSS có @${name} chưa được parser hỗ trợ: "${prelude.slice(0, 60)}"`)
      }
    } else {
      rules.push({ selector: prelude, body })
    }

    position = close + 1
  }

  return rules
}

function declaresScrolling(body) {
  const declaration = /(?:^|;)\s*(overflow(?:-x|-y)?)\s*:\s*([^;]+)/g
  let match

  while ((match = declaration.exec(body)) !== null) {
    const tokens = match[2].replace('!important', '').trim().split(/\s+/)

    if (tokens.some((token) => token === 'auto' || token === 'scroll')) {
      return true
    }
  }

  return false
}

// Trả [{ selector, rule }]: mỗi selector đơn (đã tách dấu phẩy) của luật cho phép cuộn.
export function findScrollingSelectors(css) {
  const found = []

  for (const rule of parseRules(stripComments(css))) {
    if (!declaresScrolling(rule.body)) continue

    for (const selector of rule.selector.split(',').map((part) => part.trim()).filter(Boolean)) {
      found.push({ selector, rule: `${rule.selector} { ${rule.body.replace(/\s+/g, ' ').trim()} }` })
    }
  }

  return found
}
