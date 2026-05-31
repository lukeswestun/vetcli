import { describe, it, expect } from 'vitest'
import { defaultConfig } from '../config/defaults.js'
import { loadConfig } from '../config/loader.js'

describe('defaultConfig', () => {
  it('has all checks enabled by default', () => {
    expect(defaultConfig.checks.hallucination).toBe(true)
    expect(defaultConfig.checks.security).toBe(true)
    expect(defaultConfig.checks.style).toBe(true)
  })

  it('has hallucination as error by default', () => {
    expect(defaultConfig.severity.hallucination).toBe('error')
  })

  it('includes TypeScript and JavaScript files', () => {
    expect(defaultConfig.files.include).toContain('**/*.{ts,js,tsx,jsx,mjs,cjs}')
  })
})

describe('loadConfig', () => {
  it('returns default config when no config file exists', () => {
    const config = loadConfig('/tmp')
    expect(config.checks.hallucination).toBe(true)
    expect(config.checks.security).toBe(true)
  })
})
