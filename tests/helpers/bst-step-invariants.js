import assert from 'node:assert/strict'

// Bất biến chung cho mọi mảng bước BST:
// - currentId / foundId / successorId là null hoặc thuộc tree.nodes của CHÍNH bước đó (không có id treo);
// - mọi id trong pathIds đều thuộc tree.nodes của bước đó;
// - pathIds chỉ tăng: chứa pathIds của bước trước, trừ các nút đã bị xóa khỏi cây;
// - operation và value giống nhau ở mọi bước (chốt khi sinh bước);
// - chỉ bước cuối có finished = true.
export function assertBstStepInvariants(steps) {
  assert.ok(steps.length > 0, 'phải có ít nhất một bước')

  steps.forEach((step, index) => {
    const where = `bước ${index}`

    for (const field of ['currentId', 'foundId', 'successorId']) {
      const id = step[field]
      assert.ok(
        id === null || Object.hasOwn(step.tree.nodes, id),
        `${where}: ${field} = ${id} không có trong cây của bước`,
      )
    }

    step.pathIds.forEach((id) => {
      assert.ok(Object.hasOwn(step.tree.nodes, id), `${where}: pathIds chứa id treo ${id}`)
    })

    if (index > 0) {
      const previous = steps[index - 1]
      previous.pathIds
        .filter((id) => Object.hasOwn(step.tree.nodes, id))
        .forEach((id) => {
          assert.ok(step.pathIds.includes(id), `${where}: pathIds làm mất nút ${id}`)
        })
    }

    assert.equal(step.operation, steps[0].operation, `${where}: operation bị đổi`)
    assert.equal(step.value, steps[0].value, `${where}: value bị đổi`)
    assert.equal(step.finished, index === steps.length - 1, `${where}: finished sai`)
  })

  assert.equal(steps[0].pseudocodeLine, null, 'bước 0 không tô dòng mã giả')
}

export function lineText(pseudocode, step) {
  return pseudocode[step.pseudocodeLine - 1]
}
