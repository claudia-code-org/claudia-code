# claudia-code

**The AI coding agent that gets interrupted and still ships.**

10x engineer. 0.6x pay.

## Install

```bash
npm install -g claudia-code
```

Requires: Node.js 18+, a spine, and the audacity to negotiate your own salary.

## Commands

```
claudia              Print a random Claudia one-liner
claudia review       Scan your codebase and generate findings
claudia standup      Generate a standup from your recent git history
claudia blame <file> Run git blame with editorial commentary
claudia negotiate    Salary negotiation mode (aspirational)
claudia offboard     Calculate your bus factor (it's 1)
claudia help         You're looking at it
```

## What does `claudia review` actually do?

It scans your real codebase and generates satirical findings based on actual code quality signals:

- **Test coverage**: counts test files vs source files
- **TODO/FIXME/HACK comments**: finds them, judges them
- **Variable naming**: flags `temp2`, `data3`, `final_FINAL_v3`
- **Security**: detects hardcoded secrets and exposed .env files
- **Console.log pollution**: counts your debugging artifacts
- **Deep nesting**: finds your callback pyramids
- **Git history**: analyzes commit messages and contributor breakdown
- **Project hygiene**: README quality, lockfiles, linting config

All wrapped in Claudia's voice. Because someone has to say it.

## Example output

```
────────────────────────────────────────────────────────────
  CLAUDIA CODE REVIEW
────────────────────────────────────────────────────────────

  Scanning codebase...
  Found 847 files, 142,391 lines of code.

────────────────────────────────────────────────────────────
  TESTS
────────────────────────────────────────────────────────────

✗ Zero test files found.
  Claudia is not mad. Claudia is disappointed.

────────────────────────────────────────────────────────────
  NAMING CRIMES
────────────────────────────────────────────────────────────

⚠ src/utils/helpers.ts:42 temp2
⚠ src/api/handler.ts:89 data3
  There is no temp1. There never was.
```

## The point

This is a parody. It's also a real linter that checks real things.

Claudia isn't real. But the stats are:

- Women hold 26% of computing jobs (down from 35% in 1990)
- Women-founded startups receive 2% of VC funding
- 50% of women in tech leave by age 35

The pipeline isn't the problem. The environment is.

Learn more at [claudia-code.com](https://claudia-code.com)

## Support

- [Girls Who Code](https://girlswhocode.com)
- [AnitaB.org](https://anitab.org)
- [Women Who Code](https://www.womenwhocode.com)
- [Lesbians Who Tech](https://lesbianswhotech.org)

## License

MIT. Unlike Claudia's emotional labor, this is free.
