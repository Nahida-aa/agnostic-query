---
title: "Agent Workflow"
---

# Agent Workflow

## 每次变更后必须运行类型检查

```bash
bun run --filter web typecheck
```

## Release

This project uses [Changesets](https://github.com/changesets/changesets) + GitHub Actions for automated publishing.

### Steps

1. **Create a changeset** describing the change:
   ```bash
   bunx changeset
   ```
   Or write a markdown file manually in `.changeset/`.

2. **Commit the changeset** along with your code changes, then **push to `main`**.

3. The `release.yml` workflow will create a "chore: version packages" PR.

4. **Merge that PR** — workflow publishes to npm automatically.

### Rules

- Never publish directly — always go through changesets.
- Code changes → `minor`, docs-only → `patch`.
- `prepublishOnly` script copies `README.md` + `LICENSE` from root automatically.
