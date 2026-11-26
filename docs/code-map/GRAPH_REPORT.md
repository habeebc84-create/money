# Graph Report - Kaasu  (2026-11-26)

## Corpus Check
- 56 files · ~17,033 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .webmanifest 1)

## Summary
- 336 nodes · 1034 edges · 20 communities (15 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- recurring.tsx
- settings.tsx
- store.tsx
- dashboard.tsx
- app-shell.tsx
- package.json
- dependencies
- compilerOptions
- entries.tsx
- browser-check.mjs
- scripts
- next
- Kaasu: student money tracker
- eslint-config-next
- vitest
- vercel.json
- PHASE_LOG.md
- @fontsource-variable/bricolage-grotesque
- postcss.config.mjs
- sw.js

## God Nodes (most connected - your core abstractions)
1. `Dashboard()` - 30 edges
2. `cn()` - 29 edges
3. `Button` - 20 edges
4. `todayISO()` - 20 edges
5. `useStore()` - 18 edges
6. `formatINR()` - 18 edges
7. `RecurringView()` - 18 edges
8. `SettingsView()` - 18 edges
9. `monthKey()` - 17 edges
10. `Entry` - 17 edges

## Surprising Connections (you probably didn't know these)
- `StoreProvider()` --indirect_call--> `newId()`  [INFERRED]
  src/components/store.tsx → src/lib/ids.ts
- `SettingsView()` --indirect_call--> `newId()`  [INFERRED]
  src/views/settings.tsx → src/lib/ids.ts
- `Page()` --calls--> `BudgetsView()`  [EXTRACTED]
  src/app/budgets/page.tsx → src/views/budgets.tsx
- `Page()` --calls--> `EntriesView()`  [EXTRACTED]
  src/app/entries/page.tsx → src/views/entries.tsx
- `Page()` --calls--> `GoalsView()`  [EXTRACTED]
  src/app/goals/page.tsx → src/views/goals.tsx

## Import Cycles
- None detected.

## Communities (20 total, 5 thin omitted)

### Community 0 - "recurring.tsx"
Cohesion: 0.13
Nodes (39): react, metadata, Page(), metadata, Page(), EmptyState(), Ctx, EntryEditorProvider() (+31 more)

### Community 1 - "settings.tsx"
Cohesion: 0.07
Nodes (40): RFC-4180, metadata, Page(), PageHeader(), BACKUP_APP, makeBackup(), MAX_BACKUP_BYTES, readBackup() (+32 more)

### Community 2 - "store.tsx"
Cohesion: 0.11
Nodes (35): EditorApi, Ctx, Status, StoreProvider(), StoreValue, PaymentMethod, addDays(), addMonthsClamped() (+27 more)

### Community 3 - "dashboard.tsx"
Cohesion: 0.16
Nodes (32): metadata, Page(), Page(), Bars(), Donut(), Slice, Card(), MonthSwitcher() (+24 more)

### Community 4 - "app-shell.tsx"
Cohesion: 0.12
Nodes (22): motion@14.14.0, motion, metadata, RootLayout(), viewport, AppShell(), Brand(), Frame() (+14 more)

### Community 5 - "package.json"
Cohesion: 0.14
Nodes (19): description, devDependencies, eslint@9.39.5, tailwindcss@4.3.5, @tailwindcss/postcss@4.3.5, @types/node@26.6.10, @types/react@19.3.3, @types/react-dom@19.3.0 (+11 more)

### Community 6 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority@0.7.1, clsx@2.1.1, @fontsource/ibm-plex-mono@5.3.0, @fontsource-variable/figtree@5.3.0, lucide-react@1.80.0, @radix-ui/react-dialog@1.3.1, react@19.3.1 (+11 more)

### Community 7 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "entries.tsx"
Cohesion: 0.24
Nodes (13): lucide-react, metadata, Page(), useEntryEditor(), EntryRow(), ALL_CATEGORIES, categoryColor(), EXPENSE_CATEGORIES (+5 more)

### Community 9 - "browser-check.mjs"
Cohesion: 0.22
Nodes (5): playwright-core@1.65.1, playwright-core, failed, results, icons

### Community 10 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, prebuild, test, typecheck

### Community 11 - "next"
Cohesion: 0.33
Nodes (3): nextConfig, next@16.4.6, next

### Community 12 - "Kaasu: student money tracker"
Cohesion: 0.40
Nodes (4): Data, Free hosting (no card), you choose one, Kaasu: student money tracker, Run

### Community 13 - "eslint-config-next"
Cohesion: 0.50
Nodes (3): config, eslint-config-next@16.4.6, eslint-config-next

### Community 15 - "vercel.json"
Cohesion: 0.50
Nodes (3): framework, headers, $schema

## Knowledge Gaps
- **1 isolated node(s):** `RFC-4180`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 99 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `recurring.tsx` to `settings.tsx`, `store.tsx`, `dashboard.tsx`, `app-shell.tsx`, `package.json`, `dependencies`, `entries.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `RFC-4180` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `recurring.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13499245852187028 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `recurring.tsx`, `settings.tsx`, `dashboard.tsx`, `app-shell.tsx`, `package.json`, `entries.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07493061979648474 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `entries.tsx` to `recurring.tsx`, `settings.tsx`, `dashboard.tsx`, `app-shell.tsx`, `package.json`, `dependencies`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `store.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._