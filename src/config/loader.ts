import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defaultConfig, type VetConfig } from './defaults.js'

function mergeConfig(base: VetConfig, user: Partial<VetConfig>): VetConfig {
  return {
    checks: { ...base.checks, ...user.checks },
    severity: { ...base.severity, ...user.severity },
    files: {
      include: user.files?.include ?? base.files.include,
      exclude: user.files?.exclude ?? base.files.exclude,
    },
  }
}

export function loadConfig(cwd: string = process.cwd()): VetConfig {
  const configPath = join(cwd, '.vetcli', 'config.json')

  if (!existsSync(configPath)) {
    return { ...defaultConfig }
  }

  try {
    const raw = readFileSync(configPath, 'utf-8')
    const userConfig = JSON.parse(raw) as Partial<VetConfig>
    return mergeConfig(defaultConfig, userConfig)
  } catch {
    return { ...defaultConfig }
  }
}

export function configToString(config: VetConfig): string {
  return JSON.stringify(config, null, 2)
}
