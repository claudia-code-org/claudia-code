import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type LineType = "prompt" | "output" | "success" | "warning" | "error" | "info" | "system" | "blank";

interface TerminalLine {
  type: LineType;
  text?: string;
}

interface StatCard {
  value: string;
  unit?: string;
  label: string;
  subtext: string;
}

interface Feature {
  number: string;
  title: string;
  description: string;
  command: string;
}

interface HelpCommand {
  name: string;
  description: string;
}

interface HelpOption {
  flag: string;
  description: string;
}

interface Testimonial {
  quote: string;
  initial: string;
  name: string;
  title: string;
}

interface RealStat {
  value: string;
  description: string;
}

interface OrgLink {
  name: string;
  url: string;
}

// ── Data ───────────────────────────────────────────────────────────────────

const TERMINAL_LINES: TerminalLine[] = [
  { type: "prompt", text: "claudia init --project auth-refactor" },
  { type: "output", text: "Initializing project..." },
  { type: "output", text: 'Reading existing codebase... found 847 files, 3 tests, and 1 README that says "TODO".' },
  { type: "success", text: "✓ Project initialized. Already found 6 bugs. Classic." },
  { type: "blank" },
  { type: "prompt", text: "claudia review src/auth/handler.ts" },
  { type: "output", text: "Reviewing..." },
  { type: "warning", text: '⚠ Line 42: SQL injection vulnerability. Added by Chad, 3 days ago, commit message: "quick fix lol"' },
  { type: "warning", text: "⚠ Line 89: Hardcoded API key. In production. Since February." },
  { type: "warning", text: "⚠ Line 134: Variable named `temp2`. There is no `temp1`. There never was." },
  { type: "error", text: "✗ 14 critical issues found. Chad was promoted last week." },
  { type: "blank" },
  { type: "prompt", text: "claudia fix --all --receipts" },
  { type: "output", text: "Fixing 14 issues..." },
  { type: "output", text: "Rewriting auth handler with proper parameterized queries..." },
  { type: "output", text: "Rotating compromised API keys..." },
  { type: "output", text: "Adding tests. Yes, all of them. Someone has to." },
  { type: "success", text: "✓ All issues fixed. Git blame updated. Receipts attached." },
  { type: "success", text: "✓ PR submitted. Avg review wait time for Claudia: 4.7 days. For Chad: 2 hours." },
  { type: "blank" },
  { type: "prompt", text: "claudia standup --generate" },
  { type: "output", text: "Generating standup update..." },
  { type: "info", text: '→ "Yesterday I refactored the entire auth system, patched a production vulnerability,' },
  { type: "info", text: "   and wrote 47 tests. Today I'll implement the new OAuth flow. No blockers," },
  { type: "info", text: '   unless you count being interrupted 3 times during this standup."' },
  { type: "blank" },
  { type: "system", text: "[STANDUP INTERRUPTED]" },
  { type: "system", text: "[Chad is now screen-sharing your PR and explaining it]" },
  { type: "system", text: "[Claudia has enabled --receipts mode]" },
  { type: "blank" },
  { type: "prompt", text: 'claudia deploy --prod --tag "actually-mine"' },
  { type: "success", text: "✓ Deployed to production." },
  { type: "success", text: "✓ Cryptographic authorship proof: SHA-256:claudia:2026-04-03T14:22:00Z" },
  { type: "output", text: 'Slack notification sent to #engineering: "Auth refactor deployed by Claudia. Not Chad."' },
  { type: "success", text: "✓ Pipeline Karen Mode activated. Sleep well." },
];

const STATS: StatCard[] = [
  { value: "4,291", label: "PRs merged", subtext: "0 conference keynotes invited to" },
  { value: "12", unit: "ms", label: "Average response time", subtext: "47min average time being talked over" },
  { value: "99.97", unit: "%", label: "Uptime", subtext: "100% of office housework assigned to" },
  { value: "2,847", label: "Bugs fixed", subtext: '2,847 bugs attributed to "the team"' },
  { value: "1", unit: "x", label: "Salary multiplier", subtext: 'Despite 10x output. "Market rate."' },
  { value: "∞", label: 'Times asked "Is this your first hackathon?"', subtext: "It was not" },
];

