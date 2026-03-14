import type { DiscreteAction, EnvironmentConfig, WorldState } from "@/lib/sim/types";
import { gridNavReset, gridNavStep } from "@/lib/environments/grid-nav";
import { mazeReset, mazeStep } from "@/lib/environments/maze";
import { multiFoodReset, multiFoodStep } from "@/lib/environments/multi-food";

export interface EnvironmentDef {
  id: string;
  label: string;
  description: string;
  reset: (config: EnvironmentConfig, episodeIndex: number) => WorldState;
  step: (
    state: WorldState,
    action: DiscreteAction,
    config: EnvironmentConfig,
    episodeIndex: number,
  ) => WorldState;
}

export const ENVIRONMENTS: EnvironmentDef[] = [
  {
    id: "grid-nav",
    label: "Grid Nav",
    description: "Single food target, random hazards.",
    reset: gridNavReset,
    step: gridNavStep,
  },
  {
    id: "maze",
    label: "Maze",
    description: "Fixed corridor walls. Navigate to food without hitting walls.",
    reset: mazeReset,
    step: mazeStep,
  },
  {
    id: "multi-food",
    label: "Multi-Food",
    description: "Multiple food items on the grid at once. Collect as many as possible.",
    reset: multiFoodReset,
    step: multiFoodStep,
  },
];

export function getEnvironment(id: string): EnvironmentDef {
  return ENVIRONMENTS.find((env) => env.id === id) ?? ENVIRONMENTS[0]!;
}
