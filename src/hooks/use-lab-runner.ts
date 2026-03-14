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
import { createPGAgent, type PGTrajectoryStep } from "@/lib/agents/policy-gradient";
import {
  createEpisodeRandom,
  resetWorldForEnv,
  stepWorldForEnv,
  worldToFrame,
} from "@/lib/sim/environment";
import type {
  AgentMode,
  EpisodeMetrics,
  LabConfig,
  ReplayRun,
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

export interface LabRunnerState {
  mode: AgentMode;
  runStatus: RunStatus;
  trainerView: TrainerView;
  world: WorldState;
  currentFrames: ReplayRun["frames"];
  episodeMetrics: EpisodeMetrics[];
  episodeIndex: number;
  lastDecision: AgentDecision | null;
  qRuntime: QRuntime;
  pgRuntime: PGRuntime;
  evolutionRuntime: EvolutionRuntime;
  bestRun: ReplayRun | null;
  setMode: (mode: AgentMode) => void;
  setTrainerView: (view: TrainerView) => void;
  toggleRun: () => void;
  reset: () => void;
  stepOnce: () => void;
}

export function useLabRunner(config: LabConfig, initialMode: AgentMode): LabRunnerState {
  const [mode, setMode] = useState<AgentMode>(initialMode);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [trainerView, setTrainerView] = useState<TrainerView>("train");
  const [episodeIndex, setEpisodeIndex] = useState(1);
  const [world, setWorld] = useState<WorldState>(() =>
    resetWorldForEnv(config.environmentId, config.environment, 1),
  );
  const [currentFrames, setCurrentFrames] = useState(() => [
    worldToFrame(resetWorldForEnv(config.environmentId, config.environment, 1)),
  ]);
  const [episodeMetrics, setEpisodeMetrics] = useState<EpisodeMetrics[]>([]);
  const [lastDecision, setLastDecision] = useState<AgentDecision | null>(null);
  const [evolutionRuntime, setEvolutionRuntime] = useState<EvolutionRuntime>(() =>
    initializeEvolutionRuntime(config.evolution, config.environment.seed),
  );
  const [generationEvaluations, setGenerationEvaluations] = useState<EvaluatedGenome[]>([]);
  const [bestGenome, setBestGenome] = useState<EvolutionGenome | null>(null);
  const [qRuntime, setQRuntime] = useState<QRuntime>(() => initializeQRuntime(config.rl));
  const [pgRuntime, setPGRuntime] = useState<PGRuntime>(() =>
    initializePGRuntime(config.pg, config.environment.seed),
  );
  const [bestRun, setBestRun] = useState<ReplayRun | null>(null);

  const pgTrajectoryRef = useRef<PGTrajectoryStep[]>([]);

  // Reset when config reference changes
  useEffect(() => {
    const freshWorld = resetWorldForEnv(config.environmentId, config.environment, 1);
    setEpisodeIndex(1);
    setWorld(freshWorld);
    setCurrentFrames([worldToFrame(freshWorld)]);
    setRunStatus("idle");
    setTrainerView("train");
    setEpisodeMetrics([]);
    setLastDecision(null);
    setEvolutionRuntime(initializeEvolutionRuntime(config.evolution, config.environment.seed));
    setGenerationEvaluations([]);
    setBestGenome(null);
    setQRuntime(initializeQRuntime(config.rl));
    setPGRuntime(initializePGRuntime(config.pg, config.environment.seed));
    setBestRun(null);
    pgTrajectoryRef.current = [];
  }, [config]);

  const recordRun = useEventCallback((label: string, m: AgentMode, frames: ReplayRun["frames"]) => {
    const run = buildRun(
      `runner-${m}-${Date.now()}`,
      label,
      m,
      frames,
      config.environment.seed,
    );

    startTransition(() => {
      setEpisodeMetrics((previous) => {
        const reward = run.totalReward;
        const windowRewards = [...previous.slice(-7).map((ep) => ep.reward), reward];
        const movingAverage =
          windowRewards.reduce((sum, v) => sum + v, 0) / Math.max(1, windowRewards.length);
        return [
          ...previous,
          {
            episode: previous.length + 1,
            mode: m,
            reward,
            score: run.score,
            steps: run.steps,
            movingAverage,
          },
        ];
      });
      setBestRun((previous) =>
        !previous || run.totalReward >= previous.totalReward ? run : previous,
      );
    });
  });

  const resetEpisode = useEventCallback((nextIndex: number) => {
    const freshWorld = resetWorldForEnv(config.environmentId, config.environment, nextIndex);
    setEpisodeIndex(nextIndex);
    setWorld(freshWorld);
    setCurrentFrames([worldToFrame(freshWorld)]);
    setLastDecision(null);
    pgTrajectoryRef.current = [];
  });

  const decideAction = useEventCallback((currentWorld: WorldState): AgentDecision => {
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

    if (mode === "q-learning") {
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
    }

    // manual / fallback: random
    return createRandomAgent(config.environment, episodeIndex).decide({
      observation: currentWorld.observation,
      state: currentWorld,
    });
  });

  const advanceStep = useEventCallback(() => {
    const decision = decideAction(world);
    const nextWorld = stepWorldForEnv(
      config.environmentId,
      world,
      decision.action,
      config.environment,
      episodeIndex,
    );
    const nextFrames = [...currentFrames, worldToFrame(nextWorld)];

    setWorld(nextWorld);
    setCurrentFrames(nextFrames);
    setLastDecision(decision);

    if (mode === "policy-gradient") {
      const traj = pgTrajectoryRef.current;
      if (traj.length > 0) {
        traj[traj.length - 1]!.reward = nextWorld.lastReward;
      }
    }

    if (mode === "q-learning" && trainerView === "train") {
      const stateKey = nextStateKey(world.observation);
      const actionIndex = Q_ACTIONS.indexOf(decision.action);
      setQRuntime((prev) => {
        const runtime = { ...prev, qValues: { ...prev.qValues } };
        updateQValue(runtime, stateKey, actionIndex, nextWorld.lastReward, nextWorld.observation, config.rl);
        return runtime;
      });
    }

    if (!nextWorld.done) return;

    recordRun(`${mode} rollout`, mode, nextFrames);

    if (mode === "evolution" && trainerView === "train") {
      const evaluated: EvaluatedGenome = {
        ...(evolutionRuntime.population[evolutionRuntime.currentGenomeIndex] ??
          evolutionRuntime.population[0]!),
        fitness: nextWorld.totalReward,
        score: nextWorld.score,
        steps: nextWorld.tick,
      };
      const nextEvals = [...generationEvaluations, evaluated];
      setGenerationEvaluations(nextEvals);

      if (!bestGenome || evaluated.fitness >= (bestRun?.totalReward ?? -Infinity)) {
        setBestGenome(evaluated);
      }

      if (evolutionRuntime.currentGenomeIndex + 1 >= evolutionRuntime.population.length) {
        const evolved = evolvePopulation(
          nextEvals,
          config.evolution,
          config.environment.seed + evolutionRuntime.generation * 97,
          evolutionRuntime.generation,
        );
        startTransition(() => {
          setEvolutionRuntime(evolved.runtime);
          setGenerationEvaluations([]);
        });
      } else {
        setEvolutionRuntime((prev) => ({
          ...prev,
          currentGenomeIndex: prev.currentGenomeIndex + 1,
        }));
      }
      resetEpisode(episodeIndex + 1);
      return;
    }

    if (mode === "q-learning" && trainerView === "train") {
      setQRuntime((prev) => {
        const runtime = { ...prev, qValues: { ...prev.qValues } };
        finishQEpisode(runtime, config.rl);
        return runtime;
      });
      resetEpisode(episodeIndex + 1);
      return;
    }

    if (mode === "policy-gradient" && trainerView === "train") {
      const trajectory = [...pgTrajectoryRef.current];
      setPGRuntime((prev) => reinforce(prev, trajectory, config.pg));
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
    if (runStatus !== "running") return;
    const timer = window.setTimeout(() => {
      tick();
    }, config.tickMs);
    return () => window.clearTimeout(timer);
  }, [config.tickMs, runStatus, tick, world]);

  const handleSetMode = useEventCallback((nextMode: AgentMode) => {
    setMode(nextMode);
    // Reset runtimes on mode switch
    const freshWorld = resetWorldForEnv(config.environmentId, config.environment, 1);
    setEpisodeIndex(1);
    setWorld(freshWorld);
    setCurrentFrames([worldToFrame(freshWorld)]);
    setRunStatus("idle");
    setEpisodeMetrics([]);
    setLastDecision(null);
    setBestRun(null);
    pgTrajectoryRef.current = [];
  });

  const reset = useEventCallback(() => {
    const freshWorld = resetWorldForEnv(config.environmentId, config.environment, 1);
    setEpisodeIndex(1);
    setWorld(freshWorld);
    setCurrentFrames([worldToFrame(freshWorld)]);
    setRunStatus("idle");
    setEpisodeMetrics([]);
    setLastDecision(null);
    setEvolutionRuntime(initializeEvolutionRuntime(config.evolution, config.environment.seed));
    setGenerationEvaluations([]);
    setBestGenome(null);
    setQRuntime(initializeQRuntime(config.rl));
    setPGRuntime(initializePGRuntime(config.pg, config.environment.seed));
    setBestRun(null);
    pgTrajectoryRef.current = [];
  });

  return useMemo(
    () => ({
      mode,
      runStatus,
      trainerView,
      world,
      currentFrames,
      episodeMetrics,
      episodeIndex,
      lastDecision,
      qRuntime,
      pgRuntime,
      evolutionRuntime,
      bestRun,
      setMode: handleSetMode,
      setTrainerView,
      toggleRun: () =>
        setRunStatus((prev) => (prev === "running" ? "paused" : "running")),
      reset,
      stepOnce: advanceStep,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      mode, runStatus, trainerView, world, currentFrames, episodeMetrics,
      episodeIndex, lastDecision, qRuntime, pgRuntime, evolutionRuntime, bestRun,
    ],
  );
}
