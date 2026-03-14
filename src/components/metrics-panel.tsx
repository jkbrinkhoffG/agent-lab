"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Panel } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { formatNumber } from "@/lib/utils";
import type {
  AgentMode,
  EpisodeMetrics,
  EventLogEntry,
  GenerationMetrics,
  PGProgressPoint,
  QLearningProgressPoint,
  WorldState,
} from "@/lib/sim/types";
import type { AgentDecision } from "@/lib/agents/base";
import type { QRuntime } from "@/lib/trainers/q-learning-trainer";
import type { PGRuntime } from "@/lib/trainers/policy-gradient-trainer";

const TOOLTIP_STYLE = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
};

interface MetricsPanelProps {
  mode: AgentMode;
  world: WorldState;
  episodeMetrics: EpisodeMetrics[];
  generationMetrics: GenerationMetrics[];
  qLearningMetrics: QLearningProgressPoint[];
  pgMetrics: PGProgressPoint[];
  logs: EventLogEntry[];
  lastDecision: AgentDecision | null;
  qRuntime: QRuntime;
  pgRuntime: PGRuntime;
}

export function MetricsPanel({
  mode,
  world,
  episodeMetrics,
  generationMetrics,
  qLearningMetrics,
  pgMetrics,
  logs,
  lastDecision,
  qRuntime,
  pgRuntime,
}: MetricsPanelProps) {
  const rewardMetrics = episodeMetrics.slice(-20);
  const qProgressMetrics = qLearningMetrics.slice(-40);
  const pgProgressMetrics = pgMetrics.slice(-40);
  const actionScores = Object.entries(lastDecision?.scores ?? {}).map(([action, score]) => ({
    action,
    score,
  }));
  const latestQMetric = qLearningMetrics[qLearningMetrics.length - 1] ?? null;
  const bestQReward = qLearningMetrics.reduce(
    (best, metric) => Math.max(best, metric.reward),
    Number.NEGATIVE_INFINITY,
  );
  const recentQWindow = qLearningMetrics.slice(-10);
  const recentQAverage =
    recentQWindow.reduce((sum, metric) => sum + metric.reward, 0) /
    Math.max(1, recentQWindow.length);

  const bestPGReward = pgMetrics.reduce(
    (best, metric) => Math.max(best, metric.reward),
    Number.NEGATIVE_INFINITY,
  );
  const recentPGWindow = pgMetrics.slice(-10);
  const recentPGAverage =
    recentPGWindow.reduce((sum, metric) => sum + metric.reward, 0) /
    Math.max(1, recentPGWindow.length);

  return (
    <div className="space-y-4">
      <Panel subtitle="Fast readout of what the agent is seeing and doing." title="Metrics">
        <div className="grid gap-3 xl:grid-cols-2">
          <StatCard label="Total reward" value={formatNumber(world.totalReward)} />
          <StatCard label="Food collected" value={String(world.collectedFood)} />
          <StatCard label="Hazard adjacent" value={String(world.observation.hazardAdjacent)} />
          <StatCard
            hint={
              mode === "q-learning"
                ? `Episodes ${qRuntime.episodes}`
                : mode === "policy-gradient"
                  ? `Episodes ${pgRuntime.episodes}`
                  : undefined
            }
            label="Steps remaining"
            value={formatNumber(world.observation.stepsRemaining * 100, 0) + "%"}
          />
        </div>
      </Panel>

      <Panel subtitle="Observation values are normalized for inspectability." title="Observation">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {Object.entries(world.observation).map(([key, value]) => (
            <div
              className="rounded-2xl border border-white/8 bg-slate-950/60 px-3 py-2"
              key={key}
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{key}</p>
              <p className="mt-1 font-mono text-white">{formatNumber(value)}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel subtitle="Latest action choice, reward breakdown, and value hints." title="Decision">
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Action</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {lastDecision?.action ?? world.lastAction}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {lastDecision?.reasoning ?? "Step once to inspect the current policy output."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(world.lastRewardBreakdown).map(([key, value]) => (
              <div className="rounded-2xl border border-white/8 bg-slate-950/60 px-3 py-2" key={key}>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{key}</p>
                <p className="mt-1 font-mono text-white">{formatNumber(value)}</p>
              </div>
            ))}
          </div>
          {actionScores.length > 0 && (
            <div className="h-40">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={actionScores}>
                  <CartesianGrid opacity={0.08} vertical={false} />
                  <XAxis dataKey="action" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="score" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Panel>

      <Panel subtitle="Episode reward, moving average, and generation fitness." title="Charts">
        <div className="space-y-4">
          <div className="h-44">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={rewardMetrics}>
                <CartesianGrid opacity={0.08} vertical={false} />
                <XAxis dataKey="episode" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Line
                  dataKey="reward"
                  dot={false}
                  name="Reward"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  type="monotone"
                />
                <Line
                  dataKey="movingAverage"
                  dot={false}
                  name="Moving avg"
                  stroke="#a3e635"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="h-44">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={generationMetrics}>
                <CartesianGrid opacity={0.08} vertical={false} />
                <XAxis dataKey="generation" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  dataKey="averageFitness"
                  fill="rgba(56, 189, 248, 0.15)"
                  name="Average"
                  stroke="#38bdf8"
                  type="monotone"
                />
                <Area
                  dataKey="bestFitness"
                  fill="rgba(163, 230, 53, 0.18)"
                  name="Best"
                  stroke="#a3e635"
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>

      {mode === "q-learning" && (
        <Panel
          subtitle="Reward trend, exploration decay, and visited state growth across Q-learning episodes."
          title="Q-learning Progress"
        >
          <div className="space-y-4">
            <div className="grid gap-3 xl:grid-cols-2">
              <StatCard
                hint={latestQMetric ? `Last: ${latestQMetric.terminationReason ?? "active"}` : undefined}
                label="Current epsilon"
                value={formatNumber(qRuntime.epsilon)}
              />
              <StatCard
                hint="Unique discretized observations with learned values"
                label="Visited states"
                value={String(Object.keys(qRuntime.qValues).length)}
              />
              <StatCard
                hint="Best single Q-learning episode reward so far"
                label="Best reward"
                value={formatNumber(Number.isFinite(bestQReward) ? bestQReward : 0)}
              />
              <StatCard
                hint="Average reward over the last 10 Q-learning episodes"
                label="Recent avg"
                value={formatNumber(recentQAverage)}
              />
            </div>

            <div className="h-48">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={qProgressMetrics}>
                  <CartesianGrid opacity={0.08} vertical={false} />
                  <XAxis dataKey="episode" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Line
                    dataKey="reward"
                    dot={false}
                    name="Episode reward"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Line
                    dataKey="movingAverage"
                    dot={false}
                    name="10-episode avg"
                    stroke="#a3e635"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-48">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={qProgressMetrics}>
                  <CartesianGrid opacity={0.08} vertical={false} />
                  <XAxis dataKey="episode" stroke="#64748b" />
                  <YAxis domain={[0, 1]} stroke="#64748b" yAxisId="left" />
                  <YAxis orientation="right" stroke="#64748b" yAxisId="right" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Line
                    dataKey="epsilon"
                    dot={false}
                    name="Exploration (epsilon)"
                    stroke="#fb7185"
                    strokeWidth={2}
                    type="monotone"
                    yAxisId="left"
                  />
                  <Line
                    dataKey="stateCount"
                    dot={false}
                    name="Visited states"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    type="monotone"
                    yAxisId="right"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>
      )}

      {mode === "policy-gradient" && (
        <Panel
          subtitle="Episode reward trend and return estimates for the REINFORCE policy gradient agent."
          title="Policy Gradient Progress"
        >
          <div className="space-y-4">
            <div className="grid gap-3 xl:grid-cols-2">
              <StatCard
                hint="Total REINFORCE training episodes completed"
                label="Episodes"
                value={String(pgRuntime.episodes)}
              />
              <StatCard
                hint="Best single policy gradient episode reward so far"
                label="Best reward"
                value={formatNumber(Number.isFinite(bestPGReward) ? bestPGReward : 0)}
              />
              <StatCard
                hint="Average reward over the last 10 PG episodes"
                label="Recent avg"
                value={formatNumber(recentPGAverage)}
              />
              <StatCard
                hint="Network hidden layer size"
                label="Network size"
                value={`9 → ${pgRuntime.network.b1.length} → 5`}
              />
            </div>

            <div className="h-48">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={pgProgressMetrics}>
                  <CartesianGrid opacity={0.08} vertical={false} />
                  <XAxis dataKey="episode" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Line
                    dataKey="reward"
                    dot={false}
                    name="Episode reward"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Line
                    dataKey="movingAverage"
                    dot={false}
                    name="10-episode avg"
                    stroke="#a3e635"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-48">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={pgProgressMetrics}>
                  <CartesianGrid opacity={0.08} vertical={false} />
                  <XAxis dataKey="episode" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Line
                    dataKey="returnEstimate"
                    dot={false}
                    name="Episode return"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>
      )}

      <Panel subtitle="High-signal events from the live run." title="Event Log">
        <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
          {logs.map((entry) => (
            <div
              className="rounded-2xl border border-white/8 bg-slate-950/60 px-3 py-3"
              key={entry.id}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{entry.title}</p>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  tick {entry.tick}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{entry.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
