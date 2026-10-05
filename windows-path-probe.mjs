import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

if (process.platform !== 'win32') {
  console.log(`Skipping Windows-only path probe on ${process.platform}`)
  process.exit(0)
}

const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'node-win-path-'))
const root = path.join(temp, 'root')
const sentinel = path.join(root, 'sentinel.json')
const marker = `overwritten-by-node-${process.version}`
const original = `original-${process.version}`

await fs.mkdir(path.join(root, 'scope', 'hash', '$', 'route'), {
  recursive: true,
})
await fs.writeFile(sentinel, original)

const candidate = path.join(
  root,
  'scope',
  'hash',
  '$',
  'route',
  '.. ',
  '.. ',
  '.. ',
  '.. ',
  'sentinel.json'
)

await fs.mkdir(path.dirname(candidate), { recursive: true })
await fs.writeFile(candidate, marker)

const sentinelAfter = await fs.readFile(sentinel, 'utf8')
let candidateRealPath = null
try {
  candidateRealPath = await fs.realpath(candidate)
} catch (error) {
  candidateRealPath = `${error.code}: ${error.message}`
}

console.log(
  JSON.stringify(
    {
      node: process.version,
      platform: process.platform,
      release: os.release(),
      root,
      candidate,
      candidateRealPath,
      lexicalPrefixAccepted: candidate.startsWith(root + path.sep),
      sentinelAfter,
      aliasesParentTraversal: sentinelAfter === marker,
    },
    null,
    2
  )
)

if (sentinelAfter !== marker) {
  process.exitCode = 2
}
