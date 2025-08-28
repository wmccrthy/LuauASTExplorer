import {
  getDirectChildChanges,
  setChildChanges,
  buildChangeMap,
  annotateDiffTree,
} from "../utils/diffUtils";
import { diff } from "json-diff-ts";
import { JsonDiffChange } from "../types/typesAndInterfaces";

const getChangeMap = (obj1: any, obj2: any): Map<string, JsonDiffChange> => {
  const changes = diff(obj1, obj2);
  const changeMap = new Map<string, JsonDiffChange>();
  buildChangeMap(changes, "", changeMap);
  return changeMap;
};
type astNode = {
  [key: string]: any;
};

var obj1: astNode = {
  value: {
    text: "a",
    doubleNest: {
      a: 1,
    },
  },
  unnestedText: "b",
  array: {
    items: ["a"],
  },
  removedText: "bye",
};
var obj2: astNode = {
  value: {
    text: "b",
    doubleNest: {
      a: 2,
    },
    newText: "a",
  },
  unnestedText: "a",
  array: {
    items: [],
  },
  add: {
    nestedAdd: {
      doubleNested: {},
    },
  },
};

const changeMap = getChangeMap(obj1, obj2);

const testChildChanges = (
  nodePath: string,
  expectedDescendantChanges: boolean,
  expectedChildChanges: number,
  expectedChildPaths: string[]
) => {
  const [childChanges, anyDescendantChanges] = getDirectChildChanges(
    nodePath,
    changeMap
  );
  expect(anyDescendantChanges).toBe(expectedDescendantChanges);
  expect(childChanges.length).toBe(expectedChildChanges);
  expectedChildPaths.forEach((path) => {
    expect(childChanges.includes(path)).toEqual(true);
  });
};

describe("diffUtils test", () => {
  // takes json-diff-ts diff output and flatten to nodePath -> change
  // we can test by manually constructing objects (ob1 -> obj2), getting diff, building changeMap. Then check that changeMap contains the paths we manually change in obj construction
  // essentially want to ensure that paths are correct,
  test("buildChangeMap", () => {
    expect(changeMap.get("value.text")).toBeDefined();
    expect(changeMap.get("value.text")?.type).toEqual("UPDATE");
    expect(changeMap.get("value.doubleNest.a")).toBeDefined();
    expect(changeMap.get("value.doubleNest.a")?.type).toEqual("UPDATE");
    expect(changeMap.get("value.newText")).toBeDefined();
    expect(changeMap.get("value.newText")?.type).toEqual("ADD");
    expect(changeMap.get("unnestedText")).toBeDefined();
    expect(changeMap.get("unnestedText")?.type).toEqual("UPDATE");
    expect(changeMap.get("array.items.0")).toBeDefined();
    expect(changeMap.get("array.items.0")?.type).toEqual("REMOVE");
    expect(changeMap.get("removedText")).toBeDefined();
    expect(changeMap.get("removedText")?.type).toEqual("REMOVE");
    expect(changeMap.get("add")).toBeDefined();
    expect(changeMap.get("add")?.type).toEqual("ADD");
  });

  // given a nodePath, and changemap, returns array of paths with child changes
  test("getDirectChildChanges", () => {
    testChildChanges("value", true, 2, ["value.text", "value.newText"]);
    testChildChanges("value.doubleNest", false, 1, ["value.doubleNest.a"]);
    testChildChanges("", true, 3, ["unnestedText", "removedText", "add"]);
    testChildChanges("array.items", false, 1, ["array.items.0"]);
    testChildChanges("unnestedText", false, 0, []);
    testChildChanges("add", false, 0, []);
  });

  /**
   * can test couple of things for setChildChanges:
   *    removals are injected properly to passed node
   *    expected changes all exist
   */
  test("setChildChanges", () => {
    const tmpObj2 = JSON.parse(JSON.stringify(obj2));
    // testing on root object
    setChildChanges(
      tmpObj2,
      "",
      ["removedText", "unnestedText", "add"],
      changeMap
    );
    expect(tmpObj2.childChanges).toBeDefined();
    expect(Object.keys(tmpObj2.childChanges).length).toEqual(3);
    expect(tmpObj2.removedText).toBeDefined(); // expect removals to inject
    expect(tmpObj2.childChanges.removedText).toBeDefined();
    expect(tmpObj2.childChanges.unnestedText).toBeDefined();
    expect(tmpObj2.childChanges.add).toBeDefined();
    expect(tmpObj2.childChanges.removedText.type).toEqual("REMOVE");
    expect(tmpObj2.childChanges.unnestedText.type).toEqual("UPDATE");
    expect(tmpObj2.childChanges.add.type).toEqual("ADD");

    // testing on obj.value
    setChildChanges(
      tmpObj2.value,
      "value",
      ["value.text", "value.newText"],
      changeMap
    );
    expect(tmpObj2.value.childChanges).toBeDefined();
    expect(Object.keys(tmpObj2.value.childChanges).length).toEqual(2);
    expect(tmpObj2.value.childChanges.text).toBeDefined();
    expect(tmpObj2.value.childChanges.newText).toBeDefined();
    expect(tmpObj2.value.childChanges.text.type).toEqual("UPDATE");
    expect(tmpObj2.value.childChanges.newText.type).toEqual("ADD");

    // testing on obj.array
    setChildChanges(
      tmpObj2.array.items,
      "array.items",
      ["array.items.0"],
      changeMap
    );
    expect(tmpObj2.array.items[0]).toBeDefined();
    expect(tmpObj2.array.items.childChanges).toBeDefined();
    expect(Object.keys(tmpObj2.array.items.childChanges).length).toEqual(1);
    expect(tmpObj2.array.items.childChanges[0]).toBeDefined();
    expect(tmpObj2.array.items.childChanges[0].type).toEqual("REMOVE");
  });

  /**
   * diff ob1 -> obj2
   * verify removals exist in obj2
   * verify all changes have correct statuses
   */
  test("annotateDiffTree", () => {
    const annotations = annotateDiffTree(obj1, obj2);
    const diffTree = annotations.diffTree;

    // expect removed nodes to exist in the tree
    expect(diffTree.removedText).toBeDefined();
    expect(diffTree.array.items[0]).toBeDefined();

    // expect node to have proper statuses
    expect(diffTree.diffStatus).toEqual("contains-changes");
    expect(diffTree.value.diffStatus).toEqual("contains-changes");
    expect(diffTree.value.doubleNest.diffStatus).toEqual("contains-changes");
    expect(diffTree.array.diffStatus).toEqual("contains-nested-changes");
    expect(diffTree.array.items.diffStatus).toEqual("contains-changes");
    expect(diffTree.add.diffStatus).toEqual("added");
    expect(diffTree.add.nestedAdd.diffStatus).toEqual("nested-add");
    expect(diffTree.add.nestedAdd.doubleNested.diffStatus).toEqual(
      "nested-add"
    );
  });

  /**
   * Test edge case: empty objects and arrays
   */
  test("empty object and array handling", () => {
    const obj1 = {
      emptyObj: {},
      emptyArray: [],
      data: { value: "test" },
    };
    const obj2 = {
      emptyObj: { newProp: "added" },
      emptyArray: ["newItem"],
      data: {},
    };

    const result = annotateDiffTree(obj1, obj2);
    const diffTree = result.diffTree;

    expect(diffTree.diffStatus).toEqual("contains-nested-changes");
    expect(diffTree.emptyObj.diffStatus).toEqual("contains-changes");
    expect(diffTree.emptyArray.diffStatus).toEqual("contains-changes");
    expect(diffTree.data.diffStatus).toEqual("contains-changes");
  });
});
