import { benchmark } from "./Benchmarker";

describe("benchmark", () => {
    test("it runs", () => {
        const benchArgs = {
            componentName: "button",
            children: <button></button>
        }
        benchmark(benchArgs, true);
    });
});