import { render } from "@testing-library/react";
import React, { Profiler } from "react";

// component
interface BenchmarkArgs {
  componentName: string;
  children: React.ReactNode;
}

interface Benchmarks {
  rawRenderTime: number;
  baseDuration: number;
  actualDuration: number;
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
    baseDuration: 0,
    actualDuration: 0,
  };
  const phases = ["mount", "update", "nested-update"];
  phases.forEach((phase) => {
    benchmarks[phase] = template;
  });
};

const logBenchmarks = (benchmarks: BenchmarksCache) => {
  const phases = ["mount", "update", "nested-update"];
  let output = "\n==== Benchmark Results ====";
  phases.forEach((phase) => {
    const b = benchmarks[phase];
    if (!b) return;
    const label = phase
      .replace("-", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    output += `\n[${label}]\n`;
    output += `    Avg. Raw Render Time: ${b.rawRenderTime.toFixed(3)} ms\n`;
    output += `    Avg. Base Duration: ${b.baseDuration.toFixed(3)} ms\n`;
    output += `    Avg. Actual Duration: ${b.actualDuration.toFixed(3)} ms\n`;
  });
  output += "==========================\n";
  console.log(output);
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
    benchmarks[phase].rawRenderTime += rawRenderTime / RENDERS;
    benchmarks[phase].baseDuration += baseDuration / RENDERS;
    benchmarks[phase].actualDuration += actualDuration / RENDERS;
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
