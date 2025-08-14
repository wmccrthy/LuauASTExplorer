import { createContext, useContext } from "react";

interface CodeTranslation {
  codeTooltips: Record<string, string>;
  requestCodeTooltip: (nodeValue: string, nodeKey: string) => void;
  generateNodeId: (nodeValue: string, nodeKey: string) => string;
}

export const CodeTranslationContext =
  createContext<CodeTranslation | null>(null);

export const useCodeTranslationContext = () => {
  const context = useContext(CodeTranslationContext);
  if (!context) {
    throw new Error("useCache must be used within a CacheProvider");
  }
  return context;
};
