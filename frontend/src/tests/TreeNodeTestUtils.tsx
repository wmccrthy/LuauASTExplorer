import { CodeTranslationContext } from "../context/codeTranslationContext";
import { screen, within } from "@testing-library/react";

export const mockTrivia = () => {
  return [
    {
      tag: "",
      location: "",
      text: "",
    },
  ];
};

export const mockTypelessToken = (text: string, diffStatus?: string) => {
  return {
    leadingTrivia: mockTrivia(),
    trailingTrivia: mockTrivia(),
    text: text,
    position: {},
    diffStatus: diffStatus,
  };
};

export const mockTestType = () => {
  return {
    _astType: "_testType",
    name: mockTypelessToken(""),
  };
};


export const defaultProps = {
  level: 0,
  searchTerm: "",
  hiddenNodes: [],
  nodeKey: "root",
  path: "root",
};

// Mock the context to avoid needing the full setup
export const MockProvider: React.FC<{ children: React.ReactNode }> = ({
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

export const getQueryableNode = (nodePath: string, idPrefix: string = "node") => {
  const el = screen.getByTestId(`${idPrefix}-${nodePath}`);
  const queryable = within(el);
  return queryable;
};
