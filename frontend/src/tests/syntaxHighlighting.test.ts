// Mock the CSS import
jest.mock('../utils/syntaxHighlighting.css', () => ({}));

import { detectVSCodeTheme, hexToRGB } from "../utils/syntaxHighlighting";

const light: [string, [number, number, number]][] = [
    ["#ffffff", [255, 255, 255]],
    ["ffffff", [255, 255, 255]],
    ["#f5f5f5", [245, 245, 245]],
    ["f0f0f0", [240, 240, 240]],
    ["#eaeaea", [234, 234, 234]],
];
const dark: [string, [number, number, number]][] = [
    ["#000000", [0, 0, 0]],
    ["000000", [0, 0, 0]],
    ["#1a1a1a", [26, 26, 26]],
    ["222222", [34, 34, 34]],
    ["#2d2d2d", [45, 45, 45]],
];

describe("syntaxHighlighting", () => {
    test("hexToRGB", () => {
        light.forEach((hex) => {
            expect(hexToRGB(hex[0])).toStrictEqual(hex[1]);
        });
        dark.forEach((hex) => {
            expect(hexToRGB(hex[0])).toStrictEqual(hex[1]);
        })
    });

    test("detectVSCodeTheme", () => {
        light.forEach((hex) => {
            expect(detectVSCodeTheme(hex[0])).toBe('light');
        });
        dark.forEach((hex) => {
            expect(detectVSCodeTheme(hex[0])).toBe('dark');
        });
    });
});