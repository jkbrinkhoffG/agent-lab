import type { LabConfig } from "@/lib/sim/types";

type DeepPartial<T> = {
  [Key in keyof T]?: T[Key] extends object ? DeepPartial<T[Key]> : T[Key];
};

export const LAB_PRESETS: Array<{
  id: string;
  label: string;
  description: string;
  config: DeepPartial<LabConfig>;
}> = [
  {
    id: "baseline",
    label: "Balanced Lab",
    description: "Default sandbox with moderate hazards and shaped rewards.",
    config: {},
  },
  {
    id: "hazards",
    label: "Hazard Gauntlet",
    description: "More hazards and stronger penalties to stress safe navigation.",
    config: {
      environment: {
        hazardCount: 9,
        rewards: {
          food: 12,
          hazard: -10,
          step: -0.08,
          closer: 0.25,
          boundary: -0.6,
        },
      },
    },
  },
  {
    id: "sprinter",
    label: "Sprint Arena",
    description: "Shorter episodes and stronger movement shaping for fast feedback.",
    config: {
      tickMs: 120,
      environment: {
        maxSteps: 48,
        rewards: {
          food: 8,
          hazard: -7,
          step: -0.1,
          closer: 0.45,
          boundary: -0.35,
        },
      },
    },
  },
];

export function mergePreset<T extends LabConfig>(base: T, patch: DeepPartial<LabConfig>): T {
  return {
    ...base,
    ...patch,
    environment: {
      ...base.environment,
      ...patch.environment,
      rewards: {
        ...base.environment.rewards,
        ...patch.environment?.rewards,
      },
    },
    evolution: {
      ...base.evolution,
      ...patch.evolution,
    },
    rl: {
      ...base.rl,
      ...patch.rl,
    },
    pg: {
      ...base.pg,
      ...patch.pg,
    },
  };
}
