#!/usr/bin/env node
// Sao lưu và khôi phục nguyên byte một file, kiểm bằng SHA-256.
// Dùng khi file đang có sửa đổi CHƯA COMMIT nên không thể git restore (git restore sẽ xóa luôn sửa đổi thật).
//   node snapshot.mjs save    <file...>   # lưu bản sao vào thư mục tạm của hệ điều hành
//   node snapshot.mjs restore <file...>   # ghi lại đúng byte đã lưu và xác nhận SHA-256
//   node snapshot.mjs verify  <file...>   # so file hiện tại với bản đã lưu
//   node snapshot.mjs clear               # xóa mọi bản lưu của repo này
// Exit 1 nếu restore/verify thất bại.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')

const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const storeDir = path.join(os.tmpdir(), 'algovision-snapshots', sha256(Buffer.from(repoRoot)).slice(0, 12))

function snapshotPath(file) {
  const relative = path.relative(repoRoot, path.resolve(file)).split(path.sep).join('/')
  return path.join(storeDir, `${sha256(Buffer.from(relative)).slice(0, 16)}.bak`)
}

const [command, ...files] = process.argv.slice(2)
let failed = false

if (command === 'clear') {
  fs.rmSync(storeDir, { recursive: true, force: true })
  console.log(`Đã xóa ${storeDir}`)
  process.exit(0)
}

if (!['save', 'restore', 'verify'].includes(command) || files.length === 0) {
  console.log('Dùng: node snapshot.mjs save|restore|verify <file...>  hoặc  node snapshot.mjs clear')
  process.exit(1)
}

fs.mkdirSync(storeDir, { recursive: true })

for (const file of files) {
  const backup = snapshotPath(file)
  if (command === 'save') {
    const bytes = fs.readFileSync(file)
    fs.writeFileSync(backup, bytes)
    console.log(`SAVE    ${file}  sha256=${sha256(bytes).slice(0, 16)}`)
    continue
  }
  if (!fs.existsSync(backup)) {
    console.log(`MISSING ${file}: chưa có bản lưu`)
    failed = true
    continue
  }
  const saved = fs.readFileSync(backup)
  if (command === 'restore') fs.writeFileSync(file, saved)
  const current = fs.readFileSync(file)
  const same = sha256(current) === sha256(saved)
  console.log(`${command === 'restore' ? 'RESTORE' : 'VERIFY '} ${file}  ${same ? 'KHỚP' : 'KHÁC'}  sha256=${sha256(current).slice(0, 16)}`)
  if (!same) failed = true
}

process.exit(failed ? 1 : 0)
