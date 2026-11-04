#!/usr/bin/env node
// Kiểm tra môi trường và trạng thái repo AlgoVision. CHỈ ĐỌC, không sửa gì.
// Luôn exit 0; mọi vấn đề được in với tiền tố "WARN".
// Dùng: node env-check.mjs
import { execFileSync, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const warnings = []
const show = (label, value) => console.log(`${label.padEnd(18)} ${value}`)
const warn = (message) => {
  warnings.push(message)
  console.log(`WARN  ${message}`)
}

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trimEnd()
  } catch {
    return null
  }
}

function shell(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

function readFirstBytes(file, count) {
  const fd = fs.openSync(file, 'r')
  try {
    const buffer = Buffer.alloc(count)
    const read = fs.readSync(fd, buffer, 0, count, 0)
    return buffer.subarray(0, read)
  } finally {
    fs.closeSync(fd)
  }
}

const BINARY_EXT = /\.(png|jpe?g|gif|webp|ico|bmp|woff2?|ttf|otf|eot|pdf|zip|gz|mp4|webm)$/i
// Chuỗi UTF-8 bị đọc nhầm thành Latin-1 (ví dụ chữ "ẻ" biến thành hai ký tự "á" + "»").
const MOJIBAKE = /á[º»]|Ã[\u0080-\u00BF]|Ä[\u0080-\u00BF]|Æ[°¡]/

const root = git(['rev-parse', '--show-toplevel'])
if (!root) {
  console.log('Không ở trong git repo.')
  process.exit(0)
}
process.chdir(root)

console.log('== Môi trường ==')
show('platform', `${process.platform} ${process.arch}`)
show('node', process.version)
show('pnpm', shell('pnpm -v') ?? 'không tìm thấy')
show('git', git(['--version']) ?? 'không tìm thấy')

try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  show('engines.node', pkg.engines?.node ?? '(chưa khai báo)')
  show('packageManager', pkg.packageManager ?? '(chưa khai báo)')
} catch {
  warn('Không đọc được package.json')
}

const currentOs = process.platform
if (!fs.existsSync('node_modules')) {
  warn('Chưa có node_modules: chạy pnpm install --frozen-lockfile')
} else {
  const pnpmStore = path.join('node_modules', '.pnpm')
  const entries = fs.existsSync(pnpmStore) ? fs.readdirSync(pnpmStore) : []
  const natives = entries.filter((name) => /(binding|lightningcss)-(win32|linux|darwin)-/.test(name))
  const nativeOses = new Set(natives.map((name) => name.match(/-(win32|linux|darwin)-/)[1]))
  show('native bindings', natives.length ? natives.join(', ') : '(không thấy)')
  if (natives.length && !nativeOses.has(currentOs)) {
    warn(`node_modules chứa binary của ${[...nativeOses].join('/')}, thiếu bản ${currentOs}: chạy pnpm install --frozen-lockfile`)
  }
}

console.log('\n== Git ==')
show('branch', git(['branch', '--show-current']) || '(detached HEAD)')
show('HEAD', git(['log', '-1', '--format=%h %s']) ?? '?')

const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'])
if (upstream) {
  const [behind, ahead] = (git(['rev-list', '--left-right', '--count', `${upstream}...HEAD`]) ?? '0 0').split(/\s+/)
  show('upstream', `${upstream} (ahead ${ahead}, behind ${behind})`)
} else {
  show('upstream', '(không có: branch chỉ ở local hoặc chưa đặt upstream)')
}

const fetchHead = git(['rev-parse', '--git-path', 'FETCH_HEAD'])
if (fetchHead && fs.existsSync(fetchHead)) {
  const hours = (Date.now() - fs.statSync(fetchHead).mtimeMs) / 3_600_000
  show('lần fetch gần nhất', `${hours.toFixed(1)} giờ trước`)
  if (hours > 12) warn('Thông tin origin có thể đã cũ: chạy git fetch (chỉ đọc remote) trước khi kết luận về main')
} else {
  warn('Chưa từng fetch trong repo này: chạy git fetch trước khi kết luận về main')
}

