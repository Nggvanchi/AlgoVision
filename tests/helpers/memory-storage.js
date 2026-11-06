// Storage giả cho test tiến độ: có thể ném lỗi ở từng thao tác (đổi failSet về false giữa chừng được) và đếm số lần ghi.
const KEY = 'algovision:progress'

// Storage giả có thể ném lỗi ở từng thao tác và đếm số lần ghi.
export function memoryStorage({ initial, failGet = false, failSet = false, failRemove = false } = {}) {
  const data = new Map(initial === undefined ? [] : [[KEY, initial]])
  return {
    data,
    failSet,
    setCalls: 0,
    getItem(key) {
      if (failGet) throw new Error('SecurityError')
      return data.has(key) ? data.get(key) : null
    },
    setItem(key, value) {
      this.setCalls += 1
      if (this.failSet) throw new Error('QuotaExceededError')
      data.set(key, String(value))
    },
    removeItem(key) {
      if (failRemove) throw new Error('SecurityError')
      data.delete(key)
    },
  }
}
