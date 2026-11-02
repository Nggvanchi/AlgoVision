import assert from 'node:assert/strict'
import { hasEntry } from '../../src/structures/hashTable.js'
import { assertStepInvariants, lineText } from './step-invariants.js'

// Bất biến cho mọi mảng bước Hash Table, dựa trên bộ kiểm chung step-invariants.js:
// - currentEntryId / foundEntryId / insertedEntryId là null hoặc id có trong bảng của CHÍNH bước đó;
// - hashIndex / currentBucket là null hoặc chỉ số ô 0..m-1 của bảng của bước đó;
// - pathEntryIds chỉ tăng (trừ phần tử bị xóa), probedBuckets chỉ tăng;
// - operation và key giống nhau ở mọi bước; chỉ bước cuối finished; bước 0 không tô mã giả;
// - comparisons và probes không giảm; m và chiến lược của bảng không đổi giữa các bước.
const entryExists = (step, id) => hasEntry(step.table, id)
const bucketExists = (step, index) => Number.isInteger(index) && index >= 0 && index < step.table.capacity

const hashOptions = {
  references: [
    ...['currentEntryId', 'foundEntryId', 'insertedEntryId'].map((field) => ({ field, exists: entryExists })),
    ...['hashIndex', 'currentBucket'].map((field) => ({ field, exists: bucketExists })),
  ],
  paths: [
    { field: 'pathEntryIds', exists: entryExists },
    { field: 'probedBuckets', exists: bucketExists },
  ],
  constantFields: ['operation', 'key'],
}

export function assertHashStepInvariants(steps) {
  assertStepInvariants(steps, hashOptions)

  steps.forEach((step, index) => {
    const where = `bước ${index}`
    assert.equal(step.table.capacity, steps[0].table.capacity, `${where}: m bị đổi`)
    assert.equal(step.table.strategy, steps[0].table.strategy, `${where}: chiến lược bị đổi`)

    if (index > 0) {
      assert.ok(step.comparisons >= steps[index - 1].comparisons, `${where}: comparisons giảm`)
      assert.ok(step.probes >= steps[index - 1].probes, `${where}: probes giảm`)
    }
  })
}

export { lineText }
