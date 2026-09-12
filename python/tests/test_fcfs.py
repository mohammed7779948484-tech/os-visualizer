from __future__ import annotations

import unittest

from python.cpu.fcfs import fcfs


class FCFSTests(unittest.TestCase):
    def test_normal_sequence(self) -> None:
        result = fcfs([
            {"id": "P1", "arrival": 0, "burst": 4},
            {"id": "P2", "arrival": 1, "burst": 3},
            {"id": "P3", "arrival": 2, "burst": 2},
        ])

        self.assertEqual([item["finish"] for item in result["processes"]], [4, 7, 9])
        self.assertEqual([item["waiting"] for item in result["processes"]], [0, 3, 5])
        self.assertEqual(result["metrics"]["cpuIdleTime"], 0)
        self.assertNotIn("events", result)

    def test_same_arrival_preserves_input_order(self) -> None:
        result = fcfs([
            {"id": "P2", "arrival": 0, "burst": 2},
            {"id": "P1", "arrival": 0, "burst": 1},
        ])

        run_order = [segment["processId"] for segment in result["schedule"] if segment["kind"] == "run"]
        self.assertEqual(run_order, ["P2", "P1"])

    def test_cpu_idle_gap(self) -> None:
        result = fcfs([
            {"id": "P1", "arrival": 0, "burst": 4},
            {"id": "P2", "arrival": 1, "burst": 3},
            {"id": "P3", "arrival": 10, "burst": 2},
        ])

        self.assertEqual(result["schedule"], [
            {"kind": "run", "processId": "P1", "start": 0, "end": 4},
            {"kind": "run", "processId": "P2", "start": 4, "end": 7},
            {"kind": "idle", "processId": None, "start": 7, "end": 10},
            {"kind": "run", "processId": "P3", "start": 10, "end": 12},
        ])
        self.assertEqual(result["metrics"]["cpuIdleTime"], 3)
        self.assertEqual([item["finish"] for item in result["processes"]], [4, 7, 12])
        self.assertAlmostEqual(result["metrics"]["averageWaiting"], 1.0)
        self.assertAlmostEqual(result["metrics"]["averageTurnaround"], 4.0)

    def test_single_process_with_initial_idle_time(self) -> None:
        result = fcfs([{"id": "P1", "arrival": 3, "burst": 5}])

        self.assertEqual(result["processes"][0]["finish"], 8)
        self.assertEqual(result["processes"][0]["waiting"], 0)
        self.assertEqual(result["metrics"]["cpuIdleTime"], 3)
        self.assertEqual(result["schedule"][0], {"kind": "idle", "processId": None, "start": 0, "end": 3})

    def test_result_order_matches_input_order(self) -> None:
        result = fcfs([
            {"id": "late", "arrival": 5, "burst": 1},
            {"id": "early", "arrival": 0, "burst": 1},
        ])
        self.assertEqual([process["id"] for process in result["processes"]], ["late", "early"])
        self.assertEqual([segment["processId"] for segment in result["schedule"] if segment["kind"] == "run"], ["early", "late"])

    def test_negative_arrival_is_invalid(self) -> None:
        with self.assertRaises(ValueError):
            fcfs([{"id": "P1", "arrival": -1, "burst": 2}])

    def test_zero_or_negative_burst_is_invalid(self) -> None:
        for burst in (0, -2):
            with self.subTest(burst=burst), self.assertRaises(ValueError):
                fcfs([{"id": "P1", "arrival": 0, "burst": burst}])

    def test_duplicate_id_and_fractional_times_are_invalid(self) -> None:
        with self.assertRaises(ValueError):
            fcfs([
                {"id": "P1", "arrival": 0, "burst": 2},
                {"id": "P1", "arrival": 1, "burst": 1},
            ])
        with self.assertRaises(ValueError):
            fcfs([{"id": "P1", "arrival": 1.5, "burst": 1}])


if __name__ == "__main__":
    unittest.main()
