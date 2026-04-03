import { readdir, readFile, stat, access } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join, extname, basename } from "node:path";
import { execSync } from "node:child_process";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ScanResult {
  totalFiles: number;
  totalLines: number;
  filesByExt: Record<string, number>;
  todoCount: number;
  fixmeCount: number;
  hackCount: number;
  oldestTodo: { file: string; line: string; lineNum: number } | null;
  testFileCount: number;
  srcFileCount: number;
  hasGitignore: boolean;
  hasReadme: boolean;
  readmeContent: string;
  hasEnvFile: boolean;
  envInGitignore: boolean;
  hasLockfile: boolean;
  hasTests: boolean;
  badVarNames: { file: string; name: string; lineNum: number }[];
  consoleLogCount: number;
  hardcodedSecrets: { file: string; lineNum: number; snippet: string }[];
  deepNesting: { file: string; lineNum: number; depth: number }[];
  hugeFiles: { file: string; lines: number }[];
  noTypeFiles: number;
  gitInfo: GitInfo | null;
  packageJson: PackageInfo | null;
}

export interface GitInfo {
  totalCommits: number;
  contributors: { name: string; commits: number }[];
  lastCommitMsg: string;
  lastCommitAuthor: string;
  lastCommitDate: string;
  branchName: string;
}

export interface PackageInfo {
  name: string;
  version: string;
  depCount: number;
  devDepCount: number;
  hasScripts: boolean;
  hasTestScript: boolean;
  hasLintScript: boolean;
}

// ── Ignore patterns ────────────────────────────────────────────────────────

const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", "out", ".cache",
  "coverage", ".turbo", ".vercel", ".svelte-kit", "__pycache__",
  "venv", ".venv", "vendor", "target", ".idea", ".vscode",
]);

const CODE_EXTS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".rs",
  ".java", ".kt", ".swift", ".c", ".cpp", ".h", ".cs",
  ".vue", ".svelte", ".php", ".sh", ".bash", ".zsh",
  ".css", ".scss", ".less", ".sql", ".graphql", ".prisma",
]);

const BAD_VAR_PATTERNS = [
  /\b(temp\d*)\b/,
  /\b(data\d+)\b/,
  /\b(foo|bar|baz)\b/,
  /\b(thing|stuff)\b/,
  /\b(x|xx|xxx)\b/,
  /\b(test\d+)\b/,
  /\b(final_?[Ff]inal|FINAL_FINAL)\b/,
  /\b(asdf|qwerty)\b/,
  /\b(myVar|myFunction|myClass)\b/,
  /\b(untitled|Untitled)\b/,
];

