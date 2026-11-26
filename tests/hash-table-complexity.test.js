import test from 'node:test'
import assert from 'node:assert/strict'

import { generateHashTableInsertSteps } from '../src/algorithms/hashTableInsert.js'
import { generateHashTableSearchSteps } from '../src/algorithms/hashTableSearch.js'
import { generateHashTableDeleteSteps } from '../src/algorithms/hashTableDelete.js'
import { deepFreeze } from './helpers/deep-freeze.js'
import { assertHashStepInvariants } from './helpers/hash-step-invariants.js'
import { buildHashTable, loadFactor } from '../src/structures/hashTable.js'

// Đối chiếu Big-O trên Learning Panel với số phép so sánh khóa generator thực sự đếm (chaining).
// Search/Insert/Delete đều so khóa với từng phần tử của đúng một chain, nên chi phí = độ dài chain đã duyệt:
// tốt nhất O(1), phân tán tốt O(1 + α), mọi khóa va chạm O(n).
const comparisonsOf = (steps) => steps.at(-1).comparisons

test('Tốt nhất: m = 7, khóa 0..6 (mỗi ô một khóa), mọi Search tốn đúng 1 phép so sánh', () => {
  const table = buildHashTable(7, [0, 1, 2, 3, 4, 5, 6])

  for (let key = 0; key < 7; key++) {
    assert.equal(comparisonsOf(generateHashTableSearchSteps(table, key)), 1, `khóa ${key}`)
  }
  assert.equal(loadFactor(table), 1)
})

test('Phân tán đều: m = 7, khóa 0..13 (α = 2), chain dài đúng 2 nên tốn 1 hoặc 2, khóa vắng tốn đúng α', () => {
  const table = buildHashTable(7, Array.from({ length: 14 }, (_, key) => key))
  assert.equal(loadFactor(table), 2)

  for (let key = 0; key < 7; key++) {
    assert.equal(comparisonsOf(generateHashTableSearchSteps(table, key)), 1, `khóa đầu chain ${key}`)
    assert.equal(comparisonsOf(generateHashTableSearchSteps(table, key + 7)), 2, `khóa cuối chain ${key + 7}`)
    assert.equal(comparisonsOf(generateHashTableSearchSteps(table, key + 14)), 2, `khóa vắng ${key + 14}`)
    assert.equal(comparisonsOf(generateHashTableInsertSteps(table, key + 14)), 2, `chèn ${key + 14}`)
  }
})

test('Va chạm nặng ở quy mô giao diện: m = 7, khóa 3, 10, …, 94 (n = 14) cùng ô 3, Search khóa cuối tốn n', () => {
  const keys = Array.from({ length: 14 }, (_, k) => 3 + 7 * k)
  const table = buildHashTable(7, keys)

  assert.equal(table.buckets[3].length, 14)
  assert.equal(comparisonsOf(generateHashTableSearchSteps(table, 94)), 14)
  assert.equal(comparisonsOf(generateHashTableSearchSteps(table, 3)), 1)
})

test('Xấu nhất quy mô lớn: m = 7, khóa 0, 7, …, 6993 (1000 khóa cùng ô 0) đều tốn 1000 phép so sánh', () => {
  const keys = Array.from({ length: 1000 }, (_, k) => 7 * k)
  const table = buildHashTable(7, keys)

  assert.equal(comparisonsOf(generateHashTableSearchSteps(table, 6993)), 1000, 'Search khóa cuối')
  assert.equal(comparisonsOf(generateHashTableSearchSteps(table, 7000)), 1000, 'Search khóa vắng cùng ô')
  assert.equal(comparisonsOf(generateHashTableInsertSteps(table, 7000)), 1000, 'Insert phải kiểm trùng cả chain')
  assert.equal(comparisonsOf(generateHashTableDeleteSteps(table, 6993)), 1000, 'Delete khóa cuối')
  assert.equal(comparisonsOf(generateHashTableSearchSteps(table, 0)), 1, 'khóa đầu chain vẫn O(1)')
  assert.equal(comparisonsOf(generateHashTableSearchSteps(table, 1)), 0, 'ô 1 rỗng: 0 phép so sánh')
})

