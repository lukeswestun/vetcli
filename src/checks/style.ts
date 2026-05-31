import type { Issue, VerifiedFile } from '../core/index.js'
import type { VetConfig } from '../config/defaults.js'
import { getGitHistoryPatterns } from '../utils/git.js'

const NAMING_PATTERNS = [
  {
    name: 'camelCase',
    regex: /^(?:[a-z][a-zA-Z0-9]*)$/,
    description: 'startsWith lowercase, contains uppercase',
  },
  {
    name: 'PascalCase',
    regex: /^(?:[A-Z][a-zA-Z0-9]*)$/,
    description: 'startsWith uppercase, no underscores',
  },
  {
    name: 'snake_case',
    regex: /^(?:[a-z][a-z0-9]*(?:_[a-z0-9]+)*)$/,
    description: 'all lowercase with underscores',
  },
  {
    name: 'SCREAMING_SNAKE_CASE',
    regex: /^(?:[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*)$/,
    description: 'all uppercase with underscores',
  },
]

interface FunctionLike {
  line: number
  name: string
  type: 'function' | 'method' | 'variable' | 'class'
}

function extractFunctionNames(
  content: string,
  file: string,
  addedLines: { line: number; content: string }[],
): FunctionLike[] {
  const results: FunctionLike[] = []
  const addedContent = addedLines.map((l) => l.content).join('\n')
  const lines = addedContent.split('\n')

  const patterns = [
    {
      regex: /(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
      type: 'function' as const,
    },
    {
      regex: /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\(?=>?)/,
      type: 'variable' as const,
    },
    {
      regex: /(?:export\s+)?class\s+(\w+)/,
      type: 'class' as const,
    },
    {
      regex: /(\w+)\s*\([^)]*\)\s*\{[^}]*\}/,
      type: 'method' as const,
    },
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const p of patterns) {
      const match = line.match(p.regex)
      if (match) {
        results.push({
          line: addedLines[i]?.line ?? i + 1,
          name: match[1],
          type: p.type,
        })
      }
    }
  }

  return results
}

function getNamingConvention(name: string): string | null {
  for (const p of NAMING_PATTERNS) {
    if (p.regex.test(name)) return p.name
  }
  return null
}

export function checkStyle(
  files: { file: string; content: string; addedLines: { line: number; content: string }[] }[],
  config: VetConfig,
): VerifiedFile[] {
  if (!config.checks.style) {
    return files.map((f) => ({ file: f.file, issues: [] }))
  }

  const results: VerifiedFile[] = []
  const historyPatterns = getGitHistoryPatterns()
  const projectConvention = historyPatterns.namingConvention

  for (const file of files) {
    const issues: Issue[] = []
    const funcs = extractFunctionNames(file.content, file.file, file.addedLines)

    for (const func of funcs) {
      const convention = getNamingConvention(func.name)
      if (!convention) continue

      if (projectConvention !== 'unknown' && projectConvention !== convention) {
        if (
          (func.type === 'function' && projectConvention === 'camelCase' && convention === 'snake_case') ||
          (func.type === 'class' && projectConvention === 'PascalCase' && convention !== 'PascalCase')
        ) {
          issues.push({
            file: file.file,
            line: func.line,
            category: 'style',
            severity: 'warning',
            message: `Inconsistent naming: '${func.name}' uses ${convention} but project uses ${projectConvention}`,
            suggestion:
              func.type === 'class'
                ? `Classes should use PascalCase: '${func.name.charAt(0).toUpperCase() + func.name.slice(1)}'`
                : `Functions should use ${projectConvention}: rename '${func.name}' to follow project convention`,
            code: func.name,
          })
        }
      }

      if (func.type === 'class' && convention !== 'PascalCase') {
        if (!issues.some((i) => i.line === func.line && i.category === 'style')) {
          issues.push({
            file: file.file,
            line: func.line,
            category: 'style',
            severity: 'warning',
            message: `Class '${func.name}' should use PascalCase`,
            suggestion: `Rename to '${func.name.charAt(0).toUpperCase() + func.name.slice(1)}'`,
            code: func.name,
          })
        }
      }
    }

    results.push({ file: file.file, issues })
  }

  return results
}
