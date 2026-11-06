// Đọc src/style.css cho test token: custom property trong :root, @font-face, @import, khai báo của từng luật.
// Parser nhỏ, đủ cho style.css của repo (không có chuỗi chứa dấu ngoặc nhọn); không thay thế được parser CSS đầy đủ.
import { readFileSync } from 'node:fs'

export const STYLE_PATH = new URL('../../src/style.css', import.meta.url)

export function readStyle() {
  return readFileSync(STYLE_PATH, 'utf8')
}

export function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

// Cắt text theo dấu phân cách ở cấp ngoài cùng (bỏ qua dấu nằm trong ngoặc tròn hoặc chuỗi).
function splitTopLevel(text, separator) {
  const parts = []
  let depth = 0
  let quote = null
  let start = 0

  for (let index = 0; index < text.length; index++) {
    const character = text[index]

    if (quote) {
      if (character === quote) quote = null
    } else if (character === '"' || character === "'") {
      quote = character
    } else if (character === '(') {
      depth++
    } else if (character === ')') {
      depth--
    } else if (character === separator && depth === 0) {
      parts.push(text.slice(start, index))
      start = index + 1
    }
  }

  parts.push(text.slice(start))
  return parts
}

function parseDeclarations(body) {
  return splitTopLevel(body, ';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const colon = declaration.indexOf(':')
      return { property: declaration.slice(0, colon).trim(), value: declaration.slice(colon + 1).trim().replace(/\s+/g, ' ') }
    })
}

// Trả về { imports, fontFaces, rules }. rules gồm cả luật lồng trong @media (media = prelude của @media, hoặc null).
export function parseStylesheet(css) {
  const code = stripComments(css)
  const result = { imports: [], fontFaces: [], rules: [] }

  function walk(text, media) {
    let index = 0

    while (index < text.length) {
      let open = -1
      let end = -1

      for (let scan = index; scan < text.length; scan++) {
        if (text[scan] === '{') { open = scan; break }
        if (text[scan] === ';') { end = scan; break }
      }

      if (open === -1 && end === -1) break

      if (end !== -1) {
        const statement = text.slice(index, end).trim()
        if (statement.startsWith('@import')) result.imports.push(statement)
        index = end + 1
        continue
      }

      let depth = 1
      let close = open + 1
      while (close < text.length && depth > 0) {
        if (text[close] === '{') depth++
        if (text[close] === '}') depth--
        close++
      }

      const prelude = text.slice(index, open).trim().replace(/\s+/g, ' ')
      const body = text.slice(open + 1, close - 1)
      index = close

      if (prelude.startsWith('@font-face')) {
        result.fontFaces.push(parseDeclarations(body))
      } else if (prelude.startsWith('@media') || prelude.startsWith('@supports')) {
        walk(body, prelude)
      } else if (!prelude.startsWith('@')) {
        result.rules.push({
          selectors: splitTopLevel(prelude, ',').map((selector) => selector.trim()),
          declarations: parseDeclarations(body),
          media,
        })
      }
    }
  }

  walk(code, null)
  return result
}

// Custom property của :root (luật cấp trên cùng đầu tiên có selector đúng ':root'): Map tên -> giá trị, kèm danh sách khai báo trùng.
export function rootTokens(css) {
  const rootRule = parseStylesheet(css).rules.find((rule) => rule.media === null && rule.selectors.length === 1 && rule.selectors[0] === ':root')
  const tokens = new Map()
  const duplicates = []

  for (const { property, value } of rootRule?.declarations ?? []) {
    if (!property.startsWith('--')) continue
    if (tokens.has(property)) duplicates.push(property)
    tokens.set(property, value)
  }

  return { tokens, duplicates }
}

// Văn bản thô (kèm comment) của khối :root, để kiểm comment phân loại token.
export function rootRawBlock(css) {
  const start = css.indexOf(':root {')
  if (start === -1) return ''

  let depth = 0
  for (let index = start; index < css.length; index++) {
    if (css[index] === '{') depth++
    if (css[index] === '}') { depth--; if (depth === 0) return css.slice(start, index + 1) }
  }

  return ''
}

// Mọi giá trị của một thuộc tính trong các luật có selector khớp đúng (so sánh sau khi gộp khoảng trắng).
export function declarationValues(css, selector, property) {
  const wanted = selector.replace(/\s+/g, ' ')

  return parseStylesheet(css).rules
    .filter((rule) => rule.selectors.includes(wanted))
    .flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === property).map((declaration) => declaration.value))
}

// Số lần một custom property được tham chiếu bằng var(--ten ...) trong toàn bộ CSS (kể cả trong :root, trừ comment).
export function countVarUses(css, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return (stripComments(css).match(new RegExp(`var\\(\\s*${escaped}(?![\\w-])`, 'g')) ?? []).length
}

// Thẻ woff2: đọc bảng thư mục bảng của file woff2 (không giải nén) để biết là font biến thiên (có 'fvar') hay tĩnh.
const WOFF2_KNOWN_TAGS = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill']

export function woff2Tags(buffer) {
  if (buffer.toString('latin1', 0, 4) !== 'wOF2') throw new TypeError('Không phải file woff2 (thiếu chữ ký wOF2)')

  const count = buffer.readUInt16BE(12)
  let at = 48
  const tags = []
  const skipBase128 = () => { while (buffer[at++] & 0x80); }

  for (let index = 0; index < count; index++) {
    const flags = buffer[at++]
    let tag = WOFF2_KNOWN_TAGS[flags & 0x3f]

    if ((flags & 0x3f) === 63) {
      tag = buffer.toString('latin1', at, at + 4)
      at += 4
    }

    const transformVersion = flags >> 6
    const transformed = tag === 'glyf' || tag === 'loca' ? transformVersion === 0 : transformVersion !== 0

    skipBase128()
    if (transformed) skipBase128()
    tags.push(tag)
  }

  return tags
}
