"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { AgentDecision } from "@/lib/agents/base";
import { createEvolutionAgent, type EvolutionGenome } from "@/lib/agents/evolution";
import { createHeuristicAgent } from "@/lib/agents/heuristic-agent";
import { createQAgent, encodeObservation, Q_ACTIONS } from "@/lib/agents/q-learning";
import { createRandomAgent } from "@/lib/agents/random-agent";
import { createPGAgent } from "@/lib/agents/policy-gradient";
import type { PGTrajectoryStep } from "@/lib/agents/policy-gradient";
import { LAB_PRESETS, mergePreset } from "@/lib/presets";
import { DEFAULT_CONFIG } from "@/lib/sim/config";
import {
  createEpisodeRandom,
  resetWorldForEnv,
  stepWorldForEnv,
  worldToFrame,
} from "@/lib/sim/environment";
import type {
  AgentMode,
  DiscreteAction,
  EpisodeMetrics,
  EventLogEntry,
  GenerationMetrics,
  LabConfig,
  PGProgressPoint,
  QLearningProgressPoint,
  ReplayRun,
  SavedLabState,
  WorldState,
} from "@/lib/sim/types";
import {
  evolvePopulation,
  initializeEvolutionRuntime,
  type EvaluatedGenome,
  type EvolutionRuntime,
} from "@/lib/trainers/evolution-trainer";
import {
  finishQEpisode,
  initializeQRuntime,
  nextStateKey,
  updateQValue,
  type QRuntime,
} from "@/lib/trainers/q-learning-trainer";
import {
  initializePGRuntime,
  reinforce,
  type PGRuntime,
} from "@/lib/trainers/policy-gradient-trainer";
import { useEventCallback } from "@/hooks/use-event-callback";

type RunStatus = "idle" | "running" | "paused";
type TrainerView = "evaluate" | "train";
type ReplaySource = "current" | "recent" | "best" | { runId: string };

const SAVES_KEY = "agent-lab:saves";
const MAX_SAVES = 5;

function createLogEntry(
  tick: number,
  title: string,
  detail: string,
  tone: EventLogEntry["tone"] = "info",
): EventLogEntry {
  return {
    id: `${tick}-${title}-${Math.random()}`,
    tick,
    title,
    detail,
    tone,
  };
}

function buildRun(
  id: string,
  label: string,
  mode: AgentMode,
  frames: ReplayRun["frames"],
  seed: number,
): ReplayRun {
  const lastFrame = frames[frames.length - 1] ?? frames[0];

  return {
    id,
    label,
    mode,
    frames,
    totalReward: lastFrame?.totalReward ?? 0,
    score: lastFrame?.score ?? 0,
    steps: lastFrame?.tick ?? 0,
    seed,
    createdAt: Date.now(),
  };
}

function loadSavedSlots(): SavedLabState[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(SAVES_KEY);
    return raw ? (JSON.parse(raw) as SavedLabState[]) : [];
  } catch {
    return [];
  }
}

