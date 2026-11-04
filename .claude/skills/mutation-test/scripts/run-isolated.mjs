#!/usr/bin/env node
// Chạy một file test node:test riêng lẻ, có giới hạn heap và thời gian, rồi tóm tắt kết quả.
// Dùng:
//   node run-isolated.mjs <file-test> [--heap 768] [--timeout 60] [--name "<regex tên test>"]
//                         [--expect "<thông điệp mong đợi>"] [--label "<nhãn>"] [--log <đường-dẫn-log>]
// Script luôn exit 0; đọc dòng VERDICT để biết kết quả.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'

function parseArgs(argv) {
  const options = { heap: null, timeout: 60, name: null, expect: null, label: '', log: null, file: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--heap') options.heap = Number(argv[++i])
    else if (arg === '--timeout') options.timeout = Number(argv[++i])
    else if (arg === '--name') options.name = argv[++i]
    else if (arg === '--expect') options.expect = argv[++i]
    else if (arg === '--label') options.label = argv[++i]
    else if (arg === '--log') options.log = argv[++i]
    else options.file = arg
  }
  return options
}

const options = parseArgs(process.argv.slice(2))
if (!options.file) {
  console.log('Thiếu file test. Ví dụ: node run-isolated.mjs tests/bst-controller.test.js --heap 768')
  process.exit(0)
}

const nodeArgs = ['--test', '--test-reporter=tap', `--test-timeout=${options.timeout * 1000}`]
if (options.name) nodeArgs.push(`--test-name-pattern=${options.name}`)
nodeArgs.push(options.file)

const env = { ...process.env }
if (options.heap) {
  // Biến môi trường được tiến trình con của node --test kế thừa.
  env.NODE_OPTIONS = `${env.NODE_OPTIONS ?? ''} --max-old-space-size=${options.heap}`.trim()
}

const started = Date.now()
const result = spawnSync(process.execPath, nodeArgs, {
  encoding: 'utf8',
  env,
  timeout: (options.timeout + 15) * 1000,
  killSignal: 'SIGKILL',
  maxBuffer: 64 * 1024 * 1024,
})
const seconds = ((Date.now() - started) / 1000).toFixed(1)
const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
const outputLines = output.split('\n').filter(Boolean).length
if (options.log) fs.writeFileSync(options.log, output, 'utf8')

const count = (key) => Number(output.match(new RegExp(`^# ${key} (\\d+)`, 'm'))?.[1] ?? NaN)
const timedOut = result.error?.code === 'ETIMEDOUT'
const outOfMemory = /heap out of memory|Allocation failed|ERR_WORKER_OUT_OF_MEMORY|RangeError: Array buffer allocation failed/i.test(output)
const expectFound = options.expect ? output.includes(options.expect) : null

console.log(`label:       ${options.label || '(không nhãn)'}`)
console.log(`file:        ${options.file}${options.name ? `  (tên test ~ /${options.name}/)` : ''}`)
console.log(`heap:        ${options.heap ? `${options.heap} MB` : 'mặc định'} | timeout: ${options.timeout} s/test`)
console.log(`exit:        ${result.status ?? 'null'}${result.signal ? ` (signal ${result.signal})` : ''}${timedOut ? ' (HẾT GIỜ, đã kill)' : ''}`)
console.log(`thời gian:   ${seconds} s | output: ${outputLines} dòng`)
console.log(`tests:       ${count('tests')} | pass ${count('pass')} | fail ${count('fail')} | skipped ${count('skipped')} | todo ${count('todo')}`)
console.log(`tràn heap:   ${outOfMemory ? 'CÓ' : 'không'}`)
if (options.expect) console.log(`thông điệp:  ${expectFound ? 'CÓ' : 'KHÔNG'} thấy "${options.expect}"`)
if (options.log) console.log(`log:         ${options.log}`)

let verdict
if (outOfMemory) verdict = 'TRÀN HEAP: kết quả không dùng được, kiểm lại mốc đối chứng ở cùng heap'
else if (timedOut) verdict = 'HẾT GIỜ: tiến trình bị kill'
else if (result.status === 0) verdict = 'XANH'
else if (options.expect && !expectFound) verdict = 'ĐỎ nhưng KHÔNG thấy thông điệp mong đợi (có thể assert khác đỏ trước)'
else verdict = 'ĐỎ' + (options.expect ? ' đúng thông điệp' : '')
console.log(`VERDICT:     ${verdict}`)
