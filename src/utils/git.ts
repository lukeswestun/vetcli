import { execSync } from 'node:child_process'

export interface GitFileDiff {
  file: string
  content: string
  addedLines: { line: number; content: string }[]
}

function isGitRepo(cwd: string): boolean {
  try {
    execSync('git rev-parse --git-dir', { cwd, stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

function getStagedDiff(cwd: string): string {
  return execSync('git diff --cached --unified=0', {
    cwd,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  })
}

function parseDiff(raw: string): GitFileDiff[] {
  const files: GitFileDiff[] = []
  const fileRegex = /^\+\+\+\s+(?:b\/)?(.+)$/m
  const hunkRegex = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@.*$/m

  const sections = raw.split(/^diff --git /m).slice(1)

  for (const section of sections) {
    const fileMatch = section.match(fileRegex)
    if (!fileMatch) continue

    const file = fileMatch[1]
    const lines: { line: number; content: string }[] = []
    const hunkMatches = section.matchAll(hunkRegex)

    const sectionLines = section.split('\n')
    let currentLineOffset = 0
    let inHunk = false

    for (const line of sectionLines) {
      if (line.startsWith('@@')) {
        const match = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
        if (match) {
          currentLineOffset = parseInt(match[1], 10) - 1
          inHunk = true
        }
        continue
      }

      if (!inHunk || line.startsWith('---') || line.startsWith('+++')) {
        continue
      }

      if (line.startsWith('+')) {
        currentLineOffset++
        lines.push({
          line: currentLineOffset,
          content: line.slice(1),
        })
      } else if (line.startsWith(' ')) {
        currentLineOffset++
      } else if (line.startsWith('-')) {
        // Deleted line, don't increment counter for added lines
      }
    }

    files.push({ file, content: '', addedLines: lines })
  }

  return files
}

export function getStagedFiles(cwd: string = process.cwd()): {
  files: GitFileDiff[]
  error?: string
} {
  try {
    if (!isGitRepo(cwd)) {
      return { files: [], error: 'Not a git repository' }
    }

    const rawDiff = getStagedDiff(cwd)
    if (!rawDiff.trim()) {
      return { files: [], error: 'No staged changes to verify' }
    }

    const files = parseDiff(rawDiff)
    return { files }
  } catch (e) {
    return {
      files: [],
      error: e instanceof Error ? e.message : 'Unknown git error',
    }
  }
}

export function getGitHistoryPatterns(
  cwd: string = process.cwd(),
): {
  namingConvention: 'camelCase' | 'snake_case' | 'PascalCase' | 'unknown'
} {
  try {
    const log = execSync(
      'git log --diff-filter=A --name-only --format="" -100',
      { cwd, encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024 },
    )

    const files = log.split('\n').filter(Boolean)
    let camelCount = 0
    let snakeCount = 0
    let pascalCount = 0

    for (const file of files) {
      const name = file.split('/').pop() || ''
      if (/^[a-z][a-zA-Z0-9]*/.test(name) && /[A-Z]/.test(name)) {
        camelCount++
      } else if (/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(name)) {
        snakeCount++
      } else if (/^[A-Z][a-zA-Z0-9]*/.test(name)) {
        pascalCount++
      }
    }

    const max = Math.max(camelCount, snakeCount, pascalCount)
    if (max === 0) return { namingConvention: 'unknown' }
    if (max === camelCount) return { namingConvention: 'camelCase' }
    if (max === snakeCount) return { namingConvention: 'snake_case' }
    return { namingConvention: 'PascalCase' }
  } catch {
    return { namingConvention: 'unknown' }
  }
}

export function getFileContent(
  file: string,
  cwd: string = process.cwd(),
): string | null {
  try {
    return execSync(`git show :"${file}"`, {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    })
  } catch {
    return null
  }
}
