export type AgentMode =
  | "manual"
  | "random"
  | "heuristic"
  | "evolution"
  | "q-learning";

export type DiscreteAction = "up" | "down" | "left" | "right" | "stay";

export interface Vec2 {
  x: number;
  y: number;
}

export interface RewardConfig {
  food: number;
  hazard: number;
  step: number;
  closer: number;
  boundary: number;
}

export interface EnvironmentConfig {
  gridWidth: number;
  gridHeight: number;
  hazardCount: number;
  maxSteps: number;
  allowStayAction: boolean;
  seed: number;
  rewards: RewardConfig;
}

export interface EvolutionConfig {
  populationSize: number;
  mutationRate: number;
  mutationStrength: number;
  eliteCount: number;
}

export interface RLConfig {
  learningRate: number;
  discountFactor: number;
  epsilon: number;
  epsilonDecay: number;
  minEpsilon: number;
}

export interface LabConfig {
  mode: AgentMode;
  tickMs: number;
  environment: EnvironmentConfig;
  evolution: EvolutionConfig;
  rl: RLConfig;
}

export interface Observation {
  agentX: number;
  agentY: number;
  foodDx: number;
  foodDy: number;
  nearestHazardDx: number;
  nearestHazardDy: number;
  hazardAdjacent: number;
  stepsRemaining: number;
  distanceToFood: number;
}

export interface RewardBreakdown {
  food: number;
  hazard: number;
  step: number;
  shaping: number;
  boundary: number;
  total: number;
}

export interface WorldState {
  tick: number;
  agent: Vec2;
  food: Vec2;
  hazards: Vec2[];
  totalReward: number;
  score: number;
  collectedFood: number;
  lastAction: DiscreteAction;
  lastReward: number;
  lastRewardBreakdown: RewardBreakdown;
  observation: Observation;
  done: boolean;
  terminationReason: string | null;
}

export interface ReplayFrame {
  tick: number;
  agent: Vec2;
  food: Vec2;
  hazards: Vec2[];
  action: DiscreteAction;
  reward: number;
  rewardBreakdown: RewardBreakdown;
  totalReward: number;
  observation: Observation;
  done: boolean;
  terminationReason: string | null;
  score: number;
  collectedFood: number;
}

export interface ReplayRun {
  id: string;
  label: string;
  mode: AgentMode;
  frames: ReplayFrame[];
  totalReward: number;
  score: number;
  steps: number;
  seed: number;
  createdAt: number;
}

export interface EpisodeMetrics {
  episode: number;
  mode: AgentMode;
  reward: number;
  score: number;
  steps: number;
  movingAverage: number;
}

export interface GenerationMetrics {
  generation: number;
  bestFitness: number;
  averageFitness: number;
}

export interface EventLogEntry {
  id: string;
  tick: number;
  title: string;
  detail: string;
  tone: "info" | "good" | "bad";
}
