export interface PropertyDefinition {
  name: string;
  type: string | string[]; // string[] for unions like "true" | "false"
  optional?: boolean;
  generic?: string; // for Token<"specific"> types
}

export interface ASTTypeDefinition {
  properties?: PropertyDefinition[];
  kinds?: Record<string, ASTTypeDefinition>;
  baseType?: string; // for intersections like "Token &"
  unionMembers?: string[]; // for "CstExpr = A | B | C"
}

export interface GenericTypeDefinition {
  baseType: string;
  genericType: string;
}

export interface TypeMetadata {
  type: string;
  typeDefinition: ASTTypeDefinition | undefined;
  arrayType: boolean;
  kind: string;
  prevType: string;
  prevTypeDefinition: ASTTypeDefinition | undefined;
  prevArrayType: boolean;
  prevKind: string;
}

export const astTypeDefinitions: Record<string, ASTTypeDefinition> = {
  // === UTILITY TYPES ===
  span: {
    properties: [
      { name: "beginLine", type: "number" },
      { name: "beginColumn", type: "number" },
      { name: "endLine", type: "number" },
      { name: "endColumn", type: "number" },
    ],
  },

  Whitespace: {
    properties: [
      { name: "tag", type: '"whitespace"' },
      { name: "location", type: "span" },
      { name: "text", type: "string" },
    ],
  },

  SingleLineComment: {
    properties: [
      { name: "tag", type: '"comment"' },
      { name: "location", type: "span" },
      { name: "text", type: "string" },
    ],
  },

  MultiLineComment: {
    properties: [
      { name: "tag", type: '"blockcomment"' },
      { name: "location", type: "span" },
      { name: "text", type: "string" },
    ],
  },

  Trivia: {
    unionMembers: ["Whitespace", "SingleLineComment", "MultiLineComment"],
  },

  Token: {
    properties: [
      { name: "leadingTrivia", type: "{ Trivia }" },
      { name: "location", type: "span" },
      { name: "text", type: "string" },
      { name: "trailingTrivia", type: "{ Trivia }" },
      { name: "kind", type: '"token"' },
    ],
  },

  Eof: {
    baseType: "Token",
    properties: [
      { name: "tag", type: '"eof"' },
      { name: "text", type: '""' },
    ],
  },

  Pair: {
    properties: [
      { name: "node", type: "any" },
      { name: "separator", type: "Token", optional: true },
    ],
  },

  Punctuated: {
    properties: [{ name: "pairs", type: "{ Pair }" }],
  },

  CstLocal: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"local"' },
      { name: "name", type: "Token", generic: "Token<string>" },
      { name: "colon", type: "Token", generic: 'Token<":">', optional: true },
      { name: "annotation", type: "CstType", optional: true },
      { name: "shadows", type: "CstLocal", optional: true },
    ],
  },

  // === EXPRESSIONS ===
  CstExprGroup: {
    properties: [
      { name: "location", type: "span" },
      { name: "tag", type: '"group"' },
      { name: "openParens", type: "Token", generic: 'Token<"(">' },
      { name: "expression", type: "CstExpr" },
      { name: "closeParens", type: "Token", generic: 'Token<")">' },
    ],
  },

  CstExprConstantNil: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"nil"' },
      { name: "text", type: '"nil"' },
    ],
  },

  CstExprConstantBool: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"boolean"' },
      { name: "text", type: ["true", "false"] },
      { name: "value", type: "boolean" },
    ],
  },

  CstExprConstantNumber: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"number"' },
      { name: "text", type: "string" },
      { name: "value", type: "number" },
    ],
  },

  CstExprConstantString: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"string"' },
      { name: "text", type: "string" },
      { name: "quoteStyle", type: ["single", "double", "block", "interp"] },
      { name: "blockDepth", type: "number" },
    ],
  },

  CstExprLocal: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"local"' },
      { name: "token", type: "Token", generic: "Token<string>" },
      { name: "local", type: "CstLocal" },
      { name: "upvalue", type: "boolean" },
    ],
  },

  CstExprGlobal: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"global"' },
      { name: "name", type: "Token" },
    ],
  },

  CstExprVarargs: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"vararg"' },
      { name: "text", type: '"..."' },
    ],
  },

  CstExprCall: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"call"' },
      { name: "func", type: "CstExpr" },
      {
        name: "openParens",
        type: "Token",
        generic: 'Token<"(">',
        optional: true,
      },
      { name: "arguments", type: "Punctuated", generic: "Punctuated<CstExpr>" },
      {
        name: "closeParens",
        type: "Token",
        generic: 'Token<")">',
        optional: true,
      },
      { name: "self", type: "boolean" },
      { name: "argLocation", type: "span" },
    ],
  },

  CstExprInstantiate: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"instantiate"' },
      { name: "expr", type: "CstExpr" },
      { name: "leftArrow1", type: "Token", generic: 'Token<"<">' },
      { name: "leftArrow2", type: "Token", generic: 'Token<"<">' },
      {
        name: "typeArguments",
        type: "Punctuated",
        generic: "Punctuated<CstType | CstTypePack>",
      },
      { name: "rightArrow1", type: "Token", generic: 'Token<">">' },
      { name: "rightArrow2", type: "Token", generic: 'Token<">">' },
    ],
  },

  CstExprIndexName: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"indexname"' },
      { name: "expression", type: "CstExpr" },
      { name: "accessor", type: "Token", generic: 'Token<"." | ":">' },
      { name: "index", type: "Token", generic: "Token<string>" },
      { name: "indexLocation", type: "span" },
    ],
  },

  CstExprIndexExpr: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"index"' },
      { name: "expression", type: "CstExpr" },
      { name: "openBrackets", type: "Token", generic: 'Token<"[">' },
      { name: "index", type: "CstExpr" },
      { name: "closeBrackets", type: "Token", generic: 'Token<"]">' },
    ],
  },

  CstExprFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"function"' },
      { name: "attributes", type: "{ CstAttribute }" },
      { name: "functionKeyword", type: "Token", generic: 'Token<"function">' },
      {
        name: "openGenerics",
        type: "Token",
        generic: 'Token<"<">',
        optional: true,
      },
      {
        name: "generics",
        type: "Punctuated",
        generic: "Punctuated<CstGenericType>",
        optional: true,
      },
      {
        name: "genericPacks",
        type: "Punctuated",
        generic: "Punctuated<CstGenericTypePack>",
        optional: true,
      },
      {
        name: "closeGenerics",
        type: "Token",
        generic: 'Token<">">',
        optional: true,
      },
      { name: "openParens", type: "Token", generic: 'Token<"(">' },
      { name: "self", type: "CstLocal", optional: true },
      {
        name: "parameters",
        type: "Punctuated",
        generic: "Punctuated<CstLocal>",
      },
      {
        name: "vararg",
        type: "Token",
        generic: 'Token<"...">',
        optional: true,
      },
      {
        name: "varargColon",
        type: "Token",
        generic: 'Token<":">',
        optional: true,
      },
      { name: "varargAnnotation", type: "CstTypePack", optional: true },
      { name: "closeParens", type: "Token", generic: 'Token<")">' },
      {
        name: "returnSpecifier",
        type: "Token",
        generic: 'Token<":">',
        optional: true,
      },
      { name: "returnAnnotation", type: "CstTypePack", optional: true },
      { name: "body", type: "CstStatBlock" },
      { name: "endKeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  CstTableExprListItem: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"list"' },
      { name: "value", type: "CstExpr" },
      {
        name: "separator",
        type: "Token",
        generic: 'Token<"," | ";">',
        optional: true,
      },
      { name: "isTableItem", type: "true" },
    ],
  },

  CstTableExprRecordItem: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"record"' },
      { name: "key", type: "Token", generic: "Token<string>" },
      { name: "equals", type: "Token", generic: 'Token<"=">' },
      { name: "value", type: "CstExpr" },
      {
        name: "separator",
        type: "Token",
        generic: 'Token<"," | ";">',
        optional: true,
      },
      { name: "isTableItem", type: "true" },
    ],
  },

  CstTableExprGeneralItem: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"general"' },
      { name: "indexerOpen", type: "Token", generic: 'Token<"[">' },
      { name: "key", type: "CstExpr" },
      { name: "indexerClose", type: "Token", generic: 'Token<"]">' },
      { name: "equals", type: "Token", generic: 'Token<"=">' },
      { name: "value", type: "CstExpr" },
      {
        name: "separator",
        type: "Token",
        generic: 'Token<"," | ";">',
        optional: true,
      },
      { name: "isTableItem", type: "true" },
    ],
  },

  CstTableExprItem: {
    unionMembers: [
      "CstTableExprListItem",
      "CstTableExprRecordItem",
      "CstTableExprGeneralItem",
    ],
  },

  CstExprTable: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"table"' },
      { name: "openBrace", type: "Token", generic: 'Token<"{">' },
      { name: "entries", type: "{ CstTableExprItem }" },
      { name: "closeBrace", type: "Token", generic: 'Token<"}">' },
    ],
  },

  CstExprUnary: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"unary"' },
      { name: "operator", type: "Token", generic: 'Token<"not" | "-" | "#">' },
      { name: "operand", type: "CstExpr" },
    ],
  },

  CstExprBinary: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"binary"' },
      { name: "lhsOperand", type: "CstExpr" },
      { name: "operator", type: "Token" },
      { name: "rhsOperand", type: "CstExpr" },
    ],
  },

  CstExprInterpString: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"interpolatedstring"' },
      { name: "strings", type: "{ Token }", generic: "{ Token<string> }" },
      { name: "expressions", type: "{ CstExpr }" },
    ],
  },

  CstExprTypeAssertion: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"cast"' },
      { name: "operand", type: "CstExpr" },
      { name: "operator", type: "Token", generic: 'Token<"::">' },
      { name: "annotation", type: "CstType" },
    ],
  },

  CstElseIfExpr: {
    properties: [
      { name: "elseIfKeyword", type: "Token", generic: 'Token<"elseif">' },
      { name: "condition", type: "CstExpr" },
      { name: "thenKeyword", type: "Token", generic: 'Token<"then">' },
      { name: "thenExpr", type: "CstExpr" },
    ],
  },

  CstExprIfElse: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"conditional"' },
      { name: "ifKeyword", type: "Token", generic: 'Token<"if">' },
      { name: "condition", type: "CstExpr" },
      { name: "thenKeyword", type: "Token", generic: 'Token<"then">' },
      { name: "thenExpr", type: "CstExpr" },
      { name: "elseifs", type: "{ CstElseIfExpr }" },
      { name: "elseKeyword", type: "Token", generic: 'Token<"else">' },
      { name: "elseExpr", type: "CstExpr" },
    ],
  },

  CstExpr: {
    unionMembers: [
      "CstExprGroup",
      "CstExprConstantNil",
      "CstExprConstantBool",
      "CstExprConstantNumber",
      "CstExprConstantString",
      "CstExprLocal",
      "CstExprGlobal",
      "CstExprVarargs",
      "CstExprCall",
      "CstExprInstantiate",
      "CstExprIndexName",
      "CstExprIndexExpr",
      "CstExprFunction",
      "CstExprTable",
      "CstExprUnary",
      "CstExprBinary",
      "CstExprInterpString",
      "CstExprTypeAssertion",
      "CstExprIfElse",
    ],
  },

  // === STATEMENTS ===
  CstStatBlock: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"block"' },
      { name: "statements", type: "{ CstStat }" },
    ],
  },

  CstStatDo: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"do"' },
      { name: "doKeyword", type: "Token", generic: 'Token<"do">' },
      { name: "body", type: "CstStatBlock" },
      { name: "endKeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  CstElseIfStat: {
    properties: [
      { name: "elseIfKeyword", type: "Token", generic: 'Token<"elseif">' },
      { name: "condition", type: "CstExpr" },
      { name: "thenKeyword", type: "Token", generic: 'Token<"then">' },
      { name: "thenBlock", type: "CstStatBlock" },
    ],
  },

  CstStatIf: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"conditional"' },
      { name: "ifKeyword", type: "Token", generic: 'Token<"if">' },
      { name: "condition", type: "CstExpr" },
      { name: "thenKeyword", type: "Token", generic: 'Token<"then">' },
      { name: "thenBlock", type: "CstStatBlock" },
      { name: "elseifs", type: "{ CstElseIfStat }" },
      {
        name: "elseKeyword",
        type: "Token",
        generic: 'Token<"else">',
        optional: true,
      },
      { name: "elseBlock", type: "CstStatBlock", optional: true },
      { name: "endKeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  CstStatWhile: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"while"' },
      { name: "whileKeyword", type: "Token", generic: 'Token<"while">' },
      { name: "condition", type: "CstExpr" },
      { name: "doKeyword", type: "Token", generic: 'Token<"do">' },
      { name: "body", type: "CstStatBlock" },
      { name: "endKeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  CstStatRepeat: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"repeat"' },
      { name: "repeatKeyword", type: "Token", generic: 'Token<"repeat">' },
      { name: "body", type: "CstStatBlock" },
      { name: "untilKeyword", type: "Token", generic: 'Token<"until">' },
      { name: "condition", type: "CstExpr" },
    ],
  },

  CstStatBreak: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"break"' },
      { name: "text", type: '"break"' },
    ],
  },

  CstStatContinue: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"continue"' },
      { name: "text", type: '"continue"' },
    ],
  },

  CstStatReturn: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"return"' },
      { name: "returnKeyword", type: "Token", generic: 'Token<"return">' },
      {
        name: "expressions",
        type: "Punctuated",
        generic: "Punctuated<CstExpr>",
      },
    ],
  },

  CstStatExpr: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"expression"' },
      { name: "expression", type: "CstExpr" },
    ],
  },

  CstStatLocal: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"local"' },
      { name: "localKeyword", type: "Token", generic: 'Token<"local">' },
      {
        name: "variables",
        type: "Punctuated",
        generic: "Punctuated<CstLocal>",
      },
      { name: "equals", type: "Token", generic: 'Token<"=">', optional: true },
      { name: "values", type: "Punctuated", generic: "Punctuated<CstExpr>" },
    ],
  },

  CstStatConst: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"const"' },
      { name: "constKeyword", type: "Token", generic: 'Token<"const">' },
      {
        name: "variables",
        type: "Punctuated",
        generic: "Punctuated<CstLocal>",
      },
      { name: "equals", type: "Token", generic: 'Token<"=">', optional: true },
      { name: "values", type: "Punctuated", generic: "Punctuated<CstExpr>" },
    ],
  },

  CstStatFor: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"for"' },
      { name: "forKeyword", type: "Token", generic: 'Token<"for">' },
      { name: "variable", type: "CstLocal" },
      { name: "equals", type: "Token", generic: 'Token<"=">' },
      { name: "from", type: "CstExpr" },
      { name: "toComma", type: "Token", generic: 'Token<",">' },
      { name: "to", type: "CstExpr" },
      {
        name: "stepComma",
        type: "Token",
        generic: 'Token<",">',
        optional: true,
      },
      { name: "step", type: "CstExpr", optional: true },
      { name: "doKeyword", type: "Token", generic: 'Token<"do">' },
      { name: "body", type: "CstStatBlock" },
      { name: "endKeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  CstStatForIn: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"forin"' },
      { name: "forKeyword", type: "Token", generic: 'Token<"for">' },
      {
        name: "variables",
        type: "Punctuated",
        generic: "Punctuated<CstLocal>",
      },
      { name: "inKeyword", type: "Token", generic: 'Token<"in">' },
      { name: "values", type: "Punctuated", generic: "Punctuated<CstExpr>" },
      { name: "doKeyword", type: "Token", generic: 'Token<"do">' },
      { name: "body", type: "CstStatBlock" },
      { name: "endKeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  CstStatAssign: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"assign"' },
      { name: "variables", type: "Punctuated", generic: "Punctuated<CstExpr>" },
      { name: "equals", type: "Token", generic: 'Token<"=">' },
      { name: "values", type: "Punctuated", generic: "Punctuated<CstExpr>" },
    ],
  },

  CstStatCompoundAssign: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"compoundassign"' },
      { name: "variable", type: "CstExpr" },
      { name: "operand", type: "Token" },
      { name: "value", type: "CstExpr" },
    ],
  },

  CstAttribute: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"attribute"' },
      { name: "text", type: ["@checked", "@native", "@deprecated"] },
    ],
  },

  CstStatFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"function"' },
      { name: "name", type: "CstExpr" },
      { name: "func", type: "CstExprFunction" },
    ],
  },

  CstStatLocalFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"localfunction"' },
      { name: "localKeyword", type: "Token", generic: 'Token<"local">' },
      { name: "name", type: "CstLocal" },
      { name: "func", type: "CstExprFunction" },
    ],
  },

  CstStatTypeAlias: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"typealias"' },
      {
        name: "export",
        type: "Token",
        generic: 'Token<"export">',
        optional: true,
      },
      { name: "typeToken", type: "Token", generic: 'Token<"type">' },
      { name: "name", type: "Token" },
      {
        name: "openGenerics",
        type: "Token",
        generic: 'Token<"<">',
        optional: true,
      },
      {
        name: "generics",
        type: "Punctuated",
        generic: "Punctuated<CstGenericType>",
        optional: true,
      },
      {
        name: "genericPacks",
        type: "Punctuated",
        generic: "Punctuated<CstGenericTypePack>",
        optional: true,
      },
      {
        name: "closeGenerics",
        type: "Token",
        generic: 'Token<">">',
        optional: true,
      },
      { name: "equals", type: "Token", generic: 'Token<"=">' },
      { name: "type", type: "CstType" },
    ],
  },

  CstStatTypeFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"typefunction"' },
      {
        name: "export",
        type: "Token",
        generic: 'Token<"export">',
        optional: true,
      },
      { name: "type", type: "Token", generic: 'Token<"type">' },
      { name: "name", type: "Token" },
      { name: "body", type: "CstExprFunction" },
    ],
  },

  CstStat: {
    unionMembers: [
      "CstStatBlock",
      "CstStatDo",
      "CstStatIf",
      "CstStatWhile",
      "CstStatRepeat",
      "CstStatBreak",
      "CstStatContinue",
      "CstStatReturn",
      "CstStatExpr",
      "CstStatLocal",
      "CstStatConst",
      "CstStatFor",
      "CstStatForIn",
      "CstStatAssign",
      "CstStatCompoundAssign",
      "CstStatFunction",
      "CstStatLocalFunction",
      "CstStatTypeAlias",
      "CstStatTypeFunction",
    ],
  },

  // === GENERIC TYPES ===
  CstGenericType: {
    properties: [
      { name: "tag", type: '"generic"' },
      { name: "name", type: "Token", generic: "Token<string>" },
      { name: "equals", type: "Token", generic: 'Token<"=">', optional: true },
      { name: "default", type: "CstType", optional: true },
    ],
  },

  CstGenericTypePack: {
    properties: [
      { name: "tag", type: '"genericpack"' },
      { name: "name", type: "Token", generic: "Token<string>" },
      { name: "ellipsis", type: "Token", generic: 'Token<"...">' },
      { name: "equals", type: "Token", generic: 'Token<"=">', optional: true },
      { name: "default", type: "CstTypePack", optional: true },
    ],
  },

  // === TYPE SYSTEM ===
  CstTypeReference: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"reference"' },
      {
        name: "prefix",
        type: "Token",
        generic: "Token<string>",
        optional: true,
      },
      {
        name: "prefixPoint",
        type: "Token",
        generic: 'Token<".">',
        optional: true,
      },
      { name: "name", type: "Token", generic: "Token<string>" },
      {
        name: "openParameters",
        type: "Token",
        generic: 'Token<"<">',
        optional: true,
      },
      {
        name: "parameters",
        type: "Punctuated",
        generic: "Punctuated<CstType | CstTypePack>",
        optional: true,
      },
      {
        name: "closeParameters",
        type: "Token",
        generic: 'Token<">">',
        optional: true,
      },
    ],
  },

  CstTypeSingletonBool: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"boolean"' },
      { name: "text", type: ["true", "false"] },
      { name: "value", type: "boolean" },
    ],
  },

  CstTypeSingletonString: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"string"' },
      { name: "text", type: "string" },
      { name: "quoteStyle", type: ["single", "double"] },
    ],
  },

  CstTypeTypeof: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"typeof"' },
      { name: "typeof", type: "Token", generic: 'Token<"typeof">' },
      { name: "openParens", type: "Token", generic: 'Token<"(">' },
      { name: "expression", type: "CstExpr" },
      { name: "closeParens", type: "Token", generic: 'Token<")">' },
    ],
  },

  CstTypeGroup: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"group"' },
      { name: "openParens", type: "Token", generic: 'Token<"(">' },
      { name: "type", type: "CstType" },
      { name: "closeParens", type: "Token", generic: 'Token<")">' },
    ],
  },

  CstTypeOptional: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"optional"' },
      { name: "text", type: '"?"' },
    ],
  },

  CstTypeUnion: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"union"' },
      { name: "leading", type: "Token", generic: 'Token<"|">', optional: true },
      {
        name: "types",
        type: "Punctuated",
        generic: 'Punctuated<CstType, "|">',
      },
    ],
  },

  CstTypeIntersection: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"intersection"' },
      { name: "leading", type: "Token", generic: 'Token<"&">', optional: true },
      {
        name: "types",
        type: "Punctuated",
        generic: 'Punctuated<CstType, "&">',
      },
    ],
  },

  CstTypeArray: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"array"' },
      { name: "openBrace", type: "Token", generic: 'Token<"{">' },
      {
        name: "access",
        type: "Token",
        generic: 'Token<"read" | "write">',
        optional: true,
      },
      { name: "type", type: "CstType" },
      { name: "closeBrace", type: "Token", generic: 'Token<"}">' },
    ],
  },

  CstTableTypeItemIndexer: {
    properties: [
      { name: "kind", type: '"indexer"' },
      {
        name: "access",
        type: "Token",
        generic: 'Token<"read" | "write">',
        optional: true,
      },
      { name: "indexerOpen", type: "Token", generic: 'Token<"[">' },
      { name: "key", type: "CstType" },
      { name: "indexerClose", type: "Token", generic: 'Token<"]">' },
      { name: "colon", type: "Token", generic: 'Token<":">' },
      { name: "value", type: "CstType" },
      {
        name: "separator",
        type: "Token",
        generic: 'Token<"," | ";">',
        optional: true,
      },
    ],
  },

  CstTableTypeItemStringProperty: {
    properties: [
      { name: "kind", type: '"stringproperty"' },
      {
        name: "access",
        type: "Token",
        generic: 'Token<"read" | "write">',
        optional: true,
      },
      { name: "indexerOpen", type: "Token", generic: 'Token<"[">' },
      { name: "key", type: "CstTypeSingletonString" },
      { name: "indexerClose", type: "Token", generic: 'Token<"]">' },
      { name: "colon", type: "Token", generic: 'Token<":">' },
      { name: "value", type: "CstType" },
      {
        name: "separator",
        type: "Token",
        generic: 'Token<"," | ";">',
        optional: true,
      },
    ],
  },

  CstTableTypeItemProperty: {
    properties: [
      { name: "kind", type: '"property"' },
      {
        name: "access",
        type: "Token",
        generic: 'Token<"read" | "write">',
        optional: true,
      },
      { name: "key", type: "Token" },
      { name: "colon", type: "Token", generic: 'Token<":">' },
      { name: "value", type: "CstType" },
      {
        name: "separator",
        type: "Token",
        generic: 'Token<"," | ";">',
        optional: true,
      },
    ],
  },

  CstTableTypeItem: {
    unionMembers: [
      "CstTableTypeItemIndexer",
      "CstTableTypeItemStringProperty",
      "CstTableTypeItemProperty",
    ],
  },

  CstTypeTable: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"table"' },
      { name: "openBrace", type: "Token", generic: 'Token<"{">' },
      { name: "entries", type: "{ CstTableTypeItem }" },
      { name: "closeBrace", type: "Token", generic: 'Token<"}">' },
    ],
  },

  CstFunctionTypeParameter: {
    properties: [
      { name: "location", type: "span" },
      { name: "name", type: "Token", optional: true },
      { name: "colon", type: "Token", generic: 'Token<":">', optional: true },
      { name: "type", type: "CstType" },
    ],
  },

  CstTypeFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"function"' },
      {
        name: "openGenerics",
        type: "Token",
        generic: 'Token<"<">',
        optional: true,
      },
      {
        name: "generics",
        type: "Punctuated",
        generic: "Punctuated<CstGenericType>",
        optional: true,
      },
      {
        name: "genericPacks",
        type: "Punctuated",
        generic: "Punctuated<CstGenericTypePack>",
        optional: true,
      },
      {
        name: "closeGenerics",
        type: "Token",
        generic: 'Token<">">',
        optional: true,
      },
      { name: "openParens", type: "Token", generic: 'Token<"(">' },
      {
        name: "parameters",
        type: "Punctuated",
        generic: "Punctuated<CstFunctionTypeParameter>",
      },
      { name: "vararg", type: "CstTypePack", optional: true },
      { name: "closeParens", type: "Token", generic: 'Token<")">' },
      { name: "returnSpecifier", type: "Token", generic: 'Token<"->">' },
      { name: "returnTypes", type: "CstTypePack" },
    ],
  },

  CstType: {
    unionMembers: [
      "CstTypeReference",
      "CstTypeSingletonBool",
      "CstTypeSingletonString",
      "CstTypeTypeof",
      "CstTypeGroup",
      "CstTypeUnion",
      "CstTypeIntersection",
      "CstTypeOptional",
      "CstTypeArray",
      "CstTypeTable",
      "CstTypeFunction",
    ],
  },

  // === TYPE PACKS ===
  CstTypePackExplicit: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"typepack"' },
      { name: "tag", type: '"explicit"' },
      {
        name: "openParens",
        type: "Token",
        generic: 'Token<"(">',
        optional: true,
      },
      { name: "types", type: "Punctuated", generic: "Punctuated<CstType>" },
      { name: "tailType", type: "CstTypePack", optional: true },
      {
        name: "closeParens",
        type: "Token",
        generic: 'Token<")">',
        optional: true,
      },
    ],
  },

  CstTypePackGeneric: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"typepack"' },
      { name: "tag", type: '"generic"' },
      { name: "name", type: "Token" },
      { name: "ellipsis", type: "Token", generic: 'Token<"...">' },
    ],
  },

  CstTypePackVariadic: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"typepack"' },
      { name: "tag", type: '"variadic"' },
      {
        name: "ellipsis",
        type: "Token",
        generic: 'Token<"...">',
        optional: true,
      },
      { name: "type", type: "CstType" },
    ],
  },

  CstTypePack: {
    unionMembers: [
      "CstTypePackExplicit",
      "CstTypePackGeneric",
      "CstTypePackVariadic",
    ],
  },

  _testType: {
    properties: [
      { name: "removedName", type: "Token", optional: true },
      { name: "name", type: "Token", optional: true },
    ],
  },
};
