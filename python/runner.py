"""Small JSON stdin/stdout adapter for the simulator's Python algorithms."""

from __future__ import annotations

import json
import sys
from typing import Any

from cpu.fcfs import fcfs


def run_request(request: Any) -> dict[str, Any]:
    """Dispatch one transport request without adding scheduling logic."""

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
        result = fcfs(request.get("processes"))
    except (KeyError, TypeError, ValueError) as error:
        return {
            "ok": False,
            "error": {"code": "VALIDATION_ERROR", "message": str(error)},
        }

    return {"ok": True, "result": result}


def main() -> int:
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
