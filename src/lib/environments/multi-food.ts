// Multi-food environment — multiple food items on the grid simultaneously.
// `food` = nearest food item (for observation / agent navigation).
// `foodItems` = all active food positions (for rendering).
// `hazards` = classic hazard positions (terminal on collision).
// Each time food is collected a new one spawns, keeping count constant.

import { createSeededRandom, hashSeed } from "@/lib/random";
import { clamp } from "@/lib/utils";
import type { DiscreteAction, EnvironmentConfig, Vec2, WorldState } from "@/lib/sim/types";
import { buildObservation, randomPosition } from "@/lib/environments/grid-nav";

const ACTION_VECTORS: Record<DiscreteAction, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  stay: { x: 0, y: 0 },
};

const FOOD_COUNT = 3;

function isSamePosition(a: Vec2, b: Vec2) {
  return a.x === b.x && a.y === b.y;
}

function distance(a: Vec2, b: Vec2) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function createRewardBreakdown() {
  return { food: 0, hazard: 0, step: 0, shaping: 0, boundary: 0, total: 0 };
}

function nearestFood(agent: Vec2, foodItems: Vec2[]): Vec2 {
  return foodItems
    .slice()
    .sort((a, b) => distance(agent, a) - distance(agent, b))[0]!;
}

export function multiFoodReset(config: EnvironmentConfig, episodeIndex: number): WorldState {
  const rng = createSeededRandom(hashSeed(config.seed, episodeIndex + 1));
  const agent = randomPosition(config, rng);
  const hazards = Array.from({ length: config.hazardCount }, () =>
    randomPosition(config, rng, [agent]),
  );
  const taken = [agent, ...hazards];
  const foodItems = Array.from({ length: FOOD_COUNT }, () =>
    randomPosition(config, rng, taken.concat()),
  );
  // Mark taken after each to avoid overlaps
  for (let i = 0; i < foodItems.length; i++) {
    taken.push(foodItems[i]!);
  }

  const food = nearestFood(agent, foodItems);
  const observation = buildObservation(agent, food, hazards, config, 0);

  return {
    tick: 0,
    agent,
    food,
    foodItems,
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

export function multiFoodStep(
  previous: WorldState,
  action: DiscreteAction,
  config: EnvironmentConfig,
  episodeIndex: number,
): WorldState {
  const rng = createSeededRandom(hashSeed(config.seed, episodeIndex * 997 + previous.tick + 1));

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

  const currentFoodItems: Vec2[] = previous.foodItems ?? [previous.food];
  const prevNearest = nearestFood(previous.agent, currentFoodItems);
  const nextNearest = nearestFood(nextAgent, currentFoodItems);
  const prevDist = distance(previous.agent, prevNearest);
  const nextDist = distance(nextAgent, nextNearest);

  const reward = createRewardBreakdown();
  reward.step = config.rewards.step;

  if (hitBoundary) {
    reward.boundary = config.rewards.boundary;
  }

  if (nextDist < prevDist) {
    reward.shaping = config.rewards.closer;
  }

  let foodItems = currentFoodItems.map((f) => ({ ...f }));
  let score = previous.score;
  let collectedFood = previous.collectedFood;
  let done = false;
  let terminationReason: string | null = null;

  // Check if agent lands on any food item
  const collectedIndex = foodItems.findIndex((f) => isSamePosition(nextAgent, f));
  if (collectedIndex >= 0) {
    reward.food = config.rewards.food;
    score += 1;
    collectedFood += 1;
    // Respawn that food item
    const taken = [nextAgent, ...previous.hazards, ...foodItems.filter((_, i) => i !== collectedIndex)];
    foodItems[collectedIndex] = randomPosition(config, rng, taken);
  }

  if (previous.hazards.some((hazard) => isSamePosition(nextAgent, hazard))) {
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

  const food = nearestFood(nextAgent, foodItems);
  const observation = buildObservation(nextAgent, food, previous.hazards, config, tick);

  return {
    tick,
    agent: nextAgent,
    food,
    foodItems,
    hazards: previous.hazards,
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
