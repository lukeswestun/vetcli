# Vet — AI Output Verification

**Verify AI-generated code before it hits your repo.**

Vet is a CLI tool that tests AI-generated code for correctness, security, and style before committing. Runs locally in milliseconds. Privacy-first — zero network calls.

```
npx vet init    # Set up pre-commit hook
git add .       # Stage your changes
git commit      # Vet runs automatically
```

## Features

- **Hallucination Detection** — catches fake npm packages, imaginary APIs, made-up imports
- **Security Scanning** — detects hardcoded secrets, eval(), SQL injection, shell injection
- **Style Consistency** — checks naming conventions against your project's patterns
- **Pre-Commit Hook** — automatic verification on every `git commit`
- **Zero Config** — works out of the box, no setup needed

## Quick Start

```bash
# Install globally
npm install -g vet

# Or run without installing
npx vet init

# Verify staged changes
vet

# Check a specific file
vet check src/parser.ts

# View configuration
vet config
```

## How It Works

1. Install Vet in your project
2. Code with your AI tool (Cursor, Copilot, Claude Code)
3. `git add . && git commit`
4. Vet checks every changed file for AI failure modes
5. Fix issues before they land in your repo

## Example Output

```
❯ vet

  ❯ Vet — AI Output Verification

  Files checked: 3
  Issues found: 2

  ✗ Security
    src/api/auth.ts:42  Hardcoded API key detected
      → Use environment variable instead of literal string
      Fix: process.env.API_KEY

  ✗ Hallucination
    src/utils/parser.ts:12  Package 'super-fast-json' not found on npm
      → AI may have hallucinated this package
      Fix: replace with 'fast-json-stable-stringify'

  Summary: 2 issues. Commit with --force to skip.
```

## Configuration

Create `.vet/config.json` in your project root:

```json
{
  "checks": {
    "hallucination": true,
    "security": true,
    "style": true
  },
  "severity": {
    "hallucination": "error",
    "security": "error",
    "style": "warning"
  },
  "files": {
    "include": ["src/**/*.ts", "src/**/*.js"],
    "exclude": ["**/*.test.ts", "**/*.spec.ts"]
  }
}
```

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | CLI, local verification, community support |
| Pro | $15/mo | CI integration, SARIF output, advanced rules, email support |
| Team | $12/user/mo | Shared rules, audit log, centralized policy |

## License

MIT — core is open source. Pro and Team features are commercial.

## Links

- GitHub: [github.com/vet-cli/vet](https://github.com/vet-cli/vet)
- npm: [npmjs.com/package/vet](https://npmjs.com/package/vet)
- Website: [vet.dev](https://vet.dev)
