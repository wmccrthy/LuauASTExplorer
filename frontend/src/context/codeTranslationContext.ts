import { createContext, useContext } from "react";

interface CodeTranslationContext {
  codeTooltips: Record<string, string>;
  requestCodeTooltip: (nodeValue: string, nodeKey: string) => void;
  generateNodeId: (nodeValue: string, nodeKey: string) => string;
}

export const CodeTranslationContext =
  createContext<CodeTranslationContext | null>(null);

export const useCodeTranslationContext = () => {
  const context = useContext(CodeTranslationContext);
  if (!context) {
    throw new Error("useCache must be used within a CacheProvider");
  }
  return context;
};
