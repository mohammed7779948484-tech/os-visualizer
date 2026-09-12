"""First-Come, First-Served CPU scheduling.

FCFS is non-preemptive: once a process receives the CPU, it runs until its
burst finishes. Processes with equal arrival times retain their input order.
"""

from __future__ import annotations

from typing import Any


MAX_PROCESSES = 100
MAX_PROCESS_ID_LENGTH = 64


class FCFSValidationError(ValueError):
    """Raised when a process workload does not satisfy the FCFS input rules."""

    def __init__(self, message: str, details: list[dict[str, str]]) -> None:
        super().__init__(message)
        self.details = details


def _validate_processes(processes: Any) -> list[dict[str, int | str]]:
    if not isinstance(processes, list) or not processes:
        raise FCFSValidationError(
            "At least one process is required.",
            [{"path": "processes", "message": "Expected a non-empty array."}],
        )
    if len(processes) > MAX_PROCESSES:
        raise FCFSValidationError(
            "The process workload is too large.",
            [{"path": "processes", "message": f"At most {MAX_PROCESSES} processes are allowed."}],
        )

    validated: list[dict[str, int | str]] = []
    details: list[dict[str, str]] = []
    seen_ids: set[str] = set()

    for index, process in enumerate(processes):
        path = f"processes[{index}]"
        if not isinstance(process, dict):
            details.append({"path": path, "message": "Expected an object."})
            continue

        process_id = process.get("id")
        arrival = process.get("arrival")
        burst = process.get("burst")

        if not isinstance(process_id, str) or not process_id.strip():
            details.append({"path": f"{path}.id", "message": "Process ID must be a non-empty string."})
        elif len(process_id) > MAX_PROCESS_ID_LENGTH:
            details.append({"path": f"{path}.id", "message": f"Process ID must not exceed {MAX_PROCESS_ID_LENGTH} characters."})
        elif process_id in seen_ids:
            details.append({"path": f"{path}.id", "message": f"Duplicate process ID: {process_id}."})
        else:
            seen_ids.add(process_id)

        if isinstance(arrival, bool) or not isinstance(arrival, int) or arrival < 0:
            details.append({"path": f"{path}.arrival", "message": "Arrival time must be an integer greater than or equal to 0."})

        if isinstance(burst, bool) or not isinstance(burst, int) or burst <= 0:
            details.append({"path": f"{path}.burst", "message": "Burst time must be an integer greater than 0."})

        if (
            isinstance(process_id, str)
            and process_id.strip()
            and len(process_id) <= MAX_PROCESS_ID_LENGTH
            and isinstance(arrival, int)
            and not isinstance(arrival, bool)
            and arrival >= 0
            and isinstance(burst, int)
            and not isinstance(burst, bool)
            and burst > 0
        ):
            validated.append({"id": process_id, "arrival": arrival, "burst": burst})

    if details:
        raise FCFSValidationError("The process workload is invalid.", details)

    return validated


