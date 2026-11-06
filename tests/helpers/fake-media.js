// matchMedia giả cho test sidebar: happy-dom không tính CSS nên bề rộng cửa sổ không quyết định được matches.
// setMatches(true) giả lập màn hình hẹp (drawer), false giả lập màn hình rộng; mọi listener 'change' đã đăng ký được gọi.
export function createFakeMatchMedia(initialMatches = false) {
  let matches = initialMatches
  const listeners = new Set()
  const queries = []

  return {
    queries,
    listenerCount: () => listeners.size,
    matchMedia(query) {
      queries.push(query)

      return {
        media: query,
        get matches() {
          return matches
        },
        addEventListener(type, listener) {
          if (type === 'change') listeners.add(listener)
        },
        removeEventListener(type, listener) {
          if (type === 'change') listeners.delete(listener)
        },
      }
    },
    setMatches(value) {
      matches = value
      listeners.forEach((listener) => listener({ matches: value }))
    },
  }
}
