#!/usr/bin/env node

import { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { verifyCommand } from './commands/verify.js'
import { initCommand } from './commands/init.js'
import { configCommand, configGetCommand, configSetCommand } from './commands/config.js'
import { checkCommand } from './commands/check.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function getVersion(): string {
  try {
    const pkgPath = join(__dirname, '..', '..', 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    return pkg.version || '0.1.0'
  } catch {
    return '0.1.0'
  }
}

const program = new Command()

program
  .name('vetcli')
  .description('AI Output Verification — pre-commit verification for AI-generated code')
  .version(getVersion())

program
  .command('verify', { isDefault: true })
  .description('Verify staged changes for AI-generated code issues')
  .argument('[files...]', 'Specific files to verify')
    .option('-f, --format <type>', 'Output format (text|json)', 'text')
  .option('--force', 'Exit with code 0 even if issues found')
  .option('-q, --quiet', 'Minimal output (issues only)')
  .action((files: string[] | undefined, options: { format?: 'text' | 'json'; force?: boolean; quiet?: boolean }) => {
    verifyCommand(files, options)
  })

program
  .command('init')
  .description('Set up pre-commit hook and configuration')
  .action(() => {
    initCommand()
  })

const configCmd = program
  .command('config')
  .description('View or modify configuration')

configCmd
  .command('get', { isDefault: true })
  .description('Get a config value')
  .argument('[key]', 'Config key (e.g., checks.hallucination)')
  .action((key?: string) => {
    if (key) {
      configGetCommand(key)
    } else {
      configCommand()
    }
  })

configCmd
  .command('set')
  .description('Set a config value')
  .argument('<key>', 'Config key (e.g., checks.hallucination)')
  .argument('<value>', 'Config value')
  .action((key: string, value: string) => {
    configSetCommand(key, value)
  })

program
  .command('check')
  .description('Verify a single file')
  .argument('<file>', 'File to verify')
  .option('-f, --format <type>', 'Output format (text|json)', 'text')
  .action((file: string, options: { format?: 'text' | 'json' }) => {
    checkCommand(file, options)
  })

program.parse(process.argv)
