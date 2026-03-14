"use client";

import { useEffect, useRef } from "react";

import type { ReplayFrame, WorldState } from "@/lib/sim/types";

interface SimulationCanvasProps {
  world: WorldState | ReplayFrame;
  history?: ReplayFrame[];
  className?: string;
}

export function SimulationCanvas({ world, history = [], className }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const cssSize = 720;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = cssSize * ratio;
    canvas.height = cssSize * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const maxX = Math.max(
      world.agent.x,
      world.food.x,
      ...world.hazards.map((hazard) => hazard.x),
      ...history.map((frame) => frame.agent.x),
    );
    const maxY = Math.max(
      world.agent.y,
      world.food.y,
      ...world.hazards.map((hazard) => hazard.y),
      ...history.map((frame) => frame.agent.y),
    );
    const gridWidth = maxX + 1;
    const gridHeight = maxY + 1;
    const cellSize = Math.min(cssSize / gridWidth, cssSize / gridHeight);

    context.clearRect(0, 0, cssSize, cssSize);
    const gradient = context.createLinearGradient(0, 0, cssSize, cssSize);
    gradient.addColorStop(0, "#07111f");
    gradient.addColorStop(1, "#111b30");
    context.fillStyle = gradient;
    context.fillRect(0, 0, cssSize, cssSize);

    context.save();
    context.translate(
      (cssSize - gridWidth * cellSize) / 2,
      (cssSize - gridHeight * cellSize) / 2,
    );

    for (let x = 0; x < gridWidth; x += 1) {
      for (let y = 0; y < gridHeight; y += 1) {
        context.fillStyle = (x + y) % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)";
        context.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
      }
    }

    if (history.length > 1) {
      context.beginPath();
      context.strokeStyle = "rgba(56, 189, 248, 0.35)";
      context.lineWidth = Math.max(2, cellSize * 0.08);
      history.forEach((frame, index) => {
        const x = frame.agent.x * cellSize + cellSize / 2;
        const y = frame.agent.y * cellSize + cellSize / 2;
        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      context.stroke();
    }

    world.hazards.forEach((hazard) => {
      const x = hazard.x * cellSize;
      const y = hazard.y * cellSize;
      context.fillStyle = "#f43f5e";
      context.beginPath();
      context.roundRect(x + cellSize * 0.18, y + cellSize * 0.18, cellSize * 0.64, cellSize * 0.64, 12);
      context.fill();
    });

    context.fillStyle = "#84cc16";
    context.beginPath();
    context.arc(
      world.food.x * cellSize + cellSize / 2,
      world.food.y * cellSize + cellSize / 2,
      cellSize * 0.24,
      0,
      Math.PI * 2,
    );
    context.fill();

    context.strokeStyle = "rgba(163, 230, 53, 0.6)";
    context.lineWidth = Math.max(2, cellSize * 0.06);
    context.beginPath();
    context.moveTo(world.agent.x * cellSize + cellSize / 2, world.agent.y * cellSize + cellSize / 2);
    context.lineTo(world.food.x * cellSize + cellSize / 2, world.food.y * cellSize + cellSize / 2);
    context.stroke();

    const agentGradient = context.createRadialGradient(
      world.agent.x * cellSize + cellSize / 2,
      world.agent.y * cellSize + cellSize / 2,
      cellSize * 0.1,
      world.agent.x * cellSize + cellSize / 2,
      world.agent.y * cellSize + cellSize / 2,
      cellSize * 0.45,
    );
    agentGradient.addColorStop(0, "#f8fafc");
    agentGradient.addColorStop(1, "#38bdf8");
    context.fillStyle = agentGradient;
    context.beginPath();
    context.arc(
      world.agent.x * cellSize + cellSize / 2,
      world.agent.y * cellSize + cellSize / 2,
      cellSize * 0.28,
      0,
      Math.PI * 2,
    );
    context.fill();

    context.restore();
  }, [history, world]);

  return (
    <canvas
      className={className}
      ref={canvasRef}
      style={{ width: "100%", aspectRatio: "1 / 1" }}
    />
  );
}
