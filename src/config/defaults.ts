export interface VetConfig {
  checks: {
    hallucination: boolean
    security: boolean
    style: boolean
  }
  severity: {
    hallucination: 'error' | 'warning'
    security: 'error' | 'warning'
    style: 'warning' | 'info'
  }
  files: {
    include: string[]
    exclude: string[]
  }
}

export const defaultConfig: VetConfig = {
  checks: {
    hallucination: true,
    security: true,
    style: true,
  },
  severity: {
    hallucination: 'error',
    security: 'error',
    style: 'warning',
  },
  files: {
    include: ['**/*.{ts,js,tsx,jsx,mjs,cjs}'],
    exclude: [
      '**/*.test.*',
      '**/*.spec.*',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
    ],
  },
}
