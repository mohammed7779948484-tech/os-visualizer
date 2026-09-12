import json
import subprocess
import sys
import unittest
from pathlib import Path


RUNNER = Path(__file__).parents[1] / "runner.py"


def invoke_runner(payload):
    raw_input = payload if isinstance(payload, str) else json.dumps(payload)
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
        code, response = invoke_runner({
            "algorithm": "FCFS",
            "processes": [
                {"id": "P1", "arrival": 0, "burst": 4},
                {"id": "P2", "arrival": 1, "burst": 3},
                {"id": "P3", "arrival": 10, "burst": 2},
            ],
        })

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

    def test_all_cpu_algorithms_are_available(self):
        processes = [
            {"id": "P1", "arrival": 0, "burst": 7},
            {"id": "P2", "arrival": 2, "burst": 4},
            {"id": "P3", "arrival": 4, "burst": 1},
        ]

        for algorithm in ["SJF", "SRTF"]:
            with self.subTest(algorithm=algorithm):
                code, response = invoke_runner({"algorithm": algorithm, "processes": processes})
                self.assertEqual(code, 0)
                self.assertTrue(response["ok"])
                self.assertEqual(response["result"]["algorithm"], algorithm)

        code, response = invoke_runner({"algorithm": "RR", "quantum": 2, "processes": processes})
        self.assertEqual(code, 0)
        self.assertEqual(response["result"]["quantum"], 2)

    def test_rr_requires_positive_quantum(self):
        code, response = invoke_runner({
            "algorithm": "RR",
            "quantum": 0,
            "processes": [{"id": "P1", "arrival": 0, "burst": 1}],
        })
        self.assertEqual(code, 1)
        self.assertEqual(response["error"]["code"], "VALIDATION_ERROR")

    def test_memory_algorithms_are_available(self):
        request = {
            "module": "memory",
            "blocks": [100, 500, 200, 300, 600],
            "processes": [
                {"id": "P1", "size": 212},
                {"id": "P2", "size": 417},
                {"id": "P3", "size": 112},
                {"id": "P4", "size": 426},
            ],
        }

        expected_first_blocks = {
            "FIRST_FIT": ["B2", "B5", "B2", None],
            "BEST_FIT": ["B4", "B2", "B3", "B5"],
            "WORST_FIT": ["B5", "B2", "B5", None],
        }

        for algorithm, expected in expected_first_blocks.items():
            with self.subTest(algorithm=algorithm):
                code, response = invoke_runner({**request, "algorithm": algorithm})
                self.assertEqual(code, 0)
                self.assertTrue(response["ok"])
                self.assertEqual([row["block"] for row in response["result"]["allocations"]], expected)

    def test_result_rows_keep_frontend_input_order(self):
        code, response = invoke_runner({
            "algorithm": "SJF",
            "processes": [
                {"id": "late", "arrival": 5, "burst": 1},
                {"id": "early", "arrival": 0, "burst": 1},
            ],
        })
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
        code, response = invoke_runner({"algorithm": "PRIORITY", "processes": []})
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
                code, response = invoke_runner({"algorithm": "FCFS", "processes": processes})
                self.assertEqual(code, 1)
                self.assertEqual(response["error"]["code"], "VALIDATION_ERROR")


if __name__ == "__main__":
    unittest.main()
