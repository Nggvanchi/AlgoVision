import assert from 'node:assert/strict'

// Bất biến dùng chung cho mọi mảng bước mô phỏng cấu trúc dữ liệu (BST, Hash Table, …).
// options:
// - references: [{ field, exists(step, id), idsOf? }] — trường là null hoặc id có trong snapshot của CHÍNH bước đó;
//   trường dạng đối tượng (vd currentEdge { from, to }) khai báo idsOf(value) → [id, …] để kiểm từng id;
//   không có idsOf thì chính giá trị của trường là id (hành vi cũ của BST, Hash Table);
// - paths: [{ field, exists(step, id) }] — mảng id chỉ tăng: mọi id đều có trong snapshot của bước,
//   và chứa mọi id của bước trước trừ những id đã biến mất khỏi snapshot;
// - constantFields: các trường giống nhau ở mọi bước (chốt khi sinh bước).
// Luôn kiểm: chỉ bước cuối có finished = true, bước 0 có pseudocodeLine = null.
export function assertStepInvariants(steps, { references = [], paths = [], constantFields = [] } = {}) {
  assert.ok(steps.length > 0, 'phải có ít nhất một bước')

  steps.forEach((step, index) => {
    const where = `bước ${index}`

    for (const { field, exists, idsOf } of references) {
      const value = step[field]
      if (value === null) continue

      if (!idsOf) {
        assert.ok(exists(step, value), `${where}: ${field} = ${value} không có trong snapshot của bước`)
        continue
      }

      for (const id of idsOf(value)) {
        assert.ok(exists(step, id), `${where}: ${field} chứa id ${id} không có trong snapshot của bước`)
      }
    }

    for (const { field, exists } of paths) {
      step[field].forEach((id) => {
        assert.ok(exists(step, id), `${where}: ${field} chứa id treo ${id}`)
      })

      if (index > 0) {
        steps[index - 1][field]
          .filter((id) => exists(step, id))
          .forEach((id) => {
            assert.ok(step[field].includes(id), `${where}: ${field} làm mất ${id}`)
          })
      }
    }

    for (const field of constantFields) {
      assert.equal(step[field], steps[0][field], `${where}: ${field} bị đổi`)
    }

    assert.equal(step.finished, index === steps.length - 1, `${where}: finished sai`)
  })

  assert.equal(steps[0].pseudocodeLine, null, 'bước 0 không tô dòng mã giả')
}

export function lineText(pseudocode, step) {
  return pseudocode[step.pseudocodeLine - 1]
}
