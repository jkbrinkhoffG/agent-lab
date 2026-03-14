import type { AgentDecision, AgentModel } from "@/lib/agents/base";
import type { DiscreteAction, EnvironmentConfig, Vec2 } from "@/lib/sim/types";

const ACTIONS: Record<DiscreteAction, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  stay: { x: 0, y: 0 },
};

function manhattan(a: Vec2, b: Vec2) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function createHeuristicAgent(config: EnvironmentConfig): AgentModel {
  return {
    id: "heuristic",
    label: "Heuristic",
    decide: ({ state }) => {
      const actions: DiscreteAction[] = config.allowStayAction
        ? ["up", "down", "left", "right", "stay"]
        : ["up", "down", "left", "right"];
      const scores = Object.fromEntries(
        actions.map((action) => {
          const delta = ACTIONS[action];
          const next = {
            x: Math.min(config.gridWidth - 1, Math.max(0, state.agent.x + delta.x)),
            y: Math.min(config.gridHeight - 1, Math.max(0, state.agent.y + delta.y)),
          };
          const nearestHazard = Math.min(
            ...state.hazards.map((hazard) => manhattan(next, hazard)),
          );
          const foodDistance = manhattan(next, state.food);
          const score = -foodDistance + nearestHazard * 0.7;

          return [action, score];
        }),
      ) as Record<DiscreteAction, number>;

      const action = actions.reduce((best, current) =>
        scores[current] > scores[best] ? current : best,
      );

      return {
        action,
        scores,
        reasoning: "Greedy score: move toward food while increasing distance from hazards.",
      } satisfies AgentDecision;
    },
  };
}
