import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  Compass,
  FlaskConical,
  LineChart,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Agent Lab Wiki",
  description: "Beginner-friendly guide to the Agent Lab sandbox and core AI learning concepts.",
};

const quickStart = [
  {
    title: "1. Start in Manual mode",
    body:
      "Use the main lab page to move the agent with arrow keys or WASD. This shows the environment rules before you add learning.",
  },
  {
    title: "2. Switch to Random or Heuristic",
    body:
      "These are your baselines. Random shows what happens without intelligence. Heuristic shows a hand-written strategy you can compare learned behavior against.",
  },
  {
    title: "3. Watch observations and rewards",
    body:
      "Open the metrics panel and event log while stepping the simulation. Notice how actions lead to immediate rewards, penalties, and termination events.",
  },
  {
    title: "4. Try Evolution mode",
    body:
      "Run training and watch generations improve. Fitness charts show whether mutation and selection are discovering better behavior.",
  },
  {
    title: "5. Try Q-learning mode",
    body:
      "Run training, then flip to evaluation mode. This lets you see the difference between learning-time exploration and exploitation of what has been learned.",
  },
];

const glossary = [
  ["Environment", "The world the agent lives in. Here that means a bounded grid with food, hazards, and movement rules."],
  ["Agent", "The thing choosing actions. In this app it can be manual, random, heuristic, evolved, or Q-learning based."],
  ["Observation", "The data the agent can see right now. This app exposes normalized values like food direction, hazard direction, and remaining steps."],
  ["Action", "A discrete move chosen by the agent: up, down, left, right, or stay."],
  ["Reward", "The numeric feedback after an action. Positive reward usually means progress; negative reward means cost or failure."],
  ["Episode", "One full run from reset until a terminal condition happens, such as hitting a hazard or reaching the step limit."],
  ["Policy", "The rule used to map observations to actions. A heuristic is hand-written; an evolved or RL policy is learned."],
  ["Fitness", "The score used in evolution. In this app it is tied to episode reward and outcomes for each genome."],
  ["Generation", "One round of evaluating a whole population of candidate policies in evolution mode."],
  ["Exploration", "Trying actions that might not be best yet, in order to discover useful behavior."],
  ["Exploitation", "Using the best-known action based on current knowledge."],
  ["Q-value", "An estimate of how good an action is in a given state. Q-learning updates these estimates over time."],
];

const experimentIdeas = [
  "Increase hazard count and see whether heuristic performance degrades faster than evolved policies.",
  "Set step penalty close to zero and observe whether agents become less efficient or wander more.",
  "Increase closer-to-food shaping and compare whether learning speeds up but overfits the shaping reward.",
  "Use the same seed across modes so the environment is comparable between manual, random, heuristic, evolution, and Q-learning runs.",
  "Train in Q-learning mode, then switch to evaluation and compare the replay against the best evolution run.",
];

