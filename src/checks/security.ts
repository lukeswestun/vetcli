import type { Issue, VerifiedFile } from '../core/index.js'
import type { VetConfig } from '../config/defaults.js'

interface SecurityPattern {
  pattern: RegExp
  message: string
  suggestion: string
  severity: 'error' | 'warning' | 'info'
  label: string
}

const SECURITY_PATTERNS: SecurityPattern[] = [
  {
    pattern: /(['"`])(?:[A-Za-z0-9_]{16,64})(?:\1)\s*[;,\)]/,
    message: 'Possible hardcoded API key or token detected',
    suggestion: 'Use environment variable instead of literal string',
    severity: 'error',
    label: 'HARDCODED_SECRET',
  },
  {
    pattern: /\b(?:password|passwd|pwd)\s*[=:]\s*['"`][^'"`\s]{4,}['"`]/i,
    message: 'Hardcoded password detected',
    suggestion: 'Use environment variable or secret manager',
    severity: 'error',
    label: 'HARDCODED_PASSWORD',
  },
  {
    pattern: /\b(?:api[_-]?key|apikey)\s*[=:]\s*['"`][^'"`\s]{8,}['"`]/i,
    message: 'Hardcoded API key detected',
    suggestion: 'Use environment variable instead of literal string',
    severity: 'error',
    label: 'HARDCODED_API_KEY',
  },
  {
    pattern: /\bkey\s*=\s*['"`][^'"`\s]{8,}['"`]/i,
    message: 'Hardcoded API key detected',
    suggestion: 'Use environment variable instead of literal string',
    severity: 'error',
    label: 'HARDCODED_API_KEY',
  },
  {
    pattern: /\b(?:secret|token|auth)\s*[=:]\s*['"`][^'"`\s]{8,}['"`]/i,
    message: 'Possible secret or token hardcoded',
    suggestion: 'Use environment variable or secret manager',
    severity: 'warning',
    label: 'HARDCODED_SECRET',
  },
  {
    pattern: /\beval\s*\(/,
    message: 'eval() usage detected — potential code injection risk',
    suggestion: 'Avoid eval(). Use safer alternatives like Function() or JSON.parse()',
    severity: 'error',
    label: 'EVAL_USAGE',
  },
  {
    pattern: /\bnew\s+Function\s*\(/,
    message: 'new Function() detected — potential code injection risk',
    suggestion: 'Avoid dynamic code execution when possible',
    severity: 'warning',
    label: 'DYNAMIC_FUNCTION',
  },
  {
    pattern: /exec(?:Sync)?\s*\(/,
    message: 'Child process execution detected',
    suggestion: 'Validate all input if using user-provided data. Consider using execFile() for safer execution',
    severity: 'warning',
    label: 'EXEC_USAGE',
  },
  {
    pattern: /\binnerHTML\s*=/,
    message: 'innerHTML assignment detected — potential XSS risk',
    suggestion: 'Use textContent or safe DOM APIs instead',
    severity: 'warning',
    label: 'INNER_HTML',
  },
  {
    pattern: /\.escape\s*=\s*false/,
    message: 'SQL escaping disabled — potential injection risk',
    suggestion: 'Remove escape=false or use parameterized queries',
    severity: 'error',
    label: 'SQL_ESCAPE_OFF',
  },
  {
    pattern: /\bexec\s*\([^)]*`/,
    message: 'Shell command construction with template literal — potential injection risk',
    suggestion: 'Use execFile() or spawn() with arguments array instead of shell string',
    severity: 'warning',
    label: 'SHELL_INJECTION',
  },
  {
    pattern: /process\.env\.\w+\s*\|\|\s*['"`][^'"`\s]+['"`]/,
    message: 'Fallback to hardcoded value when env var is missing',
    suggestion: 'Fail explicitly or use a config system for defaults',
    severity: 'info',
    label: 'ENV_FALLBACK',
  },
  {
    pattern: /\.env\s*=\s*\{/,
    message: 'Object environment variable assignment detected (possible .env file leak)',
    suggestion: 'Ensure no secrets are exposed in client-side code',
    severity: 'warning',
    label: 'ENV_LEAK',
  },
  {
    pattern: /https?:\/\/[^\s"'`)]+(?:password|secret|token|key)[^\s"'`)]*/i,
    message: 'URL containing potential credential in query string',
    suggestion: 'Never pass credentials in URLs. Use headers or request body',
    severity: 'error',
    label: 'CREDENTIALS_IN_URL',
  },
  {
    pattern: /'(?:[^']*\\')*[^']*'\s*\+\s*['"`][^'"`]*\b(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b/i,
    message: 'Possible SQL injection via string concatenation',
    suggestion: 'Use parameterized queries or ORM methods',
    severity: 'error',
    label: 'SQL_INJECTION',
  },
  {
    pattern: /new\s+RegExp\s*\(\s*['"`][^'"`]*\$/,
    message: 'Dynamic regex construction with user input — potential ReDoS',
    suggestion: 'Sanitize user input for regex special characters',
    severity: 'info',
    label: 'DYNAMIC_REGEX',
  },
  {
    pattern: /process\.env\.(?:NODE_ENV|ENV)\s*=\s*['"`]production['"`]/i,
    message: 'Setting NODE_ENV in application code (should be set in environment)',
    suggestion: 'Set NODE_ENV=production in your deployment environment, not in code',
    severity: 'info',
    label: 'NODE_ENV_IN_CODE',
  },
  {
    pattern: /cookie\s*=\s*[^;]*secure\s*=\s*false/i,
    message: 'Secure flag disabled on cookie',
    suggestion: 'Set secure=true for cookies in production',
    severity: 'warning',
    label: 'COOKIE_SECURE_OFF',
  },
  {
    pattern: /['"`]sk-(?:live|test|prod)_[A-Za-z0-9]{10,}['"`]/,
    message: 'Secret key (e.g. Stripe/OpenAI) detected in code',
    suggestion: 'Use environment variable instead of hardcoding secret keys',
    severity: 'error',
    label: 'SECRET_KEY_IN_CODE',
  },
  {
    pattern: /\b(?:ssh|rsa|ecdsa|ed25519)\s*-----BEGIN/i,
    message: 'Possible private key detected in code',
    suggestion: 'Never commit private keys. Use environment variables or secret manager',
    severity: 'error',
    label: 'PRIVATE_KEY',
  },
]

export function checkSecurity(
  files: { file: string; content: string; addedLines: { line: number; content: string }[] }[],
  config: VetConfig,
): VerifiedFile[] {
  if (!config.checks.security) {
    return files.map((f) => ({ file: f.file, issues: [] }))
  }

  const results: VerifiedFile[] = []

  for (const file of files) {
    const issues: Issue[] = []
    const seen = new Set<string>()

    for (const addedLine of file.addedLines) {
      const line = addedLine.content

      for (const sp of SECURITY_PATTERNS) {
        const match = line.match(sp.pattern)
        if (match) {
          const key = `${sp.label}:${addedLine.line}`
          if (seen.has(key)) continue
          seen.add(key)

          issues.push({
            file: file.file,
            line: addedLine.line,
            category: 'security',
            severity: config.severity.security === 'error' ? sp.severity : 'warning',
            message: sp.message,
            suggestion: sp.suggestion,
            code: match[0].length > 60 ? match[0].slice(0, 57) + '...' : match[0],
          })
        }
      }
    }

    results.push({ file: file.file, issues })
  }

  return results
}
