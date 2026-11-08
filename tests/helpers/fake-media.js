// matchMedia giả cho test sidebar: happy-dom không tính CSS nên bề rộng cửa sổ không quyết định được matches.
// Giả lập BỀ RỘNG cửa sổ: mỗi query dạng "(max-width: Npx)", "(min-width: Npx)" hoặc "(min-width: Npx) and (max-width: Mpx)" được tính
// theo bề rộng hiện tại, nên drawer (<= 767) và rail (768-1279) có kết quả riêng. setWidth(w) gọi listener 'change' của đúng các query đổi kết quả.
// Tương thích test cũ: createFakeMatchMedia(true) = màn hình hẹp (600px), false = màn hình rộng (1280px); setMatches(true/false) tương tự.
export const NARROW_WIDTH = 600
export const DESKTOP_WIDTH = 1280

export function evaluateQuery(query, width) {
  const conditions = [...query.matchAll(/\((min|max)-width:\s*(\d+)px\)/g)]

  if (conditions.length === 0) throw new Error(`Query không hiểu được: ${query}`)

  return conditions.every(([, kind, value]) => (kind === 'min' ? width >= Number(value) : width <= Number(value)))
}

export function createFakeMatchMedia(initial = false) {
  let width = typeof initial === 'number' ? initial : initial ? NARROW_WIDTH : DESKTOP_WIDTH
  const listeners = new Map()
  const queries = []

  const listenersOf = (query) => {
    if (!listeners.has(query)) listeners.set(query, new Set())
    return listeners.get(query)
  }

  return {
    queries,
    listenerCount: () => [...listeners.values()].reduce((total, set) => total + set.size, 0),
    currentWidth: () => width,
    matchMedia(query) {
      queries.push(query)

      return {
        media: query,
        get matches() {
          return evaluateQuery(query, width)
        },
        addEventListener(type, listener) {
          if (type === 'change') listenersOf(query).add(listener)
        },
        removeEventListener(type, listener) {
          if (type === 'change') listenersOf(query).delete(listener)
        },
      }
    },
    setWidth(next) {
      const before = new Map([...listeners.keys()].map((query) => [query, evaluateQuery(query, width)]))

      width = next

      for (const [query, set] of listeners) {
        const matches = evaluateQuery(query, width)
        if (matches !== before.get(query)) set.forEach((listener) => listener({ matches, media: query }))
      }
    },
    setMatches(value) {
      this.setWidth(value ? NARROW_WIDTH : DESKTOP_WIDTH)
    },
  }
}
