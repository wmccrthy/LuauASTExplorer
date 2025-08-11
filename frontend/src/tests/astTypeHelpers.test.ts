import {
  getArrayType,
  isArrayType,
  unpackArrayType,
  parseGenericType,
  getGenericASTTypeDefinition,
  getTypeString,
  getType,
} from "../utils/astTypeHelpers";
import {
  GenericTypeDefinition,
  PropertyDefinition,
  astTypeDefinitions,
} from "../utils/astTypeDefinitions";

describe("astTypeHelpers", () => {
  test("array type helpers", () => {
    const testArrayType = "{ testType }";

    expect(isArrayType(testArrayType)).toBe(true);

    expect(unpackArrayType(testArrayType)).toBe("testType");

    expect(getArrayType("statements")).toEqual(["{ AstStat }", ""]);

    expect(getArrayType("entries", [{ colon: ":", kind: "record" }])).toEqual([
      "{ AstTypeTableItem }",
      "record",
    ]);

    expect(getArrayType("entries", [{ kind: "general" }])).toEqual([
      "{ AstExprTableItem }",
      "general",
    ]);

    expect(getArrayType("invalidType")).toEqual([undefined, ""]);
  });

  test("parseGenericType", () => {
    expect(parseGenericType("Pair<AstExpr>")).toEqual({
      baseType: "Pair",
      genericType: "AstExpr",
    });

    expect(parseGenericType("Punctuated<AstExpr>")).toEqual({
      baseType: "Punctuated",
      genericType: "AstExpr",
    });

    expect(parseGenericType('Pair<AstExpr, "&">')).toEqual({
      baseType: "Pair",
      genericType: 'AstExpr, "&"',
    });

    expect(parseGenericType("AstLocal")).toEqual(undefined);

    expect(parseGenericType("randomType")).toEqual(undefined);
  });

  test("getGenericASTTypeDefinition e2e", () => {
    const punctuatedType = parseGenericType(
      "Punctuated<AstExpr, '&'>"
    ) as GenericTypeDefinition;
    const punctuatedDefinition = getGenericASTTypeDefinition(punctuatedType);

    expect(punctuatedDefinition).toEqual({
      properties: [{ name: "", type: "{ Pair<AstExpr, '&'> }" }],
    });

    const pairType = (
      punctuatedDefinition.properties as PropertyDefinition[]
    )[0].type;

    expect(typeof pairType).toBe("string");

    const pairTypeGenericDefinition = parseGenericType(
      unpackArrayType(pairType as string)
    );

    expect(pairTypeGenericDefinition).toBeDefined();
    const pairTypeDefinition = getGenericASTTypeDefinition(
      pairTypeGenericDefinition as GenericTypeDefinition
    );

    expect(pairTypeDefinition).toEqual({
      properties: [
        { name: "node", type: "AstExpr" },
        {
          name: "separator",
          type: "Token<'&'>",
          optional: true,
        },
      ],
    });
  });

  test("getTypeString", () => {
    // test 3 cases:

    // respect existing _astType value
    expect(getTypeString({ _astType: "AstStatBlock" }, "block")).toEqual([
      "AstStatBlock",
      "",
    ]);

    // leverage getArrayType
    expect(getTypeString([{}], "entries")).toEqual([
      "{ AstExprTableItem }",
      "",
    ]);

    // fallback on parentInferredType
    expect(
      getTypeString({ kind: "record" }, "[0]", "AstExprTableItem")
    ).toEqual(["AstExprTableItem", "record"]);
  });

  test("getType", () => {
    // test standard case
    expect(getType("AstLocal")).toEqual([
      astTypeDefinitions["AstLocal"],
      false,
    ]);
    
    // test array/table type
    expect(getType("{ AstLocal }")).toEqual([
      astTypeDefinitions["AstLocal"],
      true,
    ]);

    // test generic type
    expect(getType("Pair<AstExpr, '&'>")).toEqual([
      {
        properties: [
          { name: "node", type: "AstExpr" },
          {
            name: "separator",
            type: "Token<'&'>",
            optional: true,
          },
        ],
      },
      false,
    ]);
  });
});
