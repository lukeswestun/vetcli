import { loadConfig } from '../../config/loader.js'
import { getStagedFiles } from '../../utils/git.js'
import { runChecks } from '../../core/orchestrator.js'
import { formatTextReport, formatJsonReport } from '../../core/reporter.js'

export interface VerifyOptions {
  format?: 'text' | 'json'
  force?: boolean
  quiet?: boolean
}

export function verifyCommand(files?: string[], options: VerifyOptions = {}) {
  const config = loadConfig()

  const { files: stagedFiles, error } = getStagedFiles()

  if (error && stagedFiles.length === 0) {
    console.error(`Error: ${error}`)
    process.exit(3)
  }

  const filesToCheck = files && files.length > 0
    ? stagedFiles.filter((f) => files.includes(f.file))
    : stagedFiles

  if (filesToCheck.length === 0) {
    console.log('No matching files to verify')
    process.exit(0)
  }

  const result = runChecks(filesToCheck, config)

  if (options.format === 'json') {
    console.log(formatJsonReport(result))
  } else {
    if (!options.quiet) {
      console.log(formatTextReport(result))
    } else {
      if (result.summary.total > 0) {
        for (const file of result.files) {
          for (const issue of file.issues) {
            console.log(`${issue.file}:${issue.line} [${issue.severity}] ${issue.message}`)
          }
        }
      }
    }
  }

  if (!result.passed && !options.force) {
    process.exit(1)
  }
}