// Oracle dò tay: tuple [line, C, P, bucket, current ID, path IDs, probed buckets].
// Key/operation, found/inserted ID và kết quả cuối kiểm riêng; không lấy expected từ generator.
test('Hash cost contract: sáu full trace literal, frozen input và old-step preservation', () => {
  const e1 = { id: 'e1', key: 4 }
  const e2 = { id: 'e2', key: 9 }
  const e3 = { id: 'e3', key: 14 }
  const e4 = { id: 'e4', key: 19 }
  const empty = { kind: 'empty' }
  const occupied = (entry) => ({ kind: 'occupied', ...entry })
  const base = (strategy) => strategy === 'chaining'
    ? { strategy, capacity: 5, buckets: [[], [], [], [], [e1, e2, e3]], nextId: 4 }
    : { strategy, capacity: 5, cells: [occupied(e2), occupied(e3), empty, empty, occupied(e1)], nextId: 4 }
  const fixtures = [
    { strategy: 'chaining', operation: 'insert', key: 19, result: 'inserted', found: null, inserted: 'e4',
      expected: { strategy: 'chaining', capacity: 5, buckets: [[], [], [], [], [e1, e2, e3, e4]], nextId: 5 },
      rows: [[null,0,0,null,null,[],[]],[1,0,0,4,null,[],[]],[3,1,0,4,'e1',['e1'],[]],[3,2,0,4,'e2',['e1','e2'],[]],[3,3,0,4,'e3',['e1','e2','e3'],[]],[5,3,0,4,null,['e1','e2','e3'],[]]] },
    { strategy: 'chaining', operation: 'search', key: 14, result: 'found', found: 'e3', inserted: null,
      expected: base('chaining'),
      rows: [[null,0,0,null,null,[],[]],[1,0,0,4,null,[],[]],[3,1,0,4,'e1',['e1'],[]],[3,2,0,4,'e2',['e1','e2'],[]],[3,3,0,4,'e3',['e1','e2','e3'],[]],[4,3,0,4,'e3',['e1','e2','e3'],[]]] },
    { strategy: 'chaining', operation: 'delete', key: 9, result: 'deleted', found: null, inserted: null,
      expected: { strategy: 'chaining', capacity: 5, buckets: [[], [], [], [], [e1, e3]], nextId: 4 },
      rows: [[null,0,0,null,null,[],[]],[1,0,0,4,null,[],[]],[3,1,0,4,'e1',['e1'],[]],[3,2,0,4,'e2',['e1','e2'],[]],[4,2,0,4,null,['e1'],[]]] },
    { strategy: 'probing', operation: 'insert', key: 19, result: 'inserted', found: null, inserted: 'e4',
      expected: { strategy: 'probing', capacity: 5, cells: [occupied(e2), occupied(e3), occupied(e4), empty, occupied(e1)], nextId: 5 },
      rows: [[null,0,0,null,null,[],[]],[1,0,0,4,null,[],[]],[3,0,1,4,null,[],[4]],[6,1,1,4,'e1',['e1'],[4]],[3,1,2,0,null,['e1'],[4,0]],[6,2,2,0,'e2',['e1','e2'],[4,0]],[3,2,3,1,null,['e1','e2'],[4,0,1]],[6,3,3,1,'e3',['e1','e2','e3'],[4,0,1]],[3,3,4,2,null,['e1','e2','e3'],[4,0,1,2]],[4,3,4,2,null,['e1','e2','e3'],[4,0,1,2]],[9,3,4,2,null,['e1','e2','e3'],[4,0,1,2]]] },
    { strategy: 'probing', operation: 'search', key: 14, result: 'found', found: 'e3', inserted: null,
      expected: base('probing'),
      rows: [[null,0,0,null,null,[],[]],[1,0,0,4,null,[],[]],[3,0,1,4,null,[],[4]],[6,1,1,4,'e1',['e1'],[4]],[3,1,2,0,null,['e1'],[4,0]],[6,2,2,0,'e2',['e1','e2'],[4,0]],[3,2,3,1,null,['e1','e2'],[4,0,1]],[6,3,3,1,'e3',['e1','e2','e3'],[4,0,1]],[7,3,3,1,'e3',['e1','e2','e3'],[4,0,1]]] },
    { strategy: 'probing', operation: 'delete', key: 9, result: 'deleted', found: null, inserted: null,
      expected: { strategy: 'probing', capacity: 5, cells: [{ kind: 'tombstone' }, occupied(e3), empty, empty, occupied(e1)], nextId: 4 },
      rows: [[null,0,0,null,null,[],[]],[1,0,0,4,null,[],[]],[3,0,1,4,null,[],[4]],[6,1,1,4,'e1',['e1'],[4]],[3,1,2,0,null,['e1'],[4,0]],[6,2,2,0,'e2',['e1','e2'],[4,0]],[7,2,2,0,null,['e1'],[4,0]]] },
  ]
  const generators = { insert: generateHashTableInsertSteps, search: generateHashTableSearchSteps, delete: generateHashTableDeleteSteps }
  for (const fixture of fixtures) {
    const where = fixture.strategy + '/' + fixture.operation
    const input = deepFreeze(structuredClone(base(fixture.strategy)))
    const savedInput = structuredClone(input)
    const steps = generators[fixture.operation](input, fixture.key)
    assertHashStepInvariants(steps)
    assert.equal(steps.length, fixture.rows.length, where + ': S literal')
    assert.deepEqual(steps.map((step) => [step.pseudocodeLine, step.comparisons, step.probes, step.currentBucket, step.currentEntryId, step.pathEntryIds, step.probedBuckets]), fixture.rows, where + ': full trace literal')
    steps.forEach((step, index) => {
      const last = index === steps.length - 1
      assert.equal(step.operation, fixture.operation, where + ': operation cố định')
      assert.equal(step.key, fixture.key, where + ': key cố định')
      assert.equal(step.hashIndex, index === 0 ? null : 4, where + ': hashIndex')
      assert.equal(step.finished, last, where + ': finished')
      assert.equal(step.result, last ? fixture.result : null, where + ': result')
      assert.equal(step.foundEntryId, last ? fixture.found : null, where + ': found ID')
      assert.equal(step.insertedEntryId, last ? fixture.inserted : null, where + ': inserted ID')
      assert.deepEqual(step.table, last ? fixture.expected : savedInput, where + ': snapshot')
    })
    assert.deepEqual(input, savedInput, where + ': input bất biến')
    const savedSteps = structuredClone(steps)
    deepFreeze(steps)
    generateHashTableInsertSteps(steps.at(-1).table, 24)
    generateHashTableDeleteSteps(steps.at(-1).table, 4)
    assert.deepEqual(steps, savedSteps, where + ': old steps không đổi khi thao tác tiếp')
  }
})
