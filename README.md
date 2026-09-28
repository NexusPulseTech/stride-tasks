# Solo Tasks Manager

A minimal, local-first task manager designed for deep work, recursive planning, and fast execution. It blends Notion-style nested subtasks, Linear-like status flow, and a calm Apple-inspired UI into a single browser-based workflow.

<p align="center">
  <img src="./docs/assets/desktop-home.png" alt="Solo Tasks Manager desktop dashboard" width="1200" />
</p>

## Why this project

This repo is built around a simple idea: productivity tools should be calm, zero-friction, and durable. Instead of forcing users into heavy cloud-based project platforms, the app keeps everything local, respects fast interaction, and helps break large goals into small actionable work units.

### Core principles

- Local-first by default: state persists in browser storage and remains usable offline.
- Recursive task decomposition: big goals become nested work trees that can expand indefinitely.
- Fast feedback loop: status changes, completion flows, and keyboard actions stay lightweight.
- Design discipline: clear hierarchy, restrained motion, readable typography, and strong focus mode.

---

## Product overview

### What the app helps with

- Manage personal projects and workstreams in one place.
- Break work down into nested subtasks without losing context.
- Track progress with linear lifecycle states: to do → doing → done.
- Monitor completed work and consistency through streaks and rhythm heatmaps.
- Export/import backups safely from local browser storage.
- Install as a PWA and use it as an offline app-like system.

---

## Main screens

### 1) Project dashboard

The main board shows a compact operational view with task progress, focus controls, and the primary work surface.

<p align="center">
  <img src="./docs/assets/desktop-home.png" alt="Project dashboard overview" width="1100" />
</p>

### 2) Mobile workflow

The mobile layout preserves the same task workflow while optimizing interaction for thumb-friendly, single-column usage.

<p align="center">
  <img src="./docs/assets/mobile-home.png" alt="Mobile workflow screenshot" width="420" />
</p>

### 3) Product rhythm and task flow

The app combines deep planning, status transitions, and a calm visual system to keep work visible without overwhelming the user.

<p align="center">
  <img src="./docs/assets/desktop-home.png" alt="Daily task flow screenshot" width="1100" />
</p>

---

## Feature set

### Task management

- Create projects and tasks quickly.
- Mark work by status: todo, doing, done.
- Expand and collapse task branches for cleaner focus.
- Edit inline with minimal friction.
- Keep work recursive and easy to reason about.

### Productivity layer

- Completion streak tracking.
- Activity rhythm / heatmap view.
- Per-day summary and task history.
- Focus mode to hide finished items and reduce distractions.

### Data safety and offline experience

- Local persistence with browser storage.
- JSON backup export/import.
- Offline HTML export for standalone usage.
- PWA support for install-on-home-screen workflows.

### UX and polish

- Calm dark/light/system themes.
- Keyboard shortcuts for speed.
- Portal-based menus and modals to avoid stacking-context issues.
- Gentle reward moments with sound/chime and celebration feedback.

---

## Tech stack

| Layer | Choice | Why it fits |
| --- | --- | --- |
| UI library | React 19 | Fast composition and modern component patterns |
| Language | TypeScript | Safer refactors and clearer contracts |
| Build tool | Vite | Fast developer experience and simple production builds |
| Styling | Tailwind CSS v4 | Utility-first system for crisp UI implementation |
| Icons | Lucide React | Clean, lightweight SVG icon set |
| Persistence | LocalStorage | Keeps the app local-first and offline-friendly |
| Packaging model | Vite + PWA-friendly static app | Simple deployment and app-like UX |

---

## Architecture summary

The project follows a clean separation of concerns:

- State and task operations are centralized in the task manager logic.
- Recursive task behavior is isolated to tree utilities and invariants.
- UI surfaces are intentionally slim and composable.
- Modal and menu overlays are rendered through a portal strategy to avoid clipping issues.

This keeps the codebase easier to reason about and more maintainable over time.

---

## Project structure

```text
.
├── docs/
│   ├── architecture/
│   ├── design-system/
│   ├── development/
│   ├── guides/
│   └── standards/
├── public/
├── src/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── ARCHITECTURE.md
├── LICENSE
├── README.md
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

---

## Quick start

### Requirements

- Node.js 18+
- npm

### Install and run

```bash
npm install --legacy-peer-deps
npm run dev
```

Then open:

```text
http://localhost:3000/
```

### Useful commands

```bash
npm run lint
npm run build
```

---

## Documentation

For deeper project context, see:

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [docs/development/getting-started.md](./docs/development/getting-started.md)
- [docs/guides/user-guide.md](./docs/guides/user-guide.md)
- [docs/architecture/system-overview.md](./docs/architecture/system-overview.md)

---

## Standards and engineering practices

This repo is structured with engineering discipline in mind:

- Clear module boundaries.
- Type-safe contracts.
- Local-first persistence model.
- Documentation-first handoff.
- Conventional Git commit conventions.
- Small, reviewable UI modules.

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
