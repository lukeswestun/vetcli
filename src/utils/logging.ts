const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
}

function supportsColor(): boolean {
  return !!process.stdout.isTTY && !process.env.NO_COLOR
}

const useColor = supportsColor()

function c(code: string, text: string): string {
  if (!useColor) return text
  return `${code}${text}${colors.reset}`
}

export function green(text: string): string {
  return c(colors.green, text)
}

export function red(text: string): string {
  return c(colors.red, text)
}

export function yellow(text: string): string {
  return c(colors.yellow, text)
}

export function blue(text: string): string {
  return c(colors.blue, text)
}

export function bold(text: string): string {
  return c(colors.bold, text)
}

export function dim(text: string): string {
  return c(colors.dim, text)
}

export function success(text: string): string {
  return green(`✓ ${text}`)
}

export function error(text: string): string {
  return red(`✗ ${text}`)
}

export function warning(text: string): string {
  return yellow(`⚠ ${text}`)
}

export function info(text: string): string {
  return blue(`ℹ ${text}`)
}
