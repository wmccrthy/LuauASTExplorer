import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import TreeNodeContainer from "../TreeNode";
import { CodeTranslationContext } from "../context/codeTranslationContext";

// Mock the context to avoid needing the full setup
const MockProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <CodeTranslationContext.Provider
    value={{
      codeTooltips: {},
      requestCodeTooltip: () => {},
      generateNodeId: () => "",
    }}
  >
    {children}
  </CodeTranslationContext.Provider>
);

const getQueryableNode = (nodePath: string, idPrefix: string = "node") => {
  const el = screen.getByTestId(`${idPrefix}-${nodePath}`);
  const queryable = within(el);
  return queryable;
};

const mockTrivia = () => {
  return [
    {
      tag: "",
      location: "",
      text: "",
    },
  ];
};

const mockTypelessToken = (text: string, diffStatus?: string) => {
  return {
    leadingTrivia: mockTrivia(),
    trailingTrivia: mockTrivia(),
    text: text,
    position: {},
    diffStatus: diffStatus,
  };
};

describe("TreeNode", () => {
  const defaultProps = {
    nodeKey: "test",
    value: "test value",
    level: 0,
    path: "test",
    searchTerm: "",
    isDiffMode: false,
    hiddenNodes: [],
  };

  test("renders primitive values correctly", () => {
    render(
      <MockProvider>
        <TreeNodeContainer {...defaultProps} />
      </MockProvider>
    );

    expect(screen.getByText(/test: "test value"/)).toBeInTheDocument();
  });

  test("renders empty arrays", () => {
    render(
      <MockProvider>
        <TreeNodeContainer {...defaultProps} value={[]} nodeKey="items" />
      </MockProvider>
    );

    expect(screen.getByText(/items: \[\]/)).toBeInTheDocument();
  });

  test("renders empty objects", () => {
    render(
      <MockProvider>
        <TreeNodeContainer {...defaultProps} value={{}} nodeKey="obj" />
      </MockProvider>
    );

    expect(screen.getByText(/obj: \{\}/)).toBeInTheDocument();
  });

  describe("expandable nodes", () => {
    test("arrays can be expanded/collapsed", () => {
      const arrayValue = ["item1", "item2"];
      render(
        <MockProvider>
          <TreeNodeContainer
            value={arrayValue}
            nodeKey="root"
            level={0}
            path="root"
          />
        </MockProvider>
      );

      // expaned by default
      const expandButton = screen.getByText("▼");
      expect(expandButton).toBeInTheDocument();
      // collapse
      fireEvent.click(expandButton.parentElement!);
      expect(screen.getByText("▶")).toBeInTheDocument();
      expect(() => screen.getByText(/\[0\]: "item1"/)).toThrow();

      // expand
      fireEvent.click(expandButton.parentElement!);
      expect(screen.getByText("▼")).toBeInTheDocument();
      expect(screen.getByText(/\[0\]: "item1"/)).toBeInTheDocument();
    });

    test("objects can be expanded/collapsed", () => {
      const objValue = { prop1: "value1", prop2: "value2" };
      render(
        <MockProvider>
          <TreeNodeContainer
            value={objValue}
            nodeKey="root"
            level={0}
            path="root"
          />
        </MockProvider>
      );

      // expanded by default
      const expandButton = screen.getByText("▼");
      expect(expandButton).toBeInTheDocument();
      // collapse
      fireEvent.click(expandButton.parentElement!);
      expect(screen.getByText("▶")).toBeInTheDocument();
      expect(() => screen.getByText(/prop1: "value1"/)).toThrow();
      // expand
      fireEvent.click(expandButton.parentElement!);
      expect(screen.getByText("▼")).toBeInTheDocument();
      expect(screen.getByText(/prop1: "value1"/)).toBeInTheDocument();
      expect(screen.getByText(/prop2: "value2"/)).toBeInTheDocument();
    });
  });

  describe("diff mode", () => {
    test("renders added status", () => {
      render(
        <MockProvider>
          <TreeNodeContainer
            nodeKey="root"
            value="new value"
            level={0}
            path="root"
            isDiffMode={true}
            diffStatus="added"
          />
        </MockProvider>
      );

      expect(screen.getByText("+")).toBeInTheDocument();
      expect(screen.getByText('root: "new value"')).toBeInTheDocument();
    });

    test("renders removed status", () => {
      render(
        <MockProvider>
          <TreeNodeContainer
            nodeKey="root"
            value="old value"
            level={0}
            path="root"
            isDiffMode={true}
            diffStatus="removed"
          />
        </MockProvider>
      );

      expect(screen.getByText("-")).toBeInTheDocument();
    });

    test("renders updated status with before/after", () => {
      render(
        <MockProvider>
          <TreeNodeContainer
            nodeKey="root"
            level={0}
            path="root"
            isDiffMode={true}
            diffStatus="updated"
            value="new"
            beforeValue="old"
            afterValue="new"
          />
        </MockProvider>
      );

      expect(screen.getByText("~")).toBeInTheDocument();
      expect(screen.getByText('"old"')).toBeInTheDocument();
      expect(screen.getByText("→")).toBeInTheDocument();
      expect(screen.getByText('"new"')).toBeInTheDocument();
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
          <TreeNodeContainer
            value={astNode}
            nodeKey="expr"
            level={0}
            path="expr"
          />
        </MockProvider>
      );

      expect(screen.getByText(/type: AstExpr/)).toBeInTheDocument();
      expect(() => screen.getByText('_astType: "AstExpr"')).toThrow(); // should filter out _astType
    });

    test("handles type changes in diff mode", () => {
      const astNode = {
        _astType: "AstLocal",
        childChanges: {
          _astType: { oldValue: "AstExpr" },
        },
      };

      render(
        <MockProvider>
          <TreeNodeContainer
            nodeKey="root"
            value={astNode}
            level={0}
            path="root"
            isDiffMode={true}
            diffStatus="contains-changes"
          />
        </MockProvider>
      );

      // Should show both old and new types
      expect(screen.getByText(/type: AstExpr/)).toBeInTheDocument();
      expect(screen.getByText(/type: AstLocal/)).toBeInTheDocument();
      expect(screen.getByText("→")).toBeInTheDocument();
    });
  });

  describe("search highlighting", () => {
    test("highlights matching search terms", () => {
      render(
        <MockProvider>
          <TreeNodeContainer
            nodeKey="search"
            value="test value"
            level={0}
            path="search"
            searchTerm="search"
          />
        </MockProvider>
      );

      const highlighted = screen.getByText("search");
      expect(highlighted).toHaveClass("search-match");
    });
  });

  describe("parentInferredType base logic", () => {
    test("infers types for nodes without _astType using parent context", () => {
      // Test actual type inference for nodes without _astType
      // the LLM's tests are stupid; we should instead have a value that has nested elements with no _astType value; the root should have a type, so then we can test if the nested value's type is inferred appropriately based on the root's type
      // we can use _testType for simplicity
      const root = {
        _astType: "_testType",
        name: mockTypelessToken(""),
      };

      render(
        <MockProvider>
          <TreeNodeContainer
            nodeKey="root"
            value={root}
            level={0}
            path="root"
          />
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
          <TreeNodeContainer
            nodeKey="block"
            value={blockWithStatements}
            level={0}
            path="block"
          />
        </MockProvider>
      );

      // The statements array should get inferred type from AstStatBlock definition
      const statementsQuery = getQueryableNode(
        "block.statements",
        "nodeHeader"
      );
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
          <TreeNodeContainer
            nodeKey="table"
            value={tableWithEntries}
            level={0}
            path="table"
          />
        </MockProvider>
      );

      // The entries array should get inferred type from AstExprTable definition
      const entriesQuery = getQueryableNode("table.entries", "nodeHeader");
      expect(
        entriesQuery.getByText(/type: { AstExprTableItem }/)
      ).toBeInTheDocument();

      // First item should infer type from parent array definition
      const item0Query = getQueryableNode("table.entries.0", "nodeHeader");
      expect(
        item0Query.getByText(/type: AstExprTableItem/)
      ).toBeInTheDocument();

      // Second item should use its explicit _astType
      const item1Query = getQueryableNode("table.entries.1", "nodeHeader");
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
            nodeKey="root"
            value={functionWithRemovedName}
            level={0}
            path="root"
            isDiffMode={true}
            diffStatus="contains-changes"
          />
        </MockProvider>
      );

      // Should show removed indicator for the removed property
      const removedNode = getQueryableNode("root.removedName");
      expect(removedNode.getByText("-")).toBeInTheDocument();
      // The removed property should still be rendered and get proper type tooltip
      expect(removedNode.getByText(/removedName/)).toBeInTheDocument();
      expect(removedNode.getByText(/type: Token/)).toBeInTheDocument;
      // also want to verify that root has before->after type annotation display
      const rootNodeHeader = getQueryableNode("root", "nodeHeader");
      expect(rootNodeHeader.getByText(/type: _testType/)).toBeInTheDocument();
      expect(rootNodeHeader.getByText("→")).toBeInTheDocument();
      expect(rootNodeHeader.getByText(/type: Token/)).toBeInTheDocument();
    });
  });
});
