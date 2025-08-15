import { createContext, useContext } from "react";

interface CodeTranslation {
  codeTooltips: Record<string, string>;
  requestCodeTooltip: (nodeValue: any, nodeKey: string) => void;
  generateNodeId: (nodeValue: any, nodeKey: string) => string;
}

export const CodeTranslationContext =
  createContext<CodeTranslation | null>(null);

export const useCodeTranslationContext = () => {
  const context = useContext(CodeTranslationContext);
  if (!context) {
    throw new Error("useCodeTranslationContext must be used within a CodeTranslationProvider");
  }
  return context;
};
