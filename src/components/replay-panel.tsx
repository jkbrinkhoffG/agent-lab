"use client";

import { PauseCircle, PlayCircle } from "lucide-react";

import { Panel } from "@/components/panel";
import { SimulationCanvas } from "@/components/simulation-canvas";
import { formatNumber } from "@/lib/utils";
import type { ReplayFrame, ReplayRun } from "@/lib/sim/types";

interface ReplayPanelProps {
  replayFrame: ReplayFrame;
  replayRun: ReplayRun;
  replayFrameIndex: number;
  replayPlaying: boolean;
  summaries: {
    current: ReplayRun;
    recent: ReplayRun | null;
    best: ReplayRun | null;
  };
  onSelectSource: (source: "current" | "recent" | "best") => void;
  onSetFrameIndex: (value: number) => void;
  onSetReplayPlaying: (value: boolean) => void;
}

export function ReplayPanel({
  replayFrame,
  replayRun,
  replayFrameIndex,
  replayPlaying,
  summaries,
  onSelectSource,
  onSetFrameIndex,
  onSetReplayPlaying,
}: ReplayPanelProps) {
  const summaryRuns = Array.from(
    new Map(
      [summaries.current, summaries.recent, summaries.best]
        .filter(Boolean)
        .map((run) => [run!.id, run as ReplayRun]),
    ).values(),
  );

  return (
    <Panel subtitle="Scrub recent runs, current rollout, or best-so-far behavior." title="Replay">
      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[24px] border border-white/8 bg-slate-950/70 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
              onClick={() => onSelectSource("current")}
              type="button"
            >
              Current
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
              onClick={() => onSelectSource("recent")}
              type="button"
            >
              Recent
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
              onClick={() => onSelectSource("best")}
              type="button"
            >
              Best
            </button>
            <button
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-accent-500 px-3 py-2 text-sm font-medium text-white"
              onClick={() => onSetReplayPlaying(!replayPlaying)}
              type="button"
            >
              {replayPlaying ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
              {replayPlaying ? "Pause" : "Play"}
            </button>
          </div>

          <SimulationCanvas
            className="overflow-hidden rounded-[24px] border border-white/8"
            history={replayRun.frames.slice(0, replayFrameIndex + 1)}
            world={replayFrame}
          />

          <div className="mt-4">
            <input
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-accent-400"
              max={Math.max(0, replayRun.frames.length - 1)}
              min={0}
              onChange={(event) => onSetFrameIndex(Number(event.target.value))}
              step={1}
              type="range"
              value={replayFrameIndex}
            />
            <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-500">
              <span>Frame {replayFrameIndex + 1}</span>
              <span>{replayRun.frames.length} total</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {summaryRuns.map((replaySummary) => {
            return (
              <div
                className="rounded-2xl border border-white/8 bg-slate-950/60 px-4 py-3"
                key={replaySummary.id}
              >
                <p className="text-sm font-medium text-white">{replaySummary.label}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {replaySummary.mode}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-slate-500">Reward</p>
                    <p className="font-medium text-white">
                      {formatNumber(replaySummary.totalReward)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Score</p>
                    <p className="font-medium text-white">{replaySummary.score}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Steps</p>
                    <p className="font-medium text-white">{replaySummary.steps}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
