# AGENTS.md

Repository instructions for coding agents.

## Mission

Build a premium, highly interactive **Operating Systems Algorithms Visual Simulator** for a university practical project.

Modules:
- CPU Scheduling: FCFS, SJF, SRTF, Round Robin.
- Memory Allocation: First Fit, Best Fit, Worst Fit.

The professor will primarily evaluate the **Python algorithm files**. The frontend must visualize those algorithms clearly and impressively; it must never become a second implementation of them.

## Product Direction

This should feel like an **OS laboratory / system control room / live algorithm visualizer**, not an admin dashboard.

Make algorithm behavior visible: process arrival, ready-queue changes, CPU dispatch, execution, preemption, completion, idle periods, RR queue rotation, memory-block checks, allocation success/failure, and remaining space.

Animation must explain state or causality. Decorative effects are secondary. Prefer one coherent visual system over many unrelated effects.

## Stack

Keep the existing foundation:
- Vite + React + TypeScript.
- Tailwind CSS v4 + shadcn/ui.
- React Router.
- Motion.
- GSAP + `@gsap/react`.
- Lucide + NumberFlow.
- Oxlint.
- pnpm.

Do not replace the framework, package manager, linter, or component foundation unless explicitly requested.

## Commands

Use **pnpm only** for dependencies. Never create `package-lock.json` or `yarn.lock`.

```bash
pnpm install
pnpm add <package>
pnpm remove <package>
pnpm dlx <cli>
pnpm dev
pnpm lint
pnpm build
```

Before completing substantial implementation work, run `pnpm lint` and `pnpm build`. Fix failures introduced by your changes; clearly report unrelated pre-existing failures.

## Working Method

Before substantial edits:
1. Inspect the relevant code, `package.json`, and `components.json`.
2. Check whether the capability/component already exists locally.
3. Inspect relevant installed skills and MCP tools.
4. Understand current styling and architecture.
5. Make the smallest coherent change that satisfies the task.

Do not guess package APIs, installed dependencies, paths, or repository conventions. Do not refactor unrelated code or add speculative features.

## Skills and MCP

Use installed skills intentionally.

For design, use the available Frontend Design, UI/UX Pro Max, Impeccable, and Emil design-engineering skills when relevant.

For motion, use the installed animation opportunity/build/review skills, Motion guidance, and official GSAP skills.

For component work, use shadcn, Magic UI, and the installed 21st UI explore/build/review skills.

For review, use the available React/Vite best-practice and web-design review skills.

Available MCP/registry tooling may include shadcn, Motion, Magic UI, and 21st.dev. Search these before building a complex visual component from scratch.

Approved component/effect sources include React Bits, Aceternity UI, SmoothUI, Animate UI, Cult UI, Kokonut UI, Animata, Unlumen UI, useLayouts, and Liquefy UI.

Prefer source-owned components when practical. Adapt copied components to this project's visual system; never paste them blindly.

## Design Rules

If the visual direction is not established, establish it before building every screen.

The design should be futuristic and technical but controlled: strong hierarchy, precise typography, dark technical surfaces, clear process identity, restrained grid/noise/shader treatment, and expressive state feedback.

Avoid generic AI-dashboard styling, random gradients, excessive neon, or stacking many ambient effects.

Do not add Three.js/R3F, Rive, Spline, or another heavy visual layer until the core 2D simulation experience is already strong and the task clearly benefits from it.

Use shared design tokens instead of scattered hard-coded colors.

A process must keep the same visual identity across the ready queue, CPU, Gantt chart, results, and event log. Do not communicate status by color alone.

## Motion Rules

Use **Motion** for UI state and spatial continuity: `layout`, `layoutId`, shared-element transitions, queue reordering, enter/exit, process movement, memory resizing, and interaction feedback.

Use **GSAP** for deliberate choreography: timelines, SVG/path drawing, MotionPath, Flip, SplitText/ScrambleText, and cinematic sequences.

Do not let Motion and GSAP control the same animated property on the same element.

Prefer transform and opacity for frequent motion. Respect `prefers-reduced-motion`.

## Python Is the Academic Source of Truth

All Operating Systems algorithm logic belongs in Python.

```text
python/
├── cpu/
│   ├── fcfs.py
│   ├── sjf.py
│   ├── srtf.py
│   └── round_robin.py
├── memory/
│   ├── first_fit.py
│   ├── best_fit.py
│   └── worst_fit.py
└── runner.py
```

### Strict algorithm boundary

Files under `python/cpu/` and `python/memory/` must contain **only the academic algorithm and its direct computational outputs**.

Allowed direct outputs include:
- per-process academic results such as AT, BT, FT, TAT, and WT;
- the execution/allocation schedule decided by the algorithm;
- aggregate academic metrics such as averages and total CPU idle time.

Python algorithm files must **not** generate:
- UI/playback events;
- animation frames or durations;
- Ready Queue/CPU snapshots created only for visualization;
- localized UI copy;
- component state;
- Motion/GSAP concepts;
- presentation-specific data.