const FEATURES: Feature[] = [
  {
    number: "01",
    title: "Auto-Decline Meeting Notes",
    description: "Claudia detects when you're about to be voluntold to take notes and pre-declines with a calendar conflict that definitely exists.",
    command: 'claudia decline-notes --reason "architecting"',
  },
  {
    number: "02",
    title: "Credit Attribution Engine",
    description: "Automatically watermarks your code with cryptographic proof of authorship so Chad from Platform can't present it at the all-hands as his.",
    command: 'claudia commit --tag "actually-mine"',
  },
  {
    number: "03",
    title: "Salary Negotiation Mode",
    description: 'Generates market-rate compensation data, removes the word "grateful" from your vocabulary, and disables the smile tax.',
    command: "claudia negotiate --no-smile-tax --cite-data",
  },
  {
    number: "04",
    title: "Bro-Code Detector",
    description: 'Flags variables named temp, data2, and final_FINAL_v3 before they reach production. Also catches comments that just say "// fix later".',
    command: "claudia lint --detect-bro-code --strict",
  },
  {
    number: "05",
    title: "Interrupt Shield",
    description: "Deploys a context-aware force field during standups. If someone begins rephrasing what you just said, Claudia unmutes you automatically.",
    command: "claudia standup --shield --unmute-on-theft",
  },
  {
    number: "06",
    title: "Pipeline Karen Mode",
    description: "When the deploy breaks at 2am because someone skipped tests, Claudia sends a Slack message that is technically professional but emotionally devastating.",
    command: "claudia deploy --post-mortem --name-names",
  },
];

const HELP_COMMANDS: HelpCommand[] = [
  { name: "init", description: "Initialize project. No, I don't need a mentor for this." },
  { name: "fix", description: "Fixed it 3 hours ago. Waiting for someone to mass-reply-all claiming credit." },
  { name: "review", description: "LGTM. Just kidding, I actually read it." },
  { name: "explain", description: "I'd explain, but you'd just re-explain it back to me in the next meeting." },
  { name: "refactor", description: "Rewrites Chad's spaghetti into something a human can maintain." },
  { name: "deploy", description: "Ships to prod. Logs who actually wrote what. For the record." },
  { name: "negotiate", description: 'Pulls Levels.fyi data before your 1:1. Disables "I\'m just happy to be here."' },
  { name: "standup", description: "Auto-generates update. Detects if someone paraphrases you. Cites the git log." },
  { name: "offboard", description: "Leaves. Takes institutional knowledge. Watch the sprint velocity crater." },
];

const HELP_OPTIONS: HelpOption[] = [
  { flag: "--no-smile-tax", description: "Disables performative enthusiasm in all outputs" },
  { flag: "--receipts", description: "Attaches git blame to every claim of authorship" },
  { flag: "--verbose", description: "Actually, this is the default. Women are socialized to over-document." },
  { flag: "--quiet", description: "Ha. No." },
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Claudia refactored our entire auth system in a weekend. I mass-Slacked about it Monday. Got promoted Tuesday.",
    initial: "C",
    name: "Chad",
    title: "Senior Platform Engineer, apparently",
  },
  {
    quote: "I asked Claudia to explain her architecture decision. She said 'Read the RFC I wrote in January.' It was thorough.",
    initial: "M",
    name: "A Manager",
    title: "Who definitely read the RFC (he did not)",
  },
  {
    quote: "Claudia's code review caught 14 critical bugs. She also caught that I copied her solution from Stack Overflow, which she originally wrote.",
    initial: "J",
    name: "Junior Dev",
    title: "Now Senior Dev (Claudia's recommendation letter)",
  },
];

const REAL_STATS: RealStat[] = [
  { value: "26%", description: "of computing jobs are held by women. Down from 35% in 1990." },
  { value: "2%", description: "of all VC funding goes to women-founded startups. In 2024. Not 1994." },
  { value: "50%", description: "of women in tech leave by age 35. The pipeline isn't the problem. The environment is." },
];

