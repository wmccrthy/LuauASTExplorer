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

    expect(getArrayType("separators")).toEqual(["{ CstToken }", ""]);

    expect(getArrayType("invalidType")).toEqual([undefined, ""]);
  });

  test("parseGenericType", () => {
    expect(parseGenericType("CstPunctuated<CstExpr>")).toEqual({
      baseType: "CstPunctuated",
      genericType: "CstExpr",
    });

    expect(parseGenericType('CstPunctuated<CstType, "|">')).toEqual({
      baseType: "CstPunctuated",
      genericType: 'CstType, "|"',
    });

    expect(parseGenericType("CstLocal")).toEqual(undefined);

    expect(parseGenericType("randomType")).toEqual(undefined);
  });

  test("getGenericASTTypeDefinition for CstPunctuated", () => {
    const punctuatedType = parseGenericType(
      "CstPunctuated<CstExpr>"
    ) as GenericTypeDefinition;
    const definition = getGenericASTTypeDefinition(punctuatedType);

    expect(definition).toEqual({
      properties: [
        { name: "", type: "{ CstExpr }" },
        { name: "separators", type: "{ CstToken }" },
      ],
    });

    // With separator type specified
    const unionPunctuated = parseGenericType(
      'CstPunctuated<CstType, "|">'
    ) as GenericTypeDefinition;
    const unionDef = getGenericASTTypeDefinition(unionPunctuated);

    expect(unionDef).toEqual({
      properties: [
        { name: "", type: "{ CstType }" },
        { name: "separators", type: "{ CstToken }" },
      ],
    });
  });

  test("getTypeString", () => {
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

    // test CstPunctuated generic type
    expect(getType("CstPunctuated<CstExpr>")).toEqual([
      {
        properties: [
          { name: "", type: "{ CstExpr }" },
          { name: "separators", type: "{ CstToken }" },
        ],
      },
      false,
    ]);
  });
});
