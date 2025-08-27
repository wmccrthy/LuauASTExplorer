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

const mockToken = (text: string, diffStatus?: string) => {
  return {
    leadingTrivia: {},
    trailingTrivia: {},
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

  describe("removed node handling", () => {
    test("correctly resolves types for removed keys", () => {
      const functionWithRemovedName = {
        _astType: "Token",
        position: {},
        leadingTrivia: {},
        trailingTrivia: {},
        text: "test",
        removedName: mockToken("oldGlobalName", "removed"), // This was removed
        childChanges: {
          removedName: {
            type: "REMOVE",
            value: mockToken("oldGlobalName"),
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
