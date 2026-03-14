import type { DiscreteAction, Observation, WorldState } from "@/lib/sim/types";

export interface AgentContext {
  observation: Observation;
  state: WorldState;
}

export interface AgentDecision {
  action: DiscreteAction;
  reasoning: string;
  scores?: Partial<Record<DiscreteAction, number>>;
}

export interface AgentModel {
  id: string;
  label: string;
  decide: (context: AgentContext) => AgentDecision;
}
