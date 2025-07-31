// Might be more robust to scrape the Luau type definitions file directly to get the type definitions... (can be a future feature)

export interface ASTTypeDefinition {
  properties?: string[];
  kinds?: Record<string, ASTTypeDefinition>;
}

export const astTypeDefinitions: Record<string, ASTTypeDefinition> = {
  // === EXPRESSIONS ===
  AstExprGroup: {
    properties: ["tag", "openParens", "expression", "closeParens"],
  },

  AstExprConstantNil: {
    properties: ["leadingTrivia", "position", "text", "trailingTrivia", "tag"],
  },

  AstExprConstantBool: {
    properties: [
      "leadingTrivia",
      "position",
      "text",
      "trailingTrivia",
      "tag",
      "value",
    ],
  },

  AstExprConstantNumber: {
    properties: [
      "leadingTrivia",
      "position",
      "text",
      "trailingTrivia",
      "tag",
      "value",
    ],
  },

  AstExprConstantString: {
    properties: [
      "leadingTrivia",
      "position",
      "text",
      "trailingTrivia",
      "tag",
      "quoteStyle",
      "blockDepth",
    ],
  },

  AstExprLocal: {
    properties: ["tag", "token", "local", "upvalue"],
  },

  AstExprGlobal: {
    properties: ["tag", "name"],
  },

  AstExprVarargs: {
    properties: ["leadingTrivia", "position", "text", "trailingTrivia", "tag"],
  },

  AstExprCall: {
    properties: [
      "tag",
      "func",
      "openParens?",
      "arguments",
      "closeParens?",
      "self",
      "argLocation",
    ],
  },

  AstExprIndexName: {
    properties: ["tag", "expression", "accessor", "index", "indexLocation"],
  },

  AstExprIndexExpr: {
    properties: ["tag", "expression", "openBrackets", "index", "closeBrackets"],
  },

  AstExprAnonymousFunction: {
    properties: ["tag", "attributes", "functionKeyword", "body"],
  },

  AstExprTable: {
    properties: ["tag", "openBrace", "entries", "closeBrace"],
  },

  AstExprTableItem: {
    kinds: {
      list: {
        properties: ["kind", "value", "separator?"],
      },
      record: {
        properties: ["kind", "key", "equals", "value", "separator?"],
      },
      general: {
        properties: [
          "kind",
          "indexerOpen",
          "key",
          "indexerClose",
          "equals",
          "value",
          "separator?",
        ],
      },
    },
  },

  AstExprUnary: {
    properties: ["tag", "operator", "operand"],
  },

  AstExprBinary: {
    properties: ["tag", "lhsoperand", "operator", "rhsoperand"],
  },

  AstExprInterpString: {
    properties: ["tag", "strings", "expressions"],
  },

  AstExprTypeAssertion: {
    properties: ["tag", "operand", "operator", "annotation"],
  },

  AstExprIfElse: {
    properties: [
      "tag",
      "ifKeyword",
      "condition",
      "thenKeyword",
      "consequent",
      "elseifs",
      "elseKeyword",
      "antecedent",
    ],
  },

  // === STATEMENTS ===
  AstStatBlock: {
    properties: ["tag", "statements"],
  },

  AstStatIf: {
    properties: [
      "tag",
      "ifKeyword",
      "condition",
      "thenKeyword",
      "consequent",
      "elseifs",
      "elseKeyword?",
      "antecedent?",
      "endKeyword",
    ],
  },

  AstStatWhile: {
    properties: [
      "tag",
      "whileKeyword",
      "condition",
      "doKeyword",
      "body",
      "endKeyword",
    ],
  },

  AstStatRepeat: {
    properties: ["tag", "repeatKeyword", "body", "untilKeyword", "condition"],
  },

  AstStatBreak: {
    properties: ["leadingTrivia", "position", "text", "trailingTrivia", "tag"],
  },

  AstStatContinue: {
    properties: ["leadingTrivia", "position", "text", "trailingTrivia", "tag"],
  },

  AstStatReturn: {
    properties: ["tag", "returnKeyword", "expressions"],
  },

  AstStatExpr: {
    properties: ["tag", "expression"],
  },

  AstStatLocal: {
    properties: ["tag", "localKeyword", "variables", "equals?", "values"],
  },

  AstStatAssign: {
    properties: ["tag", "variables", "equals", "values"],
  },

  AstStatCompoundAssign: {
    properties: ["tag", "variable", "operand", "value"],
  },

  AstStatFor: {
    properties: [
      "tag",
      "forKeyword",
      "variable",
      "equals",
      "from",
      "toComma",
      "to",
      "stepComma?",
      "step?",
      "doKeyword",
      "body",
      "endKeyword",
    ],
  },

  AstStatForIn: {
    properties: [
      "tag",
      "forKeyword",
      "variables",
      "inKeyword",
      "values",
      "doKeyword",
      "body",
      "endKeyword",
    ],
  },

  AstStatFunction: {
    properties: ["tag", "attributes", "functionKeyword", "name", "body"],
  },

  AstStatLocalFunction: {
    properties: [
      "tag",
      "attributes",
      "localKeyword",
      "functionKeyword",
      "name",
      "body",
    ],
  },

  AstStatTypeAlias: {
    properties: [
      "tag",
      "export?",
      "typeToken",
      "name",
      "openGenerics?",
      "generics?",
      "genericPacks?",
      "closeGenerics?",
      "equals",
      "type",
    ],
  },

  AstStatTypeFunction: {
    properties: ["tag", "export?", "type", "functionKeyword", "name", "body"],
  },

  // === TYPES ===
  AstTypeReference: {
    properties: [
      "tag",
      "prefix?",
      "prefixPoint?",
      "name",
      "openParameters?",
      "parameters?",
      "closeParameters?",
    ],
  },

  AstTypeSingletonBool: {
    properties: [
      "leadingTrivia",
      "position",
      "text",
      "trailingTrivia",
      "tag",
      "value",
    ],
  },

  AstTypeSingletonString: {
    properties: [
      "leadingTrivia",
      "position",
      "text",
      "trailingTrivia",
      "tag",
      "quoteStyle",
    ],
  },

  AstTypeTypeof: {
    properties: ["tag", "typeof", "openParens", "expression", "closeParens"],
  },

  AstTypeGroup: {
    properties: ["tag", "openParens", "type", "closeParens"],
  },

  AstTypeOptional: {
    properties: ["leadingTrivia", "position", "text", "trailingTrivia", "tag"],
  },

  AstTypeUnion: {
    properties: ["tag", "leading?", "types"],
  },

  AstTypeIntersection: {
    properties: ["tag", "leading?", "types"],
  },

  AstTypeArray: {
    properties: ["tag", "openBrace", "access?", "type", "closeBrace"],
  },

  AstTypeTable: {
    properties: ["tag", "openBrace", "entries", "closeBrace"],
  },

  AstTypeTableItem: {
    kinds: {
      indexer: {
        properties: [
          "kind",
          "access?",
          "indexerOpen",
          "key",
          "indexerClose",
          "colon",
          "value",
          "separator?",
        ],
      },
      stringproperty: {
        properties: [
          "kind",
          "access?",
          "indexerOpen",
          "key",
          "indexerClose",
          "colon",
          "value",
          "separator?",
        ],
      },
      property: {
        properties: [
          "kind",
          "access?",
          "key",
          "indexerClose",
          "colon",
          "value",
          "separator?",
        ],
      },
    },
  },

  AstTypeFunction: {
    properties: [
      "tag",
      "openGenerics?",
      "generics?",
      "genericPacks?",
      "closeGenerics?",
      "openParens",
      "parameters",
      "vararg?",
      "closeParens",
      "returnArrow",
      "returnTypes",
    ],
  },

  // === TYPE PACKS ===
  AstTypePackExplicit: {
    properties: ["tag", "openParens?", "types", "tailType?", "closeParens?"],
  },

  AstTypePackGeneric: {
    properties: ["tag", "name", "ellipsis"],
  },

  AstTypePackVariadic: {
    properties: ["tag", "ellipsis?", "type"],
  },

  // === UTILITY TYPES ===
  Position: {
    properties: ["line", "column"],
  },

  Location: {
    properties: ["begin", "end"],
  },

  Token: {
    properties: ["leadingTrivia", "position", "text", "trailingTrivia"],
  },

  Trivia: {
    properties: ["tag", "location", "text"],
  },

  Whitespace: {
    properties: ["tag", "location", "text"],
  },

  SingleLineComment: {
    properties: ["tag", "location", "text"],
  },

  MultiLineComment: {
    properties: ["tag", "location", "text"],
  },

  AstLocal: {
    properties: ["name", "colon?", "annotation?", "shadows?"],
  },

  AstFunctionBody: {
    properties: [
      "openGenerics?",
      "generics?",
      "genericPacks?",
      "closeGenerics?",
      "self?",
      "openParens",
      "parameters",
      "vararg?",
      "varargColon?",
      "varargAnnotation?",
      "closeParens",
      "returnSpecifier?",
      "returnAnnotation?",
      "body",
      "endKeyword",
    ],
  },

  AstAttribute: {
    properties: ["leadingTrivia", "position", "text", "trailingTrivia", "tag"],
  },

  AstGenericType: {
    properties: ["tag", "name", "equals?", "default?"],
  },

  AstGenericTypePack: {
    properties: ["tag", "name", "ellipsis", "equals?", "default?"],
  },

  // === ADDITIONAL HELPER TYPES ===
  AstExprIfElseIfs: {
    properties: ["elseifKeyword", "condition", "thenKeyword", "consequent"],
  },

  AstStatElseIf: {
    properties: ["elseifKeyword", "condition", "thenKeyword", "consequent"],
  },

  AstTypeFunctionParameter: {
    properties: ["name?", "colon?", "type"],
  },

  Eof: {
    properties: ["leadingTrivia", "position", "text", "trailingTrivia", "tag"],
  },

  Pair: {
    properties: ["node", "separator?"],
  },

  Punctuated: {
    properties: ["pairs"],
  },
};

export function getTypeDefinition(
  typeName: string
): ASTTypeDefinition | undefined {
  return astTypeDefinitions[typeName];
}

export function getAllTypes(): string[] {
  return Object.keys(astTypeDefinitions);
}
