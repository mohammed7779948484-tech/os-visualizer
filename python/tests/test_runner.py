from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path


RUNNER = Path(__file__).parents[1] / "runner.py"


def invoke_runner(raw_input: str) -> tuple[int, dict[str, object]]:
    completed = subprocess.run(
        [sys.executable, str(RUNNER)],
        input=raw_input,
        capture_output=True,
        check=False,
        text=True,
    )
    return completed.returncode, json.loads(completed.stdout)


class RunnerTests(unittest.TestCase):
    def test_fcfs_success_contract(self) -> None:
        code, response = invoke_runner(json.dumps({
            "algorithm": "FCFS",
            "processes": [{"id": "P1", "arrival": 0, "burst": 2}],
        }))

        self.assertEqual(code, 0)
        self.assertTrue(response["ok"])
        result = response["result"]
        self.assertEqual(result["algorithm"], "FCFS")
        self.assertEqual(result["timeline"][0], {"kind": "run", "processId": "P1", "start": 0, "end": 2})

    def test_malformed_json_returns_structured_error(self) -> None:
        code, response = invoke_runner("{bad json")

        self.assertEqual(code, 1)
        self.assertFalse(response["ok"])
        self.assertEqual(response["error"]["code"], "INVALID_JSON")

    def test_unsupported_algorithm_returns_structured_error(self) -> None:
        code, response = invoke_runner(json.dumps({"algorithm": "SJF", "processes": []}))

        self.assertEqual(code, 1)
        self.assertFalse(response["ok"])
        self.assertEqual(response["error"]["code"], "UNSUPPORTED_ALGORITHM")

    def test_validation_error_includes_field_details(self) -> None:
        code, response = invoke_runner(json.dumps({
            "algorithm": "FCFS",
            "processes": [{"id": "P1", "arrival": -1, "burst": 0}],
        }))

        self.assertEqual(code, 1)
        self.assertEqual(response["error"]["code"], "VALIDATION_ERROR")
        paths = {detail["path"] for detail in response["error"]["details"]}
        self.assertEqual(paths, {"processes[0].arrival", "processes[0].burst"})


if __name__ == "__main__":
    unittest.main()
