"use client";

import { useRef, type ChangeEvent } from "react";
import { Download, FlaskConical, FolderOpen, Save, SlidersHorizontal, Sparkles, Trash2 } from "lucide-react";

import { Panel } from "@/components/panel";
import { LAB_PRESETS } from "@/lib/presets";
import { ENVIRONMENTS } from "@/lib/environments/index";
import { cn, formatNumber } from "@/lib/utils";
import type { AgentMode, LabConfig, SavedLabState } from "@/lib/sim/types";

interface ControlsPanelProps {
  config: LabConfig;
  trainerView: "evaluate" | "train";
  manualAction: string;
  selectedPresetId: string;
  savedSlots: SavedLabState[];
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
  onUpdatePG: <K extends keyof LabConfig["pg"]>(
    key: K,
    value: LabConfig["pg"][K],
  ) => void;
  onUpdateEnvironmentId: (id: string) => void;
  onManualAction: (action: "up" | "down" | "left" | "right" | "stay") => void;
  onSaveState: (label: string) => void;
  onLoadState: (saved: SavedLabState) => void;
  onDownloadState: () => void;
  onImportStateFromFile: (file: File) => void;
  onDeleteSavedSlot: (savedAt: number) => void;
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
  savedSlots,
  onApplyPreset,
  onSetMode,
  onSetTrainerView,
  onSetTickMs,
  onUpdateEnvironment,
  onUpdateReward,
  onUpdateEvolution,
  onUpdateRL,
  onUpdatePG,
  onUpdateEnvironmentId,
  onManualAction,
  onSaveState,
  onLoadState,
  onDownloadState,
  onImportStateFromFile,
  onDeleteSavedSlot,
}: ControlsPanelProps) {
  const modes: AgentMode[] = ["manual", "random", "heuristic", "evolution", "q-learning", "policy-gradient"];
  const saveLabelRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                  {mode === "policy-gradient" ? "PG" : mode}
                </button>
              ))}
            </div>
            {(config.mode === "evolution" ||
              config.mode === "q-learning" ||
              config.mode === "policy-gradient") && (
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
            <div className="grid grid-cols-3 gap-2">
              {ENVIRONMENTS.map((env) => (
                <button
                  className={cn(
                    "rounded-2xl border px-2 py-2 text-xs font-medium transition",
                    config.environmentId === env.id
                      ? "border-accent-400 bg-accent-500/10 text-white"
                      : "border-white/8 bg-slate-950/50 text-slate-300 hover:bg-white/[0.04]",
                  )}
                  key={env.id}
                  onClick={() => onUpdateEnvironmentId(env.id)}
                  title={env.description}
                  type="button"
                >
                  {env.label}
                </button>
              ))}
            </div>
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

          {config.mode === "policy-gradient" && (
            <div className="space-y-3">
              <SectionTitle icon={FlaskConical} title="Policy Gradient" />
              <RangeField
                label="Learning rate"
                max={0.05}
                min={0.0001}
                onChange={(value) => onUpdatePG("learningRate", value)}
                step={0.0001}
                value={config.pg.learningRate}
              />
              <RangeField
                label="Discount factor"
                max={0.999}
                min={0.8}
                onChange={(value) => onUpdatePG("discountFactor", value)}
                step={0.001}
                value={config.pg.discountFactor}
              />
              <RangeField
                label="Hidden size"
                max={64}
                min={8}
                onChange={(value) => onUpdatePG("hiddenSize", value)}
                step={8}
                value={config.pg.hiddenSize}
              />
              <RangeField
                label="Entropy bonus"
                max={0.1}
                min={0}
                onChange={(value) => onUpdatePG("entropyBonus", value)}
                step={0.005}
                value={config.pg.entropyBonus}
              />
            </div>
          )}

          <div className="space-y-3">
            <SectionTitle icon={Save} title="Save / Load" />
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-accent-400"
                placeholder="Save label…"
                ref={saveLabelRef}
                type="text"
              />
              <button
                className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                onClick={() => onSaveState(saveLabelRef.current?.value ?? "")}
                title="Save to local slot"
                type="button"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                onClick={onDownloadState}
                title="Download as JSON"
                type="button"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
            <div>
              <input
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImportStateFromFile(file);
                  e.target.value = "";
                }}
                ref={fileInputRef}
                type="file"
              />
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <FolderOpen className="h-4 w-4" />
                Import from file
              </button>
            </div>
            {savedSlots.length > 0 && (
              <div className="space-y-2">
                {savedSlots.map((slot) => (
                  <div
                    className="flex items-center gap-2 rounded-2xl border border-white/8 bg-slate-950/60 px-3 py-2"
                    key={slot.savedAt}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{slot.label}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(slot.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                      onClick={() => onLoadState(slot)}
                      type="button"
                    >
                      Load
                    </button>
                    <button
                      className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-1 text-slate-500 transition hover:text-rose-400"
                      onClick={() => onDeleteSavedSlot(slot.savedAt)}
                      title="Delete save"
                      type="button"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
