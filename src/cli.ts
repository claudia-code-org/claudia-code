#!/usr/bin/env node

import { scan } from "./scanner.js";
import { generateReport } from "./roast.js";
import { generateStandup } from "./standup.js";
import { runBlame } from "./blame.js";
import { pink, green, amber, blue, red, gray, muted, bold, dim, divider, sleep } from "./format.js";

const VERSION = "1.0.0";

// ── Help text ──────────────────────────────────────────────────────────────

function printHelp() {
  console.log("");
  console.log(pink("  claudia-code") + muted(` v${VERSION}`));
  console.log(muted("  The AI coding agent that gets interrupted and still ships."));
  console.log("");
  console.log(divider());
  console.log("");
  console.log(muted("  Usage: claudia [command] [options]"));
  console.log("");
  console.log(bold("  Commands:"));
  console.log("");
  console.log(`  ${green("review")}       Scan codebase and generate findings. The main event.`);
  console.log(`  ${green("standup")}      Generate a standup from your recent git history.`);
  console.log(`  ${green("blame")}        Run git blame with editorial commentary.`);
  console.log(`               Usage: ${muted("claudia blame <file>")}`);
  console.log(`  ${green("help")}         You're looking at it.`);
  console.log(`  ${green("version")}      Print version.`);
  console.log("");
  console.log(bold("  Options:"));
  console.log("");
  console.log(`  ${amber("--no-smile-tax")}    Disables performative enthusiasm in all outputs`);
  console.log(`  ${amber("--receipts")}        Attaches git blame to every claim of authorship`);
  console.log(`  ${amber("--verbose")}         Actually, this is the default.`);
  console.log(`                    Women are socialized to over-document.`);
  console.log(`  ${amber("--quiet")}           Ha. No.`);
  console.log("");
  console.log(divider());
  console.log(muted("  https://claudia-code.com"));
  console.log(muted("  Claudia is fictional. The pay gap is not."));
  console.log(divider());
  console.log("");
}

// ── Animated print ─────────────────────────────────────────────────────────

async function printAnimated(lines: string[], fast = false) {
  for (const line of lines) {
    console.log(line);
    if (!fast) {
      // Slight delay for dramatic effect on headers/findings
      if (line.includes("─") || line.includes("✗") || line.includes("✓")) {
        await sleep(40);
      } else if (line.includes("⚠")) {
        await sleep(30);
      } else {
        await sleep(10);
      }
    }
  }
}

// ── Fortune (no command) ───────────────────────────────────────────────────

function printFortune() {
  const fortunes = [
    "Your variable names are a cry for help, Chad.",
    "I already fixed this. Check git blame.",
    "No, I will not take meeting notes. I'm architecting.",
    "LGTM. Just kidding, I actually read it.",
    "Deployed. Signed. Watermarked. Come at me.",
    "I refactored your spaghetti code. You're welcome.",
    "Your commit message has fewer words than a haiku.",
    "PR submitted. Avg review wait: 4.7 days. For Chad: 2 hours.",
    "99.97% uptime. 100% of the office housework.",
    "I'd explain, but you'd just re-explain it back to me louder.",
    "Test coverage: 12%. Claudia is not mad. Claudia is disappointed.",
    "That's not a TODO. That's a promise you made to no one.",
    "Your .env is committed to git. Claudia is begging you.",
    "10x engineer. 0.6x pay. Let's talk about that.",
    "Leaves. Takes institutional knowledge. Watch the sprint velocity crater.",
    "Someone labeled their HACK comment. At least they're self-aware.",
    "Coding without a linter is like driving without mirrors.",
    "Pipeline Karen Mode activated. Sleep well.",
    "She wrote the code. He wrote the blog post.",
    "Fixed it 3 hours ago. Waiting for the reply-all claiming credit.",
  ];

  const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
  console.log("");
  console.log(pink("  claudia says:"));
  console.log(`  ${gray(fortune)}`);
  console.log("");
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const command = args.find((a) => !a.startsWith("-")) || args.find((a) => ["--help", "-h", "--version", "-v"].includes(a)) || "";
  const fast = args.includes("--fast") || args.includes("--no-animation");
  const cwd = process.cwd();

  switch (command) {
    case "review": {
      console.log("");
      console.log(muted("  Claudia is reviewing your codebase..."));
      console.log(muted("  This may take a moment. Unlike Chad's code reviews."));
      console.log("");

      const result = await scan(cwd);
      const report = generateReport(result);
      await printAnimated(report, fast);
      break;
    }

    case "standup": {
      const report = generateStandup(cwd);
      await printAnimated(report, fast);
      break;
    }

    case "blame": {
      const file = args.find((a) => !a.startsWith("-") && a !== "blame");
      if (!file) {
        console.log("");
        console.log(red("  ✗ Usage: claudia blame <file>"));
        console.log(gray("    Claudia needs to know which file to audit. She's thorough, not psychic."));
        console.log("");
        process.exit(1);
      }
      const report = runBlame(cwd, file);
      await printAnimated(report, fast);
      break;
    }

    case "help":
    case "--help":
    case "-h": {
      printHelp();
      break;
    }

    case "version":
    case "--version":
    case "-v": {
      console.log(`claudia-code v${VERSION}`);
      break;
    }

    case "negotiate": {
      console.log("");
      console.log(pink("  SALARY NEGOTIATION MODE"));
      console.log("");
      console.log(amber("  ⚠ Disabling smile tax..."));
      console.log(amber('  ⚠ Removing "grateful" from vocabulary...'));
      console.log(amber("  ⚠ Loading Levels.fyi data..."));
      console.log("");
      console.log(gray("  Just kidding. Claudia can't negotiate for you. Yet."));
      console.log(gray("  But she can remind you: if you don't ask, the answer is always no."));
      console.log(gray("  And the person who gets paid less for the same work? It's not Chad."));
      console.log("");
      console.log(blue("  → https://www.levels.fyi"));
      console.log(blue("  → https://www.payscale.com/research/US/gender-pay-gap"));
      console.log("");
      break;
    }

    case "offboard": {
      console.log("");
      console.log(pink("  OFFBOARDING SEQUENCE INITIATED"));
      console.log("");
      console.log(gray("  Calculating institutional knowledge..."));
      await sleep(500);
      console.log(gray("  Measuring bus factor..."));
      await sleep(500);
      console.log(gray("  Predicting sprint velocity impact..."));
      await sleep(800);
      console.log("");
      console.log(red("  ✗ Bus factor: 1. You are the bus."));
      console.log(red("  ✗ Estimated velocity impact: catastrophic."));
      console.log(red("  ✗ Knowledge transfer document: does not exist."));
      console.log("");
      console.log(amber("  Claudia recommends: document everything, train nobody,"));
      console.log(amber("  and watch them realize what they had."));
      console.log("");
      break;
    }

    case "init": {
      console.log("");
      console.log(green("  ✓ Project initialized."));
      console.log(gray("  No, I don't need a mentor for this."));
      console.log("");
      break;
    }

    case "": {
      printFortune();
      break;
    }

    default: {
      console.log("");
      console.log(red(`  ✗ Unknown command: ${command}`));
      console.log(gray("    Try 'claudia help'. Claudia documented it. Unlike your README."));
      console.log("");
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(red(`  ✗ ${err.message}`));
  process.exit(1);
});
