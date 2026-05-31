import type { Issue, VerifiedFile } from '../core/index.js'
import type { VetConfig } from '../config/defaults.js'

const KNOWN_NPM_PACKAGES = new Set([
  'react', 'react-dom', 'next', 'express', 'lodash', 'axios', 'chalk',
  'commander', 'typescript', 'eslint', 'prettier', 'jest', 'vitest',
  'webpack', 'vite', 'babel', 'postcss', 'tailwindcss', 'date-fns',
  'moment', 'uuid', 'bcrypt', 'jsonwebtoken', 'passport', 'mongoose',
  'prisma', 'typeorm', 'graphql', 'apollo', 'socket.io', 'ws',
  'fastify', 'hono', 'elysia', 'trpc', 'zod', 'yup', 'joi',
  'redux', 'zustand', 'jotai', 'recoil', 'react-router', 'tanstack',
  'framer-motion', 'styled-components', 'emotion', 'sass', 'less',
  'sharp', 'multer', 'cors', 'helmet', 'compression', 'body-parser',
  'dotenv', 'cross-env', 'nodemon', 'ts-node', 'tsx', 'tslib',
  'esbuild', 'rollup', 'parcel', 'turbo', 'nx', 'lerna',
  'prettier-plugin-tailwindcss', 'autoprefixer',
  '@types/react', '@types/node', '@types/express',
  'firebase', 'aws-sdk', '@aws-sdk/client-s3',
  'redis', 'ioredis', 'bull', 'bullmq', 'amqplib',
  'stripe', '@stripe/stripe-js', 'paypal',
  'swiper', 'gsap', 'three', 'd3',
  'cheerio', 'puppeteer', 'playwright', 'cypress',
  'dayjs', 'luxon', 'chrono-node',
  'immer', 'remeda', 'ramda', 'fp-ts',
  'clsx', 'classnames', 'twmerge', 'cva',
  'es-toolkit', 'std',
])

const SUSPICIOUS_IMPORT_PATTERNS = [
  /from\s+['"](?:\.\.\/)+node_modules\//,
  /require\(['"](?:\.\.\/)+node_modules\//,
]

const KNOWN_AI_HALLUCINATED_PACKAGES = [
  'super-fast-json',
  'ultra-parse',
  'quick-math-js',
  'easy-utils',
  'magic-fns',
  'simple-db-connector',
  'fast-crypto-lib',
  'lightweight-framework',
  'super-validator',
  'mega-utils',
  'hyper-sort',
  'turbo-cache',
]

interface ImportMatch {
  line: number
  packageName: string
  type: 'require' | 'import'
}

function extractImports(content: string, file: string): ImportMatch[] {
  const matches: ImportMatch[] = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    const esmMatch = line.match(
      /^import\s+(?:\{[^}]*\}\s+from\s+)?['"]([^'"]+)['"]/,
    )
    if (esmMatch) {
      matches.push({
        line: lineNum,
        packageName: esmMatch[1],
        type: 'import',
      })
    }

    const requireMatch = line.match(
      /(?:const|let|var)\s+\w+\s*=\s*require\(['"]([^'"]+)['"]\)/,
    )
    if (requireMatch) {
      matches.push({
        line: lineNum,
        packageName: requireMatch[1],
        type: 'require',
      })
    }
  }

  return matches
}

function isScopedPackage(name: string): boolean {
  return name.startsWith('@')
}

function getBasePackageName(name: string): string {
  if (isScopedPackage(name)) {
    const parts = name.split('/')
    return parts.slice(0, 2).join('/')
  }
  return name.split('/')[0]
}

function isKnownCoreModule(name: string): boolean {
  const coreModules = [
    'fs', 'path', 'os', 'http', 'https', 'url', 'util', 'events',
    'stream', 'buffer', 'crypto', 'assert', 'child_process', 'cluster',
    'dns', 'dgram', 'net', 'tls', 'querystring', 'readline', 'repl',
    'module', 'perf_hooks', 'process',
  ]
  return coreModules.includes(name)
}

function isRelativeImport(name: string): boolean {
  return name.startsWith('.') || name.startsWith('/')
}

function isSuspiciousPackageName(name: string): boolean {
  const lower = name.toLowerCase()

  const suspiciousPatterns = [
    /\b(?:super|ultra|mega|hyper|turbo|quick|easy|fast|simple|magic|lightweight)/,
    /\b(?:utils?|helpers?|fns?|lib)\b/,
  ]

  return suspiciousPatterns.some((p) => p.test(lower))
}

export function checkHallucination(
  files: { file: string; content: string; addedLines: { line: number; content: string }[] }[],
  config: VetConfig,
): VerifiedFile[] {
  if (!config.checks.hallucination) {
    return files.map((f) => ({ file: f.file, issues: [] }))
  }

  const results: VerifiedFile[] = []

  for (const file of files) {
    const issues: Issue[] = []
    const addedContent = file.addedLines.map((l) => l.content).join('\n')
    const imports = extractImports(addedContent, file.file)

    for (const imp of imports) {
      const packageName = getBasePackageName(imp.packageName)

      if (isRelativeImport(imp.packageName)) continue
      if (isKnownCoreModule(packageName)) continue

      if (KNOWN_AI_HALLUCINATED_PACKAGES.includes(packageName)) {
        issues.push({
          file: file.file,
          line: imp.line,
          category: 'hallucination',
          severity: 'error',
          message: `Package '${packageName}' is known to be AI-hallucinated`,
          suggestion: `This package doesn't exist on npm. Remove the import or replace with a real package.`,
        })
        continue
      }

      if (!KNOWN_NPM_PACKAGES.has(packageName) && !isScopedPackage(packageName)) {
        issues.push({
          file: file.file,
          line: imp.line,
          category: 'hallucination',
          severity: isSuspiciousPackageName(packageName) ? 'error' : 'warning',
          message: `Package '${packageName}' not found in known npm packages`,
          suggestion: `AI may have hallucinated this package. Verify it exists on npm before using.`,
        })
      }
    }

    for (const addedLine of file.addedLines) {
      const line = addedLine.content
      for (const pattern of SUSPICIOUS_IMPORT_PATTERNS) {
        const match = line.match(pattern)
        if (match) {
          issues.push({
            file: file.file,
            line: addedLine.line,
            category: 'hallucination',
            severity: 'warning',
            message: `Suspicious import path pattern detected: ${match[0].trim()}`,
            suggestion: `Importing from node_modules with relative paths is unusual. Use package name instead.`,
          })
        }
      }
    }

    results.push({ file: file.file, issues })
  }

  return results
}
