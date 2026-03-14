import { createSeededRandom, hashSeed, type RandomSource } from "@/lib/random";
import { clamp } from "@/lib/utils";
import type {
  DiscreteAction,
  EnvironmentConfig,
  Observation,
  ReplayFrame,
  RewardBreakdown,
  Vec2,
  WorldState,
} from "@/lib/sim/types";

const ACTION_VECTORS: Record<DiscreteAction, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  stay: { x: 0, y: 0 },
};

function isSamePosition(a: Vec2, b: Vec2) {
  return a.x === b.x && a.y === b.y;
}

function distance(a: Vec2, b: Vec2) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function randomPosition(config: EnvironmentConfig, rng: RandomSource, taken: Vec2[] = []) {
  const maxAttempts = config.gridWidth * config.gridHeight * 2;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const position = {
      x: rng.int(config.gridWidth),
      y: rng.int(config.gridHeight),
    };

    if (!taken.some((item) => isSamePosition(item, position))) {
      return position;
    }
  }

  return { x: 0, y: 0 };
}

export function createEpisodeRandom(config: EnvironmentConfig, episodeIndex: number) {
  return createSeededRandom(hashSeed(config.seed, episodeIndex + 1));
}

export function buildObservation(
  agent: Vec2,
  food: Vec2,
  hazards: Vec2[],
  config: EnvironmentConfig,
  tick: number,
): Observation {
  const nearestHazard =
    hazards
      .slice()
      .sort((left, right) => distance(agent, left) - distance(agent, right))[0] ?? agent;

  const distanceToFood = distance(agent, food);

  return {
    agentX: agent.x / Math.max(1, config.gridWidth - 1),
    agentY: agent.y / Math.max(1, config.gridHeight - 1),
    foodDx: (food.x - agent.x) / Math.max(1, config.gridWidth - 1),
    foodDy: (food.y - agent.y) / Math.max(1, config.gridHeight - 1),
    nearestHazardDx: (nearestHazard.x - agent.x) / Math.max(1, config.gridWidth - 1),
    nearestHazardDy: (nearestHazard.y - agent.y) / Math.max(1, config.gridHeight - 1),
    hazardAdjacent: hazards.some((hazard) => distance(agent, hazard) <= 1) ? 1 : 0,
    stepsRemaining: (config.maxSteps - tick) / config.maxSteps,
    distanceToFood: distanceToFood / (config.gridWidth + config.gridHeight),
  };
}

function createRewardBreakdown(): RewardBreakdown {
  return {
    food: 0,
    hazard: 0,
    step: 0,
    shaping: 0,
    boundary: 0,
    total: 0,
  };
}

export function resetWorld(config: EnvironmentConfig, episodeIndex: number): WorldState {
  const rng = createEpisodeRandom(config, episodeIndex);
  const agent = randomPosition(config, rng);
  const food = randomPosition(config, rng, [agent]);
  const hazards = Array.from({ length: config.hazardCount }, () =>
    randomPosition(config, rng, [agent, food]),
  );
  const observation = buildObservation(agent, food, hazards, config, 0);

  return {
    tick: 0,
    agent,
    food,
    hazards,
    totalReward: 0,
    score: 0,
    collectedFood: 0,
    lastAction: "stay",
    lastReward: 0,
    lastRewardBreakdown: createRewardBreakdown(),
    observation,
    done: false,
    terminationReason: null,
  };
}

export function availableActions(config: EnvironmentConfig): DiscreteAction[] {
  return config.allowStayAction
    ? ["up", "down", "left", "right", "stay"]
    : ["up", "down", "left", "right"];
}

export function worldToFrame(state: WorldState): ReplayFrame {
  return {
    tick: state.tick,
    agent: { ...state.agent },
    food: { ...state.food },
    hazards: state.hazards.map((hazard) => ({ ...hazard })),
    action: state.lastAction,
    reward: state.lastReward,
    rewardBreakdown: { ...state.lastRewardBreakdown },
    totalReward: state.totalReward,
    observation: { ...state.observation },
    done: state.done,
    terminationReason: state.terminationReason,
    score: state.score,
    collectedFood: state.collectedFood,
  };
}

export function stepWorld(
  previous: WorldState,
  action: DiscreteAction,
  config: EnvironmentConfig,
  episodeIndex: number,
): WorldState {
  const rng = createEpisodeRandom(config, episodeIndex * 997 + previous.tick + 1);
  const delta = ACTION_VECTORS[action];
  const unclampedNext = {
    x: previous.agent.x + delta.x,
    y: previous.agent.y + delta.y,
  };
  const nextAgent = {
    x: clamp(unclampedNext.x, 0, config.gridWidth - 1),
    y: clamp(unclampedNext.y, 0, config.gridHeight - 1),
  };
  const hitBoundary = unclampedNext.x !== nextAgent.x || unclampedNext.y !== nextAgent.y;
  const previousDistance = distance(previous.agent, previous.food);
  const nextDistance = distance(nextAgent, previous.food);
  const reward = createRewardBreakdown();
  reward.step = config.rewards.step;

  if (hitBoundary) {
    reward.boundary = config.rewards.boundary;
  }

  if (nextDistance < previousDistance) {
    reward.shaping = config.rewards.closer;
  }

  let food = previous.food;
  let hazards = previous.hazards.map((hazard) => ({ ...hazard }));
  let score = previous.score;
  let collectedFood = previous.collectedFood;
  let done = false;
  let terminationReason: string | null = null;

  if (isSamePosition(nextAgent, previous.food)) {
    reward.food = config.rewards.food;
    score += 1;
    collectedFood += 1;
    food = randomPosition(config, rng, [nextAgent, ...hazards]);
  }

  if (hazards.some((hazard) => isSamePosition(nextAgent, hazard))) {
    reward.hazard = config.rewards.hazard;
    done = true;
    terminationReason = "hazard collision";
  }

  const tick = previous.tick + 1;

  if (!done && tick >= config.maxSteps) {
    done = true;
    terminationReason = "step limit";
  }

  reward.total =
    reward.food + reward.hazard + reward.step + reward.shaping + reward.boundary;

  const observation = buildObservation(nextAgent, food, hazards, config, tick);

  return {
    tick,
    agent: nextAgent,
    food,
    hazards,
    totalReward: previous.totalReward + reward.total,
    score,
    collectedFood,
    lastAction: action,
    lastReward: reward.total,
    lastRewardBreakdown: reward,
    observation,
    done,
    terminationReason,
  };
}