const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey)\s*[:=]\s*["'][A-Za-z0-9]{16,}/i,
  /(?:secret|password|passwd|pwd)\s*[:=]\s*["'][^"']{8,}/i,
  /(?:token)\s*[:=]\s*["'][A-Za-z0-9_\-.]{20,}/i,
  /sk[-_]live[-_][A-Za-z0-9]{20,}/,
  /ghp_[A-Za-z0-9]{36,}/,
  /AKIA[A-Z0-9]{16}/,
];

// ── Scanner ────────────────────────────────────────────────────────────────

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

async function collectFiles(dir: string, files: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".env") continue;
    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function isTestFile(path: string): boolean {
  const name = basename(path).toLowerCase();
  return (
    name.includes(".test.") ||
    name.includes(".spec.") ||
    name.includes("_test.") ||
    name.includes("_spec.") ||
    name.startsWith("test_") ||
    path.includes("__tests__") ||
    path.includes("/tests/") ||
    path.includes("/test/")
  );
}

function getGitInfo(cwd: string): GitInfo | null {
  try {
    const run = (cmd: string) =>
      execSync(cmd, { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();

    const totalCommits = parseInt(run("git rev-list --count HEAD"), 10) || 0;

    const shortlog = run("git shortlog -sn --no-merges HEAD");
    const contributors = shortlog
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const match = line.trim().match(/^(\d+)\s+(.+)$/);
        return match ? { name: match[2], commits: parseInt(match[1], 10) } : null;
      })
      .filter(Boolean) as { name: string; commits: number }[];

    const lastCommitMsg = run("git log -1 --pretty=%s");
    const lastCommitAuthor = run("git log -1 --pretty=%an");
    const lastCommitDate = run("git log -1 --pretty=%ar");
    const branchName = run("git branch --show-current");

    return { totalCommits, contributors, lastCommitMsg, lastCommitAuthor, lastCommitDate, branchName };
  } catch {
    return null;
  }
}

function getPackageInfo(cwd: string): PackageInfo | null {
  try {
    const raw = JSON.parse(readFileSync(join(cwd, "package.json"), "utf-8"));
    return {
      name: raw.name || "unnamed",
      version: raw.version || "0.0.0",
      depCount: Object.keys(raw.dependencies || {}).length,
      devDepCount: Object.keys(raw.devDependencies || {}).length,
      hasScripts: !!raw.scripts,
      hasTestScript: !!raw.scripts?.test && raw.scripts.test !== 'echo "Error: no test specified" && exit 1',
      hasLintScript: !!(raw.scripts?.lint || raw.scripts?.eslint),
    };
  } catch {
    return null;
  }
}

export async function scan(cwd: string): Promise<ScanResult> {
  const result: ScanResult = {
    totalFiles: 0,
    totalLines: 0,
    filesByExt: {},
    todoCount: 0,
    fixmeCount: 0,
    hackCount: 0,
    oldestTodo: null,
    testFileCount: 0,
    srcFileCount: 0,
    hasGitignore: false,
    hasReadme: false,
    readmeContent: "",
    hasEnvFile: false,
    envInGitignore: false,
    hasLockfile: false,
    hasTests: false,
    badVarNames: [],
    consoleLogCount: 0,
    hardcodedSecrets: [],
    deepNesting: [],
    hugeFiles: [],
    noTypeFiles: 0,
    gitInfo: null,
    packageJson: null,
  };

  // Top-level checks
  result.hasGitignore = await exists(join(cwd, ".gitignore"));
  result.hasEnvFile = await exists(join(cwd, ".env"));
  result.hasLockfile =
    (await exists(join(cwd, "package-lock.json"))) ||
    (await exists(join(cwd, "yarn.lock"))) ||
    (await exists(join(cwd, "pnpm-lock.yaml"))) ||
    (await exists(join(cwd, "bun.lockb")));

  // Check .gitignore for .env
  if (result.hasGitignore) {
    try {
      const gi = await readFile(join(cwd, ".gitignore"), "utf-8");
      result.envInGitignore = gi.includes(".env");
    } catch { /* */ }
  }

  // README
  for (const name of ["README.md", "readme.md", "README", "README.txt", "Readme.md"]) {
    if (await exists(join(cwd, name))) {
      result.hasReadme = true;
      try {
        result.readmeContent = await readFile(join(cwd, name), "utf-8");
      } catch { /* */ }
      break;
    }
  }

  // Git and package info
  result.gitInfo = getGitInfo(cwd);
  result.packageJson = getPackageInfo(cwd);

  // Collect all files
  const allFiles = await collectFiles(cwd);
  result.totalFiles = allFiles.length;

  // Process each file
  for (const filePath of allFiles) {
    const ext = extname(filePath).toLowerCase();
    const relPath = filePath.replace(cwd + "/", "");

    // Count by extension
    if (ext) {
      result.filesByExt[ext] = (result.filesByExt[ext] || 0) + 1;
    }

    // Only deep-scan code files
    if (!CODE_EXTS.has(ext)) continue;

    if (isTestFile(filePath)) {
      result.testFileCount++;
    } else {
      result.srcFileCount++;
    }

    let content: string;
    try {
      const s = await stat(filePath);
      if (s.size > 500_000) continue; // skip huge files
      content = await readFile(filePath, "utf-8");
    } catch {
      continue;
    }

    const lines = content.split("\n");
    result.totalLines += lines.length;

    // Huge file check
    if (lines.length > 500) {
      result.hugeFiles.push({ file: relPath, lines: lines.length });
    }

    // TypeScript any check
    if (ext === ".ts" || ext === ".tsx") {
      const anyCount = (content.match(/:\s*any\b/g) || []).length;
      if (anyCount > 0) result.noTypeFiles++;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // TODOs
      if (/\bTODO\b/i.test(line)) {
        result.todoCount++;
        if (!result.oldestTodo) {
          result.oldestTodo = { file: relPath, line: line.trim(), lineNum: i + 1 };
        }
      }
      if (/\bFIXME\b/i.test(line)) result.fixmeCount++;
      if (/\bHACK\b/i.test(line)) result.hackCount++;

      // console.log
      if (/console\.log\(/.test(line) && !/\/\//.test(line.split("console.log")[0])) {
        result.consoleLogCount++;
      }

      // Bad variable names (only check assignments/declarations)
      if (/(?:let|const|var|def|val)\s/.test(line)) {
        for (const pattern of BAD_VAR_PATTERNS) {
          const match = line.match(pattern);
          if (match && result.badVarNames.length < 20) {
            result.badVarNames.push({ file: relPath, name: match[1], lineNum: i + 1 });
          }
        }
      }

      // Secrets
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(line) && result.hardcodedSecrets.length < 10) {
          result.hardcodedSecrets.push({
            file: relPath,
            lineNum: i + 1,
            snippet: line.trim().slice(0, 60) + (line.trim().length > 60 ? "..." : ""),
          });
        }
      }

      // Deep nesting (count leading spaces/tabs)
      const indent = line.match(/^(\s*)/)?.[1]?.length || 0;
      const depth = Math.floor(indent / 2);
      if (depth >= 6 && line.trim().length > 0 && result.deepNesting.length < 10) {
        result.deepNesting.push({ file: relPath, lineNum: i + 1, depth });
      }
    }
  }

  result.hasTests = result.testFileCount > 0;
  return result;
}
