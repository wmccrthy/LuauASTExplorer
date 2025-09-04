import { useTypeMetadata } from "../hooks/useTypeMetadata";
import { TreeNodeContainerProps } from "../types/typesAndInterfaces";
import { renderHook } from "@testing-library/react";
import { astTypeDefinitions, TypeMetadata } from "../utils/astTypeDefinitions";

// astTypeHelpers, upon which useTypeMetadata relies, are tested separately;
// the goal here is not to test that the correct types are returned (since we assume astTypeHelpers work), but to test that useTypeMetadata behaves as expected
//
const defaultProps = {
  nodeKey: "",
  level: 0,
  path: "",
};

const testHook = (props: TreeNodeContainerProps) => {
  return renderHook((innerProps: TreeNodeContainerProps = props) =>
    useTypeMetadata(innerProps)
  );
};

const expectMatchingTypes = (result: TypeMetadata) => {
  expect(result.type).toEqual(result.prevType);
  expect(result.typeDefinition).toEqual(result.prevTypeDefinition);
  expect(result.arrayType).toEqual(result.prevArrayType);
  expect(result.kind).toEqual(result.prevKind);
};

describe("useTypeMetadata test", () => {
  test("should work with default props", () => {
    const { result } = testHook({
      ...defaultProps,
      value: { _astType: "_testType" },
    });
    expect(result.current).toBeDefined();
    expect(result.current.type).toEqual("_testType");
    expect(result.current.typeDefinition).toEqual(astTypeDefinitions._testType);
  });

  test("should re-compute metadata on prop change", () => {
    const { result, rerender } = testHook({
      ...defaultProps,
      value: { _astType: "_testType" },
    });
    expect(result.current).toBeDefined();
    const renderOneResult = result.current
    expect(renderOneResult).toEqual(result.current);
    rerender({ value: { _astType: "AstLocal" }, ...defaultProps });
    expect(result.current).toBeDefined();
    expect(result.current).not.toEqual(renderOneResult);
  })

  test("if not diffMode, prevTypeMetadata should equal typeMetadata", () => {
    const { result } = testHook({
      ...defaultProps,
      value: { _astType: "_testType" },
    });
    expectMatchingTypes(result.current);
  });

  test("if diffMode and no child type change, prevTypeMetadata should equal typeMetadata", () => {
    const { result } = testHook({
      ...defaultProps,
      isDiffMode: true,
      value: { _astType: "_testType" },
    });
    expectMatchingTypes(result.current);
  });

  test("if diffMode and child type change, prevTypeMetadata should not equal typeMetadata", () => {
    const { result } = testHook({
      ...defaultProps,
      isDiffMode: true,
      value: {
        _astType: "_testType",
        childChanges: {
          _astType: {
            type: "UPDATE",
            oldValue: "AstLocal",
            value: "_testType",
          },
        },
      },
    });
    expect(result.current.type).not.toEqual(result.current.prevType);
    expect(result.current.type).not.toEqual(result.current.prevTypeDefinition);
  });
});
