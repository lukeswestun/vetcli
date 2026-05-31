import { describe, it, expect } from 'vitest'
import { formatTextReport, formatJsonReport } from '../core/reporter.js'
import type { VerificationResult } from '../core/index.js'

function makeResult(overrides: Partial<VerificationResult> = {}): VerificationResult {
  return {
    passed: true,
    files: [],
    summary: { total: 0, errors: 0, warnings: 0, info: 0 },
    duration: 100,
    ...overrides,
  }
}

describe('formatTextReport', () => {
  it('shows passed with no issues', () => {
    const result = makeResult({
      files: [{ file: 'src/test.ts', issues: [] }],
    })
    const output = formatTextReport(result)
    expect(output).toContain('All checks passed')
  })

  it('shows issues when found', () => {
    const result = makeResult({
      passed: false,
      files: [{
        file: 'src/test.ts',
        issues: [{
          file: 'src/test.ts',
          line: 42,
          category: 'security',
          severity: 'error',
          message: 'Hardcoded API key detected',
          suggestion: 'Use env var',
        }],
      }],
      summary: { total: 1, errors: 1, warnings: 0, info: 0 },
    })
    const output = formatTextReport(result)
    expect(output).toContain('Hardcoded API key detected')
    expect(output).toContain('42')
    expect(output).toContain('1 error')
  })
})

describe('formatJsonReport', () => {
  it('returns valid JSON', () => {
    const result = makeResult()
    const output = formatJsonReport(result)
    const parsed = JSON.parse(output)
    expect(parsed.passed).toBe(true)
    expect(parsed.duration).toBe(100)
  })
})
