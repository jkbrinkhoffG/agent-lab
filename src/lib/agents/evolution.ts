import { average } from "@/lib/utils";
import type { AgentDecision, AgentModel } from "@/lib/agents/base";
import type { DiscreteAction, Observation } from "@/lib/sim/types";

export interface EvolutionGenome {
  id: string;
  weights: number[][];
  biases: number[];
}

const ACTIONS: DiscreteAction[] = ["up", "down", "left", "right", "stay"];

export function observationVector(observation: Observation) {
  return [
    observation.agentX,
    observation.agentY,
    observation.foodDx,
    observation.foodDy,
    observation.nearestHazardDx,
    observation.nearestHazardDy,
    observation.hazardAdjacent,
    observation.stepsRemaining,
    observation.distanceToFood,
  ];
}

export function scoreGenome(genome: EvolutionGenome, observation: Observation) {
  const inputs = observationVector(observation);

  return ACTIONS.map((action, actionIndex) => {
    const weighted = genome.weights[actionIndex]!.reduce(
      (sum, weight, inputIndex) => sum + weight * inputs[inputIndex]!,
      genome.biases[actionIndex] ?? 0,
    );

    return [action, weighted] as const;
  });
}

export function createEvolutionAgent(genome: EvolutionGenome): AgentModel {
  return {
    id: genome.id,
    label: "Evolution",
    decide: ({ observation }) => {
      const scores = Object.fromEntries(scoreGenome(genome, observation)) as Record<
        DiscreteAction,
        number
      >;
      const action = ACTIONS.reduce((best, current) =>
        scores[current] > scores[best] ? current : best,
      );

      return {
        action,
        scores,
        reasoning: `Linear policy over 9 observation features. Mean score ${average(
          Object.values(scores),
        ).toFixed(2)}.`,
      } satisfies AgentDecision;
    },
  };
}
