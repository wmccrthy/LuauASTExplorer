import TreeNodeContainer from "../components/TreeNodeContainer";
import { benchmark } from "./Benchmarker";
import {
  mockTestType,
  defaultProps,
  MockProvider,
} from "../tests/TreeNodeTestUtils";



const root = {
    _astType: "AstStatBlock",
    statements: [
        mockTestType(),
        mockTestType(),
        mockTestType(),
        mockTestType(),
        mockTestType(),
    ]
}

test("TreeNode benchmarks", () => {
  benchmark({
    componentName: "TreeNode",
    children: (
      <MockProvider>
        <TreeNodeContainer value={root} {...defaultProps}></TreeNodeContainer>
      </MockProvider>
    ),
  });
});
