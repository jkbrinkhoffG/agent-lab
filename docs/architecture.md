# Architecture Notes

## Design goals

- Keep the simulation deterministic and easy to inspect.
- Keep simulation logic separate from rendering.
- Keep trainer logic separate from UI orchestration.
- Favor small modules over framework-heavy abstractions.

## Core modules

### `src/lib/sim`

- `types.ts`: shared types for config, world state, observations, metrics, and replays
- `config.ts`: default typed lab configuration
- `environment.ts`: reset logic, observation generation, action application, reward computation, and terminal conditions

### `src/lib/agents`

- `random-agent.ts`: uniform random baseline
- `heuristic-agent.ts`: hand-authored greedy baseline
- `evolution.ts`: inspectable linear genome policy
- `q-learning.ts`: tabular Q encoding and agent evaluation

### `src/lib/trainers`

- `evolution-trainer.ts`: population initialization, selection, elitism, and mutation
- `q-learning-trainer.ts`: Q-table lifecycle and update rule

### `src/hooks`

- `use-agent-lab.ts`: central orchestration hook that coordinates environment stepping, mode switching, metrics, logs, replay state, and trainer progress

### `src/components`

- Layout and panel components for controls, metrics, replay, and the main simulation viewport
- `simulation-canvas.tsx` is rendering-only and receives world snapshots as input

## Current environment

- Bounded grid world
- Single agent
- One food target at a time
- Configurable hazard count
- Discrete actions: up, down, left, right, optional stay
- Reward shaping for moving closer to food

## Training modes

### Manual / baseline modes

- A single episode is stepped in the live viewport.
- Metrics and replay are captured for each completed run.

### Evolution mode

- Each genome is evaluated in the live environment.
- Completed candidates accumulate generation fitness data.
- At generation end, elites are preserved and the rest of the population is mutated from tournament-selected parents.

### Q-learning mode

- The agent uses a compact discretized state encoding.
- During training, an epsilon-greedy policy collects transitions and updates the Q-table online.
- Evaluation mode runs the greedy policy against the current Q-table.

## Tradeoffs

- Q-learning is intentionally tabular and simple, which limits expressiveness but keeps the update mechanics visible.
- Evolution uses a linear policy instead of a neural network for the same reason.
- The environment is discrete and deterministic to keep replay and debugging straightforward.
