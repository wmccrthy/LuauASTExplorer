// Metadata - debugging/structural info, least visually important
export const metadata = [
  // Location and position information
  "leadingTrivia",
  "trailingTrivia",
  "location",
  "position",
  "argLocation",
  "indexLocation",

  // Structural metadata
  "upvalue",
  "self",
  "blockDepth",
  "quoteStyle",
];

// Secondary - structural keywords and important syntax, medium importance
export const secondary = [
  // Language keywords
  "functionKeyword",
  "localKeyword",
  "ifKeyword",
  "thenKeyword",
  "elseKeyword",
  "elseifKeyword",
  "endKeyword",
  "whileKeyword",
  "doKeyword",
  "forKeyword",
  "inKeyword",
  "repeatKeyword",
  "untilKeyword",
  "returnKeyword",
  "breakKeyword",
  "continueKeyword",
  "export",
  "typeToken",

  // Block delimiters (more important than pure syntax)
  "openBrace",
  "closeBrace",
  "openParens",
  "closeParens",
  "openParen",
  "closeParen",

  // Generic/type delimiters
  "openGenerics",
  "closeGenerics",

  // Names and tokens (identifiers)
  "name",
  "token",
];

// Syntax - pure punctuation, operators, separators, least structurally important
export const syntax = [
  // Brackets and indexing
  "openBrackets",
  "closeBrackets",
  "openBracket",
  "closeBracket",

  // Operators and assignment
  "equals",
  "operator",
  "accessor",
  "colon",

  // Separators and punctuation
  "comma",
  "semicolon",
  "ellipsis",
];

// Helper functions for categorizing nodes
export const getNodeImportance = (
  nodeKey: string
): "metadata" | "secondary" | "syntax" | "primary" => {
  if (metadata.includes(nodeKey)) return "metadata";
  if (secondary.includes(nodeKey)) return "secondary";
  if (syntax.includes(nodeKey)) return "syntax";
  return "primary";
};

export const getNodeImportanceClass = (nodeKey: string): string => {
  const importance = getNodeImportance(nodeKey);
  return `node-${importance}`;
};

export const shouldAutoCollapse = (nodeKey: string): boolean => {
  return getNodeImportance(nodeKey) !== "primary";
};
