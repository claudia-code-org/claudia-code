// Zero-dependency terminal colors

const ESC = "\x1b[";

export const c = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  italic: `${ESC}3m`,

  pink: `${ESC}38;5;205m`,
  green: `${ESC}38;5;149m`,
  amber: `${ESC}38;5;220m`,
  blue: `${ESC}38;5;117m`,
  red: `${ESC}38;5;204m`,
  gray: `${ESC}38;5;243m`,
  white: `${ESC}38;5;255m`,
  muted: `${ESC}38;5;240m`,
};

export function pink(s: string) { return `${c.pink}${s}${c.reset}`; }
export function green(s: string) { return `${c.green}${s}${c.reset}`; }
export function amber(s: string) { return `${c.amber}${s}${c.reset}`; }
export function blue(s: string) { return `${c.blue}${s}${c.reset}`; }
export function red(s: string) { return `${c.red}${s}${c.reset}`; }
export function gray(s: string) { return `${c.gray}${s}${c.reset}`; }
export function muted(s: string) { return `${c.muted}${s}${c.reset}`; }
export function bold(s: string) { return `${c.bold}${s}${c.reset}`; }
export function dim(s: string) { return `${c.dim}${s}${c.reset}`; }

export function success(s: string) { return `${c.green}✓ ${s}${c.reset}`; }
export function warn(s: string) { return `${c.amber}⚠ ${s}${c.reset}`; }
export function fail(s: string) { return `${c.red}✗ ${s}${c.reset}`; }
export function info(s: string) { return `${c.blue}→ ${s}${c.reset}`; }

export function divider() {
  return muted("─".repeat(60));
}

export function header(title: string) {
  return `\n${divider()}\n${c.pink}${c.bold}  ${title}${c.reset}\n${divider()}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
