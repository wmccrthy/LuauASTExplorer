import TreeNodeContainer from "../components/TreeNodeContainer";
import { benchmark } from "./Benchmarker";
import {
  mockTestType,
  defaultProps,
  MockProvider,
} from "../tests/TreeNodeTestUtils";
import { fireEvent } from "@testing-library/dom";

const root = {
  _astType: "AstStatBlock",
  statements: [mockTestType(), mockTestType()],
};

test("TreeNode benchmarks", () => {
  benchmark(
    {
      componentName: "TreeNode",
      children: (
        <MockProvider>
          <TreeNodeContainer value={root} {...defaultProps}></TreeNodeContainer>
        </MockProvider>
      ),
    },
    {
      event: (screen: any) => {
        const rootNode = screen.getByTestId("nodeHeader-root");
        fireEvent.click(rootNode);
      },
      eventName: "Toggle Collapse/Expand",
    }
  );
});
