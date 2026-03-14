"use client";

import { ChevronLast, PauseCircle, PlayCircle } from "lucide-react";

import { Panel } from "@/components/panel";
import { SimulationCanvas } from "@/components/simulation-canvas";
import { cn, formatNumber } from "@/lib/utils";
import type { ReplayFrame, ReplayRun } from "@/lib/sim/types";

interface ReplayPanelProps {
  replayFrame: ReplayFrame;
  replayRun: ReplayRun;
  replayFrameIndex: number;
  replayPlaying: boolean;
  replaySpeed: number;
  recentRuns: ReplayRun[];
  summaries: {
    current: ReplayRun;
    recent: ReplayRun | null;
    best: ReplayRun | null;
  };
  onSelectSource: (source: "current" | "recent" | "best" | { runId: string }) => void;
  onSetFrameIndex: (value: number) => void;
  onSetReplayPlaying: (value: boolean) => void;
  onSetReplaySpeed: (speed: number) => void;
  onSeekToEnd: () => void;
}

const SPEEDS = [0.5, 1, 2, 4] as const;

// Scan a replay run's frames to find event tick positions (food, hazard, terminal)
function getEventMarkers(run: ReplayRun) {
  const food: number[] = [];
  const hazard: number[] = [];
  const terminal: number[] = [];

  run.frames.forEach((frame, index) => {
    if (frame.rewardBreakdown.food > 0) food.push(index);
    if (frame.done && frame.terminationReason === "hazard collision") hazard.push(index);
    if (frame.done && frame.terminationReason === "wall collision") hazard.push(index);
    if (frame.done && frame.terminationReason === "step limit") terminal.push(index);
  });

  return { food, hazard, terminal };
}

export function ReplayPanel({
  replayFrame,
  replayRun,
  replayFrameIndex,
  replayPlaying,
  replaySpeed,
  recentRuns,
  summaries,
  onSelectSource,
  onSetFrameIndex,
  onSetReplayPlaying,
  onSetReplaySpeed,
  onSeekToEnd,
}: ReplayPanelProps) {
  const totalFrames = replayRun.frames.length;
  const markers = getEventMarkers(replayRun);
  const currentFrame = replayRun.frames[replayFrameIndex];

  // Build the run list: current + best (if distinct) + recent runs
  const allRuns: Array<{ run: ReplayRun; label: string; isCurrent: boolean }> = [];

  allRuns.push({ run: summaries.current, label: "Current run", isCurrent: true });

  if (summaries.best && summaries.best.id !== summaries.current.id) {
    allRuns.push({ run: summaries.best, label: "Best run", isCurrent: false });
  }

  recentRuns.forEach((run) => {
    if (run.id !== summaries.current.id && run.id !== summaries.best?.id) {
      allRuns.push({ run, label: run.label, isCurrent: false });
    }
  });

  return (
    <Panel subtitle="Scrub recent runs, control playback speed, and inspect frame events." title="Replay">
      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[24px] border border-white/8 bg-slate-950/70 p-4">
          {/* Controls row */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-accent-500 px-3 py-2 text-sm font-medium text-white"
              onClick={() => onSetReplayPlaying(!replayPlaying)}
              type="button"
            >
              {replayPlaying ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
              {replayPlaying ? "Pause" : "Play"}
            </button>
            <button
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              onClick={onSeekToEnd}
              title="Seek to last frame"
              type="button"
            >
              <ChevronLast className="h-4 w-4" />
            </button>
            {/* Speed control */}
            <div className="flex rounded-full border border-white/10 bg-slate-950/70">
              {SPEEDS.map((s) => (
                <button
                  className={cn(
                    "rounded-full px-2.5 py-1.5 text-xs font-medium transition",
                    replaySpeed === s
                      ? "bg-accent-500 text-white"
                      : "text-slate-400 hover:text-white",
                  )}
                  key={s}
                  onClick={() => onSetReplaySpeed(s)}
                  type="button"
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <SimulationCanvas
            className="overflow-hidden rounded-[24px] border border-white/8"
            history={replayRun.frames.slice(0, replayFrameIndex + 1)}
            world={replayFrame}
          />

          {/* Scrubber */}
          <div className="mt-4">
            <div className="relative">
              <input
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-accent-400"
                max={Math.max(0, totalFrames - 1)}
                min={0}
                onChange={(event) => onSetFrameIndex(Number(event.target.value))}
                step={1}
                type="range"
                value={replayFrameIndex}
              />
              {/* Event markers overlaid below scrubber */}
              {totalFrames > 1 && (
                <div className="pointer-events-none absolute left-0 right-0 top-5 flex h-3">
                  {markers.food.map((idx) => (
                    <span
                      className="absolute h-2 w-1.5 rounded-full bg-lime-400"
                      key={`food-${idx}`}
                      style={{ left: `${(idx / (totalFrames - 1)) * 100}%`, transform: "translateX(-50%)" }}
                      title={`Food at frame ${idx + 1}`}
                    />
                  ))}
                  {markers.hazard.map((idx) => (
                    <span
                      className="absolute h-2 w-1.5 rounded-full bg-rose-400"
                      key={`hazard-${idx}`}
                      style={{ left: `${(idx / (totalFrames - 1)) * 100}%`, transform: "translateX(-50%)" }}
                      title={`Collision at frame ${idx + 1}`}
                    />
                  ))}
                  {markers.terminal.map((idx) => (
                    <span
                      className="absolute h-2 w-1.5 rounded-full bg-amber-400"
                      key={`terminal-${idx}`}
                      style={{ left: `${(idx / (totalFrames - 1)) * 100}%`, transform: "translateX(-50%)" }}
                      title={`Step limit at frame ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="mt-5 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-500">
              <span>Frame {replayFrameIndex + 1}</span>
              {currentFrame && (
                <span className="flex gap-3">
                  <span>Action: {currentFrame.action}</span>
                  <span>Reward: {formatNumber(currentFrame.reward)}</span>
                  <span>Total: {formatNumber(currentFrame.totalReward)}</span>
                </span>
              )}
              <span>{totalFrames} total</span>
            </div>
            {/* Legend */}
            <div className="mt-2 flex gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-lime-400" />food</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-rose-400" />collision</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />step limit</span>
            </div>
          </div>
        </div>

        {/* Run history list */}
        <div className="grid auto-rows-min gap-3 overflow-y-auto" style={{ maxHeight: 520 }}>
          {allRuns.map(({ run, label }) => {
            const isActive = run.id === replayRun.id;
            return (
              <button
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left transition",
                  isActive
                    ? "border-accent-400 bg-accent-500/10"
                    : "border-white/8 bg-slate-950/60 hover:border-white/15 hover:bg-white/[0.04]",
                )}
                key={run.id}
                onClick={() => {
                  if (run.id === summaries.current.id) onSelectSource("current");
                  else if (run.id === summaries.best?.id) onSelectSource("best");
                  else onSelectSource({ runId: run.id });
                }}
                type="button"
              >
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {run.mode}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-slate-500">Reward</p>
                    <p className="font-medium text-white">{formatNumber(run.totalReward)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Score</p>
                    <p className="font-medium text-white">{run.score}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Steps</p>
                    <p className="font-medium text-white">{run.steps}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
