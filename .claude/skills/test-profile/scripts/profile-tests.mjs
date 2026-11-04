#!/usr/bin/env node
// Đo từng file test node:test: thời gian, bộ nhớ đỉnh (maxRSS), số test, đỏ/xanh, tràn heap.
// Mỗi file chạy trong một tiến trình riêng (giống `node --test`), tuần tự để số đo không nhiễu nhau.
// Dùng:
//   node profile-tests.mjs                       # mọi tests/**/*.test.js
//   node profile-tests.mjs tests/bst*.test.js    # file chỉ định
//   node profile-tests.mjs --heap 512 --timeout 120 --json <file-kết-quả.json>
// Luôn exit 0; đọc bảng và dòng TỔNG.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function parseArgs(argv) {
  const options = { heap: null, timeout: 120, json: null, files: [] }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--heap') options.heap = Number(argv[++i])
    else if (argv[i] === '--timeout') options.timeout = Number(argv[++i])
    else if (argv[i] === '--json') options.json = argv[++i]
    else options.files.push(argv[i])
  }
  return options
}

function findTestFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { recursive: true })
    .map((entry) => path.join(dir, String(entry)).split(path.sep).join('/'))
    .filter((file) => file.endsWith('.test.js') || file.endsWith('.test.mjs'))
    .sort()
}

const options = parseArgs(process.argv.slice(2))
const files = options.files.length ? options.files : findTestFiles('tests')
if (files.length === 0) {
  console.log('Không tìm thấy file test nào.')
  process.exit(0)
}

// Hook in số đo của chính tiến trình con khi nó thoát.
const hookFile = path.join(os.tmpdir(), `algovision-profile-hook-${process.pid}.mjs`)
fs.writeFileSync(
  hookFile,
  "process.on('exit', () => { process.stderr.write('\\n__PROFILE__ ' + JSON.stringify({ maxRssKB: process.resourceUsage().maxRSS }) + '\\n') })\n",
  'utf8',
)

const env = { ...process.env }
if (options.heap) env.NODE_OPTIONS = `${env.NODE_OPTIONS ?? ''} --max-old-space-size=${options.heap}`.trim()

const rows = []
for (const file of files) {
  const started = Date.now()
  const result = spawnSync(
    process.execPath,
    ['--import', pathToFileURL(hookFile).href, '--test-reporter=tap', `--test-timeout=${options.timeout * 1000}`, file],
    { encoding: 'utf8', env, timeout: (options.timeout + 30) * 1000, killSignal: 'SIGKILL', maxBuffer: 64 * 1024 * 1024 },
  )
  const seconds = (Date.now() - started) / 1000
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  const count = (key) => Number(output.match(new RegExp(`^# ${key} (\\d+)`, 'm'))?.[1] ?? NaN)
  const profile = output.match(/__PROFILE__ (\{.*\})/)
  const maxRssMB = profile ? JSON.parse(profile[1]).maxRssKB / 1024 : NaN
  const outOfMemory = /heap out of memory|Allocation failed|RangeError: Array buffer allocation failed/i.test(output)
  const timedOut = result.error?.code === 'ETIMEDOUT'
  let status = 'XANH'
  if (outOfMemory) status = 'TRÀN HEAP'
  else if (timedOut) status = 'HẾT GIỜ'
  else if (result.status !== 0) status = 'ĐỎ'
  rows.push({ file, seconds, maxRssMB, tests: count('tests'), fail: count('fail'), status })
}
fs.rmSync(hookFile, { force: true })

rows.sort((a, b) => b.seconds - a.seconds)
const pad = (value, width) => String(value).padEnd(width)
const fileWidth = Math.max(4, ...rows.map((row) => row.file.length))
console.log(`${pad('file', fileWidth)}  ${pad('giây', 7)}  ${pad('RSS MB', 7)}  ${pad('tests', 5)}  ${pad('fail', 4)}  trạng thái`)
for (const row of rows) {
  const rss = Number.isFinite(row.maxRssMB) ? row.maxRssMB.toFixed(0) : '?'
  const shown = (value) => (Number.isFinite(value) ? value : '?')
  console.log(`${pad(row.file, fileWidth)}  ${pad(row.seconds.toFixed(2), 7)}  ${pad(rss, 7)}  ${pad(shown(row.tests), 5)}  ${pad(shown(row.fail), 4)}  ${row.status}`)
}

const total = rows.reduce((sum, row) => sum + row.seconds, 0)
const totalTests = rows.reduce((sum, row) => sum + (Number.isFinite(row.tests) ? row.tests : 0), 0)
const peak = rows.reduce((best, row) => (row.maxRssMB > (best?.maxRssMB ?? -1) ? row : best), null)
console.log(`\nTỔNG: ${rows.length} file, ${totalTests} test, ${total.toFixed(1)} s (chạy tuần tự), heap ${options.heap ? options.heap + ' MB' : 'mặc định'}`)
if (peak) console.log(`RSS lớn nhất: ${peak.maxRssMB.toFixed(0)} MB ở ${peak.file}`)
const notGreen = rows.filter((row) => row.status !== 'XANH')
if (notGreen.length) console.log(`KHÔNG XANH: ${notGreen.map((row) => `${row.file} (${row.status})`).join(', ')}`)

if (options.json) {
  fs.writeFileSync(options.json, JSON.stringify({ heapMB: options.heap, rows }, null, 2), 'utf8')
  console.log(`Đã ghi ${options.json}`)
}
