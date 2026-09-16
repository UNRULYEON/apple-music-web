- always talk in ASD-STE100 Simplified Technical English
- use `kebab-case` for all file and folder names
- prefer `function` over `const` for functions
- always use Conventional Commits format for commit messages
- do not write code comments. Only tool directives such as `@vitest-environment` and `oxlint-disable` are allowed

## Conventions

`bun run lint` enforces most of these rules with the house rules in `lint-rules/`. `bun run format:fix` sorts imports and Tailwind classes.

- `src/components/ui` and `src/lib/segmented-control.ts` are coss code. Do not change their style by hand
- import components, hooks and contexts through the barrel of their folder, for example `@/hooks`. Inside that folder, import a sibling with `./`. Import all other files with `@/`, never with `../`
- give an exported function a return type. Do not give a component a return type. A query factory that returns `queryOptions(...)` is the only exception
- use `interface` for object types and `T[]` for arrays. Import from `react` by name, never through `React.`
- name a module constant that holds plain data in `SCREAMING_SNAKE_CASE`
- name a state setter `set` plus the state name. Name a handler by what it does, never `handleX`
- for data and store functions, use one verb: `fetch` for network requests, `read` for a synchronous read or parse, `write` and `remove` for storage, `subscribeTo` for a store, `readInitial` for a server snapshot
- build every query with `queryOptions` in a factory in `src/lib`. Use `null` when a query finds nothing
- read Apple Music data with the helpers in `src/lib/music-kit/resource.ts` and `src/lib/music-kit/api.ts`
- reach browser storage only through `src/lib/storage/local.ts`
- take motion values from `src/lib/motion.ts` and layout values from `src/lib/layout.ts`
- give every icon a `strokeWidth`, and `aria-hidden="true"` or an `aria-label`
- in a file, put constants and types first, then exported functions, then private functions
- put test helpers in `src/test`. Name each `describe` block after the unit it tests. Query by role
