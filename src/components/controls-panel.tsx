"use client";

import type { ChangeEvent } from "react";
import { FlaskConical, SlidersHorizontal, Sparkles } from "lucide-react";

import { Panel } from "@/components/panel";
import { LAB_PRESETS } from "@/lib/presets";
import { cn, formatNumber } from "@/lib/utils";
import type { AgentMode, LabConfig } from "@/lib/sim/types";

interface ControlsPanelProps {
  config: LabConfig;
  trainerView: "evaluate" | "train";
  manualAction: string;
  selectedPresetId: string;
  onApplyPreset: (presetId: string) => void;
  onSetMode: (mode: AgentMode) => void;
  onSetTrainerView: (view: "evaluate" | "train") => void;
  onSetTickMs: (tickMs: number) => void;
  onUpdateEnvironment: <K extends keyof LabConfig["environment"]>(
    key: K,
    value: LabConfig["environment"][K],
  ) => void;
  onUpdateReward: <K extends keyof LabConfig["environment"]["rewards"]>(
    key: K,
    value: LabConfig["environment"]["rewards"][K],
  ) => void;
  onUpdateEvolution: <K extends keyof LabConfig["evolution"]>(
    key: K,
    value: LabConfig["evolution"][K],
  ) => void;
  onUpdateRL: <K extends keyof LabConfig["rl"]>(
    key: K,
    value: LabConfig["rl"][K],
  ) => void;
  onManualAction: (action: AgentMode extends never ? never : "up" | "down" | "left" | "right" | "stay") => void;
}

function SectionTitle({ icon: Icon, title }: { icon: typeof FlaskConical; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-accent-300" />
      <h3 className="text-sm font-medium text-white">{title}</h3>
    </div>
  );
}

