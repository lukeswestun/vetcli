import { describe, it, expect } from 'vitest'
import { checkHallucination } from '../checks/hallucination.js'
import { defaultConfig } from '../config/defaults.js'

describe('checkHallucination', () => {
  it('detects known hallucinated packages', () => {
    const files = [{
      file: 'src/parser.ts',
      content: `import { parse } from 'super-fast-json'`,
      addedLines: [
        { line: 1, content: `import { parse } from 'super-fast-json'` },
      ],
    }]

    const result = checkHallucination(files, defaultConfig)
    expect(result[0].issues.length).toBeGreaterThan(0)
    expect(result[0].issues[0].category).toBe('hallucination')
  })

  it('detects suspicious package names', () => {
    const files = [{
      file: 'src/utils.ts',
      content: `import { something } from 'mega-utils-lib'`,
      addedLines: [
        { line: 1, content: `import { something } from 'mega-utils-lib'` },
      ],
    }]

    const result = checkHallucination(files, defaultConfig)
    expect(result[0].issues.length).toBeGreaterThan(0)
  })

  it('passes known npm packages', () => {
    const files = [{
      file: 'src/app.tsx',
      content: `import React from 'react'`,
      addedLines: [
        { line: 1, content: `import React from 'react'` },
      ],
    }]

    const result = checkHallucination(files, defaultConfig)
    expect(result[0].issues.length).toBe(0)
  })

  it('passes core Node.js modules', () => {
    const files = [{
      file: 'src/server.ts',
      content: `import fs from 'fs'`,
      addedLines: [
        { line: 1, content: `import fs from 'fs'` },
      ],
    }]

    const result = checkHallucination(files, defaultConfig)
    expect(result[0].issues.length).toBe(0)
  })

  it('passes relative imports', () => {
    const files = [{
      file: 'src/index.ts',
      content: `import { helper } from './utils/helper'`,
      addedLines: [
        { line: 1, content: `import { helper } from './utils/helper'` },
      ],
    }]

    const result = checkHallucination(files, defaultConfig)
    expect(result[0].issues.length).toBe(0)
  })

  it('returns empty when check is disabled', () => {
    const config = { ...defaultConfig, checks: { ...defaultConfig.checks, hallucination: false } }
    const files = [{
      file: 'src/test.ts',
      content: `import x from 'fake-pkg-12345'`,
      addedLines: [
        { line: 1, content: `import x from 'fake-pkg-12345'` },
      ],
    }]

    const result = checkHallucination(files, config)
    expect(result[0].issues.length).toBe(0)
  })
})
