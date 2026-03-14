"use client";

import { PauseCircle, PlayCircle, RotateCcw } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Panel } from "@/components/panel";
import { SimulationCanvas } from "@/components/simulation-canvas";
import { cn, formatNumber } from "@/lib/utils";
import type { AgentMode, LabConfig } from "@/lib/sim/types";
import { useLabRunner } from "@/hooks/use-lab-runner";

const TOOLTIP_STYLE = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
};

const AGENT_MODES: AgentMode[] = ["random", "heuristic", "evolution", "q-learning", "policy-gradient"];
const MODE_LABELS: Record<AgentMode, string> = {
  manual: "Manual",
  random: "Random",
  heuristic: "Heuristic",
  evolution: "Evolution",
  "q-learning": "Q-Learning",
  "policy-gradient": "Policy Gradient",
};

interface RunnerColumnProps {
  config: LabConfig;
  initialMode: AgentMode;
  side: "A" | "B";
}

function RunnerColumn({ config, initialMode, side }: RunnerColumnProps) {
  const runner = useLabRunner(config, initialMode);
  const rewardData = runner.episodeMetrics.slice(-30).map((m) => ({
    episode: m.episode,
    reward: m.reward,
    avg: m.movingAverage,
  }));
  const latestMetric = runner.episodeMetrics[runner.episodeMetrics.length - 1];

  return (
    <div className="rounded-[24px] border border-white/8 bg-slate-950/70 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-500/20 text-xs font-bold text-accent-300">
            {side}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-[0.14em]",
              runner.runStatus === "running"
                ? "bg-lime-500/15 text-lime-400"
                : "bg-white/8 text-slate-300",
            )}
          >
            {runner.runStatus}
          </span>
        </div>
        <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
          Ep {runner.episodeIndex}
        </span>
      </div>

      {/* Mode selector */}
      <div className="flex flex-wrap gap-1.5">
        {AGENT_MODES.map((m) => (
          <button
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition",
              runner.mode === m
                ? "bg-accent-500 text-white"
                : "border border-white/10 bg-white/5 text-slate-400 hover:text-white",
            )}
            key={m}
            onClick={() => runner.setMode(m)}
            type="button"
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Trainer view toggle (learning modes only) */}
      {(runner.mode === "evolution" || runner.mode === "q-learning" || runner.mode === "policy-gradient") && (
        <div className="flex rounded-full border border-white/10 bg-slate-950/70 w-fit">
          {(["train", "evaluate"] as const).map((v) => (
            <button
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                runner.trainerView === v ? "bg-accent-500 text-white" : "text-slate-400 hover:text-white",
              )}
              key={v}
              onClick={() => runner.setTrainerView(v)}
              type="button"
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {/* Canvas */}
      <SimulationCanvas
        className="overflow-hidden rounded-[24px] border border-white/8"
        history={runner.currentFrames}
        world={runner.world}
      />

      {/* Controls */}
      <div className="flex gap-2">
        <button
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-accent-400"
          onClick={runner.toggleRun}
          type="button"
        >
          {runner.runStatus === "running" ? (
            <><PauseCircle className="h-4 w-4" />Pause</>
          ) : (
            <><PlayCircle className="h-4 w-4" />Start</>
          )}
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          onClick={runner.reset}
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-2xl border border-white/8 bg-slate-950/60 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Reward</p>
          <p className="mt-1 font-medium text-white">{formatNumber(runner.world.totalReward)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-slate-950/60 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Score</p>
          <p className="mt-1 font-medium text-white">{runner.world.score}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-slate-950/60 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Best</p>
          <p className="mt-1 font-medium text-white">
            {formatNumber(runner.bestRun?.totalReward ?? 0)}
          </p>
        </div>
      </div>

      {/* Last episode metric */}
      {latestMetric && (
        <p className="text-xs text-slate-500">
          Last ep: reward {formatNumber(latestMetric.reward)} · avg {formatNumber(latestMetric.movingAverage)}
        </p>
      )}

      {/* Mini reward chart */}
      {rewardData.length > 1 && (
        <div className="h-32">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={rewardData}>
              <XAxis dataKey="episode" hide />
              <YAxis hide />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line
                dataKey="reward"
                dot={false}
                name="Reward"
                stroke="#38bdf8"
                strokeWidth={1.5}
                type="monotone"
              />
              <Line
                dataKey="avg"
                dot={false}
                name="Avg"
                stroke="#a3e635"
                strokeWidth={1.5}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

interface ComparisonPanelProps {
  config: LabConfig;
}

export function ComparisonPanel({ config }: ComparisonPanelProps) {
  return (
    <Panel
      subtitle="Run two agents side-by-side with independent training states and the same environment seed."
      title="Comparison"
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <RunnerColumn config={config} initialMode="heuristic" side="A" />
        <RunnerColumn config={config} initialMode="q-learning" side="B" />
      </div>
    </Panel>
  );
}
