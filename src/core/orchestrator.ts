import type { VetConfig } from '../config/defaults.js'
import type { GitFileDiff } from '../utils/git.js'
import { checkHallucination } from '../checks/hallucination.js'
import { checkSecurity } from '../checks/security.js'
import { checkStyle } from '../checks/style.js'
import { createResult, type VerificationResult, type VerifiedFile } from './index.js'

function mergeVerifiedFiles(results: VerifiedFile[][]): VerifiedFile[] {
  const fileMap = new Map<string, VerifiedFile>()

  for (const result of results) {
    for (const file of result) {
      const existing = fileMap.get(file.file)
      if (existing) {
        existing.issues.push(...file.issues)
      } else {
        fileMap.set(file.file, { file: file.file, issues: [...file.issues] })
      }
    }
  }

  return Array.from(fileMap.values())
}

export function runChecks(
  files: GitFileDiff[],
  config: VetConfig,
): VerificationResult {
  const start = performance.now()

  const hallucinationResults = checkHallucination(files, config)
  const securityResults = checkSecurity(files, config)
  const styleResults = checkStyle(files, config)

  const merged = mergeVerifiedFiles([
    hallucinationResults,
    securityResults,
    styleResults,
  ])

  const duration = Math.round(performance.now() - start)
  return createResult(merged, duration)
}
