import { describe, it, expect } from 'vitest'
import { checkSecurity } from '../checks/security.js'
import { defaultConfig } from '../config/defaults.js'

describe('checkSecurity', () => {
  it('detects hardcoded API keys', () => {
    const files = [{
      file: 'src/config.ts',
      content: `const API_KEY = 'sk-abc123def456ghi789jkl'`,
      addedLines: [
        { line: 1, content: `const API_KEY = 'sk-abc123def456ghi789jkl'` },
      ],
    }]

    const result = checkSecurity(files, defaultConfig)
    expect(result[0].issues.length).toBeGreaterThan(0)
    expect(result[0].issues[0].category).toBe('security')
  })

  it('detects eval() usage', () => {
    const files = [{
      file: 'src/runner.ts',
      content: `const result = eval(userInput)`,
      addedLines: [
        { line: 1, content: `const result = eval(userInput)` },
      ],
    }]

    const result = checkSecurity(files, defaultConfig)
    expect(result[0].issues.length).toBeGreaterThan(0)
  })

  it('detects hardcoded passwords', () => {
    const files = [{
      file: 'src/db.ts',
      content: `password: 'supersecret123'`,
      addedLines: [
        { line: 1, content: `password: 'supersecret123'` },
      ],
    }]

    const result = checkSecurity(files, defaultConfig)
    expect(result[0].issues.length).toBeGreaterThan(0)
  })

  it('detects exec() calls', () => {
    const files = [{
      file: 'src/shell.ts',
      content: `exec('rm -rf /')`,
      addedLines: [
        { line: 1, content: `exec('rm -rf /')` },
      ],
    }]

    const result = checkSecurity(files, defaultConfig)
    expect(result[0].issues.length).toBeGreaterThan(0)
  })

  it('detects SQL injection via string concatenation', () => {
    const files = [{
      file: 'src/query.ts',
      content: `'prefix ' + "SELECT * FROM users"`,
      addedLines: [
        { line: 1, content: `'prefix ' + "SELECT * FROM users"` },
      ],
    }]

    const result = checkSecurity(files, defaultConfig)
    expect(result[0].issues.length).toBeGreaterThan(0)
  })

  it('detects innerHTML assignments', () => {
    const files = [{
      file: 'src/ui.ts',
      content: `element.innerHTML = userInput`,
      addedLines: [
        { line: 1, content: `element.innerHTML = userInput` },
      ],
    }]

    const result = checkSecurity(files, defaultConfig)
    expect(result[0].issues.length).toBeGreaterThan(0)
  })

  it('returns empty when check is disabled', () => {
    const config = { ...defaultConfig, checks: { ...defaultConfig.checks, security: false } }
    const files = [{
      file: 'src/test.ts',
      content: `const key = 'sk-1234567890123456'`,
      addedLines: [
        { line: 1, content: `const key = 'sk-1234567890123456'` },
      ],
    }]

    const result = checkSecurity(files, config)
    expect(result[0].issues.length).toBe(0)
  })
})
