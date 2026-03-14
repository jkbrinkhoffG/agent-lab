# Agent Lab

Agent Lab is a local-first research sandbox for experimenting with simple learning agents in a transparent 2D world. It is built for fast feedback loops, readable code, and interactive intuition-building rather than production infrastructure.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- HTML5 canvas
- Recharts

## What is implemented

### Phase 1: Sandbox foundation

- Polished dark-mode lab UI with header, controls, center viewport, metrics panel, and replay area
- Deterministic seeded 2D grid environment with food, hazards, bounded arena, and configurable rewards
- Start, pause, reset, and step controls
- Manual control mode with keyboard input
- Typed central config for environment, rewards, evolution, and RL parameters

### Phase 2: Baselines and observability

- Random agent
- Heuristic agent
- Episode metrics with moving average
- Event log
- Observation, action, and reward breakdown inspection
- Reward and generation charts
- Recent and best replay support
- Preset experiments

### Phase 3: Evolution mode

- Population-based evolution trainer
- Linear genome policy over normalized observations
- Selection, elitism, and mutation
- Generation fitness tracking
- Best-so-far evaluation and replay

### Phase 4: RL mode

- RL trainer architecture separated from the UI
- Simple tabular Q-learning implementation
- Training and evaluation modes
- Live epsilon tracking and Q-driven action inspection

## What is not implemented yet

- Side-by-side comparison view
- Save/load configs
- Richer replay tooling and annotations
- Additional environments
- More advanced RL algorithms beyond tabular Q-learning

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev
pnpm build
pnpm typecheck
```

## Project structure

- `src/app`: app shell and layout
- `src/components`: UI panels, charts, and canvas view
- `src/hooks`: stateful lab controller hooks
- `src/lib/sim`: environment and shared simulation types
- `src/lib/agents`: baseline, evolution, and RL agent logic
- `src/lib/trainers`: evolution and RL training loops
- `src/lib/presets.ts`: curated lab presets

## Notes

- The simulation is intentionally simple and inspectable.
- Rendering is separate from simulation state transitions.
- Training logic is separate from UI components.
- Most controls reset the lab so metrics stay comparable to the active configuration.

## Next concrete tasks

1. Add side-by-side comparison mode for two agents or policies.
2. Add config save/load and named experiment presets.
3. Improve replay with event markers, seek-to-terminal, and run selection history.
4. Add a richer heuristic inspector and Q-table/state viewer.
5. Add a second environment variant without making the simulation core opaque.
