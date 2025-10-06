
# Changelog

## [0.1.8] - 2025-10-06

### Fixes

- nit styling improvements to code editor [#53](https://github.com/wmccrthy/LuauASTExplorer/pull/53)


## [0.1.7] - 2025-10-05

### Fixes

- Remove unintended text area border on code input [#49](https://github.com/wmccrthy/LuauASTExplorer/pull/49)


## [0.1.6] - 2025-10-05

### Features

- Better code preview [#48](https://github.com/wmccrthy/LuauASTExplorer/pull/48)

### Fixes

- Support auto-detecting lute executable for rokit [#46](https://github.com/wmccrthy/LuauASTExplorer/pull/46)


## [0.1.5] - 2025-08-27

### Features

- add type annotations for removed keys and node type before->after display [#38](https://github.com/wmccrthy/LuauASTExplorer/pull/38)

### Fixes

- Fix diffing module so removed nodes are included in diff-annotated output. Consolidate `diffUtils` redundancies and repeated logic into functions. [#36](https://github.com/wmccrthy/LuauASTExplorer/pull/36)


## [0.1.4] - 2025-08-21

### Features

- Revamp type annotation system; add more comprehensive type definitions, support generics and array types, better styling on the TypeTooltip, and more. [#28](https://github.com/wmccrthy/LuauASTExplorer/pull/28)
- Smarter diff highlight styling [#29](https://github.com/wmccrthy/LuauASTExplorer/pull/29)
- Add informative tooltip to TreeNodes on hover. If node cannot be translated (not directly parseable from AST -> code), display path. Otherwise, display corresponding code. [#30](https://github.com/wmccrthy/LuauASTExplorer/pull/30)
- Smarter auto-collapse based off node type [#31](https://github.com/wmccrthy/LuauASTExplorer/pull/31)

### Fixes

- Fix `diffUtils` inconsistencies that enforce redundant logic in `TreeNode` and remove the redundant logic. [#25](https://github.com/wmccrthy/LuauASTExplorer/pull/25)
- Support code translations for edge case nodes; extends printer functionality to support node types that are not caught by printStatement, printExpression, printType, printToken, printLocal. [#33](https://github.com/wmccrthy/LuauASTExplorer/pull/33)


## [0.1.3] - 2025-08-03

### Features

- Add Node Filtering and auto-collapse of less relevant nodes in standard mode + unchanged nodes in diff mode. Move window modes (live editor and diff analyzer) to their own components. [#18](https://github.com/wmccrthy/LuauASTExplorer/pull/18)
- Added changelog CI for better release system [#19](https://github.com/wmccrthy/LuauASTExplorer/pull/19)

### Fixes

- Fix nested additions not marked as changed [#22](https://github.com/wmccrthy/LuauASTExplorer/pull/22)
- Ensure arrays with nested additions are properly annotated [#23](https://github.com/wmccrthy/LuauASTExplorer/pull/23)