def schedule_fcfs(processes: list[dict[str, Any]]) -> dict[str, Any]:
    """Calculate an FCFS schedule and return deterministic playback facts."""

    workload = _validate_processes(processes)
    ordered = sorted(enumerate(workload), key=lambda item: (item[1]["arrival"], item[0]))
    pending = [process for _, process in ordered]

    current_time = 0
    total_idle_time = 0
    ready_queue: list[dict[str, int | str]] = []
    completed_ids: list[str] = []
    results_by_id: dict[str, dict[str, int | str]] = {}
    timeline: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    pending_index = 0

    def state(
        time: int,
        cpu: dict[str, int | str] | None = None,
        run_start: int | None = None,
        run_end: int | None = None,
    ) -> dict[str, Any]:
        running = None
        if cpu is not None and run_start is not None and run_end is not None:
            running = {
                "processId": cpu["id"],
                "executed": time - run_start,
                "remaining": run_end - time,
                "burst": cpu["burst"],
            }
        return {
            "cpu": cpu["id"] if cpu is not None else None,
            "readyQueue": [process["id"] for process in ready_queue],
            "completed": list(completed_ids),
            "running": running,
        }

    def add_event(event_type: str, time: int, *, event_state: dict[str, Any], **facts: Any) -> None:
        events.append(
            {
                "sequence": len(events),
                "type": event_type,
                "time": time,
                **facts,
                "state": event_state,
            }
        )

    add_event("simulation_start", 0, event_state=state(0))

    while len(completed_ids) < len(workload):
        while pending_index < len(pending) and pending[pending_index]["arrival"] <= current_time:
            arriving = pending[pending_index]
            ready_queue.append(arriving)
            add_event(
                "arrival",
                int(arriving["arrival"]),
                event_state=state(int(arriving["arrival"])),
                processId=arriving["id"],
                burst=arriving["burst"],
            )
            pending_index += 1

        if not ready_queue:
            next_arrival = int(pending[pending_index]["arrival"])
            if next_arrival > current_time:
                timeline.append({"kind": "idle", "processId": None, "start": current_time, "end": next_arrival})
                total_idle_time += next_arrival - current_time
                add_event(
                    "idle_start",
                    current_time,
                    event_state=state(current_time),
                    until=next_arrival,
                )
                current_time = next_arrival

            while pending_index < len(pending) and pending[pending_index]["arrival"] <= current_time:
                arriving = pending[pending_index]
                ready_queue.append(arriving)
                add_event(
                    "arrival",
                    current_time,
                    event_state=state(current_time),
                    processId=arriving["id"],
                    burst=arriving["burst"],
                )
                pending_index += 1

            add_event("idle_end", current_time, event_state=state(current_time))

        running = ready_queue.pop(0)
        start = current_time
        finish = start + int(running["burst"])
        timeline.append({"kind": "run", "processId": running["id"], "start": start, "end": finish})
        add_event(
            "dispatch",
            start,
            event_state=state(start, running, start, finish),
            processId=running["id"],
            reason="arrival_order",
        )

        # Arrivals during a non-preemptive burst join READY without changing CPU ownership.
        while pending_index < len(pending) and pending[pending_index]["arrival"] < finish:
            arriving = pending[pending_index]
            arrival_time = int(arriving["arrival"])
            ready_queue.append(arriving)
            add_event(
                "arrival",
                arrival_time,
                event_state=state(arrival_time, running, start, finish),
                processId=arriving["id"],
                burst=arriving["burst"],
            )
            pending_index += 1

        current_time = finish
        turnaround = finish - int(running["arrival"])
        waiting = turnaround - int(running["burst"])
        process_id = str(running["id"])
        add_event(
            "execute",
            finish,
            event_state=state(finish, running, start, finish),
            processId=process_id,
            executed=running["burst"],
            remaining=0,
        )
        results_by_id[process_id] = {
            "id": process_id,
            "arrival": int(running["arrival"]),
            "burst": int(running["burst"]),
            "finish": finish,
            "turnaround": turnaround,
            "waiting": waiting,
        }
        completed_ids.append(process_id)
        add_event(
            "complete",
            finish,
            event_state=state(finish),
            processId=process_id,
            finish=finish,
            turnaround=turnaround,
            waiting=waiting,
        )

    results = [results_by_id[str(process["id"])] for process in workload]
    average_waiting = sum(int(process["waiting"]) for process in results) / len(results)
    average_turnaround = sum(int(process["turnaround"]) for process in results) / len(results)
    add_event(
        "simulation_complete",
        current_time,
        event_state=state(current_time),
        processCount=len(results),
    )

    return {
        "algorithm": "FCFS",
        "processes": results,
        "metrics": {
            "averageWaiting": average_waiting,
            "averageTurnaround": average_turnaround,
            "cpuIdleTime": total_idle_time,
            "totalTime": current_time,
        },
        "timeline": timeline,
        "events": events,
    }
