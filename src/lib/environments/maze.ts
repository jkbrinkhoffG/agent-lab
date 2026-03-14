// Maze environment — fixed corridor layout using hazards as walls.
// The world has the same WorldState shape as grid-nav. Walls are generated
// deterministically from the seed and arranged as horizontal/vertical corridors
// so navigation requires navigating around obstacles rather than through open space.

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

function isSamePosition(a: Vec2, b: Vec2) {
  return a.x === b.x && a.y === b.y;
}

function distance(a: Vec2, b: Vec2) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function createRewardBreakdown() {
  return { food: 0, hazard: 0, step: 0, shaping: 0, boundary: 0, total: 0 };
}

// Generate maze walls: two horizontal corridors and two vertical corridors
// with openings to allow navigation. Layout is seed-determined.
function buildMazeWalls(config: EnvironmentConfig, seed: number): Vec2[] {
  const walls: Vec2[] = [];
  const rng = createSeededRandom(hashSeed(seed, 42));
  const w = config.gridWidth;
  const h = config.gridHeight;

  // Horizontal walls at ~1/3 and ~2/3 height, with gap openings
  const wallY1 = Math.floor(h / 3);
  const wallY2 = Math.floor((h * 2) / 3);
  const gap1X = rng.int(w - 2) + 1;
  const gap2X = rng.int(w - 2) + 1;

  for (let x = 0; x < w; x += 1) {
    if (x !== gap1X) walls.push({ x, y: wallY1 });
    if (x !== gap2X) walls.push({ x, y: wallY2 });
  }

  // Vertical wall in the middle with a gap
  const wallX = Math.floor(w / 2);
  const gap3Y = rng.int(h - 2) + 1;
  for (let y = wallY1 + 1; y < wallY2; y += 1) {
    if (y !== gap3Y) walls.push({ x: wallX, y });
  }

  return walls;
}

export function mazeReset(config: EnvironmentConfig, episodeIndex: number): WorldState {
  const walls = buildMazeWalls(config, config.seed);
  const rng = createSeededRandom(hashSeed(config.seed, episodeIndex + 1));

  // Place agent and food avoiding walls
  const allWallsAndEdge: Vec2[] = [...walls];
  const agent = randomPosition(config, rng, allWallsAndEdge);
  const food = randomPosition(config, rng, [...allWallsAndEdge, agent]);
  const observation = buildObservation(agent, food, walls, config, 0);

  return {
    tick: 0,
    agent,
    food,
    hazards: walls,
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

export function mazeStep(
  previous: WorldState,
  action: DiscreteAction,
  config: EnvironmentConfig,
  episodeIndex: number,
): WorldState {
  const walls = buildMazeWalls(config, config.seed);
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
  let score = previous.score;
  let collectedFood = previous.collectedFood;
  let done = false;
  let terminationReason: string | null = null;

  // Hitting a wall = hazard collision
  if (walls.some((wall) => isSamePosition(nextAgent, wall))) {
    reward.hazard = config.rewards.hazard;
    done = true;
    terminationReason = "wall collision";
  }

  if (!done && isSamePosition(nextAgent, previous.food)) {
    reward.food = config.rewards.food;
    score += 1;
    collectedFood += 1;
    food = randomPosition(config, rng, [nextAgent, ...walls]);
  }

  const tick = previous.tick + 1;

  if (!done && tick >= config.maxSteps) {
    done = true;
    terminationReason = "step limit";
  }

  reward.total =
    reward.food + reward.hazard + reward.step + reward.shaping + reward.boundary;

  const observation = buildObservation(nextAgent, food, walls, config, tick);

  return {
    tick,
    agent: nextAgent,
    food,
    hazards: walls,
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
