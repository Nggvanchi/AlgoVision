#!/usr/bin/env node
// Kiểm BOM UTF-8, CRLF và chuỗi lỗi mã hóa (UTF-8 bị đọc thành Latin-1) trên các file văn bản.
// Mặc định: file đã sửa so với HEAD + file chưa được theo dõi.
// Dùng:
//   node check-encoding.mjs            # file đã sửa + chưa theo dõi
//   node check-encoding.mjs --staged   # chỉ file đã git add
//   node check-encoding.mjs --all      # mọi file được theo dõi
//   node check-encoding.mjs a.js b.md  # các file chỉ định
// Exit 0 nếu sạch, 1 nếu có vấn đề.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const BINARY_EXT = /\.(png|jpe?g|gif|webp|ico|bmp|woff2?|ttf|otf|eot|pdf|zip|gz|mp4|webm)$/i
const MOJIBAKE = /á[º»]|Ã[\u0080-\u00BF]|Ä[\u0080-\u00BF]|Æ[°¡]/

// core.quotePath=false: git in tên file Unicode (tiếng Việt) nguyên văn thay vì "\303\241…" trong ngoặc kép,
// nếu không fs.existsSync sẽ trả false và file bị bỏ qua mà không báo.
function gitLines(args) {
  const output = execFileSync('git', ['-c', 'core.quotePath=false', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  return output.split(/\r?\n/).filter(Boolean)
}

function pickFiles(argv) {
  if (argv.includes('--all')) return gitLines(['ls-files'])
  if (argv.includes('--staged')) return gitLines(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
  const explicit = argv.filter((arg) => !arg.startsWith('--'))
  if (explicit.length) return explicit
  const changed = gitLines(['diff', 'HEAD', '--name-only', '--diff-filter=ACMR'])
  const untracked = gitLines(['ls-files', '--others', '--exclude-standard'])
  return [...new Set([...changed, ...untracked])]
}

const files = pickFiles(process.argv.slice(2))
const problems = []

for (const file of files) {
  if (BINARY_EXT.test(file) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) continue
  const bytes = fs.readFileSync(file)
  if (bytes.includes(0)) continue // file nhị phân

  if (bytes.subarray(0, 3).toString('hex') === 'efbbbf') problems.push(`${file}: có BOM UTF-8`)

  const text = bytes.toString('utf8')
  const crlfCount = (text.match(/\r\n/g) ?? []).length
  if (crlfCount) problems.push(`${file}: ${crlfCount} dòng kết thúc bằng CRLF (repo dùng LF)`)

  text.split('\n').forEach((content, index) => {
    if (MOJIBAKE.test(content)) problems.push(`${file}:${index + 1}: nghi lỗi mã hóa: ${content.trim().slice(0, 80)}`)
  })
}

console.log(`Đã kiểm ${files.length} file.`)
if (problems.length) {
  console.log(`Có ${problems.length} vấn đề:`)
  for (const problem of problems) console.log(`  - ${problem}`)
  process.exit(1)
}
console.log('Sạch: không BOM, không CRLF, không thấy lỗi mã hóa.')
