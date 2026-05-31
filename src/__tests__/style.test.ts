import { describe, it, expect } from 'vitest'
import { checkStyle } from '../checks/style.js'
import { defaultConfig } from '../config/defaults.js'

describe('checkStyle', () => {
  it('detects class not using PascalCase', () => {
    const files = [{
      file: 'src/component.ts',
      content: `class myComponent {}`,
      addedLines: [
        { line: 1, content: `class myComponent {}` },
      ],
    }]

    const result = checkStyle(files, defaultConfig)
    const classIssue = result[0].issues.find(i => i.message.includes('Class'))
    expect(classIssue).toBeDefined()
    expect(classIssue?.category).toBe('style')
  })

  it('passes PascalCase classes', () => {
    const files = [{
      file: 'src/component.ts',
      content: `class MyComponent {}`,
      addedLines: [
        { line: 1, content: `class MyComponent {}` },
      ],
    }]

    const result = checkStyle(files, defaultConfig)
    expect(result[0].issues.length).toBe(0)
  })

  it('returns empty when check is disabled', () => {
    const config = { ...defaultConfig, checks: { ...defaultConfig.checks, style: false } }
    const files = [{
      file: 'src/test.ts',
      content: `class bad_class {}`,
      addedLines: [
        { line: 1, content: `class bad_class {}` },
      ],
    }]

    const result = checkStyle(files, config)
    expect(result[0].issues.length).toBe(0)
  })
})
