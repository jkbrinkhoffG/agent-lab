"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

export function useEventCallback<Fn extends (...args: any[]) => any>(fn: Fn): Fn {
  const fnRef = useRef(fn);

  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  return useCallback(((...args: Parameters<Fn>) => fnRef.current(...args)) as Fn, []);
}
