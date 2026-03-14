import type { LabConfig } from "@/lib/sim/types";

export const DEFAULT_CONFIG: LabConfig = {
  mode: "manual",
  tickMs: 180,
  environment: {
    gridWidth: 12,
    gridHeight: 12,
    hazardCount: 5,
    maxSteps: 80,
    allowStayAction: true,
    seed: 7,
    rewards: {
      food: 10,
      hazard: -8,
      step: -0.08,
      closer: 0.3,
      boundary: -0.4,
    },
  },
  evolution: {
    populationSize: 18,
    mutationRate: 0.2,
    mutationStrength: 0.45,
    eliteCount: 3,
  },
  rl: {
    learningRate: 0.25,
    discountFactor: 0.92,
    epsilon: 0.9,
    epsilonDecay: 0.994,
    minEpsilon: 0.05,
  },
  pg: {
    learningRate: 0.002,
    discountFactor: 0.99,
    hiddenSize: 16,
    entropyBonus: 0.01,
  },
  environmentId: "grid-nav",
};

export const ACTIONS = ["up", "down", "left", "right", "stay"] as const;
