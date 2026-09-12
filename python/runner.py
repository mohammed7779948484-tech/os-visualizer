"""JSON adapter between the frontend contract and the academic Python algorithms."""

import json
import sys

from cpu.fcfs import FCFS


def prepare_processes(processes):
    if not isinstance(processes, list) or not processes:
        raise ValueError("At least one process is required.")

    seen_ids = set()
    prepared = []

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
        prepared.append({"P": process_id, "AT": arrival, "BT": burst})

    return prepared


def format_fcfs_result(academic_result, original_processes):
    result_by_id = {
        item["P"]: item
        for item in academic_result["processes"]
    }

    processes = []
    for original in original_processes:
        item = result_by_id[original["id"]]
        processes.append({
            "id": item["P"],
            "arrival": item["AT"],
            "burst": item["BT"],
            "finish": item["FT"],
            "turnaround": item["TAT"],
            "waiting": item["WT"],
        })

    schedule = []
    for segment in academic_result["schedule"]:
        schedule.append({
            "kind": "idle" if segment["P"] is None else "run",
            "processId": segment["P"],
            "start": segment["start"],
            "end": segment["end"],
        })

    return {
        "algorithm": "FCFS",
        "processes": processes,
        "metrics": {
            "averageWaiting": academic_result["average_WT"],
            "averageTurnaround": academic_result["average_TAT"],
            "cpuIdleTime": academic_result["idle_time"],
            "totalTime": academic_result["total_time"],
        },
        "schedule": schedule,
    }


def run_request(request):
    if not isinstance(request, dict):
        return {
            "ok": False,
            "error": {"code": "INVALID_REQUEST", "message": "The request must be a JSON object."},
        }

    algorithm = request.get("algorithm")
    if algorithm != "FCFS":
        return {
            "ok": False,
            "error": {
                "code": "UNSUPPORTED_ALGORITHM",
                "message": f"Algorithm {algorithm!r} is not implemented in Python yet.",
            },
        }

    try:
        original_processes = request.get("processes")
        academic_processes = prepare_processes(original_processes)
        academic_result = FCFS(academic_processes)
        result = format_fcfs_result(academic_result, original_processes)
    except (KeyError, TypeError, ValueError) as error:
        return {
            "ok": False,
            "error": {"code": "VALIDATION_ERROR", "message": str(error)},
        }

    return {"ok": True, "result": result}


def main():
    try:
        request = json.loads(sys.stdin.read())
    except json.JSONDecodeError as error:
        response = {
            "ok": False,
            "error": {
                "code": "INVALID_JSON",
                "message": f"Malformed JSON at line {error.lineno}, column {error.colno}.",
            },
        }
        print(json.dumps(response, ensure_ascii=False))
        return 1

    response = run_request(request)
    print(json.dumps(response, ensure_ascii=False, separators=(",", ":")))
    return 0 if response["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
