"use client";

import Link from "next/link";
import { BrainCircuit, Columns2, PauseCircle, PlayCircle, RotateCcw, SkipForward } from "lucide-react";

import { cn, formatNumber } from "@/lib/utils";
import type { AgentMode, WorldState } from "@/lib/sim/types";

interface LabHeaderProps {
  mode: AgentMode;
  trainerView: "evaluate" | "train";
  runStatus: "idle" | "running" | "paused";
  world: WorldState;
  progress: {
    episode: number;
    generation: number | null;
    candidate: number | null;
    populationSize: number | null;
  };
  showComparison: boolean;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
  wikiHref: string;
  onToggleComparison: () => void;
}

const modeLabels: Record<AgentMode, string> = {
  manual: "Manual pilot",
  random: "Random baseline",
  heuristic: "Heuristic baseline",
  evolution: "Evolution lab",
  "q-learning": "Q-learning lab",
  "policy-gradient": "Policy Gradient lab",
};

export function LabHeader({
  mode,
  trainerView,
  runStatus,
  world,
  progress,
  showComparison,
  onToggleRun,
  onStep,
  onReset,
  wikiHref,
  onToggleComparison,
}: LabHeaderProps) {
  return (
    <header className="rounded-[28px] border border-white/12 bg-slate-950/60 p-4 shadow-panel backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/18 text-accent-300">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Agent Lab</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-white">{modeLabels[mode]}</h1>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]",
                  runStatus === "running"
                    ? "bg-lime-500/15 text-lime-400"
                    : "bg-white/8 text-slate-300",
                )}
              >
                {runStatus}
              </span>
              {(mode === "evolution" || mode === "q-learning") && (
                <span className="rounded-full bg-accent-500/12 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-300">
                  {trainerView}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <div className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Episode</p>
            <p className="mt-1 text-lg font-semibold text-white">{progress.episode}</p>
            {progress.generation ? (
              <p className="text-xs text-slate-400">
                Gen {progress.generation} · Candidate {progress.candidate}/{progress.populationSize}
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Reward</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {formatNumber(world.totalReward)}
            </p>
            <p className="text-xs text-slate-400">
              Last {formatNumber(world.lastReward)} · Tick {world.tick}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Score</p>
            <p className="mt-1 text-lg font-semibold text-white">{world.score}</p>
            <p className="text-xs text-slate-400">
              Food {world.collectedFood} · {world.terminationReason ?? "active"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          className="inline-flex items-center gap-2 rounded-full border border-accent-400/30 bg-accent-500/10 px-4 py-2 text-sm font-medium text-accent-200 transition hover:bg-accent-500/18"
          href={wikiHref}
        >
          Open Wiki
        </Link>
        <button
          className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-400"
          onClick={onToggleRun}
          type="button"
        >
          {runStatus === "running" ? (
            <>
              <PauseCircle className="h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Start
            </>
          )}
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          onClick={onStep}
          type="button"
        >
          <SkipForward className="h-4 w-4" />
          Step
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          onClick={onReset}
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
        <button
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
            showComparison
              ? "border-accent-400 bg-accent-500/10 text-accent-200"
              : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
          )}
          onClick={onToggleComparison}
          type="button"
        >
          <Columns2 className="h-4 w-4" />
          Compare
        </button>
      </div>
    </header>
  );
}
