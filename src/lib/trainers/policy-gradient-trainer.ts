// Policy Gradient trainer implementing REINFORCE (Williams, 1992).
// Updates the policy network once per episode using the full trajectory.
// Gradient: theta += alpha * sum_t [ G_t * grad log pi(a_t|s_t) ]
// Also adds an entropy bonus for exploration regularization.

import { clamp } from "@/lib/utils";
import {
  initPolicyNetwork,
  PG_ACTION_COUNT,
  PG_OBS_SIZE,
  type PGTrajectoryStep,
  type PolicyNetwork,
} from "@/lib/agents/policy-gradient";
import type { PGConfig } from "@/lib/sim/types";

export interface PGRuntime {
  network: PolicyNetwork;
  episodes: number;
}

export function initializePGRuntime(config: PGConfig, seed: number): PGRuntime {
  return {
    network: initPolicyNetwork(PG_OBS_SIZE, config.hiddenSize, PG_ACTION_COUNT, seed),
    episodes: 0,
  };
}

// Compute discounted returns for each step in the trajectory.
function computeReturns(rewards: number[], gamma: number): number[] {
  const returns = new Array<number>(rewards.length).fill(0);
  let running = 0;
  for (let t = rewards.length - 1; t >= 0; t--) {
    running = rewards[t]! + gamma * running;
    returns[t] = running;
  }

  // Normalize returns for variance reduction
  const mean = returns.reduce((a, b) => a + b, 0) / Math.max(1, returns.length);
  const variance =
    returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / Math.max(1, returns.length);
  const std = Math.sqrt(variance + 1e-8);
  return returns.map((r) => (r - mean) / std);
}

// REINFORCE gradient update with entropy bonus.
export function reinforce(
  runtime: PGRuntime,
  trajectory: PGTrajectoryStep[],
  config: PGConfig,
): PGRuntime {
  if (trajectory.length === 0) {
    return { ...runtime, episodes: runtime.episodes + 1 };
  }

  const net = runtime.network;
  const hiddenSize = net.b1.length;
  const obsSize = net.w1[0]!.length;

  const rewards = trajectory.map((step) => step.reward);
  const returns = computeReturns(rewards, config.discountFactor);

  // Accumulate gradients
  const dw1 = Array.from({ length: hiddenSize }, () => new Array<number>(obsSize).fill(0));
  const db1 = new Array<number>(hiddenSize).fill(0);
  const dw2 = Array.from({ length: PG_ACTION_COUNT }, () => new Array<number>(hiddenSize).fill(0));
  const db2 = new Array<number>(PG_ACTION_COUNT).fill(0);

  for (let t = 0; t < trajectory.length; t++) {
    const { obs, action, probs, hidden } = trajectory[t]!;
    const G = returns[t]!;

    // Policy gradient loss: -G * log pi(a|s)
    // dlogits[i] = probs[i] - (i === action ? 1 : 0)  (cross-entropy gradient)
    // But we scale by -G (negative because we want to maximize)
    const dlogits = probs.map((p, i) => {
      const dCrossEntropy = p - (i === action ? 1 : 0);
      const entropyGrad = config.entropyBonus * (Math.log(p + 1e-8) + 1);
      return -G * dCrossEntropy - entropyGrad;
    });

    // Gradient for w2 and b2
    for (let i = 0; i < PG_ACTION_COUNT; i++) {
      db2[i]! += dlogits[i]!;
      for (let j = 0; j < hiddenSize; j++) {
        dw2[i]![j]! += dlogits[i]! * hidden[j]!;
      }
    }

    // Backprop through hidden layer
    // dh = (w2^T @ dlogits) * relu_mask(hidden)
    const dh = new Array<number>(hiddenSize).fill(0);
    for (let j = 0; j < hiddenSize; j++) {
      let grad = 0;
      for (let i = 0; i < PG_ACTION_COUNT; i++) {
        grad += net.w2[i]![j]! * dlogits[i]!;
      }
      dh[j] = grad * (hidden[j]! > 0 ? 1 : 0);  // ReLU gate
    }

    // Gradient for w1 and b1
    for (let j = 0; j < hiddenSize; j++) {
      db1[j]! += dh[j]!;
      for (let k = 0; k < obsSize; k++) {
        dw1[j]![k]! += dh[j]! * obs[k]!;
      }
    }
  }

  // Scale gradients by trajectory length
  const scale = 1 / trajectory.length;

  // Apply gradient updates with gradient clipping
  const maxNorm = 5;
  const newNet: PolicyNetwork = {
    w1: net.w1.map((row, j) =>
      row.map((w, k) => w - config.learningRate * clamp(dw1[j]![k]! * scale, -maxNorm, maxNorm)),
    ),
    b1: net.b1.map((b, j) =>
      b - config.learningRate * clamp(db1[j]! * scale, -maxNorm, maxNorm),
    ),
    w2: net.w2.map((row, i) =>
      row.map((w, j) => w - config.learningRate * clamp(dw2[i]![j]! * scale, -maxNorm, maxNorm)),
    ),
    b2: net.b2.map((b, i) =>
      b - config.learningRate * clamp(db2[i]! * scale, -maxNorm, maxNorm),
    ),
  };

  return {
    network: newNet,
    episodes: runtime.episodes + 1,
  };
}
