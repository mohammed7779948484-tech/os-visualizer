import json
import subprocess
import sys
import unittest
from pathlib import Path


RUNNER = Path(__file__).parents[1] / "runner.py"


def invoke_runner(raw_input):
    completed = subprocess.run(
        [sys.executable, str(RUNNER)],
        input=raw_input,
        capture_output=True,
        check=False,
        text=True,
    )
    return completed.returncode, json.loads(completed.stdout)


class RunnerTests(unittest.TestCase):
    def test_fcfs_success_contract_stays_compatible_with_frontend(self):
        code, response = invoke_runner(json.dumps({
            "algorithm": "FCFS",
            "processes": [
                {"id": "P1", "arrival": 0, "burst": 4},
                {"id": "P2", "arrival": 1, "burst": 3},
                {"id": "P3", "arrival": 10, "burst": 2},
            ],
        }))

        self.assertEqual(code, 0)
        self.assertTrue(response["ok"])
        result = response["result"]
        self.assertEqual(result["algorithm"], "FCFS")
        self.assertEqual(result["metrics"], {
            "averageWaiting": 1.0,
            "averageTurnaround": 4.0,
            "cpuIdleTime": 3,
            "totalTime": 12,
        })
        self.assertEqual(result["schedule"][2], {
            "kind": "idle",
            "processId": None,
            "start": 7,
            "end": 10,
        })
        self.assertNotIn("events", result)

    def test_result_rows_keep_frontend_input_order(self):
        code, response = invoke_runner(json.dumps({
            "algorithm": "FCFS",
            "processes": [
                {"id": "late", "arrival": 5, "burst": 1},
                {"id": "early", "arrival": 0, "burst": 1},
            ],
        }))
        self.assertEqual(code, 0)
        self.assertEqual([p["id"] for p in response["result"]["processes"]], ["late", "early"])
        self.assertEqual(
            [s["processId"] for s in response["result"]["schedule"] if s["kind"] == "run"],
            ["early", "late"],
        )

    def test_malformed_json_returns_structured_error(self):
        code, response = invoke_runner("{bad json")
        self.assertEqual(code, 1)
        self.assertFalse(response["ok"])
        self.assertEqual(response["error"]["code"], "INVALID_JSON")

    def test_unsupported_algorithm_returns_structured_error(self):
        code, response = invoke_runner(json.dumps({"algorithm": "SJF", "processes": []}))
        self.assertEqual(code, 1)
        self.assertFalse(response["ok"])
        self.assertEqual(response["error"]["code"], "UNSUPPORTED_ALGORITHM")

    def test_invalid_academic_input_returns_validation_error(self):
        invalid_cases = [
            [{"id": "P1", "arrival": -1, "burst": 2}],
            [{"id": "P1", "arrival": 0, "burst": 0}],
            [{"id": "P1", "arrival": 0, "burst": 2}, {"id": "P1", "arrival": 1, "burst": 1}],
            [{"id": "P1", "arrival": 1.5, "burst": 1}],
        ]
        for processes in invalid_cases:
            with self.subTest(processes=processes):
                code, response = invoke_runner(json.dumps({"algorithm": "FCFS", "processes": processes}))
                self.assertEqual(code, 1)
                self.assertEqual(response["error"]["code"], "VALIDATION_ERROR")


if __name__ == "__main__":
    unittest.main()
