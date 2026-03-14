"use client";

import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PanelProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function Panel({ title, subtitle, action, className, children }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-panel backdrop-blur-xl",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/88">
            {title}
          </h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