export function useAgentLab() {
  const [config, setConfig] = useState<LabConfig>(DEFAULT_CONFIG);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [trainerView, setTrainerView] = useState<TrainerView>("evaluate");
  const [manualAction, setManualAction] = useState<DiscreteAction>("right");
  const [episodeIndex, setEpisodeIndex] = useState(1);
  const [world, setWorld] = useState<WorldState>(() =>
    resetWorldForEnv(DEFAULT_CONFIG.environmentId, DEFAULT_CONFIG.environment, 1),
  );
  const [currentFrames, setCurrentFrames] = useState(() => [
    worldToFrame(resetWorldForEnv(DEFAULT_CONFIG.environmentId, DEFAULT_CONFIG.environment, 1)),
  ]);
  const [episodeMetrics, setEpisodeMetrics] = useState<EpisodeMetrics[]>([]);
  const [generationMetrics, setGenerationMetrics] = useState<GenerationMetrics[]>([]);
  const [logs, setLogs] = useState<EventLogEntry[]>([
    createLogEntry(0, "Lab ready", "Reset the arena or press start to begin.", "info"),
  ]);
  const [recentRuns, setRecentRuns] = useState<ReplayRun[]>([]);
  const [bestRun, setBestRun] = useState<ReplayRun | null>(null);
  const [selectedReplaySource, setSelectedReplaySource] = useState<ReplaySource>("current");
  const [replayFrameIndex, setReplayFrameIndex] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [lastDecision, setLastDecision] = useState<AgentDecision | null>(null);
  const [evolutionRuntime, setEvolutionRuntime] = useState<EvolutionRuntime>(() =>
    initializeEvolutionRuntime(DEFAULT_CONFIG.evolution, DEFAULT_CONFIG.environment.seed),
  );
  const [generationEvaluations, setGenerationEvaluations] = useState<EvaluatedGenome[]>([]);
  const [bestGenome, setBestGenome] = useState<EvolutionGenome | null>(null);
  const [qRuntime, setQRuntime] = useState<QRuntime>(() => initializeQRuntime(DEFAULT_CONFIG.rl));
  const [qLearningMetrics, setQLearningMetrics] = useState<QLearningProgressPoint[]>([]);
  const [pgRuntime, setPGRuntime] = useState<PGRuntime>(() =>
    initializePGRuntime(DEFAULT_CONFIG.pg, DEFAULT_CONFIG.environment.seed),
  );
  const [pgMetrics, setPGMetrics] = useState<PGProgressPoint[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("baseline");
  const [savedSlots, setSavedSlots] = useState<SavedLabState[]>(() => loadSavedSlots());

  // PG trajectory stored in a ref to avoid re-renders mid-episode
  const pgTrajectoryRef = useRef<PGTrajectoryStep[]>([]);

  const currentRun = useMemo(
    () =>
      buildRun(
        `current-${episodeIndex}`,
        "Current run",
        config.mode,
        currentFrames,
        config.environment.seed,
      ),
    [config.environment.seed, config.mode, currentFrames, episodeIndex],
  );

  const replayRun = useMemo(() => {
    if (typeof selectedReplaySource === "object" && "runId" in selectedReplaySource) {
      return recentRuns.find((r) => r.id === selectedReplaySource.runId) ?? currentRun;
    }
    if (selectedReplaySource === "best") {
      return bestRun ?? currentRun;
    }
    if (selectedReplaySource === "recent") {
      return recentRuns[0] ?? currentRun;
    }
    return currentRun;
  }, [bestRun, currentRun, recentRuns, selectedReplaySource]);

  const replayFrame = replayRun.frames[replayFrameIndex] ?? replayRun.frames[0];

  const progress = useMemo(() => {
    if (config.mode === "evolution") {
      return {
        episode: episodeIndex,
        generation: evolutionRuntime.generation,
        candidate: evolutionRuntime.currentGenomeIndex + 1,
        populationSize: evolutionRuntime.population.length,
      };
    }

    return {
      episode: episodeIndex,
      generation: null,
      candidate: null,
      populationSize: null,
    };
  }, [config.mode, episodeIndex, evolutionRuntime]);

  const resetWithConfig = useEventCallback((nextConfig: LabConfig, nextEpisodeIndex = 1) => {
    const freshWorld = resetWorldForEnv(
      nextConfig.environmentId,
      nextConfig.environment,
      nextEpisodeIndex,
    );
    setConfig(nextConfig);
    setEpisodeIndex(nextEpisodeIndex);
    setWorld(freshWorld);
    setCurrentFrames([worldToFrame(freshWorld)]);
    setRunStatus("idle");
    setTrainerView("evaluate");
    setEpisodeMetrics([]);
    setGenerationMetrics([]);
    setRecentRuns([]);
    setBestRun(null);
    setReplayFrameIndex(0);
    setReplayPlaying(false);
    setLastDecision(null);
    setLogs([
      createLogEntry(
        0,
        "Lab reset",
        "Configuration changed and simulation state was reinitialized.",
        "info",
      ),
    ]);
    setEvolutionRuntime(
      initializeEvolutionRuntime(nextConfig.evolution, nextConfig.environment.seed),
    );
    setGenerationEvaluations([]);
    setBestGenome(null);
    setQRuntime(initializeQRuntime(nextConfig.rl));
    setQLearningMetrics([]);
    setPGRuntime(initializePGRuntime(nextConfig.pg, nextConfig.environment.seed));
    setPGMetrics([]);
    pgTrajectoryRef.current = [];
  });

  const recordRun = useEventCallback((label: string, mode: AgentMode, frames: ReplayRun["frames"]) => {
    const run = buildRun(
      `${mode}-${episodeIndex}-${Date.now()}`,
      label,
      mode,
      frames,
      config.environment.seed,
    );

    startTransition(() => {
      setEpisodeMetrics((previous) => [
        ...previous,
        (() => {
          const reward = run.totalReward;
          const nextMetricIndex = previous.length + 1;
          const windowRewards = [...previous.slice(-7).map((metric) => metric.reward), reward];
          const movingAverage =
            windowRewards.reduce((sum, value) => sum + value, 0) /
            Math.max(1, windowRewards.length);

          return {
            episode: nextMetricIndex,
            mode,
            reward,
            score: run.score,
            steps: run.steps,
            movingAverage,
          };
        })(),
      ]);
      setRecentRuns((previous) => [run, ...previous].slice(0, 8));
      setBestRun((previous) =>
        !previous || run.totalReward >= previous.totalReward ? run : previous,
      );

      if (mode === "q-learning") {
        setQLearningMetrics((previous) => {
          const reward = run.totalReward;
          const nextEpisode = previous.length + 1;
          const rewardWindow = [...previous.slice(-9).map((metric) => metric.reward), reward];
          const movingAverage =
            rewardWindow.reduce((sum, value) => sum + value, 0) /
            Math.max(1, rewardWindow.length);
          const lastFrame = frames[frames.length - 1];

          return [
            ...previous,
            {
              episode: nextEpisode,
              reward,
              movingAverage,
              score: run.score,
              steps: run.steps,
              epsilon: trainerView === "train" ? qRuntime.epsilon : 0,
              stateCount: Object.keys(qRuntime.qValues).length,
              terminationReason: lastFrame?.terminationReason ?? null,
              view: trainerView,
            },
          ];
        });
      }
    });
  });

  const logStep = useEventCallback((state: WorldState, decision: AgentDecision) => {
    const entries: EventLogEntry[] = [
      createLogEntry(
        state.tick,
        "Action",
        `${decision.action} | reward ${state.lastReward.toFixed(2)} | total ${state.totalReward.toFixed(2)}`,
        state.lastReward >= 0 ? "good" : "info",
      ),
    ];

    if (state.lastRewardBreakdown.food > 0) {
      entries.unshift(
        createLogEntry(state.tick, "Food collected", "Target reached and respawned.", "good"),
      );
    }

    if (state.done) {
      entries.unshift(
        createLogEntry(
          state.tick,
          "Episode ended",
          state.terminationReason ?? "terminal condition",
          state.terminationReason === "hazard collision" ||
            state.terminationReason === "wall collision"
            ? "bad"
            : "info",
        ),
      );
    }

    setLogs((previous) => [...entries, ...previous].slice(0, 80));
  });

  const resetEpisode = useEventCallback((nextEpisodeIndex = episodeIndex + 1) => {
    const freshWorld = resetWorldForEnv(
      config.environmentId,
      config.environment,
      nextEpisodeIndex,
    );
    setEpisodeIndex(nextEpisodeIndex);
    setWorld(freshWorld);
    setCurrentFrames([worldToFrame(freshWorld)]);
    setReplayFrameIndex(0);
    setLastDecision(null);
    pgTrajectoryRef.current = [];
  });

  const decideAction = useEventCallback(
    (
      mode: AgentMode,
      currentWorld: WorldState,
      overrideAction?: DiscreteAction,
    ): AgentDecision => {
      if (mode === "manual") {
        return {
          action: overrideAction ?? manualAction,
          reasoning: "Manual control from keyboard or directional pad.",
        };
      }

      if (mode === "random") {
        return createRandomAgent(config.environment, episodeIndex).decide({
          observation: currentWorld.observation,
          state: currentWorld,
        });
      }

      if (mode === "heuristic") {
        return createHeuristicAgent(config.environment).decide({
          observation: currentWorld.observation,
          state: currentWorld,
        });
      }

      if (mode === "evolution") {
        const genome =
          trainerView === "train"
            ? evolutionRuntime.population[evolutionRuntime.currentGenomeIndex]
            : bestGenome ?? evolutionRuntime.population[0];

        return createEvolutionAgent(genome ?? evolutionRuntime.population[0]!).decide({
          observation: currentWorld.observation,
          state: currentWorld,
        });
      }

      if (mode === "policy-gradient") {
        const rng = createEpisodeRandom(
          config.environment,
          episodeIndex * 733 + currentWorld.tick + 1,
        );
        return createPGAgent(pgRuntime.network, pgTrajectoryRef, rng.next()).decide({
          observation: currentWorld.observation,
          state: currentWorld,
        });
      }

      // q-learning
      const stateKey = encodeObservation(currentWorld.observation);
      const rng = createEpisodeRandom(
        config.environment,
        episodeIndex * 733 + currentWorld.tick + 1,
      );
      return createQAgent(
        qRuntime.qValues,
        trainerView === "train" ? qRuntime.epsilon : 0,
        rng.next(),
        stateKey,
      ).decide({
        observation: currentWorld.observation,
        state: currentWorld,
      });
    },
  );

  const advanceStep = useEventCallback((overrideAction?: DiscreteAction) => {
    const decision = decideAction(config.mode, world, overrideAction);
    const nextWorld = stepWorldForEnv(
      config.environmentId,
      world,
      decision.action,
      config.environment,
      episodeIndex,
    );
    const nextFrame = worldToFrame(nextWorld);
    const nextFrames = [...currentFrames, nextFrame];

    setWorld(nextWorld);
    setCurrentFrames(nextFrames);
    setLastDecision(decision);
    logStep(nextWorld, decision);

    // Update PG trajectory with the reward earned this step
    if (config.mode === "policy-gradient") {
      const traj = pgTrajectoryRef.current;
      if (traj.length > 0) {
        traj[traj.length - 1]!.reward = nextWorld.lastReward;
      }
    }

    if (config.mode === "q-learning" && trainerView === "train") {
      const stateKey = nextStateKey(world.observation);
      const actionIndex = Q_ACTIONS.indexOf(decision.action);
      setQRuntime((previous) => {
        const runtime = {
          ...previous,
          qValues: { ...previous.qValues },
        };
        updateQValue(
          runtime,
          stateKey,
          actionIndex,
          nextWorld.lastReward,
          nextWorld.observation,
          config.rl,
        );
        return runtime;
      });
    }

    if (!nextWorld.done) {
      return;
    }

    recordRun(
      config.mode === "manual" ? "Manual rollout" : `${config.mode} rollout`,
      config.mode,
      nextFrames,
    );

    if (config.mode === "evolution" && trainerView === "train") {
      const evaluatedGenome: EvaluatedGenome = {
        ...(evolutionRuntime.population[evolutionRuntime.currentGenomeIndex] ??
          evolutionRuntime.population[0]!),
        fitness: nextWorld.totalReward,
        score: nextWorld.score,
        steps: nextWorld.tick,
      };
      const nextEvaluations = [...generationEvaluations, evaluatedGenome];
      setGenerationEvaluations(nextEvaluations);

      if (!bestGenome || evaluatedGenome.fitness >= (bestRun?.totalReward ?? -Infinity)) {
        setBestGenome(evaluatedGenome);
      }

      if (evolutionRuntime.currentGenomeIndex + 1 >= evolutionRuntime.population.length) {
        const evolved = evolvePopulation(
          nextEvaluations,
          config.evolution,
          config.environment.seed + evolutionRuntime.generation * 97,
          evolutionRuntime.generation,
        );
        startTransition(() => {
          setGenerationMetrics((previous) => [...previous, evolved.metrics]);
          setEvolutionRuntime(evolved.runtime);
          setGenerationEvaluations([]);
        });
      } else {
        setEvolutionRuntime((previous) => ({
          ...previous,
          currentGenomeIndex: previous.currentGenomeIndex + 1,
        }));
      }

      resetEpisode(episodeIndex + 1);
      return;
    }

    if (config.mode === "q-learning" && trainerView === "train") {
      setQRuntime((previous) => {
        const runtime = {
          ...previous,
          qValues: { ...previous.qValues },
        };
        finishQEpisode(runtime, config.rl);
        return runtime;
      });
      resetEpisode(episodeIndex + 1);
      return;
    }

    if (config.mode === "policy-gradient" && trainerView === "train") {
      const trajectory = [...pgTrajectoryRef.current];
      const episodeReward = nextWorld.totalReward;
      const episodeScore = nextWorld.score;
      const episodeSteps = nextWorld.tick;
      const returnEstimate = trajectory.reduce((sum, s) => sum + s.reward, 0);

      setPGRuntime((previous) => reinforce(previous, trajectory, config.pg));
      setPGMetrics((prev) => {
        const window = [...prev.slice(-9).map((m) => m.reward), episodeReward];
        const movingAverage =
          window.reduce((a, b) => a + b, 0) / Math.max(1, window.length);
        return [
          ...prev,
          {
            episode: prev.length + 1,
            reward: episodeReward,
            movingAverage,
            score: episodeScore,
            steps: episodeSteps,
            returnEstimate,
          },
        ];
      });
      resetEpisode(episodeIndex + 1);
      return;
    }

    if (runStatus === "running") {
      resetEpisode(episodeIndex + 1);
    } else {
      setRunStatus("paused");
    }
  });

  const tick = useEventCallback(() => {
    advanceStep();
  });

  useEffect(() => {
    if (runStatus !== "running") {
      return;
    }

    // Depend on full world snapshot so tick-0 → tick-0 resets reschedule correctly.
    const timer = window.setTimeout(() => {
      tick();
    }, config.tickMs);

    return () => window.clearTimeout(timer);
  }, [config.tickMs, runStatus, tick, world]);

  useEffect(() => {
    if (!replayPlaying || replayRun.frames.length <= 1) {
      return;
    }

    const intervalMs = Math.round(120 / replaySpeed);
    const timer = window.setTimeout(() => {
      setReplayFrameIndex((previous) =>
        previous + 1 >= replayRun.frames.length ? 0 : previous + 1,
      );
    }, intervalMs);

    return () => window.clearTimeout(timer);
  }, [replayPlaying, replayRun.frames.length, replayFrameIndex, replaySpeed]);

  const applyPreset = useEventCallback((presetId: string) => {
    const preset = LAB_PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }

    setSelectedPresetId(presetId);
    resetWithConfig(mergePreset(DEFAULT_CONFIG, preset.config));
  });

  const setMode = useEventCallback((mode: AgentMode) => {
    resetWithConfig({ ...config, mode }, 1);
  });

  const setTickMs = useEventCallback((tickMs: number) => {
    resetWithConfig({ ...config, tickMs }, episodeIndex);
  });

  const updateEnvironment = useEventCallback(
    <K extends keyof LabConfig["environment"]>(key: K, value: LabConfig["environment"][K]) => {
      resetWithConfig(
        {
          ...config,
          environment: {
            ...config.environment,
            [key]: value,
          },
        },
        1,
      );
    },
  );

  const updateReward = useEventCallback(
    <K extends keyof LabConfig["environment"]["rewards"]>(
      key: K,
      value: LabConfig["environment"]["rewards"][K],
    ) => {
      resetWithConfig(
        {
          ...config,
          environment: {
            ...config.environment,
            rewards: {
              ...config.environment.rewards,
              [key]: value,
            },
          },
        },
        1,
      );
    },
  );

  const updateEvolution = useEventCallback(
    <K extends keyof LabConfig["evolution"]>(key: K, value: LabConfig["evolution"][K]) => {
      resetWithConfig(
        {
          ...config,
          evolution: {
            ...config.evolution,
            [key]: value,
          },
        },
        1,
      );
    },
  );

  const updateRL = useEventCallback(
    <K extends keyof LabConfig["rl"]>(key: K, value: LabConfig["rl"][K]) => {
      resetWithConfig(
        {
          ...config,
          rl: {
            ...config.rl,
            [key]: value,
          },
        },
        1,
      );
    },
  );

  const updatePG = useEventCallback(
    <K extends keyof LabConfig["pg"]>(key: K, value: LabConfig["pg"][K]) => {
      resetWithConfig(
        {
          ...config,
          pg: {
            ...config.pg,
            [key]: value,
          },
        },
        1,
      );
    },
  );

  const updateEnvironmentId = useEventCallback((environmentId: string) => {
    resetWithConfig({ ...config, environmentId }, 1);
  });

  // Save / Load

  const saveState = useEventCallback((label: string) => {
    const saved: SavedLabState = {
      version: 1,
      label: label || `${config.mode} · ${new Date().toLocaleString()}`,
      savedAt: Date.now(),
      config,
      qValues: { ...qRuntime.qValues },
      population: evolutionRuntime.population.map((g) => ({
        id: g.id,
        weights: g.weights.map((row) => [...row]),
        biases: [...g.biases],
      })),
      episodeMetrics: [...episodeMetrics],
      generationMetrics: [...generationMetrics],
    };

    const current = loadSavedSlots();
    const next = [saved, ...current].slice(0, MAX_SAVES);
    try {
      localStorage.setItem(SAVES_KEY, JSON.stringify(next));
      setSavedSlots(next);
    } catch {
      // Storage full or unavailable
    }
  });

  const loadState = useEventCallback((saved: SavedLabState) => {
    resetWithConfig(saved.config, 1);
    startTransition(() => {
      setQRuntime((prev) => ({ ...prev, qValues: { ...saved.qValues } }));
      setEvolutionRuntime((prev) => ({ ...prev, population: saved.population }));
      setEpisodeMetrics(saved.episodeMetrics);
      setGenerationMetrics(saved.generationMetrics);
    });
  });

  const downloadState = useEventCallback(() => {
    const saved: SavedLabState = {
      version: 1,
      label: `${config.mode} · ${new Date().toLocaleString()}`,
      savedAt: Date.now(),
      config,
      qValues: { ...qRuntime.qValues },
      population: evolutionRuntime.population.map((g) => ({
        id: g.id,
        weights: g.weights.map((row) => [...row]),
        biases: [...g.biases],
      })),
      episodeMetrics: [...episodeMetrics],
      generationMetrics: [...generationMetrics],
    };

    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `agent-lab-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  });

  const importStateFromFile = useEventCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as SavedLabState;
        if (parsed.version !== 1) return;
        loadState(parsed);
        const current = loadSavedSlots();
        const next = [parsed, ...current].slice(0, MAX_SAVES);
        localStorage.setItem(SAVES_KEY, JSON.stringify(next));
        setSavedSlots(next);
      } catch {
        // Invalid file — ignore silently
      }
    };
    reader.readAsText(file);
  });

  const deleteSavedSlot = useEventCallback((savedAt: number) => {
    const next = loadSavedSlots().filter((s) => s.savedAt !== savedAt);
    localStorage.setItem(SAVES_KEY, JSON.stringify(next));
    setSavedSlots(next);
  });

  const seekToEnd = useEventCallback(() => {
    setReplayFrameIndex(Math.max(0, replayRun.frames.length - 1));
  });

  const replaySummaries = useMemo(
    () => ({
      current: currentRun,
      recent: recentRuns[0] ?? null,
      best: bestRun,
    }),
    [bestRun, currentRun, recentRuns],
  );

  return {
    config,
    runStatus,
    trainerView,
    manualAction,
    world,
    currentFrames,
    episodeMetrics,
    generationMetrics,
    logs,
    recentRuns,
    bestRun,
    replayRun,
    replayFrame,
    replayFrameIndex,
    replayPlaying,
    replaySpeed,
    replaySummaries,
    lastDecision,
    progress,
    qRuntime,
    qLearningMetrics,
    evolutionRuntime,
    generationEvaluations,
    pgRuntime,
    pgMetrics,
    selectedPresetId,
    savedSlots,
    setMode,
    setTickMs,
    updateEnvironment,
    updateReward,
    updateEvolution,
    updateRL,
    updatePG,
    updateEnvironmentId,
    setTrainerView,
    setManualAction,
    setSelectedReplaySource,
    setReplayFrameIndex,
    setReplayPlaying,
    setReplaySpeed,
    seekToEnd,
    saveState,
    loadState,
    downloadState,
    importStateFromFile,
    deleteSavedSlot,
    applyPreset,
    stepOnce: advanceStep,
    resetEpisode,
    resetLab: () => resetWithConfig(config, 1),
    toggleRun: () =>
      setRunStatus((previous) => (previous === "running" ? "paused" : "running")),
    runOneManualStep: (action: DiscreteAction) => {
      setManualAction(action);
      advanceStep(action);
    },
  };
}