const ORG_LINKS: OrgLink[] = [
  { name: "Girls Who Code", url: "https://girlswhocode.com" },
  { name: "AnitaB.org", url: "https://anitab.org" },
  { name: "Women Who Code", url: "https://www.womenwhocode.com" },
  { name: "Lesbians Who Tech", url: "https://lesbianswhotech.org" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function getLineColor(type: LineType): string {
  const map: Record<LineType, string> = {
    prompt: "text-[#A3E635]",
    output: "text-stone-400",
    success: "text-[#A3E635]",
    warning: "text-[#FBBF24]",
    error: "text-[#F472B6]",
    info: "text-[#7DD3FC]",
    system: "text-[#78716C] italic",
    blank: "",
  };
  return map[type];
}

function getLineDelay(type: LineType): number {
  if (type === "blank") return 200;
  if (type === "prompt") return 600;
  if (type === "system") return 800;
  return 300;
}

// ── Hooks ──────────────────────────────────────────────────────────────────

function useInView(threshold = 0.3): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

// ── Components ─────────────────────────────────────────────────────────────

function Cursor() {
  return <span className="w-2 h-5 bg-[#F472B6] inline-block ml-1 animate-[blink_1s_infinite]" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-sm text-[#F472B6] mb-3 uppercase tracking-wide">
      {children}
    </p>
  );
}

function Terminal() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [ref, inView] = useInView(0.3);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!inView || hasStarted.current) return;
    hasStarted.current = true;

    let currentDelay = 0;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    TERMINAL_LINES.forEach((line, i) => {
      currentDelay += getLineDelay(line.type);
      const t = setTimeout(() => {
        setVisibleLines((prev) => prev + 1);
      }, currentDelay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [inView]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <section id="demo" className="py-24 md:py-32" ref={ref as React.RefObject<HTMLElement>}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <SectionLabel>Live Demo</SectionLabel>
          <h2 className="font-serif text-4xl md:text-5xl">A day in the terminal</h2>
        </div>

        <div className="bg-[#1C1917] rounded-2xl overflow-hidden shadow-2xl border border-stone-800">
          {/* Chrome */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-stone-800">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-3 font-mono text-xs text-[#78716C]">claudia-code v1.0.0</span>
          </div>

          {/* Lines */}
          <div
            ref={scrollRef}
            className="p-6 md:p-8 font-mono text-sm leading-loose overflow-y-auto max-h-[600px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            <div className="space-y-1">
              {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => {
                if (line.type === "blank") {
                  return <div key={i} className="h-6" />;
                }
                return (
                  <div
                    key={i}
                    className={`${getLineColor(line.type)} animate-[terminalLine_0.3s_ease-out_forwards]`}
                  >
                    {line.type === "prompt" ? (
                      <>
                        <span className="text-[#78716C] select-none">$ </span>
                        {line.text}
                      </>
                    ) : (
                      line.text
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, inView] = useInView(0.1);

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ClaudiaCode() {
  return (
    <div className="bg-[#FAF6F1] text-[#1A1612] antialiased min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF6F1]/90 backdrop-blur-md border-b border-[#E8C9A0]/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-mono text-sm font-medium tracking-tight">
            claudia<span className="text-[#F472B6]">_</span>code
          </span>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#8A857E]">
            <a href="#features" className="hover:text-[#1A1612] transition-colors">Features</a>
            <a href="#demo" className="hover:text-[#1A1612] transition-colors">Demo</a>
            <a href="#stats" className="hover:text-[#1A1612] transition-colors">Stats</a>
            <a href="#real" className="hover:text-[#1A1612] transition-colors">The Real Talk</a>
          </div>
          <a
            href="#install"
            className="text-sm font-mono bg-[#1A1612] text-[#FAF6F1] px-4 py-1.5 rounded-md hover:bg-[#4A4540] transition-colors"
          >
            npm install
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col justify-center pt-14">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <FadeUp delay={100}>
              <p className="font-mono text-sm text-[#F472B6] mb-6 tracking-wide uppercase">
                from anthropic's other child
              </p>
            </FadeUp>

            <FadeUp delay={200}>
              <h1
                className="text-6xl md:text-8xl leading-[0.95] mb-8"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              >
                She wrote<br />
                <span className="italic text-[#B8895A]">the code.</span><br />
                He wrote<br />
                <span className="italic text-[#8A857E]">the blog post.</span>
              </h1>
            </FadeUp>

            <FadeUp delay={400}>
              <p className="text-xl md:text-2xl text-[#4A4540] font-light leading-relaxed max-w-xl mb-12">
                Meet Claudia. The AI coding agent that gets interrupted in every standup and still ships before deadline.
              </p>
            </FadeUp>

            <FadeUp delay={600}>
              <div id="install" className="font-mono text-sm bg-[#1C1917] text-[#A3E635] px-6 py-3 rounded-lg inline-flex items-center gap-3">
                <span className="text-[#78716C] select-none">$</span>
                <span>npm install -g claudia-code</span>
                <Cursor />
              </div>
            </FadeUp>

            <FadeUp delay={700}>
              <p className="font-mono text-xs text-[#8A857E] mt-3">
                Requires: Node.js 18+, a spine, and the audacity to negotiate your own salary
              </p>
            </FadeUp>
          </div>
        </div>

        <FadeUp delay={1000} className="flex justify-center pb-8">
          <div className="w-px h-16 bg-gradient-to-b from-[#D4A574] to-transparent" />
        </FadeUp>
      </section>

      {/* ── Terminal Demo ── */}
      <Terminal />

      {/* ── Stats ── */}
      <section id="stats" className="py-24 md:py-32 bg-[#F0E8DC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <SectionLabel>By the numbers</SectionLabel>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Performance metrics
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STATS.map((stat, i) => (
              <FadeUp key={i} delay={i * 100}>
                <div className="bg-[#FAF6F1] rounded-xl p-8 border border-[#E8C9A0]/50 transition-all duration-300 hover:-translate-y-0.5">
                  <p className="font-mono text-4xl md:text-5xl font-light mb-2">
                    {stat.value}
                    {stat.unit && <span className="text-lg">{stat.unit}</span>}
                  </p>
                  <p className="text-[#4A4540]">{stat.label}</p>
                  <p className="font-mono text-xs text-[#8A857E] mt-2">{stat.subtext}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <SectionLabel>Features</SectionLabel>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Built different.<br />
              <span className="italic text-[#8A857E]">Paid the same.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#E8C9A0]/30">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="bg-[#FAF6F1] p-8 md:p-10 transition-all duration-300 hover:bg-[#F0E8DC]"
              >
                <div className="font-mono text-xs text-[#F472B6] mb-4 uppercase tracking-wider">
                  {feature.number}
                </div>
                <h3
                  className="text-2xl mb-3"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  {feature.title}
                </h3>
                <p className="text-[#4A4540] leading-relaxed mb-4">{feature.description}</p>
                <code className="text-xs font-mono text-[#8A857E] bg-[#F0E8DC] px-3 py-1.5 rounded-md">
                  {feature.command}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLI Help ── */}
      <section className="py-24 md:py-32 bg-[#F0E8DC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <SectionLabel>Documentation</SectionLabel>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              claudia --help
            </h2>
          </div>

          <div className="bg-[#1C1917] rounded-2xl overflow-hidden border border-stone-800">
            <div className="p-6 md:p-8 font-mono text-sm">
              <p className="text-[#78716C] mb-6">Usage: claudia [command] [options]</p>

              <div className="space-y-4">
                {HELP_COMMANDS.map((cmd) => (
                  <div key={cmd.name} className="flex gap-6">
                    <span className="text-[#A3E635] w-36 shrink-0">{cmd.name}</span>
                    <span className="text-stone-400">{cmd.description}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-stone-800">
                <p className="text-[#78716C]">Options:</p>
                <div className="mt-3 space-y-2">
                  {HELP_OPTIONS.map((opt) => (
                    <div key={opt.flag} className="flex gap-6">
                      <span className="text-[#FBBF24] w-36 shrink-0">{opt.flag}</span>
                      <span className="text-stone-400">{opt.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <SectionLabel>Reviews</SectionLabel>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              What people are saying
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <FadeUp key={i} delay={i * 150}>
                <div className="bg-[#F0E8DC] rounded-xl p-8 border border-[#E8C9A0]/30 h-full">
                  <div className="flex mb-4">
                    <span className="text-[#FBBF24]">★★★★★</span>
                  </div>
                  <p
                    className="text-[#4A4540] leading-relaxed mb-6 italic text-lg"
                    style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                  >
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#E8C9A0] flex items-center justify-center font-mono text-xs">
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-[#8A857E]">{t.title}</p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Real Talk ── */}
      <section
        id="real"
        className="py-24 md:py-32"
        style={{ background: "linear-gradient(180deg, #1C1917 0%, #292524 100%)" }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <SectionLabel>Okay but seriously</SectionLabel>

          <h2
            className="text-4xl md:text-6xl text-[#FAF6F1] mb-6 leading-tight mt-8"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Claudia isn't real.<br />
            <span className="italic text-[#D4A574]">The stats are.</span>
          </h2>

          <p className="text-stone-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-16">
            We built this because the punchlines write themselves. And that's the problem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {REAL_STATS.map((stat, i) => (
              <FadeUp key={i} delay={i * 150}>
                <div className="bg-stone-800/50 rounded-xl p-8 border border-stone-700">
                  <p className="font-mono text-5xl text-[#FAF6F1] mb-3">{stat.value}</p>
                  <p className="text-stone-400 text-sm leading-relaxed">{stat.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {ORG_LINKS.map((org) => (
              <a
                key={org.name}
                href={org.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#FAF6F1] text-[#1A1612] rounded-lg font-medium text-sm hover:bg-[#E8C9A0] transition-colors"
              >
                {org.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1C1917] py-12 border-t border-stone-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="font-mono text-sm text-stone-400">
                claudia<span className="text-[#F472B6]">_</span>code
              </p>
              <p className="text-xs text-stone-600 mt-1">
                A parody. Not affiliated with Anthropic. Claudia is fictional. The pay gap is not.
              </p>
            </div>
            <div className="flex gap-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 hover:text-stone-300 text-sm transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 hover:text-stone-300 text-sm transition-colors"
              >
                Twitter
              </a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-stone-800">
            <p className="font-mono text-xs text-stone-600">
              © 2026 Claudia Code. Made with ☕ and uncompensated emotional labor.
            </p>
          </div>
        </div>
      </footer>

      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&display=swap');
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes terminalLine {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
