import { createSeededRandom } from "@/lib/random";
import { average } from "@/lib/utils";
import type { EvolutionGenome } from "@/lib/agents/evolution";
import type { EvolutionConfig, GenerationMetrics } from "@/lib/sim/types";

const INPUT_DIMENSIONS = 9;
const ACTION_DIMENSIONS = 5;

export interface EvaluatedGenome extends EvolutionGenome {
  fitness: number;
  score: number;
  steps: number;
}

export interface EvolutionRuntime {
  generation: number;
  population: EvolutionGenome[];
  currentGenomeIndex: number;
  evaluationReward: number;
}

function createGenome(id: string, rng: ReturnType<typeof createSeededRandom>): EvolutionGenome {
  return {
    id,
    weights: Array.from({ length: ACTION_DIMENSIONS }, () =>
      Array.from({ length: INPUT_DIMENSIONS }, () => rng.range(-1, 1)),
    ),
    biases: Array.from({ length: ACTION_DIMENSIONS }, () => rng.range(-0.5, 0.5)),
  };
}

export function initializeEvolutionRuntime(
  config: EvolutionConfig,
  seed: number,
): EvolutionRuntime {
  const rng = createSeededRandom(seed);

  return {
    generation: 1,
    currentGenomeIndex: 0,
    evaluationReward: 0,
    population: Array.from({ length: config.populationSize }, (_, index) =>
      createGenome(`g1-${index + 1}`, rng),
    ),
  };
}

function mutateGenome(
  genome: EvolutionGenome,
  config: EvolutionConfig,
  rng: ReturnType<typeof createSeededRandom>,
  id: string,
): EvolutionGenome {
  return {
    id,
    weights: genome.weights.map((row) =>
      row.map((weight) =>
        rng.next() < config.mutationRate
          ? weight + rng.range(-config.mutationStrength, config.mutationStrength)
          : weight,
      ),
    ),
    biases: genome.biases.map((bias) =>
      rng.next() < config.mutationRate
        ? bias + rng.range(-config.mutationStrength, config.mutationStrength)
        : bias,
    ),
  };
}

function tournamentSelect(pool: EvaluatedGenome[], rng: ReturnType<typeof createSeededRandom>) {
  const contestants = Array.from({ length: 3 }, () => pool[rng.int(pool.length)]!);
  return contestants.sort((left, right) => right.fitness - left.fitness)[0]!;
}

export function evolvePopulation(
  evaluated: EvaluatedGenome[],
  config: EvolutionConfig,
  seed: number,
  generation: number,
): { runtime: EvolutionRuntime; metrics: GenerationMetrics } {
  const sorted = evaluated.slice().sort((left, right) => right.fitness - left.fitness);
  const rng = createSeededRandom(seed + sorted.length * 17);
  const elites = sorted.slice(0, config.eliteCount).map((genome, index) => ({
    ...genome,
    id: `g${generation + 1}-${index + 1}`,
  }));
  const nextGeneration = [
    ...elites.map(({ fitness, score, steps, ...rest }) => rest),
    ...Array.from({ length: Math.max(0, config.populationSize - elites.length) }, (_, index) => {
      const parent = tournamentSelect(sorted, rng);
      return mutateGenome(parent, config, rng, `g${generation + 1}-${elites.length + index + 1}`);
    }),
  ];

  const nextRuntime: EvolutionRuntime = {
    generation: generation + 1,
    population: nextGeneration,
    currentGenomeIndex: 0,
    evaluationReward: 0,
  };

  return {
    runtime: nextRuntime,
    metrics: {
      generation,
      bestFitness: sorted[0]?.fitness ?? 0,
      averageFitness: average(sorted.map((item) => item.fitness)),
    },
  };
}
