"use client";

import { useEffect, useState } from "react";

import { ComparisonPanel } from "@/components/comparison-panel";
import { ControlsPanel } from "@/components/controls-panel";
import { LabHeader } from "@/components/lab-header";
import { MetricsPanel } from "@/components/metrics-panel";
import { Panel } from "@/components/panel";
import { ReplayPanel } from "@/components/replay-panel";
import { SimulationCanvas } from "@/components/simulation-canvas";
import { useAgentLab } from "@/hooks/use-agent-lab";
import { formatNumber } from "@/lib/utils";

const KEY_ACTIONS = new Map([
  ["ArrowUp", "up"],
  ["KeyW", "up"],
  ["ArrowDown", "down"],
  ["KeyS", "down"],
  ["ArrowLeft", "left"],
  ["KeyA", "left"],
  ["ArrowRight", "right"],
  ["KeyD", "right"],
  ["Space", "stay"],
]);

export default function Home() {
  const lab = useAgentLab();
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (showComparison) return;
      const action = KEY_ACTIONS.get(event.code);
      if (!action || lab.config.mode !== "manual") {
        return;
      }

      event.preventDefault();
      lab.runOneManualStep(action as "up" | "down" | "left" | "right" | "stay");
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lab, showComparison]);

  return (
    <main className="mx-auto max-w-[1800px] px-4 py-5 lg:px-6">
      <div className="space-y-5">
        <LabHeader
          mode={lab.config.mode}
          onReset={lab.resetLab}
          onStep={() => lab.stepOnce()}
          onToggleComparison={() => setShowComparison((prev) => !prev)}
          onToggleRun={lab.toggleRun}
          progress={lab.progress}
          runStatus={lab.runStatus}
          showComparison={showComparison}
          trainerView={lab.trainerView}
          wikiHref="/wiki"
          world={lab.world}
        />

        {showComparison ? (
          <ComparisonPanel config={lab.config} />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[340px,minmax(0,1fr),420px]">
            <ControlsPanel
              config={lab.config}
              manualAction={lab.manualAction}
              onApplyPreset={lab.applyPreset}
              onDeleteSavedSlot={lab.deleteSavedSlot}
              onDownloadState={lab.downloadState}
              onImportStateFromFile={lab.importStateFromFile}
              onLoadState={lab.loadState}
              onManualAction={lab.setManualAction}
              onSaveState={lab.saveState}
              onSetMode={lab.setMode}
              onSetTickMs={lab.setTickMs}
              onSetTrainerView={lab.setTrainerView}
              onUpdateEnvironment={lab.updateEnvironment}
              onUpdateEnvironmentId={lab.updateEnvironmentId}
              onUpdateEvolution={lab.updateEvolution}
              onUpdatePG={lab.updatePG}
              onUpdateReward={lab.updateReward}
              onUpdateRL={lab.updateRL}
              savedSlots={lab.savedSlots}
              selectedPresetId={lab.selectedPresetId}
              trainerView={lab.trainerView}
            />

            <div className="space-y-4">
              <Panel
                subtitle="The live arena stays central while internals remain one glance away."
                title="Viewport"
              >
                <div className="rounded-[28px] border border-white/8 bg-slate-950/70 p-3">
                  <SimulationCanvas
                    className="overflow-hidden rounded-[24px] border border-white/8"
                    history={lab.currentFrames}
                    world={lab.world}
                  />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/8 bg-slate-950/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last action</p>
                    <p className="mt-2 text-lg font-semibold text-white">{lab.world.lastAction}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-slate-950/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Distance to food</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatNumber(lab.world.observation.distanceToFood)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-slate-950/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Manual controls</p>
                    <p className="mt-2 text-sm text-slate-300">
                      Arrow keys / WASD. Space maps to stay.
                    </p>
                  </div>
                </div>
              </Panel>
            </div>

            <MetricsPanel
              episodeMetrics={lab.episodeMetrics}
              generationMetrics={lab.generationMetrics}
              lastDecision={lab.lastDecision}
              logs={lab.logs}
              mode={lab.config.mode}
              pgMetrics={lab.pgMetrics}
              pgRuntime={lab.pgRuntime}
              qLearningMetrics={lab.qLearningMetrics}
              qRuntime={lab.qRuntime}
              world={lab.world}
            />
          </div>
        )}

        <ReplayPanel
          onSelectSource={lab.setSelectedReplaySource}
          onSetFrameIndex={lab.setReplayFrameIndex}
          onSetReplayPlaying={lab.setReplayPlaying}
          onSetReplaySpeed={lab.setReplaySpeed}
          onSeekToEnd={lab.seekToEnd}
          recentRuns={lab.recentRuns}
          replayFrame={lab.replayFrame}
          replayFrameIndex={lab.replayFrameIndex}
          replayPlaying={lab.replayPlaying}
          replayRun={lab.replayRun}
          replaySpeed={lab.replaySpeed}
          summaries={lab.replaySummaries}
        />
      </div>
    </main>
  );
}
