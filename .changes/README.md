# Changelog Files

This directory contains individual changelog files for pull requests.

## Automatic Creation

Changelog files are **automatically created** when you open a PR with a title starting with `#feat` or `#bug`. The CI will:

1. Extract the PR number and type from the title
2. Create a file named `{pr-number}-{type}.md`
3. Use the description from your PR title (minus the `#feat`/`#bug` prefix) as the content
4. Commit the file to your PR branch

## Manual Creation (if needed)

You can also manually create changelog files:

### Format

`{pr-number}-{type}.md` where:
- `{pr-number}` is the PR number
- `{type}` is either `feat` or `bug`

### Examples

- `123-feat.md` for a feature in PR #123
- `456-bug.md` for a bug fix in PR #456

## Content

Each file contains a brief description of the change:

```markdown
Add support for TypeScript AST parsing
```

```markdown
Fix highlighting issue with nested function calls
```

## Generated Output

When processed during release, these appear in CHANGELOG.md as:

### Features
- Add support for TypeScript AST parsing [#123](https://github.com/user/repo/pull/123)

### Fixes  
- Fix highlighting issue with nested function calls [#456](https://github.com/user/repo/pull/456)

## PR Title Format

Use these formats for automatic changelog creation:

- `#feat Add new feature description` → Creates `{pr-number}-feat.md`
- `#bug Fix issue description` → Creates `{pr-number}-bug.md`  
- `#chore Update documentation` → No changelog file created
