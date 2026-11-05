// Tính tọa độ vẽ bảng băm (thuần, không đụng DOM).
// Mỗi ô của bảng là một hàng dọc: nhãn chỉ số [i] bên trái, ô đầu (bucket/cell) rộng CELL_WIDTH.
// Chaining: phần tử thứ p của chain nằm bên phải ô đầu, cách nhau LINK_GAP để vẽ mũi tên.
// Probing: phần tử nằm ngay trong ô của nó.
// Phần tử được định vị theo id chứ không theo khóa, nên khóa trùng tạm thời cũng không chồng nhau.
export const HASH_TABLE_LAYOUT = Object.freeze({
  LABEL_WIDTH: 44,
  CELL_WIDTH: 40,
  CELL_HEIGHT: 32,
  LINK_GAP: 10,
  ROW_HEIGHT: 48,
  PADDING: 8,
})

export function computeHashTableLayout(table) {
  const { LABEL_WIDTH, CELL_WIDTH, CELL_HEIGHT, LINK_GAP, ROW_HEIGHT, PADDING } = HASH_TABLE_LAYOUT
  const entries = {}
  let longestChain = 0

  const buckets = Array.from({ length: table.capacity }, (_, index) => {
    const centerY = index * ROW_HEIGHT + ROW_HEIGHT / 2

    return {
      index,
      x: LABEL_WIDTH,
      y: centerY - CELL_HEIGHT / 2,
      centerX: LABEL_WIDTH + CELL_WIDTH / 2,
      centerY,
    }
  })

  if (table.strategy === 'probing') {
    table.cells.forEach((cell, index) => {
      if (cell.kind !== 'occupied') return
      const { centerX, centerY } = buckets[index]
      entries[cell.id] = { bucketIndex: index, position: 0, centerX, centerY }
    })
  } else {
    table.buckets.forEach((bucket, index) => {
      longestChain = Math.max(longestChain, bucket.length)
      bucket.forEach((entry, position) => {
        entries[entry.id] = {
          bucketIndex: index,
          position,
          centerX: LABEL_WIDTH + CELL_WIDTH + LINK_GAP + CELL_WIDTH / 2 + position * (LINK_GAP + CELL_WIDTH),
          centerY: buckets[index].centerY,
        }
      })
    })
  }

  return {
    buckets,
    entries,
    width: LABEL_WIDTH + CELL_WIDTH + longestChain * (LINK_GAP + CELL_WIDTH) + PADDING,
    height: table.capacity * ROW_HEIGHT,
  }
}

// Điểm cần cuộn tới trong khung: phần tử đang so sánh, rồi phần tử vừa chèn/tìm thấy, rồi ô đang xét.
// id không có trong layout (vd. phần tử vừa bị xóa) bị bỏ qua.
export function scrollTargetFor(layout, step) {
  for (const id of [step.currentEntryId, step.insertedEntryId, step.foundEntryId]) {
    const entry = id === null ? undefined : layout.entries[id]
    if (entry) return { x: entry.centerX, y: entry.centerY }
  }

  const bucket = step.currentBucket === null ? undefined : layout.buckets[step.currentBucket]
  return bucket ? { x: bucket.centerX, y: bucket.centerY } : null
}
