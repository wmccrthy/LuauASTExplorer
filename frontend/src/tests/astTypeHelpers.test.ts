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

    expect(getArrayType("statements")).toEqual(["{ CstStat }", ""]);

    expect(getArrayType("entries", [{ colon: ":", kind: "record" }])).toEqual([
      "{ CstTableTypeItem }",
      "record",
    ]);

    expect(getArrayType("entries", [{ kind: "general" }])).toEqual([
      "{ CstTableExprItem }",
      "general",
    ]);

    expect(getArrayType("invalidType")).toEqual([undefined, ""]);
  });

  test("parseGenericType", () => {
    expect(parseGenericType("Pair<CstExpr>")).toEqual({
      baseType: "Pair",
      genericType: "CstExpr",
    });

    expect(parseGenericType("Punctuated<CstExpr>")).toEqual({
      baseType: "Punctuated",
      genericType: "CstExpr",
    });

    expect(parseGenericType('Pair<CstExpr, "&">')).toEqual({
      baseType: "Pair",
      genericType: 'CstExpr, "&"',
    });

    expect(parseGenericType("CstLocal")).toEqual(undefined);

    expect(parseGenericType("randomType")).toEqual(undefined);
  });

  test("getGenericASTTypeDefinition e2e", () => {
    const punctuatedType = parseGenericType(
      "Punctuated<CstExpr, '&'>"
    ) as GenericTypeDefinition;
    const punctuatedDefinition = getGenericASTTypeDefinition(punctuatedType);

    expect(punctuatedDefinition).toEqual({
      properties: [{ name: "", type: "{ Pair<CstExpr, '&'> }" }],
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
        { name: "node", type: "CstExpr" },
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
    expect(getTypeString({ _astType: "CstStatBlock" }, "block")).toEqual([
      "CstStatBlock",
      "",
    ]);

    // leverages getArrayType
    expect(getTypeString([{}], "entries")).toEqual([
      "{ CstTableExprItem }",
      "",
    ]);

    // falls back on parentInferredType
    expect(
      getTypeString({ kind: "record" }, "[0]", "CstTableExprItem")
    ).toEqual(["CstTableExprItem", "record"]);
  });

  test("getType", () => {
    // test standard case
    expect(getType("CstLocal")).toEqual([
      astTypeDefinitions["CstLocal"],
      false,
    ]);
    
    // test array/table type
    expect(getType("{ CstLocal }")).toEqual([
      astTypeDefinitions["CstLocal"],
      true,
    ]);

    // test generic type
    expect(getType("Pair<CstExpr, '&'>")).toEqual([
      {
        properties: [
          { name: "node", type: "CstExpr" },
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
