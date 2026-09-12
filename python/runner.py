"""JSON adapter between the frontend contract and the academic Python algorithms."""

import json
import sys

from cpu.engine import CPUEngine
from memory.engine import MemoryEngine


def prepare_cpu_processes(processes):
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


def prepare_quantum(algorithm, quantum):
    if algorithm != "RR":
        return None

    if isinstance(quantum, bool) or not isinstance(quantum, int) or quantum <= 0:
        raise ValueError("Time quantum must be an integer greater than 0.")

    return quantum


def prepare_memory_blocks(blocks):
    if not isinstance(blocks, list) or not blocks:
        raise ValueError("At least one memory block is required.")

    prepared = []
    for block in blocks:
        if isinstance(block, bool) or not isinstance(block, int) or block <= 0:
            raise ValueError("Memory block sizes must be integers greater than 0.")
        prepared.append(block)

    return prepared


def prepare_memory_processes(processes):
    if not isinstance(processes, list) or not processes:
        raise ValueError("At least one memory process is required.")

    seen_ids = set()
    prepared = []

    for process in processes:
        if not isinstance(process, dict):
            raise ValueError("Each memory process must be an object.")

        process_id = process.get("id")
        size = process.get("size")

        if not isinstance(process_id, str) or not process_id.strip():
            raise ValueError("Process ID must be a non-empty string.")
        if process_id in seen_ids:
            raise ValueError(f"Duplicate process ID: {process_id}.")
        if isinstance(size, bool) or not isinstance(size, int) or size <= 0:
            raise ValueError("Process size must be an integer greater than 0.")

        seen_ids.add(process_id)
        prepared.append({"id": process_id, "size": size})

    return prepared


def format_cpu_result(algorithm, academic_result, original_processes):
    result_by_id = {item["P"]: item for item in academic_result["processes"]}

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

    result = {
        "algorithm": algorithm,
        "processes": processes,
        "metrics": {
            "averageWaiting": academic_result["average_WT"],
            "averageTurnaround": academic_result["average_TAT"],
            "cpuIdleTime": academic_result["idle_time"],
            "totalTime": academic_result["total_time"],
        },
        "schedule": schedule,
    }

    if algorithm == "RR":
        result["quantum"] = academic_result["quantum"]

    return result


def normalize_memory_algorithm(algorithm):
    if not isinstance(algorithm, str):
        return algorithm
    return algorithm.strip().replace("-", "_").replace(" ", "_").upper()


def format_memory_result(algorithm, academic_result):
    allocations = []
    for item in academic_result["allocations"]:
        allocations.append({
            "id": item["pid"],
            "size": item["process_size"],
            "block": None if item["block"] == "-" else item["block"],
            "blockSize": None if item["block_size"] == "-" else item["block_size"],
            "remaining": None if item["free_space"] == "-" else item["free_space"],
            "status": item["status"],
        })

    return {
        "module": "memory",
        "algorithm": algorithm,
        "allocations": allocations,
        "remainingBlocks": academic_result["remaining_blocks"],
    }


def run_cpu_request(request):
    algorithm = request.get("algorithm")
    if isinstance(algorithm, str):
        algorithm = algorithm.strip().upper()

    if algorithm not in CPUEngine.ALGORITHMS:
        return {
            "ok": False,
            "error": {
                "code": "UNSUPPORTED_ALGORITHM",
                "message": f"CPU algorithm {algorithm!r} is not implemented.",
            },
        }

    try:
        original_processes = request.get("processes")
        academic_processes = prepare_cpu_processes(original_processes)
        quantum = prepare_quantum(algorithm, request.get("quantum"))
        academic_result = CPUEngine.run(algorithm, academic_processes, quantum)
        result = format_cpu_result(algorithm, academic_result, original_processes)
    except (KeyError, TypeError, ValueError) as error:
        return {
            "ok": False,
            "error": {"code": "VALIDATION_ERROR", "message": str(error)},
        }

    return {"ok": True, "result": result}


def run_memory_request(request):
    algorithm = normalize_memory_algorithm(request.get("algorithm"))

    if algorithm not in MemoryEngine.ALGORITHMS:
        return {
            "ok": False,
            "error": {
                "code": "UNSUPPORTED_ALGORITHM",
                "message": f"Memory algorithm {algorithm!r} is not implemented.",
            },
        }

    try:
        blocks = prepare_memory_blocks(request.get("blocks"))
        processes = prepare_memory_processes(request.get("processes"))
        academic_result = MemoryEngine.run(algorithm, blocks, processes)
        result = format_memory_result(algorithm, academic_result)
    except (KeyError, TypeError, ValueError) as error:
        return {
            "ok": False,
            "error": {"code": "VALIDATION_ERROR", "message": str(error)},
        }

    return {"ok": True, "result": result}


def run_request(request):
    if not isinstance(request, dict):
        return {
            "ok": False,
            "error": {"code": "INVALID_REQUEST", "message": "The request must be a JSON object."},
        }

    module = request.get("module", "cpu")
    if isinstance(module, str):
        module = module.strip().lower()

    if module == "cpu":
        return run_cpu_request(request)
    if module == "memory":
        return run_memory_request(request)

    return {
        "ok": False,
        "error": {"code": "UNSUPPORTED_MODULE", "message": f"Module {module!r} is not supported."},
    }


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
