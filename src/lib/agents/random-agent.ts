import { createEpisodeRandom } from "@/lib/sim/environment";
import type { AgentDecision, AgentModel } from "@/lib/agents/base";
import type { DiscreteAction, EnvironmentConfig } from "@/lib/sim/types";

export function createRandomAgent(config: EnvironmentConfig, episodeIndex: number): AgentModel {
  return {
    id: "random",
    label: "Random",
    decide: ({ state }) => {
      const rng = createEpisodeRandom(config, episodeIndex * 409 + state.tick + 1);
      const actions: DiscreteAction[] = config.allowStayAction
        ? ["up", "down", "left", "right", "stay"]
        : ["up", "down", "left", "right"];
      const action = actions[rng.int(actions.length)]!;

      return {
        action,
        reasoning: "Uniform random pick from the discrete action set.",
      } satisfies AgentDecision;
    },
  };
}
