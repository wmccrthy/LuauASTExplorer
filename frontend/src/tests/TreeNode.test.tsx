import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TreeNodeContainer from "../components/TreeNodeContainer";
import { CodeTranslationContext } from "../context/codeTranslationContext";
import {
  mockTypelessToken,
  defaultProps,
  MockProvider,
  getQueryableNode
} from "./TreeNodeTestUtils";

describe("TreeNode", () => {
  test("renders primitive values correctly", () => {
    render(
      <MockProvider>
        <TreeNodeContainer value="test value" {...defaultProps} />
      </MockProvider>
    );

    const nodeQuery = getQueryableNode("root");
    expect(nodeQuery.getByText(/root: "test value"/)).toBeInTheDocument();
  });

  test("renders empty arrays", () => {
    render(
      <MockProvider>
        <TreeNodeContainer value={[]} {...defaultProps} />
      </MockProvider>
    );

    const nodeQuery = getQueryableNode("root");
    expect(nodeQuery.getByText(/root: \[\]/)).toBeInTheDocument();
  });

  test("renders empty objects", () => {
    render(
      <MockProvider>
        <TreeNodeContainer value={{}} {...defaultProps} />
      </MockProvider>
    );
    const nodeQuery = getQueryableNode("root");
    expect(nodeQuery.getByText(/root: \{\}/)).toBeInTheDocument();
  });

  describe("expandable nodes", () => {
    test("arrays can be expanded/collapsed", () => {
      const arrayValue = ["item1", "item2"];
      render(
        <MockProvider>
          <TreeNodeContainer value={arrayValue} {...defaultProps} />
        </MockProvider>
      );

      // expaned by default
      const nodeQuery = getQueryableNode("root");
      const expandButton = nodeQuery.getByText("▼");
      expect(expandButton).toBeInTheDocument();
      // collapse
      fireEvent.click(expandButton.parentElement!);
      expect(nodeQuery.getByText("▶")).toBeInTheDocument();
      expect(() => nodeQuery.getByText(/\[0\]: "item1"/)).toThrow();

      // expand
      fireEvent.click(expandButton.parentElement!);
      expect(nodeQuery.getByText("▼")).toBeInTheDocument();
      expect(nodeQuery.getByText(/\[0\]: "item1"/)).toBeInTheDocument();
    });

    test("objects can be expanded/collapsed", () => {
      const objValue = { prop1: "value1", prop2: "value2" };
      render(
        <MockProvider>
          <TreeNodeContainer value={objValue} {...defaultProps} />
        </MockProvider>
      );

      // expanded by default
      const nodeQuery = getQueryableNode("root");
      const expandButton = nodeQuery.getByText("▼");
      expect(expandButton).toBeInTheDocument();
      // collapse
      fireEvent.click(expandButton.parentElement!);
      expect(nodeQuery.getByText("▶")).toBeInTheDocument();
      expect(() => nodeQuery.getByText(/prop1: "value1"/)).toThrow();
      // expand
      fireEvent.click(expandButton.parentElement!);
      expect(nodeQuery.getByText("▼")).toBeInTheDocument();
      expect(nodeQuery.getByText(/prop1: "value1"/)).toBeInTheDocument();
      expect(nodeQuery.getByText(/prop2: "value2"/)).toBeInTheDocument();
    });
  });

  describe("diff mode", () => {
    test("renders added status", () => {
      render(
        <MockProvider>
          <TreeNodeContainer
            value="new value"
            isDiffMode={true}
            diffStatus="added"
            {...defaultProps}
          />
        </MockProvider>
      );

      const nodeQuery = getQueryableNode("root");
      expect(nodeQuery.getByText("+")).toBeInTheDocument();
      expect(nodeQuery.getByText('root: "new value"')).toBeInTheDocument();
    });

    test("renders removed status", () => {
      render(
        <MockProvider>
          <TreeNodeContainer
            value="old value"
            {...defaultProps}
            isDiffMode={true}
            diffStatus="removed"
          />
        </MockProvider>
      );

      const nodeQuery = getQueryableNode("root");
      expect(nodeQuery.getByText("-")).toBeInTheDocument();
    });

    test("renders updated status with before/after", () => {
      render(
        <MockProvider>
          <TreeNodeContainer
            {...defaultProps}
            isDiffMode={true}
            diffStatus="updated"
            value="new"
            beforeValue="old"
            afterValue="new"
          />
        </MockProvider>
      );

      const nodeQuery = getQueryableNode("root");
      expect(nodeQuery.getByText("~")).toBeInTheDocument();
      expect(nodeQuery.getByText('"old"')).toBeInTheDocument();
      expect(nodeQuery.getByText("→")).toBeInTheDocument();
      expect(nodeQuery.getByText('"new"')).toBeInTheDocument();
    });
  });

  describe("type annotations", () => {
    test("displays type information for AST nodes", () => {
      const astNode = {
        _astType: "AstExpr",
        kind: "expression",
        value: "test",
      };

      render(
        <MockProvider>
          <TreeNodeContainer value={astNode} {...defaultProps} />
        </MockProvider>
      );

      const nodeQuery = getQueryableNode("root");
      expect(nodeQuery.getByText(/type: AstExpr/)).toBeInTheDocument();
      expect(() => nodeQuery.getByText('_astType: "AstExpr"')).toThrow(); // should filter out _astType
    });

    test("extracts old types from childChanges", () => {
      // redundant test case, we already similar test above in "renders updated status with before/after"
      // this test is slightly diffe
      const nodeWithTypeChange = {
        _astType: "AstLocal",
        name: "newName",
        childChanges: {
          _astType: {
            type: "UPDATE",
            oldValue: "AstExpr",
            value: "AstLocal",
          },
        },
      };

      render(
        <MockProvider>
          <TreeNodeContainer
            value={nodeWithTypeChange}
            {...defaultProps}
            isDiffMode={true}
            diffStatus="contains-changes"
          />
        </MockProvider>
      );

      // Should show both old and new type annotations
      const nodeQuery = getQueryableNode("root", "nodeHeader");
      expect(nodeQuery.getByText(/type: AstExpr/)).toBeInTheDocument(); // Previous type
      expect(nodeQuery.getByText(/type: AstLocal/)).toBeInTheDocument(); // Current type
      expect(nodeQuery.getByText("→")).toBeInTheDocument(); // Arrow between them
    });
  });

  describe("search highlighting", () => {
    test("highlights matching search terms", () => {
      render(
        <MockProvider>
          <TreeNodeContainer
            value="test value"
            {...defaultProps}
            searchTerm="root"
          />
        </MockProvider>
      );

      const nodeQuery = getQueryableNode("root");
      const highlighted = nodeQuery.getByText("root");
      expect(highlighted).toHaveClass("search-match");
    });
  });

  describe("parentInferredType base logic", () => {
    test("infers types for nodes without _astType using parent context", () => {
      const root = {
        _astType: "_testType",
        name: mockTypelessToken(""),
      };

      render(
        <MockProvider>
          <TreeNodeContainer value={root} {...defaultProps} />
        </MockProvider>
      );
      const nodeQuery = getQueryableNode("root.name", "nodeHeader");
      expect(nodeQuery).toBeDefined();
      // Should infer from _testType that name property is of Token type
      expect(nodeQuery.getByText(/type: Token/)).toBeInTheDocument();
    });

    test("infers types for array items from parent property definition", () => {
      // Test actual inference: parent has AST type with array property, children have no _astType
      const blockWithStatements = {
        _astType: "AstStatBlock", // Parent type that has `statements: { AstStat }` property
        statements: [{}, {}],
      };

      render(
        <MockProvider>
          <TreeNodeContainer value={blockWithStatements} {...defaultProps} />
        </MockProvider>
      );

      // The statements array should get inferred type from AstStatBlock definition
      const statementsQuery = getQueryableNode("root.statements", "nodeHeader");
      expect(
        statementsQuery.getByText(/type: { AstStat }/)
      ).toBeInTheDocument();
    });

    test("fallback chain: _astType -> parentInferred -> array inference", () => {
      // Test actual fallback: parent type defines array property, mixed content with/without _astType
      const tableWithEntries = {
        _astType: "AstExprTable", // Parent type that has `entries: { AstExprTableItem }` property
        entries: [
          { text: "filler" }, // No _astType - should infer AstExprTableItem from parent definition
          { _astType: "MySpecialType" }, // Has _astType - should use that directly
        ],
      };

      render(
        <MockProvider>
          <TreeNodeContainer value={tableWithEntries} {...defaultProps} />
        </MockProvider>
      );

      // The entries array should get inferred type from AstExprTable definition
      const entriesQuery = getQueryableNode("root.entries", "nodeHeader");
      expect(
        entriesQuery.getByText(/type: { AstExprTableItem }/)
      ).toBeInTheDocument();

      // First item should infer type from parent array definition
      const item0Query = getQueryableNode("root.entries.0", "nodeHeader");
      expect(
        item0Query.getByText(/type: AstExprTableItem/)
      ).toBeInTheDocument();

      // Second item should use its explicit _astType
      const item1Query = getQueryableNode("root.entries.1", "nodeHeader");
      expect(item1Query.getByText(/type: MySpecialType/)).toBeInTheDocument();
    });
  });

  describe("removed node handling", () => {
    test("correctly resolves types for removed keys", () => {
      const functionWithRemovedName = {
        _astType: "Token",
        ...mockTypelessToken("test"),
        removedName: mockTypelessToken("oldGlobalName", "removed"), // This was removed
        childChanges: {
          removedName: {
            type: "REMOVE",
            value: mockTypelessToken("oldGlobalName"),
          },
          _astType: {
            type: "UPDATE",
            oldValue: "_testType",
            value: "Token",
          },
        },
      };

      render(
        <MockProvider>
          <TreeNodeContainer
            value={functionWithRemovedName}
            {...defaultProps}
            isDiffMode={true}
            diffStatus="contains-changes"
          />
        </MockProvider>
      );

      // Should show removed indicator for the removed property
      const removedNode = getQueryableNode("root.removedName");
      expect(removedNode.getByText("-")).toBeInTheDocument();
      // The removed property should still be rendered and get proper type tooltip (inferred from parent of _testType)
      expect(removedNode.getByText(/removedName/)).toBeInTheDocument();
      expect(removedNode.getByText(/type: Token/)).toBeInTheDocument;
      // also want to verify that root has before->after type annotation display
      const rootNodeHeader = getQueryableNode("root", "nodeHeader");
      expect(rootNodeHeader.getByText(/type: _testType/)).toBeInTheDocument();
      expect(rootNodeHeader.getByText("→")).toBeInTheDocument();
      expect(rootNodeHeader.getByText(/type: Token/)).toBeInTheDocument();
    });
  });

  describe("getChildDiffProps logic", () => {
    test("propagates diff props for primitive child changes", () => {
      const nodeWithPrimitiveChanges = {
        _astType: "AstLocal", // Need a valid AST type
        name: "newValue",
        childChanges: {
          name: {
            type: "UPDATE",
            oldValue: "oldValue",
            value: "newValue",
          },
        },
      };

      render(
        <MockProvider>
          <TreeNodeContainer
            value={nodeWithPrimitiveChanges}
            {...defaultProps}
            isDiffMode={true}
            diffStatus="contains-changes"
          />
        </MockProvider>
      );

      const parentQuery = getQueryableNode("root.name");
      expect(parentQuery.getByText("~")).toBeInTheDocument();
      expect(parentQuery.getByText('"oldValue"')).toBeInTheDocument();
      expect(parentQuery.getByText("→")).toBeInTheDocument();
      expect(parentQuery.getByText('"newValue"')).toBeInTheDocument();
    });

    test("propagates diff props for object child changes", () => {
      const nodeWithObjectChanges = {
        _astType: "AstStatFunction", // Valid parent type
        expr: {
          _astType: "AstExpr",
          name: "newExpr",
        },
        childChanges: {
          expr: {
            type: "ADD",
            value: { _astType: "AstExpr", name: "newExpr" },
          },
        },
      };

      render(
        <MockProvider>
          <TreeNodeContainer
            value={nodeWithObjectChanges}
            {...defaultProps}
            isDiffMode={true}
            diffStatus="contains-changes"
          />
        </MockProvider>
      );

      // Child object should show added indicator
      const childQuery = getQueryableNode("root.expr");
      expect(childQuery.getByText("+")).toBeInTheDocument();
    });
  });

  describe("array type inference edge cases", () => {
    test("handles punctuated arrays", () => {
      const punctuatedNode = {
        _astType: "AstFunctionBody",
        parameters: [
          // Use proper Punctuated<AstLocal> structures
          {
            node: { name: mockTypelessToken("param1") },
            separator: mockTypelessToken(","),
          },
          {
            node: { name: mockTypelessToken("param2") },
          },
        ],
      };

      render(
        <MockProvider>
          <TreeNodeContainer value={punctuatedNode} {...defaultProps} />
        </MockProvider>
      );

      // Should handle punctuated structure correctly
      const parametersNode = getQueryableNode("root.parameters", "nodeHeader");
      expect(
        parametersNode.getByText(/type: Punctuated<AstLocal>/)
      ).toBeInTheDocument();
      const param1Node = getQueryableNode("root.parameters.0", "nodeHeader");
      expect(param1Node.getByText(/type: Pair<AstLocal>/)).toBeInTheDocument();
    });
  });

  describe("edge cases and error handling", () => {
    test("handles malformed AST nodes", () => {
      // Test with a node that has undefined _astType (more realistic than null)
      const malformedNode = {
        ...mockTypelessToken("test"),
        // Don't set _astType at all, this simulates real malformed data
        kind: "something",
        invalidProperty: undefined,
      };

      render(
        <MockProvider>
          <TreeNodeContainer value={malformedNode} {...defaultProps} />
        </MockProvider>
      );

      // Should render without crashing
      const nodeQuery = getQueryableNode("root");
      expect(nodeQuery.getByText(/root/)).toBeInTheDocument();
    });

    test("handles mixed array content", () => {
      // not sure if I see point in this case? will never happen in our use case
      const mixedArray = [
        "string item",
        { _astType: "AstExpr", name: "expr" },
        123,
        undefined,
      ];

      render(
        <MockProvider>
          <TreeNodeContainer value={mixedArray} {...defaultProps} />
        </MockProvider>
      );

      // Should handle all types gracefully - check items directly
      const item0Query = getQueryableNode("root.0");
      expect(item0Query.getByText(/\[0\]: "string item"/)).toBeInTheDocument();

      const item1Query = getQueryableNode("root.1");
      expect(item1Query.getByText(/\[1\]/)).toBeInTheDocument();

      const item2Query = getQueryableNode("root.2");
      expect(item2Query.getByText(/\[2\]: 123/)).toBeInTheDocument();

      const item3Query = getQueryableNode("root.3");
      expect(item3Query.getByText(/\[3\]: null/)).toBeInTheDocument();
    });
  });

  describe("auto-collapse integration", () => {
    test("respects auto-collapse in normal mode", () => {
      // span nodes should auto-collapse
      const spanNode = {
        _astType: "span",
        beginline: 1,
        begincolumn: 5,
        endline: 1,
        endcolumn: 10,
      };

      render(
        <MockProvider>
          <TreeNodeContainer
            value={spanNode}
            {...defaultProps}
            isDiffMode={false}
          />
        </MockProvider>
      );

      // Should be collapsed by default (span auto-collapses)
      const nodeQuery = getQueryableNode("root", "nodeHeader");
      expect(nodeQuery.getByText("▶")).toBeInTheDocument();
    });

    test("auto-collapse for changed nodes in diff mode", () => {
      const changedSpanNode = {
        _astType: "span",
        beginline: 2,
        begincolumn: 10,
        endline: 2,
        endcolumn: 15,
        childChanges: {
          beginline: {
            type: "UPDATE",
            oldValue: 1,
            value: 2,
          },
        },
      };

      const { unmount } = render(
        <MockProvider>
          <TreeNodeContainer
            value={changedSpanNode}
            {...defaultProps}
            isDiffMode={true}
            diffStatus="contains-changes"
          />
        </MockProvider>
      );

      const nodeQuery = getQueryableNode("root", "nodeHeader");
      expect(nodeQuery.getByText("▶")).toBeInTheDocument(); // span still auto-collapses (expected)
      expect(nodeQuery.getByText("○")).toBeInTheDocument(); // But shows diff indicator (bc in collapsed state)

      // unmount first render
      unmount();

      const changedExpandedNode = mockTypelessToken("test", "contains-changes"); // Node with changes we expect to auto expand
      render(
        <MockProvider>
          <TreeNodeContainer value={changedExpandedNode} {...defaultProps} />
        </MockProvider>
      );
      const expandedNode = getQueryableNode("root", "nodeHeader");
      expect(expandedNode.getByText("▼")).toBeInTheDocument(); // Node expanded bc does not auto-collapse AND has updates
    });
  });

  // Test that "unchanged" forces collapse even for normally expanded types
  test("forces collapse for unchanged nodes in diff mode", () => {
    const normallyExpandedNode = {
      _astType: "AstExprTable", // Normally expands
      entries: [{ item: "test" }],
    };

    render(
      <MockProvider>
        <TreeNodeContainer
          value={normallyExpandedNode}
          {...defaultProps}
          isDiffMode={true}
          diffStatus="unchanged" // Forces collapse
        />
      </MockProvider>
    );

    const nodeQuery = getQueryableNode("root", "nodeHeader");
    expect(nodeQuery.getByText("▶")).toBeInTheDocument(); // Should be collapsed
  });

  // Test that "removed" forces collapse
  test("forces collapse for removed nodes in diff mode", () => {
    const normallyExpandedNode = {
      _astType: "AstExprTable",
      entries: [{ item: "test" }],
    };

    render(
      <MockProvider>
        <TreeNodeContainer
          value={normallyExpandedNode}
          {...defaultProps}
          isDiffMode={true}
          diffStatus="removed" // Forces collapse
        />
      </MockProvider>
    );

    const nodeQuery = getQueryableNode("root", "nodeHeader");
    expect(nodeQuery.getByText("▶")).toBeInTheDocument();
  });

  // add tests for CodeTooltip logic; can provide simple mock (rather than just empty function) to use
  // Enhanced mock provider with tooltip tracking
  const createMockProviderWithTooltips = (initialTooltips = {}) => {
    const mockRequestCodeTooltip = jest.fn();
    const MockProviderWithTooltips: React.FC<{ children: React.ReactNode }> = ({
      children,
    }) => (
      <CodeTranslationContext.Provider
        value={{
          codeTooltips: initialTooltips,
          requestCodeTooltip: mockRequestCodeTooltip,
          generateNodeId: (value, nodeKey) =>
            `${nodeKey}-${JSON.stringify(value).substring(0, 10)}`,
        }}
      >
        {children}
      </CodeTranslationContext.Provider>
    );
    return { MockProviderWithTooltips, mockRequestCodeTooltip };
  };

  describe("CodeTooltip logic", () => {
    test("requests tooltip on hover for objects/arrays", () => {
      const { MockProviderWithTooltips, mockRequestCodeTooltip } =
        createMockProviderWithTooltips();
      const objValue = { prop: "value" };

      render(
        <MockProviderWithTooltips>
          <TreeNodeContainer value={objValue} {...defaultProps} />
        </MockProviderWithTooltips>
      );

      const nodeQuery = getQueryableNode("root", "node");
      fireEvent.mouseEnter(nodeQuery.getByTestId("nodeHeader-root"));

      expect(mockRequestCodeTooltip).toHaveBeenCalledWith(objValue, "root");
    });

    test("does not request tooltip for primitives", () => {
      const { MockProviderWithTooltips, mockRequestCodeTooltip } =
        createMockProviderWithTooltips();

      render(
        <MockProviderWithTooltips>
          <TreeNodeContainer value="primitive" {...defaultProps} />
        </MockProviderWithTooltips>
      );

      fireEvent.mouseEnter(screen.getByTestId("node-root"));

      expect(mockRequestCodeTooltip).not.toHaveBeenCalled();
    });

    test("does not re-request cached tooltips", () => {
      const objValue = { prop: "value" };
      const nodeId = `root-${JSON.stringify(objValue).substring(0, 10)}`;
      const { MockProviderWithTooltips, mockRequestCodeTooltip } =
        createMockProviderWithTooltips({
          [nodeId]: "cached tooltip content",
        });

      render(
        <MockProviderWithTooltips>
          <TreeNodeContainer value={objValue} {...defaultProps} />
        </MockProviderWithTooltips>
      );

      fireEvent.mouseEnter(screen.getByTestId("nodeHeader-root"));

      expect(mockRequestCodeTooltip).not.toHaveBeenCalled(); // Should use cache
    });
  });
});
