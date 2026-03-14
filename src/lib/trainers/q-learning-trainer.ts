import { clamp } from "@/lib/utils";
import { Q_ACTIONS, encodeObservation } from "@/lib/agents/q-learning";
import type { Observation, RLConfig } from "@/lib/sim/types";

export interface QRuntime {
  qValues: Record<string, number[]>;
  epsilon: number;
  episodes: number;
  lastStateKey: string;
}

export function initializeQRuntime(config: RLConfig): QRuntime {
  return {
    qValues: {},
    epsilon: config.epsilon,
    episodes: 0,
    lastStateKey: "",
  };
}

export function getQValues(runtime: QRuntime, stateKey: string) {
  if (!runtime.qValues[stateKey]) {
    runtime.qValues[stateKey] = Array.from({ length: Q_ACTIONS.length }, () => 0);
  }

  return runtime.qValues[stateKey]!;
}

export function nextStateKey(observation: Observation) {
  return encodeObservation(observation);
}

export function updateQValue(
  runtime: QRuntime,
  stateKey: string,
  actionIndex: number,
  reward: number,
  nextObservation: Observation,
  config: RLConfig,
) {
  const current = getQValues(runtime, stateKey);
  const nextKey = nextStateKey(nextObservation);
  const nextValues = getQValues(runtime, nextKey);
  const bestNext = Math.max(...nextValues);
  current[actionIndex] =
    current[actionIndex]! +
    config.learningRate * (reward + config.discountFactor * bestNext - current[actionIndex]!);
  runtime.lastStateKey = nextKey;
}

export function finishQEpisode(runtime: QRuntime, config: RLConfig) {
  runtime.episodes += 1;
  runtime.epsilon = clamp(runtime.epsilon * config.epsilonDecay, config.minEpsilon, 1);
}
