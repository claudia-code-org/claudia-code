import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { success, warn, fail, info, pink, green, amber, red, blue, gray, muted, bold, dim, header, divider } from "./format.js";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface BlameLine {
  author: string;
  date: string;
  lineNum: number;
  content: string;
}

function getBlame(cwd: string, file: string): BlameLine[] {
  try {
    const raw = execSync(
      `git blame --line-porcelain "${file}"`,
      { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], maxBuffer: 10 * 1024 * 1024 }
    );

    const lines: BlameLine[] = [];
    let currentAuthor = "";
    let currentDate = "";
    let lineNum = 0;

    for (const line of raw.split("\n")) {
      if (line.startsWith("author ")) {
        currentAuthor = line.slice(7);
      } else if (line.startsWith("author-time ")) {
        const ts = parseInt(line.slice(12));
        const d = new Date(ts * 1000);
        currentDate = d.toISOString().split("T")[0];
      } else if (line.startsWith("\t")) {
        lineNum++;
        lines.push({
          author: currentAuthor,
          date: currentDate,
          lineNum,
          content: line.slice(1),
        });
      }
    }

    return lines;
  } catch {
    return [];
  }
}

const COMMENTARY: Record<string, string[]> = {
  todo: [
    "Optimistic.",
    "That's not getting done.",
    "A promise to no one.",
    "Added with the best of intentions. Left with none.",
  ],
  hack: [
    "At least they labeled it.",
    "Self-awareness is the first step.",
    "Claudia appreciates the honesty.",
  ],
  fixme: [
    "Fix you? I'm not your therapist.",
    "Narrator: It was never fixed.",
  ],
  console: [
    "Ah yes, the poor person's debugger.",
    "Left in prod. Classic.",
  ],
  any: [
    "TypeScript with 'any' is just JavaScript with extra steps.",
    "Typed language. Types optional, apparently.",
  ],
  empty_catch: [
    "Swallowing errors like it's fine. It's not fine.",
    "Errors happened here. Nobody will ever know.",
  ],
};

function getCommentary(content: string): string | null {
  const trimmed = content.trim().toLowerCase();
  if (/\btodo\b/.test(trimmed)) return pick(COMMENTARY.todo);
  if (/\bhack\b/.test(trimmed)) return pick(COMMENTARY.hack);
  if (/\bfixme\b/.test(trimmed)) return pick(COMMENTARY.fixme);
  if (/console\.log/.test(trimmed)) return pick(COMMENTARY.console);
  if (/:\s*any\b/.test(trimmed)) return pick(COMMENTARY.any);
  if (/catch\s*\(\s*\w*\s*\)\s*\{\s*\}/.test(trimmed)) return pick(COMMENTARY.empty_catch);
  return null;
}

export function runBlame(cwd: string, file: string): string[] {
  const lines: string[] = [];

  lines.push(header(`CLAUDIA BLAME: ${file}`));
  lines.push("");

  const blame = getBlame(cwd, file);

  if (blame.length === 0) {
    lines.push(fail("Could not read git blame. Is this file tracked?"));
    lines.push(gray("  Or did someone rewrite history? Claudia notices these things."));
    return lines;
  }

  // Author stats
  const authorStats: Record<string, number> = {};
  for (const b of blame) {
    authorStats[b.author] = (authorStats[b.author] || 0) + 1;
  }
  const sorted = Object.entries(authorStats).sort((a, b) => b[1] - a[1]);

  lines.push(info("Authorship breakdown:"));
  lines.push("");
  for (const [author, count] of sorted) {
    const pct = ((count / blame.length) * 100).toFixed(0);
    const bar = "█".repeat(Math.max(1, Math.round(parseFloat(pct) / 4)));
    lines.push(gray(`  ${author.padEnd(24)} ${bar} ${pct}% (${count} lines)`));
  }
  lines.push("");

  // Find notable lines
  const notable = blame.filter((b) => getCommentary(b.content));
  if (notable.length > 0) {
    lines.push(info("Claudia's notes:"));
    lines.push("");
    for (const b of notable.slice(0, 15)) {
      const comment = getCommentary(b.content)!;
      lines.push(amber(`  L${String(b.lineNum).padStart(4)} ${dim(b.author)} ${dim(b.date)}`));
      lines.push(gray(`       ${b.content.trim().slice(0, 70)}`));
      lines.push(pink(`       ${comment}`));
      lines.push("");
    }
  }

  if (sorted.length === 1) {
    lines.push(gray("  Solo author. Every line is yours. The glory and the blame."));
  } else if (sorted.length >= 2) {
    const top = sorted[0];
    const pct = ((top[1] / blame.length) * 100).toFixed(0);
    if (parseFloat(pct) > 80) {
      lines.push(gray(`  ${top[0]} wrote ${pct}% of this file. The rest is garnish.`));
    }
  }

  lines.push("");
  lines.push(divider());
  lines.push(muted("  Receipts attached. You're welcome."));
  lines.push(divider());
  lines.push("");

  return lines;
}
