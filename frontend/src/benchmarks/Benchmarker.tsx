import { render } from "@testing-library/react";
import React, { Profiler } from "react";

// component
interface BenchmarkArgs {
  componentName: string;
  children: React.ReactNode;
}

interface Benchmarks {
  rawRenderTime: number;
  memoizationSavings: number;
}

type BenchmarksCache = Record<string, Benchmarks>;

const RENDERS = 100;

type ProfiledComponentProps = BenchmarkArgs & { onRenderCallback: any };

const ProfiledComponent = (props: ProfiledComponentProps) => {
  return (
    <Profiler id={props.componentName} onRender={props.onRenderCallback}>
      {props.children}
    </Profiler>
  );
};

const resetBenchmarks = (benchmarks: BenchmarksCache) => {
  const template = {
    rawRenderTime: 0,
    memoizationSavings: 0,
  };
  const phases = ["mount", "update", "nested-update"];
  phases.forEach((phase) => {
    benchmarks[phase] = template;
  });
};

const logBenchmarks = (benchmarks: BenchmarksCache) => {
  const phases = ["mount", "update", "nested-update"];
  console.log("\n==== Benchmark Results ====");
  phases.forEach((phase) => {
    const b = benchmarks[phase];
    if (!b) return;
    const label = phase
      .replace("-", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    console.log(`\n[${label}]`);
    console.log(
      `  Avg. Raw Render Time:      ${b.rawRenderTime.toFixed(3)} ms`
    );
    console.log(
      `  Avg. Memoization Savings:  ${b.memoizationSavings.toFixed(3)} ms`
    );
  });
  console.log("==========================\n");
};

export const benchmark = (args: BenchmarkArgs, silent: boolean = false) => {
  // initialize benchmarks
  const benchmarks: BenchmarksCache = {}; // cache rendering results by the phase
  resetBenchmarks(benchmarks);

  const onRenderCallback = (
    id: string,
    phase: string,
    actualDuration: number,
    baseDuration: number,
    startTime: any,
    commitTime: any
  ) => {
    const rawRenderTime = commitTime - startTime;
    const memoizationSavings = baseDuration - actualDuration;
    benchmarks[phase].rawRenderTime += rawRenderTime / RENDERS;
    benchmarks[phase].memoizationSavings += memoizationSavings / RENDERS;
  };

  const { rerender } = render(
    <ProfiledComponent
      onRenderCallback={onRenderCallback}
      componentName={args.componentName}
    >
      {args.children}
    </ProfiledComponent>
  );

  // render ProfiledComponent 100 times; report benchmarks
  for (let i = 0; i < RENDERS - 1; i++) {
    // re-render Profiled component without propchanges
    rerender(
      <ProfiledComponent
        onRenderCallback={onRenderCallback}
        componentName={args.componentName}
      >
        {args.children}
      </ProfiledComponent>
    );
  }

  if (!silent) {
    logBenchmarks(benchmarks);
  }

  resetBenchmarks(benchmarks);

  // TODO: add benchmarking stage for click events to better proxy state change and such
};
