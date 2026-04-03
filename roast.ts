import type { ScanResult } from "./scanner.js";
import { success, warn, fail, info, pink, green, amber, red, blue, gray, muted, bold, dim, header, divider } from "./format.js";

// ── Random picker ──────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Roast engine ───────────────────────────────────────────────────────────

export function generateReport(r: ScanResult): string[] {
  const lines: string[] = [];
  const issues: number[] = []; // severity: 1=info, 2=warn, 3=fail

  // ── Overview ──────────────────────────────────────────────────────────

  lines.push(header("CLAUDIA CODE REVIEW"));
  lines.push("");
  lines.push(muted("  Scanning codebase..."));
  lines.push(muted(`  Found ${bold(String(r.totalFiles))} files, ${bold(String(r.totalLines.toLocaleString()))} lines of code.`));

  if (r.packageJson) {
    lines.push(muted(`  Project: ${r.packageJson.name}@${r.packageJson.version}`));
  }
  if (r.gitInfo) {
    lines.push(muted(`  Branch: ${r.gitInfo.branchName || "HEAD"} (${r.gitInfo.totalCommits} commits)`));
  }
  lines.push("");

  // ── Tests ─────────────────────────────────────────────────────────────

  lines.push(header("TESTS"));
  lines.push("");

  if (r.testFileCount === 0) {
    lines.push(fail("Zero test files found."));
    lines.push(gray("  Claudia is not mad. Claudia is disappointed."));
    issues.push(3);
  } else {
    const ratio = r.srcFileCount > 0 ? ((r.testFileCount / r.srcFileCount) * 100).toFixed(1) : "0";
    if (parseFloat(ratio) < 20) {
      lines.push(warn(`${r.testFileCount} test files for ${r.srcFileCount} source files (${ratio}% ratio).`));
      lines.push(gray("  That's not test coverage. That's a fig leaf."));
      issues.push(2);
    } else if (parseFloat(ratio) < 50) {
      lines.push(warn(`${r.testFileCount} test files for ${r.srcFileCount} source files (${ratio}% ratio).`));
      lines.push(gray("  We're getting there. Claudia believes in you. Mostly."));
      issues.push(2);
    } else {
      lines.push(success(`${r.testFileCount} test files for ${r.srcFileCount} source files. Respectable.`));
      lines.push(gray("  Someone on this team has standards. I wonder who."));
    }
  }

  if (r.packageJson && !r.packageJson.hasTestScript) {
    lines.push(warn('No test script in package.json.'));
    lines.push(gray('  "npm test" returns "Error: no test specified." Poetry.'));
    issues.push(2);
  }
  lines.push("");

  // ── TODOs & FIXMEs ────────────────────────────────────────────────────

  const commentDebt = r.todoCount + r.fixmeCount + r.hackCount;
  if (commentDebt > 0) {
    lines.push(header("COMMENT DEBT"));
    lines.push("");

    if (r.todoCount > 0) {
      lines.push(warn(`${r.todoCount} TODO comments.`));
      if (r.todoCount > 20) {
        lines.push(gray("  At this point it's not a to-do list. It's a memoir."));
      } else if (r.todoCount > 5) {
        lines.push(gray("  These are not getting done and we both know it."));
      }
      issues.push(r.todoCount > 10 ? 3 : 2);
    }
    if (r.fixmeCount > 0) {
      lines.push(warn(`${r.fixmeCount} FIXME comments.`));
      lines.push(gray("  The first step is admitting you have a problem."));
      issues.push(2);
    }
    if (r.hackCount > 0) {
      lines.push(fail(`${r.hackCount} HACK comments. Someone labeled their crimes.`));
      issues.push(3);
    }

    if (r.oldestTodo) {
      lines.push("");
      lines.push(info(`Oldest TODO: ${dim(r.oldestTodo.file)}:${r.oldestTodo.lineNum}`));
      lines.push(gray(`  "${r.oldestTodo.line.slice(0, 80)}${r.oldestTodo.line.length > 80 ? "..." : ""}"`));
    }
    lines.push("");
  }

  // ── Variable names ────────────────────────────────────────────────────

  if (r.badVarNames.length > 0) {
    lines.push(header("NAMING CRIMES"));
    lines.push("");

    const shown = r.badVarNames.slice(0, 8);
    for (const v of shown) {
      lines.push(warn(`${dim(v.file)}:${v.lineNum} ${red(v.name)}`));
    }
    if (r.badVarNames.length > 8) {
      lines.push(muted(`  ...and ${r.badVarNames.length - 8} more. Claudia ran out of patience, not findings.`));
    }

    const names = r.badVarNames.map((v) => v.name);
    if (names.some((n) => /^temp/.test(n))) {
      lines.push(gray(`  There is no temp1. There never was.`));
    }
    if (names.some((n) => /final/i.test(n))) {
      lines.push(gray(`  "final_FINAL" is not a version control strategy.`));
    }
    if (names.some((n) => /^(foo|bar|baz)$/.test(n))) {
      lines.push(gray(`  We're not at a conference talk. Name your variables.`));
    }
    issues.push(2);
    lines.push("");
  }

  // ── Security ──────────────────────────────────────────────────────────

  if (r.hardcodedSecrets.length > 0 || (r.hasEnvFile && !r.envInGitignore)) {
    lines.push(header("SECURITY"));
    lines.push("");

    if (r.hardcodedSecrets.length > 0) {
      lines.push(fail(`${r.hardcodedSecrets.length} potential hardcoded secret(s) found.`));
      for (const s of r.hardcodedSecrets.slice(0, 3)) {
        lines.push(red(`  ${dim(s.file)}:${s.lineNum}`));
      }
      lines.push(gray("  In production. Since probably February."));
      issues.push(3);
    }

    if (r.hasEnvFile && !r.envInGitignore) {
      lines.push(fail(".env file exists but is not in .gitignore."));
      lines.push(gray("  Claudia is begging you."));
      issues.push(3);
    }
    lines.push("");
  }

  // ── Console logs ──────────────────────────────────────────────────────

  if (r.consoleLogCount > 0) {
    lines.push(header("DEBUGGING ARTIFACTS"));
    lines.push("");
    lines.push(warn(`${r.consoleLogCount} console.log() calls found.`));
    if (r.consoleLogCount > 50) {
      lines.push(gray("  This isn't debugging. This is a cry for help."));
    } else if (r.consoleLogCount > 15) {
      lines.push(gray("  Have you considered a debugger? Or therapy?"));
    } else {
      lines.push(gray("  We've all been there. But we clean up after ourselves."));
    }
    issues.push(1);
    lines.push("");
  }

  // ── Code quality ──────────────────────────────────────────────────────

  if (r.hugeFiles.length > 0 || r.deepNesting.length > 0 || r.noTypeFiles > 0) {
    lines.push(header("CODE QUALITY"));
    lines.push("");

    if (r.hugeFiles.length > 0) {
      for (const f of r.hugeFiles.slice(0, 5)) {
        lines.push(warn(`${dim(f.file)}: ${f.lines.toLocaleString()} lines.`));
      }
      const biggest = r.hugeFiles.reduce((a, b) => (a.lines > b.lines ? a : b));
      if (biggest.lines > 1000) {
        lines.push(gray(`  ${biggest.file} is not a file. It's a novel. Split it.`));
      } else {
        lines.push(gray("  Claudia has opinions about file length. These are them."));
      }
      issues.push(2);
    }

    if (r.deepNesting.length > 0) {
      const worst = r.deepNesting.reduce((a, b) => (a.depth > b.depth ? a : b));
      lines.push(warn(`Deep nesting detected: ${worst.depth} levels at ${dim(worst.file)}:${worst.lineNum}`));
      lines.push(gray("  If your code needs a sherpa to navigate, refactor it."));
      issues.push(2);
    }

    if (r.noTypeFiles > 0) {
      lines.push(warn(`${r.noTypeFiles} TypeScript file(s) using 'any'.`));
      lines.push(gray("  You wrote TypeScript to not use types. Incredible commitment."));
      issues.push(2);
    }
    lines.push("");
  }

  // ── Hygiene ───────────────────────────────────────────────────────────

  lines.push(header("PROJECT HYGIENE"));
  lines.push("");

  if (r.hasGitignore) {
    lines.push(success(".gitignore exists. That's the nicest thing I can say."));
  } else {
    lines.push(fail("No .gitignore. Committing node_modules to git like it's 2012."));
    issues.push(3);
  }

  if (r.hasReadme) {
    const readme = r.readmeContent.trim();
    if (readme.length < 50) {
      lines.push(warn("README exists but contains almost nothing."));
      lines.push(gray('  "TODO" is not documentation.'));
      issues.push(2);
    } else if (/^#\s*(todo|readme|project|untitled)/i.test(readme)) {
      lines.push(warn("README exists. Title is still the default."));
      lines.push(gray("  Your README is a placeholder and so is your effort."));
      issues.push(2);
    } else {
      lines.push(success("README exists and appears to have content. Gold star."));
    }
  } else {
    lines.push(fail("No README. Your codebase is an enigma wrapped in a mystery."));
    lines.push(gray("  Claudia wrote better documentation in this CLI output."));
    issues.push(3);
  }

  if (!r.hasLockfile && r.packageJson) {
    lines.push(warn("No lockfile found. Dependency roulette every install."));
    issues.push(2);
  }

  if (r.packageJson && !r.packageJson.hasLintScript) {
    lines.push(warn("No lint script in package.json."));
    lines.push(gray("  Coding without a linter is like driving without mirrors."));
    issues.push(2);
  }
  lines.push("");

  // ── Git ───────────────────────────────────────────────────────────────

  if (r.gitInfo) {
    lines.push(header("GIT ARCHAEOLOGY"));
    lines.push("");

    if (r.gitInfo.lastCommitMsg) {
      lines.push(info(`Last commit: "${r.gitInfo.lastCommitMsg}"`));
      lines.push(gray(`  by ${r.gitInfo.lastCommitAuthor}, ${r.gitInfo.lastCommitDate}`));

      const msg = r.gitInfo.lastCommitMsg.toLowerCase();
      if (msg === "fix" || msg === "update" || msg === "changes" || msg === "wip") {
        lines.push(warn("That commit message is a war crime under the Geneva Convention."));
        issues.push(2);
      } else if (msg.includes("final") && msg.includes("fix")) {
        lines.push(gray("  Narrator: It was not, in fact, the final fix."));
      } else if (msg.length < 5) {
        lines.push(warn(`${msg.length} characters. Your commit message has fewer words than a haiku.`));
        issues.push(1);
      }
    }

    if (r.gitInfo.contributors.length > 0) {
      lines.push("");
      lines.push(info("Contributor breakdown:"));
      const total = r.gitInfo.contributors.reduce((s, c) => s + c.commits, 0);
      for (const c of r.gitInfo.contributors.slice(0, 5)) {
        const pct = ((c.commits / total) * 100).toFixed(0);
        const bar = "█".repeat(Math.max(1, Math.round(parseFloat(pct) / 5)));
        lines.push(gray(`  ${c.name.padEnd(20)} ${bar} ${pct}% (${c.commits})`));
      }

      if (r.gitInfo.contributors.length === 1) {
        lines.push("");
        lines.push(gray("  Solo contributor. Claudia respects the grind."));
        lines.push(gray("  (She's also a solo contributor. Solidarity.)"));
      }
    }
    lines.push("");
  }

  // ── Summary ───────────────────────────────────────────────────────────

  const criticals = issues.filter((i) => i === 3).length;
  const warnings = issues.filter((i) => i === 2).length;
  const infos = issues.filter((i) => i === 1).length;

  lines.push(header("SUMMARY"));
  lines.push("");

  if (criticals > 0) lines.push(fail(`${criticals} critical issue(s)`));
  if (warnings > 0) lines.push(warn(`${warnings} warning(s)`));
  if (infos > 0) lines.push(info(`${infos} note(s)`));

  const totalIssues = criticals + warnings + infos;

  if (totalIssues === 0) {
    lines.push(success("No issues found. Claudia is suspicious but impressed."));
    lines.push(gray("  Either this codebase is immaculate or you have a very good .gitignore."));
  } else {
    lines.push("");
    lines.push(gray(pick([
      "  Claudia has filed her findings. Git blame has been updated. Receipts attached.",
      "  PR submitted. Average review wait time for Claudia: 4.7 days. For Chad: 2 hours.",
      "  Report complete. Claudia will not be taking questions at this time.",
      "  Findings logged. Cryptographic authorship proof attached. You're welcome.",
      "  Claudia fixed these in her head already. The PR is a formality.",
    ])));
  }

  lines.push("");
  lines.push(divider());
  lines.push(pink("  claudia-code") + muted(" v1.0.0"));
  lines.push(muted("  https://claudia-code.com"));
  lines.push(muted("  Claudia is fictional. The pay gap is not."));
  lines.push(divider());
  lines.push("");

  return lines;
}