function Section({
  id,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: typeof BookOpen;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-[28px] border border-white/10 bg-white/[0.045] p-6 shadow-panel backdrop-blur-xl"
      id={id}
    >
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/12 text-accent-300">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function WikiPage() {
  return (
    <main className="mx-auto max-w-[1500px] px-4 py-5 lg:px-6">
      <div className="space-y-6">
        <header className="rounded-[32px] border border-white/12 bg-slate-950/60 p-6 shadow-panel backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Agent Lab Wiki</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                A beginner-friendly guide to the sandbox and the AI ideas inside it
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                This page is for someone who is new to Agent Lab, new to reinforcement learning,
                new to evolutionary optimization, or all three. It explains what the app is,
                how to use it, and what the major concepts mean in plain language.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-400"
                href="/"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Lab
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">What it is</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                A local AI playground for watching simple agents act, learn, fail, and improve.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Main goal</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Build intuition by making internals visible rather than hiding them behind abstractions.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Learning styles</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Baselines, evolution, and tabular reinforcement learning.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Best use</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Fast experiments with parameters, replay, and interpretable metrics.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[280px,minmax(0,1fr)]">
          <aside className="h-fit rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-panel backdrop-blur-xl xl:sticky xl:top-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">On this page</p>
            <nav className="mt-4 space-y-2">
              {[
                ["what-is-agent-lab", "What Agent Lab is"],
                ["how-to-use-the-app", "How to use the app"],
                ["core-ai-ideas", "Core AI ideas"],
                ["modes", "Modes in this app"],
                ["reading-the-ui", "Reading the UI"],
                ["how-to-run-good-experiments", "Running good experiments"],
                ["common-mistakes", "Common mistakes"],
                ["suggested-experiments", "Suggested experiments"],
              ].map(([id, label]) => (
                <a
                  className="block rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-sm text-slate-300 transition hover:border-accent-400/30 hover:text-white"
                  href={`#${id}`}
                  key={id}
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-6">
            <Section
              description="Agent Lab is a simulation workbench. It lets you place a simple agent in a simple world, change the rules, then watch how different decision systems behave under those rules."
              icon={BrainCircuit}
              id="what-is-agent-lab"
              title="What Agent Lab is"
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/8 bg-slate-950/60 p-5">
                  <h3 className="text-lg font-medium text-white">What this app is trying to teach</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                    <li>How observations, actions, and rewards connect.</li>
                    <li>Why reward design changes behavior.</li>
                    <li>How a baseline differs from a learned policy.</li>
                    <li>How evolution and RL improve through repeated experience.</li>
                    <li>Why metrics and replay are essential for understanding results.</li>
                  </ul>
                </div>
                <div className="rounded-3xl border border-white/8 bg-slate-950/60 p-5">
                  <h3 className="text-lg font-medium text-white">What this app is not trying to be</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                    <li>It is not a production training platform.</li>
                    <li>It is not a large-scale deep learning system.</li>
                    <li>It is not hiding the mechanics behind high-level magic APIs.</li>
                    <li>It is intentionally simple so you can inspect cause and effect.</li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section
              description="If you are brand new, follow this sequence. It moves from direct control to baselines to learning systems."
              icon={Compass}
              id="how-to-use-the-app"
              title="How to use the app"
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {quickStart.map((item) => (
                  <article
                    className="rounded-3xl border border-white/8 bg-slate-950/60 p-5"
                    key={item.title}
                  >
                    <h3 className="text-lg font-medium text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.body}</p>
                  </article>
                ))}
              </div>
            </Section>

            <Section
              description="These terms show up constantly in reinforcement learning and evolutionary systems. If these are clear, the rest of the app makes much more sense."
              icon={BookOpen}
              id="core-ai-ideas"
              title="Core AI ideas"
            >
              <div className="grid gap-4 md:grid-cols-2">
                {glossary.map(([term, definition]) => (
                  <article className="rounded-3xl border border-white/8 bg-slate-950/60 p-5" key={term}>
                    <h3 className="text-lg font-medium text-white">{term}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{definition}</p>
                  </article>
                ))}
              </div>
            </Section>

            <Section
              description="Each mode gives you a different answer to the same question: how does the agent decide what to do next?"
              icon={FlaskConical}
              id="modes"
              title="Modes in this app"
            >
              <div className="space-y-4">
                {[
                  [
                    "Manual",
                    "You choose every move. This is the best starting point because it teaches the world rules directly.",
                  ],
                  [
                    "Random",
                    "The agent samples actions without a strategy. This is the floor you want learned systems to beat.",
                  ],
                  [
                    "Heuristic",
                    "A hand-written rule tries to move toward food while avoiding hazards. This is a stronger baseline than random.",
                  ],
                  [
                    "Evolution",
                    "A population of simple policies is evaluated. Better policies survive, weaker ones are replaced by mutated descendants of stronger ones.",
                  ],
                  [
                    "Q-learning",
                    "The agent learns action values from experience. It explores early, then gradually becomes more greedy as its value estimates improve.",
                  ],
                ].map(([name, body]) => (
                  <div className="rounded-3xl border border-white/8 bg-slate-950/60 p-5" key={name}>
                    <h3 className="text-lg font-medium text-white">{name}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              description="The app is designed so that the UI itself teaches the mechanics. Each area answers a different question."
              icon={LineChart}
              id="reading-the-ui"
              title="Reading the UI"
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {[
                  [
                    "Header",
                    "Shows current mode, run state, reward, score, episode, and generation progress.",
                  ],
                  [
                    "Left control panel",
                    "Changes the environment, reward function, presets, and trainer parameters.",
                  ],
                  [
                    "Center viewport",
                    "Shows the live world state. The agent, hazards, food, and recent path are visible here.",
                  ],
                  [
                    "Right metrics panel",
                    "Shows observations, action choice, reward breakdown, charts, and event log.",
                  ],
                  [
                    "Replay panel",
                    "Lets you scrub through current, recent, or best runs so you can inspect behavior after the fact.",
                  ],
                  [
                    "Trainer toggles",
                    "In evolution and Q-learning modes, you can switch between training and evaluation to see the difference between learning and deployment.",
                  ],
                ].map(([title, body]) => (
                  <article className="rounded-3xl border border-white/8 bg-slate-950/60 p-5" key={title}>
                    <h3 className="text-lg font-medium text-white">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
                  </article>
                ))}
              </div>
            </Section>

            <Section
              description="It is easy to fool yourself in AI experiments. These habits help keep experiments interpretable."
              icon={Sparkles}
              id="how-to-run-good-experiments"
              title="How to run good experiments"
            >
              <div className="rounded-3xl border border-white/8 bg-slate-950/60 p-5">
                <ul className="space-y-3 text-sm leading-6 text-slate-300">
                  <li>Change one major variable at a time so you know what caused the difference.</li>
                  <li>Keep the seed fixed when comparing agents, otherwise the world itself changes too.</li>
                  <li>Compare against random and heuristic baselines before calling a learner impressive.</li>
                  <li>Use replay, not just charts. A high score can still hide unstable or weird behavior.</li>
                  <li>Look at reward breakdowns, not just total reward. Reward shaping can create accidental incentives.</li>
                  <li>Check whether the agent learned a robust strategy or just exploited a quirk of the current setup.</li>
                </ul>
              </div>
            </Section>

            <Section
              description="These are the failure modes beginners most often run into when experimenting with learning systems."
              icon={FlaskConical}
              id="common-mistakes"
              title="Common mistakes"
            >
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  "Assuming improvement on one seed means the policy is generally good.",
                  "Using reward totals alone without watching the replay.",
                  "Confusing training behavior with evaluation behavior in Q-learning.",
                  "Interpreting random lucky episodes as learning.",
                  "Adding too much shaping reward and then accidentally training the wrong objective.",
                  "Changing multiple knobs at once and losing track of what mattered.",
                ].map((item) => (
                  <div className="rounded-3xl border border-white/8 bg-slate-950/60 p-5" key={item}>
                    <p className="text-sm leading-6 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              description="If you want to build intuition quickly, these are good experiments to try first."
              icon={Compass}
              id="suggested-experiments"
              title="Suggested experiments"
            >
              <div className="rounded-3xl border border-white/8 bg-slate-950/60 p-5">
                <ol className="space-y-3 text-sm leading-6 text-slate-300">
                  {experimentIdeas.map((idea) => (
                    <li key={idea}>{idea}</li>
                  ))}
                </ol>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </main>
  );
}
