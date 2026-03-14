// Policy Gradient agent — 2-layer neural network policy for REINFORCE.
// Network: obs(9) → hidden(hiddenSize, ReLU) → logits(5) → softmax → action probs.

import type { AgentDecision, AgentModel } from "@/lib/agents/base";
import type { DiscreteAction, Observation, PGConfig } from "@/lib/sim/types";
import { createSeededRandom } from "@/lib/random";
import { observationVector } from "@/lib/agents/evolution";

export interface PolicyNetwork {
  w1: number[][];  // [hiddenSize × obsSize]
  b1: number[];    // [hiddenSize]
  w2: number[][];  // [actionCount × hiddenSize]
  b2: number[];    // [actionCount]
}

export interface PGTrajectoryStep {
  obs: number[];
  action: number;
  probs: number[];
  hidden: number[];
  reward: number;
}

const PG_ACTIONS: DiscreteAction[] = ["up", "down", "left", "right", "stay"];
export const PG_ACTION_COUNT = PG_ACTIONS.length;
export const PG_OBS_SIZE = 9;

function relu(x: number): number {
  return Math.max(0, x);
}

function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function pgForward(
  net: PolicyNetwork,
  obs: number[],
): { probs: number[]; hidden: number[]; logits: number[] } {
  const hiddenSize = net.b1.length;

  // Hidden layer: h = ReLU(w1 @ obs + b1)
  const hidden = Array.from({ length: hiddenSize }, (_, i) => {
    const row = net.w1[i]!;
    let z = net.b1[i]!;
    for (let j = 0; j < obs.length; j++) {
      z += row[j]! * obs[j]!;
    }
    return relu(z);
  });

  // Output layer: logits = w2 @ hidden + b2
  const actionCount = net.b2.length;
  const logits = Array.from({ length: actionCount }, (_, i) => {
    const row = net.w2[i]!;
    let z = net.b2[i]!;
    for (let j = 0; j < hidden.length; j++) {
      z += row[j]! * hidden[j]!;
    }
    return z;
  });

  const probs = softmax(logits);
  return { probs, hidden, logits };
}

export function sampleActionFromProbs(probs: number[], rand: number): number {
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i]!;
    if (rand < cumulative) return i;
  }
  return probs.length - 1;
}

export function initPolicyNetwork(
  obsSize: number,
  hiddenSize: number,
  actionCount: number,
  seed: number,
): PolicyNetwork {
  const rng = createSeededRandom(seed);
  const scale = Math.sqrt(2 / obsSize);  // He initialization

  return {
    w1: Array.from({ length: hiddenSize }, () =>
      Array.from({ length: obsSize }, () => rng.range(-scale, scale)),
    ),
    b1: Array.from({ length: hiddenSize }, () => 0),
    w2: Array.from({ length: actionCount }, () =>
      Array.from({ length: hiddenSize }, () => rng.range(-0.1, 0.1)),
    ),
    b2: Array.from({ length: actionCount }, () => 0),
  };
}

export function createPGAgent(
  network: PolicyNetwork,
  trajectoryRef: { current: PGTrajectoryStep[] },
  rand: number,
): AgentModel {
  return {
    id: "pg",
    label: "Policy Gradient",
    decide: ({ observation }: { observation: Observation }) => {
      const obs = observationVector(observation);
      const { probs, hidden } = pgForward(network, obs);
      const actionIndex = sampleActionFromProbs(probs, rand);
      const action = PG_ACTIONS[actionIndex]!;

      // Record to trajectory (reward filled in later by trainer)
      trajectoryRef.current.push({ obs, action: actionIndex, probs, hidden, reward: 0 });

      const scores = Object.fromEntries(
        PG_ACTIONS.map((a, i) => [a, probs[i]!]),
      ) as Partial<Record<DiscreteAction, number>>;

      return {
        action,
        scores,
        reasoning: `Policy network (${network.b1.length}-unit hidden). Sampled action prob ${(probs[actionIndex]! * 100).toFixed(1)}%.`,
      } satisfies AgentDecision;
    },
  };
}

export function getPGActionIndex(action: DiscreteAction): number {
  return PG_ACTIONS.indexOf(action);
}

export { PG_ACTIONS };
