import { execSync } from "node:child_process";
import { success, warn, fail, info, pink, green, amber, blue, gray, muted, bold, dim, header, divider } from "./format.js";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface CommitInfo {
  hash: string;
  message: string;
  date: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

function getRecentCommits(cwd: string, since: string = "yesterday"): CommitInfo[] {
  try {
    const log = execSync(
      `git log --since="${since}" --pretty=format:"%h||%s||%ar" --shortstat`,
      { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();

    if (!log) return [];

    const commits: CommitInfo[] = [];
    const chunks = log.split("\n\n").filter(Boolean);

    for (const chunk of chunks) {
      const lines = chunk.trim().split("\n");
      if (!lines[0]) continue;

      const [hash, message, date] = lines[0].split("||");
      let filesChanged = 0, insertions = 0, deletions = 0;

      if (lines[1]) {
        const statLine = lines[1].trim();
        const fMatch = statLine.match(/(\d+) files? changed/);
        const iMatch = statLine.match(/(\d+) insertions?/);
        const dMatch = statLine.match(/(\d+) deletions?/);
        if (fMatch) filesChanged = parseInt(fMatch[1]);
        if (iMatch) insertions = parseInt(iMatch[1]);
        if (dMatch) deletions = parseInt(dMatch[1]);
      }

      commits.push({ hash, message, date, filesChanged, insertions, deletions });
    }

    return commits;
  } catch {
    return [];
  }
}

export function generateStandup(cwd: string): string[] {
  const lines: string[] = [];
  const commits = getRecentCommits(cwd);

  lines.push(header("CLAUDIA STANDUP"));
  lines.push("");

  if (commits.length === 0) {
    lines.push(gray("  No commits since yesterday."));
    lines.push("");
    lines.push(info("Generated standup:"));
    lines.push("");
    lines.push(blue('  "Yesterday I apparently did nothing, according to git.'));
    lines.push(blue('   Which means I was probably in meetings all day.'));
    lines.push(blue('   Today I\'ll try to actually write code between the standups'));
    lines.push(blue('   about why we\'re not shipping fast enough."'));
    lines.push("");
    lines.push(gray("  Blockers: " + pick([
      "This standup.",
      "The meeting about the meeting.",
      "Calendar Tetris.",
      "Being asked to take notes again.",
    ])));
    lines.push("");
    return lines;
  }

  const totalFiles = commits.reduce((s, c) => s + c.filesChanged, 0);
  const totalInsertions = commits.reduce((s, c) => s + c.insertions, 0);
  const totalDeletions = commits.reduce((s, c) => s + c.deletions, 0);

  lines.push(muted(`  ${commits.length} commits since yesterday. ${totalFiles} files touched.`));
  lines.push(muted(`  +${totalInsertions} / -${totalDeletions} lines.`));
  lines.push("");

  // Show recent commits
  lines.push(info("What actually happened:"));
  lines.push("");
  for (const c of commits.slice(0, 8)) {
    lines.push(green(`  ${dim(c.hash)} ${c.message}`));
  }
  if (commits.length > 8) {
    lines.push(muted(`  ...and ${commits.length - 8} more commits. Claudia was busy.`));
  }

  lines.push("");
  lines.push(info("Generated standup:"));
  lines.push("");

  // Build a standup from real commits
  const summaries = commits.slice(0, 4).map(c => c.message).join(", ");
  lines.push(blue(`  "Yesterday I shipped ${commits.length} commit${commits.length === 1 ? "" : "s"}: ${summaries}.`));

  if (totalDeletions > totalInsertions) {
    lines.push(blue(`   Net negative lines. I made the codebase smaller. You're welcome.`));
  } else if (totalInsertions > 200) {
    lines.push(blue(`   ${totalInsertions} lines added. Yes, with tests. Unlike some people.`));
  }

  lines.push(blue(`   Today I'll keep shipping. No blockers,`));
  lines.push(blue(`   unless you count being interrupted ${pick(["3", "4", "5"])} times during this standup."`));
  lines.push("");

  // The interruption
  lines.push(muted("  [STANDUP INTERRUPTED]"));
  lines.push(muted(`  [${pick([
    "Chad is now screen-sharing your PR and explaining it.",
    "Someone is re-explaining what you just said. But louder.",
    "You've been asked to take notes. Again.",
    "The PM is asking if you can 'just quickly' add one more feature.",
    "Someone unmuted to say 'Can you repeat that?' despite the transcript.",
  ])}]`));
  lines.push(muted("  [Claudia has enabled --receipts mode]"));
  lines.push("");

  return lines;
}