const localMain = git(['rev-parse', '--verify', '--quiet', 'main'])
const remoteMain = git(['rev-parse', '--verify', '--quiet', 'origin/main'])
if (localMain && remoteMain) {
  const [mainBehind, mainAhead] = (git(['rev-list', '--left-right', '--count', 'origin/main...main']) ?? '0 0').split(/\s+/)
  show('main so với origin/main', `ahead ${mainAhead}, behind ${mainBehind}`)
  if (Number(mainBehind) > 0) {
    warn(`main local tụt ${mainBehind} commit so với origin/main: git switch main && git pull --ff-only trước khi tạo branch mới`)
  }
  if (Number(mainAhead) > 0) warn(`main local có ${mainAhead} commit chưa có trên origin/main (không được push thẳng lên main)`)
}

const goneBranches = (git(['branch', '-vv']) ?? '')
  .split('\n')
  .filter((entry) => /\[[^\]]*: gone\]/.test(entry))
  .map((entry) => entry.replace(/^\*?\s+/, '').split(/\s+/)[0])
if (goneBranches.length) show('upstream đã mất', `${goneBranches.join(', ')} (đã merge và xóa trên GitHub; dọn khi tiện)`)

const mainRef = localMain ? 'main' : null
if (mainRef) {
  const onlyHere = git(['log', '--oneline', 'main..HEAD'])
  show('commit so với main', onlyHere ? `\n${onlyHere.split('\n').map((l) => '   ' + l).join('\n')}` : '(không có)')
}

for (const marker of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply', 'index.lock']) {
  const markerPath = git(['rev-parse', '--git-path', marker])
  if (markerPath && fs.existsSync(markerPath)) warn(`Thao tác git dở dang: ${marker}`)
}

const statusLines = (git(['status', '--porcelain=v1']) ?? '').split('\n').filter(Boolean)
show('working tree', statusLines.length ? `${statusLines.length} mục` : 'sạch')
for (const entry of statusLines) console.log(`   ${entry}`)
if (statusLines.some((entry) => entry.slice(3).replace(/^"/, '').startsWith('src/'))) {
  warn('src/ có thay đổi chưa commit. Có thể là mutation chưa restore: xem git diff -- src/ và hỏi người dùng trước khi restore.')
}

const stash = git(['stash', 'list'])
if (stash) warn(`stash không rỗng:\n${stash}`)

console.log('\n== Xuống dòng và mã hóa ==')
show('core.autocrlf', git(['config', 'core.autocrlf']) ?? '(không đặt)')
show('core.fileMode', git(['config', 'core.fileMode']) ?? '(không đặt)')

const eolProblems = (git(['ls-files', '--eol']) ?? '')
  .split('\n')
  .filter((entry) => /\b[iw]\/(crlf|mixed)\b/.test(entry))
if (eolProblems.length) {
  warn(`${eolProblems.length} file có CRLF hoặc xuống dòng lẫn lộn:`)
  for (const entry of eolProblems) console.log(`   ${entry}`)
} else {
  show('xuống dòng', 'OK (không có crlf/mixed)')
}

const tracked = (git(['ls-files', '-z']) ?? '').split('\0').filter(Boolean)
const bomFiles = []
const mojibakeHits = []
for (const file of tracked) {
  if (BINARY_EXT.test(file) || !fs.existsSync(file)) continue
  if (readFirstBytes(file, 3).toString('hex') === 'efbbbf') bomFiles.push(file)
  const text = fs.readFileSync(file, 'utf8')
  if (text.includes('\0')) continue
  text.split('\n').forEach((content, index) => {
    if (MOJIBAKE.test(content)) mojibakeHits.push(`${file}:${index + 1}`)
  })
}
if (bomFiles.length) warn(`File có BOM UTF-8: ${bomFiles.join(', ')}`)
else show('BOM', 'OK (không file nào)')
if (mojibakeHits.length) warn(`Nghi chuỗi lỗi mã hóa (kiểm tra bằng mắt): ${mojibakeHits.join(', ')}`)
else show('lỗi mã hóa', 'OK (không thấy)')

console.log(`\n== Tổng kết: ${warnings.length} cảnh báo ==`)
process.exit(0)
