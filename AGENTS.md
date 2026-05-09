<!-- intent-skills:start -->
## Skill Loading

Before substantial work:
- Skill check: run `npx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# Agent Guidelines

## TypeScript
- Never use `any` unless 100% necessary or specifically instructed.

## Commands
- Focus on checking commands like `bun run typecheck`, `bun run lint`, etc.

## Essentials

- Package manager: `bun`
- Don't run builds after every change. This is a visual site; assume changes work unless reported otherwise.
- **Typesafety is paramount.** Never cast types; fix at source instead. See [typescript.md](.agents/typescript.md).

## Topic Guides

- [TypeScript Conventions](.agents/typescript.md): Type inference, casting rules, generic naming
- [Workflow](.agents/workflow.md)
