import type { AgentDecision, AgentModel } from "@/lib/agents/base";
import type { DiscreteAction, Observation } from "@/lib/sim/types";

const ACTIONS: DiscreteAction[] = ["up", "down", "left", "right", "stay"];

export function encodeObservation(observation: Observation) {
  const horizontal =
    observation.foodDx > 0.1 ? "right" : observation.foodDx < -0.1 ? "left" : "center";
  const vertical =
    observation.foodDy > 0.1 ? "down" : observation.foodDy < -0.1 ? "up" : "center";
  const hazardX =
    observation.nearestHazardDx > 0.1
      ? "right"
      : observation.nearestHazardDx < -0.1
        ? "left"
        : "center";
  const hazardY =
    observation.nearestHazardDy > 0.1
      ? "down"
      : observation.nearestHazardDy < -0.1
        ? "up"
        : "center";

  return [
    `food-x:${horizontal}`,
    `food-y:${vertical}`,
    `hazard-x:${hazardX}`,
    `hazard-y:${hazardY}`,
    `adjacent:${observation.hazardAdjacent}`,
  ].join("|");
}

export function createQAgent(
  qValues: Record<string, number[]>,
  epsilon: number,
  randomValue: number,
  stateKey: string,
): AgentModel {
  return {
    id: "q-learning",
    label: "Q-learning",
    decide: () => {
      const scores = qValues[stateKey] ?? Array.from({ length: ACTIONS.length }, () => 0);
      let actionIndex = 0;

      if (randomValue < epsilon) {
        actionIndex = Math.floor(randomValue * ACTIONS.length);
      } else {
        actionIndex = scores.reduce(
          (best, score, index, allScores) => (score > allScores[best]! ? index : best),
          0,
        );
      }

      return {
        action: ACTIONS[actionIndex]!,
        scores: Object.fromEntries(
          ACTIONS.map((action, index) => [action, scores[index] ?? 0]),
        ) as Record<DiscreteAction, number>,
        reasoning:
          randomValue < epsilon
            ? `Epsilon-greedy exploration with epsilon ${epsilon.toFixed(2)}.`
            : "Greedy action from tabular Q-values.",
      } satisfies AgentDecision;
    },
  };
}

export const Q_ACTIONS = ACTIONS;
