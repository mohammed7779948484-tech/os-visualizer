"""JSON stdin/stdout adapter for the simulator's Python algorithms."""

from __future__ import annotations

import json
import sys
from typing import Any

from cpu.fcfs import FCFSValidationError, schedule_fcfs


def run_request(request: Any) -> dict[str, Any]:
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
        result = schedule_fcfs(request.get("processes"))
    except FCFSValidationError as error:
        return {
            "ok": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": str(error),
                "details": error.details,
            },
        }

    return {"ok": True, "result": result}


def main() -> int:
    raw_input = sys.stdin.read()
    try:
        request = json.loads(raw_input)
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