The frontend may derive playback events and visual state from the schedule returned by Python, but it must never decide scheduling/allocation outcomes itself.

`python/runner.py` is only a small transport adapter: parse a request, call the selected algorithm, and serialize its direct result. Do not put scheduling logic or visualization logic in the runner.

`server/python-bridge.ts` is transport/security infrastructure only. It may launch Python, enforce resource limits, and forward JSON. It must not implement algorithms.

Do not implement FCFS/SJF/SRTF/RR/First Fit/Best Fit/Worst Fit again in TypeScript.

Keep each Python algorithm independently readable and testable. A professor should be able to open one algorithm file and follow the algorithm without navigating UI/event infrastructure. Prefer straightforward academic implementations over elaborate abstractions.

For Python algorithm files, prefer the course notation used in class (`P`, `AT`, `BT`, `FT`, `TAT`, `WT`) and simple function bodies close to the taught pseudocode. Avoid `typing.Any`, generic typing machinery, transport-schema names, and unnecessary abstractions inside algorithm files. Put JSON/frontend naming conversion and request validation in `python/runner.py`.

Do not introduce FastAPI, Flask, a database, or a separate backend unless explicitly requested.

## Academic Requirements

CPU inputs: Process ID, Arrival Time (`AT >= 0`), Burst Time (`BT > 0`), and Time Quantum for RR only (`Q > 0`).

CPU output: Process, AT, BT, FT, TAT, WT, Average WT, Average TAT, and Total CPU Idle Time.

Memory Allocation output: Process, Process Size, Allocated Memory Block, Block Size, Remaining Space, and Status (`Allocated` / `Not Allocated`).

CPU idle intervals are part of the algorithm's direct execution schedule and must not be ignored.

## Simulation Architecture

Separate **calculation** from **presentation/playback**.

Python calculates the algorithm immediately and returns direct scheduling/allocation facts. Never use Python `sleep()` to drive frontend animation.

React/TypeScript derives presentation-only events from those facts and owns play, pause, step, reset, speed, event-log copy, visual queue/CPU state, and animation timing.

This derivation must be one-way:

```text
Python algorithm
    ↓ direct schedule/results
runner.py
    ↓ JSON
Vite/Node bridge
    ↓ JSON
React adapter
    ↓ presentation events/state
UI + Motion/GSAP
```

A React adapter may explain or animate a Python decision; it may not make that decision.

Treat these as first-class product surfaces:
- Ready queue and CPU state.
- Animated Gantt chart, including idle segments.
- Synchronized event log explaining decisions.
- CPU metrics.
- Memory-block inspection/allocation and remaining space.

The visual difference between First Fit, Best Fit, and Worst Fit must be understandable.

## React and TypeScript

Use TypeScript and functional React components.

Keep components focused; co-locate feature-specific code with the feature that owns it.

Prefer derived values over duplicated state. Avoid premature global-state libraries.

Use explicit domain types for processes, memory blocks, metrics, schedule segments, and frontend playback events. Avoid `any` unless unavoidable and explained.

Client-side input validation, Arabic copy, playback-event derivation, animation state, and visualization logic belong in the frontend.

As the app grows, prefer feature-oriented ownership such as `src/features/cpu`, `src/features/memory`, `src/components/ui`, `src/components/shared`, `src/components/effects`, `src/hooks`, `src/lib`, and `src/styles`. Do not create empty scaffolding prematurely.

## Dependency Discipline

Before adding a package, verify the capability is not already available through the stack or a source-owned registry component.

Avoid overlapping libraries without a concrete reason. Heavy visual dependencies require a specific visual benefit.

Keep `pnpm-lock.yaml` synchronized.

## Quality Bar

The final UI must feel deliberately designed and simulation-specific.

Pay attention to hierarchy, typography, spacing, hover/focus/pressed states, validation feedback, empty/loading states, responsiveness, cross-highlighting, and motion timing.

Use semantic controls, visible focus states, keyboard-accessible interactions, practical target sizes, and reduced-motion support. Do not hide essential information behind hover only.

Use realistic OS examples instead of placeholder-heavy final screens.

## Completion

Before finishing a substantial task:
1. Inspect the result in context and check the browser console.
2. Run relevant Python algorithm tests.
3. Run `pnpm lint`.
4. Run `pnpm build`.
5. Verify the changed surface at common laptop viewport sizes.
6. Review significant motion for smoothness and reduced-motion behavior.
7. Confirm Python algorithm files contain no UI/playback logic.
8. Confirm TypeScript contains no duplicate scheduling/allocation algorithm.
9. Summarize what changed, dependencies added, and unresolved issues.

## Initial Build Principle

Starting from the clean foundation, do not immediately build every page.

First establish one coherent visual/motion direction, then implement a small representative slice, evaluate it, and only then scale that language across CPU and Memory.

The goal is not the maximum number of effects. The goal is to make the algorithms **visible, intuitive, memorable, and technically credible**.
