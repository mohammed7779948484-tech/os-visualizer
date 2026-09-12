"""First-Come, First-Served (FCFS) CPU scheduling.

FCFS is non-preemptive: once a process receives the CPU, it runs until its
burst finishes. Equal arrival times preserve the original input order.
"""

from __future__ import annotations

from typing import Any


def _check_processes(processes: list[dict[str, Any]]) -> None:
    """Check the academic input constraints expected by FCFS."""

    if not isinstance(processes, list) or not processes:
        raise ValueError("At least one process is required.")

    seen_ids: set[str] = set()
    for process in processes:
        if not isinstance(process, dict):
            raise ValueError("Each process must be an object.")

        process_id = process.get("id")
        arrival = process.get("arrival")
        burst = process.get("burst")

        if not isinstance(process_id, str) or not process_id.strip():
            raise ValueError("Process ID must be a non-empty string.")
        if process_id in seen_ids:
            raise ValueError(f"Duplicate process ID: {process_id}.")
        if isinstance(arrival, bool) or not isinstance(arrival, int) or arrival < 0:
            raise ValueError("Arrival time must be an integer greater than or equal to 0.")
        if isinstance(burst, bool) or not isinstance(burst, int) or burst <= 0:
            raise ValueError("Burst time must be an integer greater than 0.")

        seen_ids.add(process_id)


def fcfs(processes: list[dict[str, Any]]) -> dict[str, Any]:
    """Schedule processes using non-preemptive First-Come, First-Served.

    Processes are ordered by arrival time. If two processes arrive at the same
    time, their original input order is preserved.
    """

    _check_processes(processes)

    ordered = sorted(
        enumerate(processes),
        key=lambda item: (item[1]["arrival"], item[0]),
    )

    current_time = 0
    total_idle_time = 0
    schedule: list[dict[str, Any]] = []
    results_by_index: dict[int, dict[str, Any]] = {}

    for input_index, process in ordered:
        process_id = process["id"]
        arrival = process["arrival"]
        burst = process["burst"]

        if current_time < arrival:
            schedule.append(
                {
                    "kind": "idle",
                    "processId": None,
                    "start": current_time,
                    "end": arrival,
                }
            )
            total_idle_time += arrival - current_time
            current_time = arrival

        start = current_time
        finish = start + burst
        turnaround = finish - arrival
        waiting = turnaround - burst

        schedule.append(
            {
                "kind": "run",
                "processId": process_id,
                "start": start,
                "end": finish,
            }
        )
        results_by_index[input_index] = {
            "id": process_id,
            "arrival": arrival,
            "burst": burst,
            "finish": finish,
            "turnaround": turnaround,
            "waiting": waiting,
        }

        current_time = finish

    results = [results_by_index[index] for index in range(len(processes))]

    return {
        "algorithm": "FCFS",
        "processes": results,
        "metrics": {
            "averageWaiting": sum(process["waiting"] for process in results) / len(results),
            "averageTurnaround": sum(process["turnaround"] for process in results) / len(results),
            "cpuIdleTime": total_idle_time,
            "totalTime": current_time,
        },
        "schedule": schedule,
    }
