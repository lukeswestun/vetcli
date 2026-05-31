import { existsSync, readFileSync } from 'node:fs'
import { loadConfig } from '../../config/loader.js'
import { runChecks } from '../../core/orchestrator.js'
import { formatTextReport, formatJsonReport } from '../../core/reporter.js'
import type { GitFileDiff } from '../../utils/git.js'

export interface CheckOptions {
  format?: 'text' | 'json'
}

export function checkCommand(file: string, options: CheckOptions = {}) {
  const filePath = file

  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(3)
  }

  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  const diffFile: GitFileDiff = {
    file: filePath,
    content,
    addedLines: lines.map((content, i) => ({
      line: i + 1,
      content,
    })),
  }

  const config = loadConfig()
  const result = runChecks([diffFile], config)

  if (options.format === 'json') {
    console.log(formatJsonReport(result))
  } else {
    console.log(formatTextReport(result))
  }

  if (!result.passed) {
    process.exit(1)
  }
}
