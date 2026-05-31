export interface Issue {
  file: string
  line: number
  column?: number
  category: 'hallucination' | 'security' | 'style'
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestion: string
  code?: string
}

export interface VerifiedFile {
  file: string
  issues: Issue[]
}

export interface VerificationResult {
  passed: boolean
  files: VerifiedFile[]
  summary: {
    total: number
    errors: number
    warnings: number
    info: number
  }
  duration: number
}

export function createResult(files: VerifiedFile[], duration: number): VerificationResult {
  let errors = 0
  let warnings = 0
  let info = 0

  for (const f of files) {
    for (const issue of f.issues) {
      if (issue.severity === 'error') errors++
      else if (issue.severity === 'warning') warnings++
      else info++
    }
  }

  const total = errors + warnings + info

  return {
    passed: errors === 0,
    files,
    summary: { total, errors, warnings, info },
    duration,
  }
}
