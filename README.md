# OS Visualizer — Kernel Trace

Arabic-first interactive visualizer for Operating Systems algorithms.

The project deliberately separates the academic algorithms from the presentation layer:

```text
Python algorithm → JSON result → local Vite/Node bridge → React visualization
```

## Python algorithm layer

Implemented and tested:

### CPU Scheduling
- **FCFS** — `python/cpu/fcfs.py`
- **SJF (Non-Preemptive)** — `python/cpu/sjf.py`
- **SRTF (Preemptive SJF)** — `python/cpu/srtf.py`
- **Round Robin** — `python/cpu/round_robin.py`

All CPU algorithms return the same academic result shape: per-process AT / BT / FT / TAT / WT, Average WT, Average TAT, CPU idle time, total time, and the execution schedule. RR additionally uses a positive Time Quantum.

### Memory Allocation
- **First Fit** — `python/memory/first_fit.py`
- **Best Fit** — `python/memory/best_fit.py`
- **Worst Fit** — `python/memory/worst_fit.py`

The memory algorithms follow the reference implementation used for this course: after an allocation, the remaining space in a block can be reused by later processes.

### Dispatchers
- `python/cpu/engine.py` selects a CPU algorithm.
- `python/memory/engine.py` selects a memory-allocation algorithm.
- `python/runner.py` validates JSON input, converts the frontend contract to course notation, invokes the selected algorithm, and serializes the direct result.

Algorithm logic does **not** live in `runner.py`, TypeScript, or the Vite bridge.

## Frontend integration status

Currently integrated end-to-end in the React visualizer:
- **FCFS** CPU Scheduling in Python.
- AT / BT / FT / TAT / WT.
- Average WT and Average TAT.
- CPU idle-time calculation and idle schedule segments.
- Arabic RTL visualization with Ready Queue, CPU state, Gantt schedule, metrics, results, event log, and playback controls.

The Python layer already contains SJF, SRTF, RR, First Fit, Best Fit, and Worst Fit. Their dedicated frontend visual playback is intentionally deferred to the next UI integration passes. The existing SRTF screen is still a clearly-labelled prerecorded teaching scene until it is switched to the real SRTF result contract.

## Architecture boundary

### Python

`python/cpu/*.py` and `python/memory/*.py` contain only the academic algorithms and their direct computational outputs.

Python does **not** produce UI animation frames, localized UI copy, React state, or Motion/GSAP instructions.

### Frontend

React/TypeScript receives scheduling/allocation facts already decided by Python and may derive presentation-only playback state from them. The frontend may visualize a decision but must not make the algorithmic decision itself.

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

### CPU request example

```bash
python python/runner.py
```

```json
{"algorithm":"SRTF","processes":[{"id":"P1","arrival":0,"burst":7},{"id":"P2","arrival":2,"burst":4},{"id":"P3","arrival":4,"burst":1}]}
```

For Round Robin add a positive quantum:

```json
{"algorithm":"RR","quantum":2,"processes":[{"id":"P1","arrival":0,"burst":7},{"id":"P2","arrival":2,"burst":4}]}
```

### Memory request example

```json
{"module":"memory","algorithm":"BEST_FIT","blocks":[100,500,200,300,600],"processes":[{"id":"P1","size":212},{"id":"P2","size":417}]}
```

Accepted memory algorithm names are `FIRST_FIT`, `BEST_FIT`, and `WORST_FIT`; spaces such as `Best Fit` are normalized by the runner.

## Quality checks

```bash
pnpm lint
pnpm build
python -m unittest discover -s python/tests -v
```

## Packaging

Electron is intentionally deferred. During development/presentation the Vite/Node process supplies the local Python bridge. Electron can be added later only if an installable desktop executable is required.
