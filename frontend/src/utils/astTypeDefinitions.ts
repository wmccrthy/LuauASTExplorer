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
  unionMembers?: string[]; // for "AstExpr = A | B | C"
}

export interface GenericTypeDefinition {
  baseType: string;
  genericType: string;
}

export const astTypeDefinitions: Record<string, ASTTypeDefinition> = {
  // === UTILITY TYPES ===
  Position: {
    properties: [
      { name: "line", type: "number" },
      { name: "column", type: "number" },
    ],
  },

  Location: {
    properties: [
      { name: "begin", type: "Position" },
      { name: "end", type: "Position" },
    ],
  },

  Whitespace: {
    properties: [
      { name: "tag", type: '"whitespace"' },
      { name: "location", type: "Location" },
      { name: "text", type: "string" },
    ],
  },

  SingleLineComment: {
    properties: [
      { name: "tag", type: '"comment"' },
      { name: "location", type: "Location" },
      { name: "text", type: "string" },
    ],
  },

  MultiLineComment: {
    properties: [
      { name: "tag", type: '"blockcomment"' },
      { name: "location", type: "Location" },
      { name: "text", type: "string" },
    ],
  },

  Trivia: {
    unionMembers: ["Whitespace", "SingleLineComment", "MultiLineComment"],
  },

  Token: {
    properties: [
      { name: "leadingTrivia", type: "{ Trivia }" },
      { name: "position", type: "Position" },
      { name: "text", type: "string" },
      { name: "trailingTrivia", type: "{ Trivia }" },
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

  AstLocal: {
    properties: [
      { name: "name", type: "Token", generic: "Token<string>" },
      { name: "colon", type: "Token", generic: 'Token<":">', optional: true },
      { name: "annotation", type: "AstType", optional: true },
      { name: "shadows", type: "AstLocal", optional: true },
    ],
  },

  // === EXPRESSIONS ===
  AstExprGroup: {
    properties: [
      { name: "tag", type: '"group"' },
      { name: "openParens", type: "Token", generic: 'Token<"(">' },
      { name: "expression", type: "AstExpr" },
      { name: "closeParens", type: "Token", generic: 'Token<")">' },
    ],
  },

  AstExprConstantNil: {
    baseType: "Token",
    properties: [
      { name: "tag", type: '"nil"' },
      { name: "text", type: '"nil"' },
    ],
  },

  AstExprConstantBool: {
    baseType: "Token",
    properties: [
      { name: "tag", type: '"boolean"' },
      { name: "text", type: ["true", "false"] },
      { name: "value", type: "boolean" },
    ],
  },

  AstExprConstantNumber: {
    baseType: "Token",
    properties: [
      { name: "tag", type: '"number"' },
      { name: "text", type: "string" },
      { name: "value", type: "number" },
    ],
  },

  AstExprConstantString: {
    baseType: "Token",
    properties: [
      { name: "tag", type: '"string"' },
      { name: "text", type: "string" },
      { name: "quoteStyle", type: ["single", "double", "block", "interp"] },
      { name: "blockDepth", type: "number" },
    ],
  },

  AstExprLocal: {
    properties: [
      { name: "tag", type: '"local"' },
      { name: "token", type: "Token", generic: "Token<string>" },
      { name: "local", type: "AstLocal" },
      { name: "upvalue", type: "boolean" },
    ],
  },

  AstExprGlobal: {
    properties: [
      { name: "tag", type: '"global"' },
      { name: "name", type: "Token" },
    ],
  },

  AstExprVarargs: {
    baseType: "Token",
    properties: [
      { name: "tag", type: '"vararg"' },
      { name: "text", type: '"..."' },
    ],
  },

  AstExprCall: {
    properties: [
      { name: "tag", type: '"call"' },
      { name: "func", type: "AstExpr" },
      {
        name: "openParens",
        type: "Token",
        generic: 'Token<"(">',
        optional: true,
      },
      { name: "arguments", type: "Punctuated", generic: "Punctuated<AstExpr>" },
      {
        name: "closeParens",
        type: "Token",
        generic: 'Token<")">',
        optional: true,
      },
      { name: "self", type: "boolean" },
      { name: "argLocation", type: "Location" },
    ],
  },

  AstExprIndexName: {
    properties: [
      { name: "tag", type: '"indexname"' },
      { name: "expression", type: "AstExpr" },
      { name: "accessor", type: "Token", generic: 'Token<"." | ":">' },
      { name: "index", type: "Token", generic: "Token<string>" },
      { name: "indexLocation", type: "Location" },
    ],
  },

  AstExprIndexExpr: {
    properties: [
      { name: "tag", type: '"index"' },
      { name: "expression", type: "AstExpr" },
      { name: "openBrackets", type: "Token", generic: 'Token<"[">' },
      { name: "index", type: "AstExpr" },
      { name: "closeBrackets", type: "Token", generic: 'Token<"]">' },
    ],
  },

  AstFunctionBody: {
    properties: [
      {
        name: "openGenerics",
        type: "Token",
        generic: 'Token<"<">',
        optional: true,
      },
      {
        name: "generics",
        type: "Punctuated",
        generic: "Punctuated<AstGenericType>",
        optional: true,
      },
      {
        name: "genericPacks",
        type: "Punctuated",
        generic: "Punctuated<AstGenericTypePack>",
        optional: true,
      },
      {
        name: "closeGenerics",
        type: "Token",
        generic: 'Token<">">',
        optional: true,
      },
      { name: "self", type: "AstLocal", optional: true },
      { name: "openParens", type: "Token", generic: 'Token<"(">' },
      {
        name: "parameters",
        type: "Punctuated",
        generic: "Punctuated<AstLocal>",
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
      { name: "varargAnnotation", type: "AstTypePack", optional: true },
      { name: "closeParens", type: "Token", generic: 'Token<")">' },
      {
        name: "returnSpecifier",
        type: "Token",
        generic: 'Token<":">',
        optional: true,
      },
      { name: "returnAnnotation", type: "AstTypePack", optional: true },
      { name: "body", type: "AstStatBlock" },
      { name: "endKeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  AstExprAnonymousFunction: {
    properties: [
      { name: "tag", type: '"function"' },
      { name: "attributes", type: "{ AstAttribute }" },
      { name: "functionKeyword", type: "Token", generic: 'Token<"function">' },
      { name: "body", type: "AstFunctionBody" },
    ],
  },

  AstExprTableItem: {
    kinds: {
      list: {
        properties: [
          { name: "kind", type: '"list"' },
          { name: "value", type: "AstExpr" },
          {
            name: "separator",
            type: "Token",
            generic: 'Token<"," | ";">',
            optional: true,
          },
        ],
      },
      record: {
        properties: [
          { name: "kind", type: '"record"' },
          { name: "key", type: "Token", generic: "Token<string>" },
          { name: "equals", type: "Token", generic: 'Token<"=">' },
          { name: "value", type: "AstExpr" },
          {
            name: "separator",
            type: "Token",
            generic: 'Token<"," | ";">',
            optional: true,
          },
        ],
      },
      general: {
        properties: [
          { name: "kind", type: '"general"' },
          { name: "indexerOpen", type: "Token", generic: 'Token<"[">' },
          { name: "key", type: "AstExpr" },
          { name: "indexerClose", type: "Token", generic: 'Token<"]">' },
          { name: "equals", type: "Token", generic: 'Token<"=">' },
          { name: "value", type: "AstExpr" },
          {
            name: "separator",
            type: "Token",
            generic: 'Token<"," | ";">',
            optional: true,
          },
        ],
      },
    },
  },

  AstExprTable: {
    properties: [
      { name: "tag", type: '"table"' },
      { name: "openBrace", type: "Token", generic: 'Token<"{">' },
      { name: "entries", type: "{ AstExprTableItem }" },
      { name: "closeBrace", type: "Token", generic: 'Token<"}">' },
    ],
  },

  AstExprUnary: {
    properties: [
      { name: "tag", type: '"unary"' },
      { name: "operator", type: "Token", generic: 'Token<"not" | "-" | "#">' },
      { name: "operand", type: "AstExpr" },
    ],
  },

  AstExprBinary: {
    properties: [
      { name: "tag", type: '"binary"' },
      { name: "lhsoperand", type: "AstExpr" },
      { name: "operator", type: "Token" },
      { name: "rhsoperand", type: "AstExpr" },
    ],
  },

  AstExprInterpString: {
    properties: [
      { name: "tag", type: '"interpolatedstring"' },
      { name: "strings", type: "{ Token }", generic: "{ Token<string> }" },
      { name: "expressions", type: "{ AstExpr }" },
    ],
  },

  AstExprTypeAssertion: {
    properties: [
      { name: "tag", type: '"cast"' },
      { name: "operand", type: "AstExpr" },
      { name: "operator", type: "Token", generic: 'Token<"::">' },
      { name: "annotation", type: "AstType" },
    ],
  },

  AstExprIfElseIfs: {
    properties: [
      { name: "elseifKeyword", type: "Token", generic: 'Token<"elseif">' },
      { name: "condition", type: "AstExpr" },
      { name: "thenKeyword", type: "Token", generic: 'Token<"then">' },
      { name: "consequent", type: "AstExpr" },
    ],
  },

  AstExprIfElse: {
    properties: [
      { name: "tag", type: '"conditional"' },
      { name: "ifKeyword", type: "Token", generic: 'Token<"if">' },
      { name: "condition", type: "AstExpr" },
      { name: "thenKeyword", type: "Token", generic: 'Token<"then">' },
      { name: "consequent", type: "AstExpr" },
      { name: "elseifs", type: "{ AstExprIfElseIfs }" },
      { name: "elseKeyword", type: "Token", generic: 'Token<"else">' },
      { name: "antecedent", type: "AstExpr" },
    ],
  },

  AstExpr: {
    unionMembers: [
      "AstExprGroup",
      "AstExprConstantNil",
      "AstExprConstantBool",
      "AstExprConstantNumber",
      "AstExprConstantString",
      "AstExprLocal",
      "AstExprGlobal",
      "AstExprVarargs",
      "AstExprCall",
      "AstExprIndexName",
      "AstExprIndexExpr",
      "AstExprAnonymousFunction",
      "AstExprTable",
      "AstExprUnary",
      "AstExprBinary",
      "AstExprInterpString",
      "AstExprTypeAssertion",
      "AstExprIfElse",
    ],
  },

  // === STATEMENTS ===
  AstStatBlock: {
    properties: [
      { name: "tag", type: '"block"' },
      { name: "statements", type: "{ AstStat }" },
    ],
  },

  AstStatElseIf: {
    properties: [
      { name: "elseifKeyword", type: "Token", generic: 'Token<"elseif">' },
      { name: "condition", type: "AstExpr" },
      { name: "thenKeyword", type: "Token", generic: 'Token<"then">' },
      { name: "consequent", type: "AstStatBlock" },
    ],
  },

  AstStatIf: {
    properties: [
      { name: "tag", type: '"conditional"' },
      { name: "ifKeyword", type: "Token", generic: 'Token<"if">' },
      { name: "condition", type: "AstExpr" },
      { name: "thenKeyword", type: "Token", generic: 'Token<"then">' },
      { name: "consequent", type: "AstStatBlock" },
      { name: "elseifs", type: "{ AstStatElseIf }" },
      {
        name: "elseKeyword",
        type: "Token",
        generic: 'Token<"else">',
        optional: true,
      },
      { name: "antecedent", type: "AstStatBlock", optional: true },
      { name: "endKeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  AstStatWhile: {
    properties: [
      { name: "tag", type: '"while"' },
      { name: "whileKeyword", type: "Token", generic: 'Token<"while">' },
      { name: "condition", type: "AstExpr" },
      { name: "doKeyword", type: "Token", generic: 'Token<"do">' },
      { name: "body", type: "AstStatBlock" },
      { name: "endKeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  AstStatRepeat: {
    properties: [
      { name: "tag", type: '"repeat"' },
      { name: "repeatKeyword", type: "Token", generic: 'Token<"repeat">' },
      { name: "body", type: "AstStatBlock" },
      { name: "untilKeyword", type: "Token", generic: 'Token<"until">' },
      { name: "condition", type: "AstExpr" },
    ],
  },

  AstStatBreak: {
    baseType: "Token",
    properties: [
      { name: "tag", type: '"break"' },
      { name: "text", type: '"break"' },
    ],
  },

  AstStatContinue: {
    baseType: "Token",
    properties: [
      { name: "tag", type: '"continue"' },
      { name: "text", type: '"continue"' },
    ],
  },

  AstStatReturn: {
    properties: [
      { name: "tag", type: '"return"' },
      { name: "returnKeyword", type: "Token", generic: 'Token<"return">' },
      {
        name: "expressions",
        type: "Punctuated",
        generic: "Punctuated<AstExpr>",
      },
    ],
  },

  AstStatExpr: {
    properties: [
      { name: "tag", type: '"expression"' },
      { name: "expression", type: "AstExpr" },
    ],
  },

  AstStatLocal: {
    properties: [
      { name: "tag", type: '"local"' },
      { name: "localKeyword", type: "Token", generic: 'Token<"local">' },
      {
        name: "variables",
        type: "Punctuated",
        generic: "Punctuated<AstLocal>",
      },
      { name: "equals", type: "Token", generic: 'Token<"=">', optional: true },
      { name: "values", type: "Punctuated", generic: "Punctuated<AstExpr>" },
    ],
  },

  AstStatFor: {
    properties: [
      { name: "tag", type: '"for"' },
      { name: "forKeyword", type: "Token", generic: 'Token<"for">' },
      { name: "variable", type: "AstLocal" },
      { name: "equals", type: "Token", generic: 'Token<"=">' },
      { name: "from", type: "AstExpr" },
      { name: "toComma", type: "Token", generic: 'Token<",">' },
      { name: "to", type: "AstExpr" },
      {
        name: "stepComma",
        type: "Token",
        generic: 'Token<",">',
        optional: true,
      },
      { name: "step", type: "AstExpr", optional: true },
      { name: "doKeyword", type: "Token", generic: 'Token<"do">' },
      { name: "body", type: "AstStatBlock" },
      { name: "endKeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  AstStatForIn: {
    properties: [
      { name: "tag", type: '"forin"' },
      { name: "forKeyword", type: "Token", generic: 'Token<"for">' },
      {
        name: "variables",
        type: "Punctuated",
        generic: "Punctuated<Token<string>>",
      },
      { name: "inKeyword", type: "Token", generic: 'Token<"in">' },
      { name: "values", type: "Punctuated", generic: "Punctuated<AstExpr>" },
      { name: "doKeyword", type: "Token", generic: 'Token<"do">' },
      { name: "body", type: "AstStatBlock" },
      { name: "endKeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  AstStatAssign: {
    properties: [
      { name: "tag", type: '"assign"' },
      { name: "variables", type: "Punctuated", generic: "Punctuated<AstExpr>" },
      { name: "equals", type: "Token", generic: 'Token<"=">' },
      { name: "values", type: "Punctuated", generic: "Punctuated<AstExpr>" },
    ],
  },

  AstStatCompoundAssign: {
    properties: [
      { name: "tag", type: '"compoundassign"' },
      { name: "variable", type: "AstExpr" },
      { name: "operand", type: "Token" },
      { name: "value", type: "AstExpr" },
    ],
  },

  AstAttribute: {
    baseType: "Token",
    properties: [
      { name: "tag", type: '"attribute"' },
      { name: "text", type: ["@checked", "@native", "@deprecated"] },
    ],
  },

  AstStatFunction: {
    properties: [
      { name: "tag", type: '"function"' },
      { name: "attributes", type: "{ AstAttribute }" },
      { name: "functionKeyword", type: "Token", generic: 'Token<"function">' },
      { name: "name", type: "AstExpr" },
      { name: "body", type: "AstFunctionBody" },
    ],
  },

  AstStatLocalFunction: {
    properties: [
      { name: "tag", type: '"localfunction"' },
      { name: "attributes", type: "{ AstAttribute }" },
      { name: "localKeyword", type: "Token", generic: 'Token<"local">' },
      { name: "functionKeyword", type: "Token", generic: 'Token<"function">' },
      { name: "name", type: "AstLocal" },
      { name: "body", type: "AstFunctionBody" },
    ],
  },

  AstStatTypeAlias: {
    properties: [
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
        generic: "Punctuated<AstGenericType>",
        optional: true,
      },
      {
        name: "genericPacks",
        type: "Punctuated",
        generic: "Punctuated<AstGenericTypePack>",
        optional: true,
      },
      {
        name: "closeGenerics",
        type: "Token",
        generic: 'Token<">">',
        optional: true,
      },
      { name: "equals", type: "Token", generic: 'Token<"=">' },
      { name: "type", type: "AstType" },
    ],
  },

  AstStatTypeFunction: {
    properties: [
      { name: "tag", type: '"typefunction"' },
      {
        name: "export",
        type: "Token",
        generic: 'Token<"export">',
        optional: true,
      },
      { name: "type", type: "Token", generic: 'Token<"type">' },
      { name: "functionKeyword", type: "Token", generic: 'Token<"function">' },
      { name: "name", type: "Token" },
      { name: "body", type: "AstFunctionBody" },
    ],
  },

  AstStat: {
    unionMembers: [
      "AstStatBlock",
      "AstStatIf",
      "AstStatWhile",
      "AstStatRepeat",
      "AstStatBreak",
      "AstStatContinue",
      "AstStatReturn",
      "AstStatExpr",
      "AstStatLocal",
      "AstStatFor",
      "AstStatForIn",
      "AstStatAssign",
      "AstStatCompoundAssign",
      "AstStatFunction",
      "AstStatLocalFunction",
      "AstStatTypeAlias",
      "AstStatTypeFunction",
    ],
  },

  // === GENERIC TYPES ===
  AstGenericType: {
    properties: [
      { name: "tag", type: '"generic"' },
      { name: "name", type: "Token", generic: "Token<string>" },
      { name: "equals", type: "Token", generic: 'Token<"=">', optional: true },
      { name: "default", type: "AstType", optional: true },
    ],
  },

  AstGenericTypePack: {
    properties: [
      { name: "tag", type: '"genericpack"' },
      { name: "name", type: "Token", generic: "Token<string>" },
      { name: "ellipsis", type: "Token", generic: 'Token<"...">' },
      { name: "equals", type: "Token", generic: 'Token<"=">', optional: true },
      { name: "default", type: "AstTypePack", optional: true },
    ],
  },

  // === TYPE SYSTEM ===
  AstTypeReference: {
    properties: [
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
        generic: "Punctuated<AstType | AstTypePack>",
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

  AstTypeSingletonBool: {
    baseType: "Token",
    properties: [
      { name: "tag", type: '"boolean"' },
      { name: "text", type: ["true", "false"] },
      { name: "value", type: "boolean" },
    ],
  },

  AstTypeSingletonString: {
    baseType: "Token",
    properties: [
      { name: "tag", type: '"string"' },
      { name: "text", type: "string" },
      { name: "quoteStyle", type: ["single", "double"] },
    ],
  },

  AstTypeTypeof: {
    properties: [
      { name: "tag", type: '"typeof"' },
      { name: "typeof", type: "Token", generic: 'Token<"typeof">' },
      { name: "openParens", type: "Token", generic: 'Token<"(">' },
      { name: "expression", type: "AstExpr" },
      { name: "closeParens", type: "Token", generic: 'Token<")">' },
    ],
  },

  AstTypeGroup: {
    properties: [
      { name: "tag", type: '"group"' },
      { name: "openParens", type: "Token", generic: 'Token<"(">' },
      { name: "type", type: "AstType" },
      { name: "closeParens", type: "Token", generic: 'Token<")">' },
    ],
  },

  AstTypeOptional: {
    baseType: "Token",
    properties: [
      { name: "tag", type: '"optional"' },
      { name: "text", type: '"?"' },
    ],
  },

  AstTypeUnion: {
    properties: [
      { name: "tag", type: '"union"' },
      { name: "leading", type: "Token", generic: 'Token<"|">', optional: true },
      {
        name: "types",
        type: "Punctuated",
        generic: 'Punctuated<AstType, "|">',
      },
    ],
  },

  AstTypeIntersection: {
    properties: [
      { name: "tag", type: '"intersection"' },
      { name: "leading", type: "Token", generic: 'Token<"&">', optional: true },
      {
        name: "types",
        type: "Punctuated",
        generic: 'Punctuated<AstType, "&">',
      },
    ],
  },

  AstTypeArray: {
    properties: [
      { name: "tag", type: '"array"' },
      { name: "openBrace", type: "Token", generic: 'Token<"{">' },
      {
        name: "access",
        type: "Token",
        generic: 'Token<"read" | "write">',
        optional: true,
      },
      { name: "type", type: "AstType" },
      { name: "closeBrace", type: "Token", generic: 'Token<"}">' },
    ],
  },

  AstTypeTableItem: {
    kinds: {
      indexer: {
        properties: [
          { name: "kind", type: '"indexer"' },
          {
            name: "access",
            type: "Token",
            generic: 'Token<"read" | "write">',
            optional: true,
          },
          { name: "indexerOpen", type: "Token", generic: 'Token<"[">' },
          { name: "key", type: "AstType" },
          { name: "indexerClose", type: "Token", generic: 'Token<"]">' },
          { name: "colon", type: "Token", generic: 'Token<":">' },
          { name: "value", type: "AstType" },
          {
            name: "separator",
            type: "Token",
            generic: 'Token<"," | ";">',
            optional: true,
          },
        ],
      },
      stringproperty: {
        properties: [
          { name: "kind", type: '"stringproperty"' },
          {
            name: "access",
            type: "Token",
            generic: 'Token<"read" | "write">',
            optional: true,
          },
          { name: "indexerOpen", type: "Token", generic: 'Token<"[">' },
          { name: "key", type: "AstTypeSingletonString" },
          { name: "indexerClose", type: "Token", generic: 'Token<"]">' },
          { name: "colon", type: "Token", generic: 'Token<":">' },
          { name: "value", type: "AstType" },
          {
            name: "separator",
            type: "Token",
            generic: 'Token<"," | ";">',
            optional: true,
          },
        ],
      },
      property: {
        properties: [
          { name: "kind", type: '"property"' },
          {
            name: "access",
            type: "Token",
            generic: 'Token<"read" | "write">',
            optional: true,
          },
          { name: "key", type: "AstTypeSingletonString" },
          { name: "indexerClose", type: "Token", generic: 'Token<"]">' },
          { name: "colon", type: "Token", generic: 'Token<":">' },
          { name: "value", type: "AstType" },
          {
            name: "separator",
            type: "Token",
            generic: 'Token<"," | ";">',
            optional: true,
          },
        ],
      },
    },
  },

  AstTypeTable: {
    properties: [
      { name: "tag", type: '"table"' },
      { name: "openBrace", type: "Token", generic: 'Token<"{">' },
      { name: "entries", type: "{ AstTypeTableItem }" },
      { name: "closeBrace", type: "Token", generic: 'Token<"}">' },
    ],
  },

  AstTypeFunctionParameter: {
    properties: [
      { name: "name", type: "Token", optional: true },
      { name: "colon", type: "Token", generic: 'Token<":">', optional: true },
      { name: "type", type: "AstType" },
    ],
  },

  AstTypeFunction: {
    properties: [
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
        generic: "Punctuated<AstGenericType>",
        optional: true,
      },
      {
        name: "genericPacks",
        type: "Punctuated",
        generic: "Punctuated<AstGenericTypePack>",
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
        generic: "Punctuated<AstTypeFunctionParameter>",
      },
      { name: "vararg", type: "AstTypePack", optional: true },
      { name: "closeParens", type: "Token", generic: 'Token<")">' },
      { name: "returnArrow", type: "Token", generic: 'Token<"->">' },
      { name: "returnTypes", type: "AstTypePack" },
    ],
  },

  AstType: {
    unionMembers: [
      "AstTypeReference",
      "AstTypeSingletonBool",
      "AstTypeSingletonString",
      "AstTypeTypeof",
      "AstTypeGroup",
      "AstTypeUnion",
      "AstTypeIntersection",
      "AstTypeOptional",
      "AstTypeArray",
      "AstTypeTable",
      "AstTypeFunction",
    ],
  },

  // === TYPE PACKS ===
  AstTypePackExplicit: {
    properties: [
      { name: "tag", type: '"explicit"' },
      {
        name: "openParens",
        type: "Token",
        generic: 'Token<"(">',
        optional: true,
      },
      { name: "types", type: "Punctuated", generic: "Punctuated<AstType>" },
      { name: "tailType", type: "AstTypePack", optional: true },
      {
        name: "closeParens",
        type: "Token",
        generic: 'Token<")">',
        optional: true,
      },
    ],
  },

  AstTypePackGeneric: {
    properties: [
      { name: "tag", type: '"generic"' },
      { name: "name", type: "Token" },
      { name: "ellipsis", type: "Token", generic: 'Token<"...">' },
    ],
  },

  AstTypePackVariadic: {
    properties: [
      { name: "tag", type: '"variadic"' },
      {
        name: "ellipsis",
        type: "Token",
        generic: 'Token<"...">',
        optional: true,
      },
      { name: "type", type: "AstType" },
    ],
  },

  AstTypePack: {
    unionMembers: [
      "AstTypePackExplicit",
      "AstTypePackGeneric",
      "AstTypePackVariadic",
    ],
  },
};