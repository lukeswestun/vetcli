import { describe, it, expect } from 'vitest'
import { runChecks } from '../core/orchestrator.js'
import { defaultConfig } from '../config/defaults.js'

describe('runChecks', () => {
  it('returns pass for clean code', () => {
    const files = [{
      file: 'src/clean.ts',
      content: `import React from 'react'\nconst x = 1`,
      addedLines: [
        { line: 1, content: `import React from 'react'` },
        { line: 2, content: `const x = 1` },
      ],
    }]

    const result = runChecks(files, defaultConfig)
    expect(result.passed).toBe(true)
    expect(result.duration).toBeGreaterThanOrEqual(0)
  })

  it('returns fail for hallucinated package', () => {
    const files = [{
      file: 'src/buggy.ts',
      content: `import { parse } from 'super-fast-json'`,
      addedLines: [
        { line: 1, content: `import { parse } from 'super-fast-json'` },
      ],
    }]

    const result = runChecks(files, defaultConfig)
    expect(result.passed).toBe(false)
  })

  it('returns fail for security issue', () => {
    const files = [{
      file: 'src/insecure.ts',
      content: `const key = 'abcdefghijklmnopqrstuvwx';`,
      addedLines: [
        { line: 1, content: `const key = 'abcdefghijklmnopqrstuvwx';` },
      ],
    }]

    const result = runChecks(files, defaultConfig)
    expect(result.passed).toBe(false)
  })

  it('merges issues from multiple files', () => {
    const files = [
      {
        file: 'src/a.ts',
        content: `import { parse } from 'super-fast-json'`,
        addedLines: [
          { line: 1, content: `import { parse } from 'super-fast-json'` },
        ],
      },
      {
        file: 'src/b.ts',
        content: `const key = 'abcdefghijklmnopqrstuvwx';`,
        addedLines: [
          { line: 1, content: `const key = 'abcdefghijklmnopqrstuvwx';` },
        ],
      },
    ]

    const result = runChecks(files, defaultConfig)
    expect(result.files.length).toBe(2)
    expect(result.summary.total).toBeGreaterThanOrEqual(2)
  })

  it('reports correct summary counts', () => {
    const files = [{
      file: 'src/test.ts',
      content: `import { parse } from 'super-fast-json'\neval(something)`,
      addedLines: [
        { line: 1, content: `import { parse } from 'super-fast-json'` },
        { line: 2, content: `eval(something)` },
      ],
    }]

    const result = runChecks(files, defaultConfig)
    expect(result.summary.total).toBeGreaterThanOrEqual(2)
    expect(result.summary.errors).toBeGreaterThanOrEqual(2)
    expect(result.passed).toBe(false)
  })
})
