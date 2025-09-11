import { render, screen } from "@testing-library/react";
import React, { Profiler } from "react";

// component
interface BenchmarkArgs {
  componentName: string;
  children: React.ReactNode;
}

interface Benchmarks {
  rawRenderTime: number[];
  baseDuration: number[];
  actualDuration: number[];
}

const avg = (arr: number[]) => {
  let avg = 0;
  arr.forEach((val) => {
    avg += val / arr.length;
  });
  return avg;
};

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
  unmount();
  const phases = ["mount", "update", "nested-update"];
  phases.forEach((phase) => {
    benchmarks[phase] = {
      rawRenderTime: [],
      baseDuration: [],
      actualDuration: [],
    };
  });
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
    output += ` Avg. Raw Render Time: ${avg(b.rawRenderTime).toFixed(3)} ms\n`;
    output += ` Avg. Base Duration: ${avg(b.baseDuration).toFixed(3)} ms\n`;
    output += ` Avg. Actual Duration: ${avg(b.actualDuration).toFixed(3)} ms\n`;
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
    benchmarks[phase].rawRenderTime.push(rawRenderTime);
    benchmarks[phase].baseDuration.push(baseDuration);
    benchmarks[phase].actualDuration.push(actualDuration);
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
    const { unmount } = render(
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
