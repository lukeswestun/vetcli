import type { VerificationResult } from './index.js'
import { green, red, yellow, blue, bold, dim, success, error as errMsg, warning, info } from '../utils/logging.js'

export function formatTextReport(result: VerificationResult, name = 'Vet'): string {
  const lines: string[] = []

  lines.push('')
  lines.push(`  ${bold(`❯ ${name} — AI Output Verification`)}`)
  lines.push('')

  if (result.files.length === 0) {
    lines.push(`  ${info('No files to verify')}`)
    lines.push('')
    return lines.join('\n')
  }

  const fileCount = result.files.length
  const filesWithIssues = result.files.filter((f) => f.issues.length > 0).length

  lines.push(`  ${bold('Files checked:')} ${fileCount}`)

  if (result.summary.total > 0) {
    lines.push(`  ${bold('Issues found:')}  ${result.summary.total}`)
  }
  lines.push('')

  if (result.summary.errors > 0) {
    lines.push(`  ${red('✗ Security')}`)
    for (const file of result.files) {
      for (const issue of file.issues) {
        if (issue.category !== 'security') continue
        lines.push(`    ${bold(issue.file)}:${issue.line}  ${issue.message}`)
        if (issue.suggestion) {
          lines.push(`      ${dim('→')} ${dim(issue.suggestion)}`)
        }
        if (issue.code) {
          lines.push(`      ${dim('Code:')} ${dim(issue.code)}`)
        }
        lines.push('')
      }
    }
  }

  if (result.summary.errors > 0 || result.summary.warnings > 0) {
    const hallucinationIssues = result.files
      .flatMap((f) => f.issues)
      .filter((i) => i.category === 'hallucination')

    if (hallucinationIssues.length > 0) {
      if (result.summary.errors > 0) {
        lines.push(`  ${red('✗ Hallucination')}`)
      } else {
        lines.push(`  ${yellow('⚠ Hallucination')}`)
      }
      for (const issue of hallucinationIssues) {
        lines.push(`    ${bold(issue.file)}:${issue.line}  ${issue.message}`)
        if (issue.suggestion) {
          lines.push(`      ${dim('→')} ${dim(issue.suggestion)}`)
        }
        lines.push('')
      }
    }
  }

  const styleIssues = result.files
    .flatMap((f) => f.issues)
    .filter((i) => i.category === 'style')
  if (styleIssues.length > 0) {
    lines.push(`  ${yellow('⚠ Style')}`)
    for (const issue of styleIssues) {
      lines.push(`    ${bold(issue.file)}:${issue.line}  ${issue.message}`)
      if (issue.suggestion) {
        lines.push(`      ${dim('→')} ${dim(issue.suggestion)}`)
      }
      lines.push('')
    }
  }

  if (result.passed) {
    lines.push(`  ${success('All checks passed')}`)
  } else {
    lines.push(
      `  ${red('Summary:')} ${result.summary.errors} error(s), ${result.summary.warnings} warning(s)${
        result.summary.errors > 0 ? `. Use --force to skip.` : ''
      }`,
    )
  }

  lines.push(`  ${dim(`Duration: ${result.duration}ms`)}`)
  lines.push('')

  return lines.join('\n')
}

export function formatJsonReport(result: VerificationResult): string {
  return JSON.stringify(result, null, 2)
}
