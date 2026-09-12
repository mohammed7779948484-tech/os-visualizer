# OS Visualizer — Kernel Trace

Arabic-first interactive visualizer for Operating Systems algorithms.

The project deliberately separates the academic algorithms from the presentation layer:

```text
Python algorithm → JSON result → local Vite/Node bridge → React visualization
```

## Current status

Implemented end-to-end:
- **FCFS** CPU Scheduling in Python.
- AT / BT / FT / TAT / WT.
- Average WT and Average TAT.
- CPU idle-time calculation and idle schedule segments.
- Arabic RTL visualization with Ready Queue, CPU state, Gantt schedule, metrics, results, event log, and playback controls.

Not yet implemented in Python:
- SJF
- SRTF (the UI currently contains a clearly-labelled prerecorded teaching scene only)
- Round Robin
- Memory Allocation algorithms

## Architecture boundary

### Python

`python/cpu/*.py` and later `python/memory/*.py` contain only the academic algorithms and their direct outputs.

Python does **not** produce UI events, animation frames, localized text, or React state.

### Frontend

React/TypeScript receives the schedule already decided by Python and derives presentation-only playback events from it. The frontend may visualize a decision but must not make the scheduling decision itself.

### Bridge

`server/python-bridge.ts` is a thin local transport layer. It starts `python/runner.py`, sends JSON through stdin, reads JSON from stdout, and returns it to the browser.

## Requirements

- Node.js compatible with the versions declared in `package.json`.
- pnpm.
- Python 3.10+ available as `python3` on macOS/Linux or `python` on Windows.

If your Python executable has another name/path, set `PYTHON_BIN` before starting Vite.

## Development

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite.

The browser calls `/api/simulate`; therefore the application should be run through the Vite dev/preview server rather than opened as a static HTML file.

## Verify Python directly

```bash
python -m unittest discover -s python/tests -v
```

You can also test the runner through stdin/stdout:

```bash
python python/runner.py
```

Example request:

```json
{"algorithm":"FCFS","processes":[{"id":"P1","arrival":0,"burst":4},{"id":"P2","arrival":1,"burst":3},{"id":"P3","arrival":10,"burst":2}]}
```

Expected execution schedule:

```text
P1    0 → 4
P2    4 → 7
IDLE  7 → 10
P3   10 → 12
```

## Quality checks

```bash
pnpm lint
pnpm build
python -m unittest discover -s python/tests -v
```

## Packaging

Electron is intentionally deferred. During development/presentation the Vite/Node process supplies the local Python bridge. Electron can be added later only if an installable desktop executable is required.
