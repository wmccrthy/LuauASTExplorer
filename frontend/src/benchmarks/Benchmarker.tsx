import { render, screen } from "@testing-library/react";
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

const resetBenchmarks = (benchmarks: BenchmarksCache, unmount: () => void) => {
  const phases = ["mount", "update", "nested-update"];
  phases.forEach((phase) => {
    benchmarks[phase] = {
      rawRenderTime: 0,
      baseDuration: 0,
      actualDuration: 0,
    };
  });
  unmount();
};

const logBenchmarks = (benchmarks: BenchmarksCache, testing: string = "") => {
  const phases = ["mount", "update", "nested-update"];
  let output = `\n==== ${testing}Benchmark Results ====`;
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

export const benchmark = (
  args: BenchmarkArgs,
  event?: {
    event: (ProfiledComponent: any) => void;
    eventName: string;
  },
  silent: boolean = false
) => {
  // initialize benchmarks
  const benchmarks: BenchmarksCache = {}; // cache rendering results by the phase
  resetBenchmarks(benchmarks, () => {
    return;
  });

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

  const { rerender, unmount } = render(
    <ProfiledComponent
      onRenderCallback={onRenderCallback}
      componentName={args.componentName}
    >
      {args.children}
    </ProfiledComponent>
  );

  // render ProfiledComponent 100 times with same props; report benchmarks
  for (let i = 0; i < RENDERS; i++) {
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
    logBenchmarks(benchmarks, "Renders no prop changes ");
  }
  resetBenchmarks(benchmarks, unmount);

  if (event) {
    render(
      <ProfiledComponent
        onRenderCallback={onRenderCallback}
        componentName={args.componentName}
      >
        {args.children}
      </ProfiledComponent>
    );

    for (let i = 0; i < RENDERS; i++) {
      // presumably, events will be things like clicks, etc that prompt state changes
      event.event(screen);
    }

    if (!silent) {
      logBenchmarks(benchmarks, `Renders on ${event.eventName} `);
    }
    resetBenchmarks(benchmarks, unmount);
  }
};
