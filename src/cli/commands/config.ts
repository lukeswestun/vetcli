import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defaultConfig, type VetConfig } from '../../config/defaults.js'
import { configToString } from '../../config/loader.js'

export function configGetCommand(key?: string) {
  const configPath = join(process.cwd(), '.vetcli', 'config.json')
  let config: VetConfig

  if (existsSync(configPath)) {
    config = JSON.parse(readFileSync(configPath, 'utf-8')) as VetConfig
  } else {
    config = { ...defaultConfig }
  }

  if (key) {
    const parts = key.split('.')
    let value: unknown = config as unknown as Record<string, unknown>
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part]
      } else {
        console.log(`Key '${key}' not found`)
        process.exit(1)
      }
    }
    console.log(JSON.stringify(value, null, 2))
    return
  }

  console.log(configToString(config))
}

export function configSetCommand(key: string, value: string) {
  const configPath = join(process.cwd(), '.vetcli', 'config.json')
  let config: VetConfig

  if (existsSync(configPath)) {
    config = JSON.parse(readFileSync(configPath, 'utf-8')) as VetConfig
  } else {
    config = { ...defaultConfig }
  }

  const parts = key.split('.')
  let current: Record<string, unknown> = config as unknown as Record<string, unknown>

  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) {
      current[parts[i]] = {}
    }
    current = current[parts[i]] as Record<string, unknown>
  }

  const lastKey = parts[parts.length - 1]

  let parsedValue: unknown = value
  if (value === 'true') parsedValue = true
  else if (value === 'false') parsedValue = false
  else if (/^\d+$/.test(value)) parsedValue = parseInt(value, 10)
  else if (value.startsWith('[') || value.startsWith('{')) {
    try {
      parsedValue = JSON.parse(value)
    } catch {
      // keep as string
    }
  }

  current[lastKey] = parsedValue
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  console.log(`Set ${key} = ${JSON.stringify(parsedValue)}`)
}

export function configCommand() {
  configGetCommand()
}