function RangeField({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono text-xs text-slate-500">{formatNumber(value, step < 1 ? 2 : 0)}</span>
      </div>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-accent-400"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-accent-400"
        max={max}
        min={min}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

export function ControlsPanel({
  config,
  trainerView,
  manualAction,
  selectedPresetId,
  onApplyPreset,
  onSetMode,
  onSetTrainerView,
  onSetTickMs,
  onUpdateEnvironment,
  onUpdateReward,
  onUpdateEvolution,
  onUpdateRL,
  onManualAction,
}: ControlsPanelProps) {
  const modes: AgentMode[] = ["manual", "random", "heuristic", "evolution", "q-learning"];

  return (
    <div className="space-y-4">
      <Panel
        action={<Sparkles className="h-4 w-4 text-accent-300" />}
        subtitle="Environment, rewards, and trainer knobs. Every change resets the lab."
        title="Controls"
      >
        <div className="space-y-6">
          <div>
            <SectionTitle icon={FlaskConical} title="Preset" />
            <div className="grid gap-2">
              {LAB_PRESETS.map((preset) => (
                <button
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-left transition",
                    selectedPresetId === preset.id
                      ? "border-accent-400 bg-accent-500/10"
                      : "border-white/8 bg-slate-950/50 hover:border-white/15 hover:bg-white/[0.04]",
                  )}
                  key={preset.id}
                  onClick={() => onApplyPreset(preset.id)}
                  type="button"
                >
                  <p className="text-sm font-medium text-white">{preset.label}</p>
                  <p className="mt-1 text-xs text-slate-400">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle icon={SlidersHorizontal} title="Mode" />
            <div className="grid grid-cols-2 gap-2">
              {modes.map((mode) => (
                <button
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-sm font-medium capitalize transition",
                    config.mode === mode
                      ? "border-accent-400 bg-accent-500/10 text-white"
                      : "border-white/8 bg-slate-950/50 text-slate-300 hover:bg-white/[0.04]",
                  )}
                  key={mode}
                  onClick={() => onSetMode(mode)}
                  type="button"
                >
                  {mode}
                </button>
              ))}
            </div>
            {(config.mode === "evolution" || config.mode === "q-learning") && (
              <div className="mt-3 flex rounded-full border border-white/10 bg-slate-950/70 p-1">
                {(["evaluate", "train"] as const).map((view) => (
                  <button
                    className={cn(
                      "flex-1 rounded-full px-3 py-2 text-sm transition",
                      trainerView === view
                        ? "bg-accent-500 text-white"
                        : "text-slate-400 hover:text-white",
                    )}
                    key={view}
                    onClick={() => onSetTrainerView(view)}
                    type="button"
                  >
                    {view}
                  </button>
                ))}
              </div>
            )}
          </div>

          {config.mode === "manual" && (
            <div>
              <SectionTitle icon={Sparkles} title="Manual Action" />
              <div className="grid grid-cols-3 gap-2">
                {(["up", "left", "stay", "right", "down"] as const).map((action) => (
                  <button
                    className={cn(
                      "rounded-2xl border px-3 py-2 text-sm font-medium uppercase transition",
                      manualAction === action
                        ? "border-accent-400 bg-accent-500/12 text-white"
                        : "border-white/8 bg-slate-950/60 text-slate-300 hover:bg-white/[0.04]",
                    )}
                    key={action}
                    onClick={() => onManualAction(action)}
                    type="button"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <SectionTitle icon={FlaskConical} title="Environment" />
            <NumberField
              label="Seed"
              max={9999}
              min={1}
              onChange={(value) => onUpdateEnvironment("seed", value)}
              value={config.environment.seed}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Grid width"
                max={20}
                min={6}
                onChange={(value) => onUpdateEnvironment("gridWidth", value)}
                value={config.environment.gridWidth}
              />
              <NumberField
                label="Grid height"
                max={20}
                min={6}
                onChange={(value) => onUpdateEnvironment("gridHeight", value)}
                value={config.environment.gridHeight}
              />
            </div>
            <RangeField
              label="Tick speed (ms)"
              max={480}
              min={60}
              onChange={onSetTickMs}
              step={20}
              value={config.tickMs}
            />
            <RangeField
              label="Hazards"
              max={14}
              min={0}
              onChange={(value) => onUpdateEnvironment("hazardCount", value)}
              step={1}
              value={config.environment.hazardCount}
            />
            <RangeField
              label="Episode length"
              max={150}
              min={20}
              onChange={(value) => onUpdateEnvironment("maxSteps", value)}
              step={5}
              value={config.environment.maxSteps}
            />
            <label className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3">
              <span className="text-sm text-slate-300">Allow stay action</span>
              <input
                checked={config.environment.allowStayAction}
                className="h-4 w-4 accent-accent-400"
                onChange={(event) => onUpdateEnvironment("allowStayAction", event.target.checked)}
                type="checkbox"
              />
            </label>
          </div>

          <div className="space-y-3">
            <SectionTitle icon={Sparkles} title="Rewards" />
            <RangeField
              label="Food reward"
              max={20}
              min={1}
              onChange={(value) => onUpdateReward("food", value)}
              step={1}
              value={config.environment.rewards.food}
            />
            <RangeField
              label="Hazard penalty"
              max={-1}
              min={-20}
              onChange={(value) => onUpdateReward("hazard", value)}
              step={1}
              value={config.environment.rewards.hazard}
            />
            <RangeField
              label="Step penalty"
              max={0}
              min={-1}
              onChange={(value) => onUpdateReward("step", value)}
              step={0.02}
              value={config.environment.rewards.step}
            />
            <RangeField
              label="Closer shaping"
              max={1}
              min={0}
              onChange={(value) => onUpdateReward("closer", value)}
              step={0.05}
              value={config.environment.rewards.closer}
            />
            <RangeField
              label="Boundary penalty"
              max={0}
              min={-2}
              onChange={(value) => onUpdateReward("boundary", value)}
              step={0.05}
              value={config.environment.rewards.boundary}
            />
          </div>

          {config.mode === "evolution" && (
            <div className="space-y-3">
              <SectionTitle icon={FlaskConical} title="Evolution" />
              <RangeField
                label="Population"
                max={40}
                min={6}
                onChange={(value) => onUpdateEvolution("populationSize", value)}
                step={1}
                value={config.evolution.populationSize}
              />
              <RangeField
                label="Mutation rate"
                max={0.8}
                min={0.02}
                onChange={(value) => onUpdateEvolution("mutationRate", value)}
                step={0.02}
                value={config.evolution.mutationRate}
              />
              <RangeField
                label="Mutation strength"
                max={1.2}
                min={0.05}
                onChange={(value) => onUpdateEvolution("mutationStrength", value)}
                step={0.05}
                value={config.evolution.mutationStrength}
              />
              <RangeField
                label="Elites"
                max={8}
                min={1}
                onChange={(value) => onUpdateEvolution("eliteCount", value)}
                step={1}
                value={config.evolution.eliteCount}
              />
            </div>
          )}

          {config.mode === "q-learning" && (
            <div className="space-y-3">
              <SectionTitle icon={FlaskConical} title="Q-learning" />
              <RangeField
                label="Learning rate"
                max={0.8}
                min={0.05}
                onChange={(value) => onUpdateRL("learningRate", value)}
                step={0.05}
                value={config.rl.learningRate}
              />
              <RangeField
                label="Discount factor"
                max={0.99}
                min={0.5}
                onChange={(value) => onUpdateRL("discountFactor", value)}
                step={0.01}
                value={config.rl.discountFactor}
              />
              <RangeField
                label="Epsilon"
                max={1}
                min={0}
                onChange={(value) => onUpdateRL("epsilon", value)}
                step={0.02}
                value={config.rl.epsilon}
              />
              <RangeField
                label="Epsilon decay"
                max={1}
                min={0.9}
                onChange={(value) => onUpdateRL("epsilonDecay", value)}
                step={0.001}
                value={config.rl.epsilonDecay}
              />
              <RangeField
                label="Min epsilon"
                max={0.4}
                min={0}
                onChange={(value) => onUpdateRL("minEpsilon", value)}
                step={0.01}
                value={config.rl.minEpsilon}
              />
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
